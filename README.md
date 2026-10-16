# Onboard

**One intake. Every request. Ready for day one.**

Onboard is a React 18, TypeScript, and Vite release candidate for employee onboarding and internal transfers. It verifies more than administrative completion: managers can see whether an employee has the equipment, accounts, application access, knowledge, approvals, and contacts required to perform a meaningful first task.

This independent ThunderHacks II prototype was inspired by firsthand onboarding friction observed during OPS internships. It is not affiliated with or endorsed by the Ontario Public Service, and its demo data is entirely fictional.

## What works today

- **Real:** server-validated case CRUD, Neon PostgreSQL persistence, signed demo sessions, editable request drafts, optional-draft exclusion, workflow transitions, evidence-backed Day-One Preflight, deterministic readiness, completion guards, soft archive, and append-only audit history.
- **Simulated:** bulk submission records internal Onboard state and an audit event. It does not create ONRequest, ServiceNow, facilities, access, equipment, or identity records.
- **Rule-based, not AI:** Starter Brief uses a transparent deterministic parser. No AI provider is configured and no AI capability is claimed.
- **Future scope:** production identity/SSO and organization authorization, service-desk connectors, actual provisioning, reviewed AI handoff, and PDF generation.

Fixtures under `src/fixtures` are read-only and clearly labelled. They never become application records. Persistent cases are returned by the server and labelled separately in the UI.

The two fictional presentation scenarios are **Maryam Arif**, a New Hire whose first work remains blocked until application access is verified, and **Jim Halpert**, a Ministry Transfer from the Community Programs Ministry to the Workplace Collaboration Branch in the Digital Enablement Ministry. Loading either preset creates a new draft. Opening its fixture is read-only; **Start Editable Demo** creates a separate persistent case and request bundle through the normal APIs. Neither action renames or overwrites an existing Neon record.

## Architecture and security

- Frontend: the existing Vite/React single-page app.
- API: Node.js Vercel Function at `api/[...route].ts`.
- Database: Neon PostgreSQL through `@neondatabase/serverless` and parameterized SQL.
- Transactions: multi-table mutations and their audit events commit or roll back together; case-level advisory locks serialize workflow changes.
- Demo access: a server-validated access code issues a signed eight-hour HttpOnly, Secure, SameSite=Strict cookie. The visible manager label is context, not authorization.
- Readiness: a work task is ready only after all required prerequisites are explicitly verified. Closing a ticket alone does not prove the employee can work.

Database credentials and session secrets are server-only. Never create `VITE_DATABASE_URL`, `VITE_STORAGE_DATABASE_URL`, or any other browser-exposed secret.

## Local setup

Prerequisites: Node.js 20+, npm, and a local `.env.local` containing the existing Neon connection and demo secrets. This checkout does not need to be linked to Vercel to run locally.

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Confirm `.env.local` has `DATABASE_URL` (preferred) or `STORAGE_DATABASE_URL`, plus unique random `NEXUS_DEMO_ACCESS_CODE` and `NEXUS_SESSION_SECRET` values. Never commit or paste their values into logs. See `.env.example` for names only.

3. Inspect the target without printing its connection string. Confirm it is the dedicated Neon database for the existing project:

   ```bash
   npm run db:inspect
   ```

4. Apply additive migrations when setting up a new database:

   ```bash
   npm run db:migrate
   ```

5. Run the complete frontend and API together:

   ```bash
   npm run dev
   ```

Open `http://127.0.0.1:5173`. The command explicitly loads `.env.local`, serves Vite and the real API in one process, and binds only to loopback. It enables automatic demo access only inside this local development host so a developer does not need to re-enter the access code. The bypass is rejected whenever `NODE_ENV=production` or Vercel runtime variables are present; deployed environments continue to require the signed HttpOnly session.

`npm run dev:vite` is frontend-only and intentionally does not provide persistence. Use it only for isolated visual work.

For Vercel environment setup, link the intended existing project once and pull Development variables only if `.env.local` does not already exist:

```bash
npx vercel link
npx vercel env pull .env.local --yes --environment=development
```

## Database schema

- `nexus_cases`: intake, case status, and bundle-submission time.
- `nexus_tickets`: editable request drafts, inclusion, approval, and fulfillment status.
- `nexus_work_tasks`: meaningful first-work outcomes.
- `nexus_prerequisites`: required equipment, account, application-access, knowledge, approval, and contact evidence.
- `nexus_audit_events`: append-only mutation history.
- `nexus_schema_migrations`: migration ledger.

The internal `nexus_*` names are intentionally preserved for compatibility. Standard PostgreSQL migrations live in `migrations/` and run in filename order. Never edit a migration that has already been applied; add the next numbered migration.

## API

All case routes require the signed demo session.

- `POST /api/session`, `DELETE /api/session`
- `GET /api/cases`, `POST /api/cases`
- `GET /api/cases/:id`, `PATCH /api/cases/:id`, `DELETE /api/cases/:id`
- `POST /api/cases/:id/bundle`, `POST /api/cases/:id/submit`
- `PATCH /api/cases/:id/tickets/:ticketId`
- `GET /api/cases/:id/preflight`
- `PATCH /api/cases/:id/prerequisites/:prerequisiteId`
- `POST /api/cases/:id/complete`
- `GET /api/cases/:id/audit`

Zod validates request bodies. TypeScript rules and PostgreSQL triggers enforce case and ticket transitions. Completion is rejected while an included required ticket is incomplete or a required Day-One prerequisite is unverified.

## Verification

Credential-free release gates:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

For live integration tests, create `.env.test.local` with a **separate Neon test branch/database**:

```dotenv
TEST_DATABASE_URL=postgresql://user:password@test-host/test-database?sslmode=require
```

Then run:

```bash
npm run test:integration
```

With `npm run dev` already running, exercise the actual browser-facing HTTP stack and Neon database with:

```bash
npm run test:http
```

The HTTP smoke test creates uniquely named fictional records through the API and soft-archives them during cleanup. It covers session issuance, arbitrary intake, reload, bundle generation, draft editing/exclusion, internal submission, fulfillment/readiness changes, preflight evidence, completion guards, audit history, and editable Maryam/Jim demo copies.

The integration suite applies migrations, exercises a signed session through the Function handler, creates and reloads cases, edits/excludes drafts, submits internally, changes ticket fulfillment, proves closed tickets do not satisfy prerequisites, rejects premature completion, verifies evidence, completes and audits a case, and covers internal transfer. Created test cases are soft-archived afterward. If no test URL is configured, the suite reports skipped; that is not evidence of database connectivity.

See [DEMO_RUNBOOK.md](DEMO_RUNBOOK.md) for the three-minute judge path and safe rehearsal reset. See [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) for environment, migration, and release gates.
