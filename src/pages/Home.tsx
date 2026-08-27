import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useNavigate } from 'react-router-dom';
import { Play, Import, BookOpen } from 'lucide-react';
import { useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Home() {
  const navigate = useNavigate();
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const words = useLiveQuery(() => db.words.toArray());
  const groupsCount = useLiveQuery(() => db.groups.count());
  const sessions = useLiveQuery(() => db.sessions.where('status').equals('finished').toArray());
  const activeSessions = useLiveQuery(() => db.sessions.where('status').equals('active').toArray());
  
  if (words === undefined) return null; // loading

  const totalWords = words.length;
  // sort manually because index is on status
  const sortedSessions = sessions?.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const lastSession = sortedSessions && sortedSessions.length > 0 ? sortedSessions[0] : null;
  const activeSession = activeSessions && activeSessions.length > 0 ? activeSessions[0] : null;

  if (totalWords === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center page-enter">
        <div className="w-20 h-20 bg-primary-soft text-primary rounded-3xl flex items-center justify-center mb-6">
          <BookOpen size={40} strokeWidth={2} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Lexuni</h1>
        <h2 className="text-xl font-semibold mb-3">Your vocabulary is empty.</h2>
        <p className="text-tx-secondary mb-8 max-w-sm">
          Import your first words and start practicing.
        </p>
        <button
          onClick={() => navigate('/words/import')}
          className="bg-primary text-white px-8 py-4 rounded-2xl font-semibold text-lg flex items-center justify-center space-x-2 btn-primary hover:bg-primary-hover hover:shadow-md"
        >
          <Import size={24} />
          <span>Import Words</span>
        </button>
      </div>
    );
  }

  const correct = words.reduce((sum, w) => sum + w.correctCount, 0);
  const wrong = words.reduce((sum, w) => sum + w.wrongCount, 0);
  const totalAnswers = correct + wrong;
  const accuracy = totalAnswers > 0 ? Math.round((correct / totalAnswers) * 100) : 0;

  const canPractice = totalWords >= 4;

  const handleFinishSession = async () => {
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

  return (
    <div className="p-6 pt-12 sm:pt-16 pb-24 max-w-2xl mx-auto page-enter">
      <header className="mb-10 text-center sm:text-left">
        <h1 className="text-4xl font-extrabold tracking-tight text-tx mb-2">Lexuni</h1>
        <p className="text-lg text-tx-secondary font-medium">Vocabulary Practice</p>
      </header>

      <div className="bg-surface rounded-3xl p-6 sm:p-8 shadow-sm border border-border mb-8 hover-card">
        <div className="text-center mb-8">
          <div className="text-5xl font-black text-tx mb-2">{totalWords}</div>
          <div className="text-tx-secondary font-medium uppercase tracking-wider text-sm flex items-center justify-center space-x-2">
            <span>Total Words</span>
            {groupsCount !== undefined && (
              <>
                <span>&middot;</span>
                <span>{groupsCount} Imports</span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 bg-bg rounded-2xl">
            <div className="text-2xl font-bold text-success-tx">{correct}</div>
            <div className="text-xs font-semibold text-tx-secondary mt-1 uppercase">Correct</div>
          </div>
          <div className="text-center p-4 bg-bg rounded-2xl">
            <div className="text-2xl font-bold text-danger-tx">{wrong}</div>
            <div className="text-xs font-semibold text-tx-secondary mt-1 uppercase">Wrong</div>
          </div>
          <div className="text-center p-4 bg-bg rounded-2xl">
            <div className="text-2xl font-bold text-primary">{accuracy}%</div>
            <div className="text-xs font-semibold text-tx-secondary mt-1 uppercase">Accuracy</div>
          </div>
        </div>

        {activeSession ? (
          <div className="mb-8 p-5 bg-session-bg border border-session-border rounded-2xl shadow-sm hover-card tap-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-bold text-session-muted uppercase tracking-widest mb-1 flex items-center space-x-1">
                  <span className="relative flex h-2 w-2 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-session-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-session-accent"></span>
                  </span>
                  Session in progress
                </div>
                <div className="font-bold text-session-tx text-lg">
                  {activeSession.sourceType === 'all' ? 'All Words' : activeSession.groupName || 'Practice'}
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-session-accent text-xl">{activeSession.totalAnswered} ans</div>
                <div className="text-sm font-semibold text-session-muted">
                  {activeSession.totalAnswered > 0 ? Math.round((activeSession.correctCount / activeSession.totalAnswered) * 100) : 0}% acc
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => navigate('/practice')}
                className="py-3 bg-session-btn text-session-btn-tx font-bold rounded-xl btn-primary hover:shadow-md opacity-95 hover:opacity-100 transition-opacity"
              >
                Continue
              </button>
              <button 
                onClick={() => setFinishConfirmOpen(true)}
                className="py-3 bg-session-btn-sec text-session-btn-sec-tx border border-session-border font-bold rounded-xl btn-primary hover:opacity-80 transition-opacity"
              >
                Finish
              </button>
            </div>
          </div>
        ) : lastSession ? (
          <div 
            onClick={() => navigate(`/session/${lastSession.id}`)}
            className="mb-8 p-4 bg-primary-soft border border-primary-soft rounded-2xl cursor-pointer hover:bg-primary-soft transition-all flex items-center justify-between hover-card tap-card"
          >
            <div>
              <div className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Last Session</div>
              <div className="font-bold text-primary">
                {lastSession.sourceType === 'all' ? 'All Words' : lastSession.groupName || 'Practice'}
              </div>
            </div>
            <div className="text-right">
              <div className="font-black text-primary">{lastSession.totalAnswered} ans</div>
              <div className="text-sm font-semibold text-primary">
                {lastSession.totalAnswered > 0 ? Math.round((lastSession.correctCount / lastSession.totalAnswered) * 100) : 0}% acc
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col space-y-3">
          {!activeSession && (
            <>
              <button
                onClick={() => navigate('/practice')}
                disabled={!canPractice}
                className={`flex items-center justify-center space-x-2 py-4 rounded-2xl font-bold text-lg transition-all ${
                  canPractice 
                    ? 'bg-primary text-white hover:bg-primary-hover btn-primary shadow-lg' 
                    : 'bg-surface-hover text-tx-muted cursor-not-allowed'
                }`}
              >
                <Play fill={canPractice ? "currentColor" : "none"} size={22} />
                <span>Start Practice</span>
              </button>
              
              {!canPractice && (
                <p className="text-center text-sm text-warning-tx font-medium px-4">
                  At least 4 words are required to start practice.
                </p>
              )}
            </>
          )}

          <div className="grid grid-cols-2 gap-3 mt-2">
            <button
              onClick={() => navigate('/words/import')}
              className="flex items-center justify-center space-x-2 py-3.5 bg-surface border-2 border-border text-tx-secondary rounded-2xl font-semibold btn-primary hover:border-border-strong"
            >
              <Import size={20} />
              <span>Import Words</span>
            </button>
            <button
              onClick={() => navigate('/words')}
              className="flex items-center justify-center space-x-2 py-3.5 bg-surface border-2 border-border text-tx-secondary rounded-2xl font-semibold btn-primary hover:border-border-strong"
            >
              <BookOpen size={20} />
              <span>View All</span>
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={finishConfirmOpen}
        onClose={() => setFinishConfirmOpen(false)}
        onConfirm={handleFinishSession}
        title="Finish Session?"
        description="Your progress so far will be saved to history and this practice session will end."
        confirmLabel="Finish Session"
        isPending={isFinishing}
      />
    </div>
  );
}
