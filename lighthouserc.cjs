// Lighthouse CI config (Velocità performance gate, issue #39).
//
// JS (not JSON) so the Vercel "Protection Bypass for Automation" secret can be
// injected at runtime via extraHeaders. The Vercel preview has Deployment
// Protection (SSO) enabled; without the bypass header Lighthouse is redirected
// to vercel.com/login and would score the login page instead of the homepage.
//
// The secret is read from the env var VERCEL_AUTOMATION_BYPASS_SECRET, which the
// workflow passes in (never logged). We send ONLY x-vercel-protection-bypass:
// adding x-vercel-set-bypass-cookie makes Vercel answer the first navigation
// with a 307 cookie-priming redirect that Lighthouse mishandles (it lands on
// vercel.com/login). The header alone returns the homepage directly (200).
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

const extraHeaders = bypassSecret
  ? { 'x-vercel-protection-bypass': bypassSecret }
  : undefined;

module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      settings: {
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 412,
          height: 823,
          deviceScaleFactor: 1.75,
          disabled: false,
        },
        throttlingMethod: 'simulate',
        onlyCategories: ['performance'],
        ...(extraHeaders ? { extraHeaders } : {}),
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9, aggregationMethod: 'median-run' }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1, aggregationMethod: 'median-run' }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500, aggregationMethod: 'median-run' }],
      },
    },
    // The LHR's configSettings include the bypass header, so it must NOT go to
    // public storage. Keep reports as private GitHub Actions artifacts only
    // (workflow: uploadArtifacts: true, temporaryPublicStorage: false).
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
