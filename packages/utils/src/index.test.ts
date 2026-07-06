import { describe, expect, it } from "vitest";
import { generateId, parseJson } from "./index";

describe("parseJson", () => {
  it("returns ok for valid JSON", () => {
    const r = parseJson<{ a: number }>('{"a":1}');
    expect(r.ok && r.value.a).toBe(1);
  });

  it("returns err for invalid JSON", () => {
    expect(parseJson("nope").ok).toBe(false);
  });
});

describe("generateId", () => {
  it("produces unique values", () => {
    expect(generateId()).not.toBe(generateId());
  });
});
