import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Clock, BookOpen, Lock, CheckCircle2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/PageHeader";
import { api, type CourseSummary, type Me } from "@/lib/api";

export default function Learn() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.courses(), api.me()])
      .then(([list, user]) => {
        setCourses(list);
        setMe(user);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load courses"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-20 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading curriculum…
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h2 className="font-display font-bold">Could not load courses</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Start the API with <code className="rounded bg-muted px-1">uvicorn app.main:app --reload</code>{" "}
          and make sure you are signed in.
        </p>
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        title="AI Training"
        subtitle="Learn how medical AI works, where it fails, and how to use it responsibly"
      />

      {me && !me.certified && (
        <Card className="mb-8 border-warning/30 bg-warning/5 p-5">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div>
              <h3 className="font-display font-bold">AI-assisted analysis is locked</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Pass the AI Safety &amp; Ethics certification to unlock it. The gate is enforced
                on the server, so it is not something the interface can be talked out of.
              </p>
            </div>
          </div>
        </Card>
      )}

      {me?.certified && (
        <Card className="mb-8 border-success/30 bg-success/5 p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-success" />
            <div>
              <h3 className="font-display font-bold">Certified</h3>
              <p className="text-sm text-muted-foreground">
                AI-assisted analysis is unlocked. Competency score {me.competency_score}%.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {courses.map((course) => (
          <Card key={course.id} className="flex flex-col p-5 card-hover">
            <div className="flex items-start justify-between gap-3">
              <span className="text-3xl" aria-hidden>{course.emoji}</span>
              {course.is_certification ? (
                <Badge variant="accent">
                  <ShieldCheck className="h-3 w-3" />
                  Required
                </Badge>
              ) : (
                <Badge variant="muted">{course.level}</Badge>
              )}
            </div>

            <h3 className="mt-4 font-display text-lg font-bold leading-snug">{course.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{course.summary}</p>

            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                {course.lesson_count} lessons
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {course.duration_minutes} min
              </span>
            </div>

            {course.progress_pct > 0 && (
              <div className="mt-4">
                <Progress value={course.progress_pct} />
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  {course.progress_pct === 100 && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  )}
                  {course.progress_pct}% complete
                </div>
              </div>
            )}

            <Link to={`/learn/${course.slug}`} className="mt-5">
              <Button className="w-full" variant={course.is_certification ? "accent" : "default"}>
                {course.progress_pct > 0 ? "Continue" : "Start"}
              </Button>
            </Link>
          </Card>
        ))}
      </div>
    </>
  );
}
