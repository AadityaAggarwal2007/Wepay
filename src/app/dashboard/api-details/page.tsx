'use client';

import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/lib/authFetch';

export default function ApiDetailsPage() {
  const [token, setToken] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [savingWebhook, setSavingWebhook] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await authFetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setToken(data.apiToken || '');
        setWebhookUrl(data.webhookUrl || '');
      }
    } catch (e) {
      console.error('Failed to load API details:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const copyToken = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateNewToken = async () => {
    if (!confirm('Are you sure? This will invalidate the current token.')) return;
    setGenerating(true);
    try {
      const res = await authFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_token' }),
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.apiToken);
        alert('New API token generated!');
      }
    } catch {
      alert('Failed to generate token');
    } finally {
      setGenerating(false);
    }
  };

  const updateWebhook = async () => {
    if (webhookUrl && !webhookUrl.match(/^https?:\/\//)) {
      alert('URL must start with http or https');
      return;
    }
    setSavingWebhook(true);
    try {
      const res = await authFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_webhook', webhookUrl }),
      });
      if (res.ok) {
        alert('Webhook URL updated!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update webhook');
      }
    } catch {
      alert('Network error');
    } finally {
      setSavingWebhook(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: 24 }} /> Loading...
      </div>
    );
  }

  return (
    <>
      {/* API Token */}
      <div className="card mb-24">
        <div className="card-body">
          <h2 className="card-title" style={{ marginBottom: 4 }}>
            <i className="fas fa-key" style={{ color: 'var(--primary)' }} />
            API Token
          </h2>
          <p className="card-subtitle" style={{ marginBottom: 20 }}>Use this token to authenticate your API requests</p>

          <label className="form-label">Your API Token</label>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input className="form-control" value={token} readOnly style={{ fontFamily: 'monospace', fontSize: 15, background: 'var(--bg-body)', flex: 1 }} />
            <button
              className="btn btn-outline btn-icon"
              onClick={copyToken}
              title="Copy token"
              style={{ width: 44, height: 44, fontSize: 16 }}
            >
              <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`} style={{ color: copied ? 'var(--success)' : undefined }} />
            </button>
          </div>

          <button className="btn btn-success" style={{ marginTop: 16 }} onClick={generateNewToken} disabled={generating}>
            <i className={generating ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'} /> {generating ? 'Generating...' : 'Generate New Token'}
          </button>
        </div>
      </div>

      {/* Webhook URL */}
      <div className="card mb-24">
        <div className="card-body">
          <h2 className="card-title" style={{ marginBottom: 4 }}>Webhook URL</h2>
          <p className="card-subtitle" style={{ marginBottom: 20 }}>Transaction updates will be sent to this URL</p>

          <div className="form-group">
            <label className="form-label">Webhook URL</label>
            <input
              className="form-control"
              placeholder="https://yourwebsite.com/webhook"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
            <span style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4, display: 'block' }}>
              URL must include http or https
            </span>
          </div>

          <button className="btn btn-primary" onClick={updateWebhook} disabled={savingWebhook}>
            <i className={savingWebhook ? 'fas fa-spinner fa-spin' : 'fas fa-save'} /> {savingWebhook ? 'Saving...' : 'Update Webhook'}
          </button>
        </div>
      </div>

      {/* Security Instructions */}
      <div className="card">
        <div className="card-body">
          <h2 className="card-title" style={{ marginBottom: 16 }}>API Security Instructions</h2>
          {[
            'Never share your API key with anyone.',
            'Store API keys securely.',
            'Rotate API keys periodically.',
            'Monitor account activity regularly.',
            'Contact support if you detect misuse.',
          ].map((item) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', fontSize: 14, color: 'var(--text-secondary)' }}>
              <i className="fas fa-shield-alt" style={{ color: 'var(--primary)', fontSize: 12 }} /> {item}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
