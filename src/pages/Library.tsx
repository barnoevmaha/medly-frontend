import { useMemo, useState } from "react";
import { BookOpen, Video, FileText, Search, Filter, Star, Download, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { library } from "@/data/content";
import { cn } from "@/lib/utils";

const kindIcons = { book: BookOpen, video: Video, file: FileText } as const;

export default function Library() {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<string | null>(null);

  const results = useMemo(
    () =>
      library.resources.filter(
        (r) =>
          (!kind || r.kind === kind) &&
          (r.title + r.author).toLowerCase().includes(query.toLowerCase())
      ),
    [query, kind]
  );

  return (
    <>
      <PageHeader title={library.title} subtitle={library.subtitle} />

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search books, videos, PDFs…"
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={() => { setKind(null); setQuery(""); }}>
          <Filter className="h-4 w-4" />
          Clear
        </Button>
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {library.categories.map((c) => {
          const Icon = kindIcons[c.icon as keyof typeof kindIcons];
          const key = c.icon;
          const active = kind === key;
          return (
            <button key={c.label} onClick={() => setKind(active ? null : key)} className="text-left">
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
                  <div className="font-display font-bold">{c.label}</div>
                  <div className="text-sm text-muted-foreground">{c.count}</div>
                </div>
              </Card>
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">{library.sectionTitle}</h2>
        <Button variant="link" size="sm">View All</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((r) => {
          const Icon = kindIcons[r.kind as keyof typeof kindIcons];
          return (
            <Card key={r.title} className="flex flex-col p-5 card-hover animate-fade-in">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                {r.premium && (
                  <Badge variant="accent">
                    <Crown className="h-3 w-3" />
                    Premium
                  </Badge>
                )}
              </div>
              <h3 className="mt-4 font-display font-bold leading-snug">{r.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{r.author}</p>
              <div className="mt-auto flex items-center justify-between pt-5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  {r.rating}
                </span>
                <span className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  {r.downloads}
                </span>
              </div>
            </Card>
          );
        })}
        {results.length === 0 && (
          <p className="col-span-full py-12 text-center text-muted-foreground">No resources found.</p>
        )}
      </div>
    </>
  );
}
