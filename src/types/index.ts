export type WordGroup = {
  id: string;
  name: string;
  createdAt: string;
};

export type Word = {
  id: string;
  groupId: string;
  english: string;
  turkish: string;
  createdAt: string;
  correctCount: number;
  wrongCount: number;
};

export type StudySession = {
  id: string;
  status: "active" | "finished";
  sourceType: "all" | "group";
  groupId?: string;
  groupName?: string;
  startedAt: string;
  finishedAt?: string;
  totalAnswered: number;
  correctCount: number;
  wrongCount: number;
  activeDurationSeconds: number;
  lastActiveAt?: string;
  
  questionQueue: string[];
  reinforcementQueue: string[];
  
  currentWordId?: string;
  currentDirection?: "en-tr" | "tr-en";
  currentOptions?: string[];
  selectedOptionId?: string;
  
  lastWordId?: string;
};

export type SessionAnswer = {
  id: string;
  sessionId: string;
  wordId?: string;
  english: string;
  turkish: string;
  correct: boolean;
};
