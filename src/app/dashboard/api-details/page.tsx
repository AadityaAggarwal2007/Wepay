'use client';

import { useState } from 'react';

export default function ApiDetailsPage() {
  const [token] = useState('bca364b01b5d0fa32d58a74d147c9cb9');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const copyToken = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

          <button className="btn btn-success" style={{ marginTop: 16 }}>
            Generate New Token
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

          <button className="btn btn-primary">Update Webhook</button>
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
              <span style={{ fontSize: 16 }}>👈</span> {item}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
