'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface PaymentPageClientProps {
  amount: number;
  orderId: string;
  merchantName: string;
  remark: string;
  redirectUrl: string;
  qrDataUrl: string;
  paytmUri: string;
  fallbackUri: string;
  expirySeconds: number;
  isSandbox: boolean;
  platform: string;
  status: string;
}

export default function PaymentPageClient({
  amount,
  orderId,
  merchantName,
  remark,
  redirectUrl,
  qrDataUrl,
  paytmUri,
  expirySeconds,
  isSandbox,
  status: initialStatus,
}: PaymentPageClientProps) {
  const [status, setStatus] = useState(initialStatus);
  const [utr, setUtr] = useState('');
  const [remaining, setRemaining] = useState(expirySeconds);
  const [copied, setCopied] = useState(false);
  const polling = useRef(true);

  const safeAmount = amount.toFixed(2);
  const merchantInitial = merchantName.charAt(0).toUpperCase();

  // Timer
  useEffect(() => {
    if (status !== 'PENDING') return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setStatus('EXPIRED');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  // Polling
  const poll = useCallback(async () => {
    if (!polling.current || status !== 'PENDING') return;
    try {
      const res = await fetch(`/api/payment/status/${orderId}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.status === 'SUCCESS') {
        polling.current = false;
        setStatus('SUCCESS');
        setUtr(data.utr || '');
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
        if (redirectUrl) {
          setTimeout(() => { window.location.href = redirectUrl; }, 5000);
        }
      } else if (data.status === 'EXPIRED' || data.status === 'CANCELLED') {
        polling.current = false;
        setStatus('EXPIRED');
      } else {
        setTimeout(poll, 3000);
      }
    } catch {
      setTimeout(poll, 4000);
    }
  }, [orderId, redirectUrl, status]);

  useEffect(() => {
    if (status === 'PENDING') {
      const timeout = setTimeout(poll, 2000);
      return () => clearTimeout(timeout);
    }
  }, [poll, status]);

  const copyRef = () => {
    navigator.clipboard?.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m < 10 ? '0' : ''}${m}:${r < 10 ? '0' : ''}${r}`;
  };

  const pct = remaining / Math.max(expirySeconds, 1);

  if (status === 'SUCCESS') {
    return (
      <div style={styles.page}>
        <main style={styles.shell}>
          <header style={styles.topbar}>
            <div style={styles.brand}><div style={styles.logo}>W</div><div style={styles.brandName}>WePay</div></div>
            <div style={styles.secure}><span style={styles.dot} /> Secure Payment</div>
          </header>
          <section style={styles.card}>
            <div style={styles.cardInner}>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#e8f7ee', border: '1px solid #b8e6c8', display: 'grid', placeItems: 'center', margin: '0 auto 12px', color: '#0f9d58', fontSize: 28 }}>✓</div>
                <h3 style={{ fontWeight: 700, fontSize: 20 }}>Payment Successful!</h3>
                <p style={{ color: '#5b6b85', margin: '6px 0' }}>₹{safeAmount} paid to {merchantName}</p>
                {utr && <p style={{ fontSize: 12, color: '#8a98b1' }}>UTR: {utr}</p>}
                {redirectUrl && <p style={{ fontSize: 12, color: '#8a98b1', marginTop: 12 }}>Redirecting in 5s…</p>}
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (status === 'EXPIRED' || status === 'CANCELLED') {
    return (
      <div style={styles.page}>
        <main style={styles.shell}>
          <header style={styles.topbar}>
            <div style={styles.brand}><div style={styles.logo}>W</div><div style={styles.brandName}>WePay</div></div>
          </header>
          <section style={styles.card}>
            <div style={styles.cardInner}>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fdecec', border: '1px solid #f5c2c2', display: 'grid', placeItems: 'center', margin: '0 auto 12px', color: '#dc2626', fontSize: 28 }}>✗</div>
                <h3 style={{ fontWeight: 700, fontSize: 20 }}>Payment Expired</h3>
                <p style={{ color: '#5b6b85' }}>This link has expired. Please request a new one.</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // PENDING state — full payment page
  return (
    <div style={styles.page}>
      {isSandbox && <div style={styles.sandbox}>🧪 TEST MODE — No real payment</div>}
      <main style={styles.shell}>
        <header style={styles.topbar}>
          <div style={styles.brand}><div style={styles.logo}>W</div><div style={styles.brandName}>WePay</div></div>
          <div style={styles.secure}><span style={styles.dot} /> Secure Payment</div>
        </header>

        <section style={styles.card}>
          <div style={styles.cardInner}>
            {/* Merchant */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#eaf1ff', border: '1px solid #d6e4ff', display: 'grid', placeItems: 'center', color: '#1d4ed8', fontWeight: 700, fontSize: 16 }}>{merchantInitial}</div>
              <div><small style={{ color: '#5b6b85', fontSize: 12, display: 'block' }}>Paying to</small><strong style={{ fontWeight: 600 }}>{merchantName}</strong></div>
            </div>

            {/* Amount */}
            <div style={{ textAlign: 'center', padding: '6px 0 4px' }}>
              <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#8a98b1', marginBottom: 6 }}>Amount to pay</div>
              <div style={{ fontSize: 'clamp(40px,9vw,56px)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
                <span style={{ fontWeight: 700, color: '#1d4ed8', marginRight: 4 }}>₹</span>{safeAmount}
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: '#5b6b85', display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f7faff', border: '1px solid #e6ecf5', padding: '6px 10px', borderRadius: 999 }}>
                <span>Ref</span>
                <span style={{ fontWeight: 600 }}>{orderId}</span>
                <button onClick={copyRef} style={{ background: 'transparent', border: 0, color: '#8a98b1', cursor: 'pointer', padding: 0, fontSize: 13 }}>
                  {copied ? '✓' : '📋'}
                </button>
              </div>
              {remark && <div style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: '#5b6b85', fontStyle: 'italic' }}>{remark}</div>}
            </div>

            {/* Timer */}
            <div style={{ margin: '16px auto 4px', maxWidth: 260 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#5b6b85', marginBottom: 6 }}>
                <span>QR expires in</span>
                <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(remaining)}</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: '#eef2f8', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: remaining <= 30 ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#1d4ed8,#60a5fa)', transform: `scaleX(${pct})`, transformOrigin: 'left', transition: 'transform 1s linear' }} />
              </div>
            </div>

            {/* Paytm button */}
            {paytmUri && (
              <div>
                <div style={styles.divider}>Pay with Paytm</div>
                <a href={paytmUri} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 14, background: '#fff', border: '1px solid #e6ecf5', fontWeight: 600, fontSize: 14, cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
                  <span style={{ width: 40, height: 40, borderRadius: 12, background: '#e8f8ff', border: '1px solid #c5edff', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 800 }}>₽</span>
                  <span style={{ flex: 1 }}>Pay with Paytm</span>
                  <span style={{ color: '#8a98b1', fontSize: 18 }}>›</span>
                </a>
              </div>
            )}

            {/* QR */}
            {qrDataUrl && (
              <div>
                <div style={styles.divider}>Or Scan QR with any UPI app</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div style={{ background: '#fff', padding: 14, borderRadius: 18, border: '1px solid #e6ecf5', boxShadow: '0 18px 40px -22px rgba(29,78,216,.35)' }}>
                    <img src={qrDataUrl} alt={`UPI QR for ₹${safeAmount}`} width={200} height={200} style={{ borderRadius: 6 }} />
                  </div>
                  <div style={{ color: '#5b6b85', fontSize: 13, textAlign: 'center' }}>Open <b>PhonePe, GPay, BHIM</b> or any UPI app and scan</div>
                </div>
              </div>
            )}

            {/* Status */}
            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 999, fontSize: 12.5, background: '#eaf1ff', border: '1px solid #cfdfff', color: '#1d4ed8', fontWeight: 600 }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(29,78,216,.25)', borderTopColor: '#1d4ed8', animation: 'spin 0.9s linear infinite' }} />
                Waiting for payment…
              </span>
            </div>
          </div>
        </section>

        <footer style={{ marginTop: 18, textAlign: 'center', color: '#8a98b1', fontSize: 11.5, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 9px', borderRadius: 999, background: '#fff', border: '1px solid #e6ecf5', color: '#5b6b85' }}>🔒 256-bit encrypted</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 9px', borderRadius: 999, background: '#fff', border: '1px solid #e6ecf5', color: '#5b6b85' }}>UPI · NPCI</span>
          </div>
          <div>Powered by WePay Payment Gateway</div>
        </footer>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%{box-shadow:0 0 0 0 rgba(22,163,74,.55)} 70%{box-shadow:0 0 0 10px rgba(22,163,74,0)} 100%{box-shadow:0 0 0 0 rgba(22,163,74,0)} }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh',
    fontFamily: '"Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
    background: 'linear-gradient(180deg,#ffffff,#f6f9ff 60%,#eef4ff)',
    color: '#0b1b34',
    WebkitFontSmoothing: 'antialiased',
  },
  shell: { width: '100%', maxWidth: 480, margin: '0 auto', padding: '20px 16px 40px' },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  logo: {
    width: 34, height: 34, borderRadius: 10,
    background: 'linear-gradient(135deg,#1d4ed8,#60a5fa)',
    boxShadow: '0 6px 16px rgba(29,78,216,.30)',
    display: 'grid', placeItems: 'center',
    color: '#fff', fontWeight: 700, fontSize: 16,
  },
  brandName: { fontWeight: 700, letterSpacing: 0.2 },
  secure: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '6px 10px', borderRadius: 999, background: '#e8f7ee',
    border: '1px solid #c6ebd2', color: '#0f7a3f', fontSize: 12, fontWeight: 600,
  },
  dot: {
    width: 8, height: 8, borderRadius: '50%', background: '#16a34a',
    animation: 'pulse 1.8s infinite', display: 'inline-block',
  },
  card: {
    position: 'relative', background: '#ffffff',
    border: '1px solid #e6ecf5', borderRadius: 20,
    boxShadow: '0 30px 60px -28px rgba(29,78,216,.28),0 10px 24px -14px rgba(15,30,60,.10)',
    overflow: 'hidden',
  },
  cardInner: { padding: 22, position: 'relative' as const },
  divider: {
    display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0 18px',
    color: '#8a98b1', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase' as const,
  },
  sandbox: {
    position: 'fixed' as const, top: 0, left: 0, right: 0, padding: 8,
    background: '#f59e0b', color: '#000', textAlign: 'center' as const,
    fontSize: 12, fontWeight: 700, zIndex: 100, letterSpacing: 0.5,
  },
};
