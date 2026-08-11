import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Cover art.
 *
 * The images are SVGs generated at build time and served from `public/covers`,
 * so there is no external request and the file sizes are in the low kilobytes.
 * Intrinsic width and height are always set, which is what stops the card
 * reflowing as images arrive; `loading="lazy"` keeps off-screen covers off the
 * critical path.
 *
 * The art is decorative in a card that already names the item, so `alt` is
 * empty there by design — a screen reader announcing "cover art for X" straight
 * after the title X is noise. Where the image carries information the caller
 * passes real alt text.
 */
export function Cover({
  src,
  alt = "",
  width,
  height,
  className,
}: {
  src?: string | null;
  alt?: string;
  width: number;
  height: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn("bg-muted", className)}
        style={{ aspectRatio: `${width} / ${height}` }}
        aria-hidden="true"
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("h-auto w-full object-cover", className)}
    />
  );
}
