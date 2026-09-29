import json
import re
import datetime
import os

text = """
SEPTEMBER 2026
==================================================================

Karuna Mayi (Karuna Wapke)
  07.09.2026: frei [f] – 1 Tag
  14.09.2026: frei [f] – 1 Tag
  21.09.2026: frei [f] – 1 Tag
  28.09.–30.09.2026: frei [f] – 3 Tage
  Monatssumme: 6 markierte Tage; frei [f]: 6.

Pranava (Heinz Pauly)
  01.09.–02.09.2026: frei [f] – 2 Tage
  08.09.–09.09.2026: frei [f] – 2 Tage
  15.09.–16.09.2026: frei [f] – 2 Tage
  22.09.–23.09.2026: frei [f] – 2 Tage
  29.09.–30.09.2026: frei [f] – 2 Tage
  Monatssumme: 10 markierte Tage; frei [f]: 10.

Jyoti (Melanie Rudolphi)
  04.09.–05.09.2026: frei [f] – 2 Tage
  06.09.–10.09.2026: Sevafrei [u] – 5 Tage
  11.09.–12.09.2026: frei [f] – 2 Tage
  13.09.–16.09.2026: Ausgleich für Mehrarbeit [ü] – 4 Tage
  18.09.–19.09.2026: frei [f] – 2 Tage
  25.09.–26.09.2026: frei [f] – 2 Tage
  Monatssumme: 17 markierte Tage; Sevafrei [u]: 5; frei [f]: 8; Ausgleich für Mehrarbeit [ü]: 4.

Anjali (Magdalena Gelzleichter)
  02.09.2026: frei [f] – 1 Tag
  09.09.2026: frei [f] – 1 Tag
  16.09.2026: frei [f] – 1 Tag
  23.09.2026: frei [f] – 1 Tag
  30.09.2026: frei [f] – 1 Tag
  Monatssumme: 5 markierte Tage; frei [f]: 5.

Marlen Posnien
  Keine Einträge für diesen Monat.

Melanie Vagt
  01.09.2026: frei [f] – 1 Tag
  03.09.2026: frei [f] – 1 Tag
  05.09.–08.09.2026: frei [f] – 4 Tage
  10.09.2026: frei [f] – 1 Tag
  12.09.2026: frei [f] – 1 Tag
  14.09.–15.09.2026: frei [f] – 2 Tage
  17.09.2026: frei [f] – 1 Tag
  19.09.–22.09.2026: frei [f] – 4 Tage
  24.09.2026: frei [f] – 1 Tag
  26.09.–29.09.2026: frei [f] – 4 Tage
  Monatssumme: 20 markierte Tage; frei [f]: 20.

Burnie (Bernhard Bansemer)
  01.09.2026: frei [f] – 1 Tag
  05.09.2026: frei [f] – 1 Tag
  08.09.2026: frei [f] – 1 Tag
  12.09.2026: frei [f] – 1 Tag
  15.09.2026: frei [f] – 1 Tag
  19.09.2026: frei [f] – 1 Tag
  22.09.2026: frei [f] – 1 Tag
  26.09.2026: frei [f] – 1 Tag
  29.09.2026: frei [f] – 1 Tag
  Monatssumme: 9 markierte Tage; frei [f]: 9.

Nirmaya (Karin Fodor)
  01.09.–02.09.2026: frei [f] – 2 Tage
  08.09.–09.09.2026: frei [f] – 2 Tage
  10.09.–13.09.2026: SonderSevafrei [z] – 4 Tage
  15.09.–16.09.2026: frei [f] – 2 Tage
  22.09.–23.09.2026: frei [f] – 2 Tage
  29.09.–30.09.2026: frei [f] – 2 Tage
  Monatssumme: 14 markierte Tage; frei [f]: 10; SonderSevafrei [z]: 4.

Maitri (Martina Schloms)
  01.09.–13.09.2026: Kürzel k (in der Legende nicht erklärt) [k] – 13 Tage
  Monatssumme: 13 markierte Tage; Kürzel k (in der Legende nicht erklärt) [k]: 13.

Alexander Melior
  06.09.–07.09.2026: frei [f] – 2 Tage
  13.09.–14.09.2026: frei [f] – 2 Tage
  20.09.–21.09.2026: frei [f] – 2 Tage
  27.09.–28.09.2026: frei [f] – 2 Tage
  Monatssumme: 8 markierte Tage; frei [f]: 8.

Abha (Ann-Katrin Morkötter)
  02.09.2026: frei [f] – 1 Tag
  06.09.2026: frei [f] – 1 Tag
  09.09.2026: frei [f] – 1 Tag
  13.09.2026: frei [f] – 1 Tag
  16.09.2026: frei [f] – 1 Tag
  20.09.–21.09.2026: Ausgleich für Mehrarbeit [ü] – 2 Tage
  23.09.2026: frei [f] – 1 Tag
  27.09.2026: frei [f] – 1 Tag
  30.09.2026: frei [f] – 1 Tag
  Monatssumme: 10 markierte Tage; frei [f]: 8; Ausgleich für Mehrarbeit [ü]: 2.

Hu (Katja Bürkle)
  01.09.2026: frei [f] – 1 Tag
  08.09.2026: frei [f] – 1 Tag
  15.09.2026: frei [f] – 1 Tag
  22.09.2026: frei [f] – 1 Tag
  29.09.2026: frei [f] – 1 Tag
  Monatssumme: 5 markierte Tage; frei [f]: 5.

Shantara (Jessica Nickler)
  Keine Einträge für diesen Monat.

Adam Zmuda
  01.09.2026: frei [f] – 1 Tag
  08.09.2026: frei [f] – 1 Tag
  15.09.2026: frei [f] – 1 Tag
  22.09.2026: frei [f] – 1 Tag
  29.09.2026: frei [f] – 1 Tag
  Monatssumme: 5 markierte Tage; frei [f]: 5.

Narayani (Katja Kedenburg)
  05.09.2026: frei [f] – 1 Tag
  12.09.2026: frei [f] – 1 Tag
  18.09.2026: Sevafrei [u] – 1 Tag
  19.09.2026: frei [f] – 1 Tag
  20.09.2026: Sevafrei [u] – 1 Tag
  26.09.2026: frei [f] – 1 Tag
  Monatssumme: 6 markierte Tage; Sevafrei [u]: 2; frei [f]: 4.

Mounir Jaber
  07.09.2026: frei [f] – 1 Tag
  12.09.–13.09.2026: Seminartage [s] – 2 Tage
  14.09.2026: frei [f] – 1 Tag
  15.09.–20.09.2026: Seminartage [s] – 6 Tage
  21.09.2026: frei [f] – 1 Tag
  22.09.–26.09.2026: Sevafrei [u] – 5 Tage
  28.09.2026: frei [f] – 1 Tag
  Monatssumme: 17 markierte Tage; Sevafrei [u]: 5; Seminartage [s]: 8; frei [f]: 4.

Harishakti (Ramona Gäpler)
  02.09.2026: frei [f] – 1 Tag
  09.09.2026: frei [f] – 1 Tag
  16.09.2026: frei [f] – 1 Tag
  23.09.2026: frei [f] – 1 Tag
  30.09.2026: frei [f] – 1 Tag
  Monatssumme: 5 markierte Tage; frei [f]: 5.

Satyam (Jens Paasche)
  21.09.2026: frei [f] – 1 Tag
  28.09.2026: frei [f] – 1 Tag
  29.09.–30.09.2026: Sevafrei [u] – 2 Tage
  Monatssumme: 4 markierte Tage; Sevafrei [u]: 2; frei [f]: 2.

Teresa Maurer
  Keine Einträge für diesen Monat.

Suryani (Justyna)
  Keine Einträge für diesen Monat.

Chandrashekara (Frank Burandt)
  Keine Einträge für diesen Monat.

Christopher Mader
  02.09.2026: frei [f] – 1 Tag
  09.09.2026: frei [f] – 1 Tag
  16.09.2026: frei [f] – 1 Tag
  23.09.2026: frei [f] – 1 Tag
  30.09.2026: frei [f] – 1 Tag
  Monatssumme: 5 markierte Tage; frei [f]: 5.

==================================================================
OKTOBER 2026
==================================================================

Karuna Mayi (Karuna Wapke)
  05.10.2026: frei [f] – 1 Tag
  12.10.2026: frei [f] – 1 Tag
  15.10.–16.10.2026: frei [f] – 2 Tage
  19.10.2026: frei [f] – 1 Tag
  26.10.2026: frei [f] – 1 Tag
  Monatssumme: 6 markierte Tage; frei [f]: 6.

Pranava (Heinz Pauly)
  06.10.–07.10.2026: frei [f] – 2 Tage
  13.10.–14.10.2026: frei [f] – 2 Tage
  20.10.–21.10.2026: frei [f] – 2 Tage
  27.10.–28.10.2026: frei [f] – 2 Tage
  Monatssumme: 8 markierte Tage; frei [f]: 8.

Jyoti (Melanie Rudolphi)
  02.10.–03.10.2026: frei [f] – 2 Tage
  09.10.–10.10.2026: frei [f] – 2 Tage
  16.10.–17.10.2026: frei [f] – 2 Tage
  23.10.–24.10.2026: frei [f] – 2 Tage
  30.10.–31.10.2026: frei [f] – 2 Tage
  Monatssumme: 10 markierte Tage; frei [f]: 10.

Anjali (Magdalena Gelzleichter)
  07.10.2026: frei [f] – 1 Tag
  14.10.2026: frei [f] – 1 Tag
  21.10.2026: frei [f] – 1 Tag
  28.10.2026: frei [f] – 1 Tag
  Monatssumme: 4 markierte Tage; frei [f]: 4.

Marlen Posnien
  Keine Einträge für diesen Monat.

Melanie Vagt
  01.10.2026: frei [f] – 1 Tag
  03.10.–06.10.2026: frei [f] – 4 Tage
  08.10.2026: frei [f] – 1 Tag
  10.10.–13.10.2026: frei [f] – 4 Tage
  15.10.2026: frei [f] – 1 Tag
  17.10.–20.10.2026: frei [f] – 4 Tage
  Monatssumme: 15 markierte Tage; frei [f]: 15.

Burnie (Bernhard Bansemer)
  03.10.2026: frei [f] – 1 Tag
  06.10.2026: frei [f] – 1 Tag
  10.10.2026: frei [f] – 1 Tag
  13.10.2026: frei [f] – 1 Tag
  17.10.2026: frei [f] – 1 Tag
  20.10.2026: frei [f] – 1 Tag
  24.10.2026: frei [f] – 1 Tag
  27.10.2026: frei [f] – 1 Tag
  31.10.2026: frei [f] – 1 Tag
  Monatssumme: 9 markierte Tage; frei [f]: 9.

Nirmaya (Karin Fodor)
  06.10.–07.10.2026: frei [f] – 2 Tage
  13.10.–14.10.2026: frei [f] – 2 Tage
  20.10.–21.10.2026: frei [f] – 2 Tage
  27.10.–28.10.2026: frei [f] – 2 Tage
  Monatssumme: 8 markierte Tage; frei [f]: 8.

Maitri (Martina Schloms)
  Keine Einträge für diesen Monat.

Alexander Melior
  04.10.–05.10.2026: frei [f] – 2 Tage
  11.10.–12.10.2026: frei [f] – 2 Tage
  18.10.–19.10.2026: frei [f] – 2 Tage
  25.10.–26.10.2026: frei [f] – 2 Tage
  Monatssumme: 8 markierte Tage; frei [f]: 8.

Abha (Ann-Katrin Morkötter)
  04.10.2026: frei [f] – 1 Tag
  07.10.2026: frei [f] – 1 Tag
  09.10.–10.10.2026: Sevafrei [u] – 2 Tage
  11.10.2026: frei [f] – 1 Tag
  12.10.–13.10.2026: Seminartage [s] – 2 Tage
  14.10.2026: frei [f] – 1 Tag
  15.10.2026: Sevafrei [u] – 1 Tag
  16.10.–17.10.2026: Seminartage [s] – 2 Tage
  18.10.2026: frei [f] – 1 Tag
  19.10.–24.10.2026: Seminartage [s] – 6 Tage
  25.10.2026: frei [f] – 1 Tag
  28.10.2026: frei [f] – 1 Tag
  Monatssumme: 20 markierte Tage; Sevafrei [u]: 3; Seminartage [s]: 10; frei [f]: 7.

Hu (Katja Bürkle)
  06.10.2026: frei [f] – 1 Tag
  13.10.2026: frei [f] – 1 Tag
  19.10.2026: Seminartage [s] – 1 Tag
  20.10.2026: frei [f] – 1 Tag
  21.10.–26.10.2026: Seminartage [s] – 6 Tage
  27.10.2026: frei [f] – 1 Tag
  28.10.–30.10.2026: Seminartage [s] – 3 Tage
  31.10.2026: Sevafrei unbezahlt [x] – 1 Tag
  Monatssumme: 15 markierte Tage; Seminartage [s]: 10; frei [f]: 4; Sevafrei unbezahlt [x]: 1.

Shantara (Jessica Nickler)
  Keine Einträge für diesen Monat.

Adam Zmuda
  06.10.2026: frei [f] – 1 Tag
  13.10.2026: frei [f] – 1 Tag
  20.10.2026: frei [f] – 1 Tag
  27.10.2026: frei [f] – 1 Tag
  Monatssumme: 4 markierte Tage; frei [f]: 4.

Narayani (Katja Kedenburg)
  03.10.2026: frei [f] – 1 Tag
  10.10.2026: frei [f] – 1 Tag
  17.10.2026: frei [f] – 1 Tag
  18.10.–23.10.2026: Seminartage [s] – 6 Tage
  24.10.2026: frei [f] – 1 Tag
  31.10.2026: frei [f] – 1 Tag
  Monatssumme: 11 markierte Tage; Seminartage [s]: 6; frei [f]: 5.

Mounir Jaber
  05.10.2026: frei [f] – 1 Tag
  12.10.2026: frei [f] – 1 Tag
  19.10.2026: frei [f] – 1 Tag
  26.10.2026: frei [f] – 1 Tag
  Monatssumme: 4 markierte Tage; frei [f]: 4.

Harishakti (Ramona Gäpler)
  07.10.2026: frei [f] – 1 Tag
  14.10.2026: frei [f] – 1 Tag
  15.10.2026: Sevafrei [u] – 1 Tag
  18.10.–20.10.2026: Sevafrei [u] – 3 Tage
  21.10.2026: frei [f] – 1 Tag
  22.10.–24.10.2026: Sevafrei [u] – 3 Tage
  25.10.–30.10.2026: Seminartage [s] – 6 Tage
  31.10.2026: frei [f] – 1 Tag
  Monatssumme: 17 markierte Tage; Sevafrei [u]: 7; Seminartage [s]: 6; frei [f]: 4.

Satyam (Jens Paasche)
  01.10.–04.10.2026: Sevafrei [u] – 4 Tage
  05.10.2026: frei [f] – 1 Tag
  12.10.2026: frei [f] – 1 Tag
  19.10.2026: frei [f] – 1 Tag
  26.10.2026: frei [f] – 1 Tag
  Monatssumme: 8 markierte Tage; Sevafrei [u]: 4; frei [f]: 4.

Teresa Maurer
  Keine Einträge für diesen Monat.

Suryani (Justyna)
  Keine Einträge für diesen Monat.

Chandrashekara (Frank Burandt)
  Keine Einträge für diesen Monat.

Christopher Mader
  07.10.2026: frei [f] – 1 Tag
  14.10.2026: frei [f] – 1 Tag
  21.10.2026: frei [f] – 1 Tag
  28.10.2026: frei [f] – 1 Tag
  31.10.2026: Sevafrei [u] – 1 Tag
  Monatssumme: 5 markierte Tage; Sevafrei [u]: 1; frei [f]: 4.
"""

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

