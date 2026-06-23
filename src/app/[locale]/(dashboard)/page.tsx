'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/authStore';
import { useRouter, Link } from '@/navigation';
import { useTranslations } from 'next-intl';
import { 
  GraduationCap, 
  Play, 
  Calendar, 
  Award, 
  Clock, 
  ShieldAlert, 
  HelpCircle,
  X,
  FileCheck,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { format } from 'date-fns';

interface QuizItem {
  id: string;
  title: string;
  description: string;
  slug: string;
  duration_minutes: number;
  max_attempts: number;
  pass_score: number;
  safe_mode: boolean;
  attempts_taken: number;
  active_attempt_id: string | null;
}

interface AttemptItem {
  id: string;
  quizTitle: string;
  status: 'in_progress' | 'submitted' | 'force_submitted' | 'expired';
  score: number | null;
  startedAt: string;
  submittedAt: string | null;
  safeModeViolations: number;
}

export default function CandidateDashboardPage() {
  const router = useRouter();
  const t = useTranslations('Dashboard');
  const tq = useTranslations('Quiz');
  const tc = useTranslations('Common');

  const { profile } = useAuthStore();
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [attempts, setAttempts] = useState<AttemptItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Start Quiz Modal states
  const [selectedQuiz, setSelectedQuiz] = useState<QuizItem | null>(null);
  const [isStartLoading, setIsStartLoading] = useState(false);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [quizRes, attemptRes] = await Promise.all([
        apiClient('/api/user/quizzes'),
        apiClient('/api/user/attempts'),
      ]);
      setQuizzes(quizRes?.data || []);
      setAttempts(attemptRes?.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch candidate dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleStartAttempt = async () => {
    if (!selectedQuiz) return;
    setIsStartLoading(true);
    try {
      const data = await apiClient(`/api/user/quizzes/${selectedQuiz.slug}/start`, {
        method: 'POST',
      });
      setSelectedQuiz(null);
      router.push(`/quizzes/${data.attemptId}/session`);
    } catch (err: any) {
      alert(err?.message || 'Failed to start quiz attempt');
    } finally {
      setIsStartLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
          <span className="text-slate-400 text-sm">{tc('loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Welcome Hero Banner */}
      <div className="rounded-3xl border border-emerald-900/30 bg-gradient-to-r from-emerald-950/40 via-slate-900/40 to-slate-900/20 p-8 shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {t('welcome', { name: profile?.fullName })}
            </h1>
            <p className="text-slate-400 text-sm">{t('subheading')}</p>
          </div>
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
            <GraduationCap className="h-9 w-9" />
          </div>
        </div>
      </div>

      {/* Quizzes List section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Play className="h-5 w-5 text-emerald-400" />
          <span>Active Examination Board</span>
        </h2>

        {quizzes.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => {
              const attemptsLeft = quiz.max_attempts - quiz.attempts_taken;
              const isExhausted = attemptsLeft <= 0;
              const hasActiveSession = !!quiz.active_attempt_id;

              return (
                <div 
                  key={quiz.id} 
                  className="group flex flex-col justify-between rounded-2xl border border-slate-900 bg-slate-900/30 p-6 backdrop-blur-xl transition hover:border-slate-800"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-white group-hover:text-emerald-400 transition line-clamp-1">{quiz.title}</h3>
                      {quiz.safe_mode && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400" title="Proctored exam">
                          <Lock className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 h-8">{quiz.description || 'No instructions provided.'}</p>
                    
                    {/* Meta stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-900 pt-3">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{quiz.duration_minutes} mins</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Award className="h-3.5 w-3.5" />
                        <span>Pass: {quiz.pass_score}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-slate-900 pt-4 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      {isExhausted ? 'Exhausted' : `${attemptsLeft} of ${quiz.max_attempts} attempts left`}
                    </span>

                    {hasActiveSession ? (
                      <Link
                        href={`/quizzes/${quiz.active_attempt_id}/session`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-amber-600/15 hover:brightness-110 active:scale-[0.98] transition"
                      >
                        {tq('resumeQuiz')}
                      </Link>
                    ) : isExhausted ? (
                      <button
                        disabled
                        className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2 text-xs font-semibold text-slate-600 cursor-not-allowed"
                      >
                        Exhausted
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedQuiz(quiz)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/15 hover:brightness-110 active:scale-[0.98] transition"
                      >
                        {tq('startQuiz')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500">
            <HelpCircle className="mx-auto mb-3 h-10 w-10 opacity-35" />
            <p className="text-sm">{t('noQuizzes')}</p>
          </div>
        )}
      </div>

      {/* Attempts History Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="h-5 w-5 text-emerald-400" />
          <span>{t('history')}</span>
        </h2>

        {attempts.length > 0 ? (
          <div className="rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-950/20">
                    <th className="py-4 px-6">Quiz Title</th>
                    <th className="py-4 px-6">{t('status')}</th>
                    <th className="py-4 px-6 text-center">Violations</th>
                    <th className="py-4 px-6 text-right">{t('score')}</th>
                    <th className="py-4 px-6 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {attempts.map((att) => {
                    const isClosed = att.status === 'submitted' || att.status === 'force_submitted' || att.status === 'expired';
                    return (
                      <tr key={att.id} className="hover:bg-slate-900/20 transition">
                        <td className="py-4 px-6">
                          {isClosed ? (
                            <Link href={`/quizzes/${att.id}/result`} className="font-semibold text-white hover:text-emerald-400 transition">
                              {att.quizTitle}
                            </Link>
                          ) : (
                            <Link href={`/quizzes/${att.id}/session`} className="font-semibold text-amber-400 hover:underline">
                              {att.quizTitle}
                            </Link>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            att.status === 'submitted' ? 'bg-emerald-500/10 text-emerald-400' :
                            att.status === 'force_submitted' ? 'bg-cyan-500/10 text-cyan-400' :
                            att.status === 'expired' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-blue-500/10 text-blue-400'
                          }`}>
                            {att.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`text-xs ${att.safeModeViolations > 0 ? 'text-rose-400 font-semibold' : 'text-slate-500'}`}>
                            {att.safeModeViolations}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-white">
                          {att.score !== null ? `${att.score}%` : '-'}
                        </td>
                        <td className="py-4 px-6 text-right text-xs text-slate-500">
                          {format(new Date(att.startedAt), 'dd MMM yyyy HH:mm')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-500">
            <FileCheck className="mx-auto mb-3 h-8 w-8 opacity-35" />
            <p className="text-xs">No previous quiz attempts found.</p>
          </div>
        )}
      </div>

      {/* Start Quiz Instructions Rules Modal */}
      {selectedQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span>{tq('warningTitle')}</span>
              </h2>
              <button
                onClick={() => setSelectedQuiz(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <p className="font-bold text-white">{selectedQuiz.title}</p>
              <div className="whitespace-pre-line rounded-2xl bg-slate-950 p-5 border border-slate-800/40 text-xs text-slate-400 leading-relaxed">
                {tq('rules')}
              </div>
              <p className="text-xs text-amber-500/80 font-semibold">{tq('confirmStart')}</p>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setSelectedQuiz(null)}
                className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition"
              >
                {tc('cancel')}
              </button>
              <button
                onClick={handleStartAttempt}
                disabled={isStartLoading}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-emerald-500 disabled:opacity-50 transition"
              >
                {isStartLoading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />}
                <span>Confirm Start</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
