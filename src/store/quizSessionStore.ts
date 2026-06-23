import { create } from 'zustand';

interface Question {
  id: string;
  questionText: string;
  questionType: 'single' | 'multiple';
  options: {
    id: string;
    optionText: string;
  }[];
}

interface QuizSessionState {
  attemptId: string | null;
  quizId: string | null;
  questions: Question[];
  answers: Record<string, string[]>; // questionId -> optionIds
  expiresAt: string | null; // ISO string
  violationCount: number;
  isActive: boolean;
  
  startSession: (
    attemptId: string,
    quizId: string,
    questions: Question[],
    expiresAt: string
  ) => void;
  updateAnswer: (questionId: string, optionIds: string[]) => void;
  incrementViolation: () => void;
  clearSession: () => void;
}

export const useQuizSessionStore = create<QuizSessionState>((set) => ({
  attemptId: null,
  quizId: null,
  questions: [],
  answers: {},
  expiresAt: null,
  violationCount: 0,
  isActive: false,

  startSession: (attemptId, quizId, questions, expiresAt) =>
    set({
      attemptId,
      quizId,
      questions,
      expiresAt,
      answers: {},
      violationCount: 0,
      isActive: true,
    }),

  updateAnswer: (questionId, optionIds) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: optionIds,
      },
    })),

  incrementViolation: () =>
    set((state) => ({
      violationCount: state.violationCount + 1,
    })),

  clearSession: () =>
    set({
      attemptId: null,
      quizId: null,
      questions: [],
      answers: {},
      expiresAt: null,
      violationCount: 0,
      isActive: false,
    }),
}));
