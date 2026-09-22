const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function signInProblems(email: string, password: string): string | null {
  if (!EMAIL_PATTERN.test(email.trim())) return "Enter an email like name@example.com.";
  if (password.length < 8) return "Use at least 8 characters for the password.";
  return null;
}

export function signUpProblems(displayName: string, email: string, password: string): string | null {
  if (!displayName.trim()) return "Enter your name.";
  if (displayName.trim().length > 80) return "Keep your name under 80 characters.";
  return signInProblems(email, password);
}

export function householdProblems(name: string, description: string): string | null {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 80) return "Enter a household name.";
  if (description.trim().length > 280) return "Keep the description under 280 characters.";
  return null;
}
