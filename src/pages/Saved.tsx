import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark, BookOpen, Crown, ExternalLink, FileText, Newspaper, Trash2, Video,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { Cover } from "@/components/ui/cover";
import { useToast } from "@/components/ui/toast";
import { EmptyState, ErrorState, SkeletonCard } from "@/components/ui/states";
import { api, type SavedEntry, type SavedType } from "@/lib/api";
import { cn } from "@/lib/utils";

const TYPE_META: Record<SavedType, { label: string; icon: typeof BookOpen }> = {
  article: { label: "Article", icon: Newspaper },
  pdf: { label: "PDF", icon: FileText },
  book: { label: "Book", icon: BookOpen },
  video: { label: "Video", icon: Video },
};

const TABS: Array<{ key: SavedType | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "article", label: "Articles" },
  { key: "pdf", label: "PDFs" },
  { key: "book", label: "Books" },
  { key: "video", label: "Videos" },
];

/**
 * Saved — what this user kept.
 *
 * Separate from Library on purpose. Library is the catalogue of what exists;
 * this is a collection of references to it, plus articles from the feed.
 * Removing something here never removes it from the Library.
 */
export default function Saved() {
  const toast = useToast();

  const [tab, setTab] = useState<SavedType | "all">("all");
  const [items, setItems] = useState<SavedEntry[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [saved, savedCounts] = await Promise.all([api.saved(), api.savedCounts()]);
      setItems(saved);
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

  async function remove(entry: SavedEntry) {
    setItems((current) => current.filter((item) => item.id !== entry.id));
    setCounts((current) => ({
      ...current,
      all: Math.max(0, (current.all ?? 1) - 1),
      [entry.item_type]: Math.max(0, (current[entry.item_type] ?? 1) - 1),
    }));
    try {
      await api.unsave(entry.item_type, entry.item_key);
      toast(
        entry.item_type === "article"
          ? "Removed from Saved"
          : "Removed from Saved — still available in the Library"
      );
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not remove that", "error");
      void load();
    }
  }

  return (
    <>
      <PageHeader
        title="Saved"
        subtitle="Articles, PDFs, books and videos you have kept"
        action={
          <Link to="/library">
            <Button variant="outline">
              <BookOpen className="h-4 w-4" />
              Browse the Library
            </Button>
          </Link>
        }
      />

      {error && <ErrorState message={error} onRetry={() => void load()} />}

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              tab === item.key
                ? "bg-primary text-primary-foreground"
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
          body="Save an article from Your Feed, or a book, PDF or video from the Library. Whatever you keep stays available in its original section too."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link to="/library">
                <Button>
                  <BookOpen className="h-4 w-4" />
                  Browse the Library
                </Button>
              </Link>
              <Link to="/feed">
                <Button variant="outline">Open Your Feed</Button>
              </Link>
            </div>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {visible.map((entry) => {
            const meta = TYPE_META[entry.item_type];
            const Icon = meta.icon;
            const internal = entry.href.startsWith("/");
            return (
              <Card key={entry.id} className="flex gap-4 p-4 card-hover animate-fade-in">
                <div className="w-20 shrink-0 overflow-hidden rounded-lg border border-border">
                  <Cover src={entry.cover} width={180} height={240} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="muted">
                    <Icon className="h-3 w-3" aria-hidden="true" />
                    {meta.label}
                  </Badge>
                  {entry.premium && (
                    <Badge variant="accent">
                      <Crown className="h-3 w-3" aria-hidden="true" />
                      Premium
                    </Badge>
                  )}
                </div>

                <h3 className="mt-2 font-display font-bold leading-snug">{entry.title}</h3>
                {entry.subtitle && (
                  <p className="mt-1 text-sm text-muted-foreground">{entry.subtitle}</p>
                )}
                {entry.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {entry.description}
                  </p>
                )}
                {entry.meta && <p className="mt-3 text-xs text-muted-foreground">{entry.meta}</p>}

                <div className="mt-auto flex gap-2 pt-4">
                  {internal ? (
                    <Link to={entry.href} className="flex-1">
                      <Button className="w-full" size="sm">
                        Open
                      </Button>
                    </Link>
                  ) : entry.href ? (
                    <a href={entry.href} target="_blank" rel="noreferrer" className="flex-1">
                      <Button className="w-full" size="sm">
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </Button>
                    </a>
                  ) : (
                    <Link to="/library" className="flex-1">
                      <Button className="w-full" size="sm" variant="outline">
                        <BookOpen className="h-4 w-4" />
                        View in Library
                      </Button>
                    </Link>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void remove(entry)}
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
      )}
    </>
  );
}
