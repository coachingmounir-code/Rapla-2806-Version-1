import pandas as pd
import json
import datetime
import os

def excel_date_to_datetime(excel_date):
    return datetime.datetime(1899, 12, 30) + datetime.timedelta(days=int(excel_date))

xlsb_path = '/Users/macbook/Documents/GitHub/Rapla-2806-Version-1/Wochenplan Regeln/Urlaub Sevafrei/2026_sevafreieZeit_Urlaub_Nordsee.xlsb'
df = pd.read_excel(xlsb_path, engine='pyxlsb', sheet_name='Juli_Dez')

date_cols = []
date_row = df.iloc[4]
for col_idx, val in enumerate(date_row):
    if pd.notna(val) and isinstance(val, (int, float)):
        try:
            dt = excel_date_to_datetime(val)
            if dt.year == 2026 and dt.month in [9, 10]:
                date_cols.append((col_idx, dt))
        except:
            pass

ignored = ['Adinatha', 'Linda', 'Ulrich']
teacher_id_map = {
    'Abha': 'teacher-gen-abha-morkoetter',
    'Adam': 'teacher-gen-adam-zmuda',
    'Alexander': 'teacher-gen-alexander-melior',
    'Anjali': 'teacher-gen-anjali-gelzleichter',
    'Burnie': 'teacher-gen-burnie-bansemer',
    'Chandrashekara': 'teacher-gen-chandrashekara',
    'Hu': 'teacher-gen-hu-buerkle',
    'Karuna Mayi': 'teacher-gen-karuna-wapke',
    'Mounir': 'teacher-gen-mouniir-jaber',
    'Narayani': 'teacher-gen-narayani-kedenburg',
    'Nirmaya': 'teacher-gen-nirmaya-fodor',
    'Pranava': 'teacher-gen-pranava-pauly',
    'Teresa': 'teacher-gen-teresa-allgaeu',
    'Harishakti': 'teacher-gen-harishakti',
    'Christopher': 'teacher-gen-christopher'
}

type_map = {
    'u': ('Urlaub', 'Urlaub'),
    'f': ('Frei', 'Sevafrei'),
    's': ('Seminartage', 'Seminartage'),
    'k': ('Krank', 'Krank'),
    'sl': ('Seminarleitung', 'Seminarleitung / Seva außer Haus')
}

absences = []
parsed_teacher_ids = set()

for row_idx in range(6, len(df)):
    sp_name = df.iloc[row_idx, 1]
    vorname = df.iloc[row_idx, 2]
    
    if pd.isna(sp_name) and pd.isna(vorname):
        continue
        
    name = str(sp_name).strip() if pd.notna(sp_name) else str(vorname).strip()
    if name.lower() == 'burnie':
        name = 'burnie'
    
    if name in ignored or name.lower() == 'nan':
        continue
        
    tid = teacher_id_map.get(name, f"teacher-gen-{name.lower().replace(' ', '-')}")
    parsed_teacher_ids.add(tid)
    
    current_block = None
    
    for col_idx, dt in date_cols:
        val = str(df.iloc[row_idx, col_idx]).strip().lower()
        
        if val in type_map:
            atype, anote = type_map[val]
            
            if current_block and current_block['note'] == anote and current_block['end_dt'] == dt - datetime.timedelta(days=1):
                current_block['end_dt'] = dt
                current_block['endDate'] = dt.strftime('%Y-%m-%d')
            else:
                if current_block:
                    absences.append(current_block)
                current_block = {
                    'teacherId': tid,
                    'teacherName': name,
                    'avatarColor': 'from-blue-400 to-indigo-500',
                    'startDate': dt.strftime('%Y-%m-%d'),
                    'endDate': dt.strftime('%Y-%m-%d'),
                    'type': atype,
                    'status': 'Genehmigt',
                    'note': anote,
                    'start_dt': dt,
                    'end_dt': dt
                }
        else:
            if current_block:
                absences.append(current_block)
                current_block = None
                
    if current_block:
        absences.append(current_block)

final_absences = []
for a in absences:
    aid = f"sf-{a['teacherName'].lower().replace(' ', '-')}-{a['startDate']}-{a['endDate']}-{a['type'].lower()}"
    final_absences.append({
        'id': aid,
        'teacherId': a['teacherId'],
        'teacherName': a['teacherName'],
        'avatarColor': a['avatarColor'],
        'startDate': a['startDate'],
        'endDate': a['endDate'],
        'type': a['type'],
        'status': a['status'],
        'note': a['note']
    })

json_path = '/Users/macbook/Documents/GitHub/Rapla-2806-Version-1/rapla-frontend/src/lib/data/sevafrei_absences.json'
if os.path.exists(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        existing = json.load(f)
else:
    existing = []

# Filter out old entries for parsed teachers in Sep/Oct
filtered = []
for ex in existing:
    try:
        dt = datetime.datetime.strptime(ex['startDate'], '%Y-%m-%d')
        is_sep_oct_2026 = (dt.year == 2026 and dt.month in [9, 10])
        if ex['teacherId'] in parsed_teacher_ids and is_sep_oct_2026:
            continue # drop it, we will replace it
    except:
        pass
    filtered.append(ex)

filtered.extend(final_absences)

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(filtered, f, indent=2, ensure_ascii=False)

print(f"Replaced Sep/Oct absences. New total blocks for Sep/Oct: {len(final_absences)}")
