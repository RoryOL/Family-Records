import { describe, expect, it } from "vitest";
import { friendlySupabaseMessage } from "./messages";

describe("friendlySupabaseMessage", () => {
  it("explains sign-in and invite failures", () => {
    expect(friendlySupabaseMessage("Invalid login credentials", "invalid_credentials")).toBe("That email and password do not match.");
    expect(friendlySupabaseMessage("Email not confirmed")).toBe("Confirm your email, then sign in.");
    expect(friendlySupabaseMessage("This account is already in a household.")).toBe("This account is already in a household.");
    expect(friendlySupabaseMessage("That invite code does not match a household.")).toBe("That invite code does not match a household.");
  });

  it("hides database internals", () => {
    expect(friendlySupabaseMessage("new row violates row-level security policy")).toBe("You do not have access to change that.");
    expect(friendlySupabaseMessage('duplicate key value violates unique constraint "members_pkey"')).toBe(
      "That record is already in the household.",
    );
    expect(friendlySupabaseMessage('relation "secret" does not exist')).toBe("That could not be saved. Try again.");
  });
});
