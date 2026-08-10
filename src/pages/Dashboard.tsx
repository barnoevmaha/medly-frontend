import { useMemo, useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark, Clock, Users, ChevronRight, Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { dashboard } from "@/data/content";
import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  primary: "text-primary",
  accent: "text-accent",
  success: "text-success",
  warning: "text-warning",
};

export default function Dashboard() {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [liked, setLiked] = useState<Record<number, boolean>>({});
  const [saved, setSaved] = useState<Record<number, boolean>>({});

  const posts = useMemo(
    () =>
      dashboard.feed.filter(
        (p) =>
          (filter === "All" || p.tag === filter) &&
          (p.title + p.body).toLowerCase().includes(query.toLowerCase())
      ),
    [filter, query]
  );

  return (
    <>
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">{dashboard.greeting}</h1>
          <p className="mt-1 text-muted-foreground">{dashboard.greetingSub}</p>
        </div>
        <Button variant="outline" size="icon" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </Button>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {dashboard.stats.map((s) => (
          <Card key={s.label} className="p-5 card-hover">
            <div className="text-sm text-muted-foreground">{s.label}</div>
            <div className={cn("mt-1 font-display text-2xl font-bold", tones[s.tone])}>{s.value}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{s.delta}</div>
          </Card>
        ))}
      </div>

      <Card className="mb-10 overflow-hidden p-0 shadow-medium">
        <div className="gradient-primary p-6 text-primary-foreground md:p-8">
          <Badge className="bg-white/20 text-white">{dashboard.featured.kicker}</Badge>
          <h3 className="mt-3 font-display text-2xl font-bold">{dashboard.featured.title}</h3>
          <p className="mt-2 max-w-xl text-primary-foreground/90">{dashboard.featured.body}</p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Button variant="outline" className="border-white/30 bg-white text-primary hover:bg-white/90">
              {dashboard.featured.cta}
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="flex items-center gap-1.5 text-sm">
              <Clock className="h-4 w-4" />
              {dashboard.featured.startsIn}
            </span>
            <span className="flex items-center gap-1.5 text-sm">
              <Users className="h-4 w-4" />
              {dashboard.featured.joined}
            </span>
          </div>
        </div>
      </Card>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold">{dashboard.feedTitle}</h2>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your feed"
              className="pl-9"
            />
          </div>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {dashboard.feedFilters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                filter === f
                  ? "gradient-primary text-primary-foreground shadow-soft"
                  : "bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {posts.map((p, i) => (
            <Card key={p.title} className="p-6 card-hover animate-fade-in">
              <div className="flex items-center gap-3 text-sm">
                <Badge variant={p.tag === "Sponsored" ? "muted" : "default"}>{p.tag}</Badge>
                <span className="text-muted-foreground">{p.time}</span>
              </div>
              <h3 className="mt-3 font-display text-lg font-bold leading-snug">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm font-medium">{p.author}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setLiked((s) => ({ ...s, [i]: !s[i] }))}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
                  >
                    <Heart className={cn("h-4 w-4", liked[i] && "fill-accent text-accent")} />
                    {p.likes + (liked[i] ? 1 : 0)}
                  </button>
                  <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted">
                    <MessageCircle className="h-4 w-4" />
                    {p.comments}
                  </button>
                  <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted">
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setSaved((s) => ({ ...s, [i]: !s[i] }))}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
                  >
                    <Bookmark className={cn("h-4 w-4", saved[i] && "fill-primary text-primary")} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
          {posts.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">Nothing matches that filter.</p>
          )}
        </div>
      </section>
    </>
  );
}
