import { FileSpreadsheet, Upload } from "lucide-react";
import { useEffect, useMemo, useState, type DragEvent, type FormEvent } from "react";
import { Link } from "react-router";
import { inputClass, labelClass, pageClass, primaryButtonClass, secondaryButtonClass, surfaceClass } from "../directory/styles";
import { useFamily } from "../store/FamilyProvider";
import { IMPORT_TARGETS, previewImport, suggestMappings, type ImportRowPlan } from "./prepare";
import { readSpreadsheet, type SpreadsheetTable } from "./spreadsheet";
import type { ColumnMapping } from "../types";

export function ImportPage() {
  const { group, members, importMembers } = useFamily();
  const [table, setTable] = useState<SpreadsheetTable | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [included, setIncluded] = useState<Set<number>>(new Set());
  const [fileError, setFileError] = useState<string | null>(null);
  const [added, setAdded] = useState(0);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    document.title = `Import · ${group.name} · Family Records`;
  }, [group.name]);

  const plans = useMemo(() => {
    if (!table) return [];
    return previewImport(
      table.headers,
      table.rows,
      mappings,
      members.map((member) => `${member.firstName} ${member.lastName}`),
    );
  }, [table, mappings, members]);

  const previewKey = table
    ? `${table.sheetName}\u0000${table.headers.join("\u0000")}\u0000${mappings.map((mapping) => mapping.target).join("\u0000")}`
    : "";
  const [trackedPreview, setTrackedPreview] = useState(previewKey);
  if (previewKey !== trackedPreview) {
    setTrackedPreview(previewKey);
    setIncluded(new Set(plans.filter((plan) => plan.draft && !hasError(plan)).map((plan) => plan.rowNumber)));
    setAdded(0);
  }

  async function loadFile(file: File) {
    setFileError(null);
    setAdded(0);
    if (!/\.(csv|xlsx|xls)$/i.test(file.name)) {
      setTable(null);
      setFileError("Choose a CSV, XLS, or XLSX file.");
      return;
    }
    try {
      const data = await file.arrayBuffer();
      const next = readSpreadsheet(data, file.name);
      setTable(next);
      setMappings(suggestMappings(next.headers));
    } catch (error) {
      setTable(null);
      setFileError(error instanceof Error ? error.message : "That file could not be read.");
    }
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void loadFile(file);
  }

  function toggle(rowNumber: number) {
    setIncluded((current) => {
      const next = new Set(current);
      if (next.has(rowNumber)) next.delete(rowNumber);
      else next.add(rowNumber);
      return next;
    });
  }

  async function commit(event: FormEvent) {
    event.preventDefault();
    const drafts = plans.flatMap((plan) => (plan.draft && included.has(plan.rowNumber) ? [plan.draft] : []));
    if (drafts.length === 0) return;
    setSaving(true);
    setFileError(null);
    try {
      await importMembers(drafts);
      setAdded(drafts.length);
      setIncluded(new Set());
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "Those people could not be added.");
    } finally {
      setSaving(false);
    }
  }

  const ready = plans.filter((plan) => plan.draft && included.has(plan.rowNumber)).length;

  return (
    <main className={pageClass}>
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">{group.name}</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">Import</h1>
        <p className="mt-3 text-stone-500">
          Drop a spreadsheet, match the columns, and check the rows before anyone joins the household. Dates are read as day/month/year.
        </p>
      </header>

      <form className="mt-8 grid gap-8" onSubmit={(event) => void commit(event)}>
        <label
          className={`${surfaceClass} flex cursor-pointer flex-col items-center gap-3 px-6 py-12 text-center ${
            dragging ? "border-terracotta bg-amber-50" : ""
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <FileSpreadsheet className="text-terracotta" aria-hidden />
          <span className="font-display text-2xl font-bold tracking-tight">Drop a CSV, XLS, or XLSX file</span>
          <span className="text-sm text-stone-500">{table ? table.sheetName : "Or choose a file from this device."}</span>
          <span className={`${secondaryButtonClass} mt-2`}>
            <Upload size={16} aria-hidden />
            Choose a file
          </span>
          <input
            className="sr-only"
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void loadFile(file);
              event.target.value = "";
            }}
          />
        </label>
        {fileError ? (
          <p className="text-sm text-terracotta-deep" role="alert">
            {fileError}
          </p>
        ) : null}

        {table ? (
          <>
            <section className="min-w-0">
              <h2 className="font-display text-2xl font-bold tracking-tight">Columns</h2>
              <p className="mt-2 text-sm text-stone-500">Family Records guesses from the header. Change any column that landed in the wrong place.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {table.headers.map((header, index) => (
                  <label key={`${header}-${index}`} className={`${surfaceClass} block p-4`}>
                    <span className={labelClass}>{header}</span>
                    <select
                      className={inputClass}
                      value={mappings[index]?.target ?? "ignore"}
                      onChange={(event) => {
                        const target = event.target.value as ColumnMapping["target"];
                        setMappings((current) => current.map((mapping, mappingIndex) => (mappingIndex === index ? { ...mapping, target } : mapping)));
                      }}
                    >
                      {IMPORT_TARGETS.map((target) => (
                        <option key={target.value} value={target.value}>
                          {target.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </section>

            <section className="min-w-0">
              <h2 className="font-display text-2xl font-bold tracking-tight">Review</h2>
              <p className="mt-2 text-sm text-stone-500" aria-live="polite">
                {plans.length === 0 ? "No people were found under those headers." : `${ready} of ${plans.length} rows ready to add.`}
              </p>
              <div className={`${surfaceClass} mt-4 min-w-0 overflow-x-auto`}>
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                  <caption className="sr-only">Rows to import</caption>
                  <thead className="border-b border-stone-200/60 text-xs uppercase tracking-[0.14em] text-stone-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Add</th>
                      <th className="px-4 py-3 font-semibold">Row</th>
                      <th className="px-4 py-3 font-semibold">Name</th>
                      <th className="px-4 py-3 font-semibold">Birthday</th>
                      <th className="px-4 py-3 font-semibold">Notes from the check</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((plan) => {
                      const blocked = hasError(plan) || !plan.draft;
                      return (
                        <tr key={plan.rowNumber} className="border-b border-stone-100 last:border-b-0">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              className="size-4 accent-terracotta"
                              checked={included.has(plan.rowNumber)}
                              disabled={blocked}
                              aria-label={`Add row ${plan.rowNumber}`}
                              onChange={() => toggle(plan.rowNumber)}
                            />
                          </td>
                          <td className="px-4 py-3 text-stone-500">{plan.rowNumber}</td>
                          <td className="px-4 py-3 font-display font-bold tracking-tight">
                            {plan.draft ? `${plan.draft.firstName} ${plan.draft.lastName}`.trim() : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div>{plan.draft?.dateOfBirth ?? "—"}</div>
                            {plan.draft?.deceased ? (
                              <div className="text-stone-500">{plan.draft.dateOfDeath ? `Died ${plan.draft.dateOfDeath}` : "Deceased"}</div>
                            ) : null}
                          </td>
                          <td className="px-4 py-3">
                            {plan.issues.length === 0 ? (
                              <span className="text-stone-500">Ready</span>
                            ) : (
                              <ul className="grid gap-1">
                                {plan.issues.map((issue) => (
                                  <li key={`${issue.field}-${issue.message}`} className={issue.severity === "error" ? "text-terracotta-deep" : "text-honey"}>
                                    {issue.message}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className={primaryButtonClass} disabled={ready === 0 || saving}>
                Add {ready} {ready === 1 ? "person" : "people"}
              </button>
              {added > 0 ? (
                <p className="text-sm text-stone-500" role="status">
                  Added {added} {added === 1 ? "person" : "people"}.{" "}
                  <Link className="font-semibold text-stone-850 underline decoration-amber-300 underline-offset-2" to="/">
                    Back to the directory
                  </Link>
                </p>
              ) : null}
            </div>
          </>
        ) : null}
      </form>
    </main>
  );
}

function hasError(plan: ImportRowPlan): boolean {
  return plan.issues.some((issue) => issue.severity === "error");
}
