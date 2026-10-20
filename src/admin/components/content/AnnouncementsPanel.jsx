import { useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus } from "lucide-react";
import { Button, Card, IconButton, Skeleton } from "../../../components/common";
import { strings } from "../../../lib/strings";
import { useAnnouncementRows, useSaveAnnouncements } from "../../hooks/useContentAdmin";
import { RemoveControl } from "../homepage/ContentRows";
import AnnouncementModal from "./AnnouncementModal";
import { MAX_MESSAGES, moveMessage, removeMessage, shownCount, upsertMessage } from "./announcements";

const t = strings.admin.content.announcements;
const common = strings.admin.homeContent.common;

const failureFor = (error) =>
  error?.code === "42501" || error?.code === "PGRST116" ? t.messages.forbidden : t.messages.saveFailed;

/**
 * Announcement-bar messages. They live in site_settings; managers save them through
 * the `set_announcements` function. Every add / edit / delete / move saves the whole list.
 * The Content page is already manager+, so everyone who sees this can edit.
 */
export default function AnnouncementsPanel() {
  const canEdit = true;
  const { data: messages, isPending, isError, refetch } = useAnnouncementRows();
  const save = useSaveAnnouncements();
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, number = index
  const [modalKey, setModalKey] = useState(0);
  const [notice, setNotice] = useState("");
  const [failure, setFailure] = useState("");
  const [modalFailure, setModalFailure] = useState("");
  const atCap = messages ? messages.length >= MAX_MESSAGES : false;

  const open = (index) => {
    setModalKey((n) => n + 1);
    setModalFailure("");
    setEditing(index);
  };

  const commit = (next, change, { onSuccess, onError } = {}) => {
    setFailure("");
    setNotice("");
    save.mutate({ messages: next, change }, { onSuccess, onError });
  };

  const onMove = (index, delta) => {
    const next = moveMessage(messages, index, delta);
    if (next === messages) return;
    const label = messages[index].text;
    commit(next, "reorder", {
      onSuccess: () => setNotice(t.moved(label, index + delta + 1, messages.length)),
      onError: (error) => setFailure(error?.code === "42501" || error?.code === "PGRST116" ? t.messages.forbidden : t.messages.reorderFailed),
    });
  };

  const onRemove = (index) => {
    const label = messages[index].text;
    commit(removeMessage(messages, index), "delete", {
      onSuccess: () => setNotice(t.messages.removed(label)),
      onError: (error) => setFailure(failureFor(error)),
    });
  };

  const onSubmit = (message) => {
    setModalFailure("");
    const isNew = editing === null;
    save.mutate(
      { messages: upsertMessage(messages, isNew ? null : editing, message), change: isNew ? "create" : "update" },
      {
        onSuccess: () => {
          setEditing(undefined);
          setFailure("");
          setNotice(isNew ? t.messages.created(message.text) : t.messages.saved(message.text));
        },
        onError: (error) => setModalFailure(failureFor(error)),
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {messages ? <p className="text-small text-muted">{t.count(messages.length, shownCount(messages))}</p> : <span />}
        {canEdit && (
          <Button size="sm" className="gap-2" disabled={atCap || !messages} onClick={() => open(null)}>
            <Plus aria-hidden="true" size={16} strokeWidth={1.5} />
            {t.newItem}
          </Button>
        )}
      </div>
      <p className="max-w-prose text-small text-muted">{t.intro}</p>
      {canEdit && atCap && <p className="text-small text-muted">{t.capNote(MAX_MESSAGES)}</p>}

      <p role="status" className="sr-only">
        {notice}
      </p>
      {notice && (
        <p aria-hidden="true" className="text-small text-positive">
          {notice}
        </p>
      )}
      {failure && (
        <p role="alert" className="text-small text-danger">
          {failure}
        </p>
      )}

      {isPending && (
        <div aria-busy="true" aria-label={strings.admin.checking} className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      )}

      {isError && !messages && (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-small text-danger">{t.error}</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            {common.retry}
          </Button>
        </div>
      )}

      {messages &&
        (messages.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <p className="text-body text-fg">{t.empty.none}</p>
            <p className="text-small text-muted">{t.empty.noneHint}</p>
          </Card>
        ) : (
          <Card as="section" aria-label={t.title} className="overflow-hidden">
            <ol className="divide-y divide-line">
              {messages.map((message, index) => (
                <li key={`${index}-${message.text}`} className="flex flex-col gap-3 bg-raised p-4 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {canEdit && (
                      <div className="flex shrink-0 flex-col">
                        <IconButton label={t.moveUp(message.text)} variant="ghost" className="h-9 w-9" disabled={save.isPending || index === 0} onClick={() => onMove(index, -1)}>
                          <ArrowUp aria-hidden="true" size={18} strokeWidth={1.5} />
                        </IconButton>
                        <IconButton label={t.moveDown(message.text)} variant="ghost" className="h-9 w-9" disabled={save.isPending || index === messages.length - 1} onClick={() => onMove(index, 1)}>
                          <ArrowDown aria-hidden="true" size={18} strokeWidth={1.5} />
                        </IconButton>
                      </div>
                    )}
                    <span aria-hidden="true" className="w-6 shrink-0 text-center text-small tabular-nums text-muted">
                      {common.position(index + 1)}
                    </span>
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="line-clamp-2 text-body font-semibold text-fg">{message.text}</p>
                      <p className="truncate text-small text-muted">{message.link || t.noLink}</p>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <IconButton label={t.edit(message.text)} variant="ghost" onClick={() => open(index)}>
                        <Pencil aria-hidden="true" size={20} strokeWidth={1.5} />
                      </IconButton>
                      <RemoveControl copy={t} name={message.text} busy={save.isPending} onRemove={() => onRemove(index)} />
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </Card>
        ))}

      {canEdit && messages && (
        <AnnouncementModal
          key={modalKey}
          open={editing !== undefined}
          message={typeof editing === "number" ? messages[editing] : null}
          saving={save.isPending}
          failure={modalFailure}
          onClose={() => setEditing(undefined)}
          onSubmit={onSubmit}
        />
      )}
    </div>
  );
}
