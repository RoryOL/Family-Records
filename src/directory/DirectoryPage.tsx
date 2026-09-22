import { FileSpreadsheet, LayoutGrid, Plus, Table } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, Outlet, useSearchParams } from "react-router";
import { sampleMemberDrafts } from "../data/mockFamily";
import { filterMembers, listRelationships, parseDirectoryView } from "./filters";
import { MemberCard } from "./MemberCard";
import { MemberTable } from "./MemberTable";
import { withSearch, withoutEdit } from "./paths";
import { inputClass, labelClass, pageClass, primaryButtonClass, secondaryButtonClass, surfaceClass } from "./styles";
import { useFamily } from "../store/FamilyProvider";

export function DirectoryPage() {
  const { group, currentUser, members, importMembers } = useFamily();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sampling, setSampling] = useState(false);
  const [sampleError, setSampleError] = useState<string | null>(null);
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
    <main className={pageClass}>
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">Kinfolk</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">{group.name}</h1>
          <p className="mt-3 max-w-xl text-stone-500">{group.description}</p>
          <p className="mt-3 text-sm text-stone-500">
            {currentUser.displayName} · {currentUser.role === "owner" ? "Owner" : "Editor"} · Invite{" "}
            <code className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">{group.inviteCode}</code>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/import" className={secondaryButtonClass}>
            <FileSpreadsheet size={16} aria-hidden />
            Import
          </Link>
          <Link to={withSearch("/members/new", listSearch)} className={primaryButtonClass}>
            <Plus size={16} aria-hidden />
            Add member
          </Link>
        </div>
      </header>

      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-end">
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
            onChange={(event) => setQuery(event.target.value)}
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
        <div role="group" aria-label="Directory layout" className="inline-flex rounded-full border border-stone-200/60 bg-white p-1 shadow-warm">
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

      <p className="mt-6 text-sm text-stone-500" aria-live="polite">
        {countLabel}
      </p>

      {results.length === 0 ? (
        <div className={`${surfaceClass} mt-6 px-6 py-16 text-center`}>
          <p className="font-display text-2xl font-bold tracking-tight">
            {members.length === 0 ? "No one is in this household yet." : emptyFilterMessage(query, relationship)}
          </p>
          {members.length > 0 ? (
            <button type="button" className={`${primaryButtonClass} mt-4`} onClick={clearFilters}>
              Clear filters
            </button>
          ) : (
            <div className="mt-4">
              <button
                type="button"
                className={primaryButtonClass}
                disabled={sampling}
                onClick={() => {
                  setSampling(true);
                  setSampleError(null);
                  void importMembers(sampleMemberDrafts())
                    .catch((error: unknown) => {
                      setSampleError(error instanceof Error ? error.message : "The sample household could not be added.");
                    })
                    .finally(() => setSampling(false));
                }}
              >
                Add the Harper sample
              </button>
              {sampleError ? (
                <p className="mt-3 text-sm text-terracotta-deep" role="alert">
                  {sampleError}
                </p>
              ) : null}
            </div>
          )}
        </div>
      ) : view === "table" ? (
        <div className="mt-6">
          <MemberTable members={results} hrefFor={(id) => withSearch(`/members/${encodeURIComponent(id)}`, listSearch)} />
        </div>
      ) : (
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((member) => (
            <li key={member.id}>
              <MemberCard member={member} to={withSearch(`/members/${encodeURIComponent(member.id)}`, listSearch)} />
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-12 border-t border-stone-200/60 pt-6 text-sm text-stone-500">
        <p>Saved for everyone in this household. Share the invite code so someone else can read and update it too.</p>
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
      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-all duration-200 ease-out ${
        pressed ? "bg-terracotta text-white shadow-warm" : "text-stone-500 hover:text-stone-850"
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
