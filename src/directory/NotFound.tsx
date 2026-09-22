import { Link } from "react-router";
import { primaryButtonClass } from "./styles";

export function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">Kinfolk</p>
      <h1 className="mt-3 font-serif text-4xl font-medium">That page is not in the book</h1>
      <p className="mt-3 text-ink-soft">The link does not match a page in this household.</p>
      <Link to="/" className={`${primaryButtonClass} mt-6`}>
        Back to the directory
      </Link>
    </main>
  );
}
