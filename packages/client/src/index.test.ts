import { describe, expect, it } from "vitest";
import { UserClient } from "./index";

describe("UserClient", () => {
  it("creates and retrieves a user (core + utils integration)", () => {
    const client = new UserClient();
    const created = client.create("Alice");
    const found = client.get(created.id);
    expect(found.ok && found.value.name).toBe("Alice");
  });

  it("returns err for unknown id", () => {
    expect(new UserClient().get("missing").ok).toBe(false);
  });

  it("builds a user from JSON", () => {
    const r = new UserClient().fromJson('{"name":"Bob"}');
    expect(r.ok && r.value.name).toBe("Bob");
  });
});
