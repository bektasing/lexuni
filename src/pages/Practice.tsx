import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Modal from '../components/Modal';
import { X, Check, XCircle, Play, AlertTriangle } from 'lucide-react';
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
    if (!activeSession) return;
    await db.sessions.update(activeSession.id, {
      status: 'finished',
      finishedAt: new Date().toISOString(),
      currentWordId: undefined,
      currentOptions: undefined,
      currentDirection: undefined,
      questionQueue: [],
      reinforcementQueue: []
    });
    navigate(`/session/${activeSession.id}`);
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
      <div className="flex flex-col h-screen sm:h-[calc(100vh-2rem)] sm:pt-8 bg-bg">
        <header className="px-4 py-3 flex items-center justify-between bg-surface border-b border-border shrink-0 sm:rounded-t-3xl sm:mx-4 sm:border sm:shadow-sm">
          <div className="flex space-x-3 sm:space-x-4 text-xs sm:text-sm font-bold">
            <div className="text-tx-secondary">{activeSession.totalAnswered} answered</div>
            <div className="text-success-tx">{activeSession.correctCount} ✓</div>
            <div className="text-danger-tx">{activeSession.wrongCount} ✗</div>
            <div className="text-primary">{accuracy}%</div>
          </div>
          <button 
            onClick={finishSession}
            className="px-4 py-2 bg-surface-hover text-tx-secondary hover:bg-border font-bold text-sm btn-primary"
          >
            Finish
          </button>
        </header>

        <main className="flex-1 flex flex-col p-6 sm:px-4 overflow-hidden relative">
          {feedback && (
            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${feedback === 'correct' ? 'bg-[radial-gradient(ellipse_at_center,_var(--color-emerald-500)_0%,_transparent_60%)] opacity-[0.08]' : 'bg-[radial-gradient(ellipse_at_center,_var(--color-rose-500)_0%,_transparent_60%)] opacity-[0.08]'}`} />
          )}
          <div key={activeSession.currentWordId} className="flex-1 flex flex-col w-full h-full relative z-10">
          <div className={`flex-1 flex flex-col items-center justify-center mb-8 ${isExiting ? 'motion-safe:animate-out motion-safe:fade-out motion-safe:slide-out-to-top-4 duration-150' : 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 duration-200 ease-out'}`}>
            <div className="text-sm font-bold uppercase tracking-widest text-tx-muted mb-4">Select the {meaningLabel}</div>
            <h1 className="text-4xl sm:text-5xl font-black text-tx text-center break-words max-w-full">
              {questionText}
            </h1>
            {feedback === 'correct' && (
              <div className="text-success-tx font-bold text-sm uppercase tracking-widest mt-4 animate-in fade-in slide-in-from-bottom-1">Correct</div>
            )}
            {feedback === 'wrong' && (
              <div className="text-danger-tx font-bold text-sm uppercase tracking-widest mt-4 animate-in fade-in slide-in-from-bottom-1">Not quite</div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 w-full max-w-md mx-auto">
            {activeSession.currentOptions.map((optId, i) => {
              const optWord = words.find(w => w.id === optId);
              if (!optWord) return null;

              const isSelected = selectedOptionId === optId;
              const isCorrect = optId === activeSession.currentWordId;
              const optionText = isEnTr ? optWord.turkish : optWord.english;
              
              let btnClass = "bg-surface border-2 border-border text-tx-secondary hover:border-border-strong active:bg-bg";
              
              if (isWaiting) {
                if (isCorrect) {
                  btnClass = "bg-emerald-500 border-emerald-500 text-white shadow-lg motion-safe:animate-correct-pulse z-10";
                } else if (isSelected && !isCorrect) {
                  btnClass = "bg-rose-500 border-rose-500 text-white shadow-lg motion-safe:animate-shake z-10";
                } else if (!isSelected && isCorrect) {
                  btnClass = "bg-emerald-500 border-emerald-500 text-white shadow-lg motion-safe:animate-correct-pulse z-10";
                } else {
                  btnClass = "bg-surface border-2 border-border text-tx-muted opacity-50";
                }
              }

              return (
                <button
                  key={optId}
                  disabled={isWaiting}
                  onClick={() => handleAnswer(optId)}
                  className={`p-5 rounded-2xl font-bold text-lg text-left transition-all duration-200 flex items-center justify-between hover:shadow-md tap-card ${btnClass} ${isExiting ? 'motion-safe:animate-out motion-safe:fade-out motion-safe:slide-out-to-top-4 duration-150' : 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 duration-200 ease-out'}`}
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
                className="mt-6 p-4 bg-tx text-bg rounded-2xl font-bold text-lg flex items-center justify-center space-x-2 active:scale-[0.98] transition-transform animate-in fade-in slide-in-from-bottom-4 shadow-lg" style={{ animationDelay: '300ms', animationFillMode: 'both' }}
              >
                <span>Tap to Continue</span>
              </button>
            )}
          </div>
        </div>
        </main>
      </div>
    );
  }

  // Setup View (No active session)
  const canPractice = words.length >= 4;

  if (!canPractice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
        <div className="w-20 h-20 bg-amber-100 text-warning-tx rounded-3xl flex items-center justify-center mb-6">
          <XCircle size={40} strokeWidth={2} />
        </div>
        <h2 className="text-xl font-bold mb-2">Not enough words</h2>
        <p className="text-tx-secondary mb-8">You need at least 4 words to practice.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-tx text-bg px-8 py-3 rounded-xl font-semibold"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-xl mx-auto page-enter">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-tx">Practice Setup</h1>
        <p className="text-tx-secondary font-medium mt-1">Select what you want to practice.</p>
      </header>

      <div className="space-y-4">
        <div 
          onClick={() => { setSelectedSource('all'); setSelectedGroupId(null); }}
          className={`p-5 rounded-2xl border-2 cursor-pointer transition-all hover-card tap-card ${selectedSource === 'all' ? 'border-primary bg-primary-soft' : 'border-border bg-surface hover:border-border-strong'}`}
        >
          <h3 className="font-bold text-lg text-tx">All Words</h3>
          <p className="text-tx-secondary font-medium">{words.length} words</p>
        </div>

        {groups.sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map(g => {
          const count = words.filter(w => w.groupId === g.id).length;
          if (count < 4) return null;
          
          const isSelected = selectedSource === 'group' && selectedGroupId === g.id;
          return (
            <div 
              key={g.id}
              onClick={() => { setSelectedSource('group'); setSelectedGroupId(g.id); }}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all hover-card tap-card ${isSelected ? 'border-primary bg-primary-soft' : 'border-border bg-surface hover:border-border-strong'}`}
            >
              <h3 className="font-bold text-lg text-tx">{g.name}</h3>
              <p className="text-tx-secondary font-medium">{count} words</p>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => startSession(selectedSource, selectedGroupId)}
        className="w-full mt-8 bg-primary text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center space-x-2 btn-primary shadow-lg"
      >
        <Play size={20} fill="currentColor" />
        <span>Start Session</span>
      </button>

      <Modal isOpen={!!alertMessage} onClose={() => setAlertMessage(null)} title="Warning">
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 bg-warning-bg text-warning-tx rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} />
          </div>
          <p className="text-tx font-medium">{alertMessage}</p>
          <button
            onClick={() => {
              setAlertMessage(null);
              navigate('/');
            }}
            className="w-full mt-4 px-4 py-3 bg-surface text-tx-secondary font-bold rounded-xl border border-border active:bg-bg"
          >
            Go Back
          </button>
        </div>
      </Modal>
    </div>
  );
}