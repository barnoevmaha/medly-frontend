import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bookmark, ChevronRight, Clock, Heart, MessageCircle, Search, Share2, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { EmptyState, ErrorState, SkeletonCard } from "@/components/ui/states";
import { useSession } from "@/lib/session";
import {
  api,
  type ArticleSummary,
  type ChallengeSummary,
  type Profile,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const FILTERS = ["All", "Medical News", "Study Tip", "Upcoming Event", "Sponsored"];

function relative(iso: string): string {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const { me } = useSession();

  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [featured, setFeatured] = useState<ChallengeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search runs on the server so it can look inside article bodies. Debounced
  // so a fast typist does not fire a request per keystroke.
  const debounce = useRef<number>();
  const touched = useRef(false);

  const loadFeed = useCallback(
    async (nextQuery: string, nextFilter: string) => {
      setSearching(true);
      try {
        setArticles(await api.articles({ q: nextQuery, tag: nextFilter }));
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load the feed");
      } finally {
        setSearching(false);
      }
    },
    []
  );

  useEffect(() => {
    Promise.all([
      api.articles(),
      api.profile().catch(() => null),
      api.challenges().catch(() => [] as ChallengeSummary[]),
    ])
      .then(([feed, me_, challenges]) => {
        setArticles(feed);
        setProfile(me_);
        setFeatured(challenges.find((c) => !c.completed) ?? challenges[0] ?? null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load the dashboard"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    // The initial feed already arrived with the first load; without this the
    // page would fetch it a second time the moment loading flips.
    if (!touched.current) {
      touched.current = true;
      return;
    }
    window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => void loadFeed(query, filter), 220);
    return () => window.clearTimeout(debounce.current);
  }, [query, filter, loading, loadFeed]);

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
        label: "Badges",
        value: profile ? String(profile.badge_count) : "—",
        detail: "View your badges",
        tone: "text-warning",
        to: "/profile?tab=badges",
      },
      {
        label: "Saved",
        value: profile ? String(profile.saved_count) : "—",
        detail: "Articles, books, PDFs, videos",
        tone: "text-accent",
        to: "/saved",
      },
    ],
    [profile]
  );

  async function toggleSave(article: ArticleSummary) {
    const next = !article.saved;
    setArticles((current) =>
      current.map((item) => (item.id === article.id ? { ...item, saved: next } : item))
    );
    try {
      if (next) await api.save("article", article.slug);
      else await api.unsave("article", article.slug);
      toast(next ? "Saved to your collection" : "Removed from Saved");
      setProfile(await api.profile().catch(() => profile));
    } catch (e) {
      setArticles((current) =>
        current.map((item) => (item.id === article.id ? { ...item, saved: !next } : item))
      );
      toast(e instanceof Error ? e.message : "Could not save that", "error");
    }
  }

  async function toggleLike(article: ArticleSummary) {
    try {
      const updated = await api.toggleLike(article.slug);
      setArticles((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not register that", "error");
    }
  }

  async function share(article: ArticleSummary) {
    // The real, openable URL of this article — not a placeholder.
    const url = `${window.location.origin}/feed/${article.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied to clipboard");
    } catch {
      // Clipboard access needs a secure context; fall back rather than fail silently.
      window.prompt("Copy this link", url);
    }
  }

  const greeting = me ? `Welcome back, ${me.full_name.split(" ")[0]} 👋` : "Welcome back 👋";

  return (
    <>
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">{greeting}</h1>
          <p className="mt-1 text-muted-foreground">
            {profile?.certified
              ? "You are certified for AI-assisted analysis. Keep the streak going."
              : "Finish the AI Safety certification to unlock AI-assisted imaging."}
          </p>
        </div>
        {profile && !profile.certified && (
          <Link to="/learn">
            <Button variant="accent">Start certification</Button>
          </Link>
        )}
      </header>

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
            <h3 className="mt-3 font-display text-2xl font-bold">
              {featured.emoji} {featured.title}
            </h3>
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
          <h2 className="font-display text-2xl font-bold">Your Feed</h2>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search articles and their content"
              className="pl-9"
              aria-label="Search your feed"
            />
          </div>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Searches the full text of every article, not just the headline.
        </p>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                filter === item
                  ? "gradient-primary text-primary-foreground shadow-soft"
                  : "bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              {item}
            </button>
          ))}
        </div>

        {error && <ErrorState message={error} onRetry={() => void loadFeed(query, filter)} />}

        {loading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className={cn("space-y-4 transition-opacity", searching && "opacity-60")}>
            {articles.map((article) => (
              <Card key={article.id} className="p-6 card-hover animate-fade-in">
                <div className="flex items-center gap-3 text-sm">
                  <Badge variant={article.tag === "Sponsored" ? "muted" : "default"}>
                    {article.tag}
                  </Badge>
                  <span className="text-muted-foreground">{relative(article.published_at)}</span>
                  <span className="text-muted-foreground">· {article.read_minutes} min read</span>
                </div>

                <Link to={`/feed/${article.slug}`} className="group">
                  <h3 className="mt-3 font-display text-lg font-bold leading-snug group-hover:text-primary">
                    {article.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{article.excerpt}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Read article
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </Link>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <span className="text-sm font-medium">
                    {article.author}
                    {article.author_role && (
                      <span className="text-muted-foreground"> · {article.author_role}</span>
                    )}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => void toggleLike(article)}
                      aria-pressed={article.liked}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
                    >
                      <Heart className={cn("h-4 w-4", article.liked && "fill-accent text-accent")} />
                      {article.like_count}
                    </button>
                    <Link
                      to={`/feed/${article.slug}#comments`}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
                      aria-label={`Comment on ${article.title}`}
                    >
                      <MessageCircle className="h-4 w-4" />
                      {article.comment_count}
                    </Link>
                    <button
                      onClick={() => void share(article)}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
                      aria-label="Copy link"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => void toggleSave(article)}
                      aria-pressed={article.saved}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
                      aria-label={article.saved ? "Remove from Saved" : "Save"}
                    >
                      <Bookmark
                        className={cn("h-4 w-4", article.saved && "fill-primary text-primary")}
                      />
                    </button>
                  </div>
                </div>
              </Card>
            ))}

            {articles.length === 0 && !error && (
              <EmptyState
                icon={<Search className="h-8 w-8" />}
                title="Nothing matches that search"
                body={
                  query
                    ? `No article mentions “${query}”. Try a broader term — the search covers the full text of every article.`
                    : "No articles under this filter yet."
                }
                action={
                  <Button variant="outline" onClick={() => { setQuery(""); setFilter("All"); }}>
                    Clear search
                  </Button>
                }
              />
            )}
          </div>
        )}
      </section>
    </>
  );
}
