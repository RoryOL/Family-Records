export function withoutEdit(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params);
  next.delete("edit");
  return next;
}

export function withSearch(pathname: string, params: URLSearchParams): string {
  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
}
