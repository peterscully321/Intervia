# Intervia

Intervia helps job seekers prepare for interviews with resume feedback, role-aware mock interviews, answer coaching, and progress reports.

**Live demo:** [intervia-8f24f.web.app](https://intervia-8f24f.web.app/)

## Tech stack

React 19, Vite, Node.js, Express, Firebase Authentication, Cloud Firestore, Gemini API, Web Speech API, Razorpay, PDFKit.

## Product foundation

- React 19 + Vite web app with animated interview, resume, coach, report, and credit flows.
- Firebase Authentication for Google, Microsoft, and verified email sign-in.
- Cloud Firestore for profiles, resume analyses, interviews, answers, coach messages, consent, payment orders, and credits.
- Real Firebase Authentication for local and production sign-in; Firestore and Storage Emulators keep local data and resume files on the developer machine.
- Express API verifies Firebase ID tokens before accessing user data.
- Gemini adapter with guided fallbacks; optional Razorpay checkout with server-side verification.

PostgreSQL is not required.

## Local setup

Requirements: Node.js 20+, Java, Firebase CLI, and Firebase web-app settings. Local development uses the real Firebase Authentication project with local Firestore and Storage emulators.

1. Install dependencies:

   ~~~powershell
   npm run install:all
   ~~~

2. Copy backend/.env.example to the ignored backend/.env. Set FIREBASE_PROJECT_ID and FIREBASE_STORAGE_BUCKET. Keep Auth Emulator host blank. Set Firestore and Storage emulator hosts for local data.
3. Create frontend/.env.local from frontend/.env.example, set the Firebase web-app values and API URL, and keep VITE_USE_FIREBASE_EMULATORS=false.
4. In Firebase Authentication, enable Google, Microsoft, and Email/Password. Configure Microsoft OAuth and add localhost to authorized domains.
5. In one terminal, start the local Firestore and Storage emulators:

   ~~~powershell
   npm run dev:firebase-emulators
   ~~~

   Emulator data stays under the ignored .firebase-emulator-data directory. Keep this terminal open while using Intervia.

6. In a second terminal, verify local data services once and start the API:

   ~~~powershell
   npm run verify
   npm run dev:backend
   ~~~

   In a third terminal, run npm run dev:frontend. Sign-in uses your Firebase project; Firestore and resume storage stay local.

For production, keep VITE_USE_FIREBASE_EMULATORS=false and remove Firestore/Storage emulator host settings. Configure Firebase Auth providers and a server managed identity. Locally, revoked-token checks are skipped when Admin credentials are absent; production keeps revocation checks enabled. Cloud Storage for Firebase requires the Blaze pay-as-you-go plan; review pricing before enabling it. Use separate development and production Firebase projects. Firestore is schemaless; there is no SQL migration.

See [Project overview and pitch guide](PROJECT_OVERVIEW.md) for the complete technology breakdown and vision, [Firebase setup](docs/service-setup.md) for the console walkthrough, and [architecture](docs/architecture.md) for data flows, privacy boundaries, and launch gates.
