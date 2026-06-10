// Puppeteer pre-audit hook for the Velocità Lighthouse gate (issue #39).
//
// The Vercel preview is SSO-protected. treosh/lighthouse-ci-action neither
// applies `settings.extraHeaders` to the navigation nor preserves a query
// string (it double-encodes `?`), so neither the bypass header nor a
// `?x-vercel-protection-bypass=` query param survives. This script is the
// action's documented escape hatch: it runs in the real browser BEFORE
// Lighthouse audits, sends the "Protection Bypass for Automation" secret as a
// header, and lets Vercel set the `_vercel_jwt` bypass cookie on the shared
// browser context. Lighthouse then audits the clean URL with that cookie
// present and reaches the real homepage (200) instead of vercel.com/login.
module.exports = async (browser, context) => {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (!secret) {
    // No secret in env -> let the run hit the wall; the workflow guard fails
    // loudly rather than passing a bogus login-page score.
    return;
  }
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    'x-vercel-protection-bypass': secret,
    'x-vercel-set-bypass-cookie': 'true',
  });
  // Priming navigation: the 307 response sets _vercel_jwt on the context.
  await page.goto(context.url, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.close();
};
