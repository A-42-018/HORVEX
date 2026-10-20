import { useState } from "react";
import { Badge, Button, Card, Modal, Select, Skeleton } from "../../components/common";
import { formatDateTime } from "../../lib/format";
import { strings } from "../../lib/strings";
import { useAuth } from "../auth/authContext";
import AddUserModal from "../components/users/AddUserModal";
import { ROLES, errorToken, isForbidden } from "../components/users/userRules";
import { useAdminUsers, useChangeAdminRole, useRemoveAdminUser } from "../hooks/useUserAdmin";

const t = strings.admin.users;
const roleNames = strings.admin.roles;

function UserRow({ user, isSelf, onNotice, onRemove }) {
  const change = useChangeAdminRole();
  const onRole = (event) => {
    const role = event.target.value;
    onNotice("");
    change.mutate({ userId: user.user_id, role }, { onSuccess: () => onNotice(t.changed(user.name, roleNames[role])) });
  };
  const known = errorToken(change.error, ["cannot_change_self", "invalid_role", "user_not_found"]);
  const failure = change.error ? (known ? t.errors[known] : isForbidden(change.error) ? t.forbidden : t.roleError) : null;

  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-body font-semibold text-fg">
          <span className="truncate">{user.name}</span>
          {isSelf && <Badge variant="neutral">{t.you}</Badge>}
        </p>
        <p className="truncate text-small text-muted">{user.email ?? "—"}</p>
        <p className="text-small text-muted">{user.last_sign_in_at ? t.lastSeen(formatDateTime(user.last_sign_in_at)) : t.never}</p>
        {failure && (
          <p role="alert" className="text-small text-danger">
            {failure}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          className="w-40"
          label={t.roleFor(user.name)}
          value={user.role}
          disabled={isSelf || change.isPending}
          onChange={onRole}
          options={ROLES.map((role) => ({ value: role, label: roleNames[role] }))}
        />
        {!isSelf && (
          <Button variant="ghost" size="sm" onClick={() => onRemove(user)} aria-label={t.remove.buttonFor(user.name)}>
            {t.remove.button}
          </Button>
        )}
      </div>
    </li>
  );
}

function RemoveModal({ user, onClose, onDone }) {
  const remove = useRemoveAdminUser();
  const failure = remove.error ? (isForbidden(remove.error) ? t.forbidden : t.remove.error) : null;
  return (
    <Modal
      open
      onClose={remove.isPending ? () => {} : onClose}
      tone="ivory"
      size="sm"
      title={t.remove.title}
      description={t.remove.body(user.name)}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={remove.isPending}>
            {t.remove.cancel}
          </Button>
          <Button
            size="sm"
            loading={remove.isPending}
            onClick={() => remove.mutate(user.user_id, { onSuccess: () => { onDone(t.removed(user.name)); onClose(); } })}
          >
            {remove.isPending ? t.remove.saving : t.remove.confirm}
          </Button>
        </>
      }
    >
      {failure && (
        <p role="alert" className="text-small text-danger">
          {failure}
        </p>
      )}
    </Modal>
  );
}

function Users() {
  const { session } = useAuth();
  const selfId = session?.user?.id;
  const { data, isPending, isError, refetch } = useAdminUsers();
  const [dialog, setDialog] = useState(null); // "add" | { remove: user }
  const [notice, setNotice] = useState("");

  return (
    <div className="flex flex-col gap-6">
      <title>{`${t.title} | HORVEX Admin`}</title>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h3 text-fg">{t.title}</h1>
          <p className="text-small text-muted">{data ? t.count(data.length) : t.intro}</p>
        </div>
        <Button size="sm" onClick={() => setDialog("add")}>
          {t.add.button}
        </Button>
      </div>
      {data && <p className="-mt-3 max-w-prose text-small text-muted">{t.intro}</p>}

      <p role="status" className="min-h-5 text-small text-muted">
        {notice}
      </p>

      {isPending && (
        <div aria-busy="true" aria-label={strings.admin.checking} className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      )}

      {isError && !data && (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-small text-danger">{t.error}</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            {t.retry}
          </Button>
        </div>
      )}

      {data && (
        <Card as="section" aria-label={t.title} className="overflow-hidden">
          <ul className="divide-y divide-line">
            {data.map((user) => (
              <UserRow
                key={user.user_id}
                user={user}
                isSelf={user.user_id === selfId}
                onNotice={setNotice}
                onRemove={(u) => setDialog({ remove: u })}
              />
            ))}
          </ul>
        </Card>
      )}

      {dialog === "add" && <AddUserModal onClose={() => setDialog(null)} onDone={setNotice} />}
      {dialog?.remove && <RemoveModal user={dialog.remove} onClose={() => setDialog(null)} onDone={setNotice} />}
    </div>
  );
}

export default Users;
