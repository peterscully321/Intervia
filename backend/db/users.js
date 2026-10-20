const { db, toIso, encodeKey } = require('./firestore');

function userRef(userId) {
  return db.collection('users').doc(userId);
}

function mapUser(data, id) {
  if (!data) return null;
  return {
    id: id || data.id,
    name: data.name || 'Candidate',
    email: data.email || '',
    avatar: data.avatar || 'C',
    plan: data.plan || 'Starter',
    credits: Number(data.credits || 0),
    totalSessions: Number(data.total_sessions || 0),
    totalQuestionsAnswered: Number(data.total_questions_answered || 0),
    resumeAnalyses: Number(data.resume_analyses || 0),
    agentChats: Number(data.agent_chats || 0),
    createdAt: toIso(data.created_at) || new Date().toISOString(),
    targetRole: data.target_role || '',
    experienceLevel: data.experience_level || '',
    interviewDate: data.interview_date || '',
    coachingPreferences: data.coaching_preferences || [],
    onboardingCompleted: data.onboarding_completed === true,
  };
}

async function upsertUser({ id, email, name, avatar }) {
  const ref = userRef(id);
  const welcomeRef = ref.collection('creditLedger').doc(encodeKey('welcome:' + id));
  let userData;
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const now = new Date();
    if (snapshot.exists) {
      userData = { ...snapshot.data(), email: email.toLowerCase(), name, avatar, updated_at: now };
      transaction.set(ref, userData, { merge: true });
      return;
    }
    userData = {
      email: email.toLowerCase(), name, avatar, plan: 'Starter', credits: 100,
      total_sessions: 0, total_questions_answered: 0, resume_analyses: 0, agent_chats: 0,
      created_at: now, updated_at: now, target_role: '', experience_level: '',
      interview_date: '', coaching_preferences: [], onboarding_completed: false,
    };
    transaction.create(ref, userData);
    transaction.create(welcomeRef, {
      event_key: 'welcome:' + id, event_type: 'welcome', description: 'Welcome credits',
      credits_delta: 100, amount_minor: 0, currency: 'USD', status: 'credited', metadata: {}, created_at: now,
    });
  });
  return mapUser(userData, id);
}

async function getUserById(id) {
  const snapshot = await userRef(id).get();
  return mapUser(snapshot.data(), snapshot.id);
}

async function updateUserMetrics(user, metrics) {
  const allowed = new Set(['total_sessions', 'total_questions_answered', 'resume_analyses', 'agent_chats']);
  const entries = Object.entries(metrics);
  if (entries.some(([field, delta]) => !allowed.has(field) || !Number.isFinite(delta))) {
    throw new Error('Unsupported account metric.');
  }
  const ref = userRef(user.id);
  let updated;
  await db.runTransaction(async (transaction) => {
    updated = null;
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new Error('Candidate account was not found.');
    const data = snapshot.data();
    updated = { ...data, updated_at: new Date() };
    for (const [field, delta] of entries) updated[field] = Number(data[field] || 0) + delta;
    transaction.set(ref, updated, { merge: true });
  });
  return mapUser(updated, user.id);
}

async function addCredits(userId, { eventKey, eventType, description, credits, amountMinor = 0, currency = 'USD', metadata = {} }) {
  const ref = userRef(userId);
  const ledgerRef = ref.collection('creditLedger').doc(encodeKey(eventKey));
  let updated;
  await db.runTransaction(async (transaction) => {
    const [userSnapshot, ledgerSnapshot] = await Promise.all([transaction.get(ref), transaction.get(ledgerRef)]);
    if (!userSnapshot.exists) throw new Error('Candidate account was not found.');
    const data = userSnapshot.data();
    if (ledgerSnapshot.exists) {
      updated = data;
      return;
    }
    const now = new Date();
    updated = { ...data, credits: Math.max(0, Number(data.credits || 0) + credits), updated_at: now };
    transaction.create(ledgerRef, {
      event_key: eventKey, event_type: eventType, description, credits_delta: credits,
      amount_minor: amountMinor, currency, status: 'credited', metadata, created_at: now,
    });
    transaction.set(ref, updated, { merge: true });
  });
  return mapUser(updated, userId);
}

async function consumeCredits(userId, { eventKey, description, credits }) {
  const ref = userRef(userId);
  const ledgerRef = ref.collection('creditLedger').doc(encodeKey(eventKey));
  let updated = null;
  await db.runTransaction(async (transaction) => {
    updated = null;
    const [userSnapshot, ledgerSnapshot] = await Promise.all([transaction.get(ref), transaction.get(ledgerRef)]);
    if (!userSnapshot.exists) return;
    const data = userSnapshot.data();
    if (ledgerSnapshot.exists) {
      updated = data;
      return;
    }
    const balance = Number(data.credits || 0);
    if (balance < credits) return;
    const now = new Date();
    updated = { ...data, credits: balance - credits, updated_at: now };
    transaction.create(ledgerRef, {
      event_key: eventKey, event_type: 'usage', description, credits_delta: -credits,
      amount_minor: 0, currency: 'USD', status: 'credited', metadata: {}, created_at: now,
    });
    transaction.set(ref, updated, { merge: true });
  });
  return updated ? mapUser(updated, userId) : null;
}

async function listTransactions(userId, limit = 50) {
  const snapshot = await userRef(userId).collection('creditLedger').orderBy('created_at', 'desc').limit(limit).get();
  return snapshot.docs.map((doc) => {
    const row = doc.data();
    return {
      id: row.event_key || doc.id,
      planName: row.description,
      credits: row.credits_delta,
      amount: Number(row.amount_minor || 0) / 100,
      currency: row.currency || 'USD',
      status: row.status || 'credited',
      timestamp: toIso(row.created_at),
    };
  });
}

async function saveConsent(userId, consentType, version, granted) {
  await userRef(userId).collection('consents').add({
    consent_type: consentType, version, granted, created_at: new Date(),
  });
}

async function hasConsent(userId, consentType, version) {
  const snapshot = await userRef(userId).collection('consents').get();
  return snapshot.docs.filter((doc) => doc.data().consent_type === consentType && doc.data().version === version)
    .sort((a, b) => (b.data().created_at?.toMillis?.() || 0) - (a.data().created_at?.toMillis?.() || 0))[0]
    ?.data().granted === true;
}

module.exports = { upsertUser, getUserById, updateUserMetrics, addCredits, consumeCredits, listTransactions, saveConsent, hasConsent };
