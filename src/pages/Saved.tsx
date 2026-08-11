import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark, BookOpen, Crown, ExternalLink, FileText, Filter, Newspaper, Search,
  Star, Trash2, Video,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { useToast } from "@/components/ui/toast";
import { EmptyState, ErrorState, SkeletonCard } from "@/components/ui/states";
import { api, type LibraryResource, type SavedEntry, type SavedType } from "@/lib/api";
import { cn } from "@/lib/utils";

const TYPE_META: Record<SavedType, { label: string; icon: typeof BookOpen; plural: string }> = {
  article: { label: "Article", icon: Newspaper, plural: "Articles" },
  book: { label: "Book", icon: BookOpen, plural: "Books" },
  pdf: { label: "PDF", icon: FileText, plural: "PDFs" },
  video: { label: "Video", icon: Video, plural: "Videos" },
};

const TABS: Array<{ key: SavedType | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "article", label: "Articles" },
  { key: "book", label: "Books" },
  { key: "pdf", label: "PDFs" },
  { key: "video", label: "Videos" },
];

/**
 * Saved — the replacement for the old read-only Library.
 *
 * Everything a student keeps lives here regardless of type, and it is stored
 * server-side, so it survives a refresh and follows the account to another
 * device. The Browse tab is how books, PDFs and videos get in.
 */
