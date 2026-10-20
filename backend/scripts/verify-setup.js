require('dotenv').config();
const net = require('node:net');

function isTcpReachable(hostAndPort) {
  const separator = hostAndPort.lastIndexOf(':');
  const host = hostAndPort.slice(0, separator);
  const port = Number(hostAndPort.slice(separator + 1));
  if (!host || !Number.isInteger(port)) return Promise.resolve(false);

  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const finish = (reachable) => {
      socket.destroy();
      resolve(reachable);
    };
    socket.setTimeout(1200, () => finish(false));
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
  });
}

async function verify() {
  console.log('\n--- Checking Intervia Firebase services ---');
  let hasErrors = false;

  if (!process.env.FIREBASE_PROJECT_ID) {
    console.error('Firebase project ID is missing in backend/.env.');
    process.exitCode = 1;
    return;
  }

  const configuredEmulators = [
    ['Firebase Authentication Emulator', process.env.FIREBASE_AUTH_EMULATOR_HOST],
    ['Firestore Emulator', process.env.FIRESTORE_EMULATOR_HOST],
    ['Firebase Storage Emulator', process.env.FIREBASE_STORAGE_EMULATOR_HOST],
  ].filter(([, host]) => host);
  const unavailableEmulators = [];
  for (const [name, host] of configuredEmulators) {
    if (!await isTcpReachable(host)) unavailableEmulators.push({ name, host });
  }

  if (unavailableEmulators.length) {
    for (const { name, host } of unavailableEmulators) {
      console.error(`${name} is not listening at ${host}.`);
    }
    console.error('Start `npm run dev:firebase-emulators` in another terminal, keep it open, and run `npm run verify` again.');
    console.error('Firebase SDK checks were skipped to avoid trying cloud credentials while local emulators are stopped.');
    process.exitCode = 1;
    return;
  }

  try {
    const { getFirebaseAuth, getFirestoreDb } = require('../firebase');
    const auth = getFirebaseAuth();
    const hasAdminCredentials = Boolean(
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()
      || process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim(),
    );
    const checks = [getFirestoreDb().collection('_interviaHealth').doc('readiness').get()];
    if (process.env.FIREBASE_AUTH_EMULATOR_HOST || hasAdminCredentials) checks.push(auth.listUsers(1));
    await Promise.all(checks);
    if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      console.log('Firebase Authentication Emulator: reachable.');
    } else if (hasAdminCredentials) {
      console.log('Firebase Authentication Admin SDK: connected.');
    } else {
      console.log('Real Firebase Authentication is selected; verify sign-in from the web app.');
    }
    console.log(process.env.FIRESTORE_EMULATOR_HOST
      ? 'Firestore Emulator: reachable.'
      : 'Cloud Firestore: connected.');
  } catch (error) {
    console.error(`Firebase Admin connection failed: ${error.message}`);
    hasErrors = true;
  }

  if (!process.env.FIREBASE_STORAGE_BUCKET) {
    console.error('Firebase Storage bucket is missing. Set FIREBASE_STORAGE_BUCKET in backend/.env.');
    hasErrors = true;
  } else {
    try {
      const { getFirebaseBucket, isFirebaseStorageEmulatorConfigured } = require('../firebase');
      if (isFirebaseStorageEmulatorConfigured()) {
        await getFirebaseBucket().getFiles({ maxResults: 1 });
        console.log('Firebase Storage Emulator: reachable.');
      } else {
        const [exists] = await getFirebaseBucket().exists();
        if (!exists) throw new Error('Bucket does not exist.');
        console.log('Firebase Storage: connected.');
      }
    } catch (error) {
      console.error(`Firebase Storage is not reachable: ${error.message}`);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.error('\nFirebase setup still needs attention.');
    process.exitCode = 1;
  } else {
    console.log('\nAll configured Firebase services are reachable.');
  }
}

verify().catch(() => {
  console.error('Firebase setup verification failed. Check backend/.env and Firebase Console settings.');
  process.exitCode = 1;
});
