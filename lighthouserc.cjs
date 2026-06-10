// Lighthouse CI config (Velocità performance gate, issue #39).
//
// Mobile emulation, median of 3 runs (flake guard), against the Vercel preview
// homepage. Deployment Protection is disabled for non-production deployments,
// so Lighthouse reaches the preview directly (no auth bypass needed).
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
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
