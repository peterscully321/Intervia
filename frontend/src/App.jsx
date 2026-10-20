import { useState, useEffect, useRef, useCallback } from 'react';
import * as api from './api';
import { onAuthStateChanged } from 'firebase/auth';
import { auth as firebaseAuth, firebaseConfigured } from './auth/firebase';
import PracticeHistory from './features/dashboard/PracticeHistory';

/* ─────────────────────────────────────────────────────────────────────────────
   ICONS (Apple Minimalist Monoline Style)
   ───────────────────────────────────────────────────────────────────────────── */
const Icon = ({ d, className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

function GoogleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-4 w-4 shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.03 46.98 31.95 46.98 24.55z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.15 15.91-5.8l-7.73-6c-2.15 1.45-4.9 2.3-8.18 2.3-6.28 0-11.6-4.24-13.5-9.94l-8.04 6.2C6.4 42.62 14.6 48 24 48z" />
      <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-8.04-6.2a24 24 0 0 0 0 21.52l8.04-6.14z" />
    </svg>
  );
}

function MicrosoftLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M13 1h10v10H13z" />
      <path fill="#00A4EF" d="M1 13h10v10H1z" />
      <path fill="#FFB900" d="M13 13h10v10H13z" />
    </svg>
  );
}

const icons = {
  sparkle: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
  mic: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z',
  stop: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
  speaker: 'M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z',
  download: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
  upload: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
  check: 'M5 13l4 4L19 7',
  arrow: 'M13 7l5 5m0 0l-5 5m5-5H6',
  chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  zap: 'M13 10V3L4 14h7v7l9-11h-7z',
  document: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  chat: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  play: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  logout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  lock: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  mail: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  filePdf: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
};

/* ─────────────────────────────────────────────────────────────────────────────
   APPLE-STYLE SCORE RING
   ───────────────────────────────────────────────────────────────────────────── */
