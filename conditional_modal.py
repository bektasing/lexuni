import re

with open("src/pages/Settings.tsx", "r") as f:
    content = f.read()

# Replace the restore preview modal to be wrapped in {!restoreSuccess && ( ... )}
# Find the start of the preview modal
start_str = '      <Modal \n        isOpen={!!restorePreview}'
if start_str not in content:
    start_str = '      <Modal \n        isOpen={!!restorePreview} \n        onClose={() => { if (!isRestoring) setRestorePreview(null); }}'

# Let's just use regex
pattern = re.compile(r'(      <Modal \n        isOpen=\{\!\!restorePreview\}.*?      </Modal>)', re.DOTALL)

def replacer(match):
    return '      {!restoreSuccess && (\n' + match.group(1).replace('\n', '\n  ') + '\n      )}'

new_content = pattern.sub(replacer, content)

with open("src/pages/Settings.tsx", "w") as f:
    f.write(new_content)
