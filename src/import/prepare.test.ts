import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseImportDate, previewImport, suggestMappings } from "./prepare";
import { readSpreadsheet } from "./spreadsheet";

function toArrayBuffer(data: ArrayBuffer | ArrayBufferView | number[]): ArrayBuffer {
  if (data instanceof ArrayBuffer) return data;
  if (ArrayBuffer.isView(data)) {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  }
  return Uint8Array.from(data).buffer;
}

describe("parseImportDate", () => {
  it("reads day-first dates and leaves ISO dates unchanged", () => {
    expect(parseImportDate("05/06/2020", 2026)).toBe("2020-06-05");
    expect(parseImportDate("15-03-1990", 2026)).toBe("1990-03-15");
    expect(parseImportDate("1990-03-15", 2026)).toBe("1990-03-15");
    expect(parseImportDate("32/01/2020", 2026)).toBeNull();
    expect(parseImportDate("04/13/1990", 2026)).toBeNull();
    expect(parseImportDate("05/06/26", 2026)).toBe("2026-06-05");
    expect(parseImportDate("05/06/27", 2026)).toBe("1927-06-05");
  });
});

describe("suggestMappings", () => {
  it("matches familiar headers once each", () => {
    expect(suggestMappings(["First Name", "Surname", "DOB", "Eircode", "Notes", "First name"]).map((item) => item.target)).toEqual([
      "firstName",
      "lastName",
      "dateOfBirth",
      "postalCode",
      "notes",
      "ignore",
    ]);
    expect(suggestMappings(["Town/City", "County/Region", "Eircode/Postal code"]).map((item) => item.target)).toEqual([
      "city",
      "region",
      "postalCode",
    ]);
  });
});

describe("previewImport", () => {
  const headers = ["First Name", "Last Name", "DOB", "Email", "Address line 1", "Town", "County", "Eircode", "Country"];
  const mappings = suggestMappings(headers);
  const today = new Date(2026, 8, 22);

  it("builds an Irish address and blocks a row with a bad email or date", () => {
    const plans = previewImport(
      headers,
      [
        {
          rowNumber: 2,
          cells: ["Aoife", "Murphy", "15/03/1990", "aoife@example.com", "12 Main Street", "Malahide", "Dublin", "K36 AB12", ""],
        },
        { rowNumber: 3, cells: ["", "", "", "", "", "", "", "", ""] },
        { rowNumber: 4, cells: ["Sam", "Walsh", "not-a-date", "sam", "", "", "", "", "United Kingdom"] },
      ],
      mappings,
      ["Aoife Murphy"],
      today,
    );

    expect(plans).toHaveLength(2);
    expect(plans[0]?.draft).toMatchObject({
      firstName: "Aoife",
      lastName: "Murphy",
      dateOfBirth: "1990-03-15",
      email: "aoife@example.com",
      address: {
        format: "ie",
        line1: "12 Main Street",
        city: "Malahide",
        region: "Dublin",
        postalCode: "K36 AB12",
        country: "Ireland",
        verified: false,
      },
    });
    expect(plans[0]?.issues.map((issue) => issue.severity)).toEqual(["warning"]);
    expect(plans[1]?.draft).toBeNull();
    expect(plans[1]?.issues.map((issue) => issue.field)).toEqual(["dateOfBirth", "email"]);
  });
});

describe("readSpreadsheet", () => {
  it("reads the first sheet and keeps spreadsheet row numbers", () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ["First Name", "Last Name"],
      ["Niamh", "Byrne"],
      [],
      ["Cian", "Byrne"],
    ]);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Family");
    const table = readSpreadsheet(toArrayBuffer(XLSX.write(book, { type: "array", bookType: "xlsx" })), "family.xlsx");
    expect(table.headers).toEqual(["First Name", "Last Name"]);
    expect(table.rows.map((row) => [row.rowNumber, row.cells[0]])).toEqual([
      [2, "Niamh"],
      [4, "Cian"],
    ]);
  });

  it("reads a csv file", () => {
    const bytes = new TextEncoder().encode("First Name,Town\nAoife,Malahide\n");
    const table = readSpreadsheet(toArrayBuffer(bytes), "family.csv");
    expect(table.rows[0]?.cells).toEqual(["Aoife", "Malahide"]);
  });
});
