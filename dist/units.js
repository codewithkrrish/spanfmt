export const UNITS = [
    { name: "year", short: "y", plural: "years", ms: 365 * 24 * 3_600_000 },
    { name: "week", short: "w", plural: "weeks", ms: 7 * 24 * 3_600_000 },
    { name: "day", short: "d", plural: "days", ms: 24 * 3_600_000 },
    { name: "hour", short: "h", plural: "hours", ms: 3_600_000 },
    { name: "minute", short: "m", plural: "minutes", ms: 60_000 },
    { name: "second", short: "s", plural: "seconds", ms: 1_000 },
    { name: "millisecond", short: "ms", plural: "milliseconds", ms: 1 },
];
/** Extra spellings people actually type, mapped to a unit's short label. */
const ALIASES = {
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
export function lookupUnit(text) {
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
