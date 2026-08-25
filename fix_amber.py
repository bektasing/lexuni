import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    new_content = content
    new_content = re.sub(r'bg-amber-50(?![0-9])', 'bg-warning-bg', new_content)
    new_content = re.sub(r'text-amber-[67]00', 'text-warning-tx', new_content)
    new_content = re.sub(r'text-amber-500', 'text-warning-tx', new_content)
    
    if content != new_content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('src'):
    for f in files:
        if f.endswith('.tsx'):
            process_file(os.path.join(root, f))
