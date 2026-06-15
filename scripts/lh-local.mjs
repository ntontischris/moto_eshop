// Local Lighthouse runner mirroring lighthouserc.cjs (issue #71 perf loop).
// Usage: node scripts/lh-local.mjs <url> <label> [runs]
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";

const url = process.argv[2] ?? "http://localhost:3000/";
const label = process.argv[3] ?? "run";
const runs = Number(process.argv[4] ?? 3);
const outDir = ".lh-local";
mkdirSync(outDir, { recursive: true });

const results = [];
for (let i = 0; i < runs; i++) {
  const out = `${outDir}/${label}-${i}.json`;
  execFileSync(
    "npx.cmd",
    [
      "lighthouse",
      url,
      "--only-categories=performance",
      "--form-factor=mobile",
      "--screenEmulation.mobile",
      "--screenEmulation.width=412",
      "--screenEmulation.height=823",
      "--screenEmulation.deviceScaleFactor=1.75",
      "--throttling-method=simulate",
      "--output=json",
      `--output-path=${out}`,
      '--chrome-flags=--headless=new',
      "--quiet",
    ],
    { stdio: ["ignore", "ignore", "inherit"], shell: true },
  );
  const r = JSON.parse(readFileSync(out, "utf8"));
  const a = r.audits;
  const phases = {};
  for (const it of a["largest-contentful-paint-element"]?.details?.items ?? [])
    for (const x of it.items ?? [])
      if (x.phase) phases[x.phase] = Math.round(x.timing);
  results.push({
    perf: r.categories.performance.score,
    lcp: Math.round(a["largest-contentful-paint"].numericValue),
    fcp: Math.round(a["first-contentful-paint"].numericValue),
    tbt: Math.round(a["total-blocking-time"].numericValue),
    cls: a["cumulative-layout-shift"].numericValue,
    phases,
  });
  console.log(`${label}#${i}`, JSON.stringify(results[i]));
}
const med = (k) =>
  results.map((r) => r[k]).sort((a, b) => a - b)[Math.floor(runs / 2)];
console.log(
  `MEDIAN ${label}: perf=${med("perf")} lcp=${med("lcp")} fcp=${med("fcp")} tbt=${med("tbt")}`,
);
