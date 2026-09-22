import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { BirthdayBanner } from "./BirthdayBanner";

export function AppShell() {
  const { pathname } = useLocation();
  const [remindersDismissed, setRemindersDismissed] = useState(false);

  return (
    <div className="min-h-screen">
      <div className="h-1.5 bg-blue" />
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link to="/" className="font-display text-2xl font-bold text-ink no-underline">
            Kinfolk
          </Link>
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
          </nav>
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
      className={`rounded-full px-3 py-1.5 text-sm font-semibold no-underline ${
        current ? "bg-blue text-white" : "text-ink-soft hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}
