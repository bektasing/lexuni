import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const session = useLiveQuery(() => id ? db.sessions.get(id) : undefined, [id], null);
  const answers = useLiveQuery(() => id ? db.sessionAnswers.where({ sessionId: id }).toArray() : [], [id]);

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!id) return null;
  if (session === null || answers === undefined) return null;
  if (session === undefined) {
    return (
      <div className="p-6 text-center text-tx-secondary mt-20">
        Session not found.
      </div>
    );
  }

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await db.transaction('rw', db.sessionAnswers, db.sessions, async () => {
        await db.sessionAnswers.where({ sessionId: id }).delete();
        await db.sessions.delete(id);
      });
      setDeleteConfirm(false);
      navigate('/history');
    } finally {
      setIsDeleting(false);
    }
  };

  const accuracy = session.totalAnswered > 0 
    ? Math.round((session.correctCount / session.totalAnswered) * 100) 
    : 0;

  const mistakes = answers.filter(a => !a.correct);
  const minutes = Math.floor(session.activeDurationSeconds / 60);
  const seconds = session.activeDurationSeconds % 60;
  const duration = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  return (
    <div className="page-shell page-enter">
      <header className="flex items-center justify-between mb-10">
        <button
          onClick={() => navigate('/history')}
          className="text-action"
        >
          <ChevronLeft size={20} />
          <span>History</span>
        </button>
        
        <button
          onClick={() => setDeleteConfirm(true)}
          className="icon-button icon-button-danger"
          aria-label="Delete session"
        >
          <Trash2 size={20} />
        </button>
      </header>

      <div className="session-summary-head">
        <span className="eyebrow">Session complete</span>
        <h1>
          {session.sourceType === 'all' ? 'All Words' : session.groupName || 'Deleted Group'}
        </h1>
        <p className="session-context">
          <time dateTime={session.startedAt}>{new Date(session.startedAt).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
          })}</time>
          <span aria-hidden="true">·</span>
          <span>{duration}</span>
        </p>
      </div>

      <div className="session-stat-line">
        <div>
          <strong>{session.totalAnswered}</strong><span>answered</span>
        </div>
        <div>
          <strong className="text-success-tx">{session.correctCount}</strong><span>correct</span>
        </div>
        <div>
          <strong className="text-danger-tx">{session.wrongCount}</strong><span>wrong</span>
        </div>
        <div>
          <strong className="text-primary">{accuracy}%</strong><span>accuracy</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-12">
        <button
          onClick={() => navigate('/')}
          className="button button-primary"
        >
          Back Home
        </button>
        <button
          onClick={() => navigate('/practice')}
          className="button button-quiet text-primary"
        >
          Practice Again
        </button>
      </div>

      <div>
        <h2 className="section-title">Mistakes</h2>
        
        {mistakes.length === 0 ? (
          <div className={`inline-notice ${session.totalAnswered > 0 ? 'text-success-tx' : 'text-tx-secondary'}`}>
            {session.totalAnswered === 0
              ? 'No answers were recorded.'
              : session.totalAnswered >= 20
                ? 'Perfect session. Quietly legendary.'
                : 'Perfect session — no mistakes.'}
          </div>
        ) : (
          <div className="mistake-list">
            {mistakes.map(m => (
              <div key={m.id} className="mistake-row">
                <span className="font-bold text-tx">{m.english}</span>
                <span className="text-tx-muted mx-2">→</span>
                <span className="text-tx-secondary font-medium">{m.turkish}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Session?"
        description="This session and all of its recorded answers will be permanently removed from history."
        confirmLabel="Delete Session"
        isPending={isDeleting}
        danger
      />
    </div>
  );
}
