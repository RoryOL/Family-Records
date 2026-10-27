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
    expect(friendlySupabaseMessage("Could not find the 'date_of_death' column of 'members' in the schema cache")).toBe(
      "Run the deceased members migration in the Supabase SQL editor, then try again.",
    );
    expect(friendlySupabaseMessage("Could not find the 'deceased' column of 'members' in the schema cache")).toBe(
      "Run the deceased members migration in the Supabase SQL editor, then try again.",
    );
    expect(friendlySupabaseMessage("Could not find the 'photo_path' column of 'members' in the schema cache")).toBe(
      "Run the member photos migration in the Supabase SQL editor, then try again.",
    );
    expect(friendlySupabaseMessage("Bucket not found")).toBe("Run the member photos migration in the Supabase SQL editor, then try again.");
    expect(friendlySupabaseMessage("Could not find the 'wedding_date' column of 'member_relations' in the schema cache")).toBe(
      "Run the weddings, godparents, and marriage migrations in the Supabase SQL editor, then try again.",
    );
    expect(friendlySupabaseMessage("Could not find the table 'public.godparents' in the schema cache")).toBe(
      "Run the weddings, godparents, and marriage migrations in the Supabase SQL editor, then try again.",
    );
    expect(friendlySupabaseMessage("Could not find the table 'public.member_relations' in the schema cache")).toBe(
      "Run the family tree migration in the Supabase SQL editor, then try again.",
    );
    expect(friendlySupabaseMessage('duplicate key value violates unique constraint "members_linked_user_idx"')).toBe(
      "Your details are already in this household.",
    );
    expect(friendlySupabaseMessage("A profile can only be linked to the person who is signed in.")).toBe(
      "A profile can only be linked to the person who is signed in.",
    );
  });
});
