'use client';

import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/lib/authFetch';

interface Transaction {
  id: number;
  orderId: string;
  gatewayTxn: string | null;
  mobile: string;
  amount: number;
  status: string;
  utr: string | null;
  merchant: string;
  date: string;
}

interface Stats {
  [key: string]: { amount: number; count: number };
}

export default function TransactionsPage() {
  const [filter, setFilter] = useState('All');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/transactions?status=${filter}&page=${page}&perPage=${perPage}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setStats(data.stats || {});
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (e) {
      console.error('Failed to fetch transactions:', e);
    } finally {
      setLoading(false);
    }
  }, [filter, page, perPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to page 1 when filter changes
  useEffect(() => { setPage(1); }, [filter, perPage]);

  const fmt = (n: number) => `₹${n.toFixed(2)}`;
  const totalReceived = Object.values(stats).reduce((s, v) => s + v.amount, 0);
  const totalTxns = Object.values(stats).reduce((s, v) => s + v.count, 0);

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
          <div className="stat-value">{fmt(totalReceived)}</div>
          <div className="stat-label">All Time Received</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{totalTxns} transactions</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon" style={{ background: '#ecfdf5' }}><span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--success)', display: 'block' }} /></div>
          <div className="stat-value">{fmt(stats['SUCCESS']?.amount || 0)}</div>
          <div className="stat-label">All Time Success</div>
          <div className="stat-change up">↑ {stats['SUCCESS']?.count || 0} txns</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon" style={{ background: '#fffbeb' }}><span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--warning)', display: 'block' }} /></div>
          <div className="stat-value">{fmt(stats['PENDING']?.amount || 0)}</div>
          <div className="stat-label">All Time Pending</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{stats['PENDING']?.count || 0} txns</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon" style={{ background: '#fef2f2' }}><span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--danger)', display: 'block' }} /></div>
          <div className="stat-value">{fmt(stats['FAILED']?.amount || 0)}</div>
          <div className="stat-label">All Time Failed</div>
          <div className="stat-change down">↓ {stats['FAILED']?.count || 0} txns</div>
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
              <option value="EXPIRED">Expired</option>
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

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: 20 }} /> Loading...
            </div>
          ) : transactions.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <i className="fas fa-inbox" style={{ fontSize: 32, marginBottom: 12, display: 'block' }} />
              No transactions found
            </div>
          ) : (
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
                {transactions.map((txn, idx) => (
                  <tr key={txn.id}>
                    <td>{(page - 1) * perPage + idx + 1}</td>
                    <td style={{ fontWeight: 500 }}>{txn.mobile}</td>
                    <td style={{ fontSize: 12 }}>{new Date(txn.date).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'medium' })}</td>
                    <td>{txn.merchant}</td>
                    <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{txn.gatewayTxn || '-'}</td>
                    <td style={{ fontSize: 12, fontFamily: 'monospace', color: txn.utr ? 'var(--success)' : 'var(--text-muted)' }}>{txn.utr || '-'}</td>
                    <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{txn.orderId}</td>
                    <td style={{ fontWeight: 700 }}>₹{txn.amount.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${txn.status === 'SUCCESS' ? 'badge-success' : txn.status === 'PENDING' ? 'badge-warning' : txn.status === 'EXPIRED' ? 'badge-secondary' : 'badge-danger'}`}>
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="pagination">
            <span className="pagination-info">
              Showing {Math.min((page - 1) * perPage + 1, total)} to {Math.min(page * perPage, total)} of {total} entries
            </span>
            <div className="pagination-controls">
              <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button key={p} className={`pagination-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="pagination-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
