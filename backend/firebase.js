const { applicationDefault, cert, getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

let firestore = null;

function getFirebaseApp() {
  const emulatorVariables = [
    'FIREBASE_AUTH_EMULATOR_HOST',
    'FIRESTORE_EMULATOR_HOST',
    'FIREBASE_STORAGE_EMULATOR_HOST',
  ];
  if (process.env.NODE_ENV === 'production' && emulatorVariables.some((name) => process.env[name])) {
    throw new Error('Firebase Emulator host variables must not be set in production.');
  }
  for (const name of emulatorVariables) {
    if (process.env[name]?.includes('://')) {
      throw new Error(`${name} must be host:port without http://.`);
    }
  }

  const existing = getApps()[0];
  if (existing) return existing;

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  const localDataEmulatorsEnabled = process.env.NODE_ENV !== 'production'
    && process.env.FIRESTORE_EMULATOR_HOST
    && process.env.FIREBASE_STORAGE_EMULATOR_HOST;
  const options = { projectId: process.env.FIREBASE_PROJECT_ID };
  if (serviceAccount) {
    options.credential = cert(JSON.parse(serviceAccount));
  } else if (!localDataEmulatorsEnabled) {
    options.credential = applicationDefault();
  }

  if (process.env.FIREBASE_STORAGE_BUCKET) {
    options.storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
  }
  return initializeApp(options);
}

function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

function getFirestoreDb() {
  if (!firestore) {
    firestore = getFirestore(getFirebaseApp());
    firestore.settings({ ignoreUndefinedProperties: true });
  }
  return firestore;
}

function isFirebaseStorageConfigured() {
  return Boolean(process.env.FIREBASE_STORAGE_BUCKET);
}

function isFirebaseStorageEmulatorConfigured() {
  return Boolean(process.env.FIREBASE_STORAGE_EMULATOR_HOST);
}

function getFirebaseBucket() {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
  if (!bucketName) throw new Error('Firebase Storage is not configured. Set FIREBASE_STORAGE_BUCKET in backend/.env.');
  if (process.env.FIREBASE_STORAGE_EMULATOR_HOST?.includes('://')) {
    throw new Error('FIREBASE_STORAGE_EMULATOR_HOST must be host:port without http://.');
  }
  return getStorage(getFirebaseApp()).bucket(bucketName);
}

module.exports = {
  getFirebaseApp,
  getFirebaseAuth,
  getFirestoreDb,
  getFirebaseBucket,
  isFirebaseStorageConfigured,
  isFirebaseStorageEmulatorConfigured,
};
