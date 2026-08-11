import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Bookmark, BookOpen, Crown, FileText, Newspaper, Play, Search, SlidersHorizontal,
  Star, Trash2, Video, X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { Cover } from "@/components/ui/cover";
import { useToast } from "@/components/ui/toast";
import { EmptyState, ErrorState, SkeletonCard } from "@/components/ui/states";
import {
  api,
  type ArticleSummary,
  type LibraryResource,
  type SavedEntry,
  type SavedType,
} from "@/lib/api";
import { cn } from "@/lib/utils";

/* Tab order is deliberate: video first because it is what students open most,
   Saved second because it is the thing they came back for. */
const TABS = [
  { key: "video", label: "Videos", icon: Video },
  { key: "saved", label: "Saved", icon: Bookmark },
  { key: "book", label: "Books", icon: BookOpen },
  { key: "pdf", label: "PDFs", icon: FileText },
  { key: "article", label: "Articles", icon: Newspaper },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const CTA: Record<string, string> = { video: "Watch", book: "Read", pdf: "Read", article: "Read" };
const TYPE_ICON: Record<SavedType, typeof BookOpen> = {
  article: Newspaper,
  book: BookOpen,
  pdf: FileText,
  video: Video,
};

/**
 * Library — everything available, plus what this student kept.
 *
 * Saved is a tab here rather than a nav entry of its own: it is a view of the
 * library filtered to your bookmarks, not a separate place. Saving never
 * removes anything from its type tab.
 */
export default function Library() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as TabKey) ?? "video";

  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [saved, setSaved] = useState<SavedEntry[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<string | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, feed, savedList, savedCounts] = await Promise.all([
        api.resources(),
        api.articles(),
        api.saved(),
        api.savedCounts(),
      ]);
      setResources(list);
      setArticles(feed);
      setSaved(savedList);
      setCounts(savedCounts);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the library");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const topics = useMemo(
    () => Array.from(new Set(resources.map((r) => r.topic).filter(Boolean))).sort(),
    [resources]
  );
  const levels = useMemo(
    () => Array.from(new Set(resources.map((r) => r.level).filter(Boolean))).sort(),
    [resources]
  );

  const needle = query.trim().toLowerCase();
  const activeFilters = [level, topic].filter(Boolean).length + (needle ? 1 : 0);

  /* One search box across the whole library — every tab, every field that
     actually exists on the record. */
  const visibleResources = useMemo(
    () =>
      resources.filter(
        (r) =>
          (tab === "saved" || r.kind === tab) &&
          (!level || r.level === level) &&
          (!topic || r.topic === topic) &&
          (!needle ||
            `${r.title} ${r.author} ${r.description} ${r.publisher} ${r.topic}`
              .toLowerCase()
              .includes(needle))
      ),
    [resources, tab, level, topic, needle]
  );

  const visibleArticles = useMemo(
    () =>
      articles.filter(
        (a) =>
          !needle ||
          `${a.title} ${a.excerpt} ${a.author} ${a.tag}`.toLowerCase().includes(needle)
      ),
    [articles, needle]
  );

  const visibleSaved = useMemo(
    () =>
      saved.filter(
        (s) => !needle || `${s.title} ${s.subtitle} ${s.description}`.toLowerCase().includes(needle)
      ),
    [saved, needle]
  );

  function clearFilters() {
    setLevel(null);
    setTopic(null);
    setQuery("");
  }

  async function refreshSaved() {
    const [savedList, savedCounts] = await Promise.all([api.saved(), api.savedCounts()]);
    setSaved(savedList);
    setCounts(savedCounts);
  }

  async function toggleResource(resource: LibraryResource) {
    const next = !resource.saved;
    setResources((current) =>
      current.map((item) => (item.id === resource.id ? { ...item, saved: next } : item))
    );
    try {
      if (next) await api.save(resource.kind, resource.slug);
      else await api.unsave(resource.kind, resource.slug);
      toast(next ? "Saved — still in the Library" : "Removed from Saved");
      await refreshSaved();
    } catch (e) {
      setResources((current) =>
        current.map((item) => (item.id === resource.id ? { ...item, saved: !next } : item))
      );
      toast(e instanceof Error ? e.message : "Could not save that", "error");
    }
  }

  async function toggleArticle(article: ArticleSummary) {
    const next = !article.saved;
    setArticles((current) =>
      current.map((item) => (item.id === article.id ? { ...item, saved: next } : item))
    );
    try {
      if (next) await api.save("article", article.slug);
      else await api.unsave("article", article.slug);
      toast(next ? "Saved" : "Removed from Saved");
      await refreshSaved();
    } catch (e) {
      setArticles((current) =>
        current.map((item) => (item.id === article.id ? { ...item, saved: !next } : item))
      );
      toast(e instanceof Error ? e.message : "Could not save that", "error");
    }
  }

  async function removeSaved(entry: SavedEntry) {
    setSaved((current) => current.filter((item) => item.id !== entry.id));
    try {
      await api.unsave(entry.item_type, entry.item_key);
      toast("Removed from Saved");
      setResources((current) =>
        current.map((item) => (item.slug === entry.item_key ? { ...item, saved: false } : item))
      );
      setArticles((current) =>
        current.map((item) => (item.slug === entry.item_key ? { ...item, saved: false } : item))
      );
      setCounts(await api.savedCounts());
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not remove that", "error");
      void load();
    }
  }

  const tabCount = (key: TabKey) =>
    key === "saved"
      ? counts.all ?? 0
      : key === "article"
      ? articles.length
      : resources.filter((r) => r.kind === key).length;

  return (
    <>
      <PageHeader
        title="Library"
        subtitle="Videos, books, PDFs and articles — plus everything you have saved"
      />

      {/* ---------------- search + filters ---------------- */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the whole library…"
            className="pl-9"
            aria-label="Search the library"
            type="search"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setFiltersOpen((value) => !value)}
          aria-expanded={filtersOpen}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filter
          {activeFilters > 0 && (
            <span className="ml-1 rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
              {activeFilters}
            </span>
          )}
        </Button>
        {/* "Clear" only exists while something is filtered. */}
        {activeFilters > 0 && (
          <Button variant="ghost" onClick={clearFilters}>
            Clear all
          </Button>
        )}
      </div>

      {filtersOpen && (levels.length > 0 || topics.length > 0) && (
        <Card className="mb-4 p-5 animate-fade-up">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display font-bold">Filters</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Built from the catalogue — only values that exist appear here.
              </p>
            </div>
            <button
              onClick={() => setFiltersOpen(false)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
              aria-label="Close filters"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <fieldset className="mt-4">
            <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Level
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {levels.map((value) => (
                <button
                  key={value}
                  onClick={() => setLevel(level === value ? null : value)}
                  aria-pressed={level === value}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors",
                    level === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-4">
            <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Subject
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {topics.map((value) => (
                <button
                  key={value}
                  onClick={() => setTopic(topic === value ? null : value)}
                  aria-pressed={topic === value}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    topic === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          </fieldset>
        </Card>
      )}

      {/* Active filter chips */}
      {activeFilters > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {needle && (
            <Badge variant="muted">
              “{query.trim()}”
              <button onClick={() => setQuery("")} aria-label="Clear search">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {level && (
            <Badge variant="muted">
              <span className="capitalize">{level}</span>
              <button onClick={() => setLevel(null)} aria-label={`Remove ${level} filter`}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {topic && (
            <Badge variant="muted">
              {topic}
              <button onClick={() => setTopic(null)} aria-label={`Remove ${topic} filter`}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* ---------------- tabs ---------------- */}
      <div
        className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        role="tablist"
        aria-label="Library sections"
      >
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setParams(key === "video" ? {} : { tab: key })}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              tab === key
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
            <span className="opacity-70">{tabCount(key)}</span>
          </button>
        ))}
      </div>

      {error && <ErrorState message={error} onRetry={() => void load()} />}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : tab === "saved" ? (
        /* ---------------- saved ---------------- */
        visibleSaved.length === 0 ? (
          <EmptyState
            icon={<Bookmark className="h-8 w-8" />}
            title={needle ? "Nothing saved matches that" : "Nothing saved yet"}
            body="Bookmark a video, book, PDF or article and it collects here. Saving never removes it from its own tab."
            action={
              <Button onClick={() => setParams({})}>
                <Video className="h-4 w-4" aria-hidden="true" />
                Browse videos
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {visibleSaved.map((entry) => {
              const Icon = TYPE_ICON[entry.item_type];
              const internal = entry.href.startsWith("/");
              return (
                <Card key={entry.id} className="flex gap-4 p-4 card-hover animate-fade-in">
                  <div className="w-20 shrink-0 overflow-hidden rounded-lg border border-border">
                    <Cover src={entry.cover} width={180} height={240} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Badge variant="muted" className="self-start">
                      <Icon className="h-3 w-3" aria-hidden="true" />
                      {entry.item_type}
                    </Badge>
                    <h3 className="mt-2 font-display font-bold leading-snug">{entry.title}</h3>
                    {entry.subtitle && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{entry.subtitle}</p>
                    )}
                    {entry.meta && (
                      <p className="mt-2 text-xs text-muted-foreground">{entry.meta}</p>
                    )}
                    <div className="mt-auto flex gap-2 pt-4">
                      {internal && (
                        <Link to={entry.href} className="flex-1">
                          <Button className="w-full" size="sm">
                            Read
                          </Button>
                        </Link>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className={internal ? "" : "flex-1"}
                        onClick={() => void removeSaved(entry)}
                        aria-label={`Remove ${entry.title} from Saved`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : tab === "article" ? (
        /* ---------------- articles: editorial cards ---------------- */
        visibleArticles.length === 0 ? (
          <EmptyState
            icon={<Search className="h-8 w-8" />}
            title="No articles match"
            body="Try a broader term — article search covers the full text."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visibleArticles.map((article) => (
              <Card
                key={article.id}
                className="flex flex-col overflow-hidden p-0 card-hover animate-fade-in"
              >
                <Link to={`/feed/${article.slug}`} tabIndex={-1} aria-hidden="true">
                  <Cover
                    src={article.cover}
                    width={360}
                    height={200}
                    className="border-b border-border"
                  />
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant={article.tag === "Sponsored" ? "muted" : "default"}>
                      {article.tag}
                    </Badge>
                    <span>{article.read_minutes} min read</span>
                  </div>
                  <Link to={`/feed/${article.slug}`} className="group mt-3">
                    <h3 className="font-display text-lg font-bold leading-snug group-hover:text-primary">
                      {article.title}
                    </h3>
                  </Link>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {article.excerpt}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">{article.author}</p>
                  <div className="mt-auto flex gap-2 pt-4">
                    <Link to={`/feed/${article.slug}`} className="flex-1">
                      <Button className="w-full" size="sm">
                        Read
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant={article.saved ? "outline" : "default"}
                      onClick={() => void toggleArticle(article)}
                      aria-pressed={article.saved}
                      aria-label={article.saved ? "Remove from Saved" : `Save ${article.title}`}
                    >
                      <Bookmark
                        className={cn("h-4 w-4", article.saved && "fill-current")}
                        aria-hidden="true"
                      />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : /* ---------------- videos / books / pdfs ---------------- */
      visibleResources.length === 0 ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="Nothing here matches"
          body="Try a different search term, or clear the filters."
          action={
            activeFilters > 0 ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear all
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {visibleResources.map((resource) => (
            <Card key={resource.id} className="flex gap-4 p-4 card-hover animate-fade-in">
              <div className="relative w-24 shrink-0 overflow-hidden rounded-lg border border-border">
                <Cover src={resource.cover} width={180} height={240} />
                {resource.kind === "video" && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <Play className="h-6 w-6 fill-white text-white" aria-hidden="true" />
                  </span>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex flex-wrap items-center gap-2">
                  {resource.level && (
                    <Badge variant="muted" className="capitalize">
                      {resource.level}
                    </Badge>
                  )}
                  {resource.premium && (
                    <Badge variant="accent">
                      <Crown className="h-3 w-3" aria-hidden="true" />
                      Premium
                    </Badge>
                  )}
                </div>

                <h3 className="mt-2 font-display font-bold leading-snug">{resource.title}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{resource.author}</p>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {resource.description}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden="true" />
                    {resource.rating}
                  </span>
                  {resource.topic && <span>{resource.topic}</span>}
                  {resource.year ? <span>{resource.year}</span> : null}
                  {resource.pages ? <span>{resource.pages} pages</span> : null}
                  {resource.duration ? <span>{resource.duration}</span> : null}
                </div>

                <div className="mt-auto flex gap-2 pt-4">
                  <Button
                    className="flex-1"
                    size="sm"
                    disabled={!resource.url}
                    title={resource.url ? undefined : "No file attached in this build"}
                    onClick={() => resource.url && window.open(resource.url, "_blank", "noopener")}
                  >
                    {CTA[resource.kind] ?? "Open"}
                    <span className="sr-only"> {resource.title}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant={resource.saved ? "outline" : "default"}
                    onClick={() => void toggleResource(resource)}
                    aria-pressed={resource.saved}
                    aria-label={resource.saved ? "Remove from Saved" : `Save ${resource.title}`}
                  >
                    <Bookmark
                      className={cn("h-4 w-4", resource.saved && "fill-current")}
                      aria-hidden="true"
                    />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
