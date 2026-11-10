/**
 * The units spanfmt knows about, biggest first.
 *
 * A year is fixed at 365 days and there is deliberately no month: months
 * are 28-31 days long, so "1 month" in milliseconds is a guess, and this
 * library doesn't guess.
 */
export interface Unit {
  /** Singular long name, e.g. "hour". */
  readonly name: string;
  /** Short label used in the short style, e.g. "h". */
  readonly short: string;
  /** Plural long name, e.g. "hours". */
  readonly plural: string;
  /** How many milliseconds one of this unit is. */
  readonly ms: number;
}

export const UNITS: readonly Unit[] = [
  { name: "year", short: "y", plural: "years", ms: 365 * 24 * 3_600_000 },
  { name: "week", short: "w", plural: "weeks", ms: 7 * 24 * 3_600_000 },
  { name: "day", short: "d", plural: "days", ms: 24 * 3_600_000 },
  { name: "hour", short: "h", plural: "hours", ms: 3_600_000 },
  { name: "minute", short: "m", plural: "minutes", ms: 60_000 },
  { name: "second", short: "s", plural: "seconds", ms: 1_000 },
  { name: "millisecond", short: "ms", plural: "milliseconds", ms: 1 },
];

/** Extra spellings people actually type, mapped to a unit's short label. */
const ALIASES: Readonly<Record<string, string>> = {
  sec: "s",
  secs: "s",
  min: "m",
  mins: "m",
  hr: "h",
  hrs: "h",
  msec: "ms",
  msecs: "ms",
  millis: "ms",
};

/** Look a unit up by short label, long name, plural, or alias. Case-insensitive. */
export function lookupUnit(text: string): Unit | undefined {
  const key = text.toLowerCase();
  for (const unit of UNITS) {
    if (key === unit.short || key === unit.name || key === unit.plural) {
      return unit;
    }
  }
  const aliased = ALIASES[key];
  if (aliased !== undefined) {
    return UNITS.find((unit) => unit.short === aliased);
  }
  return undefined;
}
