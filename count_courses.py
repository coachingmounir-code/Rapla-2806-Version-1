import re

with open('rapla-frontend/src/lib/db.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's find each preplanned week and count courses
preplanned_matches = re.finditer(r'id:\s*"plan-pre-([^"]+)",\s*name:\s*"([^"]+)",', content)

for match in preplanned_matches:
    code = match.group(1)
    name = match.group(2)
    start_pos = match.start()
    # Find the next preplanned week or end of array
    # Let's count how many times "id": "course-" appears until the next plan
    segment = content[start_pos : start_pos + 40000]
    # find ending of courses array
    end_courses_match = re.search(r'\]\s*,\s*createdAt:', segment)
    if end_courses_match:
        courses_segment = segment[:end_courses_match.start()]
        courses = re.findall(r'\{\s*"id":', courses_segment)
        print(f"Plan: {name} ({code}) | Course count: {len(courses)}")
    else:
        print(f"Plan: {name} ({code}) | End not found")
