import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { format } from "../dist/index.js";

describe("format — basics", () => {
  it("formats whole units in short style", () => {
    assert.equal(format(5_400_000), "1h 30m");
    assert.equal(format(90_000), "1m 30s");
    assert.equal(format(90_061_000), "1d 1h 1m 1s");
    assert.equal(format(500), "500ms");
  });

  it("formats zero and negatives", () => {
    assert.equal(format(0), "0s");
    assert.equal(format(0, { style: "long" }), "0 seconds");
    assert.equal(format(-90_000), "-1m 30s");
    assert.equal(format(-0), "0s");
  });

  it("keeps full precision instead of rounding silently", () => {
    assert.equal(format(1500), "1s 500ms");
    assert.equal(format(1500.5), "1s 500.5ms");
    assert.equal(format(999), "999ms");
  });

  it("formats long style with singular/plural", () => {
    assert.equal(format(5_400_000, { style: "long" }), "1 hour 30 minutes");
    assert.equal(format(3_600_000, { style: "long" }), "1 hour");
    assert.equal(format(86_400_000, { style: "long" }), "1 day");
    assert.equal(format(172_800_000, { style: "long" }), "2 days");
  });

  it("handles weeks and years", () => {
    assert.equal(format(7 * 86_400_000), "1w");
    assert.equal(format(365 * 86_400_000), "1y");
    assert.equal(format(365 * 86_400_000 + 86_400_000), "1y 1d");
  });
});

describe("format — largest and rounding", () => {
  it("limits units with largest", () => {
    assert.equal(format(90_061_000, { largest: 2 }), "1d 1h");
    assert.equal(format(90_061_000, { largest: 1 }), "1d");
    assert.equal(format(5_400_000, { largest: 5 }), "1h 30m");
  });

  it("floors the cut-off part by default", () => {
    assert.equal(format(3_599_999, { largest: 1 }), "59m");
    assert.equal(format(90_061_000, { largest: 2, round: "floor" }), "1d 1h");
  });

  it("ceils the cut-off part when asked", () => {
    assert.equal(format(3_599_999, { largest: 1, round: "ceil" }), "1h");
    assert.equal(format(90_061_000, { largest: 2, round: "ceil" }), "1d 2h");
    // Exact values don't round up: nothing was cut off.
    assert.equal(format(3_600_000, { largest: 1, round: "ceil" }), "1h");
  });

  it("rounds to nearest when asked", () => {
    // 59m 59s: leftover 59s is more than half a minute.
    assert.equal(format(3_599_000, { largest: 1, round: "nearest" }), "1h");
    // 59m 29s: leftover 29s is less than half a minute.
    assert.equal(format(3_569_000, { largest: 1, round: "nearest" }), "59m");
    // Exactly half rounds up.
    assert.equal(format(3_570_000, { largest: 1, round: "nearest" }), "1h");
  });
});

describe("format — bad input", () => {
  it("throws a readable error, not a crash, for bad values", () => {
    assert.throws(() => format(Number.NaN), /expected a number/);
    assert.throws(() => format(Infinity), /finite/);
    assert.throws(() => format("90s"), /expected a number/);
  });

  it("throws for bad options", () => {
    assert.throws(() => format(1000, { style: "fancy" }), /style must be/);
    assert.throws(() => format(1000, { round: "up" }), /round must be/);
    assert.throws(() => format(1000, { largest: 0 }), /largest must be/);
    assert.throws(() => format(1000, { largest: 1.5 }), /largest must be/);
  });
});
