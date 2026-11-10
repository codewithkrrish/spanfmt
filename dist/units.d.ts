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
export declare const UNITS: readonly Unit[];
/** Look a unit up by short label, long name, plural, or alias. Case-insensitive. */
export declare function lookupUnit(text: string): Unit | undefined;
