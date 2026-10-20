const { getFirebaseBucket, isFirebaseStorageConfigured } = require('../firebase');
const { db, deleteDocumentTree } = require('./firestore');

async function deleteUserFiles(userId) {
  if (!isFirebaseStorageConfigured()) return;
  await getFirebaseBucket().deleteFiles({ prefix: `resumes/${userId}/` });
}

async function deleteAccountData(userId) {
  const jobRef = db.collection('accountDeletionJobs').doc(userId);
  await jobRef.set({ user_id: userId, requested_at: new Date() }, { merge: true });
  try {
    await deleteUserFiles(userId);
    await deleteDocumentTree(db.collection('users').doc(userId));
  } catch (error) {
    error.deletionQueued = true;
    throw error;
  }
}

async function retryAccountDeletionJobs(auth) {
  const jobs = await db.collection('accountDeletionJobs').orderBy('requested_at', 'asc').limit(25).get();
  for (const job of jobs.docs) {
    const userId = job.data().user_id || job.id;
    try {
      await deleteUserFiles(userId);
      await deleteDocumentTree(db.collection('users').doc(userId));
      try {
        await auth.deleteUser(userId);
      } catch (error) {
        if (error.code !== 'auth/user-not-found') throw error;
      }
      await job.ref.delete();
    } catch (error) {
      console.error('[Account deletion] Cleanup will retry:', error.code || 'unknown error');
    }
  }
}

module.exports = { deleteAccountData, retryAccountDeletionJobs };
