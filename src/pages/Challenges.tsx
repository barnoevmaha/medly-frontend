import { useState } from "react";
import { Users, Clock, Medal, Flame, Target, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/PageHeader";
import { challenges } from "@/data/content";
import { cn } from "@/lib/utils";

const difficultyVariant = { easy: "success", medium: "warning", hard: "accent" } as const;
const statIcons = [Flame, Target, Award];
const medalColor = ["text-warning", "text-muted-foreground", "text-accent"];

export default function Challenges() {
  const [joined, setJoined] = useState<Record<string, boolean>>({});

  return (
    <>
      <PageHeader title={challenges.title} subtitle={challenges.subtitle} />

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {challenges.stats.map((s, i) => {
          const Icon = statIcons[i % statIcons.length];
          return (
            <Card key={s.label} className="flex items-center gap-4 p-5 card-hover">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-glow">
                <Icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <div className="font-display text-2xl font-bold">{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">{challenges.sectionTitle}</h2>
        <Button variant="link" size="sm">View All</Button>
      </div>

      <div className="mb-12 grid gap-4 sm:grid-cols-2">
        {challenges.active.map((c) => {
          const isJoined = joined[c.title];
          return (
            <Card key={c.title} className="flex flex-col p-5 card-hover animate-fade-in">
              <div className="flex items-start justify-between gap-3">
                <span className="text-3xl" aria-hidden>{c.emoji}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={difficultyVariant[c.difficulty as keyof typeof difficultyVariant]}>
                    {c.difficulty}
                  </Badge>
                  <Badge variant="solid">{c.points} pts</Badge>
                </div>
              </div>
              <h3 className="mt-4 font-display text-lg font-bold leading-snug">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>

              <div className="mt-5">
                <Progress value={Math.min(95, (c.joined / 2500) * 100)} />
                <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {c.joined.toLocaleString()} joined
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {c.endsIn}
                  </span>
                </div>
              </div>

              <Button
                variant={isJoined ? "outline" : "default"}
                className="mt-5 w-full"
                onClick={() => setJoined((s) => ({ ...s, [c.title]: !s[c.title] }))}
              >
                {isJoined ? "Joined ✓" : "Join Challenge"}
              </Button>
            </Card>
          );
        })}
      </div>

      <h2 className="mb-4 font-display text-2xl font-bold">{challenges.leaderboardTitle}</h2>
      <Card className="divide-y divide-border p-0">
        {challenges.leaderboard.map((row) => (
          <div
            key={row.rank}
            className={cn(
              "flex items-center gap-4 px-5 py-4",
              row.you && "bg-primary/5"
            )}
          >
            <div className="w-8 shrink-0 text-center">
              {row.rank <= 3 ? (
                <Medal className={cn("mx-auto h-6 w-6", medalColor[row.rank - 1])} />
              ) : (
                <span className="font-display font-bold text-muted-foreground">#{row.rank}</span>
              )}
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-primary font-display text-sm font-bold text-primary-foreground">
              {row.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-semibold">{row.name}</span>
                {row.you && <Badge>You</Badge>}
              </div>
              <div className="truncate text-sm text-muted-foreground">{row.school}</div>
            </div>
            <div className="shrink-0 font-display font-bold text-primary">{row.points}</div>
          </div>
        ))}
      </Card>
    </>
  );
}
