const { getFirestoreDb } = require('../firebase');

const db = getFirestoreDb();

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIso(value) {
  return toDate(value)?.toISOString() || null;
}

function jsonSafe(value) {
  if (value instanceof Date || (value && typeof value.toDate === 'function')) return toIso(value);
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, jsonSafe(nested)]));
  }
  return value;
}

function encodeKey(value) {
  return Buffer.from(String(value)).toString('base64url');
}

async function deleteDocumentTree(documentRef) {
  const childCollections = await documentRef.listCollections();
  for (const collectionRef of childCollections) {
    while (true) {
      const snapshot = await collectionRef.limit(400).get();
      if (snapshot.empty) break;
      for (const child of snapshot.docs) await deleteDocumentTree(child.ref);
      const batch = db.batch();
      snapshot.docs.forEach((child) => batch.delete(child.ref));
      await batch.commit();
    }
  }
  await documentRef.delete().catch((error) => {
    if (error.code !== 5) throw error;
  });
}

module.exports = { db, toDate, toIso, jsonSafe, encodeKey, deleteDocumentTree };
