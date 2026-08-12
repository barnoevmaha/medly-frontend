import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { PatientState } from "@/lib/api";

/**
 * The simulated patient, drawn as SVG.
 *
 * Hand-drawn paths rather than a sprite sheet or a 3D runtime: the whole
 * character is a few kilobytes of markup, it inherits the theme's colours, it
 * stays sharp at any size, and the expression is a handful of coordinates
 * rather than an asset pipeline.
 *
 * Tone is deliberately gentle. This is a person a student is being taught to
 * look after, and a cartoon in visible distress reads badly when the subject
 * is a deteriorating patient — so the states differ by posture, colour and
 * small facial changes rather than by melodrama.
 *
 * `expression` is a superset of the backend's `PatientState`, because the
 * engine reports condition (stable, critical…) and a face also needs to show
 * feeling (worried, pain). `expressionFor` maps one to the other, and a caller
 * can pass an expression directly when a stage calls for it.
 */
export type PatientExpression =
  | "stable"
  | "improving"
  | "worried"
  | "pain"
  | "deteriorating"
  | "critical"
  | "recovered";

/** The engine reports condition; the face needs a feeling. */
export function expressionFor(state: PatientState): PatientExpression {
  switch (state) {
    case "improving":
      return "improving";
    case "deteriorating":
      return "deteriorating";
    case "critical":
      return "critical";
    case "recovered":
      return "recovered";
    case "failed":
      return "critical";
    default:
      return "stable";
  }
}

interface Look {
  /** Skin tone — drains as the patient tires. */
  skin: string;
  /** Cheek flush; also used for the fever/cyanosis hint. */
  blush: string;
  /** Eye openness, 1 is wide. */
  eye: number;
  /** Mouth curve: positive smiles, negative frowns. */
  mouth: number;
  /** Brow angle in degrees; positive is a worried inner-brow lift. */
  brow: number;
  /** Breathing cycle length. Faster means working harder. */
  breath: string;
  label: string;
}

const LOOKS: Record<PatientExpression, Look> = {
  stable: { skin: "#F0C9A8", blush: "#E9A98A", eye: 1, mouth: 1, brow: 0, breath: "4.4s", label: "Comfortable" },
  improving: { skin: "#F2CDAC", blush: "#EDA98F", eye: 1, mouth: 3, brow: -2, breath: "4.8s", label: "More settled" },
  worried: { skin: "#EEC4A3", blush: "#E4A188", eye: 1.15, mouth: -1, brow: 12, breath: "3.4s", label: "Anxious" },
  pain: { skin: "#EBBE9C", blush: "#DE9A80", eye: 0.35, mouth: -3, brow: 16, breath: "2.8s", label: "In pain" },
  deteriorating: { skin: "#E2BCA0", blush: "#CE9584", eye: 0.8, mouth: -2, brow: 10, breath: "2.4s", label: "Struggling" },
  critical: { skin: "#D2B5A6", blush: "#A9899B", eye: 0.45, mouth: -3, brow: 14, breath: "1.7s", label: "Critical" },
  recovered: { skin: "#F4D2B4", blush: "#EFAC93", eye: 1, mouth: 4, brow: -4, breath: "5.2s", label: "Recovered" },
};

export function PatientAvatar({
  expression,
  name,
  className,
  size = 200,
}: {
  expression: PatientExpression;
  name?: string;
  className?: string;
  size?: number;
}) {
  const look = LOOKS[expression];
  // A brief pulse when the condition changes, so a transition is noticed
  // without an animation running the whole time.
  const [changed, setChanged] = useState(false);
  const previous = useRef(expression);

  useEffect(() => {
    if (previous.current === expression) return;
    previous.current = expression;
    setChanged(true);
    const timer = window.setTimeout(() => setChanged(false), 900);
    return () => window.clearTimeout(timer);
  }, [expression]);

  const eyeHeight = 3.4 * look.eye;

  return (
    <div
      className={cn("relative select-none", className)}
      // Read out as a status so a screen reader hears the condition change
      // rather than only seeing a face redraw.
      role="img"
      aria-label={`${name ? `${name}: ` : ""}${look.label}`}
    >
      <svg
        viewBox="0 0 200 210"
        width={size}
        height={(size * 210) / 200}
        className={cn("vp-breathe", changed && "vp-state-change")}
        style={{ ["--vp-breath" as string]: look.breath }}
        aria-hidden="true"
      >
        {/* bed / pillow, so the figure is clearly a patient */}
        <ellipse cx="100" cy="186" rx="74" ry="18" fill="hsl(var(--muted))" />
        <rect x="34" y="150" width="132" height="42" rx="20" fill="hsl(var(--card))"
              stroke="hsl(var(--border))" />

        {/* gown */}
        <path d="M56 176 C58 136 76 120 100 120 C124 120 142 136 144 176 Z"
              fill="hsl(var(--primary) / 0.16)" stroke="hsl(var(--primary) / 0.35)" />

        {/* neck + head */}
        <rect x="90" y="104" width="20" height="20" rx="9" fill={look.skin}
              className="vp-tint" />
        <ellipse cx="100" cy="72" rx="42" ry="45" fill={look.skin}
                 className="vp-tint" />

        {/* hair */}
        <path d="M58 66 C60 34 82 24 100 24 C118 24 140 34 142 66 C132 50 118 44 100 44 C82 44 68 50 58 66 Z"
              fill="hsl(var(--muted-foreground) / 0.55)" />

        {/* cheeks */}
        <ellipse cx="74" cy="84" rx="9" ry="6" fill={look.blush} opacity="0.55"
                 className="vp-tint" />
        <ellipse cx="126" cy="84" rx="9" ry="6" fill={look.blush} opacity="0.55"
                 className="vp-tint" />

        {/* brows — the main carrier of the expression */}
        <g stroke="hsl(var(--foreground) / 0.65)" strokeWidth="3" strokeLinecap="round"
           className="vp-tint">
          <line x1="70" y1="62" x2="88" y2="62"
                transform={`rotate(${-look.brow} 79 62)`} />
          <line x1="112" y1="62" x2="130" y2="62"
                transform={`rotate(${look.brow} 121 62)`} />
        </g>

        {/* eyes */}
        <g fill="hsl(var(--foreground) / 0.8)" className="vp-tint">
          <ellipse cx="79" cy="76" rx="4.2" ry={eyeHeight} />
          <ellipse cx="121" cy="76" rx="4.2" ry={eyeHeight} />
        </g>

        {/* mouth */}
        <path
          d={`M86 96 Q100 ${96 + look.mouth * 2.4} 114 96`}
          className="vp-tint"
          stroke="hsl(var(--foreground) / 0.7)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* oxygen mask, only once the patient needs real support */}
        {(expression === "critical" || expression === "deteriorating") && (
          <g opacity="0.75">
            <path d="M78 88 Q100 78 122 88 Q122 108 100 112 Q78 108 78 88 Z"
                  fill="hsl(var(--info) / 0.28)" stroke="hsl(var(--info) / 0.55)" />
            <line x1="122" y1="96" x2="150" y2="104" stroke="hsl(var(--info) / 0.5)" strokeWidth="3" />
          </g>
        )}
      </svg>
    </div>
  );
}
