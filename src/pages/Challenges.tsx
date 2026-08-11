import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Award, CheckCircle2, ChevronRight, Clock, Flame, Medal, Target, Trophy, Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, ErrorState, SkeletonCard } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import {
  api,
  type ChallengeSummary,
  type LeaderboardRow,
  type Profile,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const difficultyVariant = { easy: "success", medium: "warning", hard: "accent" } as const;
const medalColor = ["text-warning", "text-muted-foreground", "text-accent"];

function endsIn(iso: string | null): string {
  if (!iso) return "No deadline";
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Closed";
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
}

export default function Challenges() {
  const navigate = useNavigate();
  const toast = useToast();

  const [challenges, setChallenges] = useState<ChallengeSummary[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [board, setBoard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [list, me, rows] = await Promise.all([
        api.challenges(),
        api.profile(),
        api.leaderboard(5),
      ]);
      setChallenges(list);
      setProfile(me);
      setBoard(rows);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load challenges");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function open(challenge: ChallengeSummary) {
    setBusy(challenge.slug);
    try {
      // Joining is recorded server-side, then the challenge actually opens —
      // the button is not a toggle.
      if (!challenge.joined) await api.joinChallenge(challenge.slug);
      navigate(`/challenges/${challenge.slug}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not open that challenge", "error");
    } finally {
      setBusy(null);
    }
  }

  const stats = [
    {
      icon: Flame,
      value: profile ? profile.points.toLocaleString() : "—",
      label: "Total points",
    },
    {
      icon: Target,
      value: profile ? `#${profile.rank}` : "—",
      label: `of ${profile?.total_users ?? 0} students`,
    },
    {
      icon: Award,
      value: profile ? String(profile.challenges_completed) : "—",
      label: "Challenges started",
    },
  ];

  return (
    <>
      <PageHeader
        title="Challenges & Rankings"
        subtitle="Answer correctly, earn points, climb the leaderboard"
      />

      {error && <ErrorState message={error} onRetry={() => void load()} />}

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex items-center gap-4 p-5 card-hover">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-glow">
              <stat.icon className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <div className="font-display text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">Active Challenges</h2>
        <Link to="/leaderboard">
          <Button variant="link" size="sm">
            Full leaderboard
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="mb-12 grid gap-4 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : challenges.length === 0 ? (
        <EmptyState
          icon={<Trophy className="h-8 w-8" />}
          title="No challenges are running"
          body="Check back shortly — new challenges are published every week."
        />
      ) : (
        <div className="mb-12 grid gap-4 sm:grid-cols-2">
          {challenges.map((challenge) => {
            const progress = challenge.question_count
              ? (challenge.answered_count / challenge.question_count) * 100
              : 0;
            return (
              <Card key={challenge.id} className="flex flex-col p-5 card-hover animate-fade-in">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-3xl" aria-hidden>
                    {challenge.emoji}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        difficultyVariant[challenge.difficulty as keyof typeof difficultyVariant] ??
                        "muted"
                      }
                    >
                      {challenge.difficulty}
                    </Badge>
                    <Badge variant="solid">{challenge.points} pts</Badge>
                  </div>
                </div>

                <h3 className="mt-4 font-display text-lg font-bold leading-snug">
                  {challenge.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{challenge.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Topic: {challenge.topic} · {challenge.question_count} questions
                </p>

                <div className="mt-5">
                  <Progress value={progress} />
                  <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      {challenge.participants.toLocaleString()} joined
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {endsIn(challenge.ends_at)}
                    </span>
                  </div>
                  {challenge.joined && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {challenge.answered_count} of {challenge.question_count} answered ·{" "}
                      {challenge.earned_points} pts earned
                    </p>
                  )}
                </div>

                <Button
                  variant={challenge.completed ? "outline" : "default"}
                  className="mt-5 w-full"
                  disabled={busy === challenge.slug}
                  onClick={() => void open(challenge)}
                >
                  {challenge.completed ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Review answers
                    </>
                  ) : challenge.joined ? (
                    "Continue challenge"
                  ) : (
                    "Join challenge"
                  )}
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">Leaderboard</h2>
        <Link to="/leaderboard">
          <Button variant="link" size="sm">
            View all
          </Button>
        </Link>
      </div>
      <Card className="divide-y divide-border p-0">
        {board.map((row) => (
          <div
            key={row.user_id}
            className={cn("flex items-center gap-4 px-5 py-4", row.you && "bg-primary/5")}
          >
            <div className="w-8 shrink-0 text-center">
              {row.rank <= 3 ? (
                <Medal className={cn("mx-auto h-6 w-6", medalColor[row.rank - 1])} />
              ) : (
                <span className="font-display font-bold text-muted-foreground">#{row.rank}</span>
              )}
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-primary font-display text-sm font-bold text-primary-foreground">
              {row.name.split(" ").map((word) => word[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-semibold">{row.name}</span>
                {row.you && <Badge>You</Badge>}
              </div>
              <div className="truncate text-sm text-muted-foreground">
                {row.institution || "Medly"}
              </div>
            </div>
            <div className="shrink-0 font-display font-bold text-primary">
              {row.points.toLocaleString()}
            </div>
          </div>
        ))}
        {board.length === 0 && !loading && (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            No scores yet. Answer a challenge question to get on the board.
          </p>
        )}
      </Card>
    </>
  );
}
