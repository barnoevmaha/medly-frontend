import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Award, CheckCircle2, ChevronRight, Clock, Flame, Medal, PencilLine, Sprout, Target,
  Trophy, Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/avatar";
import { Cover } from "@/components/ui/cover";
import { EmptyState, ErrorState, SkeletonCard } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { useLanguage } from "@/lib/i18n";
import {
  api,
  type ChallengeSummary,
  type LeaderboardRow,
  type Profile,
} from "@/lib/api";
import { cn } from "@/lib/utils";

/* Difficulty reads as a colour before it reads as a word. */
const DIFFICULTY = {
  easy: { color: "#16A34A", icon: Sprout },
  medium: { color: "#EA580C", icon: PencilLine },
  hard: { color: "#DC2626", icon: Flame },
} as const;
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
  const { t } = useLanguage();

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
      label: t("challenges.totalPoints"),
    },
    {
      icon: Target,
      value: profile ? `#${profile.rank}` : "—",
      label: t("challenges.ofStudents", { n: profile?.total_users ?? 0 }),
    },
    {
      icon: Award,
      value: profile ? String(profile.challenges_completed) : "—",
      label: t("challenges.started"),
    },
  ];

  return (
    <>
      <PageHeader title={t("challenges.title")} subtitle={t("challenges.subtitle")} />

      {error && <ErrorState message={error} onRetry={() => void load()} />}

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex items-center gap-4 p-5 card-hover">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <stat.icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <div className="font-display text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <h2 className="mb-4 font-display text-2xl font-bold">{t("challenges.active")}</h2>

      {loading ? (
        <div className="mb-12 grid gap-4 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : challenges.length === 0 ? (
        <EmptyState
          icon={<Trophy className="h-8 w-8" />}
          title={t("challenges.noneRunning")}
          body={t("challenges.checkBack")}
        />
      ) : (
        <div className="mb-12 grid gap-4 sm:grid-cols-2">
          {challenges.map((challenge) => {
            const progress = challenge.question_count
              ? (challenge.answered_count / challenge.question_count) * 100
              : 0;
            const difficulty =
              DIFFICULTY[challenge.difficulty as keyof typeof DIFFICULTY] ?? DIFFICULTY.medium;
            return (
              <Card
                key={challenge.id}
                className="flex flex-col overflow-hidden p-0 card-hover animate-fade-in"
              >
                {/* Cover, with the two badges floating over it. */}
                <div className="relative">
                  <Link
                    to={`/challenges/${challenge.slug}`}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="block"
                  >
                    <Cover
                      src={challenge.cover}
                      width={360}
                      height={160}
                      className="border-b border-border"
                    />
                  </Link>
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-800 shadow-soft backdrop-blur">
                    <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
                    {challenge.points} pts
                  </span>
                  <span
                    className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold capitalize text-white shadow-soft"
                    style={{ backgroundColor: difficulty.color }}
                  >
                    <difficulty.icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {challenge.difficulty}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-lg font-bold leading-snug">
                    {challenge.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {challenge.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" aria-hidden="true" />
                      {challenge.participants.toLocaleString()} {t("challenges.joined")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" aria-hidden="true" />
                      {endsIn(challenge.ends_at)}
                    </span>
                  </div>

                  {challenge.joined && (
                    <div className="mt-3">
                      <Progress value={progress} />
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {challenge.answered_count} of {challenge.question_count} answered ·{" "}
                        {challenge.earned_points} pts earned
                      </p>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    className="mt-auto w-full border-primary text-primary hover:bg-primary/5"
                    disabled={busy === challenge.slug}
                    onClick={() => void open(challenge)}
                  >
                    {challenge.completed ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        {t("challenges.reviewAnswers")}
                      </>
                    ) : (
                      <>
                        {challenge.joined ? t("challenges.continue") : t("challenges.join")}
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">{t("challenges.topLeaderboard")}</h2>
        <Link to="/leaderboard">
          <Button variant="link" size="sm">
            {t("challenges.fullRanking")}
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
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
            <Avatar src={row.avatar_url || undefined} name={row.name} className="h-10 w-10 shrink-0 text-xs" />
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
            {t("challenges.noScores")}
          </p>
        )}
      </Card>
    </>
  );
}
