import { useRef, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ImagePlus, Trash2 } from "lucide-react";
import { Button, IconButton, Skeleton } from "../../../components/common";
import { strings } from "../../../lib/strings";
import {
  useAddProductImage,
  useDeleteProductImage,
  useProductImages,
  useReorderProductImages,
  useUpdateProductImage,
} from "../../hooks/useProductImages";

const t = strings.admin.productEditor.images;
export const MAX_IMAGES = 12;
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

function messageFor(error) {
  return error?.code === "42501" || error?.code === "PGRST116" ? t.errors.forbidden : null;
}

function ImageTile({ image, index, total, onPatch, onRemove, busy }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  });
  const [alt, setAlt] = useState(image.alt ?? "");
  const [confirming, setConfirming] = useState(false);
  const altId = `pi-alt-${image.id}`;
  const lifeId = `pi-life-${image.id}`;
  const n = index + 1;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex flex-col gap-3 rounded-card border border-line bg-raised p-3 ${isDragging ? "relative z-10 opacity-80" : ""}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-surface">
        <img src={image.url} alt={image.alt || ""} loading="lazy" draggable={false} className="h-full w-full object-cover" />
        {index === 0 && (
          <span className="absolute left-2 top-2 rounded-pill bg-gold px-2 py-1 text-eyebrow text-obsidian">{t.main}</span>
        )}
        <IconButton
          ref={setActivatorNodeRef}
          label={t.dragHandle(n)}
          variant="outline"
          className="absolute right-2 top-2 touch-none cursor-grab bg-surface active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" size={20} strokeWidth={1.5} />
        </IconButton>
      </div>
      <p className="text-small text-muted">{t.position(n, total)}</p>

      <div className="flex flex-col gap-1">
        <label htmlFor={altId} className="text-small text-fg">
          {t.alt}
        </label>
        <input
          id={altId}
          value={alt}
          maxLength={160}
          onChange={(event) => setAlt(event.target.value)}
          onBlur={() => alt.trim() !== (image.alt ?? "") && onPatch(image.id, { alt: alt.trim() })}
          className="h-11 rounded-control border bg-surface px-3 text-small text-fg focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus"
        />
      </div>

      <label htmlFor={lifeId} className="flex min-h-11 cursor-pointer items-start gap-3 text-small text-fg">
        <input
          id={lifeId}
          type="checkbox"
          checked={image.is_lifestyle}
          disabled={busy}
          onChange={(event) => onPatch(image.id, { is_lifestyle: event.target.checked })}
          className="mt-0.5 h-5 w-5 shrink-0 accent-gold"
        />
        <span>
          {t.lifestyle}
          <span className="block text-muted">{t.lifestyleHint}</span>
        </span>
      </label>

      {confirming ? (
        <div role="alertdialog" aria-label={t.removeConfirm} className="flex flex-col gap-2">
          <p className="text-small text-danger">{t.removeConfirm}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="grow"
              disabled={busy}
              onClick={() => {
                setConfirming(false);
                onRemove(image);
              }}
            >
              {t.removeYes}
            </Button>
            <Button size="sm" variant="ghost" className="grow" onClick={() => setConfirming(false)}>
              {t.removeNo}
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="ghost" className="gap-2 self-start" disabled={busy} onClick={() => setConfirming(true)} aria-label={t.remove(n)}>
          <Trash2 aria-hidden="true" size={16} strokeWidth={1.5} />
          {t.removeYes}
        </Button>
      )}
    </li>
  );
}

