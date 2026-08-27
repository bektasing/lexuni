import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { X, Check, Play, AlertTriangle } from 'lucide-react';
import type { StudySession } from '../types';

function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export default function Practice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
   const sourceParam = searchParams.get('source');
  const groupIdParam = searchParams.get('groupId');
  
  const words = useLiveQuery(() => db.words.toArray());
  const groups = useLiveQuery(() => db.groups.toArray());
  const activeSessions = useLiveQuery(() => db.sessions.where('status').equals('active').toArray());
  const activeSession = activeSessions && activeSessions.length > 0 ? activeSessions[0] : null;

  const [selectedSource, setSelectedSource] = useState<'all' | 'group'>('all');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const isWaiting = !!(activeSession && activeSession.selectedOptionId);
  const selectedOptionId = activeSession?.selectedOptionId || null;
  const feedback = isWaiting && activeSession ? (selectedOptionId === activeSession.currentWordId ? 'correct' : 'wrong') : null;

  // Timer interval
  useEffect(() => {
    if (!activeSession || isWaiting) return;
    const timer = setInterval(() => {
      db.sessions.update(activeSession.id, {
        activeDurationSeconds: (activeSession.activeDurationSeconds || 0) + 1,
        lastActiveAt: new Date().toISOString()
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeSession, isWaiting]);

  const generateNextQuestion = useCallback(async (session: StudySession) => {
    if (!words || words.length < 4) return;
    
    let queue = [...(session.questionQueue || [])];
    const pool = session.sourceType === 'group' ? words.filter(w => w.groupId === session.groupId) : words;
    
    if (pool.length < 4) return;

    if (queue.length === 0) {
      queue = shuffleArray(pool.map(w => w.id));
      if (queue[0] === session.lastWordId && queue.length > 1) {
        [queue[0], queue[1]] = [queue[1], queue[0]];
      }
    }

    const currentWordId = queue.shift()!;
    const currentWord = words.find(w => w.id === currentWordId);
    if (!currentWord) {
      await db.sessions.update(session.id, { questionQueue: queue });
      return; 
    }

    const direction = Math.random() > 0.5 ? 'en-tr' : 'tr-en';

    const distractors = words.filter(w => w.id !== currentWordId);
    const shuffledDistractors = shuffleArray(distractors);
    
    const optionsSet = new Set<string>();
    optionsSet.add(direction === 'en-tr' ? currentWord.turkish : currentWord.english);
    
    const selectedDistractors = [];
    for (const w of shuffledDistractors) {
      const val = direction === 'en-tr' ? w.turkish : w.english;
      if (!optionsSet.has(val)) {
        optionsSet.add(val);
        selectedDistractors.push(w.id);
      }
      if (selectedDistractors.length === 3) break;
    }

    const currentOptions = shuffleArray([currentWordId, ...selectedDistractors]);

    await db.sessions.update(session.id, {
      currentWordId,
      currentDirection: direction,
      currentOptions,
      selectedOptionId: undefined, // Clear selected state for new question
      questionQueue: queue
    });
  }, [words]);

  // If session is active but no question is generated yet, generate one
  useEffect(() => {
    if (activeSession && !activeSession.currentWordId && !isWaiting) {
      generateNextQuestion(activeSession);
    }
  }, [activeSession, isWaiting, generateNextQuestion]);


  // Safeguard: If the user refreshed the page exactly during the 460ms correct-answer transition, 
  // the DB might have saved the selected option but the timeout was lost, leaving them stuck.
  useEffect(() => {
    if (activeSession && isWaiting && activeSession.selectedOptionId === activeSession.currentWordId) {
      const timer = setTimeout(async () => {
        setIsExiting(true);
        setTimeout(async () => {
          setIsExiting(false);
          const latestSession = await db.sessions.get(activeSession.id);
          if (latestSession) {
            await generateNextQuestion(latestSession);
          }
        }, 160);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeSession?.id, activeSession?.currentWordId, activeSession?.selectedOptionId, isWaiting]);

  const startSession = async (source: 'all' | 'group', gId: string | null = null) => {
    if (activeSession) {
      setAlertMessage("You already have a session in progress. Please finish it first.");
      return;
    }

    const sessionId = crypto.randomUUID();
    let groupName;
    if (source === 'group' && gId) {
      const g = await db.groups.get(gId);
      groupName = g?.name;
    }

    const newSession: StudySession = {
      id: sessionId,
      status: 'active',
      sourceType: source,
      groupId: gId || undefined,
      groupName,
      startedAt: new Date().toISOString(),
      totalAnswered: 0,
      correctCount: 0,
      wrongCount: 0,
      activeDurationSeconds: 0,
      questionQueue: [],
      reinforcementQueue: []
    };

    await db.sessions.add(newSession);
  };

  // Auto-start if params are provided and no active session exists
  useEffect(() => {
    if (sourceParam === 'group' && groupIdParam && words && !activeSession && !isWaiting) {
      setTimeout(() => startSession('group', groupIdParam), 0);
    }
  }, [sourceParam, groupIdParam, !!words]);

  const handleAnswer = async (wordId: string) => {
    if (isWaiting || !activeSession || !activeSession.currentWordId) return;
    
    const isCorrect = wordId === activeSession.currentWordId;
    const currentWord = words?.find(w => w.id === activeSession.currentWordId);
    
    if (currentWord) {
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
        wrongCount: currentWord.wrongCount + (!isCorrect ? 1 : 0)
      });
    }

    const newQueue = [...(activeSession.questionQueue || [])];
    if (!isCorrect) {
      const insertAt = Math.min(newQueue.length, 5 + Math.floor(Math.random() * 4));
      newQueue.splice(insertAt, 0, activeSession.currentWordId);
    }

    await db.sessions.update(activeSession.id, {
      totalAnswered: activeSession.totalAnswered + 1,
      correctCount: activeSession.correctCount + (isCorrect ? 1 : 0),
      wrongCount: activeSession.wrongCount + (!isCorrect ? 1 : 0),
      lastWordId: activeSession.currentWordId,
      questionQueue: newQueue,
      selectedOptionId: wordId
    });

    if (isCorrect) {
      
      setTimeout(() => setIsExiting(true), 300);
      
      setTimeout(async () => {
        setIsExiting(false);
        
        const latestSession = await db.sessions.get(activeSession.id);
        if (latestSession) {
          await generateNextQuestion(latestSession);
        }
      }, 460); 
    }
  };

  const handleContinueAfterWrong = async () => {
    if (!activeSession) return;
    setIsExiting(true);
    
    setTimeout(async () => {
      setIsExiting(false);
      const latestSession = await db.sessions.get(activeSession.id);
      if (latestSession) {
        await generateNextQuestion(latestSession);
      }
    }, 160);
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
    if (!activeSession.currentWordId || !activeSession.currentOptions) {
      // Loading next question
      return (
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="animate-pulse text-tx-muted font-bold">Loading question...</div>
        </div>
      );
    }

    const currentWord = words.find(w => w.id === activeSession.currentWordId);
    if (!currentWord) return null;

    const accuracy = activeSession.totalAnswered > 0 
      ? Math.round((activeSession.correctCount / activeSession.totalAnswered) * 100) 
      : 0;

    const isEnTr = activeSession.currentDirection === 'en-tr';
    const questionText = isEnTr ? currentWord.english : currentWord.turkish;
    const meaningLabel = isEnTr ? "Turkish meaning" : "English meaning";

    return (
      <div className="practice-shell">
        <header className="practice-bar">
          <div className="practice-stats">
            <div>{activeSession.totalAnswered} <span>answered</span></div>
            <div className="text-success-tx">{activeSession.correctCount} ✓</div>
            <div className="text-danger-tx">{activeSession.wrongCount} ×</div>
            <div className="text-primary">{accuracy}%</div>
          </div>
          <button 
            onClick={() => setFinishConfirmOpen(true)}
            className="button button-quiet"
          >
            Finish
          </button>
        </header>

        <main className="practice-stage">
          {feedback && (
            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${feedback === 'correct' ? 'bg-[radial-gradient(ellipse_at_center,_var(--color-emerald-500)_0%,_transparent_60%)] opacity-[0.08]' : 'bg-[radial-gradient(ellipse_at_center,_var(--color-rose-500)_0%,_transparent_60%)] opacity-[0.08]'}`} />
          )}
          <div key={activeSession.currentWordId} className="practice-question-wrap">
          <div className={`practice-question ${isExiting ? 'motion-safe:animate-out motion-safe:fade-out motion-safe:slide-out-to-top-4 duration-150' : 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 duration-200 ease-out'}`}>
            <div className="practice-direction">Select the {meaningLabel}</div>
            <h1>
              {questionText}
            </h1>
            {feedback === 'correct' && (
              <div className="practice-feedback text-success-tx animate-in fade-in slide-in-from-bottom-1">Correct</div>
            )}
            {feedback === 'wrong' && (
              <div className="practice-feedback text-danger-tx animate-in fade-in slide-in-from-bottom-1">Not quite</div>
            )}
          </div>

          <div className="answer-list">
            {activeSession.currentOptions.map((optId, i) => {
              const optWord = words.find(w => w.id === optId);
              if (!optWord) return null;

              const isSelected = selectedOptionId === optId;
              const isCorrect = optId === activeSession.currentWordId;
              const optionText = isEnTr ? optWord.turkish : optWord.english;
              
              let btnClass = "answer-neutral";
              
              if (isWaiting) {
                if (isCorrect) {
                  btnClass = "answer-correct motion-safe:animate-correct-pulse z-10";
                } else if (isSelected && !isCorrect) {
                  btnClass = "answer-wrong motion-safe:animate-shake z-10";
                } else if (!isSelected && isCorrect) {
                  btnClass = "answer-correct motion-safe:animate-correct-pulse z-10";
                } else {
                  btnClass = "answer-neutral answer-muted";
                }
              }

              return (
                <button
                  key={optId}
                  disabled={isWaiting}
                  onClick={() => handleAnswer(optId)}
                  className={`answer-row ${btnClass} ${isExiting ? 'motion-safe:animate-out motion-safe:fade-out motion-safe:slide-out-to-top-4 duration-150' : 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 duration-200 ease-out'}`}
                  style={isWaiting ? (!isSelected && isCorrect ? { animationDelay: '100ms' } : {}) : (isExiting ? {} : { animationDelay: `${i * 25}ms`, animationFillMode: 'both' })}
                >
                  <span>{optionText}</span>
                  {isWaiting && isCorrect && <Check size={24} className="animate-in zoom-in" />}
                  {isWaiting && isSelected && !isCorrect && <X size={24} className="animate-in zoom-in" />}
                </button>
              );
            })}

            {isWaiting && selectedOptionId !== activeSession.currentWordId && (
              <button
                onClick={handleContinueAfterWrong}
                disabled={isExiting}
                className="button continue-answer animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '300ms', animationFillMode: 'both' }}
              >
                <span>Tap to Continue</span>
              </button>
            )}
          </div>
        </div>
        </main>
        <ConfirmDialog
          isOpen={finishConfirmOpen}
          onClose={() => setFinishConfirmOpen(false)}
          onConfirm={finishSession}
          title="Finish Session?"
          description="Your progress so far will be saved to history and this practice session will end."
          confirmLabel="Finish Session"
          isPending={isFinishing}
        />
      </div>
    );
  }

  // Setup View (No active session)
  const canPractice = words.length >= 4;

  if (!canPractice) {
    return (
      <div className="page-shell page-enter">
        <section className="empty-state">
        <h2>Not enough words.</h2>
        <p>You need at least 4 words to practice.</p>
        <button
          onClick={() => navigate('/')}
          className="button button-secondary"
        >
          Go Back
        </button>
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell page-enter">
      <header className="page-header">
        <h1>Practice</h1>
        <p>Select what you want to practice.</p>
      </header>

      <div className="practice-source-list">
        <div 
          onClick={() => { setSelectedSource('all'); setSelectedGroupId(null); }}
          className={`practice-source ${selectedSource === 'all' ? 'practice-source-active' : ''}`}
        >
          <h3>All Words</h3><p>{words.length} words</p>
        </div>

        {groups.sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map(g => {
          const count = words.filter(w => w.groupId === g.id).length;
          if (count < 4) return null;
          
          const isSelected = selectedSource === 'group' && selectedGroupId === g.id;
          return (
            <div 
              key={g.id}
              onClick={() => { setSelectedSource('group'); setSelectedGroupId(g.id); }}
              className={`practice-source ${isSelected ? 'practice-source-active' : ''}`}
            >
              <h3>{g.name}</h3><p>{count} words</p>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => startSession(selectedSource, selectedGroupId)}
        className="button button-primary button-large mt-8"
      >
        <Play size={20} fill="currentColor" />
        <span>Start Session</span>
      </button>

      <Modal
        isOpen={!!alertMessage}
        onClose={() => setAlertMessage(null)}
        title="Warning"
        footer={
          <button
            type="button"
            onClick={() => {
              setAlertMessage(null);
              navigate('/');
            }}
            className="min-h-11 w-full rounded-xl bg-primary px-4 py-3 font-bold text-white hover:bg-primary-hover"
          >
            Go Back
          </button>
        }
      >
        <div className="flex gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-warning-bg text-warning-tx">
            <AlertTriangle size={22} aria-hidden="true" />
          </div>
          <p className="self-center leading-relaxed text-tx-secondary">{alertMessage}</p>
        </div>
      </Modal>
    </div>
  );
}
