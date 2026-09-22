import { LayoutGrid, Plus, Table } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, Outlet, useSearchParams } from "react-router";
import { filterMembers, listRelationships, parseDirectoryView } from "./filters";
import { MemberCard } from "./MemberCard";
import { MemberTable } from "./MemberTable";
import { withSearch, withoutEdit } from "./paths";
import { inputClass, labelClass, primaryButtonClass } from "./styles";
import { useFamily } from "../store/FamilyProvider";

export function DirectoryPage() {
  const { group, currentUser, members, reset } = useFamily();
  const [searchParams, setSearchParams] = useSearchParams();
  const [armReset, setArmReset] = useState(false);
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const relationship = searchParams.get("relationship") ?? "";
  const view = parseDirectoryView(searchParams.get("view"));
  const results = filterMembers(members, query, relationship);
  const relationships = listRelationships(members);
  const filterChoices =
    relationship && !relationships.includes(relationship) ? [relationship, ...relationships] : relationships;
  const listSearch = withoutEdit(searchParams);

  useEffect(() => {
    document.title = `${group.name} · Kinfolk`;
  }, [group.name]);

  function assignParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
    setArmReset(false);
  }

  function clearFilters() {
    setQuery("");
    const next = new URLSearchParams(searchParams);
    next.delete("q");
    next.delete("relationship");
    setSearchParams(next, { replace: true });
  }

  const countLabel =
    results.length === members.length ? `${members.length} people` : `${results.length} of ${members.length} people`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-6 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">Kinfolk</p>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">{group.name}</h1>
          <p className="mt-2 max-w-xl text-ink-soft">{group.description}</p>
          <p className="mt-2 text-sm text-ink-soft">
            {currentUser.displayName} · {currentUser.role === "owner" ? "Owner" : "Editor"} · Invite{" "}
            <code className="rounded bg-paper-2 px-1.5 py-0.5 text-ink">{group.inviteCode}</code>
          </p>
        </div>
        <Link to={withSearch("/members/new", listSearch)} className={primaryButtonClass}>
          <Plus size={16} aria-hidden />
          Add member
        </Link>
      </header>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="member-search" className={labelClass}>
            Search
          </label>
          <input
            id="member-search"
            type="search"
            className={inputClass}
            placeholder="Name or relationship"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setArmReset(false);
            }}
          />
        </div>
        <div className="lg:w-56">
          <label htmlFor="relationship-filter" className={labelClass}>
            Relationship
          </label>
          <select
            id="relationship-filter"
            className={inputClass}
            value={relationship}
            onChange={(event) => assignParam("relationship", event.target.value)}
          >
            <option value="">All relationships</option>
            {filterChoices.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>
        <div role="group" aria-label="Directory layout" className="inline-flex rounded-full border border-line bg-paper-2 p-1">
          <ViewButton pressed={view === "cards"} onClick={() => assignParam("view", "")}>
            <LayoutGrid size={16} aria-hidden />
            Cards
          </ViewButton>
          <ViewButton pressed={view === "table"} onClick={() => assignParam("view", "table")}>
            <Table size={16} aria-hidden />
            Table
          </ViewButton>
        </div>
      </div>

      <p className="mt-4 text-sm text-ink-soft" aria-live="polite">
        {countLabel}
      </p>

      {results.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-line bg-paper-2 px-5 py-12 text-center">
          <p className="font-display text-2xl font-bold">
            {members.length === 0 ? "No one is in this household yet." : emptyFilterMessage(query, relationship)}
          </p>
          {members.length > 0 ? (
            <button type="button" className={`${primaryButtonClass} mt-4`} onClick={clearFilters}>
              Clear filters
            </button>
          ) : null}
        </div>
      ) : view === "table" ? (
        <div className="mt-4">
          <MemberTable members={results} hrefFor={(id) => withSearch(`/members/${encodeURIComponent(id)}`, listSearch)} />
        </div>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((member) => (
            <li key={member.id}>
              <MemberCard member={member} to={withSearch(`/members/${encodeURIComponent(member.id)}`, listSearch)} />
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-10 flex flex-col gap-3 border-t border-line pt-6 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
        <p>Changes stay in this browser tab. Reloading restores the sample household.</p>
        {armReset ? (
          <span className="flex flex-wrap gap-3">
            <button
              type="button"
              className="font-semibold text-ink"
              onClick={() => {
                reset();
                setArmReset(false);
              }}
            >
              Restore sample household
            </button>
            <button type="button" className="font-semibold text-ink-soft" onClick={() => setArmReset(false)}>
              Cancel
            </button>
          </span>
        ) : (
          <button type="button" className="self-start font-semibold text-ink" onClick={() => setArmReset(true)}>
            Reset sample data
          </button>
        )}
      </footer>
      <Outlet />
    </main>
  );
}

function ViewButton({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${
        pressed ? "bg-blue text-white" : "text-ink-soft hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function emptyFilterMessage(query: string, relationship: string): string {
  if (query && relationship) return `No one matches “${query}” in ${relationship}.`;
  if (query) return `No one matches “${query}”.`;
  return `No one is tagged ${relationship}.`;
}
