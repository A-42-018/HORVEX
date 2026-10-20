import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "../../../components/common";
import { strings } from "../../strings";
import { COLLECTION_BUCKET, COLLECTION_FOLDER } from "../../../services/adminCollections";
import { useImageUpload } from "../../hooks/useImageUpload";

const t = strings.admin.collections;
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

/** Picks, previews and removes the banner. The file uploads at once; the URL is saved with the form. */
export default function CollectionBannerField({ value, onChange }) {
  const upload = useImageUpload({ bucket: COLLECTION_BUCKET, folder: COLLECTION_FOLDER, maxDimension: 1600 });
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
    } catch (error) {
      setProblem(error?.code === "42501" ? t.messages.forbidden : t.messages.uploadFailed);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="text-small text-fg">{t.banner.label}</span>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="aspect-video w-full max-w-56 shrink-0 overflow-hidden rounded-card border border-line bg-surface">
          {value ? (
            <img src={value} alt={t.banner.alt} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center px-2 text-center text-small text-muted">{t.noImage}</span>
          )}
        </div>
        <div className="flex flex-col items-start gap-2">
          <input ref={inputRef} type="file" accept={ACCEPT} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={pick} />
          <Button variant="secondary" size="sm" className="gap-2" loading={upload.isPending} onClick={() => inputRef.current?.click()}>
            {!upload.isPending && <ImagePlus aria-hidden="true" size={16} strokeWidth={1.5} />}
            {upload.isPending ? t.banner.uploading : value ? t.banner.replace : t.banner.choose}
          </Button>
          {value && (
            <Button variant="ghost" size="sm" className="gap-2" disabled={upload.isPending} onClick={() => onChange("")}>
              <Trash2 aria-hidden="true" size={16} strokeWidth={1.5} />
              {t.banner.remove}
            </Button>
          )}
        </div>
      </div>
      <p className="text-small text-muted">{t.banner.hint}</p>
      {problem && (
        <p role="alert" className="text-small text-danger">
          {problem}
        </p>
      )}
    </div>
  );
}
