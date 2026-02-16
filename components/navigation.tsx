"use client";

import { Home, Zap, BarChart3, Settings } from "lucide-react";
import { AnimeNavBar } from "@/components/ui/anime-navbar";

const navItems = [
  {
    name: "Home",
    url: "/landing",
    icon: Home,
  },
  {
    name: "Campaigns",
    url: "/campaigns",
    icon: Zap,
  },
  {
    name: "Keywords",
    url: "/campaigns/keywords",
    icon: BarChart3,
  },
  {
    name: "Settings",
    url: "/dashboard",
    icon: Settings,
  },
];

export function Navigation({ defaultActive = "Home" }: { defaultActive?: string }) {
  return <AnimeNavBar items={navItems} defaultActive={defaultActive} />;
}
