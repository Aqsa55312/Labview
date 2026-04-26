import os

replacements = {
    'className="min-h-screen bg-[#F8FAFC] dark:bg-[#0d1117] text-white': 'className="min-h-screen bg-[#F8FAFC] dark:bg-[#0d1117] text-[#1E293B] dark:text-[#f0f6ff] transition-colors duration-500',
    'className="min-h-screen bg-[#F8FAFC] dark:bg-[#0d1117] flex justify-center items-center text-white': 'className="min-h-screen bg-[#F8FAFC] dark:bg-[#0d1117] flex justify-center items-center text-[#1E293B] dark:text-[#f0f6ff] transition-colors duration-500',
    'text-white hover:text-[#1D9E75]': 'text-[#1E293B] dark:text-[#f0f6ff] hover:text-[#1D9E75] dark:hover:text-[#1D9E75]',
    'text-white text-sm font-medium tracking-wide': 'text-[#1E293B] dark:text-[#f0f6ff] text-sm font-medium tracking-wide',
    'text-xl font-bold tracking-tight mb-2 text-white': 'text-xl font-bold tracking-tight mb-2 text-[#1E293B] dark:text-[#f0f6ff]',
    'text-[11px] font-semibold tracking-wide text-white': 'text-[11px] font-semibold tracking-wide text-[#1E293B] dark:text-[#f0f6ff]',
    'text-sm font-black text-white': 'text-sm font-black text-[#1E293B] dark:text-[#f0f6ff]',
    'text-white font-black text-[10px] uppercase tracking-[0.2em]': 'text-[#1E293B] dark:text-[#f0f6ff] font-black text-[10px] uppercase tracking-[0.2em]',
    'hover:text-white transition-colors': 'hover:text-[#1E293B] dark:hover:text-[#f0f6ff] transition-colors',
    'text-3xl font-black text-white tracking-tight': 'text-3xl font-black text-[#1E293B] dark:text-[#f0f6ff] tracking-tight',
    'text-sm text-white focus:outline-none': 'text-sm text-[#1E293B] dark:text-[#f0f6ff] focus:outline-none',
    'font-bold text-white text-[13px] mb-2': 'font-bold text-[#1E293B] dark:text-[#f0f6ff] text-[13px] mb-2',
    'text-xs font-bold text-white shadow-sm': 'text-xs font-bold text-[#1E293B] dark:text-[#f0f6ff] shadow-sm',
    'hover:text-white cursor-pointer': 'hover:text-[#1E293B] dark:hover:text-[#f0f6ff] cursor-pointer'
}

files_to_update = ['src/pages/Login.jsx', 'src/pages/Register.jsx', 'src/pages/History.jsx', 'src/pages/Scan.jsx']

for relative_path in files_to_update:
    file_path = os.path.join(os.getcwd(), relative_path)
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        for old, new in replacements.items():
            content = content.replace(old, new)
            
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {relative_path}")
