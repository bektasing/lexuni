import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Trash2, Check, X } from 'lucide-react';
import { useState } from 'react';

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const session = useLiveQuery(() => id ? db.sessions.get(id) : undefined, [id]);
  const answers = useLiveQuery(() => id ? db.sessionAnswers.where({ sessionId: id }).toArray() : [], [id]);

  const [deleteConfirm, setDeleteConfirm] = useState(false);

  if (!id) return null;
  if (session === undefined || answers === undefined) return null; // loading
  if (session === null) {
    return (
      <div className="p-6 text-center text-tx-secondary mt-20">
        Session not found.
      </div>
    );
  }

  const handleDelete = async () => {
    await db.sessionAnswers.where({ sessionId: id }).delete();
    await db.sessions.delete(id);
    navigate('/history');
  };

  const accuracy = session.totalAnswered > 0 
    ? Math.round((session.correctCount / session.totalAnswered) * 100) 
    : 0;

  const mistakes = answers.filter(a => !a.correct);

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-2xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <button 
          onClick={() => navigate('/history')}
          className="flex items-center space-x-1 text-tx-secondary hover:text-tx font-medium"
        >
          <ChevronLeft size={20} />
          <span>History</span>
        </button>
        
        {deleteConfirm ? (
          <div className="flex items-center bg-danger-bg rounded-xl p-1">
            <span className="text-xs text-danger-tx font-bold px-2">Sure?</span>
            <button onClick={handleDelete} className="p-2 text-danger-tx hover:bg-danger-bg rounded-lg">
              <Check size={18} />
            </button>
            <button onClick={() => setDeleteConfirm(false)} className="p-2 text-tx-secondary hover:bg-surface-hover rounded-lg">
              <X size={18} />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setDeleteConfirm(true)}
            className="p-2 text-tx-muted hover:text-danger-tx hover:bg-danger-bg rounded-xl transition-colors"
          >
            <Trash2 size={20} />
          </button>
        )}
      </header>

      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-tx mb-2">Session Complete</h1>
        <p className="text-lg font-bold text-primary mb-1">
          {session.sourceType === 'all' ? 'All Words' : session.groupName || 'Deleted Group'}
        </p>
        <p className="text-sm text-tx-secondary font-medium">
          {new Date(session.startedAt).toLocaleString('en-US', { 
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <div className="bg-bg p-4 rounded-2xl text-center">
          <div className="text-2xl font-black text-tx">{session.totalAnswered}</div>
          <div className="text-xs font-bold uppercase mt-1 text-tx-secondary">Answered</div>
        </div>
        <div className="bg-success-bg p-4 rounded-2xl text-center">
          <div className="text-2xl font-black text-success-tx">{session.correctCount}</div>
          <div className="text-xs font-bold uppercase mt-1 text-success-tx">Correct</div>
        </div>
        <div className="bg-danger-bg p-4 rounded-2xl text-center">
          <div className="text-2xl font-black text-danger-tx">{session.wrongCount}</div>
          <div className="text-xs font-bold uppercase mt-1 text-danger-tx">Wrong</div>
        </div>
        <div className="bg-primary-soft p-4 rounded-2xl text-center">
          <div className="text-2xl font-black text-primary">{accuracy}%</div>
          <div className="text-xs font-bold uppercase mt-1 text-primary">Accuracy</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-10">
        <button
          onClick={() => navigate('/')}
          className="flex-1 bg-tx text-bg py-4 rounded-xl font-bold text-lg active:scale-[0.98]"
        >
          Back Home
        </button>
        <button
          onClick={() => navigate('/practice')}
          className="flex-1 bg-primary-soft text-primary border-2 border-primary-soft py-4 rounded-xl font-bold text-lg active:scale-[0.98]"
        >
          Practice Again
        </button>
      </div>

      <div>
        <h2 className="text-xl font-bold text-tx mb-4">Mistakes</h2>
        
        {mistakes.length === 0 ? (
          <div className="bg-success-bg text-success-tx p-6 rounded-2xl text-center font-bold">
            Perfect session — no mistakes.
          </div>
        ) : (
          <div className="space-y-3">
            {mistakes.map(m => (
              <div key={m.id} className="bg-surface p-4 rounded-xl border border-border shadow-sm flex items-center justify-between">
                <span className="font-bold text-tx">{m.english}</span>
                <span className="text-tx-muted mx-2">→</span>
                <span className="text-tx-secondary font-medium">{m.turkish}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
