import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const deferredSource = readFileSync(
  new URL("./chat-deferred-mount.tsx", import.meta.url),
  "utf8",
);
const mountSource = readFileSync(
  new URL("./chat-mount.tsx", import.meta.url),
  "utf8",
);

// ADR 0008: the chat (@ai-sdk/react + ai, ~97KB gz) must stay off the initial
// storefront JS chunk. It loads through next/dynamic(ssr:false) after idle /
// first interaction. These source guards fail if a refactor reintroduces a
// static import of the heavy client chain into the eager path.
describe("chat stays code-split off the initial bundle", () => {
  it("loads the chat client via next/dynamic with ssr disabled", () => {
    expect(deferredSource).toContain('import dynamic from "next/dynamic"');
    expect(deferredSource).toContain("dynamic(");
    expect(deferredSource).toContain('import("./chat-mount-client")');
    expect(deferredSource).toMatch(/ssr:\s*false/);
  });

  it("arms the mount via the idle/interaction deferral helper", () => {
    expect(deferredSource).toContain("armOnIdleOrInteraction");
  });

  it("never statically imports the heavy chat chain in the deferred module", () => {
    // Only next/dynamic should reach the client; a top-level import of the
    // provider/client would pull @ai-sdk/react back into the eager chunk.
    expect(deferredSource).not.toMatch(/^import .*chat-mount-client/m);
    expect(deferredSource).not.toMatch(/from\s+["']@ai-sdk\/react["']/);
  });

  it("routes the server gateway through the deferred mount, not the eager client", () => {
    expect(mountSource).toContain("ChatDeferredMount");
    expect(mountSource).not.toContain("chat-mount-client");
  });
});
