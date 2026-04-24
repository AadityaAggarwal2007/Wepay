'use client';

import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/lib/authFetch';

interface DashboardData {
  today: { received: number; success: number; pending: number; failed: number };
  allTime: Record<string, { amount: number; count: number }>;
  chartData: { date: string; day: string; success: number; pending: number; failed: number; count: number }[];
  recentTransactions: { id: number; orderId: string; mobile: string; amount: number; status: string; utr: string | null; date: string }[];
  merchants: { total: number; active: number };
  user: { name: string; role: string; planExpiresAt: string | null };
}

export default function DashboardPage() {
  const [chartPeriod, setChartPeriod] = useState('7D');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [merchantHealth, setMerchantHealth] = useState<{ overall: string; merchants: { id: number; status: string; message: string; healthy: boolean; hoursSinceRefresh: number | null }[] } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, healthRes] = await Promise.all([
        authFetch('/api/dashboard'),
        authFetch('/api/merchants/health'),
      ]);
      if (dashRes.ok) setData(await dashRes.json());
      if (healthRes.ok) setMerchantHealth(await healthRes.json());
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const today = data?.today || { received: 0, success: 0, pending: 0, failed: 0 };
  const allTime = data?.allTime || {};
  const chartData = data?.chartData || [];

  // Calculate percentages for transaction types
  const totalCount = Object.values(allTime).reduce((s, v) => s + v.count, 0) || 1;
  const successPct = Math.round(((allTime['SUCCESS']?.count || 0) / totalCount) * 100);
  const pendingPct = Math.round(((allTime['PENDING']?.count || 0) / totalCount) * 100);
  const failedPct = Math.round(((allTime['FAILED']?.count || 0) / totalCount) * 100);

  // Chart max value for scaling bars
  const maxChartVal = Math.max(...chartData.map(d => d.success + d.pending + d.failed), 1);

  const fmt = (n: number) => `₹${n.toFixed(2)}`;

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: 24, marginBottom: 12, display: 'block' }} />
        Loading dashboard...
      </div>
    );
  }

  return (
    <>
      {/* BharatPe Token Health Banner */}
      {merchantHealth && (
        <div style={{
          padding: '12px 20px', borderRadius: 'var(--radius-md)', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 12,
          background: merchantHealth.overall === 'HEALTHY'
            ? 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.05))'
            : merchantHealth.overall === 'EXPIRED'
            ? 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(220,38,38,0.05))'
            : 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.05))',
          border: `1px solid ${merchantHealth.overall === 'HEALTHY' ? 'var(--success)' : merchantHealth.overall === 'EXPIRED' ? 'var(--danger)' : 'var(--warning)'}`,
        }}>
          <i className={`fas ${merchantHealth.overall === 'HEALTHY' ? 'fa-check-circle' : merchantHealth.overall === 'EXPIRED' ? 'fa-exclamation-triangle' : 'fa-info-circle'}`}
            style={{ fontSize: 20, color: merchantHealth.overall === 'HEALTHY' ? 'var(--success)' : merchantHealth.overall === 'EXPIRED' ? 'var(--danger)' : 'var(--warning)' }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>
              {merchantHealth.overall === 'HEALTHY' && '🟢 Payment Detection Active'}
              {merchantHealth.overall === 'EXPIRED' && '🔴 BharatPe Token Expired — Payments NOT being detected!'}
              {merchantHealth.overall === 'NO_MERCHANTS' && '🟡 No merchants connected'}
            </div>
            {merchantHealth.overall === 'EXPIRED' && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                Login to <a href="https://enterprise.bharatpe.in" target="_blank" rel="noopener" style={{ color: 'var(--primary)', fontWeight: 600 }}>enterprise.bharatpe.in</a>,
                open DevTools → Network, find a &quot;tesseract&quot; request, copy the <code style={{ background: 'var(--bg-body)', padding: '1px 4px', borderRadius: 3 }}>token</code> header and update via Connect Merchant.
              </div>
            )}
            {merchantHealth.merchants?.[0]?.hoursSinceRefresh != null && merchantHealth.overall === 'HEALTHY' && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Last verified {merchantHealth.merchants[0].hoursSinceRefresh}h ago
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon"><i className="fas fa-rupee-sign" /></div>
          <div className="stat-label">Today Received Payment</div>
          <div className="stat-value">{fmt(today.received)}</div>
          <div className={`stat-change ${today.received > 0 ? 'up' : ''}`}>
            {today.received > 0 ? '↑' : '—'} {today.success} txn{today.success !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><i className="fas fa-exchange-alt" /></div>
          <div className="stat-label">Today Success Transactions</div>
          <div className="stat-value">{today.success}</div>
          <div className={`stat-change ${today.success > 0 ? 'up' : ''}`}>
            {today.success > 0 ? '↑' : '—'} {fmt(today.received)}
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon"><i className="fas fa-clock" /></div>
          <div className="stat-label">Today Pending Payment</div>
          <div className="stat-value">{fmt(today.pending)}</div>
          <div className="stat-change">{today.pending > 0 ? '⏳ Active' : '— None'}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon"><i className="fas fa-times-circle" /></div>
          <div className="stat-label">Today Failed Payment</div>
          <div className="stat-value">{fmt(today.failed)}</div>
          <div className="stat-change">{today.failed > 0 ? '↓ Check logs' : '— None'}</div>
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
              {chartData.map((d) => {
                const sH = (d.success / maxChartVal) * 200;
                const pH = (d.pending / maxChartVal) * 200;
                const fH = (d.failed / maxChartVal) * 200;
                return (
                  <div key={d.date} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                      {sH > 0 && (
                        <div
                          style={{
                            width: 12, height: Math.max(4, sH),
                            background: 'var(--success)', borderRadius: '3px 3px 0 0',
                            transition: 'height 0.5s',
                          }}
                          title={`Success: ${fmt(d.success)}`}
                        />
                      )}
                      {pH > 0 && (
                        <div
                          style={{
                            width: 12, height: Math.max(4, pH),
                            background: 'var(--warning)', borderRadius: '3px 3px 0 0',
                            transition: 'height 0.5s',
                          }}
                          title={`Pending: ${fmt(d.pending)}`}
                        />
                      )}
                      {fH > 0 && (
                        <div
                          style={{
                            width: 12, height: Math.max(4, fH),
                            background: 'var(--danger)', borderRadius: '3px 3px 0 0',
                            transition: 'height 0.5s',
                          }}
                          title={`Failed: ${fmt(d.failed)}`}
                        />
                      )}
                      {sH === 0 && pH === 0 && fH === 0 && (
                        <div style={{ width: 12, height: 4, background: 'var(--border)', borderRadius: 3 }} />
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>{d.day}</span>
                  </div>
                );
              })}
              {/* Y-axis */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 20,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                fontSize: 11, color: 'var(--text-muted)',
              }}>
                {[maxChartVal, maxChartVal * 0.75, maxChartVal * 0.5, maxChartVal * 0.25, 0].map((v, i) => (
                  <span key={i}>₹{Math.round(v)}</span>
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
              { label: 'Success Transactions', amount: fmt(allTime['SUCCESS']?.amount || 0), pct: `${successPct}%`, color: 'var(--success)', count: allTime['SUCCESS']?.count || 0 },
              { label: 'Pending Transactions', amount: fmt(allTime['PENDING']?.amount || 0), pct: `${pendingPct}%`, color: 'var(--warning)', count: allTime['PENDING']?.count || 0 },
              { label: 'Failed Transactions', amount: fmt(allTime['FAILED']?.amount || 0), pct: `${failedPct}%`, color: 'var(--danger)', count: allTime['FAILED']?.count || 0 },
              { label: 'Total Transactions', amount: fmt(Object.values(allTime).reduce((s, v) => s + v.amount, 0)), pct: `${totalCount === 1 && !data ? '0' : totalCount}`, color: 'var(--info)', count: totalCount === 1 && !data ? 0 : totalCount },
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
                      width: 10, height: 10, borderRadius: '50%',
                      background: item.color,
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.amount} ({item.count})</div>
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
