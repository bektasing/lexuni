import { useCallback, useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Check, Play, X } from 'lucide-react';
import { db } from '../db/db';
import type { StudySession, Word } from '../types';
import { choosePracticeFeedback, type PracticeFeedback } from '../lib/practiceFeedback';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

function sessionStartsWithEnglish(sessionId: string) {
  return Array.from(sessionId).reduce((sum, character) => sum + character.charCodeAt(0), 0) % 2 === 0;
}

function getDirection(session: StudySession) {
  const shouldUseEnglish = session.totalAnswered % 2 === 0
    ? sessionStartsWithEnglish(session.id)
    : !sessionStartsWithEnglish(session.id);
  return shouldUseEnglish ? 'en-tr' as const : 'tr-en' as const;
}

function buildOptionIds(currentWord: Word, candidates: Word[], direction: 'en-tr' | 'tr-en') {
  const valueFor = (word: Word) => direction === 'en-tr' ? word.turkish : word.english;
  const usedValues = new Set([valueFor(currentWord).trim().toLocaleLowerCase()]);
  const optionIds = [currentWord.id];

  for (const candidate of shuffleArray(candidates)) {
    if (candidate.id === currentWord.id) continue;
    const value = valueFor(candidate).trim().toLocaleLowerCase();
    if (!value || usedValues.has(value)) continue;
    usedValues.add(value);
    optionIds.push(candidate.id);
    if (optionIds.length === 4) break;
  }

  return optionIds.length === 4 ? shuffleArray(optionIds) : null;
}

function getReinforcementIndex(queueLength: number) {
  return Math.min(queueLength, 5 + Math.floor(Math.random() * 4));
}

