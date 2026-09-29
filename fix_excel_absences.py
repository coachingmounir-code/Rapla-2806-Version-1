import re

with open('rapla-frontend/src/lib/excel_absences.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    # Match startDate or endDate in 2026-09 or 2026-10
    if re.search(r'Date:\s*"2026-(09|10)-', line):
        continue
    new_lines.append(line)

with open('rapla-frontend/src/lib/excel_absences.ts', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
    
print(f"Removed {(len(lines) - len(new_lines))} entries from excel_absences.ts")
