'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { 
  Award, 
  ArrowLeft, 
  Check, 
  X, 
  AlertTriangle,
  Lock,
  Sparkles,
  Info
} from 'lucide-react';

interface AttemptResult {
  attempt: {
    id: string;
    quizId: string;
    quizTitle: string;
    status: string;
    score: number | null;
    totalQuestions: number;
    correctAnswers: number;
    startedAt: string;
    submittedAt: string | null;
    safeModeViolations: number;
    showResultImmediately: boolean;
  };
  questions?: Array<{
    id: string;
    questionText: string;
    questionType: 'single' | 'multiple';
    points: number;
    explanation: string | null;
    images: Array<{ id: string; publicUrl: string; altText: string }>;
    options: Array<{
      id: string;
      optionText: string;
      isCorrect: boolean;
    }>;
    userResponse: {
      selectedOptionIds: string[];
      isCorrect: boolean;
      pointsEarned: number;
      answeredAt: string | null;
    };
  }>;
  message?: string;
}

export default function QuizResultPage({ params }: { params: { attemptId: string } }) {
  const attemptId = params.attemptId;
  const router = useRouter();
  const tc = useTranslations('Common');

  const [result, setResult] = useState<AttemptResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadResult() {
      try {
        const res = await apiClient(`/api/user/attempts/${attemptId}/result`);
        setResult(res?.data || res);
      } catch (err: any) {
        setError(err?.message || 'Failed to retrieve attempt result details.');
      } finally {
        setIsLoading(false);
      }
    }
    loadResult();
  }, [attemptId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
          <span className="text-sm font-medium">{tc('loading')} results...</span>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
        <div className="max-w-md w-full rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-center text-rose-400">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10" />
          <h3 className="font-bold text-lg">Error loading result</h3>
          <p className="mt-1 text-sm text-rose-500/80">{error}</p>
        </div>
      </div>
    );
  }

  const { attempt, questions, message } = result;
  // Let's assume standard passing score is 70
  const passScore = 70;
  const isPassed = attempt.score !== null && attempt.score >= passScore;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12">
      {/* Background glowing decorations */}
      <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-emerald-600/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-teal-600/5 blur-[150px] pointer-events-none" />

      <div className="max-w-3xl mx-auto space-y-8 relative">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>

        {/* Score Card Banner */}
        <div className={`rounded-3xl border p-8 shadow-xl text-center space-y-6 ${
          isPassed 
            ? 'border-emerald-500/20 bg-gradient-to-r from-emerald-950/20 via-slate-900/40 to-slate-900/20' 
            : 'border-rose-500/20 bg-gradient-to-r from-rose-950/10 via-slate-900/40 to-slate-900/20'
        }`}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-emerald-400">
            <Award className={`h-9 w-9 ${isPassed ? 'text-emerald-400' : 'text-rose-400'}`} />
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Attempt Completed</span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">{attempt.quizTitle}</h1>
          </div>

          <div className="flex justify-center items-baseline gap-1">
            <span className={`text-5xl font-black ${isPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
              {attempt.score !== null ? `${attempt.score}%` : '-'}
            </span>
          </div>

          <p className={`text-sm font-semibold uppercase tracking-widest ${isPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPassed ? 'Passed' : 'Failed'}
          </p>

          {/* Stats details */}
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto border-t border-slate-800/80 pt-6 text-xs text-slate-400">
            <div>
              <span className="text-slate-500">Correct Answers:</span>
              <p className="font-bold text-white mt-1">{attempt.correctAnswers} / {attempt.totalQuestions}</p>
            </div>
            <div>
              <span className="text-slate-500">Proctor Violations:</span>
              <p className={`font-bold mt-1 ${attempt.safeModeViolations > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                {attempt.safeModeViolations}
              </p>
            </div>
          </div>
        </div>

        {/* Results review list */}
        {attempt.showResultImmediately && questions && questions.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white border-b border-slate-900 pb-3 flex items-center gap-2">
              <Info className="h-5 w-5 text-emerald-400" />
              <span>Questions Breakdown</span>
            </h2>

            <div className="space-y-6">
              {questions.map((q, idx) => {
                const ans = q.userResponse;
                const isCorrect = ans.isCorrect;
                return (
                  <div key={q.id} className="rounded-2xl border border-slate-900 bg-slate-900/10 p-6 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-2">
                        <span className="text-slate-500 font-bold">{idx + 1}.</span>
                        <span className="text-sm text-slate-200">{q.questionText}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {isCorrect ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        <span>{q.points} pts</span>
                      </span>
                    </div>

                    {/* Question Images */}
                    {q.images && q.images.length > 0 && (
                      <div className="grid gap-4 max-w-md pl-5">
                        {q.images.map((img) => (
                          <img key={img.id} src={img.publicUrl} alt={img.altText} className="rounded-xl border border-slate-900/60 max-h-48 object-contain bg-slate-950/40 p-1" />
                        ))}
                      </div>
                    )}

                    {/* Options list */}
                    <div className="space-y-2 pl-5 text-xs">
                      {q.options.map((opt) => {
                        const isSelected = ans.selectedOptionIds.includes(opt.id);
                        return (
                          <div 
                            key={opt.id}
                            className={`flex items-center gap-2.5 rounded-lg p-2.5 border ${
                              isSelected && opt.isCorrect ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
                              isSelected && !opt.isCorrect ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' :
                              !isSelected && opt.isCorrect ? 'bg-slate-900/80 border-slate-800 text-emerald-400 font-semibold' :
                              'border-transparent text-slate-400'
                            }`}
                          >
                            {opt.isCorrect ? (
                              <span className="h-4 w-4 shrink-0 flex items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 text-[10px]">✔</span>
                            ) : (
                              <span className="h-4 w-4 shrink-0 rounded-full border border-slate-700" />
                            )}
                            <span>{opt.optionText}</span>
                            {isSelected && <span className="text-[10px] uppercase font-bold tracking-wider ml-auto shrink-0 text-slate-500">(Your Answer)</span>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-4 text-xs">
                        <div className="flex items-center gap-1.5 text-blue-400 font-bold mb-1">
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Explanation</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 text-center text-slate-400 space-y-3">
            <Lock className="mx-auto h-8 w-8 text-slate-500" />
            <h3 className="font-bold text-white text-sm">Detailed Answers Masked</h3>
            <p className="text-xs max-w-sm mx-auto leading-relaxed">
              {message || 'The exam administrator has configured this quiz to hide correct answers and explanations after submission.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
