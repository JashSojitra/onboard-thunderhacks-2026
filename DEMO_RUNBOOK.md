# Onboard Demo Runbook

Target length: three minutes. Use only fictional data. The primary path is **Scenario A: New Hire**; Scenario B is a short contrast if time remains.

## Before judges arrive

1. Start `npx vercel dev` and open the local URL.
2. Unlock persistence with the configured demo access code. Never display or narrate the code.
3. Confirm the status says **Persistent Neon PostgreSQL storage connected**.
4. Open **My Transition Cases**. Archive prior persistent rehearsal cases with the Archive action. This is a soft archive: the records and audit history remain in PostgreSQL. Fixtures cannot be archived or mutated.
5. Confirm Maryam and Jim are labelled **Fictional fixture**. Use **Preview** for the immutable example or **Start Editable Demo** to create a separate saved working copy.
6. Return home. Keep one browser tab and do not use real employee information.

## Scenario A — Maryam Arif, New Hire (primary path)

### 0:00–0:30 — State the problem and create the intake

Say: “Onboard replaces fragmented manual onboarding with one manager intake, then verifies whether the employee can perform meaningful work—not merely whether tickets were closed.”

1. Choose **Start New Hire**.
2. Select **Load demo data**. The fictional Maryam Arif record and deterministic starter notes are populated.
3. Select **Generate Transition Bundle**.

Call out that the case and bundle are now persistent PostgreSQL records, not fixture data.

### 0:30–1:15 — Review and submit the request bundle

1. In **Request Launchpad**, edit one draft description.
2. Exclude the optional training/onboarding-plan draft.
3. Select **Simulate internal bulk submission**.

Say: “This is deliberately labelled simulated. It stores internal state and an audit event but does not create external service-desk or provisioning requests.”

### 1:15–2:10 — Show task readiness and the completion guard

1. Open **Day-One Preflight**.
2. Point out the first meaningful task and its unverified application-access prerequisite.
3. Mark the application-access prerequisite **Verified**, enter fictional evidence, and save it. The blocker count updates immediately from server-returned state.
4. To demonstrate a readiness-score change, verify every remaining required prerequisite for the first team-check-in task. That task changes from **Blocked** to **Ready to perform** and First-work readiness increases.
5. Select **Mark Complete**.

The attempt must be rejected while required tickets or Day-One prerequisites remain unresolved. Say: “Ticket progress and employee readiness are separate. Onboard will not call the transition complete while the employee is still blocked.”

### 2:10–2:40 — Show auditability and deterministic handoff

1. Scroll to **Persistent audit history** and point to case creation, bundle generation, draft edit, simulated submission, and prerequisite update events.
2. Open **Starter Brief** and generate the brief from the preloaded notes.

Say: “This brief is rule-based, not AI. The label and limitations are explicit; no provider key or AI processing is hidden behind the demo.”

### 2:40–3:00 — Prove persistence

1. Refresh the browser.
2. Unlock again only if the session cookie has expired.
3. Open **My Transition Cases**, find Maryam, and reopen the case.

Point out the **Persistent** source label, stored ticket state, readiness data, and audit history.

## Scenario B — Jim Halpert, Ministry Transfer (optional 30-second contrast)

1. Return home and choose **Start Internal Transfer**.
2. Select **Load demo data** for fictional Jim Halpert, moving from the Community Programs Ministry to the Workplace Collaboration Branch in the Digital Enablement Ministry.
3. Generate the bundle.
4. In **Request Launchpad** or **Access Review**, show the previous-organization access-removal request alongside new role-based access.

Say: “The same intake handles internal transfers without hardcoding one organization. It adds least-privilege cleanup for the previous team while preserving the same readiness model.”

## Recovery

- If persistence is locked, enter the configured demo access code; the manager label is not authorization.
- If the backend is unavailable, do not imply that fixtures are live records. The yellow **Fixture** labels are a presentation fallback only.
- If controls are disabled, read the nearby explanation. Unlock persistence from Home, or use **Start Editable Demo** when viewing a fixture. Onboard no longer creates local-only bundles that cannot be continued.
- If a rehearsal created duplicates, use **My Transition Cases → Archive** on persistent records. Do not delete database rows manually.
- If the active form is confusing, use **Worklog Preview → Close View**; persistent records remain available.
- If time is short, demonstrate Scenario A through the completion rejection, then show audit history. Do not claim completion or external ticket creation.

This independent prototype was inspired by firsthand onboarding friction observed during OPS internships. It is not affiliated with or endorsed by the Ontario Public Service.
