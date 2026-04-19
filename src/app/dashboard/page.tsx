'use client';

import { useState } from 'react';

export default function DashboardPage() {
  const [chartPeriod, setChartPeriod] = useState('7D');

  return (
    <>
      {/* Stats Row */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon"><i className="fas fa-rupee-sign" /></div>
          <div className="stat-label">Today Received Payment</div>
          <div className="stat-value">₹0.00</div>
          <div className="stat-change up">↑ 0%</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><i className="fas fa-exchange-alt" /></div>
          <div className="stat-label">Today Success Transactions</div>
          <div className="stat-value">0</div>
          <div className="stat-change up">↑ 0%</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon"><i className="fas fa-clock" /></div>
          <div className="stat-label">Today Pending Payment</div>
          <div className="stat-value">₹0.00</div>
          <div className="stat-change down">↓ 100%</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon"><i className="fas fa-times-circle" /></div>
          <div className="stat-label">Today Failed Payment</div>
          <div className="stat-value">₹0.00</div>
          <div className="stat-change down">↓ 100%</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="chart-section">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Transaction Trends</h3>
            <div className="chart-tabs">
              {['7D', '30D', '90D'].map((p) => (
                <button
                  key={p}
                  className={`chart-tab ${chartPeriod === p ? 'active' : ''}`}
                  onClick={() => setChartPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--success)' }} />
                Success
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--warning)' }} />
                Pending
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--danger)' }} />
                Failed
              </span>
            </div>
            {/* Chart placeholder — will integrate Chart.js */}
            <div
              style={{
                height: 260,
                background: 'linear-gradient(to top, var(--bg-body), transparent)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-around',
                padding: '0 20px 20px',
                position: 'relative',
              }}
            >
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                <div key={day} style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: 40,
                      height: Math.max(20, Math.random() * 120),
                      background: i === 5 ? 'var(--warning)' : 'var(--border)',
                      borderRadius: '4px 4px 0 0',
                      marginBottom: 8,
                      transition: 'height 0.3s',
                    }}
                  />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{day}</span>
                </div>
              ))}
              {/* Y-axis labels */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 20,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                fontSize: 11, color: 'var(--text-muted)',
              }}>
                {['₹8', '₹6', '₹4', '₹2', '₹0'].map(v => (
                  <span key={v}>{v}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Types */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Transaction Types</h3>
          </div>
          <div className="card-body">
            {[
              { label: 'Success Transactions', amount: '₹0.00', pct: '0%', color: 'var(--success)' },
              { label: 'Pending Transactions', amount: '₹0.00', pct: '0%', color: 'var(--warning)' },
              { label: 'Failed Transactions', amount: '₹0.00', pct: '0%', color: 'var(--danger)' },
              { label: 'Total Transactions', amount: '₹0.00', pct: '100%', color: 'var(--info)' },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 0',
                  borderBottom: '1px solid var(--border-light)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: item.color,
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.amount}</div>
                  </div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{item.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
