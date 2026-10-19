import { ChevronRightIcon } from "./icons";

function AnnouncementBar({
  message = "Free delivery on orders over \u09F32,000",
  ctaLabel = "Shop Now",
  ctaHref = "#shop",
}) {
  return (
    <div className="bg-ink text-white">
      <div className="mx-auto flex h-9 w-full max-w-container items-center justify-center gap-2 px-4 text-small sm:px-6 lg:px-8">
        <p className="truncate text-center">
          <span className="font-medium">{message}</span>
        </p>
        {ctaLabel && (
          <a
            href={ctaHref}
            className="hidden shrink-0 items-center gap-0.5 font-semibold underline-offset-2 hover:underline sm:inline-flex"
          >
            {ctaLabel}
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

export default AnnouncementBar;
