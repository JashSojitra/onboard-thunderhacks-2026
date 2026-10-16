# Onboard Local Demo Recovery

## Start

From `C:\Coding Assignments\nexus-thunderhacks`, run exactly:

```powershell
npm run dev
```

Open **http://127.0.0.1:5173**. Wait for the Home status to say **Persistent Neon PostgreSQL storage connected.** Local demo access is automatic only inside this loopback-bound development server. Preview and Production still require the signed session.

## Maryam Arif demo

1. Select **Start New Hire**.
2. In **Manager Intake**, select **Load Maryam Arif fictional demo**.
3. Select **Generate Transition Bundle**. This saves a new editable Neon record and creates its ticket drafts and preflight tasks.
4. Open **Request Launchpad**.
5. Edit one draft, optionally exclude **Optional onboarding plan**, then select **Simulate internal bulk submission**.
6. Open **Day-One Preflight**.
7. Find a blocked required prerequisite, choose **Verified**, enter clearly fictional evidence, and save.
8. Verify the remaining required prerequisites for that task; its status changes to ready and First-work readiness increases.
9. Confirm **Persistent audit history** includes case creation, bundle generation, draft update, simulated submission, and prerequisite update.
10. Refresh the browser, open **My Transition Cases**, find the newest Maryam Arif persistent case, and select **Open**.

## Recovery check

If the connected message does not appear, close old Onboard tabs and use the exact loopback URL above. Do not use `npm run dev:vite`; that command is frontend-only and has no persistence API.

The bulk submission is intentionally simulated: it persists internal request state and an audit event but does not create records in external service-desk systems.
