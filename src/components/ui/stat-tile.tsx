import { Flame, Star, Target, Trophy, type LucideIcon } from "lucide-react";

/**
 * Stat tiles — one definition, used by Dashboard, Challenges and Profile.
 *
 * Colours are fixed per stat so the same number always looks the same wherever
 * it appears. Hex rather than theme tokens because these four are brand-level
 * constants, specified alongside the icons.
 */
export type StatKey = "rank" | "streak" | "points" | "badges";

export const STAT_STYLE: Record<
  StatKey,
  { icon: LucideIcon; color: string; background: string; label: string }
> = {
  rank: { icon: Trophy, color: "#D97706", background: "#FEF3E2", label: "Rank" },
  streak: { icon: Flame, color: "#EA580C", background: "#FEE2E0", label: "Streak" },
  points: { icon: Target, color: "#059669", background: "#E6F4EE", label: "Points" },
  badges: { icon: Star, color: "#2563EB", background: "#E7EFFC", label: "Badges" },
};

export function StatIcon({ stat }: { stat: StatKey }) {
  const { icon: Icon, color, background } = STAT_STYLE[stat];
  return (
    <span
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
      style={{ backgroundColor: background }}
      aria-hidden="true"
    >
      <Icon size={24} strokeWidth={2} color={color} />
    </span>
  );
}

export function StatTile({
  stat,
  value,
  detail,
  label,
}: {
  stat: StatKey;
  value: string;
  detail?: string;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <StatIcon stat={stat} />
      <div className="min-w-0">
        <div className="text-sm text-muted-foreground">{label ?? STAT_STYLE[stat].label}</div>
        <div className="font-display text-2xl font-bold leading-tight">{value}</div>
        {detail && <div className="mt-0.5 truncate text-xs text-muted-foreground">{detail}</div>}
      </div>
    </div>
  );
}
