# Intervia product architecture

## Product promise

Intervia helps job seekers move from a resume and target role to deliberate interview practice. The product explains its feedback, grounds suggestions in the candidate's own material, and keeps candidates in control of their data. Scores are coaching guidance, not hiring decisions or guaranteed outcomes.

## MVP journey

1. The candidate understands the product and signs in with Google, Microsoft, or verified email.
2. The candidate sets a target role and optional experience/interview preferences.
3. The candidate chooses a resume, reviews extracted text, consents to AI processing, and receives an evidence-based report.
4. The candidate starts a text-first interview for a target role and difficulty; browser speech input is optional.
5. The candidate receives rubric-based feedback, a stronger-answer example, and a practical next action.
6. The dashboard keeps interview and resume history; the coach helps turn recurring gaps into practice.
7. The candidate can export their data or delete their account.

## Current implementation boundary

~~~mermaid
flowchart LR
  Browser[React + Vite web app] -->|Firebase ID token| API[Express API]
  Browser -->|Google, Microsoft, verified email| Auth[Firebase Authentication]
  API -->|Verify token and revoke-check| Auth
  API -->|Server SDK, owner-scoped documents| Firestore[(Cloud Firestore)]
  API -->|Private resume objects| Storage[Cloud Storage for Firebase]
  API --> AI[Gemini adapter or guided fallback]
  API --> Pay[Razorpay, optional]
~~~

Firebase Authentication owns credential flows. The Express API verifies every ID token and derives Firestore and Storage paths from the verified UID. Firestore stores profiles, consent history, analyses, interviews, answers, coach messages, payment orders, and the idempotent credit ledger. Cloud Storage stores resume originals and extracted text. Browser rules deny direct access; the API uses privileged Firebase Admin credentials.

Interview, resume, and coach operations run synchronously in the API. AI responses are schema checked and have a guided fallback. Add durable job processing as usage grows. Payments remain optional; paid launch needs verified webhooks, refunds, reconciliation, and support.

## Trust, security, and privacy

- Require a verified identity on private routes and scope each data operation to that Firebase UID.
- Keep credentials in Firebase; never store app passwords or expose provider secrets to the frontend.
- Validate uploads, keep originals private, use explicit CORS origins, security headers, and rate limits.
- Ask for resume AI consent before processing. Treat resume text and user messages as untrusted AI input.
- Do not log resume content, tokens, payment secrets, or provider credentials.
- Export and account-deletion controls are implemented. Account deletion removes Firestore documents and Storage objects, then retries Firebase Auth cleanup if needed.
- Before beta: define retention and access policies, file scanning, budget alerts, backups and restore drills, redacted logs, monitoring, privacy/terms, and support processes.

## Delivery plan and exit gates

| Phase | Build | Exit gate |
| --- | --- | --- |
| 1. Product foundation | Product journey, data boundaries, visual tokens, API routes, and environments. | The team can explain the user journey and data handling. |
| 2. Identity and candidate foundation | Google/Microsoft/verified-email sign-in, onboarding, Firestore persistence, authorization, export, and deletion. | A candidate can onboard and access only their own records. |
| 3. Resume intelligence | Private upload, extraction review, role context, report history, and deletion. | A candidate can review processing, receive feedback, and remove source data. |
| 4. Interview and coaching | Role-aware questions, rubric feedback, optional voice, coach, progress, and reports. | A candidate can finish practice and act on feedback. |
| 5. Commercial beta readiness | Accessibility, monitoring, cost controls, privacy operations, and limited beta. | Support, restore, deletion, cost, and billing paths are rehearsed. |

The implementation plan and tracked work items live in the [Intervia Linear project](https://linear.app/yash-projects470/project/intervia-ai-interview-prep-platform-bd3aeec88cf3).

## Decisions before beta

1. Select production Firebase project, regions, API host, and allowed browser domains.
2. Choose resume retention, deletion propagation, and malware scanning policy.
3. Publish privacy/terms, AI limitations, subprocessor disclosures, and a support contact.
4. Set AI provider cost controls and observe usage without retaining unnecessary personal data in logs.
5. Configure payment provider, supported markets, refunds, and reconciliations only after validation.
6. Exercise account recovery, export/deletion, backups/restores, payment failure, and incident handling in staging.
