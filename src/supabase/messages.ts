/** Turn Supabase and Postgres errors into sentences the household can act on. */
export function friendlySupabaseMessage(message: string, code?: string): string {
  const text = message.trim();

  if (code === "invalid_credentials" || /invalid login credentials/i.test(text)) {
    return "That email and password do not match.";
  }
  if (code === "email_not_confirmed" || /email not confirmed/i.test(text)) {
    return "Confirm your email, then sign in.";
  }
  if (code === "user_already_exists" || /user already registered/i.test(text)) {
    return "An account with that email already exists. Sign in instead.";
  }
  if (/already in a household/i.test(text)) {
    return "This account is already in a household.";
  }
  if (/invite code/i.test(text)) {
    return "That invite code does not match a household.";
  }
  if (/household name/i.test(text)) {
    return "Enter a household name.";
  }
  if (/280 characters/i.test(text)) {
    return "Keep the description under 280 characters.";
  }
  if (/sign in before/i.test(text)) {
    return text;
  }
  if (/member_relations|column .*gender|schema cache/i.test(text) && /relation|gender|member_relations/i.test(text)) {
    return "Run the family tree migration in the Supabase SQL editor, then try again.";
  }
  if (/photo_path|member-photos|bucket not found/i.test(text)) {
    return "Run the member photos migration in the Supabase SQL editor, then try again.";
  }
  if (/row-level security/i.test(text)) {
    return "You do not have access to change that.";
  }
  if (/members_linked_user/i.test(text)) {
    return "Your details are already in this household.";
  }
  if (/already linked to an account|only be linked to the person/i.test(text)) {
    return text;
  }
  if (/duplicate key|unique constraint/i.test(text)) {
    return "That record is already in the household.";
  }
  if (text.length > 180 || /syntax error|relation |password authentication failed|jwt/i.test(text)) {
    return "That could not be saved. Try again.";
  }

  return text || "That could not be saved. Try again.";
}
