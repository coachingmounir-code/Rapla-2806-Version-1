<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { db, type Course, type Teacher, type Room, type WeekPlan } from '$lib/db';
  import { getLocalDateForDay } from '$lib/planningEngine';
  import { EXCEL_ABSENCES } from '$lib/excel_absences';
  import { 
    isDateInYlaRange, 
    getYlaSlotsForTeacherAndWeek, 
    getYlaWeeks,
    getYlaCellRenderInfo,
    normalizeTeacherName,
    type YlaTeacherWeekSlot 
  } from '$lib/ylaData';
  import YlaScheduleView from '$lib/components/YlaScheduleView.svelte';
  import nataraja from '$lib/assets/nataraja.jpg';
  import sivanandaImg from '$lib/assets/sivananda.png';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';

  export function isSivanandaPujaSlot(course: Course | YlaTeacherWeekSlot): boolean {
    if (!course) return false;
    const name = (course.name || '').toLowerCase();
    const id = ((course as Course).id || '').toLowerCase();
    const isSivananda = name.includes('sivananda') || name.includes('shivananda');
    const isPuja = name.includes('puja') || (course as Course).style === 'Puja';
    return (isSivananda && isPuja) || id.includes('puja-sivananda');
  }

  export function isBuffetSlot(course: Course | YlaTeacherWeekSlot): boolean {
    if (!course) return false;
    const name = (course.name || '').toLowerCase();
    const style = ((course as Course).style || '').toLowerCase();
    return name.includes('vollwert-buffet') || name.includes('vollwertbuffet') || style === 'buffet';
  }

  export function isOpenDayCourse(course: Course | YlaTeacherWeekSlot): boolean {
    if (!course) return false;
    const id = ((course as Course).id || '').toLowerCase();
    return id.includes('-tdot-');
  }

  export function isNormalOpenDaySlot(course: Course | YlaTeacherWeekSlot): boolean {
    if (!course) return false;
    const id = ((course as Course).id || '').toLowerCase();
    const name = (course.name || '').toLowerCase();
    if (
      id === 'course-2026-w44-tdot-gefuehrte-meditation' ||
      id === 'course-2026-w44-tdot-satsang-morgen' ||
      id === 'course-2026-w44-tdot-gemeinsame-stunde' ||
      id === 'course-2026-w44-tdot-satsang'
    ) {
      return true;
    }
    if (course.startTime === '07:00' && (name.includes('geführte meditation') || name.includes('satsang'))) return true;
    if (course.startTime === '09:15' && name.includes('gemeinsame stunde')) return true;
    if (course.startTime === '20:00' && name.includes('satsang')) return true;
    return false;
  }

  // Collapse/expand states for Tag der offenen Tür (Saturday 24.10.2026) in Team-Ansicht
  let isTdotAllExpanded = $state(false);
  let expandedTdotGroups = $state<Record<string, boolean>>({});
  let expandedTdotSlotIds = $state<Record<string, boolean>>({});

  function toggleTdotAll() {
    isTdotAllExpanded = !isTdotAllExpanded;
    expandedTdotGroups = {
      'tdot-hour-9': isTdotAllExpanded,
      'tdot-hour-15': isTdotAllExpanded,
      'tdot-hour-16': isTdotAllExpanded,
      'tdot-hour-19': isTdotAllExpanded
    };
  }

  function toggleTdotGroup(groupKey: string, e?: MouseEvent) {
    if (e) e.stopPropagation();
    const nextVal = !expandedTdotGroups[groupKey];
    expandedTdotGroups = {
      ...expandedTdotGroups,
      [groupKey]: nextVal
    };
    isTdotAllExpanded = Object.values(expandedTdotGroups).some(Boolean);
  }

  function toggleTdotSlotDetail(courseId: string, e: MouseEvent) {
    e.stopPropagation();
    expandedTdotSlotIds = {
      ...expandedTdotSlotIds,
      [courseId]: !expandedTdotSlotIds[courseId]
    };
  }

  let courses = $state<Course[]>([]);
  let teachers = $state<Teacher[]>([]);
  let rooms = $state<Room[]>([]);
  let weekPlans = $state<WeekPlan[]>([]);
  let currentPlan = $state<WeekPlan | null>(null);
  let currentWeekOffset = $state(0);
  let isFullscreen = $state(false);
  let activeMobileDay = $state(5);
  let isWeekApproved = $state(false);

  // Tab switcher state: 'wochenplan' | 'yla4' | 'yla4_w3' | 'yla4_w4'
  let tabParam = $derived(page.url.searchParams.get('tab') || '');
  let activeTab = $state<'wochenplan' | 'yla4' | 'yla4_w3' | 'yla4_w4'>(
    (typeof window !== 'undefined' && (page.url.searchParams.get('tab') === 'yla4_w4' || page.url.searchParams.get('tab') === 'woche4' || page.url.searchParams.get('tab') === 'w4' || page.url.searchParams.get('tab') === 'yla4_4'))
      ? 'yla4_w4'
      : (typeof window !== 'undefined' && (page.url.searchParams.get('tab') === 'yla4_w3' || page.url.searchParams.get('tab') === 'woche3' || page.url.searchParams.get('tab') === 'w3'))
        ? 'yla4_w3'
        : (typeof window !== 'undefined' && (page.url.searchParams.get('tab') === 'yla4' || page.url.searchParams.get('tab') === 'woche2' || page.url.searchParams.get('tab') === 'w2'))
          ? 'yla4'
          : 'wochenplan'
  );

  $effect(() => {
    if (tabParam === 'yla4_w4' || tabParam === 'woche4' || tabParam === 'w4' || tabParam === 'yla4_4') {
      if ('yla4_w4' !== untrack(() => activeTab)) {
        activeTab = 'yla4_w4';
      }
    } else if (tabParam === 'yla4_w3' || tabParam === 'woche3' || tabParam === 'w3' || tabParam === 'yla3') {
      if ('yla4_w3' !== untrack(() => activeTab)) {
        activeTab = 'yla4_w3';
      }
    } else if (tabParam === 'yla4' || tabParam === 'woche2' || tabParam === 'w2' || tabParam === 'yla2') {
      if ('yla4' !== untrack(() => activeTab)) {
        activeTab = 'yla4';
      }
    } else if (tabParam === 'wochenplan') {
      if ('wochenplan' !== untrack(() => activeTab)) {
        activeTab = 'wochenplan';
      }
    }
  });

  function switchTab(tab: 'wochenplan' | 'yla4' | 'yla4_w3' | 'yla4_w4') {
    activeTab = tab;
    const params = new URLSearchParams(page.url.searchParams);
    if (tab === 'yla4' || tab === 'yla4_w3' || tab === 'yla4_w4') {
      params.set('tab', tab);
    } else {
      params.delete('tab');
    }
    goto(`?${params.toString()}`, { replaceState: true, noScroll: true, keepFocus: true });
  }

  // Filter query parameters
  let teacherParam = $derived(page.url.searchParams.get('teacher') || '');
  let onlyMySlotsParam = $derived(page.url.searchParams.get('onlyMySlots') === 'true');

  // Resolved teacher state
  let selectedTeacher = $derived.by<Teacher | null>(() => {
    if (!teacherParam) return null;
    return teachers.find(t => 
      t.id === teacherParam || 
      t.name.toLowerCase().includes(teacherParam.toLowerCase())
    ) || null;
  });

  let karmaTeachersList = $derived(
    teachers.filter(t => t.roleType === 'karma_yogi' || t.roleType === 'guest_teacher' || t.stayStartDate || t.stayEndDate)
  );
  let externalTeachersList = $derived(
    teachers.filter(t => t.roleType !== 'sevaka' && t.roleType !== 'karma_yogi' && t.roleType !== 'guest_teacher' && !t.stayStartDate && !t.stayEndDate)
  );
  let sevakaTeachersList = $derived(
    teachers.filter(t => t.roleType === 'sevaka')
  );

  let activeWeekCode = $derived(
    currentPlan?.targetWeekCode || getWeekCode(getMondayForOffset(currentWeekOffset))
  );

  // Resolved 4-Week YLA slots for the selected teacher in this week
  let selectedTeacherYlaSlots = $derived.by<YlaTeacherWeekSlot[]>(() => {
    if (!selectedTeacher) return [];
    return getYlaSlotsForTeacherAndWeek(selectedTeacher.name, activeWeekCode, selectedTeacher.id);
  });

  // Resolved Week 2 YLA slots specifically for selected teacher (for YLA4 tab)
  let selectedTeacherWeek2YlaSlots = $derived.by(() => {
    if (!selectedTeacher) return [];
    const weeks = getYlaWeeks();
    const w2 = weeks.find(w => w.weekNumber === 2);
    if (!w2) return [];
    const norm = normalizeTeacherName(selectedTeacher.name);
    const result: any[] = [];
    for (let slotIdx = 0; slotIdx < w2.slots.length; slotIdx++) {
      const slot = w2.slots[slotIdx];
      for (const day of w2.days) {
        const cellInfo = getYlaCellRenderInfo(w2, day.col, slotIdx);
        if (!cellInfo.shouldRender) continue;
        const entry = cellInfo.entry;
        if (!entry || !entry.assignedTeacher) continue;
        const assigned = entry.assignedTeacher.split(/[,+/]/).map(n => normalizeTeacherName(n)).filter(Boolean);
        if (assigned.some(a => a && a !== '?' && !a.includes('offen') && (a === norm || norm.includes(a) || a.includes(norm)))) {
          result.push({ slot, day, entry, cellInfo });
        }
      }
    }
    return result;
  });

  // Resolved Week 3 YLA slots specifically for selected teacher (for YLA4 tab)
  let selectedTeacherWeek3YlaSlots = $derived.by(() => {
    if (!selectedTeacher) return [];
    const weeks = getYlaWeeks();
    const w3 = weeks.find(w => w.weekNumber === 3);
    if (!w3) return [];
    const norm = normalizeTeacherName(selectedTeacher.name);
    const result: any[] = [];
    for (let slotIdx = 0; slotIdx < w3.slots.length; slotIdx++) {
      const slot = w3.slots[slotIdx];
      for (const day of w3.days) {
        const cellInfo = getYlaCellRenderInfo(w3, day.col, slotIdx);
        if (!cellInfo.shouldRender) continue;
        const entry = cellInfo.entry;
        if (!entry || !entry.assignedTeacher) continue;
        const assigned = entry.assignedTeacher.split(/[,+/]/).map(n => normalizeTeacherName(n)).filter(Boolean);
        if (assigned.some(a => a && a !== '?' && !a.includes('offen') && (a === norm || norm.includes(a) || a.includes(norm)))) {
          result.push({ slot, day, entry, cellInfo });
        }
      }
    }
    return result;
  });

  // Resolved Week 4 YLA slots specifically for selected teacher (for YLA4 tab)
  let selectedTeacherWeek4YlaSlots = $derived.by(() => {
    if (!selectedTeacher) return [];
    const weeks = getYlaWeeks();
    const w4 = weeks.find(w => w.weekNumber === 4);
    if (!w4) return [];
    const norm = normalizeTeacherName(selectedTeacher.name);
    const result: any[] = [];
    for (let slotIdx = 0; slotIdx < w4.slots.length; slotIdx++) {
      const slot = w4.slots[slotIdx];
      for (const day of w4.days) {
        const cellInfo = getYlaCellRenderInfo(w4, day.col, slotIdx);
        if (!cellInfo.shouldRender) continue;
        const entry = cellInfo.entry;
        if (!entry || !entry.assignedTeacher) continue;
        const assigned = entry.assignedTeacher.split(/[,+/]/).map(n => normalizeTeacherName(n)).filter(Boolean);
        if (assigned.some(a => a && a !== '?' && !a.includes('offen') && (a === norm || norm.includes(a) || a.includes(norm)))) {
          result.push({ slot, day, entry, cellInfo });
        }
      }
    }
    return result;
  });

  // Derived list of all courses assigned/visible to the selected teacher in the current week
  let selectedTeacherAssignedCourses = $derived.by<(Course | YlaTeacherWeekSlot)[]>(() => {
    if (!selectedTeacher) return [];
    const regular = courses.filter(c => isTeacherVisibleForCourse(c, selectedTeacher!.id));
    return [...regular, ...selectedTeacherYlaSlots];
  });

  // Grouped by day in DAYS order (Freitag -> Donnerstag) for the compact personal overview
  let selectedTeacherAssignmentsByDay = $derived.by(() => {
    if (!selectedTeacher) return [];
    return DAYS.map(day => {
      const daySlots = selectedTeacherAssignedCourses
        .filter(c => c.dayOfWeek === day.value)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      return {
        day,
        dateStr: getDayDateString(day.value),
        slots: daySlots
      };
    }).filter(group => group.slots.length > 0);
  });

  // Derived combined courses for total displayed hours and counting
  let allDisplayCourses = $derived<(Course | YlaTeacherWeekSlot)[]>(
    selectedTeacher
      ? (onlyMySlotsParam ? selectedTeacherAssignedCourses : [...courses, ...selectedTeacherYlaSlots])
      : courses
  );

  // Derived filtered courses for the mobile agenda view
  let filteredMobileCourses = $derived.by<(Course | YlaTeacherWeekSlot)[]>(() => {
    const regular = courses
      .filter(c => c.dayOfWeek === activeMobileDay)
      .filter(c => !onlyMySlotsParam || !selectedTeacher || isTeacherVisibleForCourse(c, selectedTeacher.id));

    const yla = (selectedTeacher ? selectedTeacherYlaSlots : [])
      .filter(s => s.dayOfWeek === activeMobileDay);

    return [...regular, ...yla].sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  const DAYS = [
    { value: 5, label: 'Freitag' },
    { value: 6, label: 'Samstag' },
    { value: 0, label: 'Sonntag' },
    { value: 1, label: 'Montag' },
    { value: 2, label: 'Dienstag' },
    { value: 3, label: 'Mittwoch' },
    { value: 4, label: 'Donnerstag' }
  ];

  let hasSetInitialWeek = false;

  onMount(() => {
    weekPlans = db.getWeekPlans();
    if (!hasSetInitialWeek) {
      currentWeekOffset = findDefaultApprovedWeekOffset(weekPlans);
      hasSetInitialWeek = true;
    }
    loadData();
    
    // Set active mobile day to today if today is within our calendar cycle
    const todayVal = new Date().getDay();
    if (DAYS.some(d => d.value === todayVal)) {
      activeMobileDay = todayVal;
    }
    
    // Add keypress listener for escaping fullscreen
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };
    
    const handleFullscreenChange = () => {
      isFullscreen = !!document.fullscreenElement;
    };

    const handleSync = () => {
      loadData();
    };

    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('storage', handleSync);
    window.addEventListener('rapla-data-synced', handleSync);
    window.addEventListener('yla-assignment-changed', handleSync);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('rapla-data-synced', handleSync);
      window.removeEventListener('yla-assignment-changed', handleSync);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  });

  let isSyncing = $state(false);
  let syncFeedback = $state<string | null>(null);

  async function handleHeaderSync() {
    if (isSyncing) return;
    isSyncing = true;
    try {
      await db.syncWithServerAndCloud();
      loadData();
      syncFeedback = '✅ Daten erfolgreich synchronisiert!';
      setTimeout(() => { syncFeedback = null; }, 3500);
    } catch (e: any) {
      syncFeedback = '❌ Fehler: ' + (e?.message || '');
      setTimeout(() => { syncFeedback = null; }, 4000);
    } finally {
      isSyncing = false;
    }
  }

  function handleResetCurrentPlan() {
    if (!currentPlan) return;
    if (confirm(`Möchtest du den Plan für "${currentPlan.name}" wirklich auf die Standard-Vorlage zurücksetzen? Alle manuellen Zuweisungen für diese Woche werden dabei verworfen.`)) {
      db.resetSchedule(currentPlan.id);
      loadData();
      syncFeedback = 'ℹ️ Plan wurde auf die Standard-Vorlage zurückgesetzt.';
      setTimeout(() => { syncFeedback = null; }, 3500);
    }
  }

  function getWeekCode(date: Date): string {
    const year = date.getFullYear();
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  function getMondayForOffset(offset: number): Date {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    let daysToMonday = 0;
    if (currentDay === 5) daysToMonday = 3; // Friday -> upcoming Monday (+3)
    else if (currentDay === 6) daysToMonday = 2; // Saturday -> upcoming Monday (+2)
    else if (currentDay === 0) daysToMonday = 1; // Sunday -> tomorrow Monday (+1)
    else if (currentDay === 1) daysToMonday = 0; // Monday -> today (0)
    else if (currentDay === 2) daysToMonday = -1; // Tuesday -> past Monday (-1)
    else if (currentDay === 3) daysToMonday = -2; // Wednesday -> past Monday (-2)
    else if (currentDay === 4) daysToMonday = -3; // Thursday -> past Monday (-3)
    
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    monday.setDate(today.getDate() + daysToMonday + (offset * 7));
    return monday;
  }

  function getMondayOfCurrentWeek(): Date {
    return getMondayForOffset(currentWeekOffset);
  }

  function findDefaultApprovedWeekOffset(plans: WeekPlan[]): number {
    // 1. If current calendar week (offset 0) is approved, show current week
    const currentWeekCode = getWeekCode(getMondayForOffset(0));
    const curPlan = plans.find(p => p.targetWeekCode === currentWeekCode);
    const isCurrentApproved = !!curPlan && (curPlan.isApproved === true || (curPlan.status === 'approved' && curPlan.isApproved !== false));
    if (isCurrentApproved) {
      return 0;
    }

    // 2. Otherwise start with the first upcoming approved week (e.g. KW 36)
    for (let offset = 1; offset <= 26; offset++) {
      const code = getWeekCode(getMondayForOffset(offset));
      const plan = plans.find(p => p.targetWeekCode === code);
      if (plan && (plan.isApproved === true || (plan.status === 'approved' && plan.isApproved !== false))) {
        return offset;
      }
    }

    return 0;
  }

  // ISO-8601 week number
  function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  function getDayDateString(dayValue: number): string {
    if (currentPlan?.targetWeekCode) {
      const dateStr = getLocalDateForDay(currentPlan.targetWeekCode, dayValue);
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.`;
      }
    }
    const monday = getMondayOfCurrentWeek();
    let offset = 0;
    if (dayValue === 5) offset = -3;
    else if (dayValue === 6) offset = -2;
    else if (dayValue === 0) offset = -1;
    else if (dayValue === 1) offset = 0;
    else if (dayValue === 2) offset = 1;
    else if (dayValue === 3) offset = 2;
    else if (dayValue === 4) offset = 3;
    
    const targetDate = new Date(monday.getTime());
    targetDate.setDate(monday.getDate() + offset);
    return targetDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  }

  function isTeacherAssigned(courseTeacherId: string | null | undefined, targetTeacherId: string): boolean {
    if (!courseTeacherId) return false;
    const ids = courseTeacherId.split(',').map(s => s.trim());
    if (ids.includes(targetTeacherId)) return true;
    if ((targetTeacherId === 'teacher-karma-gopala' || targetTeacherId.includes('gopala')) && ids.some(id => id === 'teacher-guest-1789207307944' || id.includes('gopala'))) return true;

    // Check composite assignments (e.g. teacher-gen-adam-anjali, teacher-gen-burnie-narayani)
    const targetTeacher = teachers.find(t => t.id === targetTeacherId);
    if (targetTeacher) {
      const targetName = targetTeacher.name.toLowerCase().trim();
      const courseTeacher = teachers.find(t => t.id === courseTeacherId);
      if (courseTeacher && courseTeacher.name.includes(',')) {
        const parts = courseTeacher.name.split(',').map(p => p.trim().toLowerCase());
        if (parts.some(p => p === targetName || targetName.includes(p) || p.includes(targetName))) return true;
      }
    }
    return false;
  }

  function isTeacherVisibleForCourse(course: Course | YlaTeacherWeekSlot, targetTeacherId: string): boolean {
    if (!course) return false;
    if (course.teacherId && isTeacherAssigned(course.teacherId, targetTeacherId)) return true;
    if ((course as Course).additionalVisibilityTeacherIds?.includes(targetTeacherId)) return true;
    return false;
  }

  function getTeacherDisplayName(courseTeacherId: string | null | undefined, courseTeacherName?: string | null, isSchulung: boolean = false): string {
    if (!courseTeacherId || courseTeacherId === 'teacher-gen-yl') return isSchulung ? 'Offen' : 'Unbesetzt';
    if (courseTeacherName && courseTeacherName.trim() && courseTeacherName !== 'Unbesetzt' && courseTeacherName !== 'Offen') {
      return courseTeacherName;
    }
    const ids = courseTeacherId.split(',').map(s => s.trim());
    const names = ids.map(id => {
      const found = teachers.find(t => 
        t.id === id || 
        (id.includes('tanja') && (t.id.includes('tanja') || t.name.toLowerCase().includes('tanja'))) || 
        (id.includes('swantje') && (t.id.includes('swantje') || t.name.toLowerCase().includes('swantje'))) || 
        (id.includes('gopala') && (t.id.includes('gopala') || t.name.toLowerCase().includes('gopala'))) || 
        ((id.includes('krishnajyoti') || id === 'teacher-guest-1791727410561') && (t.id.includes('krishnajyoti') || t.name.toLowerCase().includes('krishnajyoti'))) ||
        id === 'teacher-guest-1789207307944'
      );
      if (found) return found.name;
      if (id.toLowerCase().includes('tanja')) return 'Tanja';
      if (id.toLowerCase().includes('swantje')) return 'Swantje';
      if (id.toLowerCase().includes('gopala') || id === 'teacher-guest-1789207307944') return 'Gopala';
      if (id.toLowerCase().includes('krishnajyoti') || id === 'teacher-guest-1791727410561') return 'Krishnajyoti';
      
      if (id.startsWith('teacher-')) {
        let readableName = id.replace('teacher-gen-', '').replace('teacher-guest-', '').replace('teacher-karma-', '').replace('teacher-', '');
        readableName = readableName.replace(/-?\d+$/, '');
        if (!readableName.trim()) {
          const matchCourse = courses.find(c => c.teacherId === id && (c as any).teacherName);
          if (matchCourse && (matchCourse as any).teacherName) return (matchCourse as any).teacherName;
          return 'Gast Lehrer';
        }
        return readableName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      }
      return id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    });
    return names.join(', ');
  }

  function getCourseColor(course: Course | YlaTeacherWeekSlot): { bg: string; border: string } {
    if (isSivanandaPujaSlot(course)) {
      return {
        bg: '#fffbeb', // radiant golden cream
        border: '#d97706' // deep golden saffron
      };
    }

    if ((course as any).isYla || course.style === 'YLA') {
      return {
        bg: '#faf5ff', // gentle lavender / light purple
        border: '#9333ea' // deep vibrant purple
      };
    }

    if (isBuffetSlot(course)) {
      return {
        bg: '#ecfccb', // fresh lime green for Vollwert-Buffet
        border: '#65a30d'
      };
    }

    const nameLower = (course.name || '').toLowerCase();
    const styleLower = ((course as Course).style || '').toLowerCase();

    // Dedicated Schulung color: soft indigo background, deep indigo border
    if (nameLower.includes('schulung') || styleLower.includes('schulung')) {
      return {
        bg: '#e0e7ff', // soft indigo
        border: '#4338ca' // deep indigo / royal blue
      };
    }

    const isUnassigned = !course.teacherId || course.teacherId === 'teacher-gen-yl';
    if (isUnassigned) {
      return {
        bg: '#fdf2f8', // light pink (lotus)
        border: '#db2777' // deep pink
      };
    }
    
    if (
      nameLower.includes('hausführung') ||
      nameLower.includes('rezeption') ||
      nameLower.includes('infopoint') ||
      nameLower.includes('yoga-shop') ||
      nameLower.includes('begrüßung') ||
      nameLower.includes('ausbildung')
    ) {
      return {
        bg: '#ecfeff', // cyan/teal (peacock/krishna vibe)
        border: '#06b6d4'
      };
    }

    const isEntspannung = 
      nameLower.includes('entspannung') || 
      nameLower.includes('klangreise') || 
      nameLower.includes('yogageschichten am kamin') || 
      nameLower.includes('peziebälle') || 
      nameLower.includes('fantasiereise') ||
      nameLower.includes('spaziergang') ||
      styleLower.includes('entspannung');
      
    if (isEntspannung) {
      return {
        bg: '#ffedd5', // warm sand/light orange
        border: '#f97316' // bright orange
      };
    }

    const isYellow = 
      (nameLower.includes('meditation') || 
       nameLower.includes('satsang') || 
       nameLower.includes('om namo') || 
       nameLower.includes('ankommen') ||
       styleLower.includes('meditation')) &&
      !nameLower.includes('ankommensstunde');
    
    if (isYellow) {
      return {
        bg: '#fef9c3', // golden yellow
        border: '#eab308' // deep gold
      };
    } else {
      return {
        bg: '#fff7ed', // very light saffron
        border: '#ea580c' // deep saffron / terracotta
      };
    }
  }

  function getEffectiveGridHour(course: Course | YlaTeacherWeekSlot): number {
    const h = parseInt(course.startTime.split(':')[0], 10);
    if (isOpenDayCourse(course)) {
      if (h >= 9 && h <= 14) return 9;
      if (h === 15) return 15;
      if (h >= 16 && h <= 18) return 16;
    }
    return h;
  }

  function getDisplayedHours(currentCourses: (Course | YlaTeacherWeekSlot)[]): number[] {
    const defaultHours = [6, 7, 9, 16, 19, 20, 21];
    const activeHours = new Set<number>();
    currentCourses.forEach(c => {
      const h = getEffectiveGridHour(c);
      if (!isNaN(h)) {
        activeHours.add(h);
      }
    });
    if (selectedTeacher && onlyMySlotsParam && activeHours.size > 0) {
      return Array.from(activeHours).sort((a, b) => a - b);
    }
    const combined = new Set([...defaultHours, ...activeHours]);
    return Array.from(combined).sort((a, b) => a - b);
  }

  function getFilteredCoursesForHour(day: number, hour: number): (Course | YlaTeacherWeekSlot)[] {
    const regular = courses
      .filter(c => c.dayOfWeek === day)
      .filter(c => {
        const startHour = getEffectiveGridHour(c);
        return startHour === hour;
      })
      .filter(c => {
        // If onlyMySlots is active, only show courses assigned or visible to the selected teacher
        if (onlyMySlotsParam && selectedTeacher) {
          return isTeacherVisibleForCourse(c, selectedTeacher.id);
        }
        return true;
      });

    const yla = (selectedTeacher ? selectedTeacherYlaSlots : [])
      .filter(s => s.dayOfWeek === day)
      .filter(s => {
        const startHour = getEffectiveGridHour(s);
        return startHour === hour;
      });

    return [...regular, ...yla].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  function loadData() {
    weekPlans = db.getWeekPlans();
    teachers = db.getTeachers();
    rooms = db.getRooms();
    
    const monday = getMondayOfCurrentWeek();
    const weekCode = getWeekCode(monday);
    
    let foundPlan = weekPlans.find(p => p.targetWeekCode === weekCode);
    const approved = !!foundPlan && (foundPlan.isApproved === true || (foundPlan.status === 'approved' && foundPlan.isApproved !== false));
    
    isWeekApproved = approved;
    currentPlan = foundPlan || null;
    
    if (approved && currentPlan) {
      courses = currentPlan.courses
        .filter(c => {
          if (c.isManuallyEdited) return true;
          const courseDate = getLocalDateForDay(weekCode, c.dayOfWeek);
          const isPranayama = c.name.toLowerCase().includes('pranayama') || c.style.toLowerCase().includes('pranayama');
          if (isPranayama && isDateInYlaRange(courseDate)) return false;
          // Specifically on Tuesday 08.09.2026, Meditativer Spaziergang is removed
          if (courseDate === '2026-09-08' && c.name.toLowerCase().includes('spaziergang')) {
            return false;
          }
          return true;
        });
    } else {
      courses = [];
    }
  }

  function toggleFullscreen() {
    const container = document.getElementById('view-calendar-container');
    if (!container) return;

    if (!document.fullscreenElement && !isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {
          isFullscreen = true;
        });
      } else {
        isFullscreen = true;
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {
          isFullscreen = false;
        });
      } else {
        isFullscreen = false;
      }
    }
  }

  function navigateWeek(direction: number) {
    currentWeekOffset += direction;
    loadData();
  }

  function selectTeacher(teacherId: string) {
    const params = new URLSearchParams(page.url.searchParams);
    if (teacherId) {
      params.set('teacher', teacherId);
      params.set('onlyMySlots', 'true');
    } else {
      params.delete('teacher');
      params.delete('onlyMySlots');
    }
    goto(`?${params.toString()}`);
  }


</script>

<div class="view-page-container">
  <!-- Minimalist Header -->
  <header class="view-header">
    <div class="logo-area">
      <img src={nataraja} alt="Yoga Vidya Logo" class="logo-img"/>
      <div>
        <h2>YOGA VIDYA NORDSEE</h2>
        <h1>Wochenplan</h1>
      </div>
    </div>
    
    <!-- User Info & Interactive Toggles -->
    <div class="header-controls">
      <div class="view-selector-group">
        <label for="teacher-select">Ansicht filtern:</label>
        <select 
          id="teacher-select" 
          class="view-select-dropdown" 
          value={selectedTeacher?.id || ''} 
          onchange={(e) => selectTeacher(e.currentTarget.value)}
        >
          <option value="">👥 Gesamtübersicht</option>
          <optgroup label="Sevakas (Team)">
            {#each sevakaTeachersList as t}
              <option value={t.id}>🧘 {t.name}</option>
            {/each}
          </optgroup>
          {#if karmaTeachersList.length > 0}
            <optgroup label="Karma-Yogis & externe Seminarleiter">
              {#each karmaTeachersList as t}
                <option value={t.id}>✨ {t.name} ({t.roleType === 'guest_teacher' ? 'Gast-SL' : 'Karma-Yogi'})</option>
              {/each}
            </optgroup>
          {/if}
          <optgroup label="Externe Lehrer">
            {#each externalTeachersList as t}
              <option value={t.id}>👤 {t.name}</option>
            {/each}
          </optgroup>
        </select>
      </div>

      <button 
        type="button" 
        class="btn sync-header-btn" 
        onclick={handleHeaderSync}
        disabled={isSyncing}
        title="Lade neueste Urlaube & Wünsche neu vom Server"
      >
        <span class:icon-spin={isSyncing}>🔄</span> {isSyncing ? 'Synchronisiere...' : 'Synchronisieren'}
      </button>

      <button 
        type="button" 
        class="btn logout-header-btn" 
        onclick={() => { 
          localStorage.removeItem('rapla_user_role'); 
          goto('/login'); 
        }}
      >
        🚪 Abmelden
      </button>

        <div class="user-badge" style="background: {selectedTeacher ? '#fff7ed' : '#f1f5f9'}; color: {selectedTeacher ? '#9a3412' : '#475569'}; border: 1px solid {selectedTeacher ? '#fed7aa' : '#e2e8f0'};">
          <span class="user-icon">{selectedTeacher ? '🧘' : '👥'}</span>
          <div>
            <div class="badge-title" style="color: {selectedTeacher ? '#9a3412' : '#1e293b'};">Team-Ansicht</div>
            <div class="badge-subtitle">{selectedTeacher ? selectedTeacher.name : 'Gesamtübersicht'}</div>
          </div>
        </div>
    </div>
  </header>

  {#if syncFeedback}
    <div style="margin-bottom: 1.5rem; padding: 0.75rem 1.25rem; background: #ecfdf5; border: 1px solid #6ee7b7; color: #065f46; border-radius: 8px; font-weight: 500; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
      <span>{syncFeedback}</span>
      <button type="button" onclick={() => { syncFeedback = null; }} style="background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #065f46;">✕</button>
    </div>
  {/if}

  <!-- Main View Tabs Navigation (Wochenplan) -->
  <div class="team-view-tabs-container">
    <div class="team-view-tabs-nav">
      <button 
        type="button" 
        class="team-view-tab-btn active" 
        onclick={() => switchTab('wochenplan')}
      >
        <span class="tab-icon">📅</span>
        <span class="tab-label">Wochenplan</span>
      </button>
    </div>
  </div>

  {#if selectedTeacher}
    {@const currentWeekNum = currentPlan?.targetWeekCode ? parseInt(currentPlan.targetWeekCode.split('-W')[1], 10) : getWeekNumber(getMondayOfCurrentWeek())}
    <div class="personal-teacher-header-banner animate-fade-in" class:yla-banner={activeTab === 'yla4' || activeTab === 'yla4_w3' || activeTab === 'yla4_w4'}>
      <div class="personal-banner-top-row">
        <div class="teacher-avatar-badge" style="background-color: {selectedTeacher.avatarColor || (activeTab === 'yla4' || activeTab === 'yla4_w3' || activeTab === 'yla4_w4' ? '#9333ea' : '#ea580c')};">
          {selectedTeacher.name.charAt(0)}
        </div>
        <div class="teacher-info-col">
          <div class="teacher-name-row">
            {#if activeTab === 'yla4'}
              <h2>Persönlicher YLA4-Plan (Woche 2): <strong>{selectedTeacher.name}</strong></h2>
              {#if selectedTeacherWeek2YlaSlots.length > 0}
                <span class="yla-counter-pill yla-counter-pill-purple">
                  🧘‍♂️ {selectedTeacherWeek2YlaSlots.length}x in YLA4 Woche 2 eingeteilt
                </span>
              {/if}
            {:else if activeTab === 'yla4_w3'}
              <h2>Persönlicher YLA4-Plan (Woche 3): <strong>{selectedTeacher.name}</strong></h2>
              {#if selectedTeacherWeek3YlaSlots.length > 0}
                <span class="yla-counter-pill yla-counter-pill-purple">
                  🧘‍♂️ {selectedTeacherWeek3YlaSlots.length}x in YLA4 Woche 3 eingeteilt
                </span>
              {/if}
            {:else if activeTab === 'yla4_w4'}
              <h2>Persönlicher YLA4-Plan (Woche 4): <strong>{selectedTeacher.name}</strong></h2>
              {#if selectedTeacherWeek4YlaSlots.length > 0}
                <span class="yla-counter-pill yla-counter-pill-purple">
                  🧘‍♀️ {selectedTeacherWeek4YlaSlots.length}x in YLA4 Woche 4 eingeteilt
                </span>
              {/if}
            {:else}
              <h2>Persönlicher Wochenplan: <strong>{selectedTeacher.name}</strong></h2>
              {#if isWeekApproved}
                <span class="personal-slots-counter-pill" class:zero-slots={selectedTeacherAssignedCourses.length === 0}>
                  📋 {selectedTeacherAssignedCourses.length} {selectedTeacherAssignedCourses.length === 1 ? 'Einteilung' : 'Einteilungen'} in KW {currentWeekNum}
                </span>
              {/if}
              {#if selectedTeacherYlaSlots.length > 0}
                <span class="yla-counter-pill">
                  🧘‍♂️ davon {selectedTeacherYlaSlots.length}x 4-Wochen YLA
                </span>
              {/if}
            {/if}
          </div>
          <div class="teacher-details-row">
            <span>Rolle: <strong>{selectedTeacher.roleType === 'sevaka' ? 'Sevaka (Team)' : selectedTeacher.roleType === 'karma_yogi' ? 'Karma-Yogi' : selectedTeacher.roleType === 'guest_teacher' ? 'Gast-Seminarleiter' : 'Unterrichtende/r'}</strong></span>
            <span class="dot-separator">•</span>
            <span>Woche: <strong>KW {currentWeekNum} ({getDayDateString(5)} – {getDayDateString(4)})</strong></span>
            {#if activeTab === 'yla4'}
              <span class="dot-separator">•</span>
              <span class="yla-active-notice" style="color: #9333ea;">
                ✨ Deine Unterrichtseinheiten für Woche 2 der Yogalehrerausbildung sind im Plan hervorgehoben!
              </span>
            {:else if activeTab === 'yla4_w3'}
              <span class="dot-separator">•</span>
              <span class="yla-active-notice" style="color: #9333ea;">
                ✨ Deine Unterrichtseinheiten für Woche 3 der Yogalehrerausbildung sind im Plan hervorgehoben!
              </span>
            {:else if activeTab === 'yla4_w4'}
              <span class="dot-separator">•</span>
              <span class="yla-active-notice" style="color: #9333ea;">
                ✨ Deine Unterrichtseinheiten für Woche 4 der Yogalehrerausbildung sind im Plan hervorgehoben!
              </span>
            {:else if selectedTeacherYlaSlots.length > 0}
              <span class="dot-separator">•</span>
              <span class="yla-active-notice">
                ✨ Deine Einteilungen für die 4-wöchige Yogalehrerausbildung sind im Plan hervorgehoben!
              </span>
            {/if}
          </div>
        </div>
        <button 
          type="button" 
          class="btn btn-secondary btn-small reset-filter-btn" 
          onclick={() => selectTeacher('')}
          title="Zurück zur Gesamtübersicht"
        >
          ✕ Gesamtübersicht
        </button>
      </div>

      {#if activeTab === 'wochenplan' && isWeekApproved}
        <div class="personal-compact-schedule">
          <div class="compact-schedule-header">
            <span class="compact-schedule-title">⚡ Kompakte Übersicht deiner Stunden (KW {currentWeekNum}):</span>
          </div>
          {#if selectedTeacherAssignmentsByDay.length === 0}
            <div class="compact-empty-notice">
              ✨ Für <strong>{selectedTeacher.name}</strong> sind in KW {currentWeekNum} ({getDayDateString(5)} – {getDayDateString(4)}) keine Stunden eingetragen.
            </div>
          {:else}
            <div class="personal-compact-days-grid">
              {#each selectedTeacherAssignmentsByDay as group}
                {@const isToday = new Date().getDay() === group.day.value && currentWeekOffset === 0}
                <div 
                  class="compact-day-card" 
                  class:compact-day-today={isToday}
                  role="button"
                  tabindex="0"
                  onclick={() => { activeMobileDay = group.day.value; }}
                  onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') activeMobileDay = group.day.value; }}
                >
                  <div class="compact-day-header">
                    <span class="compact-day-name">
                      {group.day.label}, {group.dateStr}
                      {#if isToday}
                        <span class="compact-today-badge">Heute</span>
                      {/if}
                    </span>
                    <span class="compact-day-count">{group.slots.length} {group.slots.length === 1 ? 'Std.' : 'Std.'}</span>
                  </div>
                  <div class="compact-day-slots">
                    {#each group.slots as slot}
                      {@const isYla = (slot as any).isYla === true}
                      {@const isSchulung = !isYla && ((slot as Course).name?.toLowerCase().includes('schulung') || (((slot as Course).style || '').toLowerCase().includes('schulung')))}
                      {@const colors = getCourseColor(slot)}
                      {@const roomName = isYla ? ((slot as any).roomName || 'Sivananda Saal (YLA)') : (rooms.find(r => r.id === slot.roomId)?.name || slot.roomId || 'Raum?')}
                      {@const slotTitle = isYla ? (slot as any).name.replace('4-Wochen YLA: ', '') : slot.name}
                      <div 
                        class="compact-slot-row"
                        style="background-color: {colors.bg}; border-left: 4px solid {isYla ? '#9333ea' : isSchulung ? '#4338ca' : colors.border};"
                      >
                        <div class="compact-slot-top">
                          <span class="compact-slot-time">⏰ {slot.startTime} – {slot.endTime}</span>
                          <span class="compact-slot-room">📍 {roomName}</span>
                        </div>
                        <div class="compact-slot-name">
                          {#if isYla}
                            <span class="compact-yla-tag">YLA</span>
                          {:else if isSchulung}
                            <span class="compact-schulung-tag">YL-Schulung</span>
                          {/if}
                          {slotTitle}
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Calendar Roster Grid (Desktop Only) -->
  <div class="desktop-only-grid">
      <div id="view-calendar-container" class="calendar-grid-container animate-fade-in" class:fullscreen-mode={isFullscreen}>
        <div class="grid-controls-row">
          <div class="navigation-group">
            <button type="button" class="btn btn-current-week btn-small" onclick={() => { currentWeekOffset = 0; loadData(); }}>Aktuelle Woche</button>
            <button type="button" class="btn btn-secondary btn-small" onclick={() => navigateWeek(-1)}>◀ Letzte Woche</button>
            <span class="week-title-badge">
              KW {currentPlan?.targetWeekCode ? parseInt(currentPlan.targetWeekCode.split('-W')[1], 10) : getWeekNumber(getMondayOfCurrentWeek())} ({currentPlan?.targetWeekCode || getWeekCode(getMondayOfCurrentWeek())})
            </span>
            <button type="button" class="btn btn-secondary btn-small" onclick={() => navigateWeek(1)}>Nächste Woche ▶</button>
          </div>

        <div class="action-buttons-group">
          <button type="button" class="btn btn-secondary btn-small" onclick={() => window.print()}>
            🖨️ Drucken
          </button>
          <button type="button" class="btn btn-secondary btn-small fullscreen-toggle-btn" onclick={toggleFullscreen}>
            {isFullscreen ? '🗗 Beenden' : '🖥️ Vollbild'}
          </button>
        </div>
      </div>

      {#if !isWeekApproved}
        <div class="unapproved-week-notice animate-fade-in">
          <div class="notice-icon-large">🔒</div>
          <h2>Wochenplan noch nicht freigegeben</h2>
          <p class="notice-main-text">
            Der Wochenplan für <strong>KW {currentPlan?.targetWeekCode ? parseInt(currentPlan.targetWeekCode.split('-W')[1], 10) : getWeekNumber(getMondayOfCurrentWeek())} ({getDayDateString(5)} – {getDayDateString(4)})</strong> befindet sich noch in der Vorbereitung und wurde von der Leitung noch nicht genehmigt.
          </p>
          <p class="notice-sub-text">
            Sobald die Freigabe erteilt wird, werden alle Kurse, Zeiten und Zuweisungen hier automatisch für das gesamte Team sichtbar.
          </p>
          <div class="notice-action-row" style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
            <button 
              type="button" 
              class="btn btn-primary btn-small" 
              onclick={() => { currentWeekOffset = findDefaultApprovedWeekOffset(weekPlans); loadData(); }}
            >
              📅 Zur freigegebenen Woche
            </button>
            {#if currentWeekOffset !== 0}
              <button 
                type="button" 
                class="btn btn-secondary btn-small" 
                onclick={() => { currentWeekOffset = 0; loadData(); }}
              >
                Aktuelle Woche (KW {getWeekNumber(getMondayForOffset(0))})
              </button>
            {/if}
          </div>
        </div>
      {:else}
        <div class="calendar-grid">
          <!-- Top Left Header Info -->
          <div class="grid-header-cell week-header">
            <div class="week-label">TAG / ZEIT</div>
          </div>

          <!-- Week Days Headers starting from Friday -->
          {#each DAYS as day}
            {@const isToday = new Date().getDay() === day.value && currentWeekOffset === 0}
            {@const currentWeekCode = currentPlan?.targetWeekCode || getWeekCode(getMondayOfCurrentWeek())}
            {@const dayDateStr = getLocalDateForDay(currentWeekCode, day.value)}
            {@const isYlaWednesday = day.value === 3 && isDateInYlaRange(dayDateStr)}
            {@const isOpenDaySaturday = day.value === 6 && dayDateStr === '2026-10-24'}
            <div class="grid-header-cell day-header" class:header-today={isToday} class:header-schweigetag={isYlaWednesday} class:header-tdot={isOpenDaySaturday}>
              {#if isYlaWednesday}
                <div class="schweigetag-pill" title="Schweigen bis 12 Uhr wegen YLA">
                  <div class="schweigetag-pill-title">🤫 Schweigetag</div>
                  <div class="schweigetag-pill-sub">Schweigen bis 12 Uhr wegen YLA</div>
                </div>
              {/if}
              {#if isOpenDaySaturday}
                <div class="tdot-header-pill">
                  <span class="tdot-header-title">🚪 Tag d. offenen Tür</span>
                  <button
                    type="button"
                    class="tdot-header-toggle-btn"
                    onclick={toggleTdotAll}
                    title={isTdotAllExpanded ? 'Programm kompakt einklappen' : 'Alle Slots des Tags der offenen Tür aufklappen'}
                  >
                    {isTdotAllExpanded ? '▴ Kompakt' : '▾ Aufklappen'}
                  </button>
                </div>
              {/if}
              <span class="day-label-short">{day.label}</span>
              <span class="day-date">{getDayDateString(day.value)}</span>
            </div>
          {/each}

          <!-- Grid Rows by Hour -->
          {#each getDisplayedHours(allDisplayCourses) as hour, idx}
            {@const hoursList = getDisplayedHours(allDisplayCourses)}
            {@const prevHour = idx > 0 ? hoursList[idx - 1] : null}
            {@const isMiddayGap = prevHour !== null && prevHour <= 10 && hour >= 15}

            {#if isMiddayGap}
              <div class="grid-midday-gap" aria-hidden="true"></div>
            {/if}

            <div class="grid-time-cell">
              <span>{hour.toString().padStart(2, '0')}:00</span>
            </div>

            {#each DAYS as day}
              {@const currentWeekCode = currentPlan?.targetWeekCode || getWeekCode(getMondayOfCurrentWeek())}
              {@const dayDateStr = getLocalDateForDay(currentWeekCode, day.value)}
              {@const isOpenDaySaturday = day.value === 6 && dayDateStr === '2026-10-24'}
              {@const cellCourses = getFilteredCoursesForHour(day.value, hour)}
              <div class="grid-content-cell" class:tdot-column-cell={isOpenDaySaturday}>
                {#if isOpenDaySaturday}
                  {@const primaryCourses = cellCourses.filter(c => {
                    if (hour === 9) return c.startTime < '10:00' || (selectedTeacher && isTeacherVisibleForCourse(c, selectedTeacher.id));
                    if (hour === 15) return selectedTeacher ? isTeacherVisibleForCourse(c, selectedTeacher.id) : false;
                    return true;
                  })}
                  {@const collapsibleCourses = cellCourses.filter(c => {
                    if (hour === 9) return c.startTime >= '10:00' && !(selectedTeacher && isTeacherVisibleForCourse(c, selectedTeacher.id));
                    if (hour === 15) return !(selectedTeacher && isTeacherVisibleForCourse(c, selectedTeacher.id));
                    return false;
                  })}
                  {@const groupKey = `tdot-hour-${hour}`}
                  {@const isGroupOpen = !!expandedTdotGroups[groupKey]}
                  {@const visibleTdotCourses = isGroupOpen ? cellCourses : primaryCourses}

                  {#each visibleTdotCourses as course}
                    {@const isBuffet = isBuffetSlot(course)}
                    {@const isHighlighted = selectedTeacher && isTeacherVisibleForCourse(course, selectedTeacher.id)}
                    {@const colors = getCourseColor(course)}
                    {@const teacherName = getTeacherDisplayName(course.teacherId, (course as any).teacherName, false)}
                    {@const roomName = rooms.find(r => r.id === course.roomId)?.name || course.roomId || 'Raum?'}
                    {@const isSlotExpanded = !!expandedTdotSlotIds[(course as Course).id]}
                    {#if isNormalOpenDaySlot(course)}
                      {@const isSchulung = (course as Course).name?.toLowerCase().includes('schulung') || (((course as Course).style || '').toLowerCase().includes('schulung'))}
                      <div 
                        class="course-card-rapla" 
                        class:schulung-course-card={isSchulung}
                        class:highlighted-card={isHighlighted}
                        class:dimmed-card={selectedTeacher && !isHighlighted && !onlyMySlotsParam}
                        class:unassigned-card={(!course.teacherId || course.teacherId === 'teacher-gen-yl') && !isSchulung && !isBuffet}
                        style="background-color: {colors.bg}; border-left: {isSchulung ? '5px solid #4338ca' : (isHighlighted ? '4px solid #ea580c' : '4px solid ' + colors.border)};"
                      >
                        <div class="card-top-line">
                          <span class="card-time">{course.startTime} - {course.endTime}</span>
                          {#if isSchulung}
                            <span class="schulung-badge-pill">🎓 YL-Schulung</span>
                          {/if}
                          <span class="card-room">{roomName}</span>
                        </div>
                        <div class="card-title-line" class:schulung-title={isSchulung}>{course.name}</div>
                        {#if isBuffet}
                          <div class="card-teacher-line" style="color: #3f6212; font-weight: 600;">
                            🍽️ Speisesaal
                          </div>
                        {:else}
                          <div class="card-teacher-line">
                            👤 {teacherName}
                          </div>
                        {/if}
                      </div>
                    {:else}
                      <!-- svelte-ignore a11y_click_events_have_key_events -->
                      <!-- svelte-ignore a11y_no_static_element_interactions -->
                      <div
                        class="tdot-mini-card"
                        class:highlighted-card={isHighlighted}
                        class:dimmed-card={selectedTeacher && !isHighlighted && !onlyMySlotsParam}
                        class:tdot-unassigned={(!course.teacherId || course.teacherId === 'teacher-gen-yl') && !isBuffet}
                        class:tdot-expanded={isSlotExpanded}
                        style="background-color: {colors.bg}; border-left: 3.5px solid {isHighlighted ? '#ea580c' : colors.border}; cursor: pointer;"
                        onclick={(e) => toggleTdotSlotDetail((course as Course).id, e)}
                        title="{course.startTime} - {course.endTime}: {course.name} ({roomName})"
                      >
                        <div class="tdot-mini-main">
                          <span class="tdot-mini-time">{course.startTime}</span>
                          <span class="tdot-mini-title">{course.name}</span>
                          <button
                            type="button"
                            class="tdot-mini-expand-btn"
                            onclick={(e) => toggleTdotSlotDetail((course as Course).id, e)}
                            title={isSlotExpanded ? 'Details einklappen' : 'Details aufklappen'}
                          >
                            {isSlotExpanded ? '▴' : '▾'}
                          </button>
                        </div>
                        <div class="tdot-mini-sub">
                          <span class="tdot-mini-room">📍 {roomName.split(' ')[0]}</span>
                          {#if isBuffet}
                            <span class="tdot-mini-teacher" style="color: #3f6212;">🍽️ Buffet</span>
                          {:else}
                            <span class="tdot-mini-teacher">👤 {teacherName}</span>
                          {/if}
                        </div>
                        {#if isSlotExpanded}
                          <div class="tdot-mini-details">
                            <div>⏰ <strong>{course.startTime} – {course.endTime} Uhr</strong></div>
                            <div>📌 <strong>{course.name}</strong></div>
                            <div>📍 Raum: {roomName}</div>
                            {#if !isBuffet}
                              <div>👤 Eingeteilt: <strong>{teacherName}</strong></div>
                            {/if}
                          </div>
                        {/if}
                      </div>
                    {/if}
                  {/each}

                  {#if collapsibleCourses.length > 0}
                    {@const assignedInGroup = collapsibleCourses.filter(c => (c.teacherId && c.teacherId !== 'teacher-gen-yl') || isBuffetSlot(c)).length}
                    <button
                      type="button"
                      class="tdot-group-toggle-btn"
                      class:is-open={isGroupOpen}
                      onclick={(e) => toggleTdotGroup(groupKey, e)}
                    >
                      <span class="tdot-group-toggle-left">
                        <span>🚪</span>
                        <span>
                          {#if isGroupOpen}
                            {hour === 9 ? '10:00–15:00 Programm einklappen' : '15:00–16:15 Programm einklappen'}
                          {:else}
                            {hour === 9 ? `+ ${collapsibleCourses.length} Slots (10:00–15:00)` : `+ ${collapsibleCourses.length} Slots (15:00–16:15)`}
                          {/if}
                        </span>
                      </span>
                      <span class="tdot-group-toggle-right">
                        {#if !isGroupOpen}
                          <span class="tdot-group-count-pill">{assignedInGroup}/{collapsibleCourses.length}</span>
                        {/if}
                        <span class="tdot-group-chevron">{isGroupOpen ? '▴' : '▾'}</span>
                      </span>
                    </button>
                  {/if}
                {:else}
                  {#each cellCourses as course}
                    {@const isYla = (course as any).isYla === true}
                    {@const isSchulung = !isYla && ((course as Course).name?.toLowerCase().includes('schulung') || (((course as Course).style || '').toLowerCase().includes('schulung')))}
                    {@const isHighlighted = selectedTeacher && (isTeacherVisibleForCourse(course, selectedTeacher.id) || isYla)}
                    {@const colors = getCourseColor(course)}
                    {@const teacherName = isYla ? (course as any).teacherName : getTeacherDisplayName(course.teacherId, (course as any).teacherName, isSchulung)}
                    {@const roomName = isYla ? ((course as any).roomName || 'Sivananda Saal (YLA)') : (rooms.find(r => r.id === course.roomId)?.name || course.roomId || 'Raum?')}
                    
                    {#if isYla}
                      {@const yla = course as any}
                      <div 
                        class="course-card-rapla yla-course-card highlighted-card"
                        style="background: linear-gradient(135deg, #fdf4ff 0%, #faf5ff 100%); border-left: 5px solid #9333ea; box-shadow: 0 3px 8px rgba(147, 51, 234, 0.18);"
                        title="{yla.slotLabel}: {yla.topic}"
                      >
                        <div class="card-top-line">
                          <span class="card-time" style="color: #7e22ce; font-weight: 800;">⏰ {yla.startTime} - {yla.endTime}</span>
                          <span class="yla-badge-pill">🧘‍♂️ 4-Wochen YLA</span>
                        </div>
                        <div class="card-title-line" style="color: #581c87; font-weight: 800;">
                          {yla.name.replace('4-Wochen YLA: ', '')}
                        </div>
                        <div class="card-subtitle-line">
                          📍 {yla.roomName} • {yla.badge}
                        </div>
                        <div class="card-teacher-line" style="color: #6b21a8; font-weight: 700;">
                          👤 {yla.teacherName}
                        </div>
                      </div>
                    {:else if isSivanandaPujaSlot(course)}
                      <div 
                        class="course-card-rapla sivananda-puja-card"
                        class:highlighted-card={isHighlighted}
                        class:dimmed-card={selectedTeacher && !isHighlighted && !onlyMySlotsParam}
                        title="Swami Sivanandas Geburtstag Puja - Spezielles Festangebot"
                      >
                        <div class="puja-top-badge-row">
                          <span class="puja-time-badge">⏰ {course.startTime} - {course.endTime}</span>
                          <span class="puja-festive-badge">🪔 Spezielles Fest-Angebot</span>
                        </div>
                        <div class="puja-card-body">
                          <div class="puja-img-wrapper">
                            <img 
                              src={sivanandaImg || '/sivananda.png'} 
                              alt="Swami Sivananda" 
                              class="puja-sivananda-portrait" 
                              loading="eager"
                              decoding="async"
                              onerror={(e) => { (e.currentTarget as HTMLImageElement).src = '/sivananda.png'; }}
                            />
                            <span class="puja-om-sparkle">🕉️</span>
                          </div>
                          <div class="puja-card-info">
                            <div class="puja-title">
                              <span class="puja-title-text">{course.name}</span>
                            </div>
                            <div class="puja-room-label">
                              📍 {roomName} • 90 Min.
                            </div>
                            <div class="puja-teacher-line">
                              👤 {teacherName === 'Unbesetzt' ? 'Karuna' : teacherName}
                            </div>
                          </div>
                        </div>
                        <div class="puja-ornament-footer">
                          <span class="puja-ornament-symbol">✨ 🕉️ 🪔 🕉️ ✨</span>
                        </div>
                      </div>
                    {:else}
                      {@const isBuffet = isBuffetSlot(course)}
                      <div 
                        class="course-card-rapla" 
                        class:schulung-course-card={isSchulung}
                        class:highlighted-card={isHighlighted}
                        class:dimmed-card={selectedTeacher && !isHighlighted && !onlyMySlotsParam}
                        class:unassigned-card={(!course.teacherId || course.teacherId === 'teacher-gen-yl') && !isSchulung && !isBuffet}
                        style="background-color: {colors.bg}; border-left: {isSchulung ? '5px solid #4338ca' : (isHighlighted ? '4px solid #ea580c' : '4px solid ' + colors.border)};"
                      >
                        <div class="card-top-line">
                          <span class="card-time">{course.startTime} - {course.endTime}</span>
                          {#if isSchulung}
                            <span class="schulung-badge-pill">🎓 YL-Schulung</span>
                          {/if}
                          <span class="card-room">{roomName}</span>
                        </div>
                        <div class="card-title-line" class:schulung-title={isSchulung}>{course.name}</div>
                        {#if isBuffet}
                          <div class="card-teacher-line" style="color: #3f6212; font-weight: 600;">
                            🍽️ Speisesaal
                          </div>
                        {:else}
                          <div class="card-teacher-line">
                            👤 {teacherName}
                          </div>
                        {/if}
                      </div>
                    {/if}
                  {/each}
                {/if}
              </div>
            {/each}
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Mobile View (Phone Only) -->
  <div class="mobile-only-agenda">
    <!-- Navigation for Weeks on Mobile -->
    <div class="mobile-week-nav">
      <button type="button" class="btn btn-current-week btn-small" onclick={() => { currentWeekOffset = 0; loadData(); }}>Aktuelle Woche</button>
      <button type="button" class="btn btn-secondary btn-small" onclick={() => navigateWeek(-1)}>◀</button>
      <span class="week-title-badge-mobile">
        KW {currentPlan?.targetWeekCode ? parseInt(currentPlan.targetWeekCode.split('-W')[1], 10) : getWeekNumber(getMondayOfCurrentWeek())} ({currentPlan?.targetWeekCode || getWeekCode(getMondayOfCurrentWeek())})
      </span>
      <button type="button" class="btn btn-secondary btn-small" onclick={() => navigateWeek(1)}>▶</button>
    </div>

    {#if !isWeekApproved}
      <div class="unapproved-week-notice animate-fade-in" style="margin: 1.5rem 0.5rem; padding: 2rem 1rem;">
        <div class="notice-icon-large">🔒</div>
        <h2 style="font-size: 1.25rem;">Wochenplan noch nicht freigegeben</h2>
        <p class="notice-main-text" style="font-size: 0.9rem;">
          Der Wochenplan für <strong>KW {currentPlan?.targetWeekCode ? parseInt(currentPlan.targetWeekCode.split('-W')[1], 10) : getWeekNumber(getMondayOfCurrentWeek())}</strong> befindet sich noch in der Vorbereitung und wurde von der Leitung noch nicht genehmigt.
        </p>
        <p class="notice-sub-text">
          Sobald die Freigabe erfolgt ist, erscheint der Plan hier automatisch.
        </p>
        <div class="notice-action-row" style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">
          <button 
            type="button" 
            class="btn btn-primary btn-small" 
            onclick={() => { currentWeekOffset = findDefaultApprovedWeekOffset(weekPlans); loadData(); }}
          >
            📅 Zur freigegebenen Woche
          </button>
          {#if currentWeekOffset !== 0}
            <button 
              type="button" 
              class="btn btn-secondary btn-small" 
              onclick={() => { currentWeekOffset = 0; loadData(); }}
            >
              Aktuelle Woche
            </button>
          {/if}
        </div>
      </div>
    {:else}
      <!-- Day Selector Tabs -->
      <div class="mobile-day-tabs">
        {#each DAYS as day}
          {@const isToday = new Date().getDay() === day.value && currentWeekOffset === 0}
          {@const currentWeekCode = currentPlan?.targetWeekCode || getWeekCode(getMondayOfCurrentWeek())}
          {@const dayDateStr = getLocalDateForDay(currentWeekCode, day.value)}
          {@const isYlaWednesday = day.value === 3 && isDateInYlaRange(dayDateStr)}
          {@const teacherDayCount = selectedTeacher ? selectedTeacherAssignedCourses.filter(c => c.dayOfWeek === day.value).length : 0}
          <button 
            type="button" 
            class="day-tab-btn" 
            class:active={activeMobileDay === day.value}
            class:is-today={isToday}
            class:tab-schweigetag={isYlaWednesday}
            class:has-teacher-slots={selectedTeacher && teacherDayCount > 0}
            onclick={() => activeMobileDay = day.value}
          >
            {#if isYlaWednesday}
              <span class="schweigetag-tab-pill">🤫 Schweigetag</span>
            {/if}
            <span class="day-tab-name">
              {day.label.substring(0, 2)}
              {#if selectedTeacher && teacherDayCount > 0}
                <span class="day-tab-slot-count">{teacherDayCount}</span>
              {/if}
            </span>
            <span class="day-tab-date">{getDayDateString(day.value)}</span>
          </button>
        {/each}
      </div>

      <!-- Timeline of Courses -->
      <div class="mobile-agenda-list">
        {#if activeMobileDay === 3 && isDateInYlaRange(getLocalDateForDay(currentPlan?.targetWeekCode || getWeekCode(getMondayOfCurrentWeek()), 3))}
          <div class="mobile-schweigetag-banner">
            <span class="banner-icon">🤫</span>
            <div class="banner-text">
              <span class="banner-title">Schweigetag</span>
              <span class="banner-sub">Schweigen bis 12 Uhr wegen YLA</span>
            </div>
          </div>
        {/if}

        {#if filteredMobileCourses.length === 0}
          <div class="empty-agenda-state">
            📭 Keine Stunden für diesen Tag eingetragen.
          </div>
        {:else}
          {#each filteredMobileCourses as course}
            {@const isYla = (course as any).isYla === true}
            {@const isSchulung = !isYla && ((course as Course).name?.toLowerCase().includes('schulung') || (((course as Course).style || '').toLowerCase().includes('schulung')))}
            {@const isHighlighted = selectedTeacher && (isTeacherVisibleForCourse(course, selectedTeacher.id) || isYla)}
            {@const colors = getCourseColor(course)}
            {@const teacherName = isYla ? (course as any).teacherName : getTeacherDisplayName((course as Course).teacherId, (course as Course).teacherName, isSchulung)}
            {@const roomName = isYla ? ((course as any).roomName || 'Sivananda Saal (YLA)') : (rooms.find(r => r.id === course.roomId)?.name || course.roomId || 'Raum?')}

            {#if isYla}
              {@const yla = course as any}
              <div 
                class="mobile-agenda-card yla-mobile-card highlighted-card"
                style="background: linear-gradient(135deg, #fdf4ff 0%, #faf5ff 100%); border-left: 6px solid #9333ea; box-shadow: 0 4px 10px rgba(147, 51, 234, 0.15);"
              >
                <div class="agenda-time-room">
                  <span class="agenda-time" style="color: #7e22ce; font-weight: 800;">⏰ {yla.startTime} - {yla.endTime}</span>
                  <span class="yla-badge-pill">🧘‍♂️ 4-Wochen YLA</span>
                </div>
                <h3 class="agenda-title" style="color: #581c87; font-weight: 800;">{yla.name.replace('4-Wochen YLA: ', '')}</h3>
                <div style="font-size: 0.75rem; color: #7e22ce; margin-bottom: 0.25rem; font-weight: 600;">
                  📍 {yla.roomName} • {yla.badge}
                </div>
                <div class="agenda-teacher" style="color: #6b21a8; font-weight: 700;">
                  👤 {yla.teacherName}
                </div>
              </div>
            {:else if isSivanandaPujaSlot(course)}
              <div 
                class="mobile-agenda-card sivananda-puja-mobile-card"
                class:highlighted-card={isHighlighted}
                class:dimmed-card={selectedTeacher && !isHighlighted && !onlyMySlotsParam}
              >
                <div class="puja-mobile-header">
                  <span class="puja-mobile-time">⏰ {course.startTime} - {course.endTime}</span>
                  <span class="puja-mobile-badge">🪔 Spezielles Geburtstags-Angebot</span>
                </div>
                <div class="puja-mobile-body">
                  <div class="puja-img-wrapper mobile">
                    <img 
                      src={sivanandaImg || '/sivananda.png'} 
                      alt="Swami Sivananda" 
                      class="puja-sivananda-portrait mobile" 
                      loading="eager"
                      decoding="async"
                      onerror={(e) => { (e.currentTarget as HTMLImageElement).src = '/sivananda.png'; }}
                    />
                    <span class="puja-om-sparkle">🕉️</span>
                  </div>
                  <div class="puja-mobile-info">
                    <h3 class="puja-mobile-title">{course.name}</h3>
                    <div class="puja-mobile-sub">📍 {roomName} • 90 Min. Fest-Puja & Kirtan</div>
                    <div class="puja-mobile-teacher">👤 {teacherName === 'Unbesetzt' ? 'Karuna' : teacherName}</div>
                  </div>
                </div>
                <div class="puja-ornament-footer mobile">
                  <span>✨ 🕉️ Swami Sivanandas Geburtstag 🕉️ ✨</span>
                </div>
              </div>
            {:else}
              {@const isBuffet = isBuffetSlot(course)}
              <div 
                class="mobile-agenda-card"
                class:schulung-mobile-card={isSchulung}
                class:highlighted-card={isHighlighted}
                class:dimmed-card={selectedTeacher && !isHighlighted && !onlyMySlotsParam}
                class:unassigned-card={(!course.teacherId || course.teacherId === 'teacher-gen-yl') && !isSchulung && !isBuffet}
                style="background-color: {colors.bg}; border-left: {isSchulung ? '6px solid #4338ca' : (isHighlighted ? '5px solid #ea580c' : '5px solid ' + colors.border)};"
              >
                <div class="agenda-time-room">
                  <span class="agenda-time">⏰ {course.startTime} - {course.endTime}</span>
                  {#if isSchulung}
                    <span class="schulung-badge-pill">🎓 YL-Schulung</span>
                  {/if}
                  <span class="agenda-room">{roomName}</span>
                </div>
                <h3 class="agenda-title" class:schulung-title={isSchulung}>{course.name}</h3>
                {#if isBuffet}
                  <div class="agenda-teacher" style="color: #3f6212; font-weight: 600;">
                    🍽️ Speisesaal
                  </div>
                {:else}
                  <div class="agenda-teacher">
                    👤 {teacherName}
                  </div>
                {/if}
              </div>
            {/if}
          {/each}
        {/if}
      </div>
    {/if}
  </div>
  
  <footer class="view-footer-info" style="margin-top: 2rem; text-align: center; font-size: 0.8rem; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 1rem; clear: both;">
    <span>Yoga Vidya Nordsee © 2026</span>
  </footer>
</div>

<style>
  .view-page-container {
    padding: 1.5rem 2rem;
    max-width: 1400px;
    margin: 0 auto;
    font-family: 'Outfit', 'Inter', sans-serif;
    background-color: #fffbf7; /* warm ivory background */
    min-height: 100vh;
  }

  .view-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1.25rem;
    border-bottom: 2px solid #fed7aa; /* warm orange border */
  }

  /* Tabs Navigation Bar (Wochenplan vs YLA4) */
  .team-view-tabs-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding: 0.6rem 0.85rem;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .team-view-tabs-nav {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .team-view-tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 1.25rem;
    border-radius: 12px;
    border: 1.5px solid #e2e8f0;
    background: #f8fafc;
    color: #475569;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .team-view-tab-btn:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #1e293b;
    transform: translateY(-1px);
  }

  .team-view-tab-btn.active {
    background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
    border-color: #c2410c;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(234, 88, 12, 0.25);
  }

  .team-view-tab-btn.yla4-tab-btn.active {
    background: linear-gradient(135deg, #7e22ce 0%, #9333ea 100%);
    border-color: #7e22ce;
    color: #ffffff;
    box-shadow: 0 4px 14px rgba(126, 34, 206, 0.3);
  }

  .tab-icon {
    font-size: 1.15rem;
  }

  .tab-label {
    letter-spacing: 0.02em;
  }

  .tab-badge {
    background: rgba(255, 255, 255, 0.25);
    color: #ffffff;
    font-size: 0.72rem;
    font-weight: 800;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    margin-left: 0.25rem;
    border: 1px solid rgba(255, 255, 255, 0.4);
  }

  .team-view-tab-btn:not(.active) .tab-badge {
    background: #f3e8ff;
    color: #7e22ce;
    border-color: #d8b4fe;
  }

  .tab-info-pill {
    display: inline-flex;
    align-items: center;
    background: #faf5ff;
    color: #6b21a8;
    border: 1px solid #e9d5ff;
    border-radius: 999px;
    padding: 0.4rem 1rem;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .yla-counter-pill-purple {
    background: #f3e8ff !important;
    color: #7e22ce !important;
    border-color: #d8b4fe !important;
  }

  .personal-teacher-header-banner.yla-banner {
    border-left: 5px solid #9333ea;
    background: linear-gradient(135deg, #faf5ff 0%, #ffffff 100%);
  }

  .yla4-team-view-wrapper {
    width: 100%;
    margin-top: 0.5rem;
  }

  .logo-area {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .logo-img {
    height: 56px;
    width: 56px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #ea580c; /* Saffron border */
    box-shadow: 0 4px 10px rgba(234, 88, 12, 0.2); /* Saffron glow */
  }

  .logo-area h2 {
    font-size: 0.85rem;
    font-weight: 700;
    color: #ea580c;
    letter-spacing: 0.15em;
    margin: 0;
  }

  .logo-area h1 {
    font-size: 1.6rem;
    font-weight: 800;
    color: #9a3412; /* Darker terracotta / deep orange */
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .header-controls {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }

  .view-selector-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: inherit;
  }

  .view-selector-group label {
    font-size: 0.85rem;
    font-weight: 700;
    color: #475569;
  }

  .view-select-dropdown {
    padding: 0.5rem 2rem 0.5rem 1rem;
    font-family: inherit;
    font-size: 0.9rem;
    font-weight: 600;
    color: #1e293b;
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 30px;
    outline: none;
    cursor: pointer;
    transition: all 0.2s ease;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23475569'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 14px;
    min-width: 180px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }

  .view-select-dropdown:hover {
    border-color: #94a3b8;
    background-color: #f8fafc;
  }

  .view-select-dropdown:focus {
    border-color: #ea580c;
    box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.1);
  }

  .sync-header-btn {
    background: linear-gradient(135deg, #0284c7, #0369a1);
    color: white !important;
    border: none;
    font-weight: 700;
    box-shadow: 0 4px 6px rgba(3, 105, 161, 0.2);
    border-radius: 30px;
    padding: 0.5rem 1.25rem;
    transition: all 0.2s ease;
  }

  .sync-header-btn:hover {
    background: linear-gradient(135deg, #0369a1, #075985);
    transform: translateY(-1px);
    box-shadow: 0 6px 12px rgba(3, 105, 161, 0.3);
  }

  .logout-header-btn {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white !important;
    border: none;
    font-weight: 700;
    box-shadow: 0 4px 6px rgba(220, 38, 38, 0.2);
    border-radius: 30px;
    padding: 0.5rem 1.25rem;
    transition: all 0.2s ease;
    cursor: pointer;
  }

  .logout-header-btn:hover {
    background: linear-gradient(135deg, #dc2626, #b91c1c);
    transform: translateY(-1px);
    box-shadow: 0 6px 12px rgba(220, 38, 38, 0.3);
  }

  .user-badge {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    border-radius: 30px;
  }

  .user-icon {
    font-size: 1.25rem;
  }

  .badge-title {
    font-size: 0.85rem;
    font-weight: 700;
    line-height: 1.2;
  }

  .badge-subtitle {
    font-size: 0.7rem;
    opacity: 0.85;
  }

  /* Roster Calendar Grid Styling */
  .calendar-grid-container {
    width: 100%;
    overflow-x: auto;
    border-radius: 12px;
    border: 1px solid #cbd5e1;
    background: #f8fafc;
    padding: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  }

  .grid-controls-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: #f1f5f9;
    border-radius: 8px;
    margin-bottom: 6px;
  }

  .navigation-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .week-title-badge {
    font-weight: 700;
    font-size: 0.9rem;
    color: #334155;
    background: #ffffff;
    padding: 0.4rem 1rem;
    border-radius: 6px;
    border: 1px solid #cbd5e1;
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: 80px repeat(7, minmax(140px, 1fr));
    grid-auto-rows: auto;
    background-color: #cbd5e1;
    gap: 1px;
    width: 100%;
    min-width: 1060px;
    border-radius: 8px;
    overflow: hidden;
  }

  .grid-header-cell {
    background: #f8fafc;
    padding: 8px 4px;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 48px;
    border-top: 3px solid #94a3b8;
  }

  .week-header {
    font-weight: 700;
    font-size: 0.75rem;
    color: #475569;
    background: #f1f5f9;
    border-top: 3px solid #64748b;
  }

  .day-header {
    color: #334155;
  }

  .header-schweigetag {
    background: #fdf4ff;
    border-top: 3px solid #c026d3;
  }

  .header-today.header-schweigetag {
    background: #faf5ff;
    border-top: 3px solid #9333ea;
  }

  .schweigetag-pill {
    background: #f3e8ff;
    border: 1px solid #d8b4fe;
    border-radius: 6px;
    padding: 3px 4px;
    margin-bottom: 4px;
    text-align: center;
    width: 95%;
    box-shadow: 0 1px 2px rgba(147, 51, 234, 0.1);
  }

  .schweigetag-pill-title {
    font-size: 0.72rem;
    font-weight: 800;
    color: #7e22ce;
    letter-spacing: 0.01em;
    line-height: 1.1;
  }

  .schweigetag-pill-sub {
    font-size: 0.62rem;
    font-weight: 600;
    color: #9333ea;
    line-height: 1.15;
    margin-top: 1px;
  }

  .header-tdot {
    background: #fffbeb;
    border-top: 3px solid #d97706;
  }

  .tdot-header-pill {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    border: 1px solid #f59e0b;
    border-radius: 6px;
    padding: 2px 5px;
    margin-bottom: 3px;
    width: 96%;
    box-sizing: border-box;
  }

  .tdot-header-title {
    font-size: 0.65rem;
    font-weight: 800;
    color: #92400e;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tdot-header-toggle-btn {
    background: #ffffff;
    border: 1px solid #d97706;
    color: #92400e;
    border-radius: 4px;
    font-size: 0.62rem;
    font-weight: 800;
    padding: 1px 5px;
    cursor: pointer;
    white-space: nowrap;
    font-family: inherit;
    transition: all 0.15s ease;
  }

  .tdot-header-toggle-btn:hover {
    background: #d97706;
    color: #ffffff;
  }

  .tdot-column-cell {
    gap: 3px !important;
    padding: 3px !important;
    background: #fffdf9 !important;
  }

  .tdot-mini-card {
    padding: 3px 6px;
    border-radius: 5px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    font-size: 0.72rem;
    line-height: 1.2;
    transition: all 0.15s ease;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  }

  .tdot-mini-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
  }

  .tdot-mini-card.tdot-unassigned {
    border-style: dashed;
    border-color: #f472b6;
  }

  .tdot-mini-main {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
  }

  .tdot-mini-time {
    font-size: 0.66rem;
    font-weight: 800;
    color: #475569;
    flex-shrink: 0;
  }

  .tdot-mini-title {
    font-size: 0.72rem;
    font-weight: 700;
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }

  .tdot-mini-expand-btn {
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 3px;
    font-size: 0.62rem;
    line-height: 1;
    padding: 1px 4px;
    cursor: pointer;
    color: #475569;
    flex-shrink: 0;
  }

  .tdot-mini-expand-btn:hover {
    background: #ffffff;
    color: #0f172a;
  }

  .tdot-mini-sub {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    margin-top: 1px;
    font-size: 0.65rem;
    color: #475569;
  }

  .tdot-mini-room {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 48%;
    opacity: 0.85;
  }

  .tdot-mini-teacher {
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 52%;
  }

  .tdot-mini-details {
    margin-top: 4px;
    padding-top: 4px;
    border-top: 1px dashed rgba(0, 0, 0, 0.15);
    font-size: 0.68rem;
    color: #334155;
    display: flex;
    flex-direction: column;
    gap: 2px;
    white-space: normal;
  }

  .tdot-mini-assign-hint {
    color: #c2410c;
    font-weight: 700;
    margin-top: 2px;
  }

  .tdot-group-toggle-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 4px 6px;
    border-radius: 5px;
    border: 1px dashed #d97706;
    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
    color: #92400e;
    font-size: 0.68rem;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s ease;
    text-align: left;
  }

  .tdot-group-toggle-btn:hover {
    background: #fde68a;
    border-style: solid;
  }

  .tdot-group-toggle-btn.is-open {
    background: #f8fafc;
    border-color: #94a3b8;
    color: #475569;
  }

  .tdot-group-toggle-left {
    display: flex;
    align-items: center;
    gap: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tdot-group-toggle-right {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .tdot-group-count-pill {
    background: rgba(217, 119, 6, 0.15);
    color: #92400e;
    padding: 0px 4px;
    border-radius: 999px;
    font-size: 0.62rem;
    font-weight: 800;
  }

  .tdot-group-chevron {
    font-size: 0.7rem;
  }

  .header-today {
    background: #eff6ff;
    border-top: 3px solid #3b82f6;
  }

  .day-label-short {
    font-size: 0.8rem;
    font-weight: 800;
    text-transform: uppercase;
  }

  .day-date {
    font-size: 0.75rem;
    color: #64748b;
  }

  .grid-midday-gap {
    grid-column: 1 / -1;
    background: #cbd5e1;
    height: 8px;
    min-height: 8px;
    box-sizing: border-box;
  }

  .grid-time-cell {
    background: #f1f5f9;
    padding: 6px;
    font-size: 0.75rem;
    font-weight: 700;
    color: #475569;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 80px;
    box-sizing: border-box;
  }

  .grid-content-cell {
    background: #ffffff;
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-height: 80px;
    box-sizing: border-box;
  }

  .course-card-rapla {
    padding: 6px 8px;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 4px;
    transition: all 0.2s ease;
    overflow-wrap: break-word;
    word-wrap: break-word;
    hyphens: auto;
    flex-shrink: 0;
  }

  .card-top-line {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 4px;
    font-size: 0.7rem;
    font-weight: 700;
    color: #64748b;
  }

  .card-time {
    white-space: nowrap;
  }

  .card-room {
    font-weight: 800;
    color: #ea580c;
    text-align: right;
  }

  .card-title-line {
    font-size: 0.85rem;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.3;
  }

  .card-teacher-line {
    font-size: 0.7rem;
    font-weight: 600;
    color: #334155;
  }

  /* Highlight and Dim effects for personalized filters */
  .highlighted-card {
    box-shadow: 0 4px 8px rgba(234, 88, 12, 0.15);
    transform: scale(1.02);
  }

  .dimmed-card {
    opacity: 0.8;
  }

  .dimmed-card:hover {
    opacity: 0.9;
    filter: none;
  }

  /* Fullscreen Mode override */
  .calendar-grid-container.fullscreen-mode,
  .calendar-grid-container:fullscreen {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    max-width: 100vw !important;
    max-height: 100vh !important;
    z-index: 99999 !important;
    background: #fffbf7 !important;
    border-radius: 0 !important;
    padding: 0.75rem 1rem !important;
    overflow-y: auto !important;
    overflow-x: auto !important;
    box-sizing: border-box !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 0.5rem !important;
    margin: 0 !important;
    border: none !important;
  }

  .calendar-grid-container.fullscreen-mode .grid-controls-row,
  .calendar-grid-container:fullscreen .grid-controls-row {
    position: sticky !important;
    top: 0 !important;
    z-index: 100 !important;
    background: #f1f5f9 !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
    margin-bottom: 0 !important;
    flex-shrink: 0 !important;
  }

  .calendar-grid-container.fullscreen-mode .calendar-grid,
  .calendar-grid-container:fullscreen .calendar-grid {
    height: auto !important;
    min-height: fit-content !important;
    grid-auto-rows: auto !important;
    min-width: 1060px !important;
    overflow: visible !important;
    flex: none !important;
    width: 100% !important;
  }

  .calendar-grid-container.fullscreen-mode .grid-time-cell,
  .calendar-grid-container:fullscreen .grid-time-cell {
    min-height: 75px !important;
    height: auto !important;
  }

  .calendar-grid-container.fullscreen-mode .grid-content-cell,
  .calendar-grid-container:fullscreen .grid-content-cell {
    min-height: 75px !important;
    height: auto !important;
    padding: 4px 6px !important;
    gap: 4px !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: flex-start !important;
  }

  .calendar-grid-container.fullscreen-mode .course-card-rapla,
  .calendar-grid-container:fullscreen .course-card-rapla {
    padding: 6px 8px !important;
    min-height: fit-content !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) !important;
    gap: 3px !important;
    flex-shrink: 0 !important;
  }

  .calendar-grid-container.fullscreen-mode .card-title-line,
  .calendar-grid-container:fullscreen .card-title-line {
    font-size: 0.85rem !important;
    font-weight: 700 !important;
    line-height: 1.25 !important;
  }

  .calendar-grid-container.fullscreen-mode .card-top-line,
  .calendar-grid-container:fullscreen .card-top-line {
    font-size: 0.72rem !important;
  }

  .calendar-grid-container.fullscreen-mode .card-teacher-line,
  .calendar-grid-container:fullscreen .card-teacher-line {
    font-size: 0.72rem !important;
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 600;
    padding: 0.4rem 0.85rem;
    border-radius: 6px;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-secondary {
    background: #ffffff;
    border-color: #cbd5e1;
    color: #334155;
  }

  .btn-secondary:hover {
    background: #f8fafc;
    border-color: #94a3b8;
  }

  .btn-current-week {
    background: #ea580c;
    border-color: #c2410c;
    color: #ffffff;
    font-weight: 700;
  }

  .btn-current-week:hover {
    background: #c2410c;
    border-color: #9a3412;
  }

  .btn-small {
    font-size: 0.75rem;
    padding: 0.25rem 0.6rem;
  }

  .animate-fade-in {
    animation: fadeIn 0.4s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Responsive Breakpoints & Toggles */
  @media (min-width: 1101px) {
    .desktop-only-grid {
      display: block;
    }
    .mobile-only-agenda {
      display: none;
    }
  }

  @media (max-width: 1100px) {
    .view-page-container {
      padding: 1rem 0.5rem;
      overflow-x: hidden;
      max-width: 100vw;
    }

    .desktop-only-grid {
      display: none;
    }
    .mobile-only-agenda {
      display: block;
      width: 100%;
      overflow-x: hidden;
    }

    /* Stacking header elements on small devices */
    .view-header {
      flex-direction: column;
      align-items: stretch;
      gap: 1.25rem;
      padding-bottom: 1.25rem;
    }

    .logo-area {
      justify-content: center;
      text-align: center;
    }

    .header-controls {
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
    }

    .user-badge {
      justify-content: center;
    }
  }

  /* Mobile agenda specific CSS styling */
  .mobile-week-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f1f5f9;
    padding: 0.5rem;
    border-radius: 8px;
    margin-bottom: 0.75rem;
    border: 1px solid #cbd5e1;
  }

  .week-title-badge-mobile {
    font-weight: 700;
    font-size: 0.8rem;
    color: #334155;
    background: white;
    padding: 0.35rem 0.75rem;
    border-radius: 6px;
    border: 1px solid #cbd5e1;
    text-align: center;
  }

  .mobile-day-tabs {
    display: flex;
    overflow-x: auto;
    gap: 0.5rem;
    padding: 0.25rem 0.25rem 0.75rem 0.25rem;
    margin-bottom: 1.25rem;
    scrollbar-width: none;
  }

  .mobile-day-tabs::-webkit-scrollbar {
    display: none;
  }

  .day-tab-btn {
    flex: 1 0 72px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.65rem 0.4rem;
    background: white;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }

  .day-tab-btn.active {
    background: #ea580c;
    border-color: #ea580c;
    color: white;
    box-shadow: 0 4px 10px rgba(234, 88, 12, 0.2);
  }

  .day-tab-btn.active .day-tab-date {
    color: rgba(255, 255, 255, 0.85);
  }

  .day-tab-name {
    font-weight: 800;
    font-size: 0.85rem;
    text-transform: uppercase;
  }

  .day-tab-date {
    font-size: 0.7rem;
    color: #64748b;
    margin-top: 2px;
  }

  .day-tab-btn.is-today:not(.active) {
    border-color: #3b82f6;
    background: #eff6ff;
    color: #1d4ed8;
  }

  .day-tab-btn.is-today:not(.active) .day-tab-date {
    color: #2563eb;
  }

  .tab-schweigetag {
    border-color: #d8b4fe !important;
  }

  .tab-schweigetag.active {
    background: #7e22ce !important;
    border-color: #7e22ce !important;
    color: white !important;
  }

  .tab-schweigetag.active .day-tab-date,
  .tab-schweigetag.active .day-tab-name {
    color: white !important;
  }

  .schweigetag-tab-pill {
    font-size: 0.52rem;
    font-weight: 800;
    color: #7e22ce;
    background: #fae8ff;
    border: 1px solid #e9d5ff;
    padding: 1px 3px;
    border-radius: 4px;
    margin-bottom: 2px;
    display: inline-block;
    white-space: nowrap;
    line-height: 1.1;
  }

  .tab-schweigetag.active .schweigetag-tab-pill {
    background: #ffffff;
    color: #7e22ce;
    border-color: #ffffff;
  }

  .mobile-schweigetag-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: #fdf4ff;
    border: 1.5px solid #d8b4fe;
    border-radius: 10px;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    box-shadow: 0 2px 6px rgba(147, 51, 234, 0.1);
  }

  .mobile-schweigetag-banner .banner-icon {
    font-size: 1.6rem;
    line-height: 1;
  }

  .mobile-schweigetag-banner .banner-text {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .mobile-schweigetag-banner .banner-title {
    font-size: 0.95rem;
    font-weight: 800;
    color: #6b21a8;
  }

  .mobile-schweigetag-banner .banner-sub {
    font-size: 0.8rem;
    font-weight: 600;
    color: #7e22ce;
  }

  .mobile-agenda-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 2rem;
    touch-action: pan-y;
  }

  .mobile-agenda-card {
    padding: 1rem;
    border-radius: 12px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.03);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-align: left;
    transition: all 0.2s ease;
    overflow-wrap: break-word;
    word-wrap: break-word;
    hyphens: auto;
  }

  .agenda-time-room {
    display: flex;
    justify-content: space-between;
    font-size: 0.72rem;
    font-weight: 750;
    color: #64748b;
    border-bottom: 1px dashed rgba(0, 0, 0, 0.05);
    padding-bottom: 4px;
  }

  .agenda-room {
    font-weight: 800;
    color: #ea580c;
  }

  .agenda-title {
    font-size: 0.95rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    line-height: 1.25;
  }

  .agenda-teacher {
    font-size: 0.78rem;
    font-weight: 600;
    color: #475569;
  }

  .empty-agenda-state {
    text-align: center;
    padding: 3.5rem 1rem;
    color: #94a3b8;
    background: white;
    border-radius: 12px;
    border: 1px dashed #cbd5e1;
    font-weight: 600;
    font-size: 0.9rem;
  }

  /* High Contrast Unassigned Card Warning Style */
  .unassigned-card {
    border-left: 5px solid #dc2626 !important;
    animation: pulse-warning 2.5s infinite ease-in-out;
  }

  .unassigned-card .card-top-line,
  .unassigned-card .agenda-time-room {
    color: #e11d48 !important;
  }

  .unassigned-card .card-room,
  .unassigned-card .agenda-room {
    color: #be123c !important;
  }

  .unassigned-card .card-title-line,
  .unassigned-card .agenda-title {
    color: #881337 !important;
  }

  .unassigned-card .card-teacher-line,
  .unassigned-card .agenda-teacher {
    color: #be123c !important;
    font-weight: 800 !important;
  }

  @keyframes pulse-warning {
    0%, 100% {
      background-color: #ffe4e6; /* rose-100 */
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    50% {
      background-color: #fecdd3; /* rose-200 - strong alert red/rose */
      box-shadow: 0 0 12px rgba(225, 29, 72, 0.4);
    }
  }

  /* Dedicated Schulung Card Style (Desktop & Mobile) */
  .schulung-course-card {
    box-shadow: 0 2px 6px rgba(67, 56, 202, 0.15) !important;
    border: 1px solid #818cf8 !important;
    border-left: 5px solid #4338ca !important;
  }
  .schulung-course-card .card-top-line {
    color: #3730a3 !important;
    font-weight: 700;
  }
  .schulung-course-card .card-room {
    color: #4338ca !important;
    font-weight: 700;
  }
  .schulung-course-card .card-title-line {
    color: #1e1b4b !important;
    font-weight: 700;
  }
  .schulung-course-card .card-teacher-line {
    color: #4338ca !important;
    font-weight: 600;
  }
  .mobile-agenda-card.schulung-mobile-card {
    box-shadow: 0 3px 8px rgba(67, 56, 202, 0.15) !important;
    border: 1px solid #818cf8 !important;
    border-left: 6px solid #4338ca !important;
  }
  .mobile-agenda-card.schulung-mobile-card .agenda-time {
    color: #3730a3 !important;
    font-weight: 700;
  }
  .mobile-agenda-card.schulung-mobile-card .agenda-room {
    color: #4338ca !important;
    font-weight: 700;
  }
  .mobile-agenda-card.schulung-mobile-card .agenda-title {
    color: #1e1b4b !important;
    font-weight: 700;
  }
  .mobile-agenda-card.schulung-mobile-card .agenda-teacher {
    color: #4338ca !important;
    font-weight: 600;
  }
  .schulung-title {
    color: #1e1b4b !important;
    font-weight: 700 !important;
  }

  /* Unapproved Notice Card */
  .unapproved-week-notice {
    background: #ffffff;
    border: 2px dashed #fed7aa;
    border-radius: 16px;
    padding: 3.5rem 2rem;
    text-align: center;
    max-width: 680px;
    margin: 2.5rem auto;
    box-shadow: 0 4px 20px rgba(234, 88, 12, 0.06);
  }

  .notice-icon-large {
    font-size: 3.25rem;
    margin-bottom: 1rem;
    line-height: 1;
  }

  .unapproved-week-notice h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #9a3412;
    margin: 0 0 0.75rem 0;
  }

  .notice-main-text {
    font-size: 1rem;
    color: #475569;
    line-height: 1.6;
    margin-bottom: 0.5rem;
  }

  .notice-sub-text {
    font-size: 0.875rem;
    color: #94a3b8;
    line-height: 1.5;
    margin-bottom: 1.5rem;
  }

  .notice-action-row {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }

  /* Personal Teacher Banner & Compact Weekly Schedule Styling */
  .personal-teacher-header-banner {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    background: linear-gradient(135deg, #ffffff 0%, #fff7ed 100%);
    border: 2px solid #fed7aa;
    border-radius: 14px;
    padding: 1rem 1.25rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 12px rgba(234, 88, 12, 0.08);
  }

  .personal-banner-top-row {
    display: flex;
    align-items: center;
    gap: 1.15rem;
    width: 100%;
    flex-wrap: wrap;
  }

  .teacher-avatar-badge {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    color: white;
    font-size: 1.35rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 3px 6px rgba(0,0,0,0.15);
  }

  .teacher-info-col {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
    min-width: 220px;
  }

  .teacher-name-row {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
  }

  .teacher-name-row h2 {
    font-size: 1.15rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
  }

  .teacher-name-row h2 strong {
    color: #ea580c;
  }

  .personal-slots-counter-pill {
    background: #ffedd5;
    color: #9a3412;
    font-size: 0.78rem;
    font-weight: 800;
    padding: 0.22rem 0.7rem;
    border-radius: 20px;
    border: 1px solid #fdba74;
    box-shadow: 0 1px 3px rgba(234, 88, 12, 0.12);
    white-space: nowrap;
  }

  .personal-slots-counter-pill.zero-slots {
    background: #f1f5f9;
    color: #64748b;
    border-color: #cbd5e1;
    box-shadow: none;
  }

  .yla-counter-pill {
    background: #f3e8ff;
    color: #7e22ce;
    font-size: 0.78rem;
    font-weight: 800;
    padding: 0.22rem 0.7rem;
    border-radius: 20px;
    border: 1px solid #d8b4fe;
    box-shadow: 0 2px 4px rgba(126, 34, 206, 0.1);
  }

  .teacher-details-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.82rem;
    color: #64748b;
    flex-wrap: wrap;
  }

  .yla-active-notice {
    color: #7e22ce;
    font-weight: 600;
  }

  .dot-separator {
    color: #cbd5e1;
  }

  .reset-filter-btn {
    flex-shrink: 0;
    margin-left: auto;
  }

  .personal-compact-schedule {
    border-top: 1px dashed #fed7aa;
    padding-top: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .compact-schedule-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .compact-schedule-title {
    font-size: 0.8rem;
    font-weight: 800;
    color: #9a3412;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .compact-empty-notice {
    background: #ffffff;
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
    padding: 0.65rem 1rem;
    font-size: 0.85rem;
    color: #64748b;
    text-align: center;
  }

  .personal-compact-days-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(235px, 1fr));
    gap: 0.6rem;
  }

  .compact-day-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 0.55rem 0.65rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    cursor: pointer;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .compact-day-card:hover {
    border-color: #fdba74;
    box-shadow: 0 2px 6px rgba(234, 88, 12, 0.1);
  }

  .compact-day-card.compact-day-today {
    border-color: #60a5fa;
    background: #f8fbff;
  }

  .compact-day-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
    padding-bottom: 0.3rem;
    border-bottom: 1px solid #f1f5f9;
  }

  .compact-day-name {
    font-size: 0.8rem;
    font-weight: 800;
    color: #1e293b;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .compact-today-badge {
    background: #dbeafe;
    color: #1d4ed8;
    font-size: 0.62rem;
    font-weight: 800;
    padding: 1px 5px;
    border-radius: 999px;
    text-transform: uppercase;
  }

  .compact-day-count {
    font-size: 0.68rem;
    font-weight: 700;
    color: #64748b;
    background: #f1f5f9;
    padding: 1px 6px;
    border-radius: 999px;
  }

  .compact-day-slots {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .compact-slot-row {
    padding: 0.35rem 0.5rem;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .compact-slot-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.35rem;
    font-size: 0.7rem;
    font-weight: 700;
    color: #475569;
  }

  .compact-slot-time {
    white-space: nowrap;
    color: #0f172a;
    font-weight: 800;
  }

  .compact-slot-room {
    color: #c2410c;
    font-weight: 700;
    text-align: right;
    font-size: 0.68rem;
  }

  .compact-slot-name {
    font-size: 0.78rem;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.25;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    flex-wrap: wrap;
  }

  .compact-yla-tag {
    background: #f3e8ff;
    color: #7e22ce;
    font-size: 0.6rem;
    font-weight: 800;
    padding: 1px 4px;
    border-radius: 4px;
    border: 1px solid #d8b4fe;
  }

  .compact-schulung-tag {
    background: #e0e7ff;
    color: #4338ca;
    font-size: 0.6rem;
    font-weight: 800;
    padding: 1px 4px;
    border-radius: 4px;
    border: 1px solid #a5b4fc;
  }

  .day-tab-btn.has-teacher-slots:not(.active) {
    border-color: #fdba74;
    background: #fff7ed;
  }

  .day-tab-slot-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #ea580c;
    color: #ffffff;
    font-size: 0.62rem;
    font-weight: 800;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 999px;
    margin-left: 3px;
    vertical-align: middle;
  }

  .day-tab-btn.active .day-tab-slot-count {
    background: #ffffff;
    color: #ea580c;
  }

  .yla-badge-pill {
    background: #f3e8ff;
    color: #7e22ce;
    font-size: 0.65rem;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #d8b4fe;
    white-space: nowrap;
  }

  .yla-course-card {
    border-left: 5px solid #9333ea !important;
  }

  .yla-course-card:hover {
    box-shadow: 0 6px 14px rgba(147, 51, 234, 0.25) !important;
    transform: translateY(-1px);
  }

  .yla-mobile-card {
    border-left: 6px solid #9333ea !important;
  }

  .card-subtitle-line {
    font-size: 0.68rem;
    color: #7e22ce;
    font-weight: 600;
    line-height: 1.2;
    margin-top: 1px;
  }

  /* Swami Sivananda Birthday Puja Card - Special Hindu Aesthetic */
  .sivananda-puja-card {
    background: #fffbeb !important;
    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 45%, #fed7aa 100%) !important;
    border: 1.5px solid #f59e0b !important;
    border-left: 6px solid #d97706 !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 14px rgba(217, 119, 6, 0.22), 0 0 0 1px rgba(245, 158, 11, 0.25) !important;
    padding: 7px 9px !important;
    position: relative;
    overflow: hidden;
    box-sizing: border-box !important;
    width: 100% !important;
  }

  .sivananda-puja-card:hover {
    box-shadow: 0 6px 18px rgba(217, 119, 6, 0.35), 0 0 0 2px #f59e0b !important;
    transform: translateY(-1px) scale(1.01);
  }

  .puja-top-badge-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 4px;
    margin-bottom: 3px;
  }

  .puja-time-badge {
    font-size: 0.72rem;
    font-weight: 800;
    color: #92400e;
    white-space: nowrap;
  }

  .puja-festive-badge {
    background: #fef3c7;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    color: #92400e;
    font-size: 0.62rem;
    font-weight: 800;
    padding: 1.5px 6px;
    border-radius: 12px;
    border: 1px solid #f59e0b;
    white-space: nowrap;
    box-shadow: 0 1px 3px rgba(217, 119, 6, 0.15);
    letter-spacing: 0.02em;
  }

  .puja-card-body {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 2px 0;
  }

  .puja-img-wrapper {
    position: relative;
    width: 46px;
    height: 46px;
    min-width: 46px;
    min-height: 46px;
    max-width: 46px;
    max-height: 46px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .puja-img-wrapper.mobile {
    width: 52px;
    height: 52px;
    min-width: 52px;
    min-height: 52px;
    max-width: 52px;
    max-height: 52px;
  }

  .puja-sivananda-portrait {
    width: 46px;
    height: 46px;
    min-width: 46px;
    min-height: 46px;
    max-width: 46px;
    max-height: 46px;
    border-radius: 50%;
    object-fit: cover;
    display: block;
    border: 2px solid #d97706;
    box-shadow: 0 0 8px rgba(245, 158, 11, 0.4), 0 2px 5px rgba(180, 83, 9, 0.3);
    background-color: #ffffff;
    flex-shrink: 0;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }

  .puja-sivananda-portrait.mobile {
    width: 52px;
    height: 52px;
    min-width: 52px;
    min-height: 52px;
    max-width: 52px;
    max-height: 52px;
  }

  .sivananda-puja-card:hover .puja-sivananda-portrait {
    transform: scale(1.06);
    box-shadow: 0 0 12px rgba(245, 158, 11, 0.6), 0 3px 8px rgba(180, 83, 9, 0.4);
  }

  .puja-om-sparkle {
    position: absolute;
    bottom: -2px;
    right: -3px;
    font-size: 0.8rem;
    line-height: 1;
    background: #fffbeb;
    border: 1px solid #f59e0b;
    border-radius: 50%;
    padding: 1px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    z-index: 2;
  }

  .puja-card-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1.5px;
    overflow: hidden;
  }

  .puja-title {
    font-size: 0.84rem;
    font-weight: 800;
    color: #78350f;
    line-height: 1.25;
    margin: 0;
    word-break: break-word;
  }

  .puja-title-text {
    color: #78350f;
    font-weight: 800;
    display: inline-block;
  }

  .puja-room-label {
    font-size: 0.68rem;
    font-weight: 700;
    color: #c2410c;
  }

  .puja-teacher-line {
    font-size: 0.68rem;
    font-weight: 700;
    color: #92400e;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .puja-ornament-footer {
    text-align: center;
    font-size: 0.62rem;
    color: #b45309;
    letter-spacing: 0.15em;
    margin-top: 2px;
    opacity: 0.85;
  }

  /* Mobile Puja Card Styles */
  .sivananda-puja-mobile-card {
    background: #fffbeb !important;
    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 45%, #fed7aa 100%) !important;
    border: 1.5px solid #f59e0b !important;
    border-left: 6px solid #d97706 !important;
    border-radius: 10px !important;
    box-shadow: 0 4px 12px rgba(217, 119, 6, 0.2) !important;
    padding: 0.85rem !important;
  }

  .puja-mobile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .puja-mobile-time {
    font-size: 0.82rem;
    font-weight: 800;
    color: #92400e;
  }

  .puja-mobile-badge {
    background: #fef3c7;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    color: #92400e;
    font-size: 0.68rem;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 12px;
    border: 1px solid #f59e0b;
  }

  .puja-mobile-body {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .puja-mobile-info {
    flex: 1;
    min-width: 0;
  }

  .puja-mobile-title {
    font-size: 0.95rem;
    font-weight: 800;
    color: #78350f;
    margin: 0 0 0.2rem 0;
    line-height: 1.25;
  }

  .puja-mobile-sub {
    font-size: 0.75rem;
    color: #c2410c;
    font-weight: 700;
    margin-bottom: 0.2rem;
  }

  .puja-mobile-teacher {
    font-size: 0.75rem;
    color: #92400e;
    font-weight: 700;
  }

  .puja-ornament-footer.mobile {
    margin-top: 0.5rem;
    padding-top: 0.35rem;
    border-top: 1px dashed rgba(217, 119, 6, 0.3);
    font-size: 0.7rem;
    font-weight: 600;
  }

  @media (max-width: 768px) {
    .team-view-tabs-container {
      flex-direction: column;
      align-items: stretch;
      padding: 0.5rem;
    }

    .team-view-tabs-nav {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }

    .team-view-tab-btn {
      justify-content: center;
      padding: 0.6rem 0.5rem;
      font-size: 0.85rem;
    }

    .tab-info-pill {
      font-size: 0.75rem;
      justify-content: center;
      text-align: center;
      width: 100%;
    }
  }

  @media print {
    @page {
      size: A4 landscape;
      margin: 5mm;
    }

    :global(body) {
      background: white !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      margin: 0 !important;
      padding: 0 !important;
    }

    /* Hide UI elements that shouldn't be printed */
    .view-header, 
    .grid-controls-row, 
    .mobile-only-agenda, 
    .personal-teacher-header-banner,
    .unapproved-week-notice {
      display: none !important;
    }

    /* Ensure the grid shows and occupies the full width/page */
    .desktop-only-grid,
    .calendar-grid-container {
      display: block !important;
      width: 100% !important;
      max-width: none !important;
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
      margin: 0 !important;
      overflow: visible !important;
      background: transparent !important;
    }

    /* Make grid responsive to the page */
    .calendar-grid {
      display: grid !important;
      width: 100% !important;
      min-width: 100% !important;
      border-radius: 0 !important;
      background: #cbd5e1 !important; /* to keep the grid gap visible */
      gap: 1px !important;
      page-break-inside: avoid;
    }

    /* Compact cells to save space */
    .grid-header-cell {
      padding: 2px !important;
      min-height: auto !important;
    }
    
    .week-header {
      font-size: 0.6rem !important;
    }
    .day-label-short {
      font-size: 0.7rem !important;
    }
    .day-date {
      font-size: 0.65rem !important;
    }

    .grid-time-cell {
      padding: 2px !important;
      font-size: 0.65rem !important;
      min-height: 30px !important;
    }

    .grid-content-cell {
      padding: 2px !important;
      gap: 2px !important;
      min-height: 30px !important;
    }

    /* Compact course cards */
    .course-card-rapla {
      padding: 2px 3px !important;
      gap: 1px !important;
      box-shadow: none !important;
      border-left-width: 3px !important;
    }

    .card-top-line {
      font-size: 0.55rem !important;
    }
    .card-title-line {
      font-size: 0.65rem !important;
      line-height: 1.1 !important;
    }
    .card-teacher-line {
      font-size: 0.55rem !important;
    }

    /* Compact YLA cards specifically */
    .yla-badge-pill {
      font-size: 0.5rem !important;
      padding: 1px 3px !important;
    }
    .card-subtitle-line {
      font-size: 0.55rem !important;
    }

    /* Remove big gaps */
    .grid-midday-gap {
      height: 2px !important;
      min-height: 2px !important;
    }
  }
</style>
