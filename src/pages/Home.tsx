import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import { db } from '../db/db';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Home() {
  const navigate = useNavigate();
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const words = useLiveQuery(() => db.words.toArray());
  const groupsCount = useLiveQuery(() => db.groups.count());
  const sessions = useLiveQuery(() => db.sessions.where('status').equals('finished').toArray());
  const activeSessions = useLiveQuery(() => db.sessions.where('status').equals('active').toArray());

  if (words === undefined) return null;

  const totalWords = words.length;
  const sortedSessions = sessions?.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const lastSession = sortedSessions && sortedSessions.length > 0 ? sortedSessions[0] : null;
  const activeSession = activeSessions && activeSessions.length > 0 ? activeSessions[0] : null;

  if (totalWords === 0) {
    return (
      <div className="page-shell page-enter">
        <header className="brand-header">
          <span className="eyebrow">Your words. Your pace.</span>
          <h1>Lexuni</h1>
          <p>Vocabulary Practice</p>
        </header>
        <section className="empty-state">
          <h2>Your vocabulary is empty.</h2>
          <p>Import your first words and start practicing.</p>
          <button onClick={() => navigate('/words/import')} className="button button-primary">
            Import Words <ArrowRight size={18} />
          </button>
        </section>
      </div>
    );
  }

  const correct = words.reduce((sum, word) => sum + word.correctCount, 0);
  const wrong = words.reduce((sum, word) => sum + word.wrongCount, 0);
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
    <div className="page-shell home-page page-enter">
      <header className="brand-header">
        <span className="eyebrow">Your words. Your pace.</span>
        <h1>Lexuni</h1>
        <p>Vocabulary Practice</p>
      </header>

      <div className="home-dashboard">
        <section className="home-overview" aria-label="Vocabulary overview">
          <div className="home-total">
            <strong>{totalWords}</strong>
            <span>words in your vocabulary</span>
            {groupsCount !== undefined && <small>{groupsCount} {groupsCount === 1 ? 'import' : 'imports'}</small>}
          </div>

          <div className="stat-line">
            <div><strong className="text-success-tx">{correct}</strong><span>correct</span></div>
            <div><strong className="text-danger-tx">{wrong}</strong><span>wrong</span></div>
            <div><strong className="text-primary">{accuracy}%</strong><span>accuracy</span></div>
          </div>
        </section>

        {activeSession ? (
          <section className="session-panel">
          <div className="session-panel-head">
            <div>
              <div className="session-kicker"><span />Continue learning</div>
              <h2>{activeSession.sourceType === 'all' ? 'All Words' : activeSession.groupName || 'Practice'}</h2>
            </div>
            <div className="session-metrics">
              <span><strong>{activeSession.totalAnswered}</strong> answered</span>
              <span><strong>{activeSession.totalAnswered > 0 ? Math.round((activeSession.correctCount / activeSession.totalAnswered) * 100) : 0}%</strong> accuracy</span>
            </div>
          </div>
          <div className="session-actions">
            <button onClick={() => navigate('/practice')} className="button session-continue">
              Continue <ArrowRight size={18} />
            </button>
            <button onClick={() => setFinishConfirmOpen(true)} className="button button-quiet session-finish">
              Finish
            </button>
          </div>
          </section>
        ) : lastSession ? (
          <button onClick={() => navigate(`/session/${lastSession.id}`)} className="last-session-row">
          <div>
            <span>Last session</span>
            <strong>{lastSession.sourceType === 'all' ? 'All Words' : lastSession.groupName || 'Practice'}</strong>
          </div>
          <div>
            <span><strong>{lastSession.totalAnswered}</strong> answered · {lastSession.totalAnswered > 0 ? Math.round((lastSession.correctCount / lastSession.totalAnswered) * 100) : 0}%</span>
            <ArrowRight size={17} />
          </div>
          </button>
        ) : (
          <section className="home-prompt">
            <span className="eyebrow">Ready when you are</span>
            <h2>Make a few words stick.</h2>
            <p>Short sessions are the point. Start, focus, and leave when you’re done.</p>
          </section>
        )}

        <section className="home-actions">
          {!activeSession ? (
            <>
            <button
              onClick={() => navigate('/practice')}
              disabled={!canPractice}
              className={`button button-primary button-large ${canPractice ? '' : 'button-disabled'}`}
            >
              <Play fill={canPractice ? 'currentColor' : 'none'} size={19} />
              Start Practice
            </button>
            {!canPractice && <p className="practice-requirement">At least 4 words are required to start practice.</p>}
            </>
          ) : null}
          <div className="secondary-links">
            <button onClick={() => navigate('/words/import')} className="text-action">
              <span>Import words</span><ArrowRight size={16} />
            </button>
            <button onClick={() => navigate('/words')} className="text-action">
              <span>Browse vocabulary</span><ArrowRight size={16} />
            </button>
          </div>
        </section>
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
