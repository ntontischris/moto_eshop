# Environment Setup

Create `.env.local` at the repo root with the following keys.
Values marked `…` need to be filled from the Supabase Dashboard
(Project Settings → API).

```dotenv
# ── Supabase (required) ──────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://wpknvrinvczlcydnxqss.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
SUPABASE_SERVICE_ROLE_KEY=…   # keep secret, server-only

# ── ERP integration ──────────────────────────────────────────
ERP_PROVIDER=entersoft
ENTERSOFT_API_KEY=78874555-d8b3-4119-bfb0-60c4ca6ee8b2,fb10bfa3-d9ab-4e28-95d9-d358e0d03f2a,01100128469
ENTERSOFT_API_URL=https://api.entersoft.gr/api/rpc/PublicQuery/ESWBCat

# ── Cron guard ───────────────────────────────────────────────
# generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
CRON_SECRET=

# ── Optional ─────────────────────────────────────────────────
# MEILI_HOST=
# MEILI_API_KEY=
```

## Workflow once `.env.local` is in place

```bash
# 1. Apply the new ERP migration to your Supabase project
pnpm db:link
pnpm db:push

# 2. Pull a fresh snapshot from Entersoft (you already have one from the bootstrap)
powershell -File scripts/pull-entersoft-data.ps1

# 3. Review what was pulled
pnpm tsx scripts/snapshot-stats.ts

# 4. Push the snapshot into Supabase
pnpm tsx scripts/sync-entersoft.ts all
# or step-by-step:
pnpm tsx scripts/sync-entersoft.ts brands
pnpm tsx scripts/sync-entersoft.ts products
pnpm tsx scripts/sync-entersoft.ts prices
pnpm tsx scripts/sync-entersoft.ts stock
pnpm tsx scripts/sync-entersoft.ts customers
pnpm tsx scripts/sync-entersoft.ts sites
```
