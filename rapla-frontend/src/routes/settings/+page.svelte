<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import {
    getWhatsAppGatewayConfig,
    saveWhatsAppGatewayConfig,
    sendWhatsAppViaServerApi,
    type WhatsAppGatewayConfig
  } from '$lib/whatsappNotifier';

  let currentAdminPassword = $state('');
  let newAdminPassword = $state('');
  let newTeamPassword = $state('');

  let loading = $state(false);
  let error = $state('');
  let successMessage = $state('');

  let userRole = $state('');

  // WhatsApp Gateway Settings
  let waProvider = $state<WhatsAppGatewayConfig['provider']>('wa_link_only');
  let waGreenInstanceId = $state('');
  let waGreenToken = $state('');
  let waMetaPhoneId = $state('');
  let waMetaToken = $state('');
  let waWebhookUrl = $state('');
  let waBaseAppUrl = $state('');
  let waSaving = $state(false);
  let waTestPhone = $state('');
  let waTesting = $state(false);
  let waFeedback = $state<{ type: 'ok' | 'err'; text: string } | null>(null);

  onMount(() => {
    // Basic verification just in case layout guard hasn't triggered
    const storedRole = localStorage.getItem('rapla_user_role');
    if (storedRole) userRole = storedRole;
    if (storedRole !== 'admin' && storedRole !== 'viewer') {
      goto('/wochenplan');
    }

    const cfg = getWhatsAppGatewayConfig();
    waProvider = cfg.provider || 'wa_link_only';
    waGreenInstanceId = cfg.greenApiInstanceId || '';
    waGreenToken = cfg.greenApiToken || '';
    waMetaPhoneId = cfg.metaPhoneNumberId || '';
    waMetaToken = cfg.metaAccessToken || '';
    waWebhookUrl = cfg.customWebhookUrl || '';
    waBaseAppUrl = cfg.baseAppUrl || '';
  });

  async function handleSaveWhatsAppConfig(e: SubmitEvent) {
    e.preventDefault();
    waSaving = true;
    waFeedback = null;
    try {
      await saveWhatsAppGatewayConfig({
        provider: waProvider,
        greenApiInstanceId: waGreenInstanceId.trim(),
        greenApiToken: waGreenToken.trim(),
        metaPhoneNumberId: waMetaPhoneId.trim(),
        metaAccessToken: waMetaToken.trim(),
        customWebhookUrl: waWebhookUrl.trim(),
        baseAppUrl: waBaseAppUrl.trim()
      });
      waFeedback = { type: 'ok', text: 'WhatsApp-Einstellungen erfolgreich gespeichert!' };
    } catch (err: any) {
      waFeedback = { type: 'err', text: err?.message || 'Fehler beim Speichern.' };
    } finally {
      waSaving = false;
    }
  }

  async function handleTestWhatsAppApi() {
    if (!waTestPhone.trim()) {
      waFeedback = { type: 'err', text: 'Bitte eine Test-Telefonnummer eingeben.' };
      return;
    }
    waTesting = true;
    waFeedback = null;
    try {
      await saveWhatsAppGatewayConfig({
        provider: waProvider,
        greenApiInstanceId: waGreenInstanceId.trim(),
        greenApiToken: waGreenToken.trim(),
        metaPhoneNumberId: waMetaPhoneId.trim(),
        metaAccessToken: waMetaToken.trim(),
        customWebhookUrl: waWebhookUrl.trim(),
        baseAppUrl: waBaseAppUrl.trim()
      });
      const res = await sendWhatsAppViaServerApi(
        waTestPhone.trim(),
        'Namaste 🙏 Dies ist eine Test-Nachricht aus der Rapla Wochenplanung.'
      );
      if (res.success) {
        waFeedback = { type: 'ok', text: 'Test-Nachricht erfolgreich über das Gateway versendet!' };
      } else {
        waFeedback = { type: 'err', text: res.error || 'Versand fehlgeschlagen.' };
      }
    } finally {
      waTesting = false;
    }
  }

  async function updatePasswords(e: SubmitEvent) {
    e.preventDefault();
    if (!currentAdminPassword) {
      error = 'Bitte gib dein aktuelles Admin-Passwort zur Bestätigung ein.';
      return;
    }
    if (!newAdminPassword && !newTeamPassword) {
      error = 'Bitte gib mindestens ein neues Passwort ein.';
      return;
    }

    loading = true;
    error = '';
    successMessage = '';

    try {
      const response = await fetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentAdminPassword,
          newAdminPassword,
          newTeamPassword
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        successMessage = 'Die Passwörter wurden erfolgreich aktualisiert!';
        currentAdminPassword = '';
        newAdminPassword = '';
        newTeamPassword = '';
      } else {
        error = data.error || 'Fehler beim Aktualisieren der Passwörter.';
      }
    } catch (err) {
      console.error('Update passwords error:', err);
      error = 'Netzwerkfehler beim Speichern der Einstellungen.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="settings-page-wrapper animate-fade-in">
  <div class="header-section">
    <h1>⚙️ Einstellungen</h1>
    <p class="subtitle">Verwalte den Zugriffsschutz und die Passwörter für das System.</p>
  </div>

  <div class="settings-grid">
    <!-- Info Card -->
    <div class="glass-card info-card">
      <h2>Zugriffsrollen Übersicht</h2>
      <div class="roles-list">
        <div class="role-item">
          <div class="role-badge admin-badge">Admin / Planer</div>
          <div class="role-desc">
            Vollzugriff auf alle Bereiche (Seminare, Planer, KI-Planung, Abwesenheiten, Sevaka-Stammdaten & Wünsche).
          </div>
        </div>
        <div class="role-item">
          <div class="role-badge team-badge">Team (Sevakas)</div>
          <div class="role-desc">
            Ausschließlich Lesezugriff auf den Wochenplan (`/wochenplan`). Kann den Gesamtplan sehen oder nach eigenen Stunden filtern. Kann keine Regeln, Zeiten oder Besetzungen ändern.
          </div>
        </div>
        <div class="role-item">
          <div class="role-badge" style="background-color: #f3e8ff; color: #7e22ce; border: 1px solid #d8b4fe;">Ansicht (Viewer)</div>
          <div class="role-desc">
            Lesezugriff auf die Admin-Oberfläche. Kann alle Daten und KI-Planungen einsehen, aber keine Änderungen vornehmen oder speichern.
          </div>
        </div>
      </div>
      
      <div class="info-alert">
        <span class="info-icon">ℹ️</span>
        <p>Die Passwörter werden sicher auf dem Server gespeichert. Wenn ein Passwort geändert wird, bleibt die aktuelle Sitzung der bereits angemeldeten Benutzer bestehen, bis sie sich abmelden oder ihren Cache leeren.</p>
      </div>
    </div>

    <!-- Configuration Form -->
    <div class="glass-card form-card">
      <h2>Passwörter anpassen</h2>
      
      <form onsubmit={updatePasswords} class="settings-form">
        {#if error}
          <div class="alert alert-danger">
            <span>⚠️</span> {error}
          </div>
        {/if}
        {#if successMessage}
          <div class="alert alert-success">
            <span>✅</span> {successMessage}
          </div>
        {/if}

        {#if userRole === 'viewer'}
          <div class="alert alert-danger" style="margin-bottom: 1rem;">
            <span>🔒</span> Du bist im Ansichtsmodus eingeloggt und kannst keine Einstellungen ändern.
          </div>
        {/if}
        <div class="form-group">
          <label for="newAdminPassword">Neues Admin-Passwort</label>
          <input
            id="newAdminPassword"
            type="password"
            placeholder="Leer lassen für keine Änderung"
            bind:value={newAdminPassword}
            disabled={loading || userRole === 'viewer'}
          />
          <span class="input-help">Passwort für den vollen Zugriff (Planung & Admin).</span>
        </div>

        <div class="form-group">
          <label for="newTeamPassword">Neues Team-Passwort</label>
          <input
            id="newTeamPassword"
            type="password"
            placeholder="Leer lassen für keine Änderung"
            bind:value={newTeamPassword}
            disabled={loading || userRole === 'viewer'}
          />
          <span class="input-help">Passwort für den Lesezugriff auf den Wochenplan.</span>
        </div>

        <hr class="divider" />

        <div class="form-group confirm-group">
          <label for="currentAdminPassword">Aktuelles Admin-Passwort bestätigen</label>
          <input
            id="currentAdminPassword"
            type="password"
            placeholder="Zur Bestätigung hier eingeben..."
            bind:value={currentAdminPassword}
            disabled={loading || userRole === 'viewer'}
            required
          />
          <span class="input-help-required">Erforderlich, um die Änderungen zu speichern.</span>
        </div>

        <button type="submit" class="save-btn" disabled={loading || userRole === 'viewer'}>
          {#if loading}
            <span class="spinner-btn"></span> Speichere...
          {:else}
            Änderungen speichern
          {/if}
        </button>
      </form>
    </div>
  </div>

  <!-- WhatsApp Notification Gateway Configuration -->
  <div class="glass-card form-card" style="margin-top: 0.5rem;">
    <h2>📲 WhatsApp-Benachrichtigungen bei Plan-Abweichungen</h2>
    <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin: 0;">
      Sobald ein Wochenplan <strong>genehmigt</strong> ist und es bei einer Person Abweichungen von den als <strong>„🤝 Fest vereinbart“</strong> markierten Slots gibt, öffnet sich automatisch das Bestätigungsfenster. Der kostenlose 1-Klick-Versand über WhatsApp (`wa.me`) funktioniert sofort ohne Einrichtung. Optional kannst du hier ein kostenloses API-Gateway (z. B. Green-API Free Developer Plan) hinterlegen, um Nachrichten direkt im Hintergrund zu versenden.
    </p>

    <form onsubmit={handleSaveWhatsAppConfig} class="settings-form">
      {#if waFeedback}
        <div class="alert {waFeedback.type === 'ok' ? 'alert-success' : 'alert-danger'}">
          <span>{waFeedback.type === 'ok' ? '✅' : '⚠️'}</span> {waFeedback.text}
        </div>
      {/if}

      <div class="form-group">
        <label for="waProviderSelect">Versand-Methode im Bestätigungsfenster</label>
        <select
          id="waProviderSelect"
          class="form-select"
          style="padding: 0.75rem 1rem; border-radius: 10px; border: 1.5px solid #cbd5e1; font-size: 0.95rem;"
          bind:value={waProvider}
          disabled={userRole === 'viewer'}
        >
          <option value="wa_link_only">💬 Kostenloser 1-Klick-Versand via WhatsApp App / Web (Standard, 0 € & ohne Setup)</option>
          <option value="green_api">🚀 Green-API (Kostenloser Developer-Tarif – 1-Klick Hintergrundversand)</option>
          <option value="meta_cloud">🏢 Offizielle Meta WhatsApp Cloud API</option>
          <option value="custom_webhook">🔗 Eigener Webhook (Make / n8n / WAHA)</option>
        </select>
      </div>

      {#if waProvider === 'green_api'}
        <div class="settings-grid" style="gap: 1rem;">
          <div class="form-group">
            <label for="waGreenInstance">Green-API `idInstance`</label>
            <input
              id="waGreenInstance"
              type="text"
              placeholder="z. B. 7103948572"
              bind:value={waGreenInstanceId}
              disabled={userRole === 'viewer'}
            />
          </div>
          <div class="form-group">
            <label for="waGreenToken">Green-API `apiTokenInstance`</label>
            <input
              id="waGreenToken"
              type="password"
              placeholder="Dein Green-API Token"
              bind:value={waGreenToken}
              disabled={userRole === 'viewer'}
            />
          </div>
        </div>
      {:else if waProvider === 'meta_cloud'}
        <div class="settings-grid" style="gap: 1rem;">
          <div class="form-group">
            <label for="waMetaPhoneId">Meta `Phone Number ID`</label>
            <input
              id="waMetaPhoneId"
              type="text"
              placeholder="z. B. 109283746512345"
              bind:value={waMetaPhoneId}
              disabled={userRole === 'viewer'}
            />
          </div>
          <div class="form-group">
            <label for="waMetaToken">Meta Permanent `Access Token`</label>
            <input
              id="waMetaToken"
              type="password"
              placeholder="EAAG..."
              bind:value={waMetaToken}
              disabled={userRole === 'viewer'}
            />
          </div>
        </div>
      {:else if waProvider === 'custom_webhook'}
        <div class="form-group">
          <label for="waWebhookUrl">Webhook POST-URL</label>
          <input
            id="waWebhookUrl"
            type="url"
            placeholder="https://hook.eu1.make.com/..."
            bind:value={waWebhookUrl}
            disabled={userRole === 'viewer'}
          />
        </div>
      {/if}

      <div class="form-group">
        <label for="waBaseAppUrl">Öffentliche Basis-URL für den Wochenplan-Link in der Nachricht (optional)</label>
        <input
          id="waBaseAppUrl"
          type="text"
          placeholder="Leer lassen für automatische Erkennung"
          bind:value={waBaseAppUrl}
          disabled={userRole === 'viewer'}
        />
        <span class="input-help">Wird genutzt, um am Ende der WhatsApp-Nachricht den direkten Link zum persönlichen Wochenplan anzuhängen.</span>
      </div>

      {#if waProvider !== 'wa_link_only'}
        <div style="display: flex; align-items: flex-end; gap: 0.75rem; flex-wrap: wrap; background: #f8fafc; padding: 0.85rem 1rem; border-radius: 10px; border: 1px solid #e2e8f0;">
          <div class="form-group" style="flex: 1; min-width: 220px; margin: 0;">
            <label for="waTestPhone">Test-Nachricht an Nummer senden:</label>
            <input
              id="waTestPhone"
              type="text"
              placeholder="z. B. 0170 1234567"
              bind:value={waTestPhone}
              disabled={userRole === 'viewer'}
            />
          </div>
          <button
            type="button"
            class="save-btn"
            style="background: #0284c7; padding: 0.75rem 1.25rem;"
            onclick={handleTestWhatsAppApi}
            disabled={waTesting || userRole === 'viewer'}
          >
            {waTesting ? 'Sende Test...' : '🚀 Gateway testen'}
          </button>
        </div>
      {/if}

      <button type="submit" class="save-btn" disabled={waSaving || userRole === 'viewer'}>
        {waSaving ? 'Speichere...' : '💾 WhatsApp-Konfiguration speichern'}
      </button>
    </form>
  </div>
</div>

<style>
  .settings-page-wrapper {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    font-family: 'Outfit', sans-serif;
  }

  .header-section h1 {
    font-size: 2.25rem;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  .subtitle {
    font-size: 0.95rem;
    color: var(--text-secondary);
  }

  .settings-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }

  @media (max-width: 900px) {
    .settings-grid {
      grid-template-columns: 1fr;
    }
  }

  .info-card, .form-card {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .info-card h2, .form-card h2 {
    font-size: 1.35rem;
    color: var(--text-primary);
    border-bottom: 1.5px solid rgba(234, 217, 201, 0.6);
    padding-bottom: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .roles-list {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .role-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .role-badge {
    align-self: flex-start;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .admin-badge {
    background-color: var(--primary-glow);
    color: var(--primary);
    border: 1px solid var(--primary);
  }

  .team-badge {
    background-color: #f1f5f9;
    color: #475569;
    border: 1px solid #cbd5e1;
  }

  .role-desc {
    font-size: 0.88rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  .info-alert {
    background-color: #fff9e6;
    border: 1px solid #ffe082;
    border-radius: 12px;
    padding: 1rem;
    display: flex;
    gap: 0.75rem;
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  .info-icon {
    font-size: 1.2rem;
  }

  .settings-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .alert {
    padding: 0.75rem 1rem;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .alert-danger {
    background-color: #fef2f2;
    border: 1px solid #fca5a5;
    color: #b91c1c;
  }

  .alert-success {
    background-color: #f0fdf4;
    border: 1px solid #86efac;
    color: #15803d;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .form-group label {
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .form-group input {
    padding: 0.75rem 1rem;
    border: 1px solid var(--border-color);
    border-radius: 10px;
    font-family: inherit;
    font-size: 0.95rem;
    background-color: var(--bg-main);
    color: var(--text-primary);
    transition: var(--transition-smooth);
  }

  .form-group input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-glow);
  }

  .input-help {
    font-size: 0.78rem;
    color: var(--text-muted);
  }

  .input-help-required {
    font-size: 0.78rem;
    color: var(--primary);
    font-weight: 600;
  }

  .divider {
    border: none;
    border-top: 1.5px dashed rgba(234, 217, 201, 0.8);
    margin: 0.5rem 0;
  }

  .confirm-group input {
    border-color: var(--primary);
    background-color: var(--primary-glow);
  }

  .save-btn {
    padding: 0.85rem;
    border: none;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--primary) 0%, #7d0034 100%);
    color: white;
    font-weight: 700;
    font-size: 0.95rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    box-shadow: 0 4px 12px var(--primary-glow);
    transition: var(--transition-smooth);
    margin-top: 0.5rem;
  }

  .save-btn:hover:not(:disabled) {
    transform: translateY(-1.5px);
    box-shadow: 0 6px 16px rgba(150, 0, 64, 0.25);
  }

  .save-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .save-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .spinner-btn {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
