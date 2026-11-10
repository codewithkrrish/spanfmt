import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parse, tryParse, format, ParseError } from "../dist/index.js";

describe("parse — happy path", () => {
  it("parses short units", () => {
    assert.equal(parse("1h 30m"), 5_400_000);
    assert.equal(parse("90s"), 90_000);
    assert.equal(parse("500ms"), 500);
    assert.equal(parse("2d 4h"), 2 * 86_400_000 + 4 * 3_600_000);
  });

  it("parses long names, plurals, and mixed case", () => {
    assert.equal(parse("1 hour 30 minutes"), 5_400_000);
    assert.equal(parse("2 Days"), 172_800_000);
    assert.equal(parse("1H 30M"), 5_400_000);
    assert.equal(parse("45 Secs"), 45_000);
    assert.equal(parse("10 mins"), 600_000);
  });

  it("parses without spaces, with commas, and with 'and'", () => {
    assert.equal(parse("1h30m"), 5_400_000);
    assert.equal(parse("1h, 30m"), 5_400_000);
    assert.equal(parse("1h and 30m"), 5_400_000);
    assert.equal(parse("1h,30m,15s"), 5_415_000);
  });

  it("parses decimals and bare numbers", () => {
    assert.equal(parse("1.5h"), 5_400_000);
    assert.equal(parse(".5s"), 500);
    assert.equal(parse("90"), 90); // bare number = milliseconds
    assert.equal(parse("0"), 0);
  });

  it("parses negatives", () => {
    assert.equal(parse("-1h 30m"), -5_400_000);
    assert.equal(parse("-90"), -90);
    assert.equal(parse("+1h"), 3_600_000);
  });

  it("round-trips with format for whole values", () => {
    for (const ms of [0, 500, 1500, 90_000, 5_400_000, 90_061_000, 604_800_000]) {
      assert.equal(parse(format(ms)), ms, `round-trip failed for ${ms}`);
    }
  });
});

describe("parse — strict rejection", () => {
  const junk = [
    "",
    "   ",
    "abc",
    "tomorrow",
    "1x",
    "1 fortnight",
    "1h 30", // unit missing on the last part
    "1h 1h", // same unit twice
    "1.2.3h",
    "h",
    "1h -30m",
    "1,000h", // comma is a separator, not a thousands separator
    "-",
  ];

  for (const input of junk) {
    it(`rejects ${JSON.stringify(input)}`, () => {
      assert.throws(() => parse(input), ParseError);
    });
  }

  it("names the problem in the error message", () => {
    assert.throws(() => parse("1x"), /unknown unit "x"/);
    assert.throws(() => parse("1h 30"), /every part needs a unit/);
    assert.throws(() => parse("1h 1h"), /appears twice/);
    assert.throws(() => parse(""), /empty/);
  });

  it("throws ParseError, not a raw TypeError, for non-strings", () => {
    assert.throws(() => parse(90_000), ParseError);
    assert.throws(() => parse(undefined), ParseError);
  });
});

describe("tryParse", () => {
  it("returns the value on good input and null on junk", () => {
    assert.equal(tryParse("1h 30m"), 5_400_000);
    assert.equal(tryParse("nope"), null);
    assert.equal(tryParse(""), null);
    assert.equal(tryParse("1h 1h"), null);
  });
});
