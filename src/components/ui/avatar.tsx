import { cn } from "@/lib/utils";

export function Avatar({
  src,
  name,
  className,
}: {
  /** Uploaded picture (data URL) or a path. Falls back to initials. */
  src?: string;
  name: string;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return src ? (
    <img
      src={src}
      alt={name}
      className={cn("rounded-2xl object-cover", className)}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
    />
  ) : (
    <div
      className={cn(
        "flex items-center justify-center rounded-2xl gradient-primary font-display font-bold text-primary-foreground",
        className
      )}
    >
      {initials}
    </div>
  );
}
