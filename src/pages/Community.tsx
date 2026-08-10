import { useMemo, useState } from "react";
import { Search, Plus, Users, MessageSquare, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { community } from "@/data/content";
import { cn } from "@/lib/utils";

export default function Community() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [joined, setJoined] = useState<Record<string, boolean>>(
    Object.fromEntries(community.groups.map((g) => [g.name, g.joined]))
  );

  const groups = useMemo(
    () =>
      community.groups.filter(
        (g) =>
          (filter !== "My Communities" || joined[g.name]) &&
          (g.name + g.body).toLowerCase().includes(query.toLowerCase())
      ),
    [query, filter, joined]
  );

  return (
    <>
      <PageHeader
        title={community.title}
        subtitle={community.subtitle}
        action={
          <Button>
            <Plus className="h-4 w-4" />
            {community.createCta}
          </Button>
        }
      />

      <div className="relative mb-5">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search communities…"
          className="pl-9"
        />
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {community.filters.map((f) => (
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

      <div className="grid gap-4 sm:grid-cols-2">
        {groups.map((g) => {
          const isJoined = joined[g.name];
          return (
            <Card key={g.name} className="flex flex-col p-5 card-hover animate-fade-in">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-lg font-bold">{g.name}</h3>
                {isJoined && (
                  <Badge variant="success">
                    <Check className="h-3 w-3" />
                    Joined
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{g.body}</p>
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {g.members} members
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4" />
                  {g.posts} posts/day
                </span>
              </div>
              <Button
                variant={isJoined ? "outline" : "default"}
                className="mt-5 w-full"
                onClick={() => setJoined((s) => ({ ...s, [g.name]: !s[g.name] }))}
              >
                {isJoined ? "Leave" : "Join"}
              </Button>
            </Card>
          );
        })}
        {groups.length === 0 && (
          <p className="col-span-full py-12 text-center text-muted-foreground">No communities found.</p>
        )}
      </div>
    </>
  );
}
