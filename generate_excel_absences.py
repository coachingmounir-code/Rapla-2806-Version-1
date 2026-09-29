import json

json_path = '/Users/macbook/Documents/GitHub/Rapla-2806-Version-1/rapla-frontend/src/lib/data/sevafrei_absences.json'
with open(json_path, 'r', encoding='utf-8') as f:
    absences = json.load(f)

ts_lines = []
for a in absences:
    if a['startDate'].startswith('2026-09') or a['startDate'].startswith('2026-10'):
        # Format it for EXCEL_ABSENCES
        excel_name = a['teacherName']
        if excel_name.lower() == 'burnie':
            excel_name = 'burnie'
            
        t_type = a['type']
        t_note = a['note']
        
        # type must match one of the allowed types as const
        # allowed: 'Urlaub' | 'Freizeitausgleich' | 'Krank' | 'Fortbildung' | 'Sonstiges' | 'Seminartage' | 'Seminarleitung' | 'Frei'
        
        ts_lines.append(f'  {{ excelName: "{excel_name}", startDate: "{a["startDate"]}", endDate: "{a["endDate"]}", type: "{t_type}" as const, status: "Genehmigt" as const, note: "{t_note}" }},')

# Read current excel_absences.ts
ts_path = '/Users/macbook/Documents/GitHub/Rapla-2806-Version-1/rapla-frontend/src/lib/excel_absences.ts'
with open(ts_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "];" in line:
        new_lines.extend([l + '\n' for l in ts_lines])
    new_lines.append(line)

with open(ts_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Added {len(ts_lines)} entries to EXCEL_ABSENCES")
