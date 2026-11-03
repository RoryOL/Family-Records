export const directoryPath = "/directory";
export const newMemberPath = `${directoryPath}/members/new`;

export function memberPath(id: string): string {
  return `${directoryPath}/members/${encodeURIComponent(id)}`;
}

export function withoutEdit(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params);
  next.delete("edit");
  return next;
}

export function withSearch(pathname: string, params: URLSearchParams): string {
  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
}

/** Old `/birthdays` links open home and keep the birthday window. */
export function homeTarget(params: URLSearchParams): string {
  return withSearch("/", params);
}

/** Old `/members/...` links open the same person on the directory. */
export function legacyMemberTarget(memberId: string | undefined, params: URLSearchParams): string {
  return withSearch(memberId ? memberPath(memberId) : newMemberPath, params);
}
