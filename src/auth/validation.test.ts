import { describe, expect, it } from "vitest";
import { householdProblems, signInProblems, signUpProblems } from "./validation";

describe("account validation", () => {
  it("asks for a real email and a longer password", () => {
    expect(signInProblems("aoife", "short")).toBe("Enter an email like name@example.com.");
    expect(signInProblems("aoife@example.com", "short")).toBe("Use at least 8 characters for the password.");
    expect(signInProblems("aoife@example.com", "correct-horse")).toBeNull();
  });

  it("asks for a name before creating an account", () => {
    expect(signUpProblems("  ", "aoife@example.com", "correct-horse")).toBe("Enter your name.");
    expect(signUpProblems("Aoife", "aoife@example.com", "correct-horse")).toBeNull();
  });

  it("limits the household name and description", () => {
    expect(householdProblems("  ", "")).toBe("Enter a household name.");
    expect(householdProblems("The Murphys", "a".repeat(281))).toBe("Keep the description under 280 characters.");
    expect(householdProblems("The Murphys", "Birthdays and addresses.")).toBeNull();
  });
});
