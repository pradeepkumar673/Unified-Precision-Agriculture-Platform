import re
import sys

def convert_to_lazy():
    with open('src/App.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add lazy and Suspense to imports
    if 'lazy' not in content:
        content = content.replace("import { useState, createContext, useContext, useEffect } from 'react';", "import { useState, createContext, useContext, useEffect, lazy, Suspense } from 'react';")

    # 2. Convert standard imports to lazy, EXCEPT core/splash/login
    exclude_list = ['SplashWelcomeScreen', 'PhoneNumberLogin', 'AppShell', 'MainLayout', 'FullscreenLayout']
    
    def replacer(match):
        component_name = match.group(1)
        import_path = match.group(2)
        if component_name in exclude_list:
            return match.group(0) # unchanged
        return f"const {component_name} = lazy(() => import('{import_path}'));"

    content = re.sub(r'import\s+([A-Za-z0-9_]+)\s+from\s+[\'"]([.\/a-zA-Z0-9_]+)[\'"];?', replacer, content)

    # 3. Wrap <Routes> with <Suspense>
    if '<Suspense' not in content:
        content = content.replace('<Routes>', '<Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background"><span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span></div>}>\n          <Routes>')
        content = content.replace('</Routes>', '</Routes>\n          </Suspense>')

    with open('src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    convert_to_lazy()
    print("Done")
