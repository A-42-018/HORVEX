import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import DialogShell from "../common/DialogShell";
import { IconButton } from "../common";
import { responsiveImage } from "../../lib/images";
import { strings } from "../../lib/strings";

const g = strings.product.gallery;
const ZOOM = 2.5;
const MAX_SCALE = 4;
const SWIPE_PX = 60;
const DOUBLE_TAP_MS = 300;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const IDENTITY = { scale: 1, x: 0, y: 0 };

// Full-screen viewer on the shared dialog shell (ESC, focus trap, scroll lock).
// Keys: ← → change image, Home/End jump, Enter/+/- toggle zoom. When zoomed,
// moving the mouse pans the image. Touch: swipe to change image, pinch to zoom,
// drag to pan when zoomed, double-tap to toggle zoom.
function GalleryLightbox({ open, onClose, images, index, onIndex, name }) {
  const [zoomed, setZoomed] = useState(false);
  const [touch, setTouch] = useState(IDENTITY); // touch transform (scale + pan)
  const [dragging, setDragging] = useState(false);
  const imgRef = useRef(null);
  const stageRef = useRef(null);
  const pointers = useRef(new Map());
  const gesture = useRef({ moved: false, startDist: 0, startScale: 1, lastTap: 0, usedTouch: false });
  const total = images.length;
  const image = images[index];

  const resetZoom = () => {
    setZoomed(false);
    setTouch(IDENTITY);
    if (imgRef.current) imgRef.current.style.transformOrigin = "";
  };

  const go = (next) => {
    resetZoom();
    onIndex((next + total) % total);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event) => {
      if (event.target instanceof HTMLElement && event.target.closest("button") && event.key === "Enter") return;
      switch (event.key) {
        case "ArrowLeft":
          go(index - 1);
          break;
        case "ArrowRight":
          go(index + 1);
          break;
        case "Home":
          go(0);
          break;
        case "End":
          go(total - 1);
          break;
        case "+":
        case "=":
          setZoomed(true);
          break;
        case "-":
          setZoomed(false);
          break;
        default:
          return;
      }
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Keep the panned image from leaving the stage.
  const bound = (scale, x, y) => {
    const box = stageRef.current?.getBoundingClientRect();
    if (!box) return { scale, x: 0, y: 0 };
    const mx = (box.width * (scale - 1)) / 2;
    const my = (box.height * (scale - 1)) / 2;
    return { scale, x: clamp(x, -mx, mx), y: clamp(y, -my, my) };
  };

  const dist = () => {
    const [a, b] = [...pointers.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const onPointerDown = (event) => {
    if (event.pointerType === "mouse") return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY, sx: event.clientX, sy: event.clientY });
    const gs = gesture.current;
    gs.usedTouch = true;
    setDragging(true);
    if (pointers.current.size === 1) gs.moved = false;
    if (pointers.current.size === 2) {
      gs.startDist = dist();
      gs.startScale = touch.scale;
      gs.moved = true;
    }
    if (imgRef.current) imgRef.current.style.transformOrigin = "50% 50%";
  };

  const onPointerMove = (event) => {
    if (event.pointerType === "mouse") return pan(event);
    const p = pointers.current.get(event.pointerId);
    if (!p) return;
    const dx = event.clientX - p.x;
    const dy = event.clientY - p.y;
    p.x = event.clientX;
    p.y = event.clientY;
    const gs = gesture.current;
    if (Math.hypot(event.clientX - p.sx, event.clientY - p.sy) > 8) gs.moved = true;
    if (pointers.current.size >= 2 && gs.startDist) {
      const scale = clamp(gs.startScale * (dist() / gs.startDist), 1, MAX_SCALE);
      setTouch((t) => bound(scale, t.x, t.y));
    } else if (touch.scale > 1) {
      setTouch((t) => bound(t.scale, t.x + dx, t.y + dy));
    }
  };

  const onPointerUp = (event) => {
    if (event.pointerType === "mouse") return;
    const p = pointers.current.get(event.pointerId);
    pointers.current.delete(event.pointerId);
    if (!p) return;
    const gs = gesture.current;
    if (pointers.current.size === 0) setDragging(false);
    if (pointers.current.size === 1) gs.startDist = 0;
    if (pointers.current.size > 0 || event.type === "pointercancel") return;

    const dx = event.clientX - p.sx;
    const dy = event.clientY - p.sy;
    if (touch.scale <= 1.02 && total > 1 && Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.5) {
      go(index + (dx < 0 ? 1 : -1));
      return;
    }
    if (touch.scale <= 1.02 && touch.scale !== 1) setTouch(IDENTITY);
    if (!gs.moved) {
      const now = event.timeStamp;
      if (now - gs.lastTap < DOUBLE_TAP_MS) {
        gs.lastTap = 0;
        setTouch((t) => (t.scale > 1 ? IDENTITY : { scale: ZOOM, x: 0, y: 0 }));
      } else {
        gs.lastTap = now;
      }
    }
  };

  const onStageClick = () => {
    // Touch zoom is handled by pointer events (double-tap); click is mouse/keyboard only.
    if (gesture.current.usedTouch) {
      gesture.current.usedTouch = false;
      return;
    }
    setZoomed((z) => !z);
  };

  const pan = (event) => {
    if (!zoomed || !imgRef.current) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * 100;
    const y = ((event.clientY - box.top) / box.height) * 100;
    imgRef.current.style.transformOrigin = `${x}% ${y}%`;
  };

  const { src, srcSet } = responsiveImage(image?.url, { widths: [800, 1200, 1600, 2000] });

  return (
    <DialogShell
      open={open}
      onClose={() => {
        resetZoom();
        onClose();
      }}
      title={g.lightbox(name)}
      tone="dark"
      panelClass={(visible) =>
        `absolute inset-0 transition-opacity duration-base ${visible ? "opacity-100" : "opacity-0"}`
      }
    >
      {image && (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div
            ref={stageRef}
            className={`relative min-h-0 flex-1 touch-none overflow-hidden ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onClick={onStageClick}
          >
            <img
              ref={imgRef}
              src={src}
              srcSet={srcSet}
              sizes="100vw"
              alt={image.alt || name}
              draggable={false}
              className="h-full w-full select-none object-contain transition-transform duration-slow ease-out will-change-transform"
              style={{
                transform:
                  touch.scale !== 1
                    ? `translate3d(${touch.x}px, ${touch.y}px, 0) scale(${touch.scale})`
                    : zoomed
                      ? `scale(${ZOOM})`
                      : "scale(1)",
                transitionDuration: dragging ? "0ms" : undefined,
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
            <span className="text-small text-muted" aria-live="polite">
              {g.counter(index + 1, total)}
            </span>
            <div className="flex items-center gap-2">
              {total > 1 && (
                <IconButton label={g.prev} onClick={() => go(index - 1)}>
                  <ChevronLeft aria-hidden="true" size={20} strokeWidth={1.5} />
                </IconButton>
              )}
              <IconButton
                label={zoomed || touch.scale > 1 ? g.zoomOut : g.zoomIn}
                pressed={zoomed || touch.scale > 1}
                onClick={() => (touch.scale > 1 ? setTouch(IDENTITY) : setZoomed((z) => !z))}
              >
                {zoomed || touch.scale > 1 ? (
                  <ZoomOut aria-hidden="true" size={20} strokeWidth={1.5} />
                ) : (
                  <ZoomIn aria-hidden="true" size={20} strokeWidth={1.5} />
                )}
              </IconButton>
              {total > 1 && (
                <IconButton label={g.next} onClick={() => go(index + 1)}>
                  <ChevronRight aria-hidden="true" size={20} strokeWidth={1.5} />
                </IconButton>
              )}
            </div>
          </div>
        </div>
      )}
    </DialogShell>
  );
}

export default GalleryLightbox;
