import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Bell, Eye, KeyRound, Loader2, LogOut, Monitor, Moon, Palette,
  Sun, Trash2, User as UserIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/PageHeader";
import { useToast } from "@/components/ui/toast";
import { LoadingState } from "@/components/ui/states";
import { useSession } from "@/lib/session";
import {
  readPreferences,
  writePreferences,
  type Preferences,
  type Theme,
} from "@/lib/preferences";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {hint && <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
          checked ? "gradient-primary" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-card shadow-soft transition-transform",
            checked ? "translate-x-[1.375rem]" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}

const THEMES: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/**
 * Settings.
 *
 * Split by where the setting actually lives: account, privacy and security go
 * to the API; theme, motion and confirmation toasts are device preferences kept
 * in localStorage. Nothing here is decorative — every control changes real
 * behaviour, which is why there is no notification section full of email
 * switches for emails this app does not send.
 */
export default function Settings() {
  const toast = useToast();
  const { me, refresh, logout } = useSession();

  const [preferences, setPreferences] = useState<Preferences>(readPreferences);
  const [account, setAccount] = useState({ full_name: "", institution: "", year_of_study: "" });
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [busyPrivacy, setBusyPrivacy] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (!me) return;
    setAccount({
      full_name: me.full_name,
      institution: me.institution ?? "",
      year_of_study: me.year_of_study ? String(me.year_of_study) : "",
    });
  }, [me]);

  function updatePreference(patch: Partial<Preferences>) {
    const next = { ...preferences, ...patch };
    setPreferences(next);
    writePreferences(next);
  }

  async function saveAccount(event: React.FormEvent) {
    event.preventDefault();
    setSavingAccount(true);
    try {
      await api.updateMe({
        full_name: account.full_name,
        institution: account.institution,
        year_of_study: account.year_of_study ? Number(account.year_of_study) : undefined,
      });
      await refresh();
      toast("Account details saved");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save your details", "error");
    } finally {
      setSavingAccount(false);
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    if (passwords.next !== passwords.confirm) {
      toast("The two new passwords do not match", "error");
      return;
    }
    setSavingPassword(true);
    try {
      await api.changePassword(passwords.current, passwords.next);
      setPasswords({ current: "", next: "", confirm: "" });
      toast("Password changed");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not change your password", "error");
    } finally {
      setSavingPassword(false);
    }
  }

  async function setLeaderboardVisibility(value: boolean) {
    setBusyPrivacy(true);
    try {
      await api.updateMe({ show_on_leaderboard: value });
      await refresh();
      toast(value ? "You appear on the leaderboard" : "You are hidden from the leaderboard");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not update that", "error");
    } finally {
      setBusyPrivacy(false);
    }
  }

  async function clearAssistantHistory() {
    setClearing(true);
    try {
      await api.clearAssistantHistory();
      toast("Assistant history deleted");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not clear your history", "error");
    } finally {
      setClearing(false);
    }
  }

  if (!me) return <LoadingState label="Loading settings…" />;

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Your account, privacy and how Medly looks on this device"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ---------------- account ---------------- */}
        <Section
          icon={<UserIcon className="h-5 w-5" />}
          title="Account"
          description="How you appear across Medly"
        >
          <form onSubmit={saveAccount} className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium">Full name</span>
              <Input
                className="mt-1.5"
                value={account.full_name}
                onChange={(event) => setAccount({ ...account, full_name: event.target.value })}
                required
                minLength={2}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Institution</span>
              <Input
                className="mt-1.5"
                value={account.institution}
                onChange={(event) => setAccount({ ...account, institution: event.target.value })}
                placeholder="e.g. Columbia University"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Year of study</span>
              <Input
                className="mt-1.5"
                type="number"
                min={1}
                max={10}
                value={account.year_of_study}
                onChange={(event) => setAccount({ ...account, year_of_study: event.target.value })}
                placeholder="e.g. 3"
              />
            </label>

            <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{me.email}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">Role</span>
                <Badge variant="info">{me.role}</Badge>
                {me.is_premium && <Badge variant="accent">Premium</Badge>}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Email and role are set by your institution and cannot be changed here.
              </p>
            </div>

            <Button type="submit" disabled={savingAccount}>
              {savingAccount && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </form>
        </Section>

        {/* ---------------- security ---------------- */}
        <Section
          icon={<KeyRound className="h-5 w-5" />}
          title="Security"
          description="Change your password"
        >
          <form onSubmit={savePassword} className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium">Current password</span>
              <Input
                className="mt-1.5"
                type="password"
                autoComplete="current-password"
                value={passwords.current}
                onChange={(event) => setPasswords({ ...passwords, current: event.target.value })}
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">New password</span>
              <Input
                className="mt-1.5"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={passwords.next}
                onChange={(event) => setPasswords({ ...passwords, next: event.target.value })}
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Confirm new password</span>
              <Input
                className="mt-1.5"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={passwords.confirm}
                onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })}
                required
              />
            </label>
            <p className="text-xs text-muted-foreground">
              At least 8 characters. Your current password is required — holding a valid session
              should not be enough to lock the owner out of their own account.
            </p>
            <Button type="submit" disabled={savingPassword}>
              {savingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
              Change password
            </Button>
          </form>
        </Section>

        {/* ---------------- privacy ---------------- */}
        <Section
          icon={<Eye className="h-5 w-5" />}
          title="Privacy"
          description="What other students can see, and what Medly keeps"
        >
          <div className="divide-y divide-border">
            <Toggle
              label="Show me on the leaderboard"
              hint="Turn this off and your name disappears from the public ranking. Your own rank is still calculated and shown to you."
              checked={me.show_on_leaderboard}
              disabled={busyPrivacy}
              onChange={(value) => void setLeaderboardVisibility(value)}
            />
            <div className="py-3">
              <div className="text-sm font-medium">Assistant conversation history</div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Deletes every message you have exchanged with the study assistant. The governance
                audit log is deliberately not touched — that is the institution's record that an
                AI interaction happened, and a platform that let people erase it would not be
                auditable.
              </p>
              <Button
                className="mt-3"
                size="sm"
                variant="outline"
                onClick={() => void clearAssistantHistory()}
                disabled={clearing}
              >
                {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete my assistant history
              </Button>
            </div>
            <div className="py-3">
              <div className="text-sm font-medium">Patient data</div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Medly never stores patient-identifying data. Case images are anonymised and
                verified by a teacher before any student can load them.{" "}
                <Link to="/governance" className="text-primary hover:underline">
                  See the safety standard
                </Link>
                .
              </p>
            </div>
          </div>
        </Section>

        {/* ---------------- appearance ---------------- */}
        <Section
          icon={<Palette className="h-5 w-5" />}
          title="Appearance"
          description="Applies to this browser only"
        >
          <div className="text-sm font-medium">Theme</div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {THEMES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => updatePreference({ theme: value })}
                aria-pressed={preferences.theme === value}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors",
                  preferences.theme === value
                    ? "border-primary/50 bg-primary/10 text-foreground"
                    : "border-border hover:bg-muted"
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4 divide-y divide-border border-t border-border">
            <Toggle
              label="Reduce motion"
              hint="Turns off card lifts and fade-in animations across the app."
              checked={preferences.reduceMotion}
              onChange={(value) => updatePreference({ reduceMotion: value })}
            />
          </div>
        </Section>

        {/* ---------------- notifications ---------------- */}
        <Section
          icon={<Bell className="h-5 w-5" />}
          title="Notifications"
          description="In-app feedback"
        >
          <div className="divide-y divide-border">
            <Toggle
              label="Confirmation messages"
              hint="The small confirmations after saving an article, posting a comment or joining a community. Errors always show regardless."
              checked={preferences.toasts}
              onChange={(value) => updatePreference({ toasts: value })}
            />
          </div>
          <p className="mt-3 rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            Medly does not send email or push notifications, so there is nothing here to switch
            off. Rather than show toggles that do nothing, this section only lists what actually
            exists.
          </p>
        </Section>

        {/* ---------------- session ---------------- */}
        <Section
          icon={<LogOut className="h-5 w-5" />}
          title="Session"
          description="Sign out of this device"
        >
          <p className="text-sm text-muted-foreground">
            Signing out clears the token stored in this browser. Your saved items, points and
            progress are on the server and will be waiting when you sign back in.
          </p>
          <Button className="mt-4" variant="outline" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </Section>
      </div>
    </>
  );
}
