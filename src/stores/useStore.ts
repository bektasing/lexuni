import { create } from 'zustand';

interface PracticeSessionState {
  sessionId: string | null;
  answered: number;
  correct: number;
  wrong: number;
  initSession: (sessionId: string) => void;
  incrementCorrect: () => void;
  incrementWrong: () => void;
  resetSession: () => void;
}

export const usePracticeStore = create<PracticeSessionState>((set) => ({
  sessionId: null,
  answered: 0,
  correct: 0,
  wrong: 0,
  initSession: (sessionId: string) => set({ sessionId, answered: 0, correct: 0, wrong: 0 }),
  incrementCorrect: () => set((state) => ({ answered: state.answered + 1, correct: state.correct + 1 })),
  incrementWrong: () => set((state) => ({ answered: state.answered + 1, wrong: state.wrong + 1 })),
  resetSession: () => set({ sessionId: null, answered: 0, correct: 0, wrong: 0 })
}));
