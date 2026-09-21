import os
import re

def check():
    for root, _, files in os.walk('src'):
        for file in files:
            if file.endswith('.jsx'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Find all buttons
                buttons = re.finditer(r'<button([^>]*)>(.*?)</button>', content, re.DOTALL)
                for b in buttons:
                    attrs = b.group(1)
                    inner = b.group(2).strip()
                    
                    if 'aria-label' not in attrs:
                        # Check if it has text
                        text_only = re.sub(r'<[^>]+>', '', inner).strip()
                        # If no readable text (>2 letters) but has an icon tag
                        if len(text_only) < 3 and re.search(r'<(svg|span|lucide|RefreshCw|UploadCloud)[^>]*>', inner, re.IGNORECASE):
                            print(f'Missing aria-label in {file}:\n<button{attrs}>{inner[:50]}...</button>\n')

if __name__ == '__main__':
    check()
