import re

with open('src/pages/Words.tsx', 'r') as f:
    content = f.read()

# Import AlertTriangle from lucide-react if not present
if "AlertTriangle" not in content:
    content = content.replace("Combine } from 'lucide-react';", "Combine, AlertTriangle } from 'lucide-react';")

# Add alertMessage state
state_pos = content.find("const [mergeNameInput, setMergeNameInput] = useState('');")
if state_pos != -1:
    content = content[:state_pos] + "const [mergeNameInput, setMergeNameInput] = useState('');\n  const [alertMessage, setAlertMessage] = useState<string | null>(null);" + content[state_pos+57:]

# Replace alerts
content = content.replace("alert('This English word already exists.');", "setAlertMessage('This English word already exists.');")
content = content.replace("alert('This group is currently being used by your active session. Finish the session first.');", "setAlertMessage('This group is currently being used by your active session. Finish the session first.');")
content = content.replace("alert('One of the selected groups is currently being used by your active session. Finish the session first.');", "setAlertMessage('One of the selected groups is currently being used by your active session. Finish the session first.');")

# Append Modal to the end
modal_code = """
      <Modal isOpen={!!alertMessage} onClose={() => setAlertMessage(null)} title="Warning">
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 bg-warning-bg text-warning-tx rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} />
          </div>
          <p className="text-tx font-medium">{alertMessage}</p>
          <button
            onClick={() => setAlertMessage(null)}
            className="w-full mt-4 px-4 py-3 bg-surface text-tx-secondary font-bold rounded-xl border border-border active:bg-bg"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}"""

content = content.replace("    </div>\n  );\n}", modal_code)

with open('src/pages/Words.tsx', 'w') as f:
    f.write(content)
