with open('src/pages/Practice.tsx', 'r') as f:
    content = f.read()

# Replace the incorrect modal placement
wrong_code = """    </div>\n\n      <Modal isOpen={!!alertMessage} onClose={() => setAlertMessage(null)} title="Warning">"""
correct_code = """\n      <Modal isOpen={!!alertMessage} onClose={() => setAlertMessage(null)} title="Warning">"""

content = content.replace(wrong_code, correct_code)

# Then we need to add back the `</div>` at the end
content = content.replace("      </Modal>\n  );\n}", "      </Modal>\n    </div>\n  );\n}")

with open('src/pages/Practice.tsx', 'w') as f:
    f.write(content)
