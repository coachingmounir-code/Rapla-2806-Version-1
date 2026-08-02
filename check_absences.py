import re
import datetime

with open('rapla-frontend/src/lib/excel_absences.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the objects. The lines look like:
# { excelName: "Abha", startDate: "2026-01-01", endDate: "2026-01-06", type: "Seminartage" as const, status: "Genehmigt" as const, note: "Seminartage" },
pattern = r'\{\s*excelName:\s*"([^"]+)",\s*startDate:\s*"([^"]+)",\s*endDate:\s*"([^"]+)",\s*type:\s*"([^"]+)"(?: as const)?,\s*status:\s*"([^"]+)"(?: as const)?,\s*note:\s*"([^"]*)"\s*\}'

matches = re.findall(pattern, content)

start_date = datetime.date(2026, 7, 31)
end_date = datetime.date(2026, 10, 1)

print(f"Checking absences from {start_date} to {end_date}:")
for match in matches:
    name, start_str, end_str, abs_type, status, note = match
    s_date = datetime.datetime.strptime(start_str, "%Y-%m-%d").date()
    e_date = datetime.datetime.strptime(end_str, "%Y-%m-%d").date()
    
    if s_date <= end_date and e_date >= start_date:
        # Check if type is Urlaub, Frei, Sevafrei, or anything that implies they are not there
        # The user says: "es sei denn die person ist nicht da bzw. hat sevafrei / urlaub."
        # If type is "Urlaub" or "x" (Sevafrei unbezahlt), "u" (Sevafrei), "z" (SonderSevafrei), etc.
        print(f"Teacher: {name:15} | {start_str} to {end_str} | Type: {abs_type:12} | Note: {note}")
