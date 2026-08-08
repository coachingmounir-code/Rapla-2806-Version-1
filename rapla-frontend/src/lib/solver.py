#!/usr/bin/env python3
import sys
import json
import os
import datetime

# Clean utility to parse HH:MM to minutes
def time_to_minutes(time_str):
    if not time_str:
        return 0
    parts = time_str.split(':')
    return int(parts[0]) * 60 + int(parts[1])

# Convert course duration to hours
def duration_in_hours(course):
    start = time_to_minutes(course["startTime"])
    end = time_to_minutes(course["endTime"])
    return (end - start) / 60.0

def get_local_date_for_day(week_code, day_of_week):
    try:
        parts = week_code.split('-W')
        year = int(parts[0])
        week_num = int(parts[1])
        
        jan4 = datetime.date(year, 1, 4)
        monday_of_w1 = jan4 - datetime.timedelta(days=jan4.weekday())
        target_monday = monday_of_w1 + datetime.timedelta(weeks=week_num - 1)
        target_friday = target_monday - datetime.timedelta(days=3)
        
        offset_map = {5: 0, 6: 1, 0: 2, 1: 3, 2: 4, 3: 5, 4: 6}
        offset = offset_map.get(day_of_week, 0)
        
        target_date = target_friday + datetime.timedelta(days=offset)
        return target_date.strftime("%Y-%m-%d")
    except Exception:
        return ""