/** Upload, reorder (drag or keyboard), alt text, lifestyle flag and delete for one saved product. */
export default function ProductImages({ productId }) {
  const imagesQuery = useProductImages(productId);
  const add = useAddProductImage(productId);
  const update = useUpdateProductImage();
  const remove = useDeleteProductImage();
  const reorder = useReorderProductImages(productId);
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(null); // { done, total, name }
  const [messages, setMessages] = useState([]);
  const [announce, setAnnounce] = useState("");

  const images = imagesQuery.data ?? [];
  const uploading = progress !== null;
  const busy = uploading || update.isPending || remove.isPending || reorder.isPending;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const upload = async (fileList) => {
    const files = [...fileList];
    if (!files.length) return;
    const problems = [];
    const room = MAX_IMAGES - images.length;
    const valid = files.filter((file) => {
      if (file.type.startsWith("image/")) return true;
      problems.push(t.errors.notImage(file.name));
      return false;
    });
    const queue = valid.slice(0, Math.max(room, 0));
    if (valid.length > queue.length) problems.push(t.errors.tooMany(MAX_IMAGES));

    let nextOrder = images.reduce((max, image) => Math.max(max, image.sort_order), -1) + 1;
    let added = 0;
    for (const [index, file] of queue.entries()) {
      setProgress({ done: index, total: queue.length, name: file.name });
      try {
        await add.mutateAsync({ file, sortOrder: nextOrder });
        nextOrder += 1;
        added += 1;
      } catch (error) {
        problems.push(messageFor(error) ?? t.errors.failed(file.name));
      }
    }
    setProgress(null);
    setMessages(problems);
    if (added) setAnnounce(t.uploaded(added));
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const from = images.findIndex((image) => image.id === active.id);
    const to = images.findIndex((image) => image.id === over.id);
    if (from < 0 || to < 0) return;
    setMessages([]);
    setAnnounce(t.moved(to + 1, images.length));
    reorder.mutate(arrayMove(images, from, to), { onError: () => setMessages([t.errors.reorderFailed]) });
  };

  const patch = (id, values) => {
    setMessages([]);
    update.mutate({ id, patch: values }, { onError: (error) => setMessages([messageFor(error) ?? t.errors.saveFailed]) });
  };

  const removeImage = (image) => {
    setMessages([]);
    remove.mutate(image, { onError: () => setMessages([t.errors.removeFailed]) });
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          if (!uploading) upload(event.dataTransfer.files);
        }}
        className={`flex flex-col items-center gap-3 rounded-card border border-dashed p-6 text-center ${dragOver ? "border-focus bg-fg/5" : "border-control"}`}
      >
        <ImagePlus aria-hidden="true" size={28} strokeWidth={1.5} className="text-muted" />
        <p className="max-w-prose text-small text-muted">{t.dropHint(MAX_IMAGES)}</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(event) => upload(event.target.files)}
          aria-label={t.choose}
        />
        <Button
          size="sm"
          variant="secondary"
          loading={uploading}
          disabled={images.length >= MAX_IMAGES}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? t.uploading(progress.name) : t.drop}
        </Button>
        {uploading && <p className="text-small text-muted">{t.queue(progress.done, progress.total)}</p>}
      </div>

      <div role="status" aria-live="polite" className="sr-only">
        {announce}
      </div>
      {messages.length > 0 && (
        <ul role="alert" className="flex flex-col gap-1 text-small text-danger">
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      {imagesQuery.isPending ? (
        <div aria-busy="true" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Skeleton className="aspect-[4/5]" />
          <Skeleton className="aspect-[4/5]" />
        </div>
      ) : imagesQuery.isError ? (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-small text-danger">{t.loadError}</p>
          <Button size="sm" variant="secondary" onClick={() => imagesQuery.refetch()}>
            {t.retry}
          </Button>
        </div>
      ) : images.length === 0 ? (
        <p className="text-small text-muted">{t.empty}</p>
      ) : (
        <>
          <p className="text-small text-muted">{t.order}</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={images.map((image) => image.id)} strategy={rectSortingStrategy}>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((image, index) => (
                  <ImageTile
                    key={image.id}
                    image={image}
                    index={index}
                    total={images.length}
                    busy={busy}
                    onPatch={patch}
                    onRemove={removeImage}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </>
      )}
    </div>
  );
}
