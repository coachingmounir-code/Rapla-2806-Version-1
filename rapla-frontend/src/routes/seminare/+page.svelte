<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getStoredUserRole } from '$lib/authRole';
  import SeminarScheduleView from '$lib/components/SeminarScheduleView.svelte';
  import { getWeekCodeFromDate, getOffsetWeekCode } from '$lib/db';

  function getCurrentRaplaWeekCode(): string {
    const today = new Date();
    const currentDay = today.getDay();
    let daysToMonday = 0;
    if (currentDay === 5) daysToMonday = 3;
    else if (currentDay === 6) daysToMonday = 2;
    else if (currentDay === 0) daysToMonday = 1;
    else if (currentDay === 1) daysToMonday = 0;
    else if (currentDay === 2) daysToMonday = -1;
    else if (currentDay === 3) daysToMonday = -2;
    else if (currentDay === 4) daysToMonday = -3;
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysToMonday);
    return getWeekCodeFromDate(monday);
  }

  let currentWeekCode = $state(getCurrentRaplaWeekCode());

  onMount(() => {
    // If role is team, seamlessly redirect to /wochenplan?tab=seminare so they remain in the pure team view
    const userRole = getStoredUserRole();
    if (userRole === 'team') {
      goto('/wochenplan?tab=seminare', { replaceState: true });
    }
  });

  function handleNavigateWeek(delta: number) {
    const next = getOffsetWeekCode(currentWeekCode, delta);
    if (next) currentWeekCode = next;
  }

  function handleGoToCurrentWeek() {
    currentWeekCode = getCurrentRaplaWeekCode();
  }
</script>

<svelte:head>
  <title>Seminarplanung – Wochenseminare | Yoga Vidya Nordsee</title>
</svelte:head>

<div class="seminare-page-wrapper">
  <SeminarScheduleView 
    {currentWeekCode}
    onNavigateWeek={handleNavigateWeek}
    onGoToCurrentWeek={handleGoToCurrentWeek}
    onClose={() => goto('/schedule')}
    isAdmin={true}
  />
</div>

<style>
  .seminare-page-wrapper {
    width: 100%;
    max-width: 1560px;
    margin: 0 auto;
    padding: 1.5rem 2rem 4rem 2rem;
    box-sizing: border-box;
  }
  @media (max-width: 900px) {
    .seminare-page-wrapper {
      padding: 1rem;
    }
  }
</style>
