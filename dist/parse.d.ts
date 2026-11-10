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
export declare function parse(input: string): number;
/**
 * Like {@link parse}, but returns `null` instead of throwing.
 *
 * tryParse("1h 30m") // 5_400_000
 * tryParse("junk")   // null
 */
export declare function tryParse(input: string): number | null;
