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
export declare function format(ms: number, options?: FormatOptions): string;
