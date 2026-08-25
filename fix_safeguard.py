import re

with open('src/pages/Practice.tsx', 'r') as f:
    content = f.read()

safeguard_code = """
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
"""

# Insert right before startSession
start_pos = content.find("  const startSession = async")
if start_pos != -1:
    content = content[:start_pos] + safeguard_code + "\n" + content[start_pos:]

with open('src/pages/Practice.tsx', 'w') as f:
    f.write(content)
