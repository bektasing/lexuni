import re

with open('src/pages/Practice.tsx', 'r') as f:
    content = f.read()

# Add isExiting state
state_pos = content.find("const [alertMessage, setAlertMessage] = useState<string | null>(null);")
if state_pos != -1:
    content = content[:state_pos] + "const [alertMessage, setAlertMessage] = useState<string | null>(null);\n  const [isExiting, setIsExiting] = useState(false);" + content[state_pos+70:]

# Replace handleAnswer correct logic
old_handle_answer = """    if (isCorrect) {
      setTimeout(async () => {
        if (!activeSession) return;
        await db.sessions.update(activeSession.id, {
          currentWordId: undefined,
          currentDirection: undefined,
          currentOptions: undefined,
          selectedOptionId: undefined
        });
      }, 400); // Fast auto-advance for correct
    }"""
new_handle_answer = """    if (isCorrect) {
      setTimeout(() => setIsExiting(true), 250);
      
      setTimeout(async () => {
        setIsExiting(false);
        const latestSession = await db.sessions.get(activeSession.id);
        if (latestSession) {
          await generateNextQuestion(latestSession);
        }
      }, 450); 
    }"""
content = content.replace(old_handle_answer, new_handle_answer)

# Replace handleContinueAfterWrong logic
old_continue = """  const handleContinueAfterWrong = async () => {
    if (!activeSession) return;
    
    await db.sessions.update(activeSession.id, {
      currentWordId: undefined,
      currentDirection: undefined,
      currentOptions: undefined,
      selectedOptionId: undefined
    });
  };"""
new_continue = """  const handleContinueAfterWrong = async () => {
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
content = content.replace(old_continue, new_continue)

# Wrap <main> contents in animated div
main_start = content.find('<main className="flex-1 flex flex-col p-6 sm:px-4">')
if main_start != -1:
    # We replace <main className="..."> with <main className="... overflow-hidden">
    # Then add the wrapper div.
    content = content.replace('<main className="flex-1 flex flex-col p-6 sm:px-4">', '<main className="flex-1 flex flex-col p-6 sm:px-4 overflow-hidden">\n          <div key={activeSession.currentWordId} className={`flex-1 flex flex-col w-full h-full ${isExiting ? \'animate-out fade-out slide-out-to-top-2 duration-200 ease-in\' : \'animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out\'}`}>')
    
    # And we must close it before </main>
    # Wait, there are multiple </main> ? No, just one.
    content = content.replace('</main>', '</div>\n        </main>')

with open('src/pages/Practice.tsx', 'w') as f:
    f.write(content)
