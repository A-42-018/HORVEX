import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "../../../components/common";
import { strings } from "../../strings";
import { CONTENT_BUCKET } from "../../../services/adminHomeContent";
import { useImageUpload } from "../../hooks/useImageUpload";

const t = strings.admin.homeContent.common;
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const SHAPES = { wide: "aspect-video w-32", tall: "aspect-[4/5] w-24", square: "aspect-square w-24" };

/** Picks, previews and removes one image. The file uploads at once; the URL is saved with the form. */
export default function MediaImageField({ id, label, hint, alt, shape = "wide", folder, maxDimension, value, error, onChange }) {
  const upload = useImageUpload({ bucket: CONTENT_BUCKET, folder, maxDimension });
  const inputRef = useRef(null);
  const [problem, setProblem] = useState("");

  const pick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setProblem("");
    if (!file.type.startsWith("image/")) return setProblem(t.messages.notImage);
    try {
      const { url } = await upload.mutateAsync(file);
      onChange(url);
    } catch (failure) {
      setProblem(failure?.code === "42501" ? t.messages.forbidden : t.messages.uploadFailed);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <span id={`${id}-label`} className="text-small text-fg">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-4">
        <div className={`${SHAPES[shape]} shrink-0 overflow-hidden rounded-card border border-line bg-surface`}>
          {value ? (
            <img src={value} alt={alt} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center px-2 text-center text-small text-muted">{t.noImage}</span>
          )}
        </div>
        <div className="flex flex-col items-start gap-2">
          <input ref={inputRef} type="file" accept={ACCEPT} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={pick} />
          <Button
            id={id}
            variant="secondary"
            size="sm"
            className="gap-2"
            aria-describedby={`${id}-label`}
            loading={upload.isPending}
            onClick={() => inputRef.current?.click()}
          >
            {!upload.isPending && <ImagePlus aria-hidden="true" size={16} strokeWidth={1.5} />}
            {upload.isPending ? t.image.uploading : value ? t.image.replace : t.image.choose}
          </Button>
          {value && (
            <Button variant="ghost" size="sm" className="gap-2" disabled={upload.isPending} onClick={() => onChange("")}>
              <Trash2 aria-hidden="true" size={16} strokeWidth={1.5} />
              {t.image.remove}
            </Button>
          )}
        </div>
      </div>
      {hint && <p className="text-small text-muted">{hint}</p>}
      {(error || problem) && (
        <p role="alert" className="text-small text-danger">
          {error || problem}
        </p>
      )}
    </div>
  );
}
