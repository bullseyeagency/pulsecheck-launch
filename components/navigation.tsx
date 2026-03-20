"use client";

import { Home, Zap, BarChart3, Settings } from "lucide-react";
import { AnimeNavBar } from "@/components/ui/anime-navbar";
import { signOut } from "next-auth/react";

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
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <AnimeNavBar
      items={navItems}
      defaultActive={defaultActive}
      onLogout={handleLogout}
    />
  );
}
