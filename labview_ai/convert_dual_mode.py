import os

replacements = {
    'bg-[#0d1117]': 'bg-[#F8FAFC] dark:bg-[#0d1117]',
    'bg-[#161d28]': 'bg-[#FFFFFF] dark:bg-[#161d28]',
    'bg-[#161d28]/90': 'bg-white/90 dark:bg-[#161d28]/90',
    'bg-[#0d1117]/90': 'bg-[#F8FAFC]/90 dark:bg-[#0d1117]/90',
    'border-[#1e2e40]': 'border-[#E2E8F0] dark:border-[#1e2e40]',
    'border-white/5': 'border-slate-100 dark:border-white/5',
    'text-[#f0f6ff]': 'text-[#1E293B] dark:text-[#f0f6ff]',
    'text-[#4a6080]': 'text-slate-500 dark:text-[#4a6080]'
}

files_to_update = ['src/pages/Login.jsx', 'src/pages/Register.jsx', 'src/pages/History.jsx', 'src/pages/Scan.jsx']

for relative_path in files_to_update:
    file_path = os.path.join(os.getcwd(), relative_path)
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Handle text-white that might need to be text-[#1E293B] dark:text-white 
        # CAUTION: Some text-white are inside teal buttons which SHOULD remain white. 
        # So it's best to only replace the exact hexes first.
        
        for old, new in replacements.items():
            content = content.replace(old, new)
            
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {relative_path}")
    else:
        print(f"Skipped {relative_path} (not found)")
