import { Calendar } from "lucide-react";
import type { Ref } from "react";
import { displayDate, parseFlexibleDate } from "../lib/dates";
import { labelClass } from "./styles";

export function DateField({
  id,
  label,
  ariaLabel,
  value,
  onChange,
  error,
  autoComplete,
  inputRef,
  className = "",
}: {
  id?: string;
  label?: string;
  ariaLabel?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
  inputRef?: Ref<HTMLInputElement>;
  className?: string;
}) {
  const shown = displayDate(value);
  const pickerValue = parseFlexibleDate(value) ?? "";
  const errorId = id && error ? `${id}-error` : undefined;
  const calendarLabel = ariaLabel ? `Open calendar for ${ariaLabel}` : label ? `Open calendar for ${label}` : "Open calendar";

  function commit(next: string) {
    if (!next.trim()) {
      onChange("");
      return;
    }
    onChange(parseFlexibleDate(next) ?? next);
  }

  return (
    <div className={className}>
      {label ? (
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
      ) : null}
      <div className={`relative ${label ? "mt-1" : ""}`}>
        <input
          ref={inputRef}
          id={id}
          className="w-full rounded-2xl border border-stone-200/60 bg-white py-2.5 pl-3.5 pr-12 text-sm text-stone-850 shadow-warm"
          type="text"
          inputMode="text"
          autoComplete={autoComplete}
          autoCapitalize="off"
          spellCheck={false}
          placeholder="dd/mm/yyyy"
          aria-label={label ? undefined : ariaLabel}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          value={shown}
          onChange={(event) => commit(event.target.value)}
        />
        <div className="absolute inset-y-0 right-0 w-11 overflow-hidden">
          <span className="pointer-events-none flex h-full items-center justify-center text-stone-500" aria-hidden>
            <Calendar size={16} />
          </span>
          <input
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            type="date"
            tabIndex={-1}
            aria-label={calendarLabel}
            value={pickerValue}
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-sm text-terracotta-deep">
          {error}
        </p>
      ) : null}
    </div>
  );
}
