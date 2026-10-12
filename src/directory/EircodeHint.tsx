import { addressMatchesEircode, eircodeSummary, lookupEircode } from "../lib/eircode";

const choiceClass =
  "inline-flex items-center rounded-full border border-stone-200/60 bg-white px-3 py-1.5 text-sm font-semibold text-stone-850 shadow-warm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md";

export function EircodeHint({
  id,
  postalCode,
  city,
  region,
  onUseTown,
}: {
  id: string;
  postalCode: string;
  city: string;
  region: string;
  onUseTown: (town: string, county: string) => void;
}) {
  const compact = postalCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const lookup = lookupEircode(postalCode);
  if (!lookup) {
    if (compact.length < 3) return null;
    return (
      <p id={id} role="status" className="text-sm text-terracotta-deep">
        This is not a recognised Eircode.
      </p>
    );
  }

  const matched = addressMatchesEircode(city, region, lookup);
  return (
    <div id={id} className="grid gap-2">
      <p role="status" className="text-sm text-stone-500">
        {eircodeSummary(lookup)}
      </p>
      {matched ? (
        <p className="text-sm text-sage">Town and county match this Eircode.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {lookup.towns.map((town) => (
            <button
              key={`${town.town}-${town.county}`}
              type="button"
              className={choiceClass}
              onClick={() => onUseTown(town.town, town.county)}
            >
              Use {town.town}, Co. {town.county}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
