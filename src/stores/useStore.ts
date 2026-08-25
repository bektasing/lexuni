import { create } from 'zustand';

interface PracticeSessionState {
  answered: number;
  correct: number;
  wrong: number;
  incrementCorrect: () => void;
  incrementWrong: () => void;
  resetSession: () => void;
}

export const usePracticeStore = create<PracticeSessionState>((set) => ({
  answered: 0,
  correct: 0,
  wrong: 0,
  incrementCorrect: () => set((state) => ({ answered: state.answered + 1, correct: state.correct + 1 })),
  incrementWrong: () => set((state) => ({ answered: state.answered + 1, wrong: state.wrong + 1 })),
  resetSession: () => set({ answered: 0, correct: 0, wrong: 0 })
}));
