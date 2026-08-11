import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, ChevronRight, Heart, MessageCircle, Search, Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { EmptyState, ErrorState, SkeletonCard } from "@/components/ui/states";
import { api, type ArticleSummary } from "@/lib/api";
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

/**
 * The feed, in one place.
 *
 * Used full-size on Your Feed and cut down to a preview on the Dashboard, so
 * the two can never drift into behaving differently.
 */
export function ArticleFeed({
  compact = false,
  limit,
  onSavedChange,
}: {
  /** Preview mode: no search or filters, just the cards. */
  compact?: boolean;
  limit?: number;
  /** Lets a parent refresh counts that depend on the Saved collection. */
  onSavedChange?: () => void;
}) {
  const toast = useToast();

  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounce = useRef<number>();
  const touched = useRef(false);

  const load = useCallback(async (nextQuery: string, nextFilter: string) => {
    setSearching(true);
    try {
      setArticles(await api.articles({ q: nextQuery, tag: nextFilter }));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the feed");
    } finally {
      setSearching(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load("", "All");
  }, [load]);

  // Search runs on the server so it can look inside article bodies. Debounced
  // so a fast typist does not fire a request per keystroke.
  useEffect(() => {
    if (loading) return;
    if (!touched.current) {
      touched.current = true;
      return;
    }
    window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => void load(query, filter), 220);
    return () => window.clearTimeout(debounce.current);
  }, [query, filter, loading, load]);

  async function toggleSave(article: ArticleSummary) {
    const next = !article.saved;
    setArticles((current) =>
      current.map((item) => (item.id === article.id ? { ...item, saved: next } : item))
    );
    try {
      if (next) await api.save("article", article.slug);
      else await api.unsave("article", article.slug);
      toast(next ? "Saved to your collection" : "Removed from Saved");
      onSavedChange?.();
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
      setArticles((current) => current.map((item) => (item.id === updated.id ? updated : item)));
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

  const visible = limit ? articles.slice(0, limit) : articles;

  return (
    <>
      {!compact && (
        <>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-md">
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
        </>
      )}

      {error && <ErrorState message={error} onRetry={() => void load(query, filter)} />}

      {loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          {!compact && <SkeletonCard />}
        </div>
      ) : (
        <div className={cn("space-y-4 transition-opacity", searching && "opacity-60")}>
          {visible.map((article) => (
            <Card key={article.id} className="p-6 card-hover animate-fade-in">
              <div className="flex flex-wrap items-center gap-3 text-sm">
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

          {visible.length === 0 && !error && (
            <EmptyState
              icon={<Search className="h-8 w-8" />}
              title="Nothing matches that search"
              body={
                query
                  ? `No article mentions “${query}”. Try a broader term — the search covers the full text of every article.`
                  : "No articles under this filter yet."
              }
              action={
                !compact && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuery("");
                      setFilter("All");
                    }}
                  >
                    Clear search
                  </Button>
                )
              }
            />
          )}
        </div>
      )}
    </>
  );
}
