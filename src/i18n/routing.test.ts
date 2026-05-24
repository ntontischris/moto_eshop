import { describe, it, expect } from "vitest";
import { routing } from "./routing";

describe("routing", () => {
  it("uses el as default and ships the 6 launch locales", () => {
    expect(routing.defaultLocale).toBe("el");
    expect(routing.locales).toEqual(["el", "en", "bg", "sr", "ro", "sq"]);
  });
  it("keeps Greek unprefixed (as-needed)", () => {
    expect(routing.localePrefix).toBe("as-needed");
  });
});
