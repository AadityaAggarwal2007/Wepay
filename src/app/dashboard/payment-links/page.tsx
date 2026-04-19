'use client';

import { useState } from 'react';

const mockLinks = [
  { id: 1, mobile: '9289144767', orderId: '65427485...', amount: 1.12, status: 'Pending', utr: 'N/A', method: 'Bharatpe', date: '19 Apr 2026\n10:33 AM' },
  { id: 2, mobile: '9289144767', orderId: '31998658...', amount: 1.27, status: 'Pending', utr: 'N/A', method: 'Bharatpe', date: '19 Apr 2026\n01:22 AM' },
  { id: 3, mobile: '9289144767', orderId: '40729321...', amount: 1.32, status: 'Pending', utr: 'N/A', method: 'Bharatpe', date: '19 Apr 2026\n01:03 AM' },
  { id: 4, mobile: '9289144767', orderId: '91714730...', amount: 3.69, status: 'Pending', utr: 'N/A', method: 'Bharatpe', date: '19 Apr 2026\n12:59 AM' },
];

export default function PaymentLinksPage() {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Payment link generated!');
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

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-value">₹0.00</div>
          <div className="stat-label">Today&apos;s Collection</div>
          <div className="stat-change up">↑ Today&apos;s total</div>
        </div>
        <div className="stat-card green">
          <div className="stat-value">0</div>
          <div className="stat-label">Links Created Today</div>
          <div className="stat-change up">↑ Active links</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-value">0%</div>
          <div className="stat-label">Success Rate (7 Days)</div>
          <div className="stat-change down">↓ Last 7 days</div>
        </div>
        <div className="stat-card red">
          <div className="stat-value">4</div>
          <div className="stat-label">Pending Payments</div>
          <div className="stat-change down">⚠ Needs attention</div>
        </div>
      </div>

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
            <button type="submit" className="btn btn-primary btn-lg btn-block" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', marginTop: 8 }}>
              <i className="fas fa-bolt" /> GENERATE PAYMENT LINK
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

          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer Mobile</th>
                <th>Order ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>UTR</th>
                <th>Method</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {mockLinks.map((link) => (
                <tr key={link.id}>
                  <td>{link.id}</td>
                  <td style={{ fontWeight: 700 }}>{link.mobile}</td>
                  <td>{link.orderId}</td>
                  <td style={{ fontWeight: 600 }}>₹{link.amount.toFixed(2)}</td>
                  <td><span className="badge badge-warning">{link.status}</span></td>
                  <td style={{ color: 'var(--text-muted)' }}>{link.utr}</td>
                  <td>{link.method}</td>
                  <td style={{ fontSize: 12, whiteSpace: 'pre-line' }}>{link.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
