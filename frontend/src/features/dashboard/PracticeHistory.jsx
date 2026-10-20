export default function PracticeHistory({ interviews = [], resumes = [] }) {
  return (
    <section aria-labelledby="practice-history-title" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-indigo-300">Your progress</p>
          <h2 id="practice-history-title" className="mt-1 text-2xl font-semibold text-white">Recent practice</h2>
        </div>
        <span className="text-xs text-zinc-500">Saved to your account</span>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="apple-card rounded-3xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white">Interview sessions</h3>
          {interviews.length ? interviews.slice(0, 4).map((session) => (
            <div key={session.id} className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.035] px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-zinc-100">{session.role}</p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  {session.mode} · {session.answeredCount} answers · {new Date(session.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-indigo-300/15 bg-indigo-300/10 px-2.5 py-1 text-[11px] text-indigo-200">
                {session.averageScore == null ? 'In progress' : session.averageScore + '/100'}
              </span>
            </div>
          )) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-5 text-xs text-zinc-500">
              Your practice sessions will appear here.
            </div>
          )}
        </div>
        <div className="apple-card rounded-3xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white">Resume reviews</h3>
          {resumes.length ? resumes.slice(0, 4).map((resume) => (
            <div key={resume.id} className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.035] px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-zinc-100">{resume.fileName}</p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  {resume.role || 'General review'} · {new Date(resume.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-2.5 py-1 text-[11px] text-emerald-200">
                {resume.overallScore == null ? 'Reviewed' : resume.overallScore + '/100'}
              </span>
            </div>
          )) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-5 text-xs text-zinc-500">
              Your resume reports will appear here after review.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
