import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    new_content = content
    # Replace solid buttons
    new_content = new_content.replace('bg-slate-900 text-white', 'bg-tx text-bg')
    
    # Remove colored shadows
    new_content = re.sub(r'shadow-blue-[0-9]+', 'shadow-lg', new_content)
    new_content = re.sub(r'shadow-emerald-[0-9]+', 'shadow-lg', new_content)
    new_content = re.sub(r'shadow-rose-[0-9]+', 'shadow-lg', new_content)
    
    if content != new_content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('src'):
    for f in files:
        if f.endswith('.tsx'):
            process_file(os.path.join(root, f))
