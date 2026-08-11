import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Check, Crown, Loader2, Lock, MessageSquare, Plus, Search, Users, X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { useToast } from "@/components/ui/toast";
import { EmptyState, ErrorState, SkeletonCard } from "@/components/ui/states";
import { ApiError, api, type CommunityPermissions, type CommunitySummary } from "@/lib/api";
import { cn } from "@/lib/utils";

const FILTERS = ["All", "My Communities", "Popular", "New"];

export default function Community() {
  const navigate = useNavigate();
  const toast = useToast();

  const [communities, setCommunities] = useState<CommunitySummary[]>([]);
  const [permissions, setPermissions] = useState<CommunityPermissions | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", specialty: "", emoji: "🩺" });
  const [creating, setCreating] = useState(false);
  const debounce = useRef<number>();
  const touched = useRef(false);

  // Search is scoped server-side to the name and the description under it.
  const load = useCallback(async (nextQuery: string, nextFilter: string) => {
    try {
      setCommunities(await api.communities({ q: nextQuery, filter: nextFilter }));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load communities");
    }
  }, []);

  useEffect(() => {
    Promise.all([api.communities(), api.communityPermissions()])
      .then(([list, perms]) => {
        setCommunities(list);
        setPermissions(perms);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load communities"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!touched.current) {
      touched.current = true;
      return;
    }
    window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => void load(query, filter), 200);
    return () => window.clearTimeout(debounce.current);
  }, [query, filter, loading, load]);

  async function toggleMembership(community: CommunitySummary) {
    try {
      const updated = community.joined
        ? await api.leaveCommunity(community.slug)
        : await api.joinCommunity(community.slug);
      setCommunities((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      toast(updated.joined ? `Joined ${updated.name}` : `Left ${updated.name}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "That did not work", "error");
    }
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    try {
      const created = await api.createCommunity({
        name: form.name.trim(),
        description: form.description.trim(),
        specialty: form.specialty.trim() || "General",
        emoji: form.emoji || "🩺",
      });
      toast(`${created.name} created`);
      setComposing(false);
      setForm({ name: "", description: "", specialty: "", emoji: "🩺" });
      navigate(`/community/${created.slug}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        // The server is the authority here; the UI just reports what it said.
        toast(e.message, "error");
        setComposing(false);
        navigate("/premium");
      } else {
        toast(e instanceof Error ? e.message : "Could not create that community", "error");
      }
    } finally {
      setCreating(false);
    }
  }

  const canCreate = permissions?.can_create ?? false;

  return (
    <>
      <PageHeader
        title="Communities"
        subtitle="Join communities based on your specialty interests"
        action={
          canCreate ? (
            <Button onClick={() => setComposing((value) => !value)}>
              {composing ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {composing ? "Cancel" : "Create Community"}
            </Button>
          ) : (
            <Link to="/premium">
              <Button variant="outline">
                <Crown className="h-4 w-4" />
                Premium to create
              </Button>
            </Link>
          )
        }
      />

      {!canCreate && permissions && (
        <Card className="mb-6 border-accent/30 bg-accent/5 p-5">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div>
              <h3 className="font-display font-bold">Creating a community is a Premium feature</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You can join and take part in every community on Medly. Starting your own needs
                Premium — and the rule is enforced by the API, so it holds for any client, not
                just this page.
              </p>
              <Link to="/premium">
                <Button className="mt-3" size="sm" variant="accent">
                  <Crown className="h-4 w-4" />
                  See Premium
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {composing && canCreate && (
        <Card className="mb-6 p-6 animate-fade-up">
          <h3 className="font-display text-lg font-bold">New community</h3>
          <form onSubmit={create} className="mt-4 space-y-3">
            <div className="flex gap-3">
              <Input
                value={form.emoji}
                onChange={(event) => setForm({ ...form, emoji: event.target.value.slice(0, 2) })}
                className="w-16 text-center"
                aria-label="Emoji"
              />
              <Input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Community name"
                required
                minLength={3}
                aria-label="Community name"
              />
            </div>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="What is this community for? This line appears under the title and is what community search matches."
              required
              minLength={10}
              aria-label="Description"
            />
            <Input
              value={form.specialty}
              onChange={(event) => setForm({ ...form, specialty: event.target.value })}
              placeholder="Specialty, e.g. Cardiology"
              aria-label="Specialty"
            />
            <Button type="submit" disabled={creating}>
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Create community
            </Button>
          </form>
        </Card>
      )}

      <div className="relative mb-5">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search communities by name or description…"
          className="pl-9"
          aria-label="Search communities"
        />
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
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

      {error && <ErrorState message={error} onRetry={() => void load(query, filter)} />}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : communities.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="No communities found"
          body={
            query
              ? `Nothing matches “${query}” in a community name or description.`
              : "Nothing here under this filter yet."
          }
          action={
            <Button variant="outline" onClick={() => { setQuery(""); setFilter("All"); }}>
              Clear search
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {communities.map((community) => (
            <Card key={community.id} className="flex flex-col p-5 card-hover animate-fade-in">
              <div className="flex items-start justify-between gap-3">
                <Link to={`/community/${community.slug}`} className="group min-w-0">
                  <h3 className="flex items-center gap-2 font-display text-lg font-bold group-hover:text-primary">
                    <span aria-hidden>{community.emoji}</span>
                    <span className="truncate">{community.name}</span>
                  </h3>
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  {community.owned && <Badge variant="accent">Yours</Badge>}
                  {community.joined && (
                    <Badge variant="success">
                      <Check className="h-3 w-3" />
                      Joined
                    </Badge>
                  )}
                </div>
              </div>

              <p className="mt-2 text-sm text-muted-foreground">{community.description}</p>

              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {community.members.toLocaleString()} members
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4" />
                  {community.messages} messages
                </span>
              </div>

              <div className="mt-5 flex gap-2">
                <Link to={`/community/${community.slug}`} className="flex-1">
                  <Button className="w-full">Open chat</Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => void toggleMembership(community)}
                >
                  {community.joined ? "Leave" : "Join"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
