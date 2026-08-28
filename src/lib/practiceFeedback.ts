export type PracticeFeedbackTone = 'success' | 'danger' | 'accent';

export type PracticeFeedback = {
  message: string;
  tone: PracticeFeedbackTone;
};

type FeedbackContext = {
  correct: boolean;
  english: string;
  wrongCountForWord: number;
  correctStreak: number;
  sessionCorrect: number;
  sessionAnswered: number;
  previousMessage?: string;
};

const CORRECT_MESSAGES = ['Correct', 'Nice', 'Got it', 'Exactly', 'Clean', 'Good one'];
const WRONG_MESSAGES = ['Not quite', 'Almost', 'Close one', 'Try again', 'Keep going', 'Nearly', 'Gotcha'];
const RARE_WRONG_MESSAGES = [
  'Plot twist.',
  'That one got you.',
  'Brain.exe is thinking…',
  'Vocabulary 1 — You 0.'
];
const DEVELOPER_WORDS = new Set(['bug', 'developer', 'deploy', 'commit', 'code', 'terminal', 'server']);
const DEVELOPER_MESSAGES = ['Works on my machine.', 'No rollback needed.', 'Nice try, developer.'];

function pickDifferent(messages: string[], previousMessage?: string) {
  const candidates = messages.filter(message => message !== previousMessage);
  const pool = candidates.length > 0 ? candidates : messages;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function choosePracticeFeedback(context: FeedbackContext): PracticeFeedback {
  if (!context.correct) {
    if (context.wrongCountForWord >= 3) {
      return { message: 'We meet again.', tone: 'danger' };
    }

    if (DEVELOPER_WORDS.has(context.english.trim().toLowerCase()) && Math.random() < 0.04) {
      return { message: pickDifferent(DEVELOPER_MESSAGES, context.previousMessage), tone: 'danger' };
    }

    if (Math.random() < 0.01) {
      return { message: pickDifferent(RARE_WRONG_MESSAGES, context.previousMessage), tone: 'danger' };
    }

    return { message: pickDifferent(WRONG_MESSAGES, context.previousMessage), tone: 'danger' };
  }

  if (context.sessionAnswered === 100) {
    return { message: 'Vocabulary speedrun.', tone: 'accent' };
  }

  if (context.sessionCorrect === 50) {
    return { message: 'Someone studied.', tone: 'accent' };
  }

  if (context.correctStreak === 20) {
    return { message: 'Locked in.', tone: 'accent' };
  }

  if (context.correctStreak === 10) {
    return { message: "Okay, you're cooking.", tone: 'accent' };
  }

  return { message: pickDifferent(CORRECT_MESSAGES, context.previousMessage), tone: 'success' };
}
