import { lookupUnit } from "./units.js";
import { ParseError } from "./errors.js";
/** Matches one `number + unit` component, e.g. `1.5h` or `30 minutes`. */
const COMPONENT = /(\d+(?:\.\d+)?|\.\d+)\s*([a-z]+)/gi;
/** What may sit between two components: spaces, commas, the word "and". */
const SEPARATOR = /^[\s,]*(\band\b[\s,]*)*$/i;
/**
 * Parse a human duration back into milliseconds.
 *
 * parse("1h 30m")            // 5_400_000
 * parse("90s")               // 90_000
 * parse("1.5h")              // 5_400_000
 * parse("1h30m")             // 5_400_000
 * parse("1 hour, 30 minutes") // 5_400_000
 * parse("90")                // 90 (a bare number means milliseconds)
 * parse("-1h 30m")           // -5_400_000
 *
 * Strict on purpose: anything it can't read cleanly throws a ParseError
 * instead of guessing. "1x", "1h 30", "1h 1h", "tomorrow", "" — all throw.
 * If you'd rather get `null` than an exception, use {@link tryParse}.
 */
export function parse(input) {
    if (typeof input !== "string") {
        throw new ParseError(`spanfmt: parse() expected a string, got ${typeof input}`);
    }
    const trimmed = input.trim();
    if (trimmed === "") {
        throw new ParseError("spanfmt: cannot parse an empty duration");
    }
    // A leading sign applies to the whole duration: "-1h 30m" is -5,400,000.
    let sign = 1;
    let text = trimmed;
    if (text.startsWith("-") || text.startsWith("+")) {
        sign = text.startsWith("-") ? -1 : 1;
        text = text.slice(1).trimStart();
        if (text === "") {
            throw new ParseError(`spanfmt: "${input}" has a sign but no duration`);
        }
    }
    // A bare number on its own means milliseconds, the library's base unit.
    if (/^-?\d+(?:\.\d+)?$/.test(text) || /^\.\d+$/.test(text)) {
        const value = Number(text);
        if (!Number.isFinite(value)) {
            throw new ParseError(`spanfmt: "${input}" is too large to be a duration`);
        }
        return sign * value;
    }
    let total = 0;
    let components = 0;
    let position = 0;
    const seen = new Set();
    COMPONENT.lastIndex = 0;
    let match;
    while ((match = COMPONENT.exec(text)) !== null) {
        const gap = text.slice(position, match.index);
        if (!SEPARATOR.test(gap)) {
            throw new ParseError(`spanfmt: could not read "${gap.trim()}" in "${input}" — ` +
                `components must be separated by spaces, commas, or "and"`);
        }
        const amount = match[1];
        const unitText = match[2];
        if (amount === undefined || unitText === undefined) {
            throw new ParseError(`spanfmt: could not read "${match[0]}" in "${input}"`);
        }
        const unit = lookupUnit(unitText);
        if (unit === undefined) {
            throw new ParseError(`spanfmt: unknown unit "${unitText}" in "${input}"`);
        }
        if (seen.has(unit.name)) {
            throw new ParseError(`spanfmt: unit "${unit.name}" appears twice in "${input}"`);
        }
        seen.add(unit.name);
        total += Number(amount) * unit.ms;
        components += 1;
        position = COMPONENT.lastIndex;
    }
    const tail = text.slice(position);
    if (!SEPARATOR.test(tail)) {
        throw new ParseError(`spanfmt: could not read "${tail.trim()}" in "${input}" — ` +
            `every part needs a unit, e.g. "1h 30m" not "1h 30"`);
    }
    if (components === 0) {
        throw new ParseError(`spanfmt: no duration found in "${input}"`);
    }
    if (!Number.isFinite(total)) {
        throw new ParseError(`spanfmt: "${input}" is too large to be a duration`);
    }
    return sign * total;
}
/**
 * Like {@link parse}, but returns `null` instead of throwing.
 *
 * tryParse("1h 30m") // 5_400_000
 * tryParse("junk")   // null
 */
export function tryParse(input) {
    try {
        return parse(input);
    }
    catch (error) {
        if (error instanceof ParseError) {
            return null;
        }
        throw error;
    }
}
