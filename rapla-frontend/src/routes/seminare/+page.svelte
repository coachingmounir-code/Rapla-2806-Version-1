<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import SeminarScheduleView from '$lib/components/SeminarScheduleView.svelte';

  let currentWeekCode = $state('2026-W45');

  onMount(() => {
    // If role is team, seamlessly redirect to /wochenplan?tab=seminare so they remain in the pure team view
    const userRole = localStorage.getItem('rapla_user_role');
    if (userRole === 'team') {
      goto('/wochenplan?tab=seminare', { replaceState: true });
    }
  });

  function handleNavigateWeek(delta: number) {
    const match = currentWeekCode.match(/^(\d{4})-W(\d{2})$/);
    if (match) {
      const year = parseInt(match[1]);
      let week = parseInt(match[2]) + delta;
      currentWeekCode = `${year}-W${String(week).padStart(2, '0')}`;
    }
  }

  function handleGoToCurrentWeek() {
    currentWeekCode = '2026-W45';
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
