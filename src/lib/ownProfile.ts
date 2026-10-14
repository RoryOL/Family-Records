import { emptyFormValues, type MemberFormValues } from "../directory/memberForm";

/** Split an account name into the first and last name fields on a profile. */
export function splitDisplayName(displayName: string): { firstName: string; lastName: string } {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? "";
  return { firstName, lastName: parts.slice(1).join(" ") };
}

/** Prefill the signed-in person's form from the name and email on their account. */
export function ownProfileInitial(user: { displayName: string; email: string }): MemberFormValues {
  const { firstName, lastName } = splitDisplayName(user.displayName);
  return {
    ...emptyFormValues(),
    firstName,
    lastName,
    email: user.email,
    relationship: "Self",
  };
}
