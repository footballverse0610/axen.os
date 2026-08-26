import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Lightbulb, ListChecks, Wallet, Sparkles } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/coach", label: "Coach", icon: Sparkles },
];
