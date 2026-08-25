with open('src/pages/Practice.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "const feedback = isWaiting" in line:
        # swap it with the next line
        lines[i], lines[i+1] = lines[i+1], lines[i]
        break

with open('src/pages/Practice.tsx', 'w') as f:
    f.writelines(lines)
