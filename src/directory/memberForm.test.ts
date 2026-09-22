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
    expect(draft.address?.verified).toBe(true);
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
      dateOfBirth: "Enter a real date.",
      email: "Enter an email like name@example.com.",
    });
  });

  it("drops a blank address and keeps a verified flag on an otherwise empty one", () => {
    expect(formValuesToDraft({ ...emptyFormValues(), firstName: "Ada" }).address).toBeNull();

    const verified = formValuesToDraft({ ...emptyFormValues(), firstName: "Ada", verified: true }, "adr_ada");
    expect(verified.address).toMatchObject({ id: "adr_ada", verified: true, line1: "" });
    expect(verified.phone).toBeNull();
  });

  it("warns when the birthday is after today without blocking the date", () => {
    const today = new Date(2026, 8, 22);
    expect(dateWarning("2999-01-01", today)).toBe("This date is in the future.");
    expect(dateWarning("2026-09-22", today)).toBeNull();
    expect(validateMemberForm({ ...emptyFormValues(), firstName: "Ada", dateOfBirth: "2999-01-01" })).toEqual({});
  });
});
