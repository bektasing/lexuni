import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useNavigate } from 'react-router-dom';
import { Play, Import, BookOpen } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
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
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mb-6">
          <BookOpen size={40} strokeWidth={2} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Lexuni</h1>
        <h2 className="text-xl font-semibold mb-3">Your vocabulary is empty.</h2>
        <p className="text-slate-500 mb-8 max-w-sm">
          Import your first words and start practicing.
        </p>
        <button
          onClick={() => navigate('/import')}
          className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg flex items-center space-x-2 active:scale-95 transition-transform"
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

  return (
    <div className="p-6 pt-12 sm:pt-16 pb-24 max-w-2xl mx-auto">
      <header className="mb-10 text-center sm:text-left">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Lexuni</h1>
        <p className="text-lg text-slate-500 font-medium">Vocabulary Practice</p>
      </header>

      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-8">
        <div className="text-center mb-8">
          <div className="text-5xl font-black text-slate-900 mb-2">{totalWords}</div>
          <div className="text-slate-500 font-medium uppercase tracking-wider text-sm flex items-center justify-center space-x-2">
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
          <div className="text-center p-4 bg-slate-50 rounded-2xl">
            <div className="text-2xl font-bold text-emerald-600">{correct}</div>
            <div className="text-xs font-semibold text-slate-500 mt-1 uppercase">Correct</div>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-2xl">
            <div className="text-2xl font-bold text-rose-600">{wrong}</div>
            <div className="text-xs font-semibold text-slate-500 mt-1 uppercase">Wrong</div>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-2xl">
            <div className="text-2xl font-bold text-blue-600">{accuracy}%</div>
            <div className="text-xs font-semibold text-slate-500 mt-1 uppercase">Accuracy</div>
          </div>
        </div>

        {activeSession ? (
          <div className="mb-8 p-5 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1 flex items-center space-x-1">
                  <span className="relative flex h-2 w-2 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  Session in progress
                </div>
                <div className="font-bold text-amber-900 text-lg">
                  {activeSession.sourceType === 'all' ? 'All Words' : activeSession.groupName || 'Practice'}
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-amber-700 text-xl">{activeSession.totalAnswered} ans</div>
                <div className="text-sm font-semibold text-amber-600">
                  {activeSession.totalAnswered > 0 ? Math.round((activeSession.correctCount / activeSession.totalAnswered) * 100) : 0}% acc
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => navigate('/practice')}
                className="py-3 bg-amber-500 text-white font-bold rounded-xl active:bg-amber-600 shadow-sm"
              >
                Continue
              </button>
              <button 
                onClick={async () => {
                  await db.sessions.update(activeSession.id, { status: 'finished', finishedAt: new Date().toISOString() });
                  navigate(`/session/${activeSession.id}`);
                }}
                className="py-3 bg-white text-amber-700 border border-amber-200 font-bold rounded-xl active:bg-amber-100"
              >
                Finish
              </button>
            </div>
          </div>
        ) : lastSession ? (
          <div 
            onClick={() => navigate(`/session/${lastSession.id}`)}
            className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-2xl cursor-pointer hover:bg-blue-100 transition-colors flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Last Session</div>
              <div className="font-bold text-blue-900">
                {lastSession.sourceType === 'all' ? 'All Words' : lastSession.groupName || 'Practice'}
              </div>
            </div>
            <div className="text-right">
              <div className="font-black text-blue-700">{lastSession.totalAnswered} ans</div>
              <div className="text-sm font-semibold text-blue-600">
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
                    ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-lg shadow-blue-200' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Play fill={canPractice ? "currentColor" : "none"} size={22} />
                <span>Start Practice</span>
              </button>
              
              {!canPractice && (
                <p className="text-center text-sm text-amber-600 font-medium px-4">
                  At least 4 words are required to start practice.
                </p>
              )}
            </>
          )}

          <div className="grid grid-cols-2 gap-3 mt-2">
            <button
              onClick={() => navigate('/import')}
              className="flex items-center justify-center space-x-2 py-3.5 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-semibold active:bg-slate-50 transition-colors"
            >
              <Import size={20} />
              <span>Import Words</span>
            </button>
            <button
              onClick={() => navigate('/words')}
              className="flex items-center justify-center space-x-2 py-3.5 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-semibold active:bg-slate-50 transition-colors"
            >
              <BookOpen size={20} />
              <span>View All</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
