# Onboard Release Checklist

## Environment and security

- [ ] Checkout is linked to the intended existing Vercel project; no new project was created.
- [ ] Git remote is unchanged and no release work was pushed automatically.
- [ ] `DATABASE_URL` or `STORAGE_DATABASE_URL` exists in Vercel Development, Preview, and Production.
- [ ] `NEXUS_DEMO_ACCESS_CODE` and `NEXUS_SESSION_SECRET` are long, random, server-only, and different by environment.
- [ ] No database URL or secret uses a `VITE_` prefix.
- [ ] `.env.local`, `.env.test.local`, and `.vercel/` remain gitignored.
- [ ] Only fictional employee data is present.

## Database

- [ ] `npm run db:inspect` confirms the intended dedicated Neon database without printing credentials.
- [ ] `npm run db:migrate` applies all pending migrations successfully.
- [ ] A separate test branch/database is configured as `TEST_DATABASE_URL` for integration tests.
- [ ] Persistent rehearsal cases are archived from the UI instead of manually deleted.

## Automated gates

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run test:integration` reports passing tests, not skipped tests.

## Functional acceptance

- [ ] Signed demo session is required before any case read or mutation.
- [ ] Fictional Maryam Arif New Hire demo data generates and persists a case and request bundle.
- [ ] Refresh and reopen retrieves the saved case.
- [ ] Draft edits and optional exclusion persist.
- [ ] Simulated submission is unmistakably labelled and creates no external request.
- [ ] Ticket status changes update readiness without falsely verifying prerequisites.
- [ ] Application access can block the first meaningful work task.
- [ ] Completion is rejected while any included required ticket or required prerequisite remains unresolved.
- [ ] Audit history is visible and includes the main mutation events.
- [ ] Fictional Jim Halpert Ministry Transfer generates previous-access removal and new role-based access requests.
- [ ] Starter Brief is labelled rule-based/not AI.
- [ ] Fixtures and persistent records have distinct source labels.
- [ ] Archive is unavailable for fixtures and soft-archives persistent cases only after confirmation.

## Browser and presentation

- [ ] Desktop flow is readable with no overlapping controls or unexpected horizontal page overflow.
- [ ] Mobile-width flow remains usable; wide case/request tables scroll inside their cards.
- [ ] Keyboard navigation reaches primary controls with visible focus.
- [ ] Browser refresh preserves server-backed records.
- [ ] English product copy consistently says **Onboard**.
- [ ] Tagline reads **One intake. Every request. Ready for day one.**
- [ ] No claim of OPS endorsement, external integrations, PDF export, or configured AI appears.
- [ ] `DEMO_RUNBOOK.md` has been rehearsed once against the same environment judges will see.

## Exact live-verification order

```bash
npm ci
npx vercel link
npx vercel env pull .env.local --yes --environment=development
npm run db:inspect
npm run db:migrate
npm run typecheck
npm run lint
npm test
npm run build
npm run test:integration
npx vercel dev
```

Stop if project identity, database identity, or credentials are uncertain. Do not create a replacement Vercel project, migrate production data, change Git remotes, push, or deploy as part of this checklist.