export default function Practice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sourceParam = searchParams.get('source');
  const groupIdParam = searchParams.get('groupId');

  const words = useLiveQuery(() => db.words.toArray());
  const groups = useLiveQuery(() => db.groups.toArray());
  const activeSessions = useLiveQuery(() => db.sessions.where('status').equals('active').toArray());
  const activeSession = activeSessions?.[0] ?? null;

  const [selectedSource, setSelectedSource] = useState<'all' | 'group'>('all');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<(PracticeFeedback & { questionId: string }) | null>(null);
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const previousFeedbackRef = useRef<string | undefined>(undefined);
  const autoStartRequestedRef = useRef(false);

  const activeSessionId = activeSession?.id;
  const currentWordId = activeSession?.currentWordId;
  const selectedOptionId = activeSession?.selectedOptionId;
  const isWaiting = Boolean(activeSession && selectedOptionId);
  const feedback = isWaiting && activeSession
    ? selectedOptionId === currentWordId ? 'correct' : 'wrong'
    : null;

  useEffect(() => {
    if (!activeSessionId || isWaiting) return;

    const timer = window.setInterval(async () => {
      const latestSession = await db.sessions.get(activeSessionId);
      if (!latestSession || latestSession.status !== 'active' || latestSession.selectedOptionId) return;
      await db.sessions.update(activeSessionId, {
        activeDurationSeconds: (latestSession.activeDurationSeconds || 0) + 1,
        lastActiveAt: new Date().toISOString()
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeSessionId, isWaiting]);

  const generateNextQuestion = useCallback(async (session: StudySession) => {
    if (!words || words.length < 4) return;

    const pool = session.sourceType === 'group'
      ? words.filter(word => word.groupId === session.groupId)
      : words;
    if (pool.length < 4) return;

    let queue = [...(session.questionQueue || [])].filter(id => pool.some(word => word.id === id));
    if (queue.length === 0) {
      queue = shuffleArray(pool.map(word => word.id));
      if (queue[0] === session.lastWordId && queue.length > 1) {
        [queue[0], queue[1]] = [queue[1], queue[0]];
      }
    }

    const nextWordId = queue.shift();
    const currentWord = pool.find(word => word.id === nextWordId);
    if (!currentWord) {
      await db.sessions.update(session.id, { questionQueue: queue });
      return;
    }

    const preferredDirection = getDirection(session);
    const candidatePool = [...pool, ...words.filter(word => !pool.some(poolWord => poolWord.id === word.id))];
    let direction = preferredDirection;
    let currentOptions = buildOptionIds(currentWord, candidatePool, direction);

    if (!currentOptions) {
      direction = preferredDirection === 'en-tr' ? 'tr-en' : 'en-tr';
      currentOptions = buildOptionIds(currentWord, candidatePool, direction);
    }

    if (!currentOptions) {
      currentOptions = shuffleArray([
        currentWord.id,
        ...shuffleArray(candidatePool.filter(word => word.id !== currentWord.id)).slice(0, 3).map(word => word.id)
      ]);
    }

    await db.sessions.update(session.id, {
      currentWordId: currentWord.id,
      currentDirection: direction,
      currentOptions,
      selectedOptionId: undefined,
      questionQueue: queue
    });
  }, [words]);

  useEffect(() => {
    if (!activeSession || activeSession.currentWordId || isWaiting) return;
    void generateNextQuestion(activeSession);
  }, [activeSession, generateNextQuestion, isWaiting]);

  useEffect(() => {
    if (!activeSessionId || !currentWordId || selectedOptionId !== currentWordId) return;

    const exitTimer = window.setTimeout(() => setIsExiting(true), 340);
    const nextTimer = window.setTimeout(async () => {
      const latestSession = await db.sessions.get(activeSessionId);
      if (latestSession?.status === 'active') await generateNextQuestion(latestSession);
      setIsExiting(false);
    }, 540);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(nextTimer);
    };
  }, [activeSessionId, currentWordId, generateNextQuestion, selectedOptionId]);

  const startSession = useCallback(async (source: 'all' | 'group', groupId: string | null = null) => {
    const existingActive = await db.sessions.where('status').equals('active').first();
    if (existingActive) return false;

    const group = source === 'group' && groupId ? await db.groups.get(groupId) : undefined;
    const newSession: StudySession = {
      id: crypto.randomUUID(),
      status: 'active',
      sourceType: source,
      groupId: groupId || undefined,
      groupName: group?.name,
      startedAt: new Date().toISOString(),
      totalAnswered: 0,
      correctCount: 0,
      wrongCount: 0,
      activeDurationSeconds: 0,
      questionQueue: [],
      reinforcementQueue: []
    };

    await db.sessions.add(newSession);
    return true;
  }, []);

  const handleStartSession = async () => {
    const started = await startSession(selectedSource, selectedGroupId);
    if (!started) setAlertMessage('You already have a session in progress. Finish it before starting another.');
  };

  useEffect(() => {
    if (
      sourceParam !== 'group' || !groupIdParam || !words || activeSession ||
      autoStartRequestedRef.current
    ) return;

    const groupWordCount = words.filter(word => word.groupId === groupIdParam).length;
    if (groupWordCount < 4) return;
    autoStartRequestedRef.current = true;
    void startSession('group', groupIdParam);
  }, [activeSession, groupIdParam, sourceParam, startSession, words]);

  const handleAnswer = async (wordId: string) => {
    if (isWaiting || !activeSession || !activeSession.currentWordId || !words) return;

    const isCorrect = wordId === activeSession.currentWordId;
    const currentWord = words.find(word => word.id === activeSession.currentWordId);
    if (!currentWord) return;

    const previousAnswers = await db.sessionAnswers.where('sessionId').equals(activeSession.id).toArray();
    const priorWrongCount = previousAnswers.filter(answer => answer.wordId === currentWord.id && !answer.correct).length;
    let priorCorrectStreak = 0;
    for (let index = previousAnswers.length - 1; index >= 0 && previousAnswers[index].correct; index -= 1) {
      priorCorrectStreak += 1;
    }

    const nextFeedback = choosePracticeFeedback({
      correct: isCorrect,
      english: currentWord.english,
      wrongCountForWord: priorWrongCount + (isCorrect ? 0 : 1),
      correctStreak: isCorrect ? priorCorrectStreak + 1 : 0,
      sessionCorrect: activeSession.correctCount + (isCorrect ? 1 : 0),
      sessionAnswered: activeSession.totalAnswered + 1,
      previousMessage: previousFeedbackRef.current
    });
    previousFeedbackRef.current = nextFeedback.message;
    setFeedbackMessage({ ...nextFeedback, questionId: currentWord.id });

    const nextQueue = [...(activeSession.questionQueue || [])];
    if (!isCorrect) {
      const reinforcementIndex = getReinforcementIndex(nextQueue.length);
      nextQueue.splice(reinforcementIndex, 0, currentWord.id);
    }

    await db.transaction('rw', db.sessionAnswers, db.words, db.sessions, async () => {
      await db.sessionAnswers.add({
        id: crypto.randomUUID(),
        sessionId: activeSession.id,
        wordId: currentWord.id,
        english: currentWord.english,
        turkish: currentWord.turkish,
        correct: isCorrect
      });
      await db.words.update(currentWord.id, {
        correctCount: currentWord.correctCount + (isCorrect ? 1 : 0),
        wrongCount: currentWord.wrongCount + (isCorrect ? 0 : 1)
      });
      await db.sessions.update(activeSession.id, {
        totalAnswered: activeSession.totalAnswered + 1,
        correctCount: activeSession.correctCount + (isCorrect ? 1 : 0),
        wrongCount: activeSession.wrongCount + (isCorrect ? 0 : 1),
        lastWordId: currentWord.id,
        questionQueue: nextQueue,
        selectedOptionId: wordId
      });
    });
  };

  const handleContinueAfterWrong = () => {
    if (!activeSessionId || isExiting) return;
    setIsExiting(true);
    window.setTimeout(async () => {
      const latestSession = await db.sessions.get(activeSessionId);
      if (latestSession?.status === 'active') await generateNextQuestion(latestSession);
      setIsExiting(false);
    }, 180);
  };

  const finishSession = async () => {
    if (!activeSession || isFinishing) return;
    setIsFinishing(true);
    try {
      await db.sessions.update(activeSession.id, {
        status: 'finished',
        finishedAt: new Date().toISOString(),
        currentWordId: undefined,
        currentOptions: undefined,
        currentDirection: undefined,
        selectedOptionId: undefined,
        questionQueue: [],
        reinforcementQueue: []
      });
      setFinishConfirmOpen(false);
      navigate(`/session/${activeSession.id}`);
    } finally {
      setIsFinishing(false);
    }
  };

  if (!words || !groups) return null;

  if (activeSession) {
    const currentWord = words.find(word => word.id === activeSession.currentWordId);
    if (!currentWord || !activeSession.currentOptions) {
      return <div className="practice-loading" role="status">Preparing your next word…</div>;
    }

    const accuracy = activeSession.totalAnswered > 0
      ? Math.round((activeSession.correctCount / activeSession.totalAnswered) * 100)
      : 0;
    const isEnglishToTurkish = activeSession.currentDirection === 'en-tr';
    const questionText = isEnglishToTurkish ? currentWord.english : currentWord.turkish;
    const meaningLabel = isEnglishToTurkish ? 'Turkish meaning' : 'English meaning';
    const visibleFeedback = feedbackMessage?.questionId === currentWord.id ? feedbackMessage : (feedback === 'correct'
      ? { message: 'Correct', tone: 'success' as const }
      : feedback === 'wrong' ? { message: 'Not quite', tone: 'danger' as const } : null);

    return (
      <div className="practice-shell">
        <header className="practice-bar">
          <div className="practice-stats" aria-label="Session progress">
            <span><strong>{activeSession.totalAnswered}</strong> answered</span>
            <span className="practice-stat-correct"><strong>{activeSession.correctCount}</strong> correct</span>
            <span className="practice-stat-wrong"><strong>{activeSession.wrongCount}</strong> wrong</span>
            <span><strong>{accuracy}%</strong></span>
          </div>
          <button onClick={() => setFinishConfirmOpen(true)} className="button button-quiet practice-finish">
            Finish
          </button>
        </header>

        <main className={`practice-stage ${feedback ? `practice-stage-${feedback}` : ''}`}>
          <div key={activeSession.currentWordId} className={`practice-question-wrap ${isExiting ? 'practice-is-exiting' : ''}`}>
            <div className="practice-question">
              <p className="practice-direction">Choose the {meaningLabel}</p>
              <h1>{questionText}</h1>
              <div className="practice-feedback-slot" aria-live="polite">
                {visibleFeedback ? (
                  <p className={`practice-feedback practice-feedback-${visibleFeedback.tone}`}>
                    {visibleFeedback.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="answer-list">
              {activeSession.currentOptions.map((optionId, index) => {
                const optionWord = words.find(word => word.id === optionId);
                if (!optionWord) return null;

                const isSelected = selectedOptionId === optionId;
                const isCorrect = optionId === activeSession.currentWordId;
                const optionText = isEnglishToTurkish ? optionWord.turkish : optionWord.english;
                let stateClass = 'answer-neutral';

                if (isWaiting) {
                  if (isCorrect) stateClass = 'answer-correct';
                  else if (isSelected) stateClass = 'answer-wrong';
                  else stateClass = 'answer-neutral answer-muted';
                }

                return (
                  <button
                    key={optionId}
                    disabled={isWaiting}
                    onClick={() => void handleAnswer(optionId)}
                    className={`answer-row ${stateClass} ${isSelected ? 'answer-selected' : ''}`}
                    style={{ '--answer-index': index } as React.CSSProperties}
                  >
                    <span>{optionText}</span>
                    {isWaiting && isCorrect ? <Check size={21} aria-hidden="true" /> : null}
                    {isWaiting && isSelected && !isCorrect ? <X size={21} aria-hidden="true" /> : null}
                  </button>
                );
              })}

              {feedback === 'wrong' ? (
                <button
                  onClick={handleContinueAfterWrong}
                  disabled={isExiting}
                  className="button continue-answer"
                >
                  Continue
                </button>
              ) : null}
            </div>
          </div>
        </main>

        <ConfirmDialog
          isOpen={finishConfirmOpen}
          onClose={() => setFinishConfirmOpen(false)}
          onConfirm={finishSession}
          title="Finish session?"
          description="Your progress so far will be saved to history and this practice session will end."
          confirmLabel="Finish Session"
          isPending={isFinishing}
        />
      </div>
    );
  }

  if (words.length < 4) {
    return (
      <div className="page-shell page-enter">
        <section className="empty-state">
          <span className="eyebrow">Practice</span>
          <h2>Four words unlock practice.</h2>
          <p>Import a few more words, then Lexuni can build a complete answer set.</p>
          <button onClick={() => navigate('/words/import')} className="button button-primary">Import Words</button>
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell page-enter">
      <header className="page-header">
        <span className="eyebrow">Quick study</span>
        <h1>Practice</h1>
        <p>Choose a vocabulary pool and start a focused session.</p>
      </header>

      <div className="practice-source-list" role="radiogroup" aria-label="Practice source">
        <button
          type="button"
          role="radio"
          aria-checked={selectedSource === 'all'}
          onClick={() => { setSelectedSource('all'); setSelectedGroupId(null); }}
          className={`practice-source ${selectedSource === 'all' ? 'practice-source-active' : ''}`}
        >
          <span><strong>All Words</strong><small>{words.length} words</small></span>
          <span className="practice-source-mark" aria-hidden="true" />
        </button>

        {[...groups].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(group => {
          const count = words.filter(word => word.groupId === group.id).length;
          if (count < 4) return null;
          const isSelected = selectedSource === 'group' && selectedGroupId === group.id;
          return (
            <button
              type="button"
              role="radio"
              aria-checked={isSelected}
              key={group.id}
              onClick={() => { setSelectedSource('group'); setSelectedGroupId(group.id); }}
              className={`practice-source ${isSelected ? 'practice-source-active' : ''}`}
            >
              <span><strong>{group.name}</strong><small>{count} words</small></span>
              <span className="practice-source-mark" aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <button onClick={() => void handleStartSession()} className="button button-primary button-large practice-start">
        <Play size={18} fill="currentColor" aria-hidden="true" />
        Start Session
      </button>

      <Modal
        isOpen={Boolean(alertMessage)}
        onClose={() => setAlertMessage(null)}
        title="Practice unavailable"
        footer={<button type="button" onClick={() => setAlertMessage(null)} className="button button-primary button-block">Done</button>}
      >
        <div className="dialog-message">
          <div className="dialog-message-icon dialog-message-icon-warning"><AlertTriangle size={22} aria-hidden="true" /></div>
          <p>{alertMessage}</p>
        </div>
      </Modal>
    </div>
  );
}
