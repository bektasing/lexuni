import re

with open('src/pages/Practice.tsx', 'r') as f:
    content = f.read()

# Add Modal and AlertTriangle imports
if "Modal" not in content:
    content = content.replace("import { useNavigate, useSearchParams } from 'react-router-dom';", "import { useNavigate, useSearchParams } from 'react-router-dom';\nimport Modal from '../components/Modal';")
if "AlertTriangle" not in content:
    content = content.replace("import { Play, ChevronLeft, ArrowRight, RotateCcw } from 'lucide-react';", "import { Play, ChevronLeft, ArrowRight, RotateCcw, AlertTriangle } from 'lucide-react';")

# Add alertMessage state
state_pos = content.find("const [searchParams] = useSearchParams();")
if state_pos != -1:
    content = content[:state_pos] + "const [searchParams] = useSearchParams();\n  const [alertMessage, setAlertMessage] = useState<string | null>(null);" + content[state_pos+41:]

# Replace alerts
content = content.replace("alert(\"You already have a session in progress. Please finish it first.\");", "setAlertMessage(\"You already have a session in progress. Please finish it first.\");")

# Append Modal to the end
modal_code = """
      <Modal isOpen={!!alertMessage} onClose={() => setAlertMessage(null)} title="Warning">
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 bg-warning-bg text-warning-tx rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} />
          </div>
          <p className="text-tx font-medium">{alertMessage}</p>
          <button
            onClick={() => {
              setAlertMessage(null);
              navigate('/');
            }}
            className="w-full mt-4 px-4 py-3 bg-surface text-tx-secondary font-bold rounded-xl border border-border active:bg-bg"
          >
            Go Back
          </button>
        </div>
      </Modal>
"""

# Find the last closing tag. It might be challenging if there are multiple.
# We'll just replace the final `  );\n}`
content = content.rsplit("  );\n}", 1)[0] + modal_code + "  );\n}"

with open('src/pages/Practice.tsx', 'w') as f:
    f.write(content)
