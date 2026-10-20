import { useState } from "react";
import { Button, Input, Modal, Select } from "../../../components/common";
import { strings } from "../../../lib/strings";
import { useAddAdminUser } from "../../hooks/useUserAdmin";
import { MAX_NAME, ROLES, errorToken, isForbidden, readUserForm } from "./userRules";

const t = strings.admin.users;
const roleNames = strings.admin.roles;
const FIELD_ERRORS = ["invalid_email", "invalid_name", "invalid_role", "user_not_found", "already_admin"];

/** Grants a role to someone whose Supabase sign-in already exists. */
function AddUserModal({ onClose, onDone }) {
  const add = useAddAdminUser();
  const [form, setForm] = useState({ email: "", name: "", role: "staff" });
  const [errors, setErrors] = useState({});
  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    const { values, errors: found } = readUserForm(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    add.mutate(values, { onSuccess: () => { onDone(t.added(values.name)); onClose(); } });
  };

  const token = errorToken(add.error, FIELD_ERRORS);
  const failure = add.error && !token ? (isForbidden(add.error) ? t.forbidden : t.add.error) : null;
  const emailError = errors.email ? t.errors[errors.email] : token === "user_not_found" || token === "already_admin" ? t.errors[token] : undefined;
  const nameError = errors.name ? t.errors[errors.name] : token === "invalid_name" ? t.errors.invalid_name : undefined;

  return (
    <Modal
      open
      onClose={add.isPending ? () => {} : onClose}
      tone="ivory"
      size="sm"
      title={t.add.title}
      description={t.add.body}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={add.isPending}>
            {t.add.cancel}
          </Button>
          <Button size="sm" type="submit" form="add-user-form" loading={add.isPending}>
            {add.isPending ? t.add.saving : t.add.confirm}
          </Button>
        </>
      }
    >
      <form id="add-user-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Input label={t.add.email} type="email" autoComplete="off" value={form.email} onChange={set("email")} error={emailError} />
        <Input label={t.add.name} maxLength={MAX_NAME} value={form.name} onChange={set("name")} error={nameError} />
        <Select
          label={t.add.role}
          value={form.role}
          onChange={set("role")}
          options={ROLES.map((role) => ({ value: role, label: roleNames[role] }))}
          hint={t.roleHelp[form.role]}
        />
        {failure && (
          <p role="alert" className="text-small text-danger">
            {failure}
          </p>
        )}
      </form>
    </Modal>
  );
}

export default AddUserModal;
