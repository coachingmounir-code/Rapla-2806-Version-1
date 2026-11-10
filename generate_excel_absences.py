import datetime
import json
import pandas as pd

XLSB_PATH = '/Users/macbook/Documents/GitHub/Rapla-2806-Version-1/Wochenplan Regeln/Urlaub Sevafrei/2026_sevafreieZeit_Urlaub_Nordsee.xlsb'
TS_OUT_PATH = '/Users/macbook/Documents/GitHub/Rapla-2806-Version-1/rapla-frontend/src/lib/excel_absences.ts'
JSON_OUT_PATH = '/Users/macbook/Documents/GitHub/Rapla-2806-Version-1/rapla-frontend/src/lib/data/sevafrei_absences.json'


def excel_date_to_datetime(val):
    if pd.notna(val) and isinstance(val, (int, float)) and 40000 < val < 50000:
        return datetime.datetime(1899, 12, 30) + datetime.timedelta(days=int(val))
    return None


# Active people mapping: raw key (Spiritueller Name or Vorname) -> (excelName, teacherId)
PERSON_MAP = {
    'Karuna Mayi': ('Karuna', 'teacher-gen-karuna-wapke'),
    'Pranava': ('Pranava', 'teacher-gen-pranava-pauly'),
    'Jyoti': ('Jyoti', 'teacher-gen-jyoti-rudolphi'),
    'Anjali': ('Anjali', 'teacher-gen-anjali-gelzleichter'),
    'Marlen': ('Marlen', 'teacher-karma-marlene'),
    'Melanie': ('Melanie', 'teacher-gen-melanie-vagt'),
    'Burnie': ('burnie', 'teacher-gen-burnie-bansemer'),
    'burnie': ('burnie', 'teacher-gen-burnie-bansemer'),
    'Nirmaya': ('Nirmaya', 'teacher-gen-nirmaya-fodor'),
    'Maitri': ('Maitri', 'teacher-gen-martina-schloms'),
    'Alexander': ('Alexander', 'teacher-gen-alexander-melior'),
    'Abha': ('Abha', 'teacher-gen-abha-morkoetter'),
    'Hu': ('Hu', 'teacher-gen-hu-buerkle'),
    'Shantara': ('Shantara', 'teacher-gen-shantara-nickler'),
    'Narayani': ('Narayani', 'teacher-gen-narayani-kedenburg'),
    'Mounir': ('Mounir', 'teacher-gen-mouniir-jaber'),
    'Satyam': ('Satyam', 'teacher-gen-satyam'),
    'Teresa': ('Teresa', 'teacher-gen-teresa-allgaeu'),
    'Suryani': ('Suryani', 'teacher-guest-1791278735445'),
    'Chandrashekara': ('Chandrashekara', 'teacher-gen-chandrashekara'),
    'Christopher': ('Christopher', 'teacher-gen-christopher'),
}

# Excluded / departed ex-team members per GEMINI.md & Austritt dates
IGNORED_RAW_NAMES = {'Adinatha', 'Linda', 'Ulrich', 'Harishakti', 'Adam'}

# Legend mapping from Excel sheet: code -> (type, status, note)
CODE_MAP = {
    'u': ('Urlaub', 'Genehmigt', 'Sevafrei'),
    'f': ('Frei', 'Genehmigt', 'Regulärer freier Wochentag'),
    's': ('Seminartage', 'Genehmigt', 'Seminartage'),
    'sl': ('Seminarleitung', 'Genehmigt', 'Seminarleitung / Seva außer Haus'),
    'k': ('Krank', 'Genehmigt', 'Krank'),
    'ü': ('Freizeitausgleich', 'Genehmigt', 'Ausgleich für Mehrarbeit'),
    'x': ('Sonstiges', 'Genehmigt', 'Sevafrei unbezahlt'),
    'z': ('Sonstiges', 'Genehmigt', 'SonderSevafrei'),
    'g': ('Urlaub', 'Ausstehend', 'Geplante Sevafreie Zeit'),
}


