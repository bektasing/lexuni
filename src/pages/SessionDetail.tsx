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
      <div className="p-6 text-center text-slate-500 mt-20">
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
          className="flex items-center space-x-1 text-slate-500 hover:text-slate-900 font-medium"
        >
          <ChevronLeft size={20} />
          <span>History</span>
        </button>
        
        {deleteConfirm ? (
          <div className="flex items-center bg-rose-50 rounded-xl p-1">
            <span className="text-xs text-rose-700 font-bold px-2">Sure?</span>
            <button onClick={handleDelete} className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg">
              <Check size={18} />
            </button>
            <button onClick={() => setDeleteConfirm(false)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg">
              <X size={18} />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setDeleteConfirm(true)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <Trash2 size={20} />
          </button>
        )}
      </header>

      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Session Complete</h1>
        <p className="text-lg font-bold text-blue-600 mb-1">
          {session.sourceType === 'all' ? 'All Words' : session.groupName || 'Deleted Group'}
        </p>
        <p className="text-sm text-slate-500 font-medium">
          {new Date(session.startedAt).toLocaleString('en-US', { 
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <div className="bg-slate-50 p-4 rounded-2xl text-center">
          <div className="text-2xl font-black text-slate-900">{session.totalAnswered}</div>
          <div className="text-xs font-bold uppercase mt-1 text-slate-500">Answered</div>
        </div>
        <div className="bg-emerald-50 p-4 rounded-2xl text-center">
          <div className="text-2xl font-black text-emerald-700">{session.correctCount}</div>
          <div className="text-xs font-bold uppercase mt-1 text-emerald-600">Correct</div>
        </div>
        <div className="bg-rose-50 p-4 rounded-2xl text-center">
          <div className="text-2xl font-black text-rose-700">{session.wrongCount}</div>
          <div className="text-xs font-bold uppercase mt-1 text-rose-600">Wrong</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-2xl text-center">
          <div className="text-2xl font-black text-blue-700">{accuracy}%</div>
          <div className="text-xs font-bold uppercase mt-1 text-blue-600">Accuracy</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-10">
        <button
          onClick={() => navigate('/')}
          className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-bold text-lg active:scale-[0.98]"
        >
          Back Home
        </button>
        <button
          onClick={() => navigate('/practice')}
          className="flex-1 bg-blue-50 text-blue-700 border-2 border-blue-100 py-4 rounded-xl font-bold text-lg active:scale-[0.98]"
        >
          Practice Again
        </button>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Mistakes</h2>
        
        {mistakes.length === 0 ? (
          <div className="bg-emerald-50 text-emerald-700 p-6 rounded-2xl text-center font-bold">
            Perfect session — no mistakes.
          </div>
        ) : (
          <div className="space-y-3">
            {mistakes.map(m => (
              <div key={m.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <span className="font-bold text-slate-900">{m.english}</span>
                <span className="text-slate-400 mx-2">→</span>
                <span className="text-slate-600 font-medium">{m.turkish}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
