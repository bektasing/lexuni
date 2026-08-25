import re

with open('src/pages/Import.tsx', 'r') as f:
    content = f.read()

# Add Modal import
content = content.replace("import { useNavigate } from 'react-router-dom';", "import { useNavigate } from 'react-router-dom';\nimport Modal from '../components/Modal';")

# Add state for importSuccess
state_insert_pos = content.find("const [copied, setCopied] = useState(false);")
if state_insert_pos != -1:
    content = content[:state_insert_pos] + "const [copied, setCopied] = useState(false);\n  const [importSuccess, setImportSuccess] = useState<{ count: number, duplicates: number, groupName: string, groupId: string } | null>(null);" + content[state_insert_pos+44:]

# Replace alert with state update
handle_import_replace = """    setInput('');
    setPreview(null);
    setImportSuccess({
      count: validWords.length,
      duplicates: duplicateCount,
      groupName: groupName,
      groupId: groupId
    });
  };"""

content = re.sub(r"    setInput\(''\);\n    setPreview\(null\);\n    alert\(`Successfully imported \${validWords\.length} words to group \"\${groupName}\"!`\);\n    navigate\('/words'\);\n  };", handle_import_replace, content)

# Add Modal at the end of the return statement
modal_code = """
      <Modal 
        isOpen={!!importSuccess} 
        onClose={() => setImportSuccess(null)} 
        title="Import Complete"
      >
        {importSuccess && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-success-bg text-success-tx rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-2xl font-bold text-tx mb-2">{importSuccess.count} words added</h3>
              <p className="text-tx-secondary font-medium mb-1">{importSuccess.groupName}</p>
              {importSuccess.duplicates > 0 && (
                <p className="text-tx-muted text-sm mt-2">{importSuccess.duplicates} duplicates skipped</p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setImportSuccess(null)}
                className="flex-1 px-4 py-3 bg-surface text-tx-secondary font-bold rounded-xl border border-border active:bg-bg"
              >
                Done
              </button>
              <button
                onClick={() => {
                  navigate(`/words`);
                }}
                className="flex-1 px-4 py-3 bg-primary text-white font-bold rounded-xl active:bg-primary-hover"
              >
                View Group
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}"""

content = content.replace("    </div>\n  );\n}", modal_code)

with open('src/pages/Import.tsx', 'w') as f:
    f.write(content)
