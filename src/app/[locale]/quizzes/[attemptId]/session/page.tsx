'use client';

import { useEffect, useState, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  AlertTriangle, 
  Check, 
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  Info,
  X
} from 'lucide-react';
import { differenceInSeconds } from 'date-fns';

interface Question {
  id: string;
  questionText: string;
  questionType: 'single' | 'multiple';
  points: number;
  images: Array<{ id: string; publicUrl: string; altText: string }>;
  options: Array<{ id: string; optionText: string }>;
}

interface AttemptSession {
  attempt: {
    id: string;
    quizId: string;
    quizTitle: string;
    status: string;
    expiresAt: string;
    startedAt: string;
    safeMode: boolean;
    safeModeViolations: number;
  };
  questions: Question[];
  answers: Record<string, string[]>;
}

export default function QuizSessionPage({ params }: { params: { attemptId: string } }) {
  const attemptId = params.attemptId;
  const router = useRouter();
  const t = useTranslations('Session');
  const tc = useTranslations('Common');

  const [session, setSession] = useState<AttemptSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0); // in seconds
  
  // Proctoring State
  const [violationsCount, setViolationsCount] = useState(0);
  const [showProctorWarning, setShowProctorWarning] = useState(false);

  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAutoSubmitting = useRef(false);

  // Load Session Data
  useEffect(() => {
    async function loadSession() {
      try {
        const res = await apiClient(`/api/user/attempts/${attemptId}`);
        const data = res?.data;
        
        // If attempt is not in progress, redirect to result
        if (data?.status && data.status !== 'in_progress') {
          router.replace(`/quizzes/${attemptId}/result`);
          return;
        }

        setSession(data);
        setSelectedAnswers(data?.answers || {});
        setViolationsCount(data?.attempt?.safeModeViolations || 0);

        // Compute initial countdown time remaining
        const diff = differenceInSeconds(new Date(data?.attempt?.expiresAt), new Date());
        setTimeLeft(diff > 0 ? diff : 0);
      } catch (err: any) {
        setError(err?.message || 'Failed to initialize exam session.');
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, [attemptId, router]);

  // Countdown timer effect
  useEffect(() => {
    if (!session || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session, timeLeft]);

  // Auto-submit triggers when timer runs out
  const handleAutoSubmit = async () => {
    if (isAutoSubmitting.current) return;
    isAutoSubmitting.current = true;
    setIsSubmitting(true);
    try {
      await apiClient(`/api/user/attempts/${attemptId}/submit`, {
        method: 'POST',
      });
      router.replace(`/quizzes/${attemptId}/result`);
    } catch (err) {
      alert('Time expired. Auto-submitting session.');
      router.replace(`/quizzes/${attemptId}/result`);
    }
  };

  // Proctor tab switches guard
  useEffect(() => {
    if (!session?.attempt.safeMode) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // Tab switched / minimized
        try {
          const violationRes = await apiClient(`/api/user/attempts/${attemptId}/violation`, {
            method: 'POST',
            body: JSON.stringify({ violation_type: 'tab_switch' }),
          });
          const newCount = violationRes?.data?.violationCount;
          if (newCount !== undefined) {
            setViolationsCount(newCount);
          } else {
            setViolationsCount(prev => prev + 1);
          }
          setShowProctorWarning(true);
        } catch (err) {
          console.error('Failed to log violation:', err);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session, attemptId]);

  // Answer selection handler
  const handleSelectOption = async (questionId: string, optionId: string, type: 'single' | 'multiple') => {
    let newSelections: string[] = [];

    if (type === 'single') {
      newSelections = [optionId];
    } else {
      const currentSelections = selectedAnswers[questionId] || [];
      if (currentSelections.includes(optionId)) {
        newSelections = currentSelections.filter(id => id !== optionId);
      } else {
        newSelections = [...currentSelections, optionId];
      }
    }

    // Update local state immediately
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: newSelections,
    }));

    // Post selection to Redis drafting API
    try {
      await apiClient(`/api/user/attempts/${attemptId}/answer`, {
        method: 'POST',
        body: JSON.stringify({
          question_id: questionId,
          selected_option_ids: newSelections,
        }),
      });
    } catch (err) {
      console.error('Drafting answer to Redis failed:', err);
    }
  };

  // Manual Submission handler
  const handleManualSubmit = async () => {
    setIsSubmitting(true);
    try {
      await apiClient(`/api/user/attempts/${attemptId}/submit`, {
        method: 'POST',
      });
      router.replace(`/quizzes/${attemptId}/result`);
    } catch (err: any) {
      alert(err?.message || 'Failed to submit quiz attempt.');
    } finally {
      setIsSubmitting(false);
      setShowSubmitConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
          <span className="text-sm font-medium">{tc('loading')} session...</span>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
        <div className="max-w-md w-full rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-center text-rose-400">
          <AlertCircle className="mx-auto mb-3 h-10 w-10" />
          <h3 className="font-bold text-lg">Failed to initialize session</h3>
          <p className="mt-1 text-sm text-rose-500/80">{error}</p>
        </div>
      </div>
    );
  }

  const currentQuestion = session.questions[currentQuestionIndex];
  const totalQuestions = session.questions.length;
  
  // Format Remaining Time
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Unanswered count
  const unansweredCount = session.questions.filter(q => !selectedAnswers[q.id] || selectedAnswers[q.id].length === 0).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Proctor warnings overlay */}
      {showProctorWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-[90%] max-w-md rounded-2xl border border-rose-500/30 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6 text-center max-h-[90vh] overflow-y-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Proctor Violation Warning</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                A tab switch or window loss was detected. This action is registered and logged by proctoring modules.
              </p>
            </div>
            <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800 text-xs">
              <span className="text-slate-500">Total Violations Registered: </span>
              <span className="font-bold text-rose-400">{violationsCount}</span>
            </div>
            <button
              onClick={() => setShowProctorWarning(false)}
              className="w-full rounded-xl bg-rose-600 py-3 text-sm font-semibold text-white transition hover:bg-rose-500"
            >
              Understand & Resume
            </button>
          </div>
        </div>
      )}

      {/* Top Banner (Timer & Title) */}
      <header className="sticky top-0 z-40 border-b border-slate-900 bg-slate-950/80 px-6 py-4 flex items-center justify-between backdrop-blur-md">
        <div>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Exam session active</span>
          <h1 className="text-sm md:text-base font-bold text-white max-w-[200px] sm:max-w-md truncate">{session.attempt.quizTitle}</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold ${
            timeLeft < 60 ? 'border-rose-500/30 bg-rose-500/10 text-rose-400 animate-pulse' : 'border-slate-800 bg-slate-900/60 text-slate-300'
          }`}>
            <Clock className="h-4 w-4 shrink-0" />
            <span>{timeFormatted}</span>
          </div>

          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-emerald-500 transition"
          >
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Finish Exam</span>
          </button>
        </div>
      </header>

      {/* Main split dashboard pane */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 grid gap-8 md:grid-cols-4">
        {/* Left side Question panel */}
        <div className="md:col-span-3 space-y-6">
          {/* Question title banner */}
          <div className="space-y-4">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              {t('questionOf', { current: currentQuestionIndex + 1, total: totalQuestions })}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white leading-relaxed">{currentQuestion.questionText}</h2>
          </div>

          {/* Question Images */}
          {currentQuestion.images && currentQuestion.images.length > 0 && (
            <div className="grid gap-4 max-w-xl">
              {currentQuestion.images.map((img) => (
                <div key={img.id} className="rounded-2xl overflow-hidden border border-slate-900 bg-slate-900/40 p-2">
                  <img src={img.publicUrl} alt={img.altText} className="w-full max-h-72 object-contain rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* Answer Options Grid */}
          <div className="space-y-3">
            {currentQuestion.options.map((opt) => {
              const isSelected = (selectedAnswers[currentQuestion.id] || []).includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(currentQuestion.id, opt.id, currentQuestion.questionType)}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                    isSelected 
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                      : 'border-slate-900 bg-slate-900/30 hover:border-slate-800 text-slate-300'
                  }`}
                >
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                    isSelected ? 'border-emerald-400 bg-emerald-400 text-slate-950' : 'border-slate-700 text-slate-500'
                  }`}>
                    {isSelected && '✔'}
                  </span>
                  <span>{opt.optionText}</span>
                </button>
              );
            })}
          </div>

          {/* Prev / Next controls */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-900">
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>{tc('prev')}</span>
            </button>
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
              disabled={currentQuestionIndex === totalQuestions - 1}
              className="flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <span>{tc('next')}</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Right side navigation matrix panel */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-6 h-fit">
          <h3 className="font-bold text-white text-sm">Question Map</h3>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-4 gap-2">
            {session.questions.map((q, idx) => {
              const hasAnswers = selectedAnswers[q.id] && selectedAnswers[q.id].length > 0;
              const isCurrent = idx === currentQuestionIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`flex h-9 items-center justify-center rounded-xl font-bold text-xs border transition ${
                    isCurrent ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-md shadow-emerald-500/10' :
                    hasAnswers ? 'border-slate-800 bg-slate-900/80 text-emerald-400' :
                    'border-slate-900 bg-slate-950 text-slate-500 hover:border-slate-800'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-900 pt-4 space-y-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500/10 border border-slate-800" />
              <span>{t('answered')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-slate-950 border border-slate-900" />
              <span>{t('unanswered')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-[95%] max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white">{t('confirmSubmitTitle')}</h2>
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <p className="text-slate-400 leading-relaxed">{t('confirmSubmitDesc')}</p>
              
              {unansweredCount > 0 && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-400">
                  <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                  <span>{t('warningUnanswered', { count: unansweredCount })}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition"
              >
                {tc('cancel')}
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-emerald-500 disabled:opacity-50 transition"
              >
                {isSubmitting && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />}
                <span>{tc('submit')} Exam</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
