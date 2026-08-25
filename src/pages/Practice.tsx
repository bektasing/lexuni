import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useNavigate } from 'react-router-dom';
import { usePracticeStore } from '../stores/useStore';
import { X, Check, XCircle } from 'lucide-react';
import type { Word } from '../types';

export default function Practice() {
  const navigate = useNavigate();
  const words = useLiveQuery(() => db.words.toArray());
  const store = usePracticeStore();

  const [currentQuestion, setCurrentQuestion] = useState<Word | null>(null);
  const [options, setOptions] = useState<Word[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [lastWordId, setLastWordId] = useState<string | null>(null);

  const generateQuestion = useCallback(() => {
    if (!words || words.length < 4) return;

    let availableWords = words.filter(w => w.id !== lastWordId);
    if (availableWords.length === 0) availableWords = words; // fallback if only 1 word (though we require 4)

    const questionWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    
    // Pick 3 wrong answers
    const wrongAnswers = words.filter(w => w.id !== questionWord.id);
    const shuffledWrong = wrongAnswers.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    // Combine and shuffle
    const allOptions = [questionWord, ...shuffledWrong].sort(() => 0.5 - Math.random());

    setCurrentQuestion(questionWord);
    setOptions(allOptions);
    setSelectedOption(null);
    setIsWaiting(false);
  }, [words, lastWordId]);

  // Initial load
  useEffect(() => {
    if (words && words.length >= 4 && !currentQuestion) {
      generateQuestion();
    }
  }, [words, currentQuestion, generateQuestion]);

  // Cleanup session on unmount
  useEffect(() => {
    const reset = store.resetSession;
    return () => reset();
  }, [store.resetSession]);

  const handleAnswer = async (wordId: string) => {
    if (isWaiting || !currentQuestion) return;
    
    setSelectedOption(wordId);
    setIsWaiting(true);
    setLastWordId(currentQuestion.id);

    const isCorrect = wordId === currentQuestion.id;
    
    if (isCorrect) {
      store.incrementCorrect();
      await db.words.update(currentQuestion.id, { 
        correctCount: currentQuestion.correctCount + 1 
      });
      setTimeout(generateQuestion, 600);
    } else {
      store.incrementWrong();
      await db.words.update(currentQuestion.id, { 
        wrongCount: currentQuestion.wrongCount + 1 
      });
      setTimeout(generateQuestion, 1200);
    }
  };

  if (!words) return null; // loading

  if (words.length < 4) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mb-6">
          <XCircle size={40} strokeWidth={2} />
        </div>
        <h2 className="text-xl font-bold mb-2">Not enough words</h2>
        <p className="text-slate-500 mb-8">You need at least 4 words to practice.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-slate-900 text-white px-8 py-3 rounded-xl font-semibold"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="flex flex-col h-screen sm:h-[calc(100vh-2rem)] sm:pt-8 bg-slate-50">
      <header className="px-6 py-4 flex items-center justify-between bg-white border-b border-slate-200 shrink-0 sm:rounded-t-3xl sm:mx-4 sm:border sm:shadow-sm">
        <button 
          onClick={() => navigate('/')}
          className="p-2 -ml-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X size={24} />
        </button>
        <div className="flex space-x-4 text-sm font-bold">
          <div className="text-slate-500">{store.answered} answered</div>
          <div className="text-emerald-600">{store.correct} ✓</div>
          <div className="text-rose-600">{store.wrong} ✗</div>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-6 sm:px-4">
        <div className="flex-1 flex flex-col items-center justify-center mb-8">
          <div className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">What does this mean?</div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 text-center break-words max-w-full">
            {currentQuestion.english}
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-3 w-full max-w-md mx-auto">
          {options.map((option) => {
            const isSelected = selectedOption === option.id;
            const isCorrect = option.id === currentQuestion.id;
            
            let btnClass = "bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300 active:bg-slate-50";
            
            if (isWaiting) {
              if (isCorrect) {
                btnClass = "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200";
              } else if (isSelected && !isCorrect) {
                btnClass = "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200";
              } else {
                btnClass = "bg-white border-2 border-slate-100 text-slate-300 opacity-50";
              }
            }

            return (
              <button
                key={option.id}
                disabled={isWaiting}
                onClick={() => handleAnswer(option.id)}
                className={`p-5 rounded-2xl font-bold text-lg text-left transition-all duration-200 flex items-center justify-between ${btnClass}`}
              >
                <span>{option.turkish}</span>
                {isWaiting && isCorrect && <Check size={24} className="animate-in zoom-in" />}
                {isWaiting && isSelected && !isCorrect && <X size={24} className="animate-in zoom-in" />}
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
