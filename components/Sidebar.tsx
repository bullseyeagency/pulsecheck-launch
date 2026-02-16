'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Hammer, Table, FileText, Sparkles, BarChart3, Home, Combine, FolderKanban } from 'lucide-react';

type NavItem = {
  type: 'link';
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
} | {
  type: 'separator';
  label: string;
};

export default function Sidebar() {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      type: 'link',
      href: '/landing',
      icon: Home,
      label: 'Home',
    },
    {
      type: 'separator',
      label: 'STEP 1',
    },
    {
      type: 'link',
      href: '/campaign-builder',
      icon: Hammer,
      label: 'Campaign Builder',
    },
    {
      type: 'separator',
      label: 'STEP 2',
    },
    {
      type: 'link',
      href: '/json-merger',
      icon: Combine,
      label: 'Merge JSON',
    },
    {
      type: 'separator',
      label: 'STEP 3',
    },
    {
      type: 'link',
      href: '/ad-copy-builder',
      icon: Sparkles,
      label: 'Ad Copy Builder',
    },
    {
      type: 'separator',
      label: 'STEP 4',
    },
    {
      type: 'link',
      href: '/bulk-campaign-generator',
      icon: Table,
      label: 'Prepare Campaigns',
    },
    {
      type: 'separator',
      label: 'STEP 5',
    },
    {
      type: 'link',
      href: '/bulk-ads-generator',
      icon: FileText,
      label: 'Prepare Ads',
    },
    {
      type: 'separator',
      label: 'ACCOUNT MANAGER',
    },
    {
      type: 'link',
      href: '/campaigns',
      icon: FolderKanban,
      label: 'Campaign Manager',
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center h-16 border-b border-gray-200 px-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-bold text-gray-900">PulseCheck</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {navItems.map((item, index) => {
            if (item.type === 'separator') {
              return (
                <div
                  key={`separator-${index}`}
                  className="px-4 py-2 mt-4 mb-1"
                >
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {item.label}
                  </div>
                </div>
              );
            }

            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <div className="text-xs text-gray-500 text-center">
          <p className="font-medium">Bullseye Agency</p>
          <p className="mt-1">Google Ads Tools</p>
        </div>
      </div>
    </aside>
  );
}
