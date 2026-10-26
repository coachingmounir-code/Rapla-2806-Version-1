import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { phone, message, config } = body || {};

    if (!phone || !message) {
      return json({ success: false, error: 'Telefonnummer und Nachrichtentext sind erforderlich.' }, { status: 400 });
    }

    const provider = config?.provider || 'wa_link_only';
    const cleanPhone = String(phone).replace(/[^\d]/g, '');

    if (provider === 'green_api') {
      const instanceId = (config?.greenApiInstanceId || '').trim();
      const token = (config?.greenApiToken || '').trim();
      if (!instanceId || !token) {
        return json(
          { success: false, error: 'Green-API Instance-ID oder Token fehlt in den Einstellungen.' },
          { status: 400 }
        );
      }

      const url = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: `${cleanPhone}@c.us`,
          message
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return json(
          { success: false, error: data?.message || `Green-API Fehler (HTTP ${res.status})` },
          { status: res.status }
        );
      }
      return json({ success: true, provider: 'green_api', idMessage: data?.idMessage });
    }

    if (provider === 'meta_cloud') {
      const phoneNumberId = (config?.metaPhoneNumberId || '').trim();
      const accessToken = (config?.metaAccessToken || '').trim();
      if (!phoneNumberId || !accessToken) {
        return json(
          { success: false, error: 'Meta Phone-Number-ID oder Access-Token fehlt in den Einstellungen.' },
          { status: 400 }
        );
      }

      const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: { preview_url: true, body: message }
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const metaErr = data?.error?.message || `Meta API Fehler (HTTP ${res.status})`;
        return json({ success: false, error: metaErr }, { status: res.status });
      }
      return json({ success: true, provider: 'meta_cloud', data });
    }

    if (provider === 'custom_webhook') {
      const webhookUrl = (config?.customWebhookUrl || '').trim();
      if (!webhookUrl) {
        return json({ success: false, error: 'Webhook-URL fehlt in den Einstellungen.' }, { status: 400 });
      }

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          message,
          timestamp: new Date().toISOString()
        })
      });

      if (!res.ok) {
        return json({ success: false, error: `Webhook Fehler (HTTP ${res.status})` }, { status: res.status });
      }
      return json({ success: true, provider: 'custom_webhook' });
    }

    return json(
      {
        success: false,
        error: 'Kein API-Gateway konfiguriert. Bitte nutze den direkten 1-Klick-WhatsApp-Versand oder hinterlege ein Gateway in den Einstellungen.'
      },
      { status: 400 }
    );
  } catch (err: any) {
    return json({ success: false, error: err?.message || 'Serverfehler beim WhatsApp-Versand.' }, { status: 500 });
  }
};
