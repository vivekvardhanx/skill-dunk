# Skill Dunk

Skill Dunk is a local-first skill discovery app for finding and practising small, unusual hobbies and interactive websites. It uses the Next.js App Router, TypeScript, Tailwind CSS, and curated local catalogs. Browsing does not require an account.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Next.js. Use `npm run build` to create a production build, `npm start` to serve it, and `npm run typecheck` to run TypeScript checks. There is no standalone test runner configured in this starter; the production build runs Next.js validation.

## Project structure

- `app/` contains the home route, shared document layout, global styling, and the dynamic `/skills/[slug]` guide route.
- `components/skill-dunk-app.tsx` provides title/category/description search, category and duration filters, saved-skill filtering, and the skill discovery experience.
- `components/website-library.tsx` provides website search, category filters, sorting, Surprise Me, and the no-account suggestion form.
- `components/use-skill-progress.ts` migrates existing bookmarks and persists Not Started, Learning, and Learned status in browser local storage.
- `components/lesson-detail.tsx` renders practice steps, prerequisites, related moves, materials, common mistakes, and milestones.
- `components/watch-and-learn.tsx` renders independently verified tutorials or a clearly labelled YouTube search fallback.
- `components/skill-artwork.tsx` creates the local CSS illustrations used across the app.
- `data/skills.ts` is the physical-skill catalog and source for statically generated detail pages.
- `data/websites.ts` is the curated, approved public website catalog.
- `app/api/` contains the public website feed, pending-only website suggestion submission, and protected moderation API.
- `lib/website-store.ts` stores pending suggestions and approved community listings in an atomic JSON file on the server.
- `app/admin/moderation/page.tsx` is the administrator interface; every data operation is independently authorized by the server.
- `app/error.tsx` and `app/not-found.tsx` provide recovery and missing-skill states.

Saved skills and their learning status are stored in browser local storage. Existing bookmarks are migrated automatically. This progress is device-specific and is not synced to an account. Practice-time filters match the catalog estimate exactly (2, 5, 10, or 30 minutes). Search supports the `/` focus shortcut and `Escape` to leave the search field.

## Suggestions and moderation setup

Website suggestions are validated on the server and stored with `pending` status. They are not returned by the public website API unless an administrator approves them after checking the destination. The server writes data to `.skill-dunk-data/websites.json` by default. Set `SKILL_DUNK_DATA_DIR` to a writable, persistent directory when deploying; the data file contains private submissions and should not be exposed by a static file server or committed to source control.

Set `SKILL_DUNK_ADMIN_TOKEN` on the server to a unique secret of at least 32 characters, then open `/admin/moderation` and enter that token to review suggestions. For example, generate a token locally with `openssl rand -hex 32` and put it in the deployment's server-only environment configuration. Do not prefix it with `NEXT_PUBLIC_` or commit it. The moderation API fails closed when no valid token is configured. Approval also requires the moderator to affirm that they opened and checked the destination.

The JSON store uses atomic file replacement and serializes writes within one server process. The suggestion rate limit is also in-memory and process-local. This is suitable for a single persistent local server; serverless, multi-instance, or ephemeral deployments need a shared persistent database/volume and a distributed rate limiter before accepting real public traffic. Do not treat the local JSON file or in-memory limiter as cross-instance storage or protection.

The 10 seeded website listings were checked against their official destinations on 2026-10-22. Pricing is marked unknown when it was not clear from the destination. Existing YouTube resource records are explicitly unverified, so the detail pages use search fallbacks until a tutorial is checked. No standalone test runner or lint script is configured; use `npm run typecheck` and `npm run build`.