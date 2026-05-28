/**
 * Probe the chat UI end-to-end in a real browser.
 * Captures: console errors, network /api/chat round-trip, final DOM,
 * a screenshot for visual evaluation.
 *
 * Run with: pnpm exec tsx scripts/chat-probe.ts
 */
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), ".tmp-probe");
mkdirSync(OUT_DIR, { recursive: true });

const BASE_URL = "http://localhost:3000/el";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "el-GR",
  });
  const page = await context.newPage();

  // ---- Capture console messages ----
  const consoleLog: Array<{ type: string; text: string }> = [];
  page.on("console", (msg) => {
    consoleLog.push({ type: msg.type(), text: msg.text() });
  });
  page.on("pageerror", (err) => {
    consoleLog.push({ type: "pageerror", text: err.message });
  });

  // ---- Capture network calls to /api/chat ----
  const apiCalls: Array<{
    method: string;
    url: string;
    status?: number;
    requestBody?: string;
    responseSnippet?: string;
    error?: string;
  }> = [];

  page.on("request", (req) => {
    if (
      req.url().includes("/api/chat") ||
      req.url().includes("/api/cart/summary")
    ) {
      apiCalls.push({
        method: req.method(),
        url: req.url(),
        requestBody: req.postData() ?? undefined,
      });
    }
  });
  page.on("response", async (resp) => {
    const url = resp.url();
    if (!url.includes("/api/chat") && !url.includes("/api/cart/summary"))
      return;
    const matching = apiCalls.find(
      (c) => c.url === url && c.status === undefined,
    );
    if (!matching) return;
    matching.status = resp.status();
    try {
      const ct = resp.headers()["content-type"] ?? "";
      if (ct.includes("application/json")) {
        matching.responseSnippet = (await resp.text()).slice(0, 600);
      } else if (ct.includes("event-stream")) {
        // Streaming — we can't easily await full text, so capture headers + a hint
        matching.responseSnippet = `[stream] ${ct}`;
      } else {
        matching.responseSnippet = (await resp.text().catch(() => "")).slice(
          0,
          400,
        );
      }
    } catch (e) {
      matching.error = (e as Error).message;
    }
  });

  // ---- Navigate ----
  console.log("→ goto", BASE_URL);
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForTimeout(2000); // let hydration settle

  // Take "before" screenshot
  await page.screenshot({
    path: join(OUT_DIR, "01-landing.png"),
    fullPage: false,
  });

  // ---- Find and click the chat launcher ----
  const launcher = page.getByRole("button", {
    name: /Πιτ|chat|συνομιλία/i,
  });
  const launcherCount = await launcher.count();
  console.log("launcher count:", launcherCount);

  if (launcherCount === 0) {
    console.log("✗ NO LAUNCHER FOUND");
  } else {
    await launcher.first().click();
    await page.waitForTimeout(800);
    await page.screenshot({
      path: join(OUT_DIR, "02-panel-open.png"),
      fullPage: false,
    });
  }

  // ---- Find the input, type, submit ----
  const input = page.getByPlaceholder(/Πιτ|γρ|chat/i).first();
  const inputCount = await page.getByPlaceholder(/Πιτ|γρ|chat/i).count();
  console.log("input count:", inputCount);

  if (inputCount > 0) {
    await input.fill("Γεια, ψάχνω κράνος touring");
    await page.waitForTimeout(200);
    await page.screenshot({
      path: join(OUT_DIR, "03-typed.png"),
      fullPage: false,
    });

    // Submit via Enter or button click
    const sendBtn = page.getByRole("button", { name: /Στείλε|Send/i });
    if ((await sendBtn.count()) > 0) {
      await sendBtn.first().click();
    } else {
      await input.press("Enter");
    }

    // Wait for the streaming response to finish (or 25s timeout)
    await page.waitForTimeout(15_000);

    await page.screenshot({
      path: join(OUT_DIR, "04-after-send.png"),
      fullPage: false,
    });
  }

  // ---- Mobile viewport snapshot ----
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: join(OUT_DIR, "05-mobile.png"),
    fullPage: false,
  });

  // ---- DOM dump: find the CHAT panel specifically (not other dialogs) ----
  const chatInfo = await page.evaluate(() => {
    const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
    const chat = dialogs.find((d) =>
      (d.getAttribute("aria-label") ?? "").includes("Πιτ"),
    );
    if (!chat)
      return { found: false, html: "", textContent: "", bubbleCount: 0 };
    const bubbles = chat.querySelectorAll('[class*="bubble"]');
    return {
      found: true,
      html: chat.outerHTML,
      textContent: (chat as HTMLElement).innerText,
      bubbleCount: bubbles.length,
    };
  });
  writeFileSync(join(OUT_DIR, "chat-panel.html"), chatInfo.html);
  writeFileSync(join(OUT_DIR, "chat-text.txt"), chatInfo.textContent);

  // ---- Summary report ----
  const report = {
    timestamp: new Date().toISOString(),
    launcherFound: launcherCount > 0,
    inputFound: inputCount > 0,
    consoleErrors: consoleLog.filter(
      (c) => c.type === "error" || c.type === "pageerror",
    ),
    consoleWarnings: consoleLog.filter((c) => c.type === "warning"),
    apiCalls,
    chat: {
      panelFound: chatInfo.found,
      bubbleCount: chatInfo.bubbleCount,
      textPreview: chatInfo.textContent.slice(0, 800),
    },
  };
  writeFileSync(join(OUT_DIR, "report.json"), JSON.stringify(report, null, 2));

  console.log("\n=== REPORT ===");
  console.log(JSON.stringify(report, null, 2));

  await browser.close();
}

main().catch((e) => {
  console.error("PROBE FAILED:", e);
  process.exit(1);
});
