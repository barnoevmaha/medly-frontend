import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import { site } from "@/config/site";

const DEMO_ACCOUNTS = [
  { email: "student@medly.dev", note: "not certified — AI locked" },
  { email: "certified@medly.dev", note: "certified — AI unlocked" },
  { email: "instructor@medly.dev", note: "sees all audit data" },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refresh } = useSession();
  // Set by AppLayout when it bounces an unauthenticated visit.
  const from = (location.state as { from?: string } | null)?.from;
  const [email, setEmail] = useState("certified@medly.dev");
  const [password, setPassword] = useState("medly1234");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.login(email, password);
      // Populate the shared session before navigating, or the first page after
      // sign-in renders with no user and has to fetch it again.
      await refresh();
      navigate(from ?? "/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center gradient-hero px-4">
      <Card className="w-full max-w-sm p-7 shadow-medium">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary shadow-glow">
            <span className="text-xl font-bold text-primary-foreground">{site.initial}</span>
          </div>
          <span className="font-display text-2xl font-bold text-gradient">{site.name}</span>
        </div>

        <h1 className="mt-6 font-display text-xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to continue your AI safety training.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="username"
          />
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </Button>
        </form>

        <div className="mt-6 border-t border-border pt-4">
          <p className="text-xs font-semibold text-muted-foreground">Seeded demo accounts</p>
          <ul className="mt-2 space-y-1.5">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.email}>
                <button
                  onClick={() => {
                    setEmail(account.email);
                    setPassword("medly1234");
                  }}
                  className="w-full rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted"
                >
                  <span className="font-medium">{account.email}</span>
                  <span className="text-muted-foreground"> — {account.note}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 px-2 text-xs text-muted-foreground">Password: medly1234</p>
        </div>
      </Card>
    </div>
  );
}
