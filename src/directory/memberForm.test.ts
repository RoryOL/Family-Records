import { describe, expect, it } from "vitest";
import { createInitialState } from "../data/mockFamily";
import {
  dateWarning,
  emptyFormValues,
  formValuesToDraft,
  memberToFormValues,
  validateMemberForm,
} from "./memberForm";

describe("member form", () => {
  it("round-trips Elena's profile and keeps her address id", () => {
    const elena = createInitialState().members.find((member) => member.id === "mem_elena");
    expect(elena).toBeTruthy();
    const values = memberToFormValues(elena!);
    expect(validateMemberForm(values)).toEqual({});

    const draft = formValuesToDraft(values, elena!.address?.id);
    expect(draft.fullName).toBe("Elena Harper");
    expect(draft.address?.id).toBe("adr_elena");
    expect(draft.address?.line1).toBe("1842 Willow Lane");
    expect(draft.address?.format).toBe("international");
    expect(draft.address?.verified).toBe(true);
  });

  it("starts a new address in the Irish layout and keeps a third line", () => {
    expect(emptyFormValues().addressFormat).toBe("ie");
    const draft = formValuesToDraft({
      ...emptyFormValues(),
      firstName: "Aoife",
      line1: "12 Main Street",
      line3: "The Green",
      city: "Malahide",
      region: "Dublin",
      postalCode: "K36 AB12",
    });
    expect(draft.address).toMatchObject({
      format: "ie",
      line1: "12 Main Street",
      line3: "The Green",
      city: "Malahide",
      region: "Dublin",
      country: "Ireland",
    });
  });

  it("requires a first name and rejects a bad email or impossible date", () => {
    const errors = validateMemberForm({
      ...emptyFormValues(),
      firstName: "  ",
      email: "not-an-email",
      dateOfBirth: "2015-02-29",
    });
    expect(errors).toEqual({
      firstName: "Enter a first name.",
      dateOfBirth: "Enter a date like 21/09/1988.",
      email: "Enter an email like name@example.com.",
    });
  });

  it("drops a blank address and keeps a verified flag on an otherwise empty one", () => {
    expect(formValuesToDraft({ ...emptyFormValues(), firstName: "Ada" }).address).toBeNull();

    const verified = formValuesToDraft({ ...emptyFormValues(), firstName: "Ada", verified: true }, "adr_ada");
    expect(verified.address).toMatchObject({ id: "adr_ada", verified: true, line1: "" });
    expect(verified.phone).toBeNull();
  });

  it("keeps a death date only while the person is recorded as deceased", () => {
    const values = {
      ...emptyFormValues(),
      firstName: "Arthur",
      dateOfBirth: "1956-12-18",
      deceased: true,
      dateOfDeath: "2019-03-02",
    };
    expect(validateMemberForm(values)).toEqual({});
    expect(formValuesToDraft(values)).toMatchObject({ deceased: true, dateOfDeath: "2019-03-02" });

    const cleared = formValuesToDraft({ ...values, deceased: false, dateOfDeath: "2019-03-02" });
    expect(cleared.deceased).toBe(false);
    expect(cleared.dateOfDeath).toBeNull();

    const undated = formValuesToDraft({ ...emptyFormValues(), firstName: "Ruth", deceased: true });
    expect(undated.deceased).toBe(true);
    expect(undated.dateOfDeath).toBeNull();
  });

  it("rejects a death date before birth or an impossible day", () => {
    expect(
      validateMemberForm({
        ...emptyFormValues(),
        firstName: "Arthur",
        dateOfBirth: "1956-12-18",
        deceased: true,
        dateOfDeath: "1950-01-01",
      }).dateOfDeath,
    ).toBe("Date of death is before the date of birth.");
    expect(
      validateMemberForm({
        ...emptyFormValues(),
        firstName: "Arthur",
        deceased: true,
        dateOfDeath: "2019-02-31",
      }).dateOfDeath,
    ).toBe("Enter a date like 21/09/1988.");
  });

  it("round-trips a recorded death onto the form", () => {
    const elena = createInitialState().members.find((member) => member.id === "mem_elena");
    const remembered = { ...elena!, deceased: true, dateOfDeath: "2020-01-02" };
    const values = memberToFormValues(remembered);
    expect(values.deceased).toBe(true);
    expect(values.dateOfDeath).toBe("2020-01-02");
    expect(formValuesToDraft(values).dateOfDeath).toBe("2020-01-02");
  });

  it("stores a typed day month year date as an ISO date", () => {
    const values = {
      ...emptyFormValues(),
      firstName: "Arthur",
      dateOfBirth: "18/12/1956",
      deceased: true,
      dateOfDeath: "02/03/2019",
    };
    expect(validateMemberForm(values)).toEqual({});
    expect(formValuesToDraft(values)).toMatchObject({ dateOfBirth: "1956-12-18", dateOfDeath: "2019-03-02" });
    expect(validateMemberForm({ ...emptyFormValues(), firstName: "Arthur", dateOfBirth: "31/02/2019" }).dateOfBirth).toBe(
      "Enter a date like 21/09/1988.",
    );
  });

  it("warns when the birthday is after today without blocking the date", () => {
    const today = new Date(2026, 8, 22);
    expect(dateWarning("2999-01-01", today)).toBe("This date is in the future.");
    expect(dateWarning("2026-09-22", today)).toBeNull();
    expect(validateMemberForm({ ...emptyFormValues(), firstName: "Ada", dateOfBirth: "2999-01-01" })).toEqual({});
  });
});
