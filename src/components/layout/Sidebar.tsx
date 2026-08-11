import { NavLink } from "react-router-dom";
import { Crown, LogOut, Settings } from "lucide-react";
import { navItems, site, staffNavItems, type NavItem } from "@/config/site";
import { Avatar } from "@/components/ui/avatar";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

function itemClass(isActive: boolean) {
  return cn(
    "relative flex items-center gap-3 rounded-xl px-4 py-2.5 transition-colors duration-200",
    isActive
      ? "bg-primary/10 text-primary"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  );
}

function Item({ label, to, icon: Icon }: NavItem) {
  return (
    <li>
      <NavLink to={to} className={({ isActive }) => itemClass(isActive)}>
        {({ isActive }) => (
          <>
            {isActive && (
              <span className="absolute left-0 h-7 w-1 rounded-full bg-primary" aria-hidden="true" />
            )}
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="font-medium">{label}</span>
          </>
        )}
      </NavLink>
    </li>
  );
}

export function Sidebar() {
  const { me, logout } = useSession();
  const isStaff = me?.role === "instructor" || me?.role === "admin";

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col border-r border-border bg-card md:flex">
      <NavLink to="/dashboard" className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
          <span className="text-xl font-bold text-primary-foreground">{site.initial}</span>
        </div>
        <span className="font-display text-2xl font-bold text-gradient">{site.name}</span>
      </NavLink>

      <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Main">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <Item key={item.to} {...item} />
          ))}
        </ul>

        {/* Teaching tools, for accounts that have them. */}
        {isStaff && (
          <>
            <p className="mt-6 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Teaching
            </p>
            <ul className="mt-2 space-y-1">
              {staffNavItems.map((item) => (
                <Item key={item.to} {...item} />
              ))}
            </ul>
          </>
        )}
      </nav>

      {/* Go Premium, then Settings, then Log out. */}
      <div className="space-y-1 border-t border-border p-3">
        {me && (
          <NavLink to="/profile" className="mb-1 flex items-center gap-3 rounded-xl px-4 py-2.5 hover:bg-muted">
            <Avatar name={me.full_name} className="h-8 w-8 shrink-0 text-xs" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{me.full_name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {me.is_premium ? "Premium" : "Free"} · {me.points.toLocaleString()} pts
              </span>
            </span>
          </NavLink>
        )}

        {!me?.is_premium && (
          <NavLink
            to="/premium"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-4 py-2.5 transition-colors",
                isActive ? "bg-accent/10 text-accent" : "text-accent hover:bg-accent/10"
              )
            }
          >
            <Crown className="h-5 w-5" aria-hidden="true" />
            <span className="font-medium">Go Premium</span>
          </NavLink>
        )}

        <NavLink to="/settings" className={({ isActive }) => itemClass(isActive)}>
          <Settings className="h-5 w-5" aria-hidden="true" />
          <span className="font-medium">Settings</span>
        </NavLink>

        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          <span className="font-medium">Log out</span>
        </button>
      </div>
    </aside>
  );
}
