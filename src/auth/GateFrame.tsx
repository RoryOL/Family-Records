import { useEffect, type ReactNode } from "react";
import { pageClass } from "../directory/styles";
import { InstallApp } from "../pwa/InstallApp";

export function GateFrame({ title, lede, children }: { title: string; lede: string; children?: ReactNode }) {
  useEffect(() => {
    document.title = `${title} · Family Records`;
  }, [title]);

  return (
    <div className="min-h-dvh bg-stone-50 text-stone-850">
      <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-terracotta" />
      <InstallApp />
      <main className={pageClass}>
        <header className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">Family Records</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-3 text-stone-500">{lede}</p>
        </header>
        {children}
      </main>
    </div>
  );
}
