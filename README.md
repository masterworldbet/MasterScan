# MasterScan

Minimal programmer-style Web Status & System Analyzer.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to GitHub + Vercel

1. Create a new GitHub repository.
2. Upload all files in this project.
3. Import the repository into Vercel.
4. Framework: Next.js.
5. Build command: `npm run build`.
6. Deploy.

## Important

The current `/api/scan` endpoint contains DEMO DATA.

The 10-second countdown is handled in the browser. The API currently returns a demo result after the countdown.

The 3 scans/day limit in this V1 is stored in browser localStorage. It is suitable for UI testing, but it is NOT a secure server-side quota.

For a production 3-scans/day system, connect the scan route to Supabase/Redis/database and enforce the quota server-side.

## Result fields

- User status: LOCKED / UNLOCKED
- Current win rate
- Win rate modified: YES / NO
- API server
