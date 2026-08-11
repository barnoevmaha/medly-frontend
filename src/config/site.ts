/* =============================================================
   BRANDING — edit this file to make the app yours.
   Colours live in src/index.css; everything else is here.
   ============================================================= */

import {
  House, Users, Trophy, Bookmark, User, GraduationCap, ShieldCheck, Scan,
  type LucideIcon,
} from "lucide-react";

export const site = {
  name: "Medly",
  initial: "M",
  tagline: "The #1 Platform for Medical Students",
  description: "Medly — Medical Learning Platform",
  copyright: "© 2024 Medly. Empowering medical education worldwide.",
};

export type NavItem = { label: string; to: string; icon: LucideIcon };

export const navItems: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: House },
  { label: "Community", to: "/community", icon: Users },
  { label: "Challenges", to: "/challenges", icon: Trophy },
  { label: "Saved", to: "/saved", icon: Bookmark },
  { label: "AI Training", to: "/learn", icon: GraduationCap },
  { label: "Imaging", to: "/imaging", icon: Scan },
  { label: "Governance", to: "/governance", icon: ShieldCheck },
  { label: "Profile", to: "/profile", icon: User },
];
