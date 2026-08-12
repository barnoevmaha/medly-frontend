import { useEffect, useRef, useState } from "react";
import { Activity, ArrowDown, ArrowUp, Droplet, HeartPulse, Thermometer, Wind } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PatientState, VpVitals } from "@/lib/api";

/**
 * How the patient is doing, and the numbers behind it.
 *
 * The condition is shown three ways on purpose — a filled bar, a word, and a
 * colour — because colour alone cannot carry "critical" for a colour-blind
 * reader, and a bar alone cannot say which direction things are moving.
 */

const STATE: Record<
  PatientState,
  { label: string; fill: number; bar: string; badge: string; note: string }
> = {
  recovered: { label: "Recovered", fill: 100, bar: "bg-success", badge: "success", note: "Out of danger" },
  improving: { label: "Improving", fill: 80, bar: "bg-success", badge: "success", note: "Responding to treatment" },
  stable: { label: "Stable", fill: 60, bar: "bg-primary", badge: "default", note: "Holding, but unwell" },
  deteriorating: { label: "Deteriorating", fill: 35, bar: "bg-warning", badge: "warning", note: "Getting worse" },
  critical: { label: "Critical", fill: 15, bar: "bg-destructive", badge: "accent", note: "Needs immediate action" },
  failed: { label: "Arrested", fill: 0, bar: "bg-destructive", badge: "accent", note: "The patient did not survive" },
};

/** Only the observations the backend actually sent are rendered. */
const VITALS: Array<{
  key: string;
  label: string;
  icon: typeof HeartPulse;
  unit?: string;
  /** Outside this range the value is flagged as abnormal. */
  normal?: (value: number) => boolean;
}> = [
  { key: "hr", label: "HR", icon: HeartPulse, unit: "bpm", normal: (v) => v >= 60 && v <= 100 },
  { key: "bp", label: "BP", icon: Activity, unit: "mmHg" },
  { key: "rr", label: "RR", icon: Wind, unit: "/min", normal: (v) => v >= 12 && v <= 20 },
  { key: "spo2", label: "SpO₂", icon: Droplet, unit: "%", normal: (v) => v >= 94 },
  { key: "temp", label: "Temp", icon: Thermometer, unit: "°C", normal: (v) => v >= 36 && v <= 37.5 },
  { key: "gcs", label: "GCS", icon: Activity, normal: (v) => v >= 15 },
];

export function ConditionMeter({
  state,
  vitals,
  className,
}: {
  state: PatientState;
  vitals?: VpVitals;
  className?: string;
}) {
  const info = STATE[state] ?? STATE.stable;
  const present = VITALS.filter(
    (v) => vitals?.[v.key] !== undefined && vitals?.[v.key] !== null
  );

  /* Which numbers just moved, and which way. A student should be able to see
     that the saturations fell without holding the previous screen in memory —
     the arrow says it, the highlight draws the eye, and both fade. */
  const previous = useRef<VpVitals | undefined>(vitals);
  const [changed, setChanged] = useState<Record<string, "up" | "down">>({});

  useEffect(() => {
    const before = previous.current;
    previous.current = vitals;
    if (!before || !vitals) return;

    const moved: Record<string, "up" | "down"> = {};
    for (const { key } of VITALS) {
      const a = before[key];
      const b = vitals[key];
      if (typeof a === "number" && typeof b === "number" && a !== b) {
        moved[key] = b > a ? "up" : "down";
      }
    }
    if (!Object.keys(moved).length) return;
    setChanged(moved);
    const timer = window.setTimeout(() => setChanged({}), 2200);
    return () => window.clearTimeout(timer);
  }, [vitals]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-muted-foreground">
          Patient condition
        </span>
        <Badge variant={info.badge as never}>{info.label}</Badge>
      </div>

      <div
        role="meter"
        aria-valuenow={info.fill}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Patient condition: ${info.label}`}
        className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", info.bar)}
          style={{ width: `${info.fill}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{info.note}</p>

      {present.length > 0 && (
        <dl className="grid grid-cols-3 gap-2 pt-1">
          {present.map(({ key, label, icon: Icon, unit, normal }) => {
            const raw = vitals?.[key];
            const numeric = typeof raw === "number" ? raw : null;
            const abnormal = numeric !== null && normal ? !normal(numeric) : false;
            const moved = changed[key];
            return (
              <div
                key={key}
                className={cn(
                  "rounded-xl border border-border bg-background px-2.5 py-2 transition-colors duration-500",
                  abnormal && "border-warning/40 bg-warning/5",
                  moved && "vp-vital-changed"
                )}
              >
                <dt className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Icon className="h-3 w-3" aria-hidden="true" />
                  {label}
                </dt>
                <dd
                  className={cn(
                    "font-display text-sm font-bold tabular-nums",
                    abnormal && "text-warning"
                  )}
                >
                  {String(raw)}
                  {unit && <span className="ml-0.5 text-[10px] font-normal">{unit}</span>}
                  {moved && (
                    <>
                      {moved === "up" ? (
                        <ArrowUp className="ml-0.5 inline h-3 w-3" aria-hidden="true" />
                      ) : (
                        <ArrowDown className="ml-0.5 inline h-3 w-3" aria-hidden="true" />
                      )}
                      <span className="sr-only"> ({moved === "up" ? "risen" : "fallen"})</span>
                    </>
                  )}
                  {/* Not colour alone: abnormal values are also marked. */}
                  {abnormal && <span className="sr-only"> (abnormal)</span>}
                  {abnormal && (
                    <span aria-hidden="true" className="ml-1 text-[10px]">
                      !
                    </span>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </div>
  );
}
