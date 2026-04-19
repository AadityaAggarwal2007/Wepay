'use client';

import { useState, useEffect } from 'react';

interface PaymentLink {
  id: number;
  orderId: string;
  customerMobile: string;
  customerName: string | null;
  amount: number;
  status: string;
  utr: string | null;
  remark1: string | null;
  createdAt: string;
  paymentUrl?: string;
}

export default function PaymentLinksPage() {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Fetch existing payment links
  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const res = await fetch('/api/payment-links');
      const data = await res.json();
      if (data.success) setLinks(data.links || []);
    } catch {
      // silent
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile || !amount) return;

    setLoading(true);
    setError('');
    setGeneratedLink('');

    try {
      const res = await fetch('/api/payment-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_mobile: mobile,
          customer_name: name || undefined,
          amount: parseFloat(amount),
          remark1: remark || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setGeneratedLink(data.paymentUrl);
        // Reset form
        setName('');
        setMobile('');
        setAmount('');
        setRemark('');
        // Refresh the list
        fetchLinks();
      } else {
        setError(data.message || 'Failed to generate link');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLinkById = (url: string) => {
    navigator.clipboard?.writeText(url);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      + '\n' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'badge-warning',
      SUCCESS: 'badge-success',
      FAILED: 'badge-danger',
      EXPIRED: 'badge-secondary',
      CANCELLED: 'badge-secondary',
    };
    return map[status] || 'badge-warning';
  };

  return (
    <>
      {/* Page Header */}
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
        <i className="fas fa-link" style={{ color: 'var(--primary)' }} />
        Payment Link
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 14 }}>
        Create and manage payment links for your customers
      </p>

      {/* Generated Link Banner */}
      {generatedLink && (
        <div style={{
          background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
          border: '1px solid #6ee7b7',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}>
          <i className="fas fa-check-circle" style={{ color: '#059669', fontSize: 20 }} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 700, color: '#065f46', marginBottom: 4 }}>Payment Link Generated!</div>
            <div style={{
              background: '#fff',
              border: '1px solid #a7f3d0',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 13,
              fontFamily: 'monospace',
              wordBreak: 'break-all',
              color: '#1e40af',
            }}>
              {generatedLink}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={copyLink}
              className="btn btn-primary"
              style={{ whiteSpace: 'nowrap', fontSize: 13 }}
            >
              <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`} />{' '}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <a
              href={generatedLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{
                whiteSpace: 'nowrap',
                fontSize: 13,
                background: '#fff',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            >
              <i className="fas fa-external-link-alt" /> Open
            </a>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fca5a5',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 16px',
          marginBottom: 20,
          color: '#991b1b',
          fontSize: 14,
        }}>
          <i className="fas fa-exclamation-triangle" /> {error}
        </div>
      )}

      {/* Create Payment Link Form */}
      <div className="card mb-24">
        <div className="card-body">
          <h2 className="card-title" style={{ marginBottom: 20 }}>
            <i className="fas fa-plus-circle" style={{ color: 'var(--primary)' }} />
            Create New Payment Link
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">CUSTOMER NAME</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-control"
                    placeholder="Enter customer name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ paddingLeft: 40 }}
                  />
                  <i className="fas fa-user" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">MOBILE NUMBER</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-control"
                    placeholder="Enter mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    pattern="[0-9]{10}"
                    style={{ paddingLeft: 40 }}
                    required
                  />
                  <i className="fas fa-phone" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">AMOUNT (₹)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    className="form-control"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{ paddingLeft: 40 }}
                    required
                  />
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 700 }}>₹</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">REMARK (OPTIONAL)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-control"
                    placeholder="e.g., Gift, Deposit, Service Fee"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    style={{ paddingLeft: 40 }}
                  />
                  <i className="fas fa-comment" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              disabled={loading}
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', marginTop: 8 }}
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin" /> Generating...</>
              ) : (
                <><i className="fas fa-bolt" /> GENERATE PAYMENT LINK</>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Recent Payment Links */}
      <div className="card">
        <div className="card-body">
          <h2 className="card-title" style={{ marginBottom: 20 }}>
            <i className="fas fa-history" style={{ color: 'var(--text-secondary)' }} />
            Recent Payment Links
          </h2>

          {links.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <i className="fas fa-inbox" style={{ fontSize: 40, marginBottom: 12, display: 'block', opacity: 0.4 }} />
              <p>No payment links created yet. Generate your first one above!</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Customer</th>
                    <th>Order ID</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>UTR</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((link, i) => (
                    <tr key={link.id}>
                      <td>{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{link.customerMobile}</div>
                        {link.customerName && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{link.customerName}</div>
                        )}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{link.orderId}</td>
                      <td style={{ fontWeight: 600 }}>₹{link.amount.toFixed(2)}</td>
                      <td><span className={`badge ${statusBadge(link.status)}`}>{link.status}</span></td>
                      <td style={{ color: link.utr ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 12 }}>
                        {link.utr || 'N/A'}
                      </td>
                      <td style={{ fontSize: 12, whiteSpace: 'pre-line' }}>{formatDate(link.createdAt)}</td>
                      <td>
                        {link.paymentUrl && link.status === 'PENDING' && (
                          <button
                            onClick={() => copyLinkById(link.paymentUrl!)}
                            className="btn"
                            style={{ fontSize: 11, padding: '4px 10px', background: 'var(--bg-body)', border: '1px solid var(--border)' }}
                          >
                            <i className="fas fa-copy" /> Copy
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
