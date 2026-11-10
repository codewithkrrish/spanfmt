import { UNITS, type Unit } from "./units.js";

export type DurationStyle = "short" | "long";
export type Rounding = "floor" | "ceil" | "nearest";

export interface FormatOptions {
  /**
   * "short" gives `1h 30m`; "long" gives `1 hour 30 minutes`.
   * Default: "short".
   */
  style?: DurationStyle;
  /**
   * Maximum number of units to show, e.g. `largest: 2` turns
   * 90,061,000 ms into `1d 1h` instead of `1d 1h 1m 1s`.
   * Default: show every unit.
   */
  largest?: number;
  /**
   * What to do with the part that gets cut off by `largest`:
   * "floor" drops it (default), "ceil" rounds the last shown unit up,
   * "nearest" rounds it up only if it is at least half a unit.
   */
  round?: Rounding;
}

interface Part {
  unit: Unit;
  /** Whole count, except the last part which may carry a fraction. */
  value: number;
}

/**
 * Format a duration in milliseconds as a human string.
 *
 * format(5_400_000)            // "1h 30m"
 * format(5_400_000, { style: "long" }) // "1 hour 30 minutes"
 * format(90_000)              // "1m 30s"
 * format(1500)                // "1s 500ms"
 * format(0)                   // "0s"
 * format(-90_000)             // "-1m 30s"
 *
 * spanfmt never hides precision: 1500 ms is "1s 500ms", not a rounded
 * "1.5s". If you want fewer units, say so with `largest` and pick a
 * rounding mode — the rounding is yours to choose, not mine to sneak in.
 */
export function format(ms: number, options: FormatOptions = {}): string {
  if (typeof ms !== "number" || Number.isNaN(ms)) {
    throw new TypeError(
      `spanfmt: format() expected a number of milliseconds, got ${String(ms)}`,
    );
  }
  if (!Number.isFinite(ms)) {
    throw new RangeError(`spanfmt: format() expected a finite duration, got ${ms}`);
  }

  const style = options.style ?? "short";
  if (style !== "short" && style !== "long") {
    throw new RangeError(`spanfmt: style must be "short" or "long", got "${String(style)}"`);
  }
  const round = options.round ?? "floor";
  if (round !== "floor" && round !== "ceil" && round !== "nearest") {
    throw new RangeError(
      `spanfmt: round must be "floor", "ceil" or "nearest", got "${String(round)}"`,
    );
  }
  const largest = options.largest ?? UNITS.length;
  if (!Number.isInteger(largest) || largest < 1) {
    throw new RangeError(
      `spanfmt: largest must be a whole number of 1 or more, got ${String(largest)}`,
    );
  }

  if (ms === 0) {
    return style === "long" ? "0 seconds" : "0s";
  }

  const sign = ms < 0 ? "-" : "";
  const abs = Math.abs(ms);

  // Integer counts per unit, biggest first. Zero counts are skipped later.
  const counts: number[] = [];
  let remaining = Math.floor(abs);
  for (const unit of UNITS) {
    const count = Math.floor(remaining / unit.ms);
    counts.push(count);
    remaining -= count * unit.ms;
  }

  const parts: Part[] = [];
  UNITS.forEach((unit, i) => {
    const count = counts[i];
    if (count !== undefined && count > 0) {
      parts.push({ unit, value: count });
    }
  });

  const truncated = parts.length > largest;
  const shown = parts.slice(0, largest);
  const last = shown[shown.length - 1];
  if (last === undefined) {
    return style === "long" ? "0 seconds" : "0s";
  }

  // Everything the shown parts don't cover: dropped units when truncated,
  // or just the sub-millisecond fraction when nothing was dropped.
  const covered = shown.reduce((sum, part) => sum + part.value * part.unit.ms, 0);
  const leftover = abs - covered;

  if (truncated) {
    if (round === "ceil" && leftover > 0) {
      carryUp(shown);
    } else if (round === "nearest" && leftover >= last.unit.ms / 2) {
      carryUp(shown);
    }
    // "floor": the leftover is simply dropped.
  } else if (leftover > 0) {
    // A fractional-millisecond input, e.g. 1500.5 -> "1s 500.5ms".
    last.value += leftover / last.unit.ms;
  }

  const rendered = shown
    .filter((part) => part.value !== 0)
    .map((part) => renderPart(part, style))
    .join(" ");

  return rendered === "" ? (style === "long" ? "0 seconds" : "0s") : sign + rendered;
}

function renderPart(part: Part, style: DurationStyle): string {
  const value = formatNumber(part.value);
  if (style === "long") {
    const name = part.value === 1 ? part.unit.name : part.unit.plural;
    return `${value} ${name}`;
  }
  return `${value}${part.unit.short}`;
}

/** Integers print as-is; fractions are trimmed to 2 decimals, no trailing zeros. */
function formatNumber(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return String(Math.round(value * 100) / 100);
}

/**
 * Bump the last shown part by one and roll it over into bigger units when
 * it fills one, e.g. 60m becomes 1h. Stops at weeks: a year is 365 days,
 * which is not a whole number of weeks, so 53w stays 53w.
 */
function carryUp(shown: Part[]): void {
  let index = shown.length - 1;
  const last = shown[index];
  if (last === undefined) {
    return;
  }
  last.value += 1;

  while (true) {
    const part = shown[index];
    if (part === undefined) {
      return;
    }
    const unitIndex = UNITS.indexOf(part.unit);
    if (unitIndex <= 0) {
      return; // Years: nothing bigger to roll into.
    }
    const bigger = UNITS[unitIndex - 1];
    if (bigger === undefined) {
      return;
    }
    const ratio = bigger.ms / part.unit.ms;
    if (!Number.isInteger(ratio) || part.value < ratio) {
      return;
    }
    part.value -= ratio;
    if (part.value === 0) {
      shown.splice(index, 1);
    }
    const biggerIndex = shown.findIndex((p) => p.unit === bigger);
    if (biggerIndex >= 0) {
      const target = shown[biggerIndex];
      if (target !== undefined) {
        target.value += 1;
      }
      index = biggerIndex;
    } else {
      // Insert the bigger unit where the rolled-over part was.
      shown.splice(index, 0, { unit: bigger, value: 1 });
      // index still points at the newly inserted part.
    }
  }
}
