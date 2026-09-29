import json
import re
import datetime
import os

with open('correction.txt', 'r', encoding='utf-8') as f:
    text = f.read()

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
    'u': ('Urlaub', 'Sevafrei'),
    'f': ('Frei', 'Regulärer freier Tag'),
    's': ('Seminartage', 'Seminartage'),
    'ü': ('Freizeitausgleich', 'Ausgleich für Mehrarbeit'),
    'z': ('Sonstiges', 'SonderSevafrei'),
    'k': ('Krank', 'Krank'),
    'x': ('Sonstiges', 'Sevafrei unbezahlt'),
    'sl': ('Seminarleitung', 'Seminarleitung / Seva außer Haus')
}

lines = text.strip().split('\n')
current_person = None

absences = []
parsed_teacher_ids = set()

for line in lines:
    line = line.strip()
    if not line or line.startswith('=') or line.startswith('SEPTEMBER') or line.startswith('OKTOBER') or line.startswith('Monatssumme') or line.startswith('Keine Eintr') or line.startswith('GESAMT') or line.startswith('Karuna Mayi (Karuna Wapke):'):
        continue
    
    if '(' in line and ')' in line and not line[0].isdigit():
        current_person = line.split('(')[0].strip()
    elif line.isalpha() or ' ' in line and not line[0].isdigit():
        if ' ' in line:
            current_person = line.split()[0].strip()
            if current_person.lower() == 'marlen' or current_person.lower() == 'melanie': pass
        else:
            current_person = line.strip()

        if line == 'Alexander Melior': current_person = 'Alexander'
        elif line == 'Adam Zmuda': current_person = 'Adam'
        elif line == 'Teresa Maurer': current_person = 'Teresa'
        elif line == 'Marlen Posnien': current_person = 'Marlen'
        elif line == 'Melanie Vagt': current_person = 'Melanie'
        elif line == 'Christopher Mader': current_person = 'Christopher'
        elif line == 'Mounir Jaber': current_person = 'Mounir'

    if current_person:
        if current_person == 'Burnie':
            tid_name = 'burnie'
            name = 'burnie'
        else:
            tid_name = current_person
            name = current_person
            
        tid = teacher_id_map.get(tid_name, f"teacher-gen-{tid_name.lower().replace(' ', '-')}")
        parsed_teacher_ids.add(tid)
        
        # FIX REGEX
        # Match 1: DD.MM. or DD.MM.YYYY
        # Match 2: DD.MM.YYYY
        # Example 1: 06.09.–10.09.2026: Sevafrei [u]
        # Example 2: 02.09.2026: frei [f]
        m = re.search(r'^(\d{2}\.\d{2}\.(?:\d{4})?)(?:(?:–|-)(\d{2}\.\d{2}\.\d{4}))?.*\[(.*?)\]', line)
        if m:
            start_str = m.group(1)
            end_str = m.group(2) if m.group(2) else start_str
            code = m.group(3).lower()
            
            # If start_str is missing year, copy from end_str
            if len(start_str) == 6: # e.g. "06.09."
                year = end_str[-4:]
                start_str += year
                
            try:
                start_dt = datetime.datetime.strptime(start_str, '%d.%m.%Y')
                end_dt = datetime.datetime.strptime(end_str, '%d.%m.%Y')
                
                if code in type_map:
                    atype, anote = type_map[code]
                    
                    aid = f"sf-{name.lower().replace(' ', '-')}-{start_dt.strftime('%Y-%m-%d')}-{end_dt.strftime('%Y-%m-%d')}-{code}"
                    
                    absences.append({
                        'id': aid,
                        'teacherId': tid,
                        'teacherName': name,
                        'avatarColor': 'from-blue-400 to-indigo-500',
                        'startDate': start_dt.strftime('%Y-%m-%d'),
                        'endDate': end_dt.strftime('%Y-%m-%d'),
                        'type': atype,
                        'status': 'Genehmigt',
                        'note': anote
                    })
            except Exception as e:
                pass

json_path = '/Users/macbook/Documents/GitHub/Rapla-2806-Version-1/rapla-frontend/src/lib/data/sevafrei_absences.json'
if os.path.exists(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        existing = json.load(f)
else:
    existing = []

filtered = []
for ex in existing:
    try:
        dt = datetime.datetime.strptime(ex['startDate'], '%Y-%m-%d')
        is_sep_oct_2026 = (dt.year == 2026 and dt.month in [9, 10])
        if ex['teacherId'] in parsed_teacher_ids and is_sep_oct_2026:
            continue
    except:
        pass
    filtered.append(ex)

filtered.extend(absences)

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(filtered, f, indent=2, ensure_ascii=False)

print(f"Reprocessed! Inserted {len(absences)} blocks.")
