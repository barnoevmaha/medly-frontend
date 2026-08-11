import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArticleFeed } from "@/components/feed/ArticleFeed";
import { ErrorState } from "@/components/ui/states";
import { useSession } from "@/lib/session";
import { api, type ChallengeSummary, type Profile } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const navigate = useNavigate();
  const { me } = useSession();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [featured, setFeatured] = useState<ChallengeSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setProfile(await api.profile().catch(() => null));
  }, []);

  useEffect(() => {
    Promise.all([api.profile(), api.challenges().catch(() => [] as ChallengeSummary[])])
      .then(([me_, challenges]) => {
        setProfile(me_);
        setFeatured(challenges.find((c) => !c.completed) ?? challenges[0] ?? null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load the dashboard"));
  }, []);

  const stats = useMemo(
    () => [
      {
        label: "Rank",
        value: profile ? `#${profile.rank}` : "—",
        detail: profile ? `of ${profile.total_users} students` : "",
        tone: "text-primary",
        to: "/leaderboard",
      },
      {
        label: "Points",
        value: profile ? profile.points.toLocaleString() : "—",
        detail: "Earned from challenges & quizzes",
        tone: "text-success",
        to: "/leaderboard",
      },
      {
        label: "Streak",
        value: profile ? `${profile.streak_days}` : "—",
        detail: profile && profile.longest_streak > profile.streak_days
          ? `Best ${profile.longest_streak} days`
          : "Days in a row",
        tone: "text-warning",
        to: "/profile",
      },
      {
        label: "Badges",
        value: profile ? String(profile.badge_count) : "—",
        detail: "View your badges",
        tone: "text-accent",
        to: "/profile?tab=badges",
      },
    ],
    [profile]
  );

  const greeting = me ? `Welcome back, ${me.full_name.split(" ")[0]} 👋` : "Welcome back 👋";

  return (
    <>
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">{greeting}</h1>
          <p className="mt-1 text-muted-foreground">
            {profile && profile.streak_days > 1
              ? `${profile.streak_days}-day streak — keep it going.`
              : "Answer a question or finish a lesson to start a streak."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/learn">
            <Button variant="outline">AI Training</Button>
          </Link>
          <Link to="/imaging">
            <Button variant="outline">Imaging workbench</Button>
          </Link>
        </div>
      </header>

      {error && <ErrorState message={error} />}

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.to} className="block">
            <Card className="h-full p-5 card-hover">
              <div className="text-sm text-muted-foreground">{stat.label}</div>
              <div className={cn("mt-1 font-display text-2xl font-bold", stat.tone)}>
                {stat.value}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">{stat.detail}</div>
            </Card>
          </Link>
        ))}
      </div>

      {featured && (
        <Card className="mb-10 overflow-hidden p-0 shadow-medium">
          <div className="gradient-primary p-6 text-primary-foreground md:p-8">
            <Badge className="bg-white/20 text-white">Featured challenge</Badge>
            <h3 className="mt-3 font-display text-xl font-bold">{featured.title}</h3>
            <p className="mt-2 max-w-xl text-primary-foreground/90">{featured.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <Button
                variant="outline"
                className="border-white/30 bg-white text-primary hover:bg-white/90"
                onClick={() => navigate(`/challenges/${featured.slug}`)}
              >
                {featured.joined ? "Continue challenge" : "Join challenge"}
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="flex items-center gap-1.5 text-sm">
                <Clock className="h-4 w-4" />
                {featured.question_count} questions · {featured.points} pts
              </span>
              <span className="flex items-center gap-1.5 text-sm">
                <Users className="h-4 w-4" />
                {featured.participants.toLocaleString()} joined
              </span>
            </div>
          </div>
        </Card>
      )}

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold">Latest in your feed</h2>
          <Link to="/feed">
            <Button variant="link" size="sm">
              Open Your Feed
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* The same component Your Feed renders, cut to a preview. */}
        <ArticleFeed compact limit={3} onSavedChange={() => void loadProfile()} />
      </section>
    </>
  );
}
