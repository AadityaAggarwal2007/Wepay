'use client';

import { useState } from 'react';

const mockTransactions = [
  { id: 1, mobile: '9289144767', date: '2026-04-19 10:33:12', merchant: 'Bharatpe', gtwTxn: '69e46210c8aed', orderId: '6542748542792', amount: 1.12, status: 'FAILED' },
  { id: 2, mobile: '9289144767', date: '2026-04-19 01:22:59', merchant: 'Bharatpe', gtwTxn: '69e3e11b7bbb4', orderId: '3199865819684', amount: 1.27, status: 'FAILED' },
  { id: 3, mobile: '9289144767', date: '2026-04-19 01:03:52', merchant: 'Bharatpe', gtwTxn: '69e3dca0f0589', orderId: '4072932176747', amount: 1.32, status: 'FAILED' },
  { id: 4, mobile: '9289144767', date: '2026-04-19 00:59:28', merchant: 'Bharatpe', gtwTxn: '69e3db984a8b7', orderId: '9171473098593', amount: 3.69, status: 'FAILED' },
];

export default function TransactionsPage() {
  const [filter, setFilter] = useState('All');
  const [perPage, setPerPage] = useState(10);

  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <i className="fas fa-exchange-alt" style={{ color: 'var(--primary)' }} />
        Transaction Dashboard
      </h1>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon"><i className="fas fa-credit-card" /></div>
          <div className="stat-value">₹7.40</div>
          <div className="stat-label">All Time Received</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>4 transactions</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon" style={{ background: '#ecfdf5' }}><span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--success)', display: 'block' }} /></div>
          <div className="stat-value">₹0.00</div>
          <div className="stat-label">All Time Success</div>
          <div className="stat-change up">↑ 0 txns</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon" style={{ background: '#fffbeb' }}><span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--warning)', display: 'block' }} /></div>
          <div className="stat-value">₹0.00</div>
          <div className="stat-label">All Time Pending</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>0 txns</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon" style={{ background: '#fef2f2' }}><span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--danger)', display: 'block' }} /></div>
          <div className="stat-value">₹7.40</div>
          <div className="stat-label">All Time Failed</div>
          <div className="stat-change down">↓ 4 txns</div>
        </div>
      </div>

      {/* Filter */}
      <div className="card mb-24">
        <div className="card-body" style={{ padding: '16px 24px' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-filter" style={{ color: 'var(--primary)' }} />
            Filter Transactions
          </h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <i className="fas fa-list" style={{ color: 'var(--text-muted)' }} />
            <select className="form-select" style={{ width: 200 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="All">All</option>
              <option value="SUCCESS">Success</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-16">
            <h2 className="card-title">
              <i className="fas fa-exchange-alt" style={{ color: 'var(--text-secondary)' }} />
              Transaction History
              <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>(All Time)</span>
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              Show:
              <select className="form-select" style={{ width: 80 }} value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              per page
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Mobile</th>
                <th>Date Time</th>
                <th>Merchant</th>
                <th>Gateway TXN</th>
                <th>UTR</th>
                <th>Order ID</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {mockTransactions
                .filter(t => filter === 'All' || t.status === filter)
                .map((txn) => (
                <tr key={txn.id}>
                  <td>{txn.id}</td>
                  <td style={{ fontWeight: 500 }}>{txn.mobile}</td>
                  <td style={{ fontSize: 12 }}>{txn.date}</td>
                  <td>{txn.merchant}</td>
                  <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{txn.gtwTxn}</td>
                  <td style={{ color: 'var(--text-muted)' }}>-</td>
                  <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{txn.orderId}</td>
                  <td style={{ fontWeight: 700 }}>₹{txn.amount.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${txn.status === 'SUCCESS' ? 'badge-success' : txn.status === 'PENDING' ? 'badge-warning' : 'badge-danger'}`}>
                      {txn.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <span className="pagination-info">Showing 1 to {mockTransactions.length} of {mockTransactions.length} entries</span>
            <div className="pagination-controls">
              <button className="pagination-btn">Previous</button>
              <button className="pagination-btn active">1</button>
              <button className="pagination-btn">Next</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
