const crypto = require('node:crypto');
const { getFirebaseBucket } = require('../firebase');
const { db, toIso, jsonSafe } = require('./firestore');

async function saveResumeAnalysis({ userId, fileName, resumeText, role, result, originalFile = null }) {
  const bucket = getFirebaseBucket();
  const resumeId = crypto.randomUUID();
  const resumeRef = db.collection('users').doc(userId).collection('resumes').doc(resumeId);
  const analysisRef = resumeRef.collection('analyses').doc();
  const folder = `resumes/${userId}/${resumeId}`;
  const extractedTextKey = `${folder}/extracted.txt`;
  const originalKey = originalFile ? `${folder}/original${fileExtension(fileName)}` : null;
  const createdAt = new Date();
  const files = [
    { key: extractedTextKey, buffer: Buffer.from(resumeText, 'utf8'), contentType: 'text/plain; charset=utf-8' },
  ];
  if (originalFile) files.push({ key: originalKey, buffer: originalFile.buffer, contentType: originalFile.mimetype });

  const uploaded = [];
  try {
    for (const file of files) {
      await bucket.file(file.key).save(file.buffer, {
        resumable: false,
        metadata: {
          contentType: file.contentType,
          cacheControl: 'private, no-store',
          metadata: { ownerUid: userId },
        },
      });
      uploaded.push(file.key);
    }

    const batch = db.batch();
    batch.create(resumeRef, {
      file_name: fileName,
      storage_key: originalKey,
      extracted_text_storage_key: extractedTextKey,
      role: role || null,
      created_at: createdAt,
      deleted_at: null,
      latest_overall_score: result?.overallScore ?? null,
      latest_verdict: result?.verdict ?? null,
    });
    batch.create(analysisRef, {
      resume_id: resumeId,
      role: role || null,
      result,
      model: 'gemini',
      prompt_version: 'resume-v2',
      created_at: createdAt,
    });
    await batch.commit();
    return { id: resumeId, storageKey: originalKey, extractedTextStorageKey: extractedTextKey };
  } catch (error) {
    await Promise.all(uploaded.map((key) => bucket.file(key).delete({ ignoreNotFound: true }).catch(() => {})));
    throw error;
  }
}

function fileExtension(fileName) {
  const extension = String(fileName || '').match(/\.[a-z0-9]{1,8}$/i)?.[0]?.toLowerCase();
  return extension || '.bin';
}

async function saveCoachMessages({ userId, userMessage, assistantMessage, context }) {
  const collection = db.collection('users').doc(userId).collection('coachMessages');
  const batch = db.batch();
  const createdAt = new Date();
  batch.create(collection.doc(), { sender: 'user', content: userMessage, context: context || {}, created_at: createdAt });
  batch.create(collection.doc(), { sender: 'assistant', content: assistantMessage, context: context || {}, created_at: createdAt });
  await batch.commit();
}

async function saveLiveCoachSession({ userId, sessionId, turns }) {
  if (!turns.length) return false;
  const userRef = db.collection('users').doc(userId);
  const sessionRef = userRef.collection('liveCoachSessions').doc(sessionId);
  const messagesRef = userRef.collection('coachMessages');
  const batch = db.batch();
  const createdAt = new Date();
  batch.create(sessionRef, { created_at: createdAt, turn_count: turns.length });
  for (const turn of turns) {
    batch.create(messagesRef.doc(), { sender: 'user', content: turn.user, context: { liveSessionId: sessionId }, created_at: createdAt });
    batch.create(messagesRef.doc(), { sender: 'assistant', content: turn.assistant, context: { liveSessionId: sessionId }, created_at: createdAt });
  }
  try {
    await batch.commit();
    return true;
  } catch (error) {
    if (error.code === 6 || error.code === 'already-exists') return false;
    throw error;
  }
}

async function getRecentCoachMessages(userId, limit = 12) {
  const snapshot = await db.collection('users').doc(userId).collection('coachMessages')
    .orderBy('created_at', 'desc').limit(limit).get();
  return snapshot.docs.map((doc) => {
    const row = doc.data();
    return { sender: row.sender, content: row.content, createdAt: toIso(row.created_at) };
  }).reverse();
}

