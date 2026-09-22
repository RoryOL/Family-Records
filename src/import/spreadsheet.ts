import * as XLSX from "xlsx";

export interface SpreadsheetRow {
  /** 1-based row number in the sheet, matching the file the person uploaded. */
  rowNumber: number;
  cells: string[];
}

export interface SpreadsheetTable {
  sheetName: string;
  headers: string[];
  rows: SpreadsheetRow[];
}

export function readSpreadsheet(data: ArrayBuffer, filename: string): SpreadsheetTable {
  const workbook = XLSX.read(data, { type: "array", cellDates: true, raw: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("This workbook has no sheets.");
  }

  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | Date | null)[]>(workbook.Sheets[sheetName], {
    header: 1,
    raw: true,
    defval: "",
    blankrows: true,
  });

  const rows = matrix
    .map((row, index) => ({ rowNumber: index + 1, cells: (row ?? []).map(cellToString) }))
    .filter((row) => row.cells.some((cell) => cell.length > 0));

  const header = rows[0];
  if (!header) {
    throw new Error("This sheet has no rows to import.");
  }

  const width = Math.max(header.cells.length, ...rows.slice(1).map((row) => row.cells.length));
  const headers = Array.from({ length: width }, (_, index) => header.cells[index]?.trim() || `Column ${index + 1}`);
  const body = rows.slice(1).map((row) => ({
    rowNumber: row.rowNumber,
    cells: Array.from({ length: width }, (_, index) => row.cells[index] ?? ""),
  }));

  return { sheetName: filename ? `${filename} · ${sheetName}` : sheetName, headers, rows: body };
}

function cellToString(value: string | number | boolean | Date | null): string {
  if (value == null) return "";
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, "0");
    const day = String(value.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";
    return Number.isInteger(value) ? String(value) : String(value);
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value).replace(/^\uFEFF/, "").trim();
}
