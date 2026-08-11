/* =============================================================
   BRANDING — edit this file to make the app yours.
   Colours live in src/index.css; everything else is here.
   ============================================================= */

import {
  House, Users, Trophy, BookOpen, Newspaper, Settings, User, GraduationCap,
  ShieldCheck, Scan,
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
  { label: "Your Feed", to: "/feed", icon: Newspaper },
  { label: "Communities", to: "/community", icon: Users },
  { label: "Challenges", to: "/challenges", icon: Trophy },
  { label: "Library", to: "/library", icon: BookOpen },
  { label: "AI Training", to: "/learn", icon: GraduationCap },
  { label: "Imaging", to: "/imaging", icon: Scan },
  { label: "Governance", to: "/governance", icon: ShieldCheck },
  { label: "Settings", to: "/settings", icon: Settings },
  { label: "Profile", to: "/profile", icon: User },
];

/** The bottom bar holds four; everything else lives behind "More". */
export const MOBILE_PRIMARY = ["/dashboard", "/feed", "/community", "/challenges"];
