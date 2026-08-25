import re

with open('src/pages/Practice.tsx', 'r') as f:
    content = f.read()

# Add feedback state
state_pos = content.find("const [isExiting, setIsExiting] = useState(false);")
if state_pos != -1:
    content = content[:state_pos] + "const [isExiting, setIsExiting] = useState(false);\n  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);" + content[state_pos+50:]

# Replace handleAnswer
old_handle_answer = """    if (isCorrect) {
      setTimeout(() => setIsExiting(true), 250);
      
      setTimeout(async () => {
        setIsExiting(false);
        const latestSession = await db.sessions.get(activeSession.id);
        if (latestSession) {
          await generateNextQuestion(latestSession);
        }
      }, 450); 
    }"""
new_handle_answer = """    if (isCorrect) {
      setFeedback('correct');
      setTimeout(() => setIsExiting(true), 300);
      
      setTimeout(async () => {
        setIsExiting(false);
        setFeedback(null);
        const latestSession = await db.sessions.get(activeSession.id);
        if (latestSession) {
          await generateNextQuestion(latestSession);
        }
      }, 460); 
    } else {
      setFeedback('wrong');
    }"""
content = content.replace(old_handle_answer, new_handle_answer)

# Replace handleContinueAfterWrong
old_continue = """  const handleContinueAfterWrong = async () => {
    if (!activeSession) return;
    setIsExiting(true);
    
    setTimeout(async () => {
      setIsExiting(false);
      const latestSession = await db.sessions.get(activeSession.id);
      if (latestSession) {
        await generateNextQuestion(latestSession);
      }
    }, 200);
  };"""
new_continue = """  const handleContinueAfterWrong = async () => {
    if (!activeSession) return;
    setIsExiting(true);
    
    setTimeout(async () => {
      setIsExiting(false);
      setFeedback(null);
      const latestSession = await db.sessions.get(activeSession.id);
      if (latestSession) {
        await generateNextQuestion(latestSession);
      }
    }, 160);
  };"""
content = content.replace(old_continue, new_continue)

# We need to change the rendering of the question container to stagger and animate individually.
# First, let's find the current wrapper:
old_wrapper = """<main className="flex-1 flex flex-col p-6 sm:px-4 overflow-hidden">
          <div key={activeSession.currentWordId} className={`flex-1 flex flex-col w-full h-full ${isExiting ? 'motion-safe:animate-out motion-safe:fade-out motion-safe:slide-out-to-top-2 duration-200 ease-in' : 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 duration-300 ease-out'}`}>"""

new_wrapper = """<main className="flex-1 flex flex-col p-6 sm:px-4 overflow-hidden relative">
          {feedback && (
            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${feedback === 'correct' ? 'bg-[radial-gradient(ellipse_at_center,_var(--color-emerald-500)_0%,_transparent_60%)] opacity-[0.08]' : 'bg-[radial-gradient(ellipse_at_center,_var(--color-rose-500)_0%,_transparent_60%)] opacity-[0.08]'}`} />
          )}
          <div key={activeSession.currentWordId} className="flex-1 flex flex-col w-full h-full relative z-10">"""
content = content.replace(old_wrapper, new_wrapper)

# Update the word header animation
old_word_header = """<div className="flex-1 flex flex-col items-center justify-center mb-8">"""
new_word_header = """<div className={`flex-1 flex flex-col items-center justify-center mb-8 ${isExiting ? 'motion-safe:animate-out motion-safe:fade-out motion-safe:slide-out-to-top-4 duration-150' : 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 duration-200 ease-out'}`}>"""
content = content.replace(old_word_header, new_word_header)

# Optional micro feedback text
old_h1 = """<h1 className="text-4xl sm:text-5xl font-black text-tx text-center break-words max-w-full">
              {questionText}
            </h1>"""
new_h1 = """<h1 className="text-4xl sm:text-5xl font-black text-tx text-center break-words max-w-full">
              {questionText}
            </h1>
            {feedback === 'correct' && (
              <div className="text-success-tx font-bold text-sm uppercase tracking-widest mt-4 animate-in fade-in slide-in-from-bottom-1">Correct</div>
            )}
            {feedback === 'wrong' && (
              <div className="text-danger-tx font-bold text-sm uppercase tracking-widest mt-4 animate-in fade-in slide-in-from-bottom-1">Not quite</div>
            )}"""
content = content.replace(old_h1, new_h1)

# Update the map index and button classes
old_map = """{activeSession.currentOptions.map((optId) => {"""
new_map = """{activeSession.currentOptions.map((optId, i) => {"""
content = content.replace(old_map, new_map)

# Update btnClass logic
old_btnClass = """              if (isWaiting) {
                if (isCorrect) {
                  btnClass = "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-lg";
                } else if (isSelected && !isCorrect) {
                  btnClass = "bg-rose-500 border-rose-500 text-white shadow-lg shadow-lg";
                } else {
                  btnClass = "bg-surface border-2 border-border text-tx-muted opacity-50";
                }
              }"""
new_btnClass = """              if (isWaiting) {
                if (isCorrect) {
                  btnClass = "bg-emerald-500 border-emerald-500 text-white shadow-lg motion-safe:animate-correct-pulse z-10";
                } else if (isSelected && !isCorrect) {
                  btnClass = "bg-rose-500 border-rose-500 text-white shadow-lg motion-safe:animate-shake z-10";
                } else if (!isSelected && isCorrect) {
                  btnClass = "bg-emerald-500 border-emerald-500 text-white shadow-lg motion-safe:animate-correct-pulse z-10";
                } else {
                  btnClass = "bg-surface border-2 border-border text-tx-muted opacity-50";
                }
              }"""
content = content.replace(old_btnClass, new_btnClass)

# Update the button itself with stagger animation
old_btn = """<button
                  key={optId}
                  disabled={isWaiting}
                  onClick={() => handleAnswer(optId)}
                  className={`p-5 rounded-2xl font-bold text-lg text-left transition-all duration-200 flex items-center justify-between ${btnClass}`}
                >"""
new_btn = """<button
                  key={optId}
                  disabled={isWaiting}
                  onClick={() => handleAnswer(optId)}
                  className={`p-5 rounded-2xl font-bold text-lg text-left transition-all duration-200 flex items-center justify-between ${btnClass} ${isExiting ? 'motion-safe:animate-out motion-safe:fade-out motion-safe:slide-out-to-top-4 duration-150' : 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 duration-200 ease-out'}`}
                  style={isExiting ? {} : { animationDelay: `${i * 25}ms`, animationFillMode: 'both' }}
                >"""
content = content.replace(old_btn, new_btn)


with open('src/pages/Practice.tsx', 'w') as f:
    f.write(content)
