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
    expect(suggestMappings(["Date of death", "Deceased", "Died"]).map((item) => item.target)).toEqual([
      "dateOfDeath",
      "deceased",
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
    expect(plans[0]?.issues.map((issue) => issue.message)).toEqual([
      "The characters after the routing key are not a valid Eircode.",
      "Aoife Murphy is already in this import or household.",
    ]);
    expect(plans[1]?.draft).toBeNull();
    expect(plans[1]?.issues.map((issue) => issue.field)).toEqual(["dateOfBirth", "email"]);
  });

  it("records a death date, and blocks a death before birth or a vague deceased cell", () => {
    const headers = ["First Name", "DOB", "Date of death", "Deceased"];
    const mappings = suggestMappings(headers);
    const plans = previewImport(
      headers,
      [
        { rowNumber: 2, cells: ["Arthur", "18/12/1956", "02/03/2019", ""] },
        { rowNumber: 3, cells: ["Ruth", "02/11/1958", "", "yes"] },
        { rowNumber: 4, cells: ["Nora", "19/01/1991", "01/01/1990", "no"] },
        { rowNumber: 5, cells: ["Helen", "", "", "passed"] },
      ],
      mappings,
      [],
      today,
    );
    expect(plans[0]?.draft).toMatchObject({ deceased: true, dateOfBirth: "1956-12-18", dateOfDeath: "2019-03-02" });
    expect(plans[1]?.draft).toMatchObject({ deceased: true, dateOfDeath: null });
    expect(plans[2]?.draft).toBeNull();
    expect(plans[2]?.issues.map((issue) => issue.message)).toContain("Date of death is before the date of birth.");
    expect(plans[3]?.draft).toBeNull();
    expect(plans[3]?.issues.map((issue) => issue.field)).toEqual(["deceased"]);
  });

  it("fills a blank town and county from an Eircode", () => {
    const [plan] = previewImport(
      headers,
      [{ rowNumber: 2, cells: ["Niamh", "Byrne", "", "", "1 Abbey Street", "", "", "d02x285", ""] }],
      mappings,
      [],
      today,
    );
    expect(plan?.draft?.address).toMatchObject({
      format: "ie",
      city: "Dublin 2",
      region: "Dublin",
      postalCode: "D02 X285",
    });
    expect(plan?.issues.map((issue) => issue.message)).toEqual([
      "Town and county filled from D02 X285: Dublin 2, Co. Dublin.",
    ]);
  });

  it("fills only the county when the routing key covers several towns", () => {
    const [plan] = previewImport(
      headers,
      [{ rowNumber: 2, cells: ["Cian", "Byrne", "", "", "The Harbour", "", "", "A63 F4E2", "Ireland"] }],
      mappings,
      [],
      today,
    );
    expect(plan?.draft?.address).toMatchObject({ city: "", region: "Wicklow", postalCode: "A63 F4E2" });
    expect(plan?.issues.map((issue) => issue.message)).toEqual([
      "County filled from A63 F4E2: Co. Wicklow. This routing key covers more than one town.",
    ]);
  });

  it("leaves town and county blank when the routing key crosses a county boundary", () => {
    const [plan] = previewImport(
      headers,
      [{ rowNumber: 2, cells: ["Róisín", "Kelly", "", "", "Main Street", "", "", "A82 F4E2", ""] }],
      mappings,
      [],
      today,
    );
    expect(plan?.draft?.address).toMatchObject({ city: "", region: "", postalCode: "A82 F4E2" });
    expect(plan?.issues.map((issue) => issue.message)).toEqual([
      "A82 F4E2 covers more than one county. Pick the town and county that match the address.",
    ]);
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

  it("reads a csv file and leaves day-first dates as text", () => {
    const bytes = new TextEncoder().encode("First Name,DOB\nAoife,05/06/2020\n");
    const table = readSpreadsheet(toArrayBuffer(bytes), "family.csv");
    expect(table.rows[0]?.cells).toEqual(["Aoife", "05/06/2020"]);
    const [plan] = previewImport(table.headers, table.rows, suggestMappings(table.headers), [], new Date(2026, 8, 22));
    expect(plan?.draft?.dateOfBirth).toBe("2020-06-05");
  });

  it("reads an Excel date cell as that calendar day", () => {
    const sheet = XLSX.utils.aoa_to_sheet([["First Name", "DOB"], ["Niamh", new Date(Date.UTC(2020, 5, 5))]]);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Family");
    const table = readSpreadsheet(toArrayBuffer(XLSX.write(book, { type: "array", bookType: "xlsx" })), "family.xlsx");
    expect(table.rows[0]?.cells).toEqual(["Niamh", "2020-06-05"]);
  });
});
