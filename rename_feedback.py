import os
import re

MAPPINGS = {
    r'bg-emerald-50(?![0-9])': 'bg-success-bg',
    r'text-emerald-700': 'text-success-tx',
    r'text-emerald-600': 'text-success-tx',
    r'border-emerald-100': 'border-success-border',
    r'border-emerald-200': 'border-success-border',
    
    r'bg-rose-50(?![0-9])': 'bg-danger-bg',
    r'text-rose-700': 'text-danger-tx',
    r'text-rose-600': 'text-danger-tx',
    r'border-rose-100': 'border-danger-border',
    r'border-rose-200': 'border-danger-border',
    
    r'hover:bg-rose-50(?![0-9])': 'hover:bg-danger-bg',
    r'hover:bg-rose-100': 'hover:bg-danger-bg',
    r'hover:text-rose-600': 'hover:text-danger-tx',
    
    r'bg-rose-600': 'bg-danger-btn',
    r'hover:bg-rose-500': 'hover:bg-danger-btn-hover',
    r'active:bg-rose-700': 'active:bg-danger-btn-hover',
}

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    new_content = content
    for pattern, replacement in MAPPINGS.items():
        new_content = re.sub(pattern, replacement, new_content)
        
    if content != new_content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('src'):
    for f in files:
        if f.endswith('.tsx'):
            process_file(os.path.join(root, f))
