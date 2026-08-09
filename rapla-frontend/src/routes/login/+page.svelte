<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import nataraja from '$lib/assets/nataraja.jpg';

  let password = $state('');
  let error = $state('');
  let loading = $state(false);
  let showPassword = $state(false);

  onMount(() => {
    // If already logged in, redirect away from login
    const storedRole = localStorage.getItem('rapla_user_role');
    if (storedRole === 'admin' || storedRole === 'viewer') {
      goto('/');
    } else if (storedRole === 'team') {
      goto('/wochenplan');
    }
  });

  async function handleLogin(e: SubmitEvent) {
    e.preventDefault();
    if (!password.trim()) {
      error = 'Bitte Passwort eingeben';
      return;
    }

    loading = true;
    error = '';

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        localStorage.setItem('rapla_user_role', data.role);
        
        // Broadcast role update or trigger redirect immediately
        if (data.role === 'admin' || data.role === 'viewer') {
          await goto('/');
        } else {
          await goto('/wochenplan');
        }
        // Force reload of layout page states
        window.location.reload();
      } else {
        error = data.error || 'Ungültiges Passwort';
      }
    } catch (err) {
      console.error('Login error:', err);
      error = 'Verbindungsfehler zum Server';
    } finally {
      loading = false;
    }
  }
</script>

<div class="login-wrapper">
  <div class="login-card glass-card">
    <div class="logo-area">
      <div class="logo-img-wrapper">
        <img src={nataraja} alt="Yoga Vidya Logo" class="logo-img" />
      </div>
      <h2>YOGA VIDYA NORDSEE</h2>
      <h1>Rapla 2.0 Planer</h1>
      <p class="subtitle">Willkommen! Bitte melde dich an, um fortzufahren.</p>
    </div>

    <form onsubmit={handleLogin} class="login-form">
      {#if error}
        <div class="error-banner animate-shake">
          <span>⚠️</span> {error}
        </div>
      {/if}

      <div class="form-group">
        <label for="password">Passwort / Teamcode / Ansicht</label>
        <div class="password-input-wrapper">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Zugangscode eingeben..."
            bind:value={password}
            disabled={loading}
          />
          <button
            type="button"
            class="toggle-password"
            onclick={() => showPassword = !showPassword}
            tabindex="-1"
            aria-label="Passwort anzeigen/verbergen"
          >
            {showPassword ? '👁️' : '🙈'}
          </button>
        </div>
      </div>

      <button type="submit" class="submit-btn" disabled={loading}>
        {#if loading}
          <span class="spinner-btn"></span> Lade...
        {:else}
          Anmelden ➔
        {/if}
      </button>
    </form>
    
    <div class="login-footer">
      <p>"To serve, to love, to give, to purify..."</p>
    </div>
  </div>
</div>

<style>
  .login-wrapper {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle at 10% 20%, rgba(255, 245, 204, 0.6) 0%, rgba(255, 253, 248, 1) 90%);
    font-family: 'Outfit', sans-serif;
    padding: 1.5rem;
  }

  .login-card {
    width: 100%;
    max-width: 440px;
    padding: 2.5rem;
    box-shadow: 0 10px 40px -10px rgba(42, 27, 27, 0.15);
    border: 1px solid var(--border-color, #ffe082);
    border-radius: 20px;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }

  .logo-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .logo-img-wrapper {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    border: 2px solid var(--border-color, #ffe082);
    background-color: #f7f2eb;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
    box-shadow: 0 4px 10px rgba(42, 27, 27, 0.05);
  }

  .logo-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    transform: scale(1.25);
  }

  .logo-area h2 {
    font-size: 1rem;
    color: var(--primary, #960040);
    letter-spacing: 0.1em;
    font-weight: 700;
    margin-bottom: 0.25rem;
  }

  .logo-area h1 {
    font-size: 1.75rem;
    color: var(--text-primary, #2a1b1b);
    font-weight: 800;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    font-size: 0.85rem;
    color: var(--text-secondary, #6b5151);
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .error-banner {
    background-color: #fef2f2;
    border: 1px solid #fca5a5;
    color: #b91c1c;
    padding: 0.75rem 1rem;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .animate-shake {
    animation: shake 0.4s ease-in-out;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-6px); }
    75% { transform: translateX(6px); }
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-primary, #2a1b1b);
  }

  .password-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .password-input-wrapper input {
    width: 100%;
    padding: 0.85rem 2.75rem 0.85rem 1rem;
    border: 1px solid var(--border-color, #ffe082);
    border-radius: 12px;
    font-family: inherit;
    font-size: 0.95rem;
    background-color: var(--bg-main, #fffdf8);
    color: var(--text-primary, #2a1b1b);
    transition: var(--transition-smooth, all 0.2s);
  }

  .password-input-wrapper input:focus {
    outline: none;
    border-color: var(--primary, #960040);
    box-shadow: 0 0 0 3px rgba(150, 0, 64, 0.1);
  }

  .toggle-password {
    position: absolute;
    right: 10px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.1rem;
    padding: 0.25rem;
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .toggle-password:hover {
    opacity: 1;
  }

  .submit-btn {
    width: 100%;
    padding: 0.9rem;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--primary, #960040) 0%, #7d0034 100%);
    color: white;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    box-shadow: 0 4px 15px rgba(150, 0, 64, 0.2);
    transition: var(--transition-smooth, all 0.2s);
  }

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(150, 0, 64, 0.3);
    background: linear-gradient(135deg, #a70048 0%, var(--primary, #960040) 100%);
  }

  .submit-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .spinner-btn {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .login-footer {
    text-align: center;
    border-top: 1px solid rgba(234, 217, 201, 0.6);
    padding-top: 1rem;
  }

  .login-footer p {
    font-size: 0.75rem;
    font-style: italic;
    color: var(--text-secondary, #6b5151);
  }
</style>
