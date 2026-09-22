import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { useFamily } from "../store/FamilyProvider";
import { BirthdayBanner } from "./BirthdayBanner";

export function AppShell() {
  const { pathname } = useLocation();
  const { signOut } = useFamily();
  const [remindersDismissed, setRemindersDismissed] = useState(false);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-850">
      <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-terracotta" />
      <header className="border-b border-stone-200/60 bg-white/80 shadow-warm backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Link to="/" className="font-display text-2xl font-bold tracking-tight text-stone-850 no-underline">
            Kinfolk
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <nav aria-label="Primary" className="flex flex-wrap gap-2">
              <ShellLink href="/" current={pathname === "/" || pathname.startsWith("/members")}>
                Directory
              </ShellLink>
              <ShellLink href="/birthdays" current={pathname.startsWith("/birthdays")}>
                Birthdays
              </ShellLink>
              <ShellLink href="/cards" current={pathname.startsWith("/cards")}>
                Mailing
              </ShellLink>
              <ShellLink href="/import" current={pathname.startsWith("/import")}>
                Import
              </ShellLink>
            </nav>
            <button
              type="button"
              className="rounded-full px-4 py-2 text-sm font-semibold text-stone-500 transition-all duration-200 ease-out hover:bg-amber-50 hover:text-stone-850"
              onClick={() => void signOut()}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      {remindersDismissed ? null : <BirthdayBanner onDismiss={() => setRemindersDismissed(true)} />}
      <Outlet />
    </div>
  );
}

function ShellLink({ href, current, children }: { href: string; current: boolean; children: string }) {
  return (
    <Link
      to={href}
      aria-current={current ? "page" : undefined}
      className={`rounded-full px-4 py-2 text-sm font-semibold no-underline transition-all duration-200 ease-out ${
        current ? "bg-terracotta text-white shadow-warm" : "text-stone-500 hover:bg-amber-50 hover:text-stone-850"
      }`}
    >
      {children}
    </Link>
  );
}
