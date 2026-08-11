import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Bookmark, LogOut, MoreHorizontal, X } from "lucide-react";
import { MOBILE_PRIMARY, navItems } from "@/config/site";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

const primary = MOBILE_PRIMARY.map((to) => navItems.find((item) => item.to === to)!).filter(
  Boolean
);
const overflow = navItems.filter((item) => !MOBILE_PRIMARY.includes(item.to));

/**
 * Bottom bar for small screens.
 *
 * The sidebar carries ten destinations and a bottom bar cannot. Four live on
 * the bar; the rest open in a sheet rather than being unreachable on a phone.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { me, logout } = useSession();

  // Close on navigation, or the sheet stays over the page you just opened.
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {open && (
        <div className="fixed bottom-16 left-0 right-0 z-50 max-h-[65vh] overflow-y-auto rounded-t-2xl border-t border-border bg-card p-4 shadow-medium animate-fade-up md:hidden">
          <div className="mb-3 flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate font-semibold">{me?.full_name ?? "Menu"}</p>
              {me && (
                <p className="truncate text-xs text-muted-foreground">
                  {me.is_premium ? "Premium" : "Free"} · {me.points.toLocaleString()} pts
                </p>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-2 text-muted-foreground"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <ul className="grid grid-cols-2 gap-2">
            {overflow.map(({ label, to, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                      isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
                    )
                  }
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </NavLink>
              </li>
            ))}
            <li>
              <NavLink
                to="/saved"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                    isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  )
                }
              >
                <Bookmark className="h-5 w-5" />
                Saved
              </NavLink>
            </li>
            <li>
              <button
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                <LogOut className="h-5 w-5" />
                Log out
              </button>
            </li>
          </ul>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 shadow-medium backdrop-blur-lg md:hidden">
        <ul className="flex items-stretch justify-around">
          {primary.map(({ label, to, icon: Icon }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )
                }
              >
                <Icon className="h-5 w-5" />
                {label}
              </NavLink>
            </li>
          ))}
          <li className="flex-1">
            <button
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              className={cn(
                "flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                open ? "text-primary" : "text-muted-foreground"
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              More
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
