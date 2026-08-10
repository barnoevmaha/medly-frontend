import { NavLink } from "react-router-dom";
import { navItems } from "@/config/site";

// The bottom bar holds five at most; the rest live in the desktop sidebar.
const MOBILE_ITEMS = navItems.slice(0, 5);
import { cn } from "@/lib/utils";

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 shadow-medium backdrop-blur-lg md:hidden">
      <ul className="flex items-stretch justify-around">
        {MOBILE_ITEMS.map(({ label, to, icon: Icon }) => (
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
      </ul>
    </nav>
  );
}