def main():
    df_h1 = pd.read_excel(XLSB_PATH, engine='pyxlsb', sheet_name='Jan_Juni', header=None)
    df_h2 = pd.read_excel(XLSB_PATH, engine='pyxlsb', sheet_name='Juli_Dez', header=None)

    stand_dt = excel_date_to_datetime(df_h1.iloc[1, 2]) or excel_date_to_datetime(df_h2.iloc[0, 2])
    stand_str = stand_dt.strftime('%Y-%m-%d') if stand_dt else '2026-11-03'

    dates_h1 = [(c, excel_date_to_datetime(df_h1.iloc[6, c])) for c in range(df_h1.shape[1])]
    dates_h1 = [(c, dt) for c, dt in dates_h1 if dt is not None]

    dates_h2 = [(c, excel_date_to_datetime(df_h2.iloc[5, c])) for c in range(df_h2.shape[1])]
    dates_h2 = [(c, dt) for c, dt in dates_h2 if dt is not None]

    # Collect per-person daily codes across the full calendar range
    person_order = []
    person_days = {}  # excelName -> { datetime: code }
    person_tid = {}

    for sheet_df, date_cols, start_row in [(df_h1, dates_h1, 8), (df_h2, dates_h2, 7)]:
        for r in range(start_row, sheet_df.shape[0]):
            nr = sheet_df.iloc[r, 0]
            if pd.isna(nr) or not isinstance(nr, (int, float)):
                continue
            sp = str(sheet_df.iloc[r, 1]).strip() if pd.notna(sheet_df.iloc[r, 1]) else ''
            vn = str(sheet_df.iloc[r, 2]).strip() if pd.notna(sheet_df.iloc[r, 2]) else ''
            raw_key = sp if sp else vn
            if not raw_key or raw_key in IGNORED_RAW_NAMES:
                continue
            if raw_key not in PERSON_MAP:
                print(f'[WARN] Unmapped person in Excel: {raw_key}')
                continue

            excel_name, teacher_id = PERSON_MAP[raw_key]
            if excel_name not in person_days:
                person_order.append(excel_name)
                person_days[excel_name] = {}
                person_tid[excel_name] = teacher_id

            for c, dt in date_cols:
                val = sheet_df.iloc[r, c]
                if pd.notna(val) and str(val).strip():
                    code = str(val).strip().lower()
                    if code in CODE_MAP:
                        person_days[excel_name][dt] = code

    # Apply mandatory GEMINI.md rules on top of raw Excel grid:
    # 1. Abha: From Nov 2026 onwards (2026-11-02..2026-12-31), Wednesday & Friday are her regular free days ('f');
    #    Sunday is NO LONGER a regular free day ('f'), though real absences (e.g. 'sl' 26.11.-01.12.) remain intact.
    if 'Abha' in person_days:
        cur = datetime.datetime(2026, 11, 2)
        end = datetime.datetime(2026, 12, 31)
        while cur <= end:
            existing = person_days['Abha'].get(cur)
            if cur.weekday() == 6 and existing == 'f':  # Sunday
                del person_days['Abha'][cur]
            elif cur.weekday() in (2, 4) and existing is None:  # Wednesday (2) & Friday (4)
                person_days['Abha'][cur] = 'f'
            cur += datetime.timedelta(days=1)

    # 2. Chandrashekara: Always Monday as regular free day ('f') from Nov 2026 onwards when no other absence is set.
    if 'Chandrashekara' in person_days:
        cur = datetime.datetime(2026, 11, 2)
        end = datetime.datetime(2026, 12, 31)
        while cur <= end:
            if cur.weekday() == 0 and person_days['Chandrashekara'].get(cur) is None:
                person_days['Chandrashekara'][cur] = 'f'
            cur += datetime.timedelta(days=1)

    # 3. Narayani in KW 47: Exceptionally takes her free day ('f') on Monday 2026-11-16 instead of Saturday 2026-11-14.
    if 'Narayani' in person_days:
        sat_w47 = datetime.datetime(2026, 11, 14)
        mon_w47 = datetime.datetime(2026, 11, 16)
        if person_days['Narayani'].get(sat_w47) == 'f':
            del person_days['Narayani'][sat_w47]
        person_days['Narayani'][mon_w47] = 'f'

    # Convert daily codes into contiguous blocks per person
    blocks = []
    for excel_name in person_order:
        tid = person_tid[excel_name]
        days_map = person_days[excel_name]
        sorted_dates = sorted(days_map.keys())
        cur_block = None

        for dt in sorted_dates:
            code = days_map[dt]
            atype, astatus, anote = CODE_MAP[code]
            if (
                cur_block
                and cur_block['code'] == code
                and cur_block['end_dt'] == dt - datetime.timedelta(days=1)
            ):
                cur_block['end_dt'] = dt
                cur_block['endDate'] = dt.strftime('%Y-%m-%d')
            else:
                if cur_block:
                    blocks.append(cur_block)
                cur_block = {
                    'code': code,
                    'teacherId': tid,
                    'excelName': excel_name,
                    'startDate': dt.strftime('%Y-%m-%d'),
                    'endDate': dt.strftime('%Y-%m-%d'),
                    'type': atype,
                    'status': astatus,
                    'note': anote,
                    'end_dt': dt,
                }
        if cur_block:
            blocks.append(cur_block)

    # Write rapla-frontend/src/lib/excel_absences.ts
    ts_lines = [
        f'// Auto-generated Excel absences data (Stand: {stand_str})\n',
        f'export const EXCEL_ABSENCES_STAND = "{stand_str}";\n',
        'export const EXCEL_ABSENCES = [\n',
    ]
    for b in blocks:
        ts_lines.append(
            f'  {{ teacherId: "{b["teacherId"]}", excelName: "{b["excelName"]}", '
            f'startDate: "{b["startDate"]}", endDate: "{b["endDate"]}", '
            f'type: "{b["type"]}" as const, status: "{b["status"]}" as const, note: "{b["note"]}" }},\n'
        )
    ts_lines.append('];\n')

    with open(TS_OUT_PATH, 'w', encoding='utf-8') as f:
        f.writelines(ts_lines)

    # Write rapla-frontend/src/lib/data/sevafrei_absences.json
    json_entries = []
    for idx, b in enumerate(blocks):
        json_entries.append({
            'id': f'excel-sf-{idx}',
            'teacherId': b['teacherId'],
            'teacherName': b['excelName'],
            'avatarColor': 'from-blue-400 to-indigo-500',
            'startDate': b['startDate'],
            'endDate': b['endDate'],
            'type': b['type'],
            'status': b['status'],
            'note': b['note'],
        })

    with open(JSON_OUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(json_entries, f, indent=2, ensure_ascii=False)

    print(f'Stand: {stand_str}')
    print(f'Generated {len(blocks)} absence blocks across {len(person_order)} people.')


if __name__ == '__main__':
    main()
