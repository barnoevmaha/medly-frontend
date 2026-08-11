import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Award, BookMarked, ChevronRight, Crown, GraduationCap, Lock, MessageSquare,
  Settings as SettingsIcon, Trophy, Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { ErrorState, LoadingState } from "@/components/ui/states";
import {
  api,
  type ActivityRow,
  type BadgeState,
  type CommunitySummary,
  type Profile as ProfileData,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "badges", label: "Badges" },
  { key: "communities", label: "Communities" },
  { key: "activity", label: "Activity" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function relative(iso: string): string {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function Profile() {
  // The tab lives in the URL so the Dashboard can link straight to the badges
  // section rather than dropping the user on a generic profile page.
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as TabKey) ?? "overview";

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [badges, setBadges] = useState<BadgeState[]>([]);
  const [communities, setCommunities] = useState<CommunitySummary[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [me, badgeList, joined, recent] = await Promise.all([
        api.profile(),
        api.badges(),
        api.myCommunities(),
        api.activity(15),
      ]);
      setProfile(me);
      setBadges(badgeList);
      setCommunities(joined);
      setActivity(recent);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const stats = useMemo(
    () => [
      {
        value: profile ? `#${profile.rank}` : "—",
        label: "Global Rank",
        to: "/leaderboard",
        hint: "Open the leaderboard",
      },
      {
        value: profile ? profile.points.toLocaleString() : "—",
        label: "Total Points",
        to: "/leaderboard",
        hint: "Open the leaderboard",
      },
      {
        value: profile ? String(profile.badge_count) : "—",
        label: "Badges Earned",
        to: "/profile?tab=badges",
        hint: "View badges",
      },
      {
        value: profile ? String(profile.community_count) : "—",
        label: "Communities",
        to: "/profile?tab=communities",
        hint: "View your communities",
      },
    ],
    [profile]
  );

  if (loading) return <LoadingState label="Loading profile…" />;
  if (error || !profile) {
    return <ErrorState message={error ?? undefined} onRetry={() => void load()} />;
  }

  return (
    <>
      <Card className="mb-8 p-6 shadow-medium animate-fade-up md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <Avatar
            name={profile.name}
            className="h-24 w-24 border-4 border-card text-2xl md:h-28 md:w-28"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold md:text-3xl">{profile.name}</h1>
              {profile.is_premium && (
                <Badge variant="accent">
                  <Crown className="h-3 w-3" />
                  Premium
                </Badge>
              )}
              {profile.role !== "student" && <Badge variant="info">{profile.role}</Badge>}
            </div>
            <p className="mt-0.5 text-muted-foreground">{profile.handle}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {profile.institution || "Medly"}
              {profile.year_of_study ? ` · Year ${profile.year_of_study}` : ""}
            </p>
          </div>

          <div className="flex gap-2">
            <Link to="/leaderboard">
              <Button variant="outline">
                <Trophy className="h-4 w-4" />
                Rank
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="outline">
                <SettingsIcon className="h-4 w-4" />
                Settings
              </Button>
            </Link>
            {!profile.is_premium && (
              <Link to="/premium">
                <Button variant="accent">Upgrade</Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.to} title={stat.hint} className="block">
            <Card className="h-full p-5 text-center card-hover">
              <div className="font-display text-2xl font-bold text-gradient">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((item) => (
          <button
            key={item.key}
            onClick={() => setParams(item.key === "overview" ? {} : { tab: item.key })}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              tab === item.key
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-5">
            <h3 className="flex items-center gap-2 font-display font-bold">
              <GraduationCap className="h-4 w-4 text-primary" />
              Learning
            </h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Lessons completed</dt>
                <dd className="font-semibold">{profile.lessons_completed}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Challenges started</dt>
                <dd className="font-semibold">{profile.challenges_completed}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Current streak</dt>
                <dd className="font-semibold">
                  {profile.streak_days} day{profile.streak_days === 1 ? "" : "s"}
                </dd>
              </div>
            </dl>
            <Link to="/learn">
              <Button className="mt-4 w-full" variant="outline" size="sm">
                Continue AI Training
              </Button>
            </Link>
          </Card>

          <Card className="p-5">
            <h3 className="flex items-center gap-2 font-display font-bold">
              <BookMarked className="h-4 w-4 text-accent" />
              Library & discussion
            </h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Saved items</dt>
                <dd className="font-semibold">{profile.saved_count}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Comments written</dt>
                <dd className="font-semibold">{profile.comments}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Communities joined</dt>
                <dd className="font-semibold">{profile.community_count}</dd>
              </div>
            </dl>
            <Link to="/library?tab=saved">
              <Button className="mt-4 w-full" variant="outline" size="sm">
                Open Saved
              </Button>
            </Link>
          </Card>
        </div>
      )}

      {tab === "badges" && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Badges</h2>
            <span className="text-sm text-muted-foreground">
              {badges.filter((badge) => badge.earned).length} of {badges.length} earned
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {badges.map((badge) => (
              <Card
                key={badge.key}
                className={cn(
                  "p-5 text-center card-hover",
                  !badge.earned && "opacity-60"
                )}
              >
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {badge.earned ? (
                    <Icon name={badge.icon} />
                  ) : (
                    <Lock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
                <div className="mt-2 text-sm font-semibold">{badge.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {badge.earned && badge.earned_at
                    ? `Earned ${new Date(badge.earned_at).toLocaleDateString()}`
                    : badge.hint}
                </div>
              </Card>
            ))}
          </div>
          {badges.every((badge) => !badge.earned) && (
            <Card className="mt-4 p-5">
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Badges unlock from real activity — finishing a lesson, answering challenge
                  questions, saving material, joining communities.
                </p>
              </div>
            </Card>
          )}
        </>
      )}

      {tab === "communities" && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Your communities</h2>
            <Link to="/community">
              <Button variant="link" size="sm">
                Find more
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          {communities.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="mt-3 font-display font-bold">You have not joined any yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Communities are where cases get discussed between sessions.
              </p>
              <Link to="/community">
                <Button className="mt-4">Browse communities</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {communities.map((community) => (
                <Link key={community.id} to={`/community/${community.slug}`}>
                  <Card className="h-full p-5 card-hover">
                    <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                      <Icon name={community.icon} className="h-5 w-5 text-primary" />
                      {community.name}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">{community.description}</p>
                    <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        {community.members.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="h-4 w-4" />
                        {community.messages}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "activity" && (
        <>
          <h2 className="mb-4 font-display text-2xl font-bold">Recent activity</h2>
          {activity.length === 0 ? (
            <Card className="p-8 text-center">
              <Award className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="mt-3 font-display font-bold">Nothing recorded yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Answer a challenge question or finish a lesson and it will show up here.
              </p>
            </Card>
          ) : (
            <Card className="divide-y divide-border p-0">
              {activity.map((row, index) => (
                <div
                  key={`${row.text}-${index}`}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{row.text}</div>
                    <div className="text-sm text-muted-foreground">
                      {row.detail} · {relative(row.at)}
                    </div>
                  </div>
                  {row.points ? (
                    <Badge variant="success">+{row.points}</Badge>
                  ) : (
                    <Badge variant="muted">done</Badge>
                  )}
                </div>
              ))}
            </Card>
          )}
        </>
      )}
    </>
  );
}
