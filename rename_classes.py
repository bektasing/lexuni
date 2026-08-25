import os
import re

MAPPINGS = {
    r'bg-slate-50(?![0-9])': 'bg-bg',
    r'bg-white': 'bg-surface',
    r'bg-slate-100': 'bg-surface-hover',
    r'bg-slate-200': 'bg-surface-hover',
    
    r'text-slate-900': 'text-tx',
    r'text-slate-800': 'text-tx',
    r'text-slate-700': 'text-tx-secondary',
    r'text-slate-600': 'text-tx-secondary',
    r'text-slate-500': 'text-tx-secondary',
    r'text-slate-400': 'text-tx-muted',
    r'text-slate-300': 'text-tx-muted',
    
    r'border-slate-100': 'border-border',
    r'border-slate-200': 'border-border',
    r'border-slate-300': 'border-border-strong',
    
    r'hover:bg-slate-100': 'hover:bg-surface-hover',
    r'hover:bg-slate-50': 'hover:bg-surface-hover',
    r'hover:bg-slate-200': 'hover:bg-border',
    
    r'active:bg-slate-50': 'active:bg-surface-hover',
    r'active:bg-slate-100': 'active:bg-border',
    
    r'hover:text-slate-900': 'hover:text-tx',
    r'hover:border-slate-300': 'hover:border-border-strong',
    
    r'bg-blue-600': 'bg-primary',
    r'bg-blue-500': 'bg-primary',
    r'bg-blue-700': 'bg-primary-hover',
    r'bg-blue-50(?![0-9])': 'bg-primary-soft',
    r'bg-blue-100': 'bg-primary-soft',
    
    r'text-blue-600': 'text-primary',
    r'text-blue-700': 'text-primary',
    r'text-blue-500': 'text-primary',
    r'text-blue-800': 'text-primary',
    r'text-blue-900': 'text-primary',
    
    r'border-blue-500': 'border-primary',
    r'border-blue-600': 'border-primary',
    r'border-blue-200': 'border-primary-soft',
    r'border-blue-100': 'border-primary-soft',
    
    r'ring-blue-500': 'ring-primary',
    r'ring-blue-100': 'ring-primary-soft',
    
    r'hover:bg-blue-50(?![0-9])': 'hover:bg-primary-soft',
    r'hover:bg-blue-100': 'hover:bg-primary-soft',
    r'hover:text-blue-600': 'hover:text-primary',
    
    r'hover:bg-blue-500': 'hover:bg-primary-hover',
    r'hover:bg-blue-700': 'hover:bg-primary-hover',
    
    r'active:bg-blue-700': 'active:bg-primary-hover',
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
