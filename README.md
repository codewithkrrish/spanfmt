# spanfmt

Format milliseconds into human durations and parse them back. Zero dependencies, TypeScript, strict where it matters.

```js
import { format, parse } from "spanfmt";

format(5_400_000);            // "1h 30m"
format(5_400_000, { style: "long" }); // "1 hour 30 minutes"
format(90_061_000, { largest: 2 });   // "1d 1h"
parse("1h 30m");              // 5400000
parse("2d 4h");               // 187200000
```

## Why I built this

Every project I touch ends up with the same little helper: turn a millisecond count into something a human can read, usually for a log line, a countdown, or a "took 1h 30m" summary. And every time I wrote it, it was slightly different, slightly wrong — rounding where it shouldn't, or choking on input like `"1h30m"` because someone forgot the space.

So I wrote it once, properly, and now I just install it.

Two decisions shape the whole library:

1. **It never hides precision.** `format(1500)` is `"1s 500ms"`, not a rounded `"1.5s"`. If you want fewer units, you say so with `largest` and pick how the cut-off part is handled — `floor`, `ceil`, or `nearest`. The rounding is your choice, not something I sneak in.
2. **The parser refuses to guess.** `parse("1x")`, `parse("1h 30")`, `parse("1h 1h")`, `parse("tomorrow")` all throw a `ParseError` that names what went wrong. A duration parser that silently accepts junk will eventually corrupt your data; this one would rather fail loudly. `tryParse` returns `null` instead of throwing when you'd rather handle it yourself.

## Install

```bash
npm install spanfmt
```

Or straight from GitHub:

```bash
npm install git+https://github.com/codewithkrrish/spanfmt.git
```

Requires Node 18+ (ESM). Ships compiled JavaScript plus type declarations — no build step on your side.

## Usage

### `format(ms, options?)`

```js
format(0);                    // "0s"
format(500);                  // "500ms"
format(90_000);               // "1m 30s"
format(90_061_000);           // "1d 1h 1m 1s"
format(-90_000);              // "-1m 30s"
format(1500.5);               // "1s 500.5ms"
format(604_800_000);          // "1w"
format(31_536_000_000);       // "1y"

// Long style
format(5_400_000, { style: "long" }); // "1 hour 30 minutes"
format(3_600_000, { style: "long" }); // "1 hour"

// Fewer units — the cut-off part is floored by default
format(90_061_000, { largest: 2 });                 // "1d 1h"
format(3_599_999, { largest: 1, round: "ceil" });   // "1h"
format(3_599_000, { largest: 1, round: "nearest" });// "1h"
format(3_569_000, { largest: 1, round: "nearest" });// "59m"
```

| Option | Default | What it does |
| --- | --- | --- |
| `style` | `"short"` | `"short"` gives `1h 30m`; `"long"` gives `1 hour 30 minutes`. |
| `largest` | all units | Maximum number of units to show. |
| `round` | `"floor"` | How the cut-off part is handled: `"floor"` drops it, `"ceil"` rounds the last shown unit up, `"nearest"` rounds up only at half a unit or more. |

Bad input throws a readable error: `format(NaN)` and `format(Infinity)` throw, as do invalid options. Nothing ever prints a stack trace at you — the messages say what was wrong and what was expected.

### `parse(input)` / `tryParse(input)`

```js
parse("1h 30m");              // 5400000
parse("1h30m");               // 5400000 — spaces are optional
parse("1 hour, 30 minutes");  // 5400000 — commas and "and" work too
parse("1.5h");                // 5400000
parse("90");                  // 90 — a bare number means milliseconds
parse("-1h 30m");             // -5400000

parse("1x");                  // throws ParseError: unknown unit "x"
parse("1h 30");               // throws ParseError: every part needs a unit
parse("1h 1h");               // throws ParseError: unit "hour" appears twice
parse("");                    // throws ParseError: cannot parse an empty duration

tryParse("1h 30m");           // 5400000
tryParse("junk");             // null
```

Units, case-insensitive: `y w d h m s ms`, long names (`year`, `hour`, `minute`...), plurals, and common aliases (`sec`, `min`, `hr`, `msec`).

### Round-trip

For whole-millisecond values, `parse(format(ms)) === ms`.

## Limitations

Honest ones, not fine print:

- **No months.** A month is 28–31 days, so "1 month" in milliseconds is a guess, and this library doesn't guess. A year is fixed at 365 days.
- **Weeks don't roll into years.** 52 weeks plus a bump stays `53w`, because 365 days isn't a whole number of weeks. Everything else rolls over normally (`60m` becomes `1h`).
- **Fractions are trimmed to 2 decimals** on the smallest shown unit (`1.5s` style input aside — see above, the library keeps exact values, it just doesn't print more than two decimal places).
- **No locales.** Output is English only. If you need i18n, `Intl.DurationFormat` is the right tool.

## Project structure

```
spanfmt/
├── src/
│   ├── index.ts     # public exports
│   ├── format.ts    # format()
│   ├── parse.ts     # parse() and tryParse()
│   ├── units.ts     # unit table and lookup
│   └── errors.ts    # ParseError
├── test/
│   ├── format.test.mjs
│   └── parse.test.mjs
├── dist/            # compiled output (built with tsc, committed so git installs work)
├── package.json
└── tsconfig.json
```

## Development

```bash
npm install
npm test        # builds with tsc, then runs node:test
```

## License

MIT — see [LICENSE](LICENSE).

## Author

Krrish — [github.com/codewithkrrish](https://github.com/codewithkrrish)