async function getLatestResumeInsights(userId) {
  const resumes = await db.collection('users').doc(userId).collection('resumes')
    .orderBy('created_at', 'desc').limit(8).get();
  const resume = resumes.docs.find((doc) => !doc.data().deleted_at);
  if (!resume) return null;
  const analyses = await resume.ref.collection('analyses').orderBy('created_at', 'desc').limit(1).get();
  if (analyses.empty) return null;
  const result = analyses.docs[0].data().result || {};
  const shortList = (value, maxItems = 4) => Array.isArray(value)
    ? value.slice(0, maxItems).map((item) => String(item).slice(0, 220))
    : [];
  return {
    overallScore: result.overallScore != null && Number.isFinite(Number(result.overallScore)) ? Number(result.overallScore) : null,
    verdict: String(result.verdict || '').slice(0, 80),
    suggestedRoles: shortList(result.suggestedRoles),
    keywords: shortList(result.keywords, 8),
    strengths: shortList(result.strengths),
    improvements: shortList(result.improvements),
  };
}

async function getResumeHistory(userId) {
  const snapshot = await db.collection('users').doc(userId).collection('resumes')
    .orderBy('created_at', 'desc').limit(8).get();
  return snapshot.docs.filter((doc) => !doc.data().deleted_at).map((doc) => {
    const row = doc.data();
    return {
      id: doc.id,
      fileName: row.file_name,
      role: row.role,
      createdAt: toIso(row.created_at),
      overallScore: row.latest_overall_score ?? null,
      verdict: row.latest_verdict ?? null,
    };
  });
}

async function docsFor(collectionRef) {
  const snapshot = await collectionRef.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...jsonSafe(doc.data()) }));
}

async function loadResumeText(key) {
  if (!key) return '';
  const [buffer] = await getFirebaseBucket().file(key).download();
  return buffer.toString('utf8');
}

async function exportUserData(userId) {
  const userRef = db.collection('users').doc(userId);
  const [user, consents, resumes, sessions, coachMessages, liveCoachSessions, creditHistory, paymentOrders] = await Promise.all([
    userRef.get(),
    docsFor(userRef.collection('consents')),
    docsFor(userRef.collection('resumes')),
    docsFor(userRef.collection('interviewSessions')),
    docsFor(userRef.collection('coachMessages')),
    docsFor(userRef.collection('liveCoachSessions')),
    docsFor(userRef.collection('creditLedger')),
    docsFor(userRef.collection('paymentOrders')),
  ]);

  const resumeRows = await Promise.all(resumes.map(async (resume) => ({
    id: resume.id,
    file_name: resume.file_name,
    extracted_text: await loadResumeText(resume.extracted_text_storage_key),
    role: resume.role,
    created_at: resume.created_at,
  })));
  const resumeAnalyses = [];
  for (const resume of resumes) {
    const analyses = await docsFor(userRef.collection('resumes').doc(resume.id).collection('analyses'));
    resumeAnalyses.push(...analyses.map((analysis) => ({ ...analysis, resume_id: resume.id })));
  }
  const interviewAnswers = [];
  for (const session of sessions) {
    const answers = await docsFor(userRef.collection('interviewSessions').doc(session.id).collection('answers'));
    interviewAnswers.push(...answers.map((answer) => ({ ...answer, session_id: session.id })));
  }

  return {
    exportedAt: new Date().toISOString(),
    profile: user.exists ? { id: user.id, ...jsonSafe(user.data()) } : null,
    consents,
    resumes: resumeRows,
    resumeAnalyses,
    interviewSessions: sessions,
    interviewAnswers,
    coachMessages,
    liveCoachSessions,
    creditHistory,
    paymentOrders,
  };
}

module.exports = { saveResumeAnalysis, saveCoachMessages, saveLiveCoachSession, getRecentCoachMessages, getLatestResumeInsights, getResumeHistory, exportUserData };
