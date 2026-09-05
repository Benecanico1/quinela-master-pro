import os
import json

target = ['13', '20', '07', '55', '63']

for root, dirs, files in os.walk('.'):
    if any(x in root for x in ['node_modules', '.git', 'dist', 'build']):
        continue
    for f in files:
        if f.endswith(('.json', '.js', '.jsx', '.py')):
            p = os.path.join(root, f)
            try:
                with open(p, 'r', encoding='utf-8', errors='ignore') as fl:
                    content = fl.read()
                    if all(t in content for t in target):
                        # check if they are within 500 chars of each other
                        for i in range(len(content) - 1000):
                            window = content[i:i+1000]
                            if all(t in window for t in target):
                                print(f"Found in {p} at {i}: {window[:200]}...")
                                break
            except Exception:
                pass
