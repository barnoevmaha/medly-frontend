import { NavLink } from "react-router-dom";
import { Bookmark, Crown, LogOut } from "lucide-react";
import { navItems, site } from "@/config/site";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { me, logout } = useSession();

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col border-r border-border bg-card shadow-soft md:flex">
      <NavLink to="/" className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-glow">
          <span className="text-xl font-bold text-primary-foreground">{site.initial}</span>
        </div>
        <span className="font-display text-2xl font-bold text-gradient">{site.name}</span>
      </NavLink>

      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map(({ label, to, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    "relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 h-8 w-1 rounded-full gradient-primary" />
                    )}
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-1 border-t border-border p-3">
        <NavLink
          to="/saved"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )
          }
        >
          <Bookmark className="h-5 w-5" />
          <span className="font-medium">Saved</span>
        </NavLink>
        {me && (
          <div className="px-4 py-2">
            <p className="truncate text-sm font-semibold">{me.full_name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {me.is_premium ? "Premium" : "Free"} · {me.points.toLocaleString()} pts
            </p>
          </div>
        )}
        {!me?.is_premium && (
          <NavLink
            to="/premium"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-accent transition-colors hover:bg-accent/10"
          >
            <Crown className="h-5 w-5" />
            <span className="font-medium">Go Premium</span>
          </NavLink>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Log out</span>
        </button>
      </div>
    </aside>
  );
}