# Process line by line
for line in lines:
    line = line.strip()
    if not line or line.startswith('=') or line.startswith('SEPTEMBER') or line.startswith('OKTOBER') or line.startswith('Monatssumme') or line.startswith('Keine Eintr'):
        continue
    
    # Check if line is a person name
    if '(' in line and ')' in line and not line.startswith(('[', '0', '1', '2', '3')):
        # E.g., Karuna Mayi (Karuna Wapke)
        current_person = line.split('(')[0].strip()
    elif line.isalpha() or ' ' in line and not line[0].isdigit():
        # E.g., Marlen Posnien, Melanie Vagt
        if ' ' in line:
            current_person = line.split()[0].strip() # just take first name unless mapped
            if current_person.lower() == 'marlen' or current_person.lower() == 'melanie':
                pass # valid
            
        else:
            current_person = line.strip()

        # Handle specific multi-word names without parens
        if line == 'Alexander Melior': current_person = 'Alexander'
        elif line == 'Adam Zmuda': current_person = 'Adam'
        elif line == 'Teresa Maurer': current_person = 'Teresa'
        elif line == 'Marlen Posnien': current_person = 'Marlen'
        elif line == 'Melanie Vagt': current_person = 'Melanie'
        elif line == 'Christopher Mader': current_person = 'Christopher'
        elif line == 'Mounir Jaber': current_person = 'Mounir'

    if current_person:
        # Resolve tid
        if current_person == 'Burnie':
            tid_name = 'burnie'
            name = 'burnie'
        else:
            tid_name = current_person
            name = current_person
            
        tid = teacher_id_map.get(tid_name, f"teacher-gen-{tid_name.lower().replace(' ', '-')}")
        parsed_teacher_ids.add(tid)
        
        # Check if line is a date line
        # E.g., 07.09.2026: frei [f] – 1 Tag
        # E.g., 28.09.–30.09.2026: frei [f] – 3 Tage
        m = re.search(r'^(\d{2}\.\d{2}\.\d{4})(?:–(\d{2}\.\d{2}\.\d{4}))?.*\[(.*?)\]', line)
        if m:
            start_str = m.group(1)
            end_str = m.group(2) if m.group(2) else start_str
            code = m.group(3).lower()
            
            # format to YYYY-MM-DD
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
                print(f"Error parsing date line: {line} - {e}")

json_path = '/Users/macbook/Documents/GitHub/Rapla-2806-Version-1/rapla-frontend/src/lib/data/sevafrei_absences.json'
if os.path.exists(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        existing = json.load(f)
else:
    existing = []

# Remove old Sep/Oct entries for all parsed persons
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

print(f"Processed the corrected input! Total inserted blocks for Sep/Oct: {len(absences)}")
