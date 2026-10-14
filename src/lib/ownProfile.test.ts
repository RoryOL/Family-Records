import { describe, expect, it } from "vitest";
import { ownProfileInitial, splitDisplayName } from "./ownProfile";

describe("own profile", () => {
  it("keeps a single name as the first name", () => {
    expect(splitDisplayName("  Aoife  ")).toEqual({ firstName: "Aoife", lastName: "" });
  });

  it("puts every word after the first into the last name", () => {
    expect(splitDisplayName("Mary Ann O Brien")).toEqual({ firstName: "Mary", lastName: "Ann O Brien" });
  });

  it("starts a new profile from the account name, email, and a Self label", () => {
    const values = ownProfileInitial({ displayName: "Elena Harper", email: "elena@example.com" });
    expect(values.firstName).toBe("Elena");
    expect(values.lastName).toBe("Harper");
    expect(values.email).toBe("elena@example.com");
    expect(values.relationship).toBe("Self");
    expect(values.dateOfBirth).toBe("");
    expect(values.addressFormat).toBe("ie");
  });
});
