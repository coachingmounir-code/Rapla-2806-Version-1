<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { getStoredUserRole } from '$lib/authRole';

  let isAuthorized = $state(false);
  let frameEl = $state<HTMLIFrameElement | null>(null);
  let initialHash = $state('#start');

  function syncFrameHash(targetHash: string) {
    if (!frameEl || !frameEl.contentWindow) return;
    const normalized = targetHash === '#tagesseva' || targetHash === '#ki-projekte' ? targetHash : '#start';
    try {
      if (frameEl.contentWindow.location.hash !== normalized) {
        frameEl.contentWindow.location.hash = normalized;
      }
    } catch (_) {}
  }

  $effect(() => {
    const h = page.url.hash;
    if (h) {
      syncFrameHash(h);
    }
  });

  onMount(() => {
    const role = getStoredUserRole();
    if (role !== 'admin') {
      goto('/');
      return;
    }
    if (window.location.hash === '#tagesseva' || window.location.hash === '#ki-projekte') {
      initialHash = window.location.hash;
    }
    isAuthorized = true;

    const handleHashChange = () => {
      syncFrameHash(window.location.hash || '#start');
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'shiva-hash' && typeof event.data.hash === 'string') {
        const target = event.data.hash;
        if (window.location.hash !== target) {
          history.replaceState(history.state, '', `/admin-todos${target}`);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('message', handleMessage);
    };
  });
</script>

<svelte:head>
  <title>Digital Shiva · Yoga Vidya Rapla 2.0</title>
</svelte:head>

{#if isAuthorized}
  <div class="digital-shiva-container">
    <iframe
      bind:this={frameEl}
      src="/seva/index.html{initialHash}"
      title="Digital Shiva · KI-Projekte & Tagesseva"
      allow="microphone"
      class="digital-shiva-frame"
    ></iframe>
  </div>
{/if}

<style>
  .digital-shiva-container {
    width: 100%;
    height: calc(100vh - 70px);
    min-height: 640px;
    overflow: hidden;
    background: #fff1dc;
  }

  .digital-shiva-frame {
    width: 100%;
    height: 100%;
    border: 0;
    display: block;
    background: #fff1dc;
  }
</style>
