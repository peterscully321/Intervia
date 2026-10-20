# Firebase setup for Intervia

Intervia uses real Firebase Authentication for sign-in, the Firestore Emulator for local product data, and the Storage Emulator for local private resume files. PostgreSQL is not required. Keep production service identities in a secret manager. Never paste keys into source control or chat.

## 1. Create a development Firebase project

1. Register a Firebase Web app and copy its web configuration into frontend/.env.local, following frontend/.env.example.
2. Enable Google, Microsoft, and Email/Password in Authentication. Keep email verification enabled, register Microsoft credentials in Microsoft Entra, configure Firebase's redirect URI, and add `localhost` to authorized domains for local sign-in.
3. Keep VITE_USE_FIREBASE_EMULATORS=false so the website signs into the real Firebase project. Set it true only when deliberately testing fake local accounts with the Auth Emulator.
4. Create a Firestore database in production mode, choose a region close to the API and users, and deploy the restrictive rules from firestore.rules.
5. For deployed resume uploads, create a private Storage bucket. Cloud Storage for Firebase currently requires the Blaze pay-as-you-go plan; review pricing and set billing alerts before enabling it. The restrictive rules are in storage.rules.

Firebase's Admin SDK runs in a privileged server environment. The API verifies the caller's Firebase ID token, then derives every Firestore document path and Storage key from that verified UID. Browser clients cannot read or write Firestore or Storage directly under the supplied rules.

## 2. Configure the local backend

Copy the keys from backend/.env.example into the ignored backend/.env, then set:

- FIREBASE_PROJECT_ID: the exact Firebase project ID.
- FIREBASE_STORAGE_BUCKET: use the bucket name shown in Firebase Console for production; local emulator mode can use the project's default bucket name, for example project-id.firebasestorage.app.
- FIREBASE_AUTH_EMULATOR_HOST: leave blank for real Firebase Authentication. Set 127.0.0.1:9099 only for deliberate Auth Emulator testing; remove it in production.
- FIRESTORE_EMULATOR_HOST: keep 127.0.0.1:8081 for local development. Remove it in production.
- FIREBASE_STORAGE_EMULATOR_HOST: keep 127.0.0.1:9199 for local development. Remove it in production.
- GOOGLE_APPLICATION_CREDENTIALS: optional for emulator-based local development; in production, use the hosting provider's managed identity.
- CLIENT_ORIGINS: exact local or deployed frontend origin.
- GEMINI_API_KEY: optional; enables hosted AI features.
- Razorpay settings: optional until checkout is configured.

The frontend web configuration is public app configuration, not Admin credentials. Never put service-account JSON in any VITE_* variable. If local Admin credentials are absent, the API verifies Firebase ID token signatures but skips the revocation lookup; production always requires credentials and checks revocation.

## 3. Start and verify

Install the Firebase CLI and a supported Java runtime once, then start Firestore and Storage emulators in Terminal 1:

~~~powershell
npm install -g firebase-tools
npm run dev:firebase-emulators
~~~

The emulators store local data under .firebase-emulator-data, which is ignored by Git and exported when the emulator stops. In Terminal 2, run npm run verify once, then npm run dev:backend. In Terminal 3, run npm run dev:frontend. The setup check verifies local Firestore and Storage; verify Google/Microsoft/email sign-in in the website against your Firebase project. GET /api/health/ready reports Firestore availability, identity configuration, and whether Storage is configured; it does not return credentials.

Local emulator data stays on this computer. Do not set Firestore or Storage emulator host variables in production. A deployed app needs a real private bucket and an Admin service identity; that Firebase Storage bucket requires the Blaze plan.

To publish the repository's Firestore and Storage rules, install the Firebase CLI, sign in, then run this from the repository root with your project ID:

~~~powershell
firebase login
firebase deploy --only firestore:rules,storage --project your-firebase-project-id
~~~

The deploy command publishes the restrictive rules in firestore.rules and storage.rules. It does not create the Firestore database or Storage bucket; create those in Firebase Console first.

Firestore is schemaless, so there is no SQL migration command. The API creates user and child documents as the user begins using the product.

## 4. Data layout and privacy

- users/{uid} stores profile, plan, credit balance, and usage metrics.
- User subcollections store consents, credit ledger entries, payment orders, resumes, resume analyses, interview sessions and answers, and coach messages.
- Resume originals and extracted text are stored as private Storage objects under resumes/{uid}/{resumeId}/...; Firestore stores only metadata and object keys.
- The API streams and processes uploads; it does not create public download URLs. Deleting an account removes its user document tree, stored resume files, and Firebase Auth identity. Failed cleanup is queued for retry.

Before inviting real users, decide data retention, private-file download behavior, malware scanning, backups/export recovery, monitoring, support contact, privacy/terms, and AI disclosures. Review Firebase usage and storage costs as traffic grows.