export default function Saved() {
  const toast = useToast();

  const [mode, setMode] = useState<"saved" | "browse">("saved");
  const [tab, setTab] = useState<SavedType | "all">("all");
  const [items, setItems] = useState<SavedEntry[]>([]);
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [saved, library, savedCounts] = await Promise.all([
        api.saved(),
        api.resources(),
        api.savedCounts(),
      ]);
      setItems(saved);
      setResources(library);
      setCounts(savedCounts);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your saved items");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () => (tab === "all" ? items : items.filter((item) => item.item_type === tab)),
    [items, tab]
  );

  const browse = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return resources.filter(
      (resource) =>
        (!kind || resource.kind === kind) &&
        (!needle ||
          `${resource.title} ${resource.author} ${resource.description}`
            .toLowerCase()
            .includes(needle))
    );
  }, [resources, query, kind]);

  async function remove(entry: SavedEntry) {
    setItems((current) => current.filter((item) => item.id !== entry.id));
    setCounts((current) => ({
      ...current,
      all: Math.max(0, (current.all ?? 1) - 1),
      [entry.item_type]: Math.max(0, (current[entry.item_type] ?? 1) - 1),
    }));
    setResources((current) =>
      current.map((resource) =>
        resource.slug === entry.item_key ? { ...resource, saved: false } : resource
      )
    );
    try {
      await api.unsave(entry.item_type, entry.item_key);
      toast("Removed from Saved");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not remove that", "error");
      void load();
    }
  }

  async function toggleResource(resource: LibraryResource) {
    const next = !resource.saved;
    setResources((current) =>
      current.map((item) => (item.id === resource.id ? { ...item, saved: next } : item))
    );
    try {
      if (next) await api.save(resource.kind, resource.slug);
      else await api.unsave(resource.kind, resource.slug);
      toast(next ? `${TYPE_META[resource.kind].label} saved` : "Removed from Saved");
      const [saved, savedCounts] = await Promise.all([api.saved(), api.savedCounts()]);
      setItems(saved);
      setCounts(savedCounts);
    } catch (e) {
      setResources((current) =>
        current.map((item) => (item.id === resource.id ? { ...item, saved: !next } : item))
      );
      toast(e instanceof Error ? e.message : "Could not save that", "error");
    }
  }

  return (
    <>
      <PageHeader
        title="Saved"
        subtitle="Everything you have kept — articles, books, PDFs and videos, in one place"
        action={
          <div className="flex rounded-xl border border-border bg-card p-1">
            {(["saved", "browse"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  mode === value
                    ? "gradient-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {value === "saved" ? "My saved" : "Browse library"}
              </button>
            ))}
          </div>
        }
      />

      {error && <ErrorState message={error} onRetry={() => void load()} />}

      {mode === "saved" ? (
        <>
          <div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {TABS.map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={cn(
                  "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  tab === item.key
                    ? "gradient-primary text-primary-foreground shadow-soft"
                    : "bg-card text-muted-foreground hover:bg-muted"
                )}
              >
                {item.label}
                <span className="ml-1.5 opacity-70">{counts[item.key] ?? 0}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              icon={<Bookmark className="h-8 w-8" />}
              title="Nothing saved here yet"
              body="Save an article from your feed, or a book, PDF or video from the library. Everything you keep shows up here."
              action={
                <Button onClick={() => setMode("browse")}>
                  <BookOpen className="h-4 w-4" />
                  Browse the library
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {visible.map((entry) => {
                const meta = TYPE_META[entry.item_type];
                const Icon = meta.icon;
                const internal = entry.href.startsWith("/");
                return (
                  <Card key={entry.id} className="flex flex-col p-5 card-hover animate-fade-in">
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: `hsl(${entry.cover_hue} 70% 95%)` }}
                      >
                        <Icon
                          className="h-5 w-5"
                          style={{ color: `hsl(${entry.cover_hue} 60% 40%)` }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="muted">{meta.label}</Badge>
                        {entry.premium && (
                          <Badge variant="accent">
                            <Crown className="h-3 w-3" />
                            Premium
                          </Badge>
                        )}
                      </div>
                    </div>

                    <h3 className="mt-4 font-display font-bold leading-snug">{entry.title}</h3>
                    {entry.subtitle && (
                      <p className="mt-1 text-sm text-muted-foreground">{entry.subtitle}</p>
                    )}
                    {entry.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {entry.description}
                      </p>
                    )}
                    {entry.meta && (
                      <p className="mt-3 text-xs text-muted-foreground">{entry.meta}</p>
                    )}

                    <div className="mt-auto flex gap-2 pt-5">
                      {internal ? (
                        <Link to={entry.href} className="flex-1">
                          <Button className="w-full" size="sm">
                            Open
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          className="flex-1"
                          size="sm"
                          variant="outline"
                          disabled
                          title="Demo catalogue entry — no file is attached in this build"
                        >
                          <ExternalLink className="h-4 w-4" />
                          No file attached
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void remove(entry)}
                        aria-label={`Remove ${entry.title} from Saved`}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-3">
            <div className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search books, videos, PDFs…"
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={() => { setKind(null); setQuery(""); }}>
              <Filter className="h-4 w-4" />
              Clear
            </Button>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {(["book", "video", "pdf"] as const).map((value) => {
              const Icon = TYPE_META[value].icon;
              const active = kind === value;
              const total = resources.filter((resource) => resource.kind === value).length;
              return (
                <button
                  key={value}
                  onClick={() => setKind(active ? null : value)}
                  className="text-left"
                >
                  <Card
                    className={cn(
                      "flex items-center gap-4 p-5 card-hover",
                      active && "ring-2 ring-primary"
                    )}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-primary shadow-glow">
                      <Icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="font-display font-bold">{TYPE_META[value].plural}</div>
                      <div className="text-sm text-muted-foreground">{total} available</div>
                    </div>
                  </Card>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : browse.length === 0 ? (
            <EmptyState
              icon={<Search className="h-8 w-8" />}
              title="No resources match"
              body="Try a different search term or clear the filter."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {browse.map((resource) => {
                const Icon = TYPE_META[resource.kind].icon;
                return (
                  <Card
                    key={resource.id}
                    className="flex flex-col p-5 card-hover animate-fade-in"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: `hsl(${resource.cover_hue} 70% 95%)` }}
                      >
                        <Icon
                          className="h-5 w-5"
                          style={{ color: `hsl(${resource.cover_hue} 60% 40%)` }}
                        />
                      </div>
                      {resource.premium && (
                        <Badge variant="accent">
                          <Crown className="h-3 w-3" />
                          Premium
                        </Badge>
                      )}
                    </div>

                    <h3 className="mt-4 font-display font-bold leading-snug">{resource.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{resource.author}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {resource.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        {resource.rating}
                      </span>
                      <span>{resource.duration || `${resource.downloads} downloads`}</span>
                    </div>

                    <Button
                      className="mt-5 w-full"
                      variant={resource.saved ? "outline" : "default"}
                      onClick={() => void toggleResource(resource)}
                    >
                      <Bookmark className={cn("h-4 w-4", resource.saved && "fill-current")} />
                      {resource.saved ? "Saved" : "Save"}
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}
