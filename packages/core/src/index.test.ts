import { describe, expect, it } from "vitest";
import { err, ok, type Result } from "./index";

describe("Result", () => {
  it("ok wraps a value", () => {
    const r: Result<number> = ok(42);
    expect(r).toEqual({ ok: true, value: 42 });
  });

  it("err wraps an error", () => {
    const r: Result<number> = err(new Error("boom"));
    expect(r.ok).toBe(false);
  });
});
