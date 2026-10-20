const { db, toIso } = require('./firestore');

function sessionRef(userId, sessionId) {
  return db.collection('users').doc(userId).collection('interviewSessions').doc(sessionId);
}

async function saveInterviewSession({ id, userId, role, mode, difficulty, questions }) {
  await sessionRef(userId, id).create({
    role, mode, difficulty, status: 'active', summary: { questions },
    answered_count: 0, score_total: 0, created_at: new Date(), completed_at: null,
  });
}

async function deleteInterviewSession({ sessionId, userId }) {
  const ref = sessionRef(userId, sessionId);
  const answers = await ref.collection('answers').get();
  const batch = db.batch();
  answers.docs.forEach((answer) => batch.delete(answer.ref));
  batch.delete(ref);
  await batch.commit();
}

async function saveInterviewAnswer({ sessionId, userId, question, answer, evaluation }) {
  const ref = sessionRef(userId, sessionId);
  const answerRef = ref.collection('answers').doc();
  const rawScore = evaluation?.overall ?? evaluation?.score;
  const scoreValue = rawScore == null || rawScore === '' ? Number.NaN : Number(rawScore);
  const score = Number.isFinite(scoreValue) ? scoreValue : null;
  let saved = false;
  await db.runTransaction(async (transaction) => {
    saved = false;
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists || snapshot.data().status !== 'active') return;
    const data = snapshot.data();
    const count = Number(data.answered_count || 0) + 1;
    const scoreTotal = Number(data.score_total || 0) + (score ?? 0);
    transaction.create(answerRef, {
      question, answer, evaluation: evaluation || null, score, created_at: new Date(),
    });
    transaction.update(ref, { answered_count: count, score_total: scoreTotal, score_count: Number(data.score_count || 0) + (score === null ? 0 : 1) });
    saved = true;
  });
  return saved;
}

async function completeInterviewSession({ sessionId, userId }) {
  const ref = sessionRef(userId, sessionId);
  let completed = false;
  await db.runTransaction(async (transaction) => {
    completed = false;
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists || snapshot.data().status !== 'active') return;
    transaction.update(ref, { status: 'completed', completed_at: new Date() });
    completed = true;
  });
  return completed;
}

async function getInterviewHistory(userId) {
  const snapshot = await db.collection('users').doc(userId).collection('interviewSessions')
    .orderBy('created_at', 'desc').limit(8).get();
  return snapshot.docs.map((doc) => {
    const row = doc.data();
    const answeredCount = Number(row.answered_count || 0);
    const scoreCount = Number(row.score_count || 0);
    return {
      id: doc.id,
      role: row.role,
      mode: row.mode,
      difficulty: row.difficulty,
      status: row.status,
      createdAt: toIso(row.created_at),
      completedAt: toIso(row.completed_at),
      answeredCount,
      averageScore: scoreCount ? Math.round(Number(row.score_total || 0) / scoreCount) : null,
    };
  });
}

module.exports = { saveInterviewSession, deleteInterviewSession, saveInterviewAnswer, completeInterviewSession, getInterviewHistory };
