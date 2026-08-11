import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark, BookOpen, Crown, FileText, Filter, Search, Star, Video, X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { useToast } from "@/components/ui/toast";
import { EmptyState, ErrorState, SkeletonCard } from "@/components/ui/states";
import { api, type LibraryResource } from "@/lib/api";
import { cn } from "@/lib/utils";

const KINDS = {
  book: { label: "Books", singular: "Book", icon: BookOpen },
  pdf: { label: "PDFs", singular: "PDF", icon: FileText },
  video: { label: "Videos", singular: "Video", icon: Video },
} as const;

type Kind = keyof typeof KINDS;

/**
 * Library — the catalogue of educational resources.
 *
 * Distinct from Saved: this is everything available, Saved is what this user
 * kept. Saving from here adds a row to the Saved collection and leaves the
 * resource exactly where it is.
 */
export default function Library() {
  const toast = useToast();

  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [open, setOpen] = useState<LibraryResource | null>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<Kind | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, counts] = await Promise.all([api.resources(), api.savedCounts()]);
      setResources(list);
      setSavedCount(counts.all ?? 0);
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

  const results = useMemo(() => {
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

  async function toggleSave(resource: LibraryResource) {
    const next = !resource.saved;
    setResources((current) =>
      current.map((item) => (item.id === resource.id ? { ...item, saved: next } : item))
    );
    if (open?.id === resource.id) setOpen({ ...open, saved: next });
    try {
      if (next) await api.save(resource.kind, resource.slug);
      else await api.unsave(resource.kind, resource.slug);
      // Saving copies a reference into Saved; the resource stays in the library.
      toast(
        next
          ? `${KINDS[resource.kind].singular} saved — still here in the Library`
          : "Removed from Saved"
      );
      setSavedCount((await api.savedCounts()).all ?? 0);
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
        title="Library"
        subtitle="Books, PDFs and videos available to every student"
        action={
          <Link to="/saved">
            <Button variant="outline">
              <Bookmark className="h-4 w-4" />
              Saved
              <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {savedCount}
              </span>
            </Button>
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search books, PDFs and videos…"
            className="pl-9"
            aria-label="Search the library"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setKind(null);
            setQuery("");
          }}
        >
          <Filter className="h-4 w-4" />
          Clear
        </Button>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {(Object.keys(KINDS) as Kind[]).map((value) => {
          const Icon = KINDS[value].icon;
          const active = kind === value;
          const total = resources.filter((resource) => resource.kind === value).length;
          return (
            <button key={value} onClick={() => setKind(active ? null : value)} className="text-left">
              <Card
                className={cn("flex items-center gap-4 p-5 card-hover", active && "ring-2 ring-primary")}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-primary shadow-glow">
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-display font-bold">{KINDS[value].label}</div>
                  <div className="text-sm text-muted-foreground">{total} available</div>
                </div>
              </Card>
            </button>
          );
        })}
      </div>

      {error && <ErrorState message={error} onRetry={() => void load()} />}

      <h2 className="mb-4 font-display text-2xl font-bold">
        {kind ? KINDS[kind].label : "All resources"}
        <span className="ml-2 text-base font-medium text-muted-foreground">
          ({results.length})
        </span>
      </h2>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="No resources match"
          body="Try a different search term or clear the filter."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((resource) => {
            const Icon = KINDS[resource.kind].icon;
            return (
              <Card key={resource.id} className="flex flex-col p-5 card-hover animate-fade-in">
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `hsl(${resource.cover_hue} 70% 92% / 0.35)` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: `hsl(${resource.cover_hue} 60% 50%)` }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="muted">{KINDS[resource.kind].singular}</Badge>
                    {resource.premium && (
                      <Badge variant="accent">
                        <Crown className="h-3 w-3" />
                        Premium
                      </Badge>
                    )}
                  </div>
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

                <div className="mt-auto flex gap-2 pt-5">
                  <Button className="flex-1" size="sm" onClick={() => setOpen(resource)}>
                    Open
                  </Button>
                  <Button
                    size="sm"
                    variant={resource.saved ? "outline" : "default"}
                    onClick={() => void toggleSave(resource)}
                    aria-pressed={resource.saved}
                    aria-label={resource.saved ? "Remove from Saved" : "Save to your collection"}
                  >
                    <Bookmark className={cn("h-4 w-4", resource.saved && "fill-current")} />
                    {resource.saved ? "Saved" : "Save"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 md:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={open.title}
          onClick={() => setOpen(null)}
        >
          <Card
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto p-6 shadow-medium animate-fade-up"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge variant="muted">{KINDS[open.kind].singular}</Badge>
                <h2 className="mt-3 font-display text-xl font-bold">{open.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{open.author}</p>
              </div>
              <button
                onClick={() => setOpen(null)}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 text-sm">{open.description}</p>

            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Rating</dt>
                <dd className="font-semibold">{open.rating} / 5</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  {open.kind === "video" ? "Length" : "Downloads"}
                </dt>
                <dd className="font-semibold">{open.duration || open.downloads}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Access</dt>
                <dd className="font-semibold">{open.premium ? "Premium" : "All students"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">In your Saved</dt>
                <dd className="font-semibold">{open.saved ? "Yes" : "No"}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-2">
              {open.url ? (
                <a href={open.url} target="_blank" rel="noreferrer" className="flex-1">
                  <Button className="w-full">Open resource</Button>
                </a>
              ) : (
                <p className="flex-1 rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                  Catalogue entry — no file is attached in this build, so there is nothing to
                  download yet. Saving it still works.
                </p>
              )}
              <Button
                variant={open.saved ? "outline" : "default"}
                onClick={() => void toggleSave(open)}
              >
                <Bookmark className={cn("h-4 w-4", open.saved && "fill-current")} />
                {open.saved ? "Saved" : "Save"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