def main():
    try:
        # Read from stdin
        input_data = json.loads(sys.stdin.read())
    except Exception as e:
        print(json.dumps({"error": f"Ungültiger JSON-Input: {str(e)}", "logs": []}))
        sys.exit(1)
        
    courses = input_data.get("courses", [])
    teachers = input_data.get("teachers", [])
    absences = input_data.get("absences", [])
    seminar_leader_ids = input_data.get("seminarLeaderIds", [])
    target_week_code = input_data.get("targetWeekCode", "")
    custom_wishes = input_data.get("customWishes", "")
    
    logs = ["Starte CP-SAT Planungsalgorithmus..."]
    
    # 1. Read custom constraints (parsed via Gemini by SvelteKit server route)
    custom_constraints = input_data.get("customConstraints", [])
    if custom_wishes.strip():
        logs.append(f"Verarbeite wöchentliche Sonderwünsche: '{custom_wishes}'...")
        if custom_constraints:
            logs.append(f"✓ {len(custom_constraints)} spezielle Bedingungen erfolgreich extrahiert.")
        else:
            logs.append("Keine speziellen Freitext-Bedingungen extrahiert (oder API-Schlüssel fehlt).")
            
    # Try importing ortools
    try:
        from ortools.sat.python import cp_model
    except ImportError:
        print(json.dumps({
            "error": "Google OR-Tools ist nicht installiert. Bitte führen Sie 'pip install ortools' aus.",
            "logs": logs
        }))
        sys.exit(1)
        
    model = cp_model.CpModel()
    
    # decision variables: x[course_id, teacher_id]
    x = {}
    for c in courses:
        for t in teachers:
            x[c["id"], t["id"]] = model.NewBoolVar(f"x_{c['id']}_{t['id']}")
            
    # Constraints:
    
    # 1. Course Coverage
    for c in courses:
        # If teacher is already fixed and not absent/planning
        is_fixed = False
        if c.get("teacherId") and not c.get("isAiPlanned"):
            # Check if this fixed teacher is absent
            fixed_teacher_id = c["teacherId"]
            course_date = get_local_date_for_day(target_week_code, c["dayOfWeek"])
            
            # check absences
            is_absent = False
            for abs_entry in absences:
                if abs_entry and abs_entry.get("teacherId") == fixed_teacher_id:
                    if abs_entry.get("startDate") <= course_date <= abs_entry.get("endDate"):
                        is_absent = True
                        break
            
            if not is_absent:
                is_fixed = True
                for t in teachers:
                    if t["id"] == fixed_teacher_id:
                        model.Add(x[c["id"], t["id"]] == 1)
                    else:
                        model.Add(x[c["id"], t["id"]] == 0)
        
        if not is_fixed:
            # Plan exactly 1 teacher for this course
            model.Add(sum(x[c["id"], t["id"]] for t in teachers) == 1)
            
    # 2. General Qualifications & Special Rules (Boolean Checks)
    for c in courses:
        c_name_lower = c["name"].lower()
        c_style_lower = c["style"].lower()
        
        is_meditation = "meditation" in c_name_lower or "medi." in c_name_lower or "meditation" in c_style_lower
        is_satsang = "satsang" in c_name_lower
        is_pranayama = "pranayama" in c_name_lower or "pranayama" in c_style_lower
        is_onn = "om" in c_name_lower and "namo" in c_name_lower
        is_yoga = not is_meditation and not is_satsang and not is_onn
        is_satsang_einfuehrung = "satsang einführung" in c_name_lower or "satsang-einführung" in c_name_lower or "satsangeinführung" in c_name_lower
        
        for t in teachers:
            t_rules = t.get("rules", {})
            t_name_lower = t["name"].lower()
            is_sevaka = t.get("roleType") == "sevaka"
            
            # Check basic qualifications
            qualified = True
            
            if is_meditation and not t_rules.get("canLeadMeditation"):
                qualified = False
            if is_satsang and not t_rules.get("canLeadSatsang"):
                qualified = False
            if is_pranayama and not t_rules.get("canLeadPranayama", True): # default allowed if not explicitly false
                qualified = False
            if is_onn and not t_rules.get("canLeadOnn"):
                qualified = False
            if is_yoga and t.get("isYogaTeacher") == False:
                qualified = False
                
            # Specific Satsang Allowed/Forbidden checks (Rule 4: Adam, Hu, Mounir, Teresa, Satyam, Ulrich, Pranava cannot do Satsang)
            if is_satsang:
                forbidden_for_satsang = ['adam', 'hu', 'mounir', 'mouniir', 'teresa', 'satyam', 'ulrich', 'pranava']
                if any(n in t_name_lower for n in forbidden_for_satsang):
                    qualified = False
                # Satsang morning 7:00 must be only allowed morning teachers
                if c["startTime"] == "07:00":
                    allowed_morning = ['anjali', 'nirmaya', 'burnie', 'harishakti', 'narayani', 'abha', 'alexander']
                    if not any(n in t_name_lower for n in allowed_morning):
                        qualified = False
                        
            # Specific Pranayama Allowed list (Karuna, Burnie, Narayani, Abha)
            if is_pranayama:
                allowed_pranayama = ['karuna', 'burnie', 'narayani', 'abha']
                if not any(n in t_name_lower for n in allowed_pranayama):
                    qualified = False
                    
            # Satsang Einführung allowed list
            if is_satsang_einfuehrung:
                if c["dayOfWeek"] == 5: # Friday: Pranava
                    if "pranava" not in t_name_lower:
                        qualified = False
                elif c["dayOfWeek"] == 0: # Sunday: Nirmaya, Anjali, Hu, Mounir
                    allowed_sunday = ['nirmaya', 'anjali', 'hu', 'mounir']
                    if not any(n in t_name_lower for n in allowed_sunday):
                        qualified = False
            
            # Ulrich special rules
            if "ulrich" in t_name_lower:
                # Friday/Sunday morning yoga classes forbidden
                if is_yoga and c["dayOfWeek"] in [5, 0] and time_to_minutes(c["startTime"]) < 720: # 12:00
                    qualified = False
                    
            # Nirmaya weekend yoga forbidden
            if "nirmaya" in t_name_lower and is_yoga and c["dayOfWeek"] in [5, 6, 0]:
                qualified = False
                
            if not qualified:
                model.Add(x[c["id"], t["id"]] == 0)
                
    # 3. Absences (Sevafrei) Constraints
    for c in courses:
        course_date = get_local_date_for_day(target_week_code, c["dayOfWeek"])
        c_name_lower = c["name"].lower()
        is_satsang = "satsang" in c_name_lower
        
        for t in teachers:
            is_absent = False
            for abs_entry in absences:
                if abs_entry and abs_entry.get("teacherId") == t["id"]:
                    if abs_entry.get("startDate") <= course_date <= abs_entry.get("endDate"):
                        # Support composite teacher name or type exceptions
                        abs_type = abs_entry.get("type", "").lower()
                        # Satsangs are bypassed for seminartage
                        if is_satsang and "seminar" in abs_type:
                            continue
                        is_absent = True
                        break
            
            if is_absent:
                model.Add(x[c["id"], t["id"]] == 0)
                
    # 4. Availability Schedule & Off Days
    for c in courses:
        for t in teachers:
            # Check availability
            t_rules = t.get("rules", {})
            avail_slots = t_rules.get("availability", [])
            
            fits = False
            c_start = time_to_minutes(c["startTime"])
            c_end = time_to_minutes(c["endTime"])
            c_day = c["dayOfWeek"]
            
            for slot in avail_slots:
                if slot["day"] == c_day:
                    s_start = time_to_minutes(slot["start"])
                    s_end = time_to_minutes(slot["end"])
                    if c_start >= s_start and c_end <= s_end:
                        fits = True
                        break
            
            if not fits and t.get("roleType") == "sevaka": # externals are handles differently or always
                model.Add(x[c["id"], t["id"]] == 0)
                
    # 5. Rest Time Buffers (Clique constraints)
    for t in teachers:
        t_rules = t.get("rules", {})
        rest_time = t_rules.get("minRestTime", 0)
        if rest_time > 0:
            for d in range(7):
                day_courses = [c for c in courses if c["dayOfWeek"] == d]
                for i in range(len(day_courses)):
                    for j in range(i + 1, len(day_courses)):
                        c1 = day_courses[i]
                        c2 = day_courses[j]
                        
                        s1, e1 = time_to_minutes(c1["startTime"]), time_to_minutes(c1["endTime"])
                        s2, e2 = time_to_minutes(c2["startTime"]), time_to_minutes(c2["endTime"])
                        
                        # Check buffer conflict
                        overlap = s1 < e2 and s2 < e1
                        buffer_conflict = False
                        if not overlap:
                            gap = s2 - e1 if s2 >= e1 else s1 - e2
                            if gap < rest_time:
                                buffer_conflict = True
                                
                        if overlap or buffer_conflict:
                            model.Add(x[c1["id"], t["id"]] + x[c2["id"], t["id"]] <= 1)
                            
    # 6. Daily Class Limits
    for t in teachers:
        t_rules = t.get("rules", {})
        max_daily = t_rules.get("maxClassesPerDay", 2)
        for d in range(7):
            day_courses = [c for c in courses if c["dayOfWeek"] == d]
            model.Add(sum(x[c["id"], t["id"]] for c in day_courses) <= max_daily)
            
    # 7. Weekly Hours Limits
    for t in teachers:
        t_rules = t.get("rules", {})
        max_hours = t_rules.get("maxHoursPerWeek", 12)
        model.Add(
            sum(x[c["id"], t["id"]] * int(duration_in_hours(c) * 60) for c in courses) <= int(max_hours * 60)
        )
        
    # 8. Weekly Specific Class Limits
    for t in teachers:
        t_rules = t.get("rules", {})
        
        # Max Yoga classes per week
        max_yoga = t_rules.get("maxYogaClassesPerWeek")
        if max_yoga is not None:
            yoga_courses = []
            for c in courses:
                c_name = c["name"].lower()
                c_style = c["style"].lower()
                is_med = "meditation" in c_name or "medi." in c_name or "meditation" in c_style
                is_sat = "satsang" in c_name
                is_onn = "om" in c_name and "namo" in c_name
                if not is_med and not is_sat and not is_onn:
                    yoga_courses.append(c)
            model.Add(sum(x[c["id"], t["id"]] for c in yoga_courses) <= int(max_yoga))
            
        # Max Morning Satsangs per week
        max_morning_sat = t_rules.get("maxMorningSatsangsPerWeek")
        if max_morning_sat is not None:
            morning_satsangs = [c for c in courses if "satsang" in c["name"].lower() and c["startTime"] == "07:00"]
            model.Add(sum(x[c["id"], t["id"]] for c in morning_satsangs) <= int(max_morning_sat))
            
        # Max Meditations per week
        max_med = t_rules.get("maxMeditationPerWeek")
        if max_med is not None:
            med_courses = [c for c in courses if ("meditation" in c["name"].lower() or "medi." in c["name"].lower()) and "satsang" not in c["name"].lower()]
            model.Add(sum(x[c["id"], t["id"]] for c in med_courses) <= int(max_med))
            
        # Max Satsangs per week
        max_sat = t_rules.get("maxSatsangsPerWeek")
        if max_sat is not None:
            sat_courses = [c for c in courses if "satsang" in c["name"].lower()]
            model.Add(sum(x[c["id"], t["id"]] for c in sat_courses) <= int(max_sat))
            
        # Max ONN per week
        max_onn = t_rules.get("maxOnnPerWeek")
        if max_onn is not None:
            onn_courses = [c for c in courses if "om namo" in c["name"].lower()]
            model.Add(sum(x[c["id"], t["id"]] for c in onn_courses) <= int(max_onn))
            
    # 9. Special Teacher constraints
    for t in teachers:
        t_rules = t.get("rules", {})
        t_name_lower = t["name"].lower()
        
        # Ulrich: no two yoga classes same day
        if t_rules.get("noTwoYogaSameDay"):
            for d in range(7):
                day_yoga = []
                for c in courses:
                    if c["dayOfWeek"] == d:
                        c_name = c["name"].lower()
                        c_style = c["style"].lower()
                        is_med = "meditation" in c_name or "medi." in c_name or "meditation" in c_style
                        is_sat = "satsang" in c_name
                        is_onn = "om namo" in c_name
                        if not is_med and not is_sat and not is_onn:
                            day_yoga.append(c)
                model.Add(sum(x[c["id"], t["id"]] for c in day_yoga) <= 1)
                
    # 10. Apply custom LLM constraints
    for rule in custom_constraints:
        r_type = rule.get("type")
        r_teacher_id = rule.get("teacherId")
        if not r_teacher_id:
            continue
            
        # Fuzzy match teacher ID
        target_teacher = None
        for t in teachers:
            if t["id"] == r_teacher_id:
                target_teacher = t
                break
        if not target_teacher:
            # Fuzzy match by comparing name/id substrings
            for t in teachers:
                t_id_lower = t["id"].lower()
                t_name_lower = t["name"].lower()
                r_id_lower = r_teacher_id.lower()
                if r_id_lower in t_id_lower or r_id_lower in t_name_lower or t_name_lower in r_id_lower:
                    target_teacher = t
                    break
        
        if not target_teacher:
            logs.append(f"[KI-WARNUNG] Konnte Lehrer '{r_teacher_id}' für Freitext-Regel nicht finden.")
            continue
            
        actual_teacher_id = target_teacher["id"]
        
        # exclusion rule
        if r_type == "exclude":
            r_day = rule.get("dayOfWeek")
            r_start = rule.get("startTime")
            r_course_name = rule.get("courseName")
            r_course_style = rule.get("courseStyle")
            
            for c in courses:
                match = True
                if r_day is not None and c["dayOfWeek"] != r_day:
                    match = False
                if r_start is not None and c["startTime"] != r_start:
                    match = False
                if r_course_name is not None and r_course_name.lower() not in c["name"].lower():
                    match = False
                if r_course_style is not None and r_course_style.lower() not in c["style"].lower():
                    match = False
                
                if match:
                    model.Add(x[c["id"], actual_teacher_id] == 0)
                    logs.append(f"[KI-REGEL] Schließe Lehrer {target_teacher['name']} ({actual_teacher_id}) für Kurs '{c['name']}' ({c['startTime']}) aus.")
                        
        # inclusion rule
        elif r_type == "include":
            r_course_id = rule.get("courseId")
            r_day = rule.get("dayOfWeek")
            r_start = rule.get("startTime")
            r_course_name = rule.get("courseName")
            
            if r_course_id:
                for c in courses:
                    if c["id"] == r_course_id:
                        model.Add(x[c["id"], actual_teacher_id] == 1)
                        logs.append(f"[KI-REGEL] Zwinge Zuweisung von Lehrer {target_teacher['name']} ({actual_teacher_id}) für Kurs '{c['name']}' (ID: {r_course_id}).")
            elif r_course_name:
                for c in courses:
                    match = True
                    if r_day is not None and c["dayOfWeek"] != r_day:
                        match = False
                    if r_start is not None and c["startTime"] != r_start:
                        match = False
                    if r_course_name.lower() not in c["name"].lower():
                        match = False
                        
                    if match:
                        model.Add(x[c["id"], actual_teacher_id] == 1)
                        logs.append(f"[KI-REGEL] Zwinge Zuweisung von Lehrer {target_teacher['name']} ({actual_teacher_id}) für Kurs '{c['name']}' ({c['startTime']}).")

    # 11. Optimization Objective Setup
    objective_terms = []
    
    # Satsang Einführung Rotation
    week_num = 0
    try:
        week_num = int(target_week_code.split('-W')[1])
    except Exception:
        pass
        
    for c in courses:
        c_name_lower = c["name"].lower()
        c_style_lower = c["style"].lower()
        is_meditation = "meditation" in c_name_lower or "medi." in c_name_lower or "meditation" in c_style_lower
        is_satsang = "satsang" in c_name_lower
        is_onn = "om" in c_name_lower and "namo" in c_name_lower
        is_yoga = not is_meditation and not is_satsang and not is_onn
        is_satsang_einfuehrung = "satsang einführung" in c_name_lower or "satsang-einführung" in c_name_lower
        is_pranayama = "pranayama" in c_name_lower or "pranayama" in c_style_lower
        
        for t in teachers:
            t_rules = t.get("rules", {})
            t_name_lower = t["name"].lower()
            
            # Score base
            score = 100
            
            # Preferred rooms
            pref_rooms = t_rules.get("preferredRooms", [])
            if c["roomId"] in pref_rooms:
                score += 30
                
            # Preferred days
            pref_days = t_rules.get("preferredDays", [])
            if c["dayOfWeek"] in pref_days:
                score += 50
                
            # Non-preferred days
            non_pref_days = t_rules.get("nonPreferredDays", [])
            if c["dayOfWeek"] in non_pref_days:
                score -= 40
                
            # 12. Backup priorities and custom scoring:
            
            # Friday morning beginner class: Harishakti (+10000), Abha (+5000)
            if c["dayOfWeek"] == 5 and c["startTime"] == "09:15" and "anfänger" in c_name_lower:
                if "harishakti" in t_name_lower:
                    score += 10000
                elif "abha" in t_name_lower:
                    score += 5000
                    
            # Friday morning intermediate class: Pranava (+10000)
            if c["dayOfWeek"] == 5 and c["startTime"] == "09:15" and "mittelstufe" in c_name_lower:
                if "pranava" in t_name_lower:
                    score += 10000
                    
            # Friday & Sunday 16:30 Mittelstufe AS: Karuna (+10000)
            is_ms_ankommen = c["dayOfWeek"] in [5, 0] and c["startTime"] == "16:30" and "mittelstufe" in c_name_lower
            if is_ms_ankommen:
                if "karuna" in t_name_lower:
                    score += 10000
                elif c["dayOfWeek"] == 0: # Sunday backup chain: Anjali -> Narayani -> Ulrich
                    if "anjali" in t_name_lower:
                        score += 5000
                    elif "narayani" in t_name_lower:
                        score += 2500
                    elif "ulrich" in t_name_lower:
                        score += 2000
                        
            # Pranayama priority: Karuna/Burnie (+1000) vs Narayani/Abha (+200)
            if is_pranayama:
                if any(n in t_name_lower for n in ["karuna", "burnie"]):
                    score += 1000
                elif any(n in t_name_lower for n in ["narayani", "abha"]):
                    score += 200
                    
            # Sunday Satsang Einführung Rotation
            if is_satsang_einfuehrung and c["dayOfWeek"] == 0 and week_num > 0:
                allowed_rotation = ["nirmaya", "anjali", "hu", "mounir"]
                target_idx = week_num % len(allowed_rotation)
                pref_name = allowed_rotation[target_idx]
                if pref_name in t_name_lower:
                    score += 5000
                    
            # Ulrich weekend backup penalty (should only teach as backup)
            if "ulrich" in t_name_lower and c["dayOfWeek"] in [5, 0] and is_yoga:
                # Deduct points if he is not specifically requested in backup chain
                if not is_ms_ankommen:
                    score -= 5000
                    
            # Narayani prefers Mittelstufe
            if "narayani" in t_name_lower and "mittelstufe" in c_name_lower:
                score += 150
                
            objective_terms.append(x[c["id"], t["id"]] * score)
            
    # Set maximization objective
    model.Maximize(sum(objective_terms))
    
    # 13. Solve the model
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 5.0
    
    status = solver.Solve(model)
    
    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        logs.append(f"CP-SAT Solver Status: {'Optimal' if status == cp_model.OPTIMAL else 'Feasible'}")
        
        # Build planned courses list
        planned_courses = []
        for c in courses:
            assigned_teacher_id = c.get("teacherId")
            
            # Check which teacher was assigned by the solver
            for t in teachers:
                if solver.Value(x[c["id"], t["id"]]) == 1:
                    assigned_teacher_id = t["id"]
                    break
            
            # Apply styling and custom renaming rules (e.g. Burnie Meets Pavanmuktasana)
            course_copy = dict(c)
            course_copy["teacherId"] = assigned_teacher_id
            
            if assigned_teacher_id:
                teacher_obj = next((t for t in teachers if t["id"] == assigned_teacher_id), None)
                if teacher_obj:
                    course_copy["isAiPlanned"] = c.get("isAiPlanned", False) or c.get("teacherId") != assigned_teacher_id
                    
                    # Apply custom course name rules
                    custom_names = teacher_obj.get("rules", {}).get("customCourseNames", [])
                    original_name = c["name"]
                    
                    if original_name in ["Yoga Vidya meets Pavanmuktasana", "Yoga Vidya Pavanmuktasana", "Anfänger Yin Yoga"]:
                        original_name = "Anfänger"
                    elif original_name == "Yoga Flow Mittelstufe":
                        original_name = "Mittelstufe"
                        
                    for c_name_rule in custom_names:
                        if c_name_rule.get("originalName") == original_name:
                            course_copy["name"] = c_name_rule.get("customName")
                            break
                            
            planned_courses.append(course_copy)
            
        logs.append("Planung erfolgreich berechnet.")
        print(json.dumps({
            "plannedCourses": planned_courses,
            "logs": logs
        }, ensure_ascii=False))
        
    else:
        logs.append("❌ Der Solver konnte keine gültige Belegung finden (UNSATISFIABLE).")
        logs.append("Bitte prüfen Sie Ihre Regeln auf logische Widersprüche (z.B. zu viele freie Tage oder unerfüllbare Stundenlimits).")
        print(json.dumps({
            "error": "Keine gültige Belegung unter den gegebenen Bedingungen möglich.",
            "logs": logs
        }, ensure_ascii=False))

if __name__ == "__main__":
    main()
