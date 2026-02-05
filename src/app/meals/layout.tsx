'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  UtensilsCrossed,
  CalendarDays,
  ShoppingCart,
  Settings,
  Search,
} from 'lucide-react';

const navItems = [
  { href: '/meals/plan', label: 'Plan', icon: CalendarDays },
  { href: '/meals/recipes', label: 'Recipes', icon: Search },
  { href: '/meals/shopping', label: 'Shopping', icon: ShoppingCart },
  { href: '/meals/settings', label: 'Settings', icon: Settings },
];

export default function MealsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link
            href="/meals"
            className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100"
          >
            <UtensilsCrossed className="h-5 w-5" />
            Meal Planner
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Metrics
            </Link>
            <button
              onClick={() => signOut()}
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="flex border-t border-zinc-200 sm:hidden dark:border-zinc-800">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
                  isActive
                    ? 'text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
