import re

with open('src/pages/Practice.tsx', 'r') as f:
    content = f.read()

# Remove setFeedback state
state_pos = content.find("const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);")
if state_pos != -1:
    content = content[:state_pos] + content[state_pos+77:]

# Replace isWaiting with derived feedbackState
is_waiting_pos = content.find("const isWaiting = !!(activeSession && activeSession.selectedOptionId);")
if is_waiting_pos != -1:
    old_waiting = "const isWaiting = !!(activeSession && activeSession.selectedOptionId);"
    new_waiting = """const isWaiting = !!(activeSession && activeSession.selectedOptionId);
  const selectedOptionId = activeSession?.selectedOptionId;
  const feedback = isWaiting && activeSession ? (selectedOptionId === activeSession.currentWordId ? 'correct' : 'wrong') : null;"""
    content = content.replace(old_waiting, new_waiting)

# Remove setFeedback from handleAnswer
content = content.replace("setFeedback('correct');", "")
content = content.replace("setFeedback(null);", "")
content = content.replace("} else {\n      setFeedback('wrong');\n    }", "}")
content = content.replace("} else {\n      \n    }", "")

# Fix handleContinueAfterWrong
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
    }, 160);
  };"""
content = content.replace(old_continue, new_continue)

with open('src/pages/Practice.tsx', 'w') as f:
    f.write(content)
