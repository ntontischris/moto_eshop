// Lighthouse CI config (Velocità performance gate, issue #39).
//
// The Vercel preview has Deployment Protection (SSO) enabled. Lighthouse's
// `settings.extraHeaders` is NOT applied to the navigation by
// treosh/lighthouse-ci-action, so the bypass is instead carried as a query
// param on the audited URL (built in the workflow from the
// VERCEL_AUTOMATION_BYPASS_SECRET). Because that secret ends up in the report's
// requestedUrl, reports stay PRIVATE (filesystem artifact, no public storage).
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