function ScoreRing({ score = 0, size = 110, stroke = 7, label = '/ 100' }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;
  const color = score >= 80 ? '#30d158' : score >= 65 ? '#ffd60a' : '#ff453a';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="score-ring"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold tracking-tight text-white">{score}</span>
        <span className="text-[10px] text-zinc-500 font-medium">{label}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   UNBIASED UNIVERSAL SAMPLE RESUME TEMPLATE
   ───────────────────────────────────────────────────────────────────────────── */
const SAMPLE_RESUME = `CANDIDATE PROFILE | SENIOR FULL STACK SOFTWARE ENGINEER
candidate.tech@example.com | portfolio-showcase.dev | github.com/software-engineer

PROFESSIONAL EXPERIENCE:
Senior Software Engineer - CloudScale Technologies (2023 - Present)
- Architected high-throughput microservices using Node.js, Express, and Redis, serving 2.5M daily active requests with 99.98% uptime.
- Led the migration of legacy monolith to React 18, Vite, and GraphQL, reducing initial bundle size by 42% and page load times from 3.2s to 850ms.
- Implemented event-driven architecture using Apache Kafka for real-time order processing, cutting reconciliation latency by 68%.

Software Engineer - TechForge Solutions (2021 - 2023)
- Built interactive analytics dashboards with React and Tailwind CSS, adopted by 40,000+ enterprise users.
- Designed RESTful APIs and PostgreSQL schema optimizations with indexing that improved query performance by 5x.
- Automated CI/CD deployment pipelines using GitHub Actions and Docker, reducing deployment cycle times by 60%.

TECHNICAL SKILLS:
- Languages: JavaScript (ESNext), TypeScript, Python, SQL, HTML5, CSS3
- Frontend: React, Next.js, Redux Toolkit, Tailwind CSS, Vite
- Backend & Cloud: Node.js, Express, PostgreSQL, MongoDB, Redis, Docker, AWS (S3, EC2, Lambda)
- Engineering Practices: Git, Jest, CI/CD, Agile/Scrum, System Design, REST APIs, GraphQL

EDUCATION:
B.Tech in Computer Science and Engineering - GPA 3.8/4.0 (2017 - 2021)`;

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN APPLICATION
   ───────────────────────────────────────────────────────────────────────────── */
export default function App() {
  // Navigation tabs: 'overview' | 'interview' | 'resume' | 'agent' | 'store'
  const [activeTab, setActiveTab] = useState('overview');

  // Authentication State
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ targetRole: '', experienceLevel: '', interviewDate: '', coachingPreferences: [] });

  // Credits & Rates
  const [credits, setCredits] = useState(0);
  const [creditCosts, setCreditCosts] = useState({ interviewSession: 10, resumeAnalysis: 20, agentChat: 5 });
  const [plans, setPlans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [usdInrQuote, setUsdInrQuote] = useState(null);
  const [practiceHistory, setPracticeHistory] = useState({ interviews: [], resumes: [] });
  const [toastMessage, setToastMessage] = useState('');

  // ── Mock Interview State ──────────────────────────────────────────────────
  const [interviewStep, setInterviewStep] = useState('setup'); // 'setup' | 'active' | 'summary'
  const [role, setRole] = useState('Full Stack Developer');
  const [mode, setMode] = useState('Technical');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questions, setQuestions] = useState([]);
  const [interviewSessionId, setInterviewSessionId] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [interviewResults, setInterviewResults] = useState([]);
  const [isStartingInterview, setIsStartingInterview] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [currentEval, setCurrentEval] = useState(null);
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const recRef = useRef(null);

  // ── Resume AI State (Text & File Upload) ──────────────────────────────────
  const [resumeText, setResumeText] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [resumeInputMode, setResumeInputMode] = useState('upload'); // 'upload' | 'text'
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);
  const [resumeResult, setResumeResult] = useState(null);
  const [resumeConsent, setResumeConsent] = useState(false);
  const fileInputRef = useRef(null);

  // ── AI Voice Agent State ──────────────────────────────────────────────────
  const [agentMessages, setAgentMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your Intervia Executive Voice Coach. Ask me to grill you on system design, practice behavioral answers, or critique your elevator pitch.',
      time: 'Just now',
    },
  ]);
  const [agentInput, setAgentInput] = useState('');
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [isAgentListening, setIsAgentListening] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [agentLanguage, setAgentLanguage] = useState(() => {
    try {
      const savedLanguage = window.localStorage.getItem('intervia-coach-language');
      return ['en', 'hi'].includes(savedLanguage) ? savedLanguage : 'en';
    } catch {
      return 'en';
    }
  });
  const [coachResumeConsent, setCoachResumeConsent] = useState(false);
  const agentRecognitionRef = useRef(null);
  const [isLiveCoachStarting, setIsLiveCoachStarting] = useState(false);
  const [isLiveCoachConnected, setIsLiveCoachConnected] = useState(false);
  const [liveCoachSeconds, setLiveCoachSeconds] = useState(0);
  const liveSocketRef = useRef(null);
  const liveStreamRef = useRef(null);
  const liveAudioContextRef = useRef(null);
  const liveProcessorRef = useRef(null);
  const liveSourceRef = useRef(null);
  const livePlaybackTimeRef = useRef(0);
  const liveTimerRef = useRef(null);
  const liveSessionIdRef = useRef('');
  const liveExpiresAtRef = useRef(0);
  const liveTranscriptRef = useRef([]);
  const liveCurrentTurnRef = useRef({ user: '', assistant: '' });
  const liveEndingRef = useRef(false);

  // ── Payment & Store State ─────────────────────────────────────────────────
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    if (activeTab !== 'store' || !currentUser) return undefined;
    let cancelled = false;
    api.fetchUsdInrRate().then((quote) => {
      if (!cancelled && quote?.rate) setUsdInrQuote(quote);
    }).catch(() => {
      if (!cancelled) setUsdInrQuote(null);
    });
    return () => { cancelled = true; };
  }, [activeTab, currentUser]);

  useEffect(() => {
    try {
      window.localStorage.setItem('intervia-coach-language', agentLanguage);
    } catch {}
  }, [agentLanguage]);

  // Toast Helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Text-to-speech
  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const preferredLocale = agentLanguage === 'hi' ? 'hi-IN' : 'en-US';
    utterance.lang = preferredLocale;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    const preferredVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase() === preferredLocale.toLowerCase())
      || window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith(preferredLocale.slice(0, 2)));
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.onstart = () => setIsAgentSpeaking(true);
    utterance.onend = () => setIsAgentSpeaking(false);
    utterance.onerror = () => setIsAgentSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsAgentSpeaking(false);
    }
  };

  /* ── Initial Load & Auth Check ── */
  const loadUserData = useCallback(async () => {
    try {
      const authRes = await api.authMe();
      if (!authRes.authenticated || !authRes.user) return;
      setCurrentUser(authRes.user);
      setCredits(authRes.user.credits ?? 0);
      setRole(authRes.user.targetRole || 'Full Stack Developer');
      setProfileForm({
        targetRole: authRes.user.targetRole || '',
        experienceLevel: authRes.user.experienceLevel || '',
        interviewDate: authRes.user.interviewDate || '',
        coachingPreferences: authRes.user.coachingPreferences || [],
      });
      setIsProfileModalOpen(!authRes.user.onboardingCompleted);
    } catch {
      setCurrentUser(null);
    }

    try {
      const c = await api.fetchCreditInfo();
      if (c.plans) setPlans(c.plans);
      if (c.costs) setCreditCosts(c.costs);
      if (c.balance !== undefined) setCredits(c.balance);
    } catch {}

    try {
      const t = await api.fetchTransactions();
      if (t.transactions) setTransactions(t.transactions);
    } catch {}

    try {
      const consent = await api.fetchResumeConsent();
      setResumeConsent(Boolean(consent.granted));
    } catch {}

    try {
      const history = await api.fetchHistory();
      if (Array.isArray(history.interviews) && Array.isArray(history.resumes)) setPracticeHistory(history);
    } catch {}

    try {
      const history = await api.fetchCoachHistory();
      if (Array.isArray(history.messages) && history.messages.length) {
        setAgentMessages(history.messages.map((message) => ({
          sender: message.sender,
          text: message.content,
          time: message.createdAt ? new Date(message.createdAt).toLocaleString() : '',
        })));
      }
    } catch {}

    try {
      const consent = await api.fetchCoachResumeConsent();
      setCoachResumeConsent(Boolean(consent.granted));
    } catch {}
  }, []);

  useEffect(() => {
    if (!firebaseAuth) return undefined;
    return onAuthStateChanged(firebaseAuth, (user) => {
      if (!user) {
        setCurrentUser(null);
        setIsProfileModalOpen(false);
        setCredits(0);
        setTransactions([]);
        setPracticeHistory({ interviews: [], resumes: [] });
        setResumeConsent(false);
        setCoachResumeConsent(false);
        setAgentMessages([{
          sender: 'ai',
          text: 'Hello! I am your Intervia interview coach. Ask me to practise an answer, prepare for a role, or strengthen your interview approach.',
          time: 'Just now',
        }]);
        setResumeText('');
        setUploadedFile(null);
        setResumeResult(null);
        setInterviewSessionId(null);
        setInterviewResults([]);
        return;
      }
      loadUserData();
    });
  }, [loadUserData]);

  /* ── Authentication Handlers ── */
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthNotice('');

    try {
      if (authMode === 'register') {
        const res = await api.authRegister({ name: authName, email: authEmail, password: authPassword });
        setAuthNotice(res.message);
        setAuthMode('login');
        setAuthPassword('');
      } else {
        const res = await api.authLogin({ email: authEmail, password: authPassword });
        if (res.error) throw new Error(res.error);
        setCurrentUser(res.user);
        setCredits(res.user.credits || 0);
        setIsAuthModalOpen(false);
        showToast(`Welcome back, ${res.user.name}!`);
        loadUserData();
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleProviderSignIn = async (provider) => {
    setAuthLoading(true);
    setAuthError('');
    setAuthNotice('');
    try {
      const result = await api.authSocialLogin(provider);
      if (result.error) throw new Error(result.error);
      setCurrentUser(result.user);
      setCredits(result.user?.credits || 0);
      setIsAuthModalOpen(false);
      showToast('Signed in securely.');
      loadUserData();
    } catch (err) {
      setAuthError(err.message || 'Sign-in could not be completed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setAuthLoading(true);
    setAuthError('');
    setAuthNotice('');
    try {
      await api.authPasswordReset(authEmail);
      setAuthNotice('Password reset instructions are on the way to your inbox.');
    } catch (err) {
      setAuthError(err.message || 'We could not send a reset link. Check the email address and try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setIsSavingProfile(true);
    try {
      const result = await api.saveProfile(profileForm);
      if (result.error || !result.user) throw new Error(result.error || 'We could not save your profile. Please try again.');
      setCurrentUser(result.user);
      setRole(result.user.targetRole);
      setIsProfileModalOpen(false);
      showToast('Your practice preferences are saved.');
    } catch (error) {
      showToast(error.message || 'We could not save your profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const toggleCoachingPreference = (preference) => {
    setProfileForm((current) => ({
      ...current,
      coachingPreferences: current.coachingPreferences.includes(preference)
        ? current.coachingPreferences.filter((item) => item !== preference)
        : [...current.coachingPreferences, preference],
    }));
  };

  const handleLogout = async () => {
    await api.clearAuthToken();
    setCurrentUser(null);
    setCredits(0);
    showToast('Signed out successfully.');
  };

  const handleExportData = async () => {
    try {
      const data = await api.exportAccountData();
      if (data.error) throw new Error(data.error);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'intervia-account-export.json';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast('Your account export is ready.');
    } catch (error) {
      showToast(error.message || 'We could not prepare the account export.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Delete your Intervia account and its saved interview, resume, coaching, and credit history? This cannot be undone.')) return;
    try {
      const result = await api.deleteAccount();
      if (!result.deleted) throw new Error(result.error || 'We could not delete your account. Please try again.');
      await api.clearAuthToken();
      setCurrentUser(null);
      setCredits(0);
      showToast(result.pending
        ? 'Account deletion is queued and will finish automatically.'
        : 'Your account and saved data have been deleted.');
    } catch (error) {
      showToast(error.message || 'We could not delete your account. Please try again.');
    }
  };

  /* ── Speech Recognition setup for interview ── */
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (e) => {
        let currentText = '';
        for (let i = 0; i < e.results.length; i++) {
          currentText += e.results[i][0].transcript + ' ';
        }
        setTranscript(currentText.trim());
      };

      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      recRef.current = recognition;
    }
  }, []);

  /* ── Timer for recording ── */
  useEffect(() => {
    let interval = null;
    if (isRecording) {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const toggleRecording = () => {
    if (!recRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    if (isRecording) {
      recRef.current.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      setTimer(0);
      recRef.current.start();
      setIsRecording(true);
    }
  };

  /* ── Interview Actions ── */
  const handleStartInterview = async () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (credits < creditCosts.interviewSession) {
      showToast(`⚠️ Need ${creditCosts.interviewSession} credits to start an interview session.`);
      setActiveTab('store');
      return;
    }

    setIsStartingInterview(true);
    try {
      const data = await api.startInterview({ mode, role, difficulty });
      if (data.error === 'insufficient_credits') {
        showToast('⚠️ Insufficient credits.');
        setActiveTab('store');
        return;
      }
      if (data.error) throw new Error(data.error);
      setQuestions(data.questions || []);
      setInterviewSessionId(data.sessionId);
      setCurrentQIndex(0);
      setInterviewResults([]);
      setCurrentEval(null);
      setTranscript('');
      setCredits(data.remainingCredits ?? (credits - creditCosts.interviewSession));
      setInterviewStep('active');
      showToast(`✓ Session started (-${creditCosts.interviewSession} credits)`);
    } catch (error) {
      showToast(error.message || 'Could not start a session. Please try again.');
    } finally {
      setIsStartingInterview(false);
    }
  };

  const handleEvaluateAnswer = async () => {
    if (!transcript.trim()) {
      showToast('⚠️ Please speak or type your answer first.');
      return;
    }
    if (isRecording) toggleRecording();

    setIsEvaluating(true);
    try {
      const res = await api.evaluateAnswer({
        sessionId: interviewSessionId,
        transcript,
        question: questions[currentQIndex]?.question,
        mode,
        role,
        difficulty,
      });
      if (res.error) throw new Error(res.error);

      setCurrentEval(res);
      setShowModelAnswer(false);
      setInterviewResults((prev) => [
        ...prev,
        {
          question: questions[currentQIndex]?.question,
          transcript,
          overall: res.overall,
          scores: res.scores,
          verdict: res.verdict,
          aiAnalysis: res.aiAnalysis,
          idealAnswer: res.idealAnswer,
        },
      ]);
      showToast(`✓ Evaluated: ${res.verdict} (${res.overall}/100)`);
    } catch {
      showToast('⚠️ Evaluation error. Using backup analysis.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = async () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((idx) => idx + 1);
      setTranscript('');
      setCurrentEval(null);
      setShowModelAnswer(false);
      setTimer(0);
    } else {
      try {
        const completion = await api.completeInterview({ sessionId: interviewSessionId });
        if (completion.error) showToast(completion.error);
        const history = await api.fetchHistory();
        if (Array.isArray(history.interviews)) setPracticeHistory(history);
      } catch {
        showToast('Your answers are saved. We could not refresh the dashboard just now.');
      }
      setInterviewStep('summary');
    }
  };

  /* ── Resume Analysis (File Upload or Raw Text) ── */
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleAnalyzeResume = async () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!resumeConsent) {
      showToast('Please review and accept the resume AI processing notice first.');
      return;
    }
    if (credits < creditCosts.resumeAnalysis) {
      showToast(`⚠️ Resume audit costs ${creditCosts.resumeAnalysis} credits. You have ${credits}.`);
      setActiveTab('store');
      return;
    }

    if (resumeInputMode === 'upload') {
      if (!uploadedFile) {
        showToast('⚠️ Please select a PDF, DOCX, or TXT file to upload.');
        return;
      }

      setIsAnalyzingResume(true);
      try {
        const consent = await api.saveResumeConsent(true);
        if (consent.error) throw new Error(consent.error);
        const data = await api.uploadAndAnalyzeResume(uploadedFile);
        if (data.error) throw new Error(data.error);

        setResumeResult(data);
        if (data.remaining !== undefined) setCredits(data.remaining);
        else setCredits((c) => c - creditCosts.resumeAnalysis);
        showToast(`✓ Audit complete for "${uploadedFile.name}" (-20 credits)`);
      } catch (err) {
        showToast(`⚠️ Error: ${err.message || 'File analysis failed.'}`);
      } finally {
        setIsAnalyzingResume(false);
      }
    } else {
      // Text mode
      if (!resumeText.trim() || resumeText.trim().length < 30) {
        showToast('⚠️ Please paste a comprehensive resume (at least 30 characters).');
        return;
      }

      setIsAnalyzingResume(true);
      try {
        const consent = await api.saveResumeConsent(true);
        if (consent.error) throw new Error(consent.error);
        const data = await api.analyzeResume({ resumeText });
        if (data.error) throw new Error(data.error);

        setResumeResult(data);
        if (data.remaining !== undefined) setCredits(data.remaining);
        else setCredits((c) => c - creditCosts.resumeAnalysis);
        showToast('✓ Resume audit complete (-20 credits)');
      } catch (err) {
        showToast(`⚠️ Error: ${err.message || 'Analysis failed.'}`);
      } finally {
        setIsAnalyzingResume(false);
      }
    }
  };

  /* ── Voice Agent Interaction ── */
  const handleSendAgentMessage = async (overrideMessage) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    const textToSend = overrideMessage || agentInput;
    if (!textToSend.trim()) return;

    if (isLiveCoachConnected && liveSocketRef.current?.readyState === WebSocket.OPEN) {
      liveCurrentTurnRef.current.user = textToSend.trim();
      setAgentMessages((previous) => [...previous.filter((entry) => !entry.liveDraft), { sender: 'user', text: textToSend.trim(), time: 'Live', liveDraft: true }]);
      setAgentInput('');
      liveSocketRef.current.send(JSON.stringify({ clientContent: { turns: [{ role: 'user', parts: [{ text: textToSend.trim() }] }], turnComplete: true } }));
      return;
    }

    if (credits < creditCosts.agentChat) {
      showToast(`⚠️ Voice coach costs ${creditCosts.agentChat} credits. You have ${credits}.`);
      setActiveTab('store');
      return;
    }

    const userMsg = { sender: 'user', text: textToSend, time: 'Now' };
    setAgentMessages((prev) => [...prev, userMsg]);
    setAgentInput('');
    setIsAgentThinking(true);

    try {
      const data = await api.chatWithAgent({
        message: textToSend,
        language: agentLanguage,
        useResumeContext: coachResumeConsent,
      });
      if (data.error) {
        if (data.error === 'insufficient_credits') {
          setAgentMessages((previous) => previous.filter((message) => message !== userMsg));
          showToast(data.message || 'Insufficient credits.');
          setActiveTab('store');
          return;
        }
        throw new Error(data.message || data.error);
      }
      if (!data.reply) throw new Error('The coach returned an empty response. Please try again.');
      const aiMsg = { sender: 'ai', text: data.reply, time: 'Just now' };
      setAgentMessages((prev) => [...prev, aiMsg]);
      if (data.remaining !== undefined) setCredits(data.remaining);
      else setCredits((c) => c - creditCosts.agentChat);

      speakText(data.reply);
    } catch (error) {
      setAgentMessages((previous) => previous.filter((message) => message !== userMsg));
      showToast(error.message || 'The coach could not respond. Your credits were not used.');
    } finally {
      setIsAgentThinking(false);
    }
  };

  const toggleAgentMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Voice input is not supported in this browser. Try Chrome or type your message.');
      return;
    }

    if (isAgentListening) {
      agentRecognitionRef.current?.stop();
      setIsAgentListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = agentLanguage === 'hi' ? 'hi-IN' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsAgentListening(true);
    recognition.onend = () => setIsAgentListening(false);
    recognition.onerror = (event) => {
      setIsAgentListening(false);
      const messages = {
        'not-allowed': 'Allow microphone access in your browser to use voice input.',
        'service-not-allowed': 'Your browser blocked speech recognition. You can type to the coach instead.',
        'network': 'Speech recognition needs an internet connection. Try again or type your message.',
        'no-speech': 'I did not hear anything. Try speaking again.',
      };
      showToast(messages[event.error] || 'Voice input stopped. Please try again.');
    };

    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setIsAgentListening(false);
      handleSendAgentMessage(speechToText);
    };

    agentRecognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setIsAgentListening(false);
      showToast('Could not start voice input. Check microphone access and try again.');
    }
  };

  const finishLiveCoach = async ({ notify = false, message = '' } = {}) => {
    if (liveEndingRef.current) return;
    liveEndingRef.current = true;
    if (liveTimerRef.current) window.clearInterval(liveTimerRef.current);
    liveTimerRef.current = null;

    const sessionId = liveSessionIdRef.current;
    const transcript = [...liveTranscriptRef.current];
    const socket = liveSocketRef.current;
    liveSocketRef.current = null;
    if (socket && socket.readyState < WebSocket.CLOSING) socket.close(1000, 'Session ended');
    liveProcessorRef.current?.disconnect();
    liveSourceRef.current?.disconnect();
    liveStreamRef.current?.getTracks().forEach((track) => track.stop());
    liveStreamRef.current = null;
    const audioContext = liveAudioContextRef.current;
    liveAudioContextRef.current = null;
    if (audioContext && audioContext.state !== 'closed') audioContext.close().catch(() => {});

    setIsLiveCoachConnected(false);
    setIsLiveCoachStarting(false);
    setIsAgentListening(false);
    setIsAgentSpeaking(false);
    setLiveCoachSeconds(0);
    liveCurrentTurnRef.current = { user: '', assistant: '' };
    liveSessionIdRef.current = '';
    liveTranscriptRef.current = [];
    if (sessionId && transcript.length) {
      try {
        const result = await api.saveLiveCoachTranscript({ sessionId, turns: transcript });
        if (result.error) throw new Error(result.error);
      } catch (error) {
        showToast(error.message || 'The Live Coach transcript could not be saved.');
      }
    }
    liveEndingRef.current = false;
    if (notify && message) showToast(message);
  };

  const startLiveCoach = async () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (isLiveCoachStarting || isLiveCoachConnected) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext || !window.WebSocket) {
      showToast('Live voice needs a modern browser with microphone access. You can still use the typed coach.');
      return;
    }
    if (credits < creditCosts.agentChat) {
      showToast(`A Live Coach session costs ${creditCosts.agentChat} credits. You have ${credits}.`);
      setActiveTab('store');
      return;
    }

    setIsLiveCoachStarting(true);
    setIsAgentListening(true);
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      liveStreamRef.current = stream;
      const tokenData = await api.createLiveCoachToken({ language: agentLanguage, useResumeContext: coachResumeConsent });
      if (tokenData.error) {
        if (tokenData.error === 'insufficient_credits') setActiveTab('store');
        throw new Error(tokenData.message || tokenData.error);
      }
      if (!tokenData.token || !tokenData.sessionId || !tokenData.model) throw new Error('The Live Coach could not create a secure session.');
      if (tokenData.remaining !== undefined) setCredits(tokenData.remaining);
      liveSessionIdRef.current = tokenData.sessionId;
      liveExpiresAtRef.current = Date.parse(tokenData.expiresAt);
      liveTranscriptRef.current = [];

      const audioContext = new AudioContext({ sampleRate: 16000 });
      liveAudioContextRef.current = audioContext;
      await audioContext.resume();
      const socketUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(tokenData.token)}`;
      const socket = new WebSocket(socketUrl);
      liveSocketRef.current = socket;

      await new Promise((resolve, reject) => {
        let settled = false;
        const setupTimer = window.setTimeout(() => {
          if (settled) return;
          settled = true;
          reject(new Error('The Live Coach took too long to connect. Check the Gemini Live model and network access.'));
        }, 15000);
        const settle = (error) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(setupTimer);
          if (error) reject(error);
          else resolve();
        };
        socket.onopen = () => {
          socket.send(JSON.stringify({ setup: { model: tokenData.model } }));
        };
        socket.onmessage = (event) => {
          let payload;
          try { payload = JSON.parse(event.data); } catch { return; }
          if (payload.error) {
            settle(new Error(payload.error.message || 'Gemini Live rejected this session. Check model access and billing in AI Studio.'));
            return;
          }
          if (payload.setupComplete) {
            settle();
            setIsLiveCoachConnected(true);
            setIsLiveCoachStarting(false);
            setIsAgentListening(true);
            setLiveCoachSeconds(Math.max(0, Math.ceil((liveExpiresAtRef.current - Date.now()) / 1000)));
            liveTimerRef.current = window.setInterval(() => {
              const remaining = Math.max(0, Math.ceil((liveExpiresAtRef.current - Date.now()) / 1000));
              setLiveCoachSeconds(remaining);
              if (remaining <= 0) finishLiveCoach({ notify: true, message: 'Your five-minute Live Coach session ended.' });
            }, 1000);
            liveCurrentTurnRef.current = { user: 'Start the interview.', assistant: '' };
            setAgentMessages((previous) => [...previous.filter((entry) => !entry.liveDraft), { sender: 'user', text: 'Start the interview.', time: 'Live', liveDraft: true }]);
            socket.send(JSON.stringify({ clientContent: { turns: [{ role: 'user', parts: [{ text: 'Begin now with a brief welcome and one focused interview question.' }] }], turnComplete: true } }));

            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            liveSourceRef.current = source;
            liveProcessorRef.current = processor;
            processor.onaudioprocess = (audioEvent) => {
              audioEvent.outputBuffer.getChannelData(0).fill(0);
              if (socket.readyState !== WebSocket.OPEN) return;
              const input = audioEvent.inputBuffer.getChannelData(0);
              const inputRate = audioEvent.inputBuffer.sampleRate;
              const step = inputRate / 16000;
              const sampleCount = Math.floor(input.length / step);
              const pcm = new ArrayBuffer(sampleCount * 2);
              const view = new DataView(pcm);
              for (let index = 0; index < sampleCount; index += 1) {
                const sample = input[Math.min(input.length - 1, Math.floor(index * step))];
                view.setInt16(index * 2, Math.max(-1, Math.min(1, sample)) * 0x7fff, true);
              }
              const bytes = new Uint8Array(pcm);
              let binary = '';
              for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
              socket.send(JSON.stringify({ realtimeInput: { audio: { mimeType: 'audio/pcm;rate=16000', data: window.btoa(binary) } } }));
            };
            source.connect(processor);
            processor.connect(audioContext.destination);
          }

          const serverContent = payload.serverContent;
          if (!serverContent) return;
          if (serverContent.inputTranscription?.text) {
            liveCurrentTurnRef.current.user = serverContent.inputTranscription.text.trim();
            setAgentMessages((previous) => [...previous.filter((entry) => !entry.liveDraft), { sender: 'user', text: liveCurrentTurnRef.current.user, time: 'Live', liveDraft: true }]);
          }
          if (serverContent.outputTranscription?.text) {
            liveCurrentTurnRef.current.assistant += serverContent.outputTranscription.text;
            const turn = liveCurrentTurnRef.current;
            setAgentMessages((previous) => [...previous.filter((entry) => !entry.liveDraft), ...(turn.user ? [{ sender: 'user', text: turn.user, time: 'Live', liveDraft: true }] : []), { sender: 'ai', text: turn.assistant.trim(), time: 'Live', liveDraft: true }]);
          }
          if (serverContent.interrupted) {
            livePlaybackTimeRef.current = audioContext.currentTime;
            setIsAgentSpeaking(false);
          }
          for (const part of serverContent.modelTurn?.parts || []) {
            const audioData = part.inlineData?.data || part.inline_data?.data;
            if (!audioData) continue;
            try {
              const bytes = window.atob(audioData);
              const output = new Float32Array(Math.floor(bytes.length / 2));
              const view = new DataView(Uint8Array.from(bytes, (character) => character.charCodeAt(0)).buffer);
              for (let index = 0; index < output.length; index += 1) output[index] = view.getInt16(index * 2, true) / 32768;
              const buffer = audioContext.createBuffer(1, output.length, 24000);
              buffer.copyToChannel(output, 0);
              const player = audioContext.createBufferSource();
              player.buffer = buffer;
              player.connect(audioContext.destination);
              const startAt = Math.max(audioContext.currentTime + 0.03, livePlaybackTimeRef.current);
              player.start(startAt);
              livePlaybackTimeRef.current = startAt + buffer.duration;
              setIsAgentSpeaking(true);
              player.onended = () => {
                if (audioContext.currentTime >= livePlaybackTimeRef.current - 0.05) setIsAgentSpeaking(false);
              };
            } catch (error) {
              console.warn('[Live Coach] Audio playback chunk failed:', error.message);
            }
          }
          if (serverContent.turnComplete) {
            const turn = liveCurrentTurnRef.current;
            if (turn.user.trim() && turn.assistant.trim()) {
              liveTranscriptRef.current.push({ user: turn.user.trim().slice(0, 3000), assistant: turn.assistant.trim().slice(0, 3000) });
              if (liveTranscriptRef.current.length > 20) liveTranscriptRef.current.shift();
              setAgentMessages((previous) => [
                ...previous.filter((entry) => !entry.liveDraft),
                { sender: 'user', text: turn.user.trim(), time: 'Live' },
                { sender: 'ai', text: turn.assistant.trim(), time: 'Live' },
              ]);
            }
            liveCurrentTurnRef.current = { user: '', assistant: '' };
          }
        };
        socket.onerror = () => {
          settle(new Error('Could not connect to Gemini Live. Check your API key, model access, and internet connection.'));
        };
        socket.onclose = (event) => {
          if (!settled) settle(new Error(event.reason || 'The Live Coach connection closed before it was ready.'));
          else if (!liveEndingRef.current) finishLiveCoach({ notify: true, message: 'The Live Coach connection ended.' });
        };
      });
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop());
      liveStreamRef.current = null;
      await finishLiveCoach();
      showToast(error.message || 'The Live Coach could not start. Your regular coach is still available.');
    }
  };

  useEffect(() => {
    if (!currentUser && (isLiveCoachConnected || isLiveCoachStarting)) finishLiveCoach();
  }, [currentUser, isLiveCoachConnected, isLiveCoachStarting]);

  useEffect(() => () => {
    if (liveTimerRef.current) window.clearInterval(liveTimerRef.current);
    liveSocketRef.current?.close(1000, 'Page closed');
    liveProcessorRef.current?.disconnect();
    liveSourceRef.current?.disconnect();
    liveStreamRef.current?.getTracks().forEach((track) => track.stop());
    if (liveAudioContextRef.current && liveAudioContextRef.current.state !== 'closed') liveAudioContextRef.current.close().catch(() => {});
  }, []);

  const handleCoachResumeConsent = async (granted) => {
    setCoachResumeConsent(granted);
    try {
      const result = await api.saveCoachResumeConsent(granted);
      if (result.error) throw new Error(result.error);
    } catch (error) {
      setCoachResumeConsent(!granted);
      showToast(error.message || 'We could not save your resume-sharing preference.');
    }
  };

  /* ── Purchase Credits ── */
  const handlePurchase = async (plan) => {
    setIsProcessingPayment(true);
    try {
      if (!currentUser) {
        setIsAuthModalOpen(true);
        return;
      }
      const orderRes = await api.createPaymentOrder({ planName: plan.name });
      if (orderRes.error || !orderRes.key || !orderRes.order?.id) {
        throw new Error(orderRes.error || 'Checkout is not available yet.');
      }
      if (!window.Razorpay) throw new Error('Secure checkout did not load. Please retry.');
      if (orderRes.exchangeRate) setUsdInrQuote(orderRes.exchangeRate);

      const options = {
        key: orderRes.key,
        amount: orderRes.order.amount,
        currency: orderRes.order.currency,
        name: 'Intervia',
        description: `${plan.name} — ${plan.credits} credits`,
        order_id: orderRes.order.id,
        handler: async (response) => {
          try {
            const verifyRes = await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (!verifyRes.success) {
              showToast(verifyRes.error || 'Payment verification is still pending. Contact support before retrying.');
              return;
            }
            setCredits(verifyRes.newBalance);
            showToast(`${plan.credits} credits added to your account.`);
            api.fetchTransactions().then((t) => setTransactions(t.transactions || []));
          } catch {
            showToast('Payment was received, but verification is still pending. Please check your balance before retrying.');
          }
        },
        prefill: { name: currentUser.name, email: currentUser.email },
        theme: { color: '#6366f1' },
      };
      new window.Razorpay(options).open();
    } catch (err) {
      showToast(err.message || 'Checkout could not start. Please try again later.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  /* ── Download PDF Report ── */
  const handleDownloadPDF = async () => {
    try {
      const avg = interviewResults.length > 0
        ? Math.round(interviewResults.reduce((acc, r) => acc + r.overall, 0) / interviewResults.length)
        : 85;

      const blob = await api.downloadPDF({
        candidateName: currentUser ? currentUser.name : 'Candidate',
        role,
        overall: avg,
        scores: interviewResults[0]?.scores || { relevance: 88, clarity: 84, confidence: 82, depth: 85 },
        sessionResults: interviewResults,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Intervia_Report_${Date.now()}.pdf`;
      link.click();
      showToast('✓ PDF report downloaded successfully');
    } catch {
      showToast('⚠️ Could not generate PDF. Please ensure backend is running.');
    }
  };

  const formatTimer = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const activePlans = plans.length > 0 ? plans : [
    { id: 'starter', name: 'Starter Pack', credits: 100, price: 5, currency: 'USD', features: ['100 credits', '10 interview sessions', '5 full resume audits', 'AI Voice coaching drills'] },
    { id: 'growth', name: 'Growth Pack', credits: 260, price: 12, currency: 'USD', popular: true, features: ['260 credits', '26 interview sessions', '13 resume audits', 'Unlimited voice coach', 'Staff Engineer model answers'] },
    { id: 'pro', name: 'Pro Career Pack', credits: 600, price: 24, currency: 'USD', features: ['600 credits', '60 sessions', '30 resume audits', 'Priority neural scoring', 'PDF export reports'] },
    { id: 'executive', name: 'Executive Master', credits: 1500, price: 49, currency: 'USD', features: ['1500 credits', '150 sessions', '75 resume audits', 'Lifetime access to drills', 'Priority 24/7 feature access'] },
  ];

  /* ───────────────────────────────────────────────────────────────────────────
     RENDER
     ─────────────────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-black text-[#f5f5f7] flex flex-col selection:bg-[#2997ff]/30">

      {/* ── Toast Notification ────────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 anim-fade-up">
          <div className="apple-glass px-6 py-3 rounded-full text-xs font-semibold tracking-wide text-white shadow-2xl border border-white/20 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#30d158] animate-pulse" />
            {toastMessage}
          </div>
        </div>
      )}

      {isProfileModalOpen && currentUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 anim-fade-up">
          <form onSubmit={handleSaveProfile} className="apple-card max-w-lg w-full rounded-3xl p-7 sm:p-8 border border-white/[0.15] shadow-2xl space-y-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#818cf8] font-semibold mb-2">Personalise your practice</p>
              <h2 className="text-xl font-bold text-white">What are you preparing for?</h2>
              <p className="text-xs text-zinc-400 mt-2">A little context helps Intervia shape more relevant practice and coaching.</p>
            </div>
            <div>
              <label htmlFor="profile-target-role" className="block text-xs text-zinc-300 font-medium mb-2">Target role</label>
              <input id="profile-target-role" required maxLength={120} value={profileForm.targetRole}
                onChange={(event) => setProfileForm((current) => ({ ...current, targetRole: event.target.value }))}
                placeholder="e.g. Product Designer" className="w-full rounded-xl border border-white/[0.12] bg-black/40 px-4 py-3 text-sm text-white placeholder:text-zinc-600" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="profile-experience" className="block text-xs text-zinc-300 font-medium mb-2">Experience level</label>
                <select id="profile-experience" required value={profileForm.experienceLevel}
                  onChange={(event) => setProfileForm((current) => ({ ...current, experienceLevel: event.target.value }))}
                  className="w-full rounded-xl border border-white/[0.12] bg-[#111116] px-4 py-3 text-sm text-white">
                  <option value="" disabled>Choose a level</option>
                  {['Early career', 'Mid career', 'Senior', 'Career change'].map((level) => <option key={level}>{level}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="profile-interview-date" className="block text-xs text-zinc-300 font-medium mb-2">Interview date <span className="text-zinc-500">(optional)</span></label>
                <input id="profile-interview-date" type="date" value={profileForm.interviewDate}
                  onChange={(event) => setProfileForm((current) => ({ ...current, interviewDate: event.target.value }))}
                  className="w-full rounded-xl border border-white/[0.12] bg-[#111116] px-4 py-3 text-sm text-white" />
              </div>
            </div>
            <fieldset>
              <legend className="block text-xs text-zinc-300 font-medium mb-2">How would you like coaching to feel?</legend>
              <div className="grid sm:grid-cols-2 gap-2">
                {[
                  ['clear_feedback', 'Clear, direct feedback'],
                  ['more_examples', 'More answer examples'],
                  ['gentle_pacing', 'A gentler pace'],
                  ['challenging_practice', 'More challenging practice'],
                ].map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-xs text-zinc-300 cursor-pointer hover:bg-white/[0.06]">
                    <input type="checkbox" checked={profileForm.coachingPreferences.includes(value)} onChange={() => toggleCoachingPreference(value)} className="accent-indigo-400" />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex items-center justify-between gap-3 pt-1">
              <button type="button" onClick={() => setIsProfileModalOpen(false)} className="px-3 py-2 text-xs text-zinc-400 hover:text-white">Do this later</button>
              <button type="submit" disabled={isSavingProfile} className="rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-black hover:bg-zinc-200 disabled:opacity-50">
                {isSavingProfile ? 'Saving…' : 'Save my preferences'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Authentication Modal ──────────────────────────────────────────── */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 anim-fade-up">
          <div role="dialog" aria-modal="true" aria-labelledby="auth-dialog-title" className="apple-card max-w-md w-full rounded-3xl p-8 border border-white/[0.15] relative shadow-2xl">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              aria-label="Close sign-in dialog"
              className="absolute top-5 right-5 text-zinc-400 hover:text-white text-xs px-2 py-1 rounded-full bg-white/[0.06]"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-2 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-[#2997ff]/10 border border-[#2997ff]/20 mx-auto flex items-center justify-center text-[#2997ff]">
                <Icon d={icons.lock} className="w-5 h-5" />
              </div>
              <h3 id="auth-dialog-title" className="text-xl font-bold text-white">
                {authMode === 'login' ? 'Sign in to Intervia' : 'Create Your Account'}
              </h3>
              <p className="text-xs text-zinc-400">
                {authMode === 'login'
                  ? 'Access your saved interviews, audits, and credit balance.'
                  : 'Create a private account for your interview preparation.'}
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex rounded-full bg-white/[0.06] p-1 mb-5 text-xs">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setAuthError(''); setAuthNotice(''); }}
                className={`flex-1 py-1.5 rounded-full font-medium transition-all ${
                  authMode === 'login' ? 'apple-pill-active' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setAuthError(''); setAuthNotice(''); }}
                className={`flex-1 py-1.5 rounded-full font-medium transition-all ${
                  authMode === 'register' ? 'apple-pill-active' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Create account
              </button>
            </div>

            {/* Error Banner */}
            {authError && (
              <div role="alert" className="mb-4 p-3 rounded-xl bg-[#ff453a]/10 border border-[#ff453a]/25 text-[#ff453a] text-xs font-medium">
                {authError}
              </div>
            )}
            {authNotice && (
              <div role="status" className="mb-4 p-3 rounded-xl bg-[#30d158]/10 border border-[#30d158]/25 text-[#9ee6b2] text-xs font-medium">
                {authNotice}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-5">
              <button type="button" disabled={authLoading || !firebaseConfigured} onClick={() => handleProviderSignIn('google')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.04] py-3 text-xs font-semibold text-white hover:bg-white/[0.08] transition disabled:opacity-40">
                <GoogleLogo />
                <span>Continue with Google</span>
              </button>
              <button type="button" disabled={authLoading || !firebaseConfigured} onClick={() => handleProviderSignIn('microsoft')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.04] py-3 text-xs font-semibold text-white hover:bg-white/[0.08] transition disabled:opacity-40">
                <MicrosoftLogo />
                <span>Microsoft / Outlook</span>
              </button>
            </div>
            {!firebaseConfigured && (
              <p className="text-[11px] text-zinc-500 mb-4 text-center">
                Add Firebase web settings to enable secure sign-in.
              </p>
            )}

            {/* Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
              {authMode === 'register' && (
                <div>
                  <label className="block uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-zinc-900 border border-white/[0.1] rounded-2xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#2997ff] transition"
                  />
                </div>
              )}

              <div>
                <label className="block uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-zinc-900 border border-white/[0.1] rounded-2xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#2997ff] transition"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-zinc-900 border border-white/[0.1] rounded-2xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#2997ff] transition"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="inline-flex w-full items-center justify-center gap-2 mt-2 py-3.5 rounded-full bg-white hover:bg-zinc-200 text-black font-semibold text-xs tracking-wide transition-all shadow-xl disabled:opacity-40"
              >
                <Icon d={icons.mail} className="h-4 w-4" />
                {authLoading ? 'Please wait…' : authMode === 'login' ? 'Sign in with email' : 'Create account'}
              </button>

              {authMode === 'login' && (
                <div className="text-center">
                  <button type="button" onClick={handlePasswordReset} disabled={authLoading}
                    className="text-zinc-400 hover:text-white text-[11px] underline underline-offset-4 disabled:opacity-40">
                    Forgot password?
                  </button>
                </div>
              )}

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="text-zinc-500 hover:text-zinc-300 text-[11px]"
                >
                  Continue exploring
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Apple-Grade Translucent Navigation Bar ────────────────────────── */}
      <nav className="sticky top-0 z-40 apple-glass-nav px-6 py-3.5 transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* Brand Logo with Iris Glow */}
          <button onClick={() => setActiveTab('overview')} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2997ff] via-[#af52de] to-[#ff2d55] flex items-center justify-center shadow-lg shadow-[#af52de]/30 group-hover:scale-105 transition-transform">
              <Icon d={icons.sparkle} className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-white">Intervia</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 px-1.5 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08]">
                Intelligence
              </span>
            </div>
          </button>

          {/* Segmented Control */}
          <div className="hidden md:flex items-center p-1 rounded-full bg-white/[0.06] border border-white/[0.08]">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'interview', label: 'Mock Interview' },
              { id: 'resume', label: 'Resume AI' },
              { id: 'agent', label: 'Voice Coach' },
              { id: 'store', label: 'Credits Store' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  stopSpeaking();
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? 'apple-pill-active'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right Actions: Credit Balance & Authentication */}
          <div className="flex items-center gap-3">
            
            {/* Live AI Status Dot (Neutral, non-branded) */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#30d158] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#30d158]" />
              </span>
              <span className="text-zinc-300 font-medium">Interview coach</span>
            </div>

            {/* Credit Pill */}
            <button
              onClick={() => setActiveTab('store')}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#2997ff]/15 to-[#af52de]/15 border border-[#2997ff]/30 hover:border-[#2997ff]/60 text-white text-xs font-semibold transition-all group"
            >
              <Icon d={icons.zap} className="w-3.5 h-3.5 text-[#2997ff] group-hover:scale-110 transition-transform" />
              <span>{credits}</span>
              <span className="text-[10px] text-zinc-400 font-normal">Credits</span>
            </button>

            {/* User Profile / Auth Button */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#2997ff] to-[#af52de] flex items-center justify-center text-[10px] font-bold text-white">
                    {currentUser.avatar || 'U'}
                  </div>
                  <span className="hidden sm:inline text-zinc-200 font-medium max-w-[100px] truncate">
                    {currentUser.name}
                  </span>
                </div>
                <details className="relative">
                  <summary className="list-none cursor-pointer rounded-full border border-white/[0.1] px-3 py-1.5 text-[11px] text-zinc-300 hover:bg-white/[0.06] transition focus-visible:outline-none">
                    Account
                  </summary>
                  <div className="absolute right-0 top-full mt-2 z-40 w-44 rounded-2xl border border-white/[0.12] bg-[#15151a] p-1.5 shadow-2xl">
                    <button type="button" onClick={handleExportData} className="w-full rounded-xl px-3 py-2 text-left text-xs text-zinc-200 hover:bg-white/[0.08]">Export my data</button>
                    <button type="button" onClick={() => setIsProfileModalOpen(true)} className="w-full rounded-xl px-3 py-2 text-left text-xs text-zinc-200 hover:bg-white/[0.08]">Edit practice profile</button>
                    <button type="button" onClick={handleDeleteAccount} className="w-full rounded-xl px-3 py-2 text-left text-xs text-[#ff8f87] hover:bg-[#ff453a]/10">Delete account</button>
                  </div>
                </details>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white transition"
                >
                  <Icon d={icons.logout} className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
                className="px-3.5 py-1.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all shadow-md"
              >
                Sign In
              </button>
            )}

          </div>
        </div>
      </nav>

      {/* ── Mobile Tab Navigation Bar ─────────────────────────────────────── */}
      <div className="flex md:hidden overflow-x-auto p-2 bg-black/90 border-b border-white/[0.08] gap-1 px-4 text-xs">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'interview', label: 'Interview' },
          { id: 'resume', label: 'Resume AI' },
          { id: 'agent', label: 'Voice Coach' },
          { id: 'store', label: 'Store' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              stopSpeaking();
            }}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap text-xs transition-all ${
              activeTab === tab.id ? 'bg-white/20 text-white font-semibold' : 'text-zinc-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Main Workspace ────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">

        {/* ══════════════════════════════════════════════════════════════════════
           TAB 1: OVERVIEW
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-12 anim-fade-up">
            
            {/* Apple Hero Header */}
            <div className="text-center pt-8 pb-4 max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-xs font-medium text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2997ff]" />
                A focused practice space for your next interview
              </div>

              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
                Get interview-ready,
                <br />
                <span className="apple-intelligence-gradient">one answer at a time.</span>
              </h1>

              <p className="text-base md:text-lg text-zinc-400 leading-relaxed font-normal max-w-2xl mx-auto">
                Turn your experience into clear, confident answers with resume feedback, realistic practice, and coaching that gives you a next step.
              </p>

              {/* Quick Launch Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                <button
                  onClick={() => setActiveTab('interview')}
                  className="px-6 py-3 rounded-full bg-white text-black font-semibold text-xs tracking-wide hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Icon d={icons.play} className="w-4 h-4 text-black" />
                  Practice an interview
                </button>
                <button
                  onClick={() => setActiveTab('resume')}
                  className="px-6 py-3 rounded-full bg-zinc-900 border border-white/10 text-white font-semibold text-xs tracking-wide hover:bg-zinc-800 transition-all flex items-center gap-2"
                >
                  <Icon d={icons.upload} className="w-4 h-4 text-[#30d158]" />
                  Review my resume
                </button>
                <button
                  onClick={() => setActiveTab('agent')}
                  className="px-6 py-3 rounded-full bg-zinc-900 border border-white/10 text-white font-semibold text-xs tracking-wide hover:bg-zinc-800 transition-all flex items-center gap-2"
                >
                  <Icon d={icons.mic} className="w-4 h-4 text-[#af52de]" />
                  Voice Coach (5 Cr)
                </button>
              </div>
            </div>

            {/* Apple Product Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Mock Interview */}
              <div
                onClick={() => setActiveTab('interview')}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setActiveTab('interview'); }}
                role="button"
                tabIndex={0}
                className="apple-card rounded-3xl p-7 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#2997ff]/10 border border-[#2997ff]/20 flex items-center justify-center mb-5 text-[#2997ff]">
                    <Icon d={icons.mic} className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-[#2997ff]">Voice Assessment</span>
                  <h3 className="text-xl font-bold text-white mt-1 group-hover:text-[#2997ff] transition-colors">
                    AI Mock Interview
                  </h3>
                  <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                    Practice role-specific questions by text or voice, then get clear feedback on relevance, clarity, confidence, and depth.
                  </p>
                </div>
                <div className="pt-6 flex items-center justify-between border-t border-white/[0.06] mt-6">
                  <span className="text-xs font-semibold text-zinc-300">10 Credits / session</span>
                  <span className="text-xs text-[#2997ff] font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Launch →
                  </span>
                </div>
              </div>

              {/* Card 2: Resume Intelligence */}
              <div
                onClick={() => setActiveTab('resume')}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setActiveTab('resume'); }}
                role="button"
                tabIndex={0}
                className="apple-card rounded-3xl p-7 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#30d158]/10 border border-[#30d158]/20 flex items-center justify-center mb-5 text-[#30d158]">
                    <Icon d={icons.document} className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-[#30d158]">Resume Feedback</span>
                  <h3 className="text-xl font-bold text-white mt-1 group-hover:text-[#30d158] transition-colors">
                    Resume Deep Audit
                  </h3>
                  <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                    Upload a PDF or Word resume for practical feedback on clarity, measurable impact, and role alignment.
                  </p>
                </div>
                <div className="pt-6 flex items-center justify-between border-t border-white/[0.06] mt-6">
                  <span className="text-xs font-semibold text-zinc-300">20 Credits / audit</span>
                  <span className="text-xs text-[#30d158] font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Upload PDF →
                  </span>
                </div>
              </div>

              {/* Card 3: AI Voice Coach */}
              <div
                onClick={() => setActiveTab('agent')}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setActiveTab('agent'); }}
                role="button"
                tabIndex={0}
                className="apple-card rounded-3xl p-7 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#af52de]/10 border border-[#af52de]/20 flex items-center justify-center mb-5 text-[#af52de]">
                    <Icon d={icons.chat} className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-[#af52de]">Interactive Voice Partner</span>
                  <h3 className="text-xl font-bold text-white mt-1 group-hover:text-[#af52de] transition-colors">
                    AI Voice Coach
                  </h3>
                  <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                    Conversational practice partner with an animated voice visualizer. Speak freely, rehearse behavioral answers, and hear coaching feedback.
                  </p>
                </div>
                <div className="pt-6 flex items-center justify-between border-t border-white/[0.06] mt-6">
                  <span className="text-xs font-semibold text-zinc-300">5 Credits / talk</span>
                  <span className="text-xs text-[#af52de] font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Talk AI →
                  </span>
                </div>
              </div>

            </div>

            {/* Metrics Strip */}
            <div className="rounded-3xl p-6 bg-white/[0.03] border border-white/[0.06] grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-3xl font-extrabold text-white">{currentUser?.totalSessions ?? '—'}</p>
                <p className="text-xs text-zinc-500 mt-1">Sessions started</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-[#2997ff]">PDF / DOCX</p>
                <p className="text-xs text-zinc-500 mt-1">Document File Parsing</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-[#30d158]">4 Pillars</p>
                <p className="text-xs text-zinc-500 mt-1">Relevance, Clarity, Poise, Depth</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-[#af52de]">{currentUser?.resumeAnalyses ?? '—'}</p>
                <p className="text-xs text-zinc-500 mt-1">Resume reviews</p>
              </div>
            </div>

            {currentUser && (
              <PracticeHistory interviews={practiceHistory.interviews} resumes={practiceHistory.resumes} />
            )}

            {/* Plan Promo Strip */}
            <div className="rounded-3xl p-8 apple-card border border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1.5 text-center md:text-left">
                <span className="text-[11px] font-bold tracking-widest uppercase text-[#2997ff]">Transparent Credits</span>
                <h3 className="text-2xl font-bold text-white">Need more practice rounds?</h3>
                <p className="text-xs text-zinc-400">
                  Each tool shows its credit cost before you begin. Checkout will be enabled when account and payment settings are ready.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('store')}
                className="px-6 py-3 rounded-full bg-[#2997ff] text-white font-semibold text-xs tracking-wide hover:bg-[#1a85ea] transition-all shadow-lg shadow-[#2997ff]/20 whitespace-nowrap"
              >
                View Credit Store →
              </button>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
           TAB 2: MOCK INTERVIEW (10 Credits)
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'interview' && (
          <div className="space-y-6 anim-fade-up">

            {/* Sub-step: Setup */}
            {interviewStep === 'setup' && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold tracking-tight text-white">Configure Your Session</h2>
                  <p className="text-xs text-zinc-400">
                    Each comprehensive 5-question session deducts <span className="text-white font-semibold">10 credits</span>.
                  </p>
                </div>

                <div className="apple-card rounded-3xl p-8 space-y-6">
                  
                  {/* Mode */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                      Interview Discipline
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Technical', 'HR / Behavioral'].map((m) => {
                        const isSel = (m.startsWith('HR') ? 'HR' : 'Technical') === mode;
                        return (
                          <button
                            key={m}
                            onClick={() => setMode(m.startsWith('HR') ? 'HR' : 'Technical')}
                            className={`py-3.5 px-4 rounded-2xl text-xs font-semibold transition-all border ${
                              isSel
                                ? 'bg-white text-black border-white shadow-lg'
                                : 'bg-zinc-900/60 border-white/[0.08] text-zinc-400 hover:text-white'
                            }`}
                          >
                            {m}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Target Role */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                      Target Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/[0.1] rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#2997ff] transition"
                    >
                      <option>Full Stack Developer</option>
                      <option>Frontend Engineer (React/Vue/Next)</option>
                      <option>Backend Engineer (Node/Go/Python)</option>
                      <option>System Design & Cloud Architect</option>
                      <option>AI / Machine Learning Engineer</option>
                      <option>DevOps & Site Reliability Engineer</option>
                    </select>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                      Difficulty Level
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {['Easy', 'Medium', 'Hard'].map((d) => (
                        <button
                          key={d}
                          onClick={() => setDifficulty(d)}
                          className={`py-2.5 rounded-xl text-xs font-medium transition-all border ${
                            difficulty === d
                              ? 'bg-[#2997ff]/20 border-[#2997ff] text-[#2997ff]'
                              : 'bg-zinc-900/60 border-white/[0.06] text-zinc-400 hover:text-white'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Credit Notice */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-zinc-400">
                      Balance: <strong className="text-white">{credits} credits</strong>
                    </span>
                    <span className="text-zinc-400">
                      Cost: <strong className="text-[#2997ff]">10 credits</strong>
                    </span>
                  </div>

                  {/* Start Button */}
                  <button
                    onClick={handleStartInterview}
                    disabled={isStartingInterview || credits < creditCosts.interviewSession}
                    className="w-full py-4 rounded-2xl bg-white hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold text-xs tracking-wide transition-all shadow-xl flex items-center justify-center gap-2"
                  >
                    {isStartingInterview ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Generating Tailored Questions...
                      </>
                    ) : (
                      <>
                        <Icon d={icons.play} className="w-4 h-4 text-black" />
                        Begin Interview Session (-10 Credits)
                      </>
                    )}
                  </button>

                </div>
              </div>
            )}

            {/* Sub-step: Active Interview Drill */}
            {interviewStep === 'active' && questions.length > 0 && (
              <div className="space-y-6 max-w-4xl mx-auto">
                
                {/* Header Strip */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white px-3 py-1 rounded-full bg-white/[0.08] border border-white/[0.1]">
                      Question {currentQIndex + 1} of {questions.length}
                    </span>
                    <span className="text-xs text-zinc-400">{questions[currentQIndex]?.topic}</span>
                  </div>

                  {/* Timer & Listen out loud */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => speakText(questions[currentQIndex]?.question)}
                      className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 transition"
                      title="Read question out loud"
                    >
                      <Icon d={icons.speaker} className="w-3.5 h-3.5 text-[#2997ff]" />
                      <span>{isAgentSpeaking ? 'Speaking...' : 'Listen'}</span>
                    </button>

                    <div className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] font-mono text-xs text-zinc-300">
                      ⏱ {formatTimer(timer)}
                    </div>
                  </div>
                </div>

                {/* Question Display Card */}
                <div className="apple-card rounded-3xl p-8 space-y-2 border-l-4 border-l-[#2997ff]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#2997ff]">
                    {role} · {difficulty}
                  </p>
                  <h3 className="text-xl md:text-2xl font-bold text-white leading-relaxed">
                    {questions[currentQIndex]?.question}
                  </h3>
                </div>

                {/* Spoken Response & Voice Recording Workspace */}
                <div className="apple-card rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Your Response
                    </label>

                    {isRecording && (
                      <span className="flex items-center gap-2 text-xs font-semibold text-[#ff453a]">
                        <span className="w-2 h-2 rounded-full bg-[#ff453a] animate-ping" />
                        Recording live voice...
                      </span>
                    )}
                  </div>

                  {/* Mic toggle and hint */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleRecording}
                      className={`px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all ${
                        isRecording
                          ? 'bg-[#ff453a] text-white animate-pulse'
                          : 'bg-white text-black hover:bg-zinc-200'
                      }`}
                    >
                      <Icon d={isRecording ? icons.stop : icons.mic} className="w-4 h-4" />
                      {isRecording ? 'Stop Recording' : 'Start Speaking'}
                    </button>
                    <span className="text-xs text-zinc-500">or type directly in the box below</span>
                  </div>

                  {/* Live transcript textarea */}
                  <textarea
                    rows={4}
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Speak into your microphone or type your complete answer here..."
                    className="w-full bg-zinc-900/80 border border-white/[0.08] rounded-2xl p-4 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#2997ff] transition resize-none leading-relaxed"
                  />

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => {
                        setCurrentQIndex((idx) => Math.max(0, idx - 1));
                        setTranscript('');
                        setCurrentEval(null);
                        setTimer(0);
                      }}
                      disabled={currentQIndex === 0}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900 border border-white/[0.08] disabled:opacity-30 transition"
                    >
                      ← Back
                    </button>

                    <button
                      onClick={handleEvaluateAnswer}
                      disabled={isEvaluating || !transcript.trim()}
                      className="px-6 py-2.5 rounded-full bg-[#2997ff] hover:bg-[#1a85ea] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all shadow-lg shadow-[#2997ff]/20 flex items-center gap-2"
                    >
                      {isEvaluating ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Evaluating response...
                        </>
                      ) : (
                        'Submit & Grade'
                      )}
                    </button>

                    <button
                      onClick={handleNextQuestion}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-zinc-900 border border-white/[0.08] hover:bg-zinc-800 transition"
                    >
                      {currentQIndex < questions.length - 1 ? 'Next Question →' : 'Complete Interview →'}
                    </button>
                  </div>
                </div>

                {/* Evaluation Results Panel */}
                {currentEval && (
                  <div className="apple-card rounded-3xl overflow-hidden border border-white/[0.12] space-y-6 p-7 anim-scale-in">
                    
                    {/* Header Score & Verdict */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
                      <div className="space-y-1 text-center sm:text-left">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#2997ff] px-2.5 py-0.5 rounded-full bg-[#2997ff]/10 border border-[#2997ff]/20">
                          Multi-Pillar Assessment
                        </span>
                        <h4 className="text-2xl font-bold text-white mt-2">
                          Verdict: <span style={{ color: currentEval.verdictColor || '#30d158' }}>{currentEval.verdict}</span>
                        </h4>
                        <p className="text-xs text-zinc-400 max-w-md">
                          {currentEval.aiAnalysis}
                        </p>
                      </div>

                      <ScoreRing score={currentEval.overall} size={110} />
                    </div>

                    {/* 4 Pillars Progress */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Relevance', val: currentEval.scores?.relevance || 80, col: '#2997ff' },
                        { label: 'Clarity', val: currentEval.scores?.clarity || 78, col: '#af52de' },
                        { label: 'Poise & Confidence', val: currentEval.scores?.confidence || 75, col: '#30d158' },
                        { label: 'Technical Depth', val: currentEval.scores?.depth || 82, col: '#ffd60a' },
                      ].map((item, idx) => (
                        <div key={idx} className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-400">{item.label}</span>
                            <span className="font-bold text-white">{item.val}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${item.val}%`, backgroundColor: item.col }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Strengths & Improvements */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-[#30d158]/5 border border-[#30d158]/20 space-y-2">
                        <span className="text-xs font-bold text-[#30d158] uppercase tracking-wider flex items-center gap-1.5">
                          <Icon d={icons.check} className="w-3.5 h-3.5 text-[#30d158]" /> Strengths
                        </span>
                        <ul className="space-y-1.5 text-xs text-zinc-300">
                          {currentEval.strengths?.map((s, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-[#30d158]">•</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#ffd60a]/5 border border-[#ffd60a]/20 space-y-2">
                        <span className="text-xs font-bold text-[#ffd60a] uppercase tracking-wider flex items-center gap-1.5">
                          ▲ Opportunities for Growth
                        </span>
                        <ul className="space-y-1.5 text-xs text-zinc-300">
                          {currentEval.improvements?.map((s, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-[#ffd60a]">•</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Model Answer Showcase */}
                    {currentEval.idealAnswer && (
                      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => setShowModelAnswer((v) => !v)}
                            className="text-xs font-semibold text-[#af52de] hover:text-[#c778f0] flex items-center gap-1.5 transition"
                          >
                            <span>✨</span>
                            <span>{showModelAnswer ? 'Hide' : 'Reveal'} Principal Engineer Model Answer</span>
                          </button>
                          {showModelAnswer && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(currentEval.idealAnswer);
                                setCopiedAnswer(true);
                                setTimeout(() => setCopiedAnswer(false), 2000);
                              }}
                              className="text-[11px] text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg bg-zinc-800 transition"
                            >
                              {copiedAnswer ? '✓ Copied' : 'Copy'}
                            </button>
                          )}
                        </div>

                        {showModelAnswer && (
                          <p className="text-xs text-zinc-300 leading-relaxed font-mono bg-black/40 p-3.5 rounded-xl border border-white/[0.06] whitespace-pre-wrap">
                            {currentEval.idealAnswer}
                          </p>
                        )}
                      </div>
                    )}

                  </div>
                )}

              </div>
            )}

            {/* Sub-step: Summary */}
            {interviewStep === 'summary' && (
              <div className="max-w-3xl mx-auto space-y-8 anim-fade-up">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-white/[0.06] border border-white/[0.1] mx-auto flex items-center justify-center text-[#2997ff]">
                    <Icon d={icons.chart} className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-bold text-white">Interview Assessment Complete</h3>
                  <p className="text-xs text-zinc-400">
                    {mode} · {role} · {interviewResults.length} questions evaluated
                  </p>
                </div>

                {/* Average Score */}
                <div className="flex justify-center">
                  <ScoreRing
                    score={
                      interviewResults.length > 0
                        ? Math.round(interviewResults.reduce((a, b) => a + b.overall, 0) / interviewResults.length)
                        : 85
                    }
                    size={140}
                  />
                </div>

                {/* Per question summary */}
                <div className="space-y-3">
                  {interviewResults.map((item, idx) => (
                    <div key={idx} className="apple-card rounded-2xl p-4 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-zinc-400">
                          Q{idx + 1}
                        </span>
                        <p className="text-white font-medium max-w-md truncate">{item.question}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white">{item.overall}%</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.08] text-zinc-300">
                          {item.verdict}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleDownloadPDF}
                    className="flex-1 py-3.5 rounded-full bg-white text-black font-semibold text-xs tracking-wide hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-xl"
                  >
                    <Icon d={icons.download} className="w-4 h-4 text-black" />
                    Download Performance PDF Report
                  </button>
                  <button
                    onClick={() => {
                      setInterviewStep('setup');
                      setQuestions([]);
                      setInterviewResults([]);
                      setCurrentEval(null);
                    }}
                    className="flex-1 py-3.5 rounded-full bg-zinc-900 border border-white/[0.1] text-white font-semibold text-xs tracking-wide hover:bg-zinc-800 transition-all"
                  >
                    Start Another Drill
                  </button>
                </div>

              </div>
            )}

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
           TAB 3: RESUME INTELLIGENCE (Upload PDF/DOCX or Paste Text) (20 Cr)
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'resume' && (
          <div className="space-y-8 max-w-4xl mx-auto anim-fade-up">
            
            <div className="text-center space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#30d158] px-3 py-1 rounded-full bg-[#30d158]/10 border border-[#30d158]/20">
                Resume clarity and role-fit review
              </span>
              <h2 className="text-3xl font-bold text-white">Resume Deep Intelligence</h2>
              <p className="text-xs text-zinc-400 max-w-lg mx-auto">
                Upload your resume as a <span className="text-white font-semibold">PDF, DOCX, or TXT</span> document, or paste raw text.
                Get practical suggestions for clarity, role alignment, measurable impact, and readability (-20 credits).
              </p>
            </div>

            {/* Mode Selector: File Upload vs Text */}
            <div className="flex justify-center">
              <div className="inline-flex rounded-full bg-white/[0.06] p-1 border border-white/[0.08] text-xs">
                <button
                  onClick={() => setResumeInputMode('upload')}
                  className={`px-5 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
                    resumeInputMode === 'upload' ? 'apple-pill-active' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Icon d={icons.upload} className="w-4 h-4 text-[#30d158]" />
                  Upload Document (PDF / DOCX)
                </button>
                <button
                  onClick={() => setResumeInputMode('text')}
                  className={`px-5 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
                    resumeInputMode === 'text' ? 'apple-pill-active' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Icon d={icons.document} className="w-4 h-4 text-[#2997ff]" />
                  Paste Text Editor
                </button>
              </div>
            </div>

            {/* Input Card */}
            <div className="apple-card rounded-3xl p-8 space-y-6">
              
              {/* Option A: File Upload */}
              {resumeInputMode === 'upload' && (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/[0.15] hover:border-[#30d158]/50 rounded-3xl p-8 text-center cursor-pointer transition-all bg-zinc-900/40 hover:bg-zinc-900/70 group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div className="w-14 h-14 rounded-2xl bg-[#30d158]/10 border border-[#30d158]/20 mx-auto flex items-center justify-center text-[#30d158] mb-4 group-hover:scale-105 transition-transform">
                      <Icon d={icons.filePdf} className="w-7 h-7" />
                    </div>

                    {uploadedFile ? (
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-white flex items-center justify-center gap-2">
                          <span>📄 {uploadedFile.name}</span>
                          <span className="text-[10px] text-[#30d158] bg-[#30d158]/10 px-2 py-0.5 rounded-full font-mono">
                            {(uploadedFile.size / 1024).toFixed(1)} KB
                          </span>
                        </p>
                        <p className="text-xs text-zinc-400">Click to choose a different document</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="text-sm font-semibold text-white">
                          Choose or Drag & Drop your Resume
                        </p>
                        <p className="text-xs text-zinc-500">
                          Supports official PDF (.pdf), Microsoft Word (.docx), or plain text (.txt)
                        </p>
                      </div>
                    )}
                  </div>

                  {uploadedFile && (
                    <div className="flex items-center justify-between text-xs text-zinc-400 px-2">
                      <span>Ready for document text extraction</span>
                      <button
                        onClick={() => setUploadedFile(null)}
                        className="text-zinc-500 hover:text-[#ff453a] transition"
                      >
                        Remove file
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Option B: Text Editor */}
              {resumeInputMode === 'text' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Resume Text
                    </label>
                    <button
                      onClick={() => setResumeText(SAMPLE_RESUME)}
                      className="text-xs text-[#2997ff] hover:underline flex items-center gap-1"
                    >
                      Load Universal Sample Resume
                    </button>
                  </div>

                  <textarea
                    rows={8}
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste resume content here..."
                    className="w-full bg-zinc-900/80 border border-white/[0.08] rounded-2xl p-4 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#30d158] transition font-mono leading-relaxed"
                  />
                </div>
              )}

              {/* Bottom Trigger Strip */}
              <label className="flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 text-xs text-zinc-400">
                <input
                  type="checkbox"
                  checked={resumeConsent}
                  onChange={async (event) => {
                    const granted = event.target.checked;
                    setResumeConsent(granted);
                    if (currentUser) {
                      const saved = await api.saveResumeConsent(granted);
                      if (saved.error) {
                        setResumeConsent(!granted);
                        showToast(saved.error);
                      }
                    }
                  }}
                  className="mt-0.5 accent-indigo-400"
                />
                <span>
                  I agree to send this resume text to Intervia's AI provider to generate feedback. The extracted text and report will be saved to my account history.
                </span>
              </label>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/[0.06]">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span>Balance: <strong className="text-white">{credits} credits</strong></span>
                  <span>•</span>
                  <span>Cost: <strong className="text-[#30d158]">20 credits</strong></span>
                </div>

                <button
                  onClick={handleAnalyzeResume}
                  disabled={isAnalyzingResume || credits < creditCosts.resumeAnalysis}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#30d158] hover:bg-[#28b84c] disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold text-xs tracking-wide transition-all shadow-xl shadow-[#30d158]/20 flex items-center justify-center gap-2"
                >
                  {isAnalyzingResume ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Parsing & Evaluating Document...
                    </>
                  ) : (
                    'Audit Resume (-20 Credits)'
                  )}
                </button>
              </div>

            </div>

            {/* Analysis Results Display */}
            {resumeResult && (
              <div className="apple-card rounded-3xl p-8 space-y-8 anim-scale-in">
                
                {/* Header Score & Verdict */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#30d158] px-2.5 py-0.5 rounded-full bg-[#30d158]/10 border border-[#30d158]/20">
                      Audit Complete {resumeResult.fileName ? `• ${resumeResult.fileName}` : ''}
                    </span>
                    <h3 className="text-2xl font-bold text-white mt-2">
                      Resume Quality: <span className="text-[#30d158]">{resumeResult.verdict || 'Strong'}</span>
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Coaching signals based on your resume and goals. Scores are guidance, not hiring predictions.
                    </p>
                  </div>

                  <ScoreRing score={resumeResult.overallScore ?? 0} size={120} label="Guidance score" />
                </div>

                {/* 4 Section Scores */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: 'impact', label: 'Quantifiable Impact', data: resumeResult.sections?.impact },
                    { key: 'skills', label: 'Technical Depth', data: resumeResult.sections?.skills },
                    { key: 'experience', label: 'Experience Structure', data: resumeResult.sections?.experience },
                    { key: 'formatting', label: 'Document readability', data: resumeResult.sections?.formatting },
                  ].map((sec) => (
                    <div key={sec.key} className="p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400 font-medium">{sec.label}</span>
                        <span className="font-bold text-white">{sec.data?.score ?? 0}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#2997ff] to-[#30d158] rounded-full"
                          style={{ width: `${sec.data?.score ?? 0}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 pt-1">{sec.data?.feedback}</p>
                    </div>
                  ))}
                </div>

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 rounded-2xl bg-[#30d158]/5 border border-[#30d158]/20 space-y-3">
                    <h4 className="text-xs font-bold text-[#30d158] uppercase tracking-wider flex items-center gap-1.5">
                      <Icon d={icons.check} className="w-4 h-4 text-[#30d158]" /> High Impact Highlights
                    </h4>
                    <ul className="space-y-2 text-xs text-zinc-300">
                      {resumeResult.strengths?.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#30d158] font-bold">✓</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#ffd60a]/5 border border-[#ffd60a]/20 space-y-3">
                    <h4 className="text-xs font-bold text-[#ffd60a] uppercase tracking-wider flex items-center gap-1.5">
                      ▲ Critical Fixes for Recruiter Screenings
                    </h4>
                    <ul className="space-y-2 text-xs text-zinc-300">
                      {resumeResult.improvements?.map((imp, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#ffd60a] font-bold">▲</span> {imp}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Best Role Matches & Keywords */}
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Target Role Alignments & Extracted Keywords
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {resumeResult.suggestedRoles?.map((r, i) => (
                      <span key={i} className="px-3 py-1 rounded-full text-xs bg-[#2997ff]/15 text-[#2997ff] border border-[#2997ff]/30 font-medium">
                        💼 {r}
                      </span>
                    ))}
                    {resumeResult.keywords?.map((k, i) => (
                      <span key={i} className="px-3 py-1 rounded-full text-xs bg-white/[0.06] text-zinc-300 border border-white/[0.08] font-mono">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
           TAB 4: AI VOICE AGENT (5 Credits)
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'agent' && (
          <div className="space-y-8 max-w-3xl mx-auto anim-fade-up">
            
            {/* Siri Animated Orb Experience */}
            <div className="flex flex-col items-center text-center space-y-4 pt-4">
              <div className="siri-orb-container">
                <div className="siri-orb-glow" />
                <div className="siri-orb-core">
                  {isAgentSpeaking ? (
                    <div className="flex items-center gap-1">
                      <span className="audio-bar" style={{ animationDelay: '0s' }} />
                      <span className="audio-bar" style={{ animationDelay: '0.2s' }} />
                      <span className="audio-bar" style={{ animationDelay: '0.4s' }} />
                      <span className="audio-bar" style={{ animationDelay: '0.1s' }} />
                    </div>
                  ) : (
                    <Icon d={icons.sparkle} className="w-8 h-8 text-white" />
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white">Executive Voice Coach</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  {isAgentSpeaking
                    ? (isLiveCoachConnected ? 'Live Coach is speaking…' : 'Coach is speaking out loud...')
                    : isAgentListening
                    ? (isLiveCoachConnected ? 'Live Coach is listening…' : 'Listening to your speech...')
                    : 'Start a real-time voice session, or use the text coach below.'}
                </p>
                {isLiveCoachConnected && (
                  <p className="mt-2 text-[11px] font-medium text-[#af52de]">
                    Live session · {Math.floor(liveCoachSeconds / 60)}:{String(liveCoachSeconds % 60).padStart(2, '0')} remaining
                  </p>
                )}
              </div>

              {isAgentSpeaking && !isLiveCoachConnected && (
                <button
                  onClick={stopSpeaking}
                  className="px-4 py-1.5 rounded-full bg-white/[0.1] hover:bg-white/[0.2] text-xs text-white border border-white/[0.2] transition"
                >
                  Mute Voice
                </button>
              )}
            </div>

            <div className="flex flex-col items-center gap-2">
              {isLiveCoachConnected ? (
                <button
                  type="button"
                  onClick={() => finishLiveCoach()}
                  className="rounded-full border border-[#ff453a]/40 bg-[#ff453a]/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#ff453a]/20"
                >
                  End live session
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startLiveCoach}
                  disabled={isLiveCoachStarting || credits < creditCosts.agentChat}
                  className="rounded-full bg-gradient-to-r from-[#2997ff] to-[#af52de] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#2997ff]/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLiveCoachStarting ? 'Connecting to Live Coach…' : `Start real-time voice · ${creditCosts.agentChat} credits`}
                </button>
              )}
              <p className="text-[10px] text-zinc-500">Natural two-way voice · up to 5 minutes · microphone audio is sent to Google AI</p>
            </div>

            <div className="apple-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-white">Coach language</p>
                <p className="text-[11px] text-zinc-500 mt-1">Voice input and spoken replies follow this choice.</p>
              </div>
              <div className="flex gap-2" role="group" aria-label="Coach language">
                {[
                  ['en', 'English'],
                  ['hi', 'Hindi / Hinglish'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={agentLanguage === value}
                    onClick={() => setAgentLanguage(value)}
                    className={`rounded-full px-4 py-2 text-xs transition ${agentLanguage === value ? 'bg-white text-black font-semibold' : 'bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1]'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={coachResumeConsent}
                disabled={!currentUser}
                onChange={(event) => handleCoachResumeConsent(event.target.checked)}
                className="mt-0.5 accent-indigo-400"
              />
              <span>
                <strong className="text-zinc-200">Personalize with my latest resume insights.</strong>{' '}
                If enabled, Intervia sends the latest analysis summary (scores, strengths, role matches, and improvement ideas) to Google AI with coach messages. The full resume text is not sent by this feature. You can turn this off anytime.
              </span>
            </label>

            {/* Quick Drill Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                'Roast my elevator pitch',
                'Simulate Swiggy system design drill',
                'Ask me: "Why should we hire you?"',
                'Explain CAP theorem with real examples',
                'Salary negotiation strategy tips',
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendAgentMessage(chip)}
                  disabled={isAgentThinking || credits < creditCosts.agentChat}
                  className="px-3.5 py-1.5 rounded-full text-xs bg-zinc-900 border border-white/[0.08] hover:border-[#af52de]/50 text-zinc-300 hover:text-white transition-all disabled:opacity-40"
                >
                  ⚡ {chip}
                </button>
              ))}
            </div>

            {/* Conversation Ledger */}
            <div className="apple-card rounded-3xl p-6 space-y-4 max-h-[420px] overflow-y-auto">
              {agentMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#2997ff] text-white rounded-br-none'
                        : 'bg-zinc-900 border border-white/[0.08] text-zinc-200 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.sender === 'ai' && (
                    <button
                      onClick={() => speakText(msg.text)}
                      className="text-[10px] text-zinc-500 hover:text-[#2997ff] flex items-center gap-1 pl-1 transition"
                    >
                      <Icon d={icons.speaker} className="w-3 h-3" /> Replay voice
                    </button>
                  )}
                </div>
              ))}

              {isAgentThinking && (
                <div className="flex items-center gap-2 text-xs text-zinc-400 p-2">
                  <div className="w-3 h-3 rounded-full bg-[#af52de] animate-ping" />
                  <span>Coach is synthesizing answer...</span>
                </div>
              )}
            </div>

            {/* Voice & Text Input Dock */}
            <div className="apple-glass rounded-full p-2 flex items-center gap-2 border border-white/[0.12] shadow-2xl">
              <button
                onClick={toggleAgentMic}
                disabled={isLiveCoachConnected || isLiveCoachStarting}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isAgentListening
                    ? 'bg-[#ff453a] text-white animate-pulse'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                }`}
                title={isLiveCoachConnected ? 'Live session is listening continuously' : 'Speak to Coach'}
              >
                <Icon d={icons.mic} className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={agentInput}
                onChange={(e) => setAgentInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendAgentMessage()}
                placeholder="Ask your coach anything or speak directly..."
                className="flex-1 bg-transparent px-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none"
              />

              <button
                onClick={() => handleSendAgentMessage()}
                disabled={isAgentThinking || !agentInput.trim() || credits < creditCosts.agentChat}
                className="px-5 py-2.5 rounded-full bg-white hover:bg-zinc-200 disabled:opacity-40 text-black font-semibold text-xs tracking-wide transition-all shadow-md"
              >
                Send (5 Cr)
              </button>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
           TAB 5: CREDITS STORE & PRICING
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'store' && (
          <div className="space-y-12 max-w-5xl mx-auto anim-fade-up">
            
            <div className="text-center space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2997ff] px-3 py-1 rounded-full bg-[#2997ff]/10 border border-[#2997ff]/20">
                Transparent Credits Pricing
              </span>
              <h2 className="text-4xl font-bold tracking-tight text-white">Purchase Credits</h2>
              <p className="text-xs text-zinc-400 max-w-lg mx-auto leading-relaxed">
                Sign in to keep interview sessions, resume reviews, and coaching history together.
                {usdInrQuote?.rate
                  ? ` INR checkout uses the ${usdInrQuote.stale ? 'last available' : 'latest'} USD/INR rate (${usdInrQuote.rate.toFixed(2)}${usdInrQuote.date ? ` · ${usdInrQuote.date}` : ''}). The rate is locked when your order is created.`
                  : ' INR pricing will appear once the exchange rate is available.'}
              </p>

            </div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {activePlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`apple-card rounded-3xl p-6 flex flex-col justify-between transition-all relative ${
                    plan.popular
                      ? 'border-[#2997ff]/50 shadow-2xl shadow-[#2997ff]/10 ring-1 ring-[#2997ff]/40'
                      : ''
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full bg-[#2997ff] text-white shadow-lg">
                      Most Popular
                    </span>
                  )}

                  <div>
                    <h3 className="text-base font-bold text-white">{plan.name}</h3>
                    
                    <div className="mt-4 flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold text-white">${plan.price}</span>
                      <span className="text-xs text-zinc-500 font-medium">USD</span>
                    </div>

                    <div className="mt-2 text-xs font-semibold text-[#2997ff]">
                      {plan.credits} Credits
                    </div>

                    {usdInrQuote?.rate && (
                      <p className="mt-1 text-xs text-zinc-400">
                        ≈ ₹{(plan.price * usdInrQuote.rate).toLocaleString('en-IN', { maximumFractionDigits: 2 })} INR
                      </p>
                    )}

                    <p className="text-[11px] text-zinc-500 mt-1">
                      ≈ ${(plan.price / plan.credits).toFixed(3)} per credit
                    </p>

                    <ul className="mt-6 space-y-2.5 text-xs text-zinc-300">
                      {plan.features?.map((f, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Icon d={icons.check} className="w-3.5 h-3.5 text-[#30d158] shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handlePurchase(plan)}
                    disabled={isProcessingPayment}
                    className={`mt-8 w-full py-3 rounded-full text-xs font-semibold transition-all shadow-md ${
                      plan.popular
                        ? 'bg-white hover:bg-zinc-200 text-black font-bold'
                        : 'bg-zinc-900 border border-white/[0.1] hover:bg-zinc-800 text-white'
                    }`}
                  >
                    {isProcessingPayment ? 'Processing...' : `Get ${plan.credits} Credits`}
                  </button>
                </div>
              ))}
            </div>

            {/* Deduction Table */}
            <div className="apple-card rounded-3xl p-7 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Credit Deduction Transparency
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.06]">
                  <p className="text-white font-bold text-sm">10 Credits</p>
                  <p className="text-zinc-400 mt-1">Complete 5-Question AI Mock Interview with live voice grading & model answers.</p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.06]">
                  <p className="text-white font-bold text-sm">20 Credits</p>
                  <p className="text-zinc-400 mt-1">Resume feedback from uploaded PDF/DOCX or pasted text with clear next steps.</p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.06]">
                  <p className="text-white font-bold text-sm">5 Credits</p>
                  <p className="text-zinc-400 mt-1">Interactive Voice Coach query with real-time speech synthesis talking.</p>
                </div>
              </div>
            </div>

            {/* Transactions Ledger */}
            {transactions.length > 0 && (
              <div className="apple-card rounded-3xl p-6 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Recent Purchases & Ledger
                </h4>
                <div className="space-y-2">
                  {transactions.slice(0, 5).map((t, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-zinc-900/40 border border-white/[0.04] flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-white">{t.planName}</span>
                        <span className="text-zinc-500 ml-2">({t.credits} credits)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-400 font-mono text-[11px]">{new Date(t.timestamp).toLocaleDateString()}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#30d158]/15 text-[#30d158]">
                          {t.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* ── Apple-Grade Footer with Developer Logo Attribution ───────────── */}
      <footer className="border-t border-white/[0.08] py-10 px-6 mt-16 bg-black">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Developer Logo & Attribution Badge */}
          <div className="flex items-center gap-4">
            {/* Developer Monogram Crest */}
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1c1c24] to-[#0a0a0f] border border-white/[0.15] flex items-center justify-center shadow-lg shadow-black/80 group">
              <span className="font-extrabold text-sm tracking-wider bg-gradient-to-tr from-[#2997ff] via-[#af52de] to-[#ff2d55] bg-clip-text text-transparent">
                YG
              </span>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-tight">
                  Made by developer YASH GUPTA
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#30d158]" />
              </div>
              <p className="text-[11px] text-zinc-500">
                Architected with React, Node.js & Multi-Pillar Voice Intelligence
              </p>
            </div>
          </div>

          {/* Credits & Platform Status */}
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span>© 2026 Intervia. All rights reserved.</span>
            <span>•</span>
            <span className="text-zinc-300 font-semibold">{credits} Credits Available</span>
          </div>

        </div>
      </footer>

    </div>
  );
}
