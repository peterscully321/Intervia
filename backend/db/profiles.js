const { db } = require('./firestore');

async function saveCandidateProfile(userId, { targetRole, experienceLevel, interviewDate, coachingPreferences }) {
  await db.collection('users').doc(userId).set({
    target_role: targetRole,
    experience_level: experienceLevel,
    interview_date: interviewDate || '',
    coaching_preferences: coachingPreferences,
    onboarding_completed: true,
    updated_at: new Date(),
  }, { merge: true });
}

module.exports = { saveCandidateProfile };
