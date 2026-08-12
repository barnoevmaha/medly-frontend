import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Loader2, Play, RotateCcw, Stethoscope } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, ErrorState, SkeletonCard } from "@/components/ui/states";
import { PatientAvatar } from "@/components/virtual-patient/PatientAvatar";
import { useToast } from "@/components/ui/toast";
import { api, type VpCase } from "@/lib/api";

/** Difficulty reads as a colour before it reads as a word — as on Challenges. */
const DIFFICULTY: Record<string, { badge: string; label: string }> = {
  easy: { badge: "success", label: "Easy" },
  medium: { badge: "warning", label: "Medium" },
  hard: { badge: "accent", label: "Hard" },
};

export default function VirtualPatient() {
  const navigate = useNavigate();
  const toast = useToast();
  const [starting, setStarting] = useState<string | null>(null);
  const [cases, setCases] = useState<VpCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCases(await api.vpCases());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the cases");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /* The server opens the run and hands back its id; the URL then names that
     run, so a refresh resumes it. An unfinished run is resumed rather than
     duplicated — that rule lives in the engine, not here. */
  async function open(slug: string) {
    if (starting) return;
    setStarting(slug);
    try {
      const session = await api.vpStart(slug);
      navigate(`/virtual-patient/session/${session.session_id}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not start that case", "error");
      setStarting(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Virtual Patient"
        subtitle="Work through a clinical case and see where your decisions lead"
      />

      <Card className="mb-6 border-primary/25 bg-primary/5 p-4">
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span>
            Every patient here is simulated. Decisions are marked against an
            authored clinical model, not by an AI — the assistant only puts the
            patient's words and your debrief into plain language.
          </span>
        </p>
      </Card>

      {error && <ErrorState message={error} onRetry={() => void load()} />}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : cases.length === 0 ? (
        <EmptyState
          icon={<Stethoscope className="h-8 w-8" />}
          title="No cases are published yet"
          body="Simulated cases appear here as they are released."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cases.map((item) => {
            const difficulty = DIFFICULTY[item.difficulty] ?? DIFFICULTY.medium;
            const inProgress = item.active_session_id !== null;
            return (
              <Card
                key={item.slug}
                className="flex flex-col overflow-hidden p-0 card-hover animate-fade-in"
              >
                <div className="flex items-start gap-4 border-b border-border bg-muted/30 p-5">
                  <PatientAvatar
                    expression="stable"
                    name={item.patient_name}
                    size={92}
                    className="-my-1 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={difficulty.badge as never}>{difficulty.label}</Badge>
                      <Badge variant="muted">{item.specialty}</Badge>
                      {item.completed && <Badge variant="success">Completed</Badge>}
                    </div>
                    <h3 className="mt-2 font-display text-lg font-bold leading-snug">
                      {item.title}
                    </h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {item.patient_name}, {item.patient_age} · {item.presenting_complaint}
                    </p>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <p className="line-clamp-3 text-sm text-muted-foreground">{item.summary}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" aria-hidden="true" />
                      {item.estimated_minutes} min
                    </span>
                    <span>{item.stage_count} stages</span>
                    <span>{item.max_score} points available</span>
                  </div>

                  {inProgress && (
                    <p className="mt-3 text-xs font-medium text-primary">
                      You have a case in progress.
                    </p>
                  )}

                  <div className="mt-auto pt-5">
                    <Button
                      className="w-full"
                      variant={inProgress ? "outline" : "default"}
                      disabled={starting !== null}
                      onClick={() => void open(item.slug)}
                    >
                      {starting === item.slug ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : inProgress ? (
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Play className="h-4 w-4" aria-hidden="true" />
                      )}
                      {inProgress
                        ? "Resume case"
                        : item.completed
                          ? "Play again"
                          : "Start case"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
