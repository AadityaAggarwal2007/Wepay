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
  fallbackUri,
  expirySeconds,
  isSandbox,
  platform,
  status: initialStatus,
}: PaymentPageClientProps) {
  const [status, setStatus] = useState(initialStatus);
  const [utr, setUtr] = useState('');
  const [remaining, setRemaining] = useState(expirySeconds);
  const [copied, setCopied] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [showConfetti, setShowConfetti] = useState(false);
  const pollRef = useRef(true);
  const pollInterval = useRef<ReturnType<typeof setTimeout>>(undefined);

  const safeAmount = amount.toFixed(2);
  const merchantInitial = merchantName.charAt(0).toUpperCase();

  // ═══ TIMER — Countdown every second ═══
  useEffect(() => {
    if (status !== 'PENDING') return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) { setStatus('EXPIRED'); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  // ═══ POLLING — Check every 2 seconds (faster than NiyopPe) ═══
  const poll = useCallback(async () => {
    if (!pollRef.current || status !== 'PENDING') return;
    try {
      const res = await fetch(`/api/payment/status/${orderId}`, {
        cache: 'no-store',
        credentials: 'same-origin',
      });
      const data = await res.json();

      if (data.status === 'SUCCESS') {
        pollRef.current = false;
        setStatus('SUCCESS');
        setUtr(data.utr || '');
        setShowConfetti(true);

        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);

        // Play success sound
        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(523.25, ctx.currentTime);
          osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
          osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.5);
        } catch { /* Audio may be blocked */ }

        // Redirect countdown
        if (redirectUrl) {
          let c = 5;
          const iv = setInterval(() => {
            c--;
            setRedirectCountdown(c);
            if (c <= 0) { clearInterval(iv); window.location.href = redirectUrl; }
          }, 1000);
        }
      } else if (data.status === 'EXPIRED' || data.status === 'CANCELLED') {
        pollRef.current = false;
        setStatus(data.status);
      } else {
        // PENDING — poll again in 2 seconds
        pollInterval.current = setTimeout(poll, 2000);
      }
    } catch {
      // Network error — retry in 3 seconds
      pollInterval.current = setTimeout(poll, 3000);
    }
  }, [orderId, redirectUrl, status]);

  useEffect(() => {
    if (status === 'PENDING') {
      pollInterval.current = setTimeout(poll, 1500); // First poll after 1.5s
      return () => { if (pollInterval.current) clearTimeout(pollInterval.current); };
    }
  }, [poll, status]);

  // Cleanup
  useEffect(() => {
    return () => { pollRef.current = false; };
  }, []);

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

  // ═══ SUCCESS STATE ═══
  if (status === 'SUCCESS') {
    return (
      <div className="pp-page">
        {showConfetti && <Confetti />}
        <main className="pp-shell">
          <header className="pp-topbar">
            <div className="pp-brand"><div className="pp-logo">W</div><div className="pp-brand-name">WePay</div></div>
            <div className="pp-secure"><span className="pp-dot" /> Secure</div>
          </header>
          <section className="pp-card pp-card-success">
            <div className="pp-card-inner">
              <div className="pp-success-state">
                <div className="pp-success-icon">
                  <svg className="pp-checkmark" viewBox="0 0 52 52">
                    <circle className="pp-checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                    <path className="pp-checkmark-check" fill="none" d="m14.1 27.2 7.1 7.2 16.7-16.8" />
                  </svg>
                </div>
                <h3 className="pp-success-title">Payment Successful!</h3>
                <p className="pp-success-amount">₹{safeAmount} paid to {merchantName}</p>
                {utr && <div className="pp-utr-badge"><span>UTR:</span> {utr}</div>}
                {redirectUrl && (
                  <p className="pp-redirect-msg">
                    Redirecting in <span className="pp-countdown">{redirectCountdown}</span>s…
                  </p>
                )}
              </div>
            </div>
          </section>
          <Footer />
        </main>
        <Styles />
      </div>
    );
  }

  // ═══ EXPIRED / FAILED STATE ═══
  if (status === 'EXPIRED' || status === 'CANCELLED' || status === 'FAILED') {
    return (
      <div className="pp-page">
        <main className="pp-shell">
          <header className="pp-topbar">
            <div className="pp-brand"><div className="pp-logo">W</div><div className="pp-brand-name">WePay</div></div>
          </header>
          <section className="pp-card">
            <div className="pp-card-inner">
              <div className="pp-error-state">
                <div className="pp-error-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
                <h3>Payment {status === 'FAILED' ? 'Failed' : 'Expired'}</h3>
                <p>This link has {status === 'FAILED' ? 'failed' : 'expired'}. Please request a new payment link.</p>
                <button className="pp-cta" onClick={() => window.close()}>Close</button>
              </div>
            </div>
          </section>
        </main>
        <Styles />
      </div>
    );
  }

  // ═══ PENDING STATE — Full payment page ═══
  return (
    <div className="pp-page">
      {isSandbox && <div className="pp-sandbox">🧪 TEST MODE — No real payment</div>}
      <main className="pp-shell">
        <header className="pp-topbar">
          <div className="pp-brand"><div className="pp-logo">W</div><div className="pp-brand-name">WePay</div></div>
          <div className="pp-secure"><span className="pp-dot" /> Secure Payment</div>
        </header>

        <section className="pp-card">
          {/* Glow effect */}
          <div className="pp-card-glow" />
          <div className="pp-card-inner">
            {/* Merchant */}
            <div className="pp-merchant">
              <div className="pp-merchant-avatar">{merchantInitial}</div>
              <div><small>Paying to</small><strong>{merchantName}</strong></div>
            </div>

            {/* Amount */}
            <div className="pp-amount-block">
              <div className="pp-amount-label">Amount to pay</div>
              <div className="pp-amount"><span className="pp-cur">₹</span>{safeAmount}</div>
              <div className="pp-txn-ref">
                <span>Ref</span>
                <span className="pp-ref-id">{orderId}</span>
                <button onClick={copyRef} className="pp-copy-btn">
                  {copied ? <span style={{ color: '#16a34a', fontSize: 11 }}>Copied!</span> : '📋'}
                </button>
              </div>
              {remark && <div className="pp-remark">{remark}</div>}
            </div>

            {/* Timer */}
            <div className="pp-timer">
              <div className="pp-timer-row">
                <span>QR expires in</span>
                <span className="pp-timer-value">{fmt(remaining)}</span>
              </div>
              <div className="pp-timer-bar">
                <div
                  className="pp-timer-fill"
                  style={{
                    transform: `scaleX(${pct})`,
                    background: remaining <= 30 ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#1d4ed8,#60a5fa)',
                  }}
                />
              </div>
            </div>

            {/* ── Pay with Paytm ── */}
            {paytmUri && (
              <div>
                <div className="pp-divider">Pay with Paytm</div>
                <div className="pp-apps">
                  <a href={paytmUri} className="pp-app pp-paytm">
                    <span className="pp-app-icon pp-icon-paytm">
                      <img src="https://play-lh.googleusercontent.com/B5cNBA15IxjCT-8UTwEtnGWOWIott-mJwJoNKqcsyoSxNJKhBBzjBNhWVoVFxqMX6as=w240-h480" alt="Paytm" width="40" height="40" style={{ borderRadius: 10 }} />
                    </span>
                    <span className="pp-app-label">Pay with Paytm</span>
                    <span className="pp-app-arrow">›</span>
                  </a>
                </div>
              </div>
            )}

            {/* ── UPI Pay Button (Android/In-app) ── */}
            {(platform === 'android' || platform === 'in-app') && fallbackUri && (
              <div>
                <div className="pp-divider">Pay with UPI App</div>
                <a href={fallbackUri} className="pp-upi-btn">
                  <svg className="pp-upi-logo" viewBox="0 0 24 24" width="28" height="28">
                    <path fill="#fff" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span>Pay ₹{safeAmount} with UPI</span>
                  <div className="pp-shimmer" />
                </a>
              </div>
            )}

            {/* ── QR Code ── */}
            {qrDataUrl && (
              <div>
                <div className="pp-divider">
                  {platform === 'android' || platform === 'in-app' ? 'Or scan QR' : 'Scan QR with any UPI app'}
                </div>
                <div className="pp-qr-wrap">
                  <div className="pp-qr">
                    <img src={qrDataUrl} alt={`UPI QR for ₹${safeAmount}`} width="200" height="200" />
                  </div>
                  <div className="pp-qr-hint">Open <b>PhonePe, GPay, BHIM</b> or any UPI app and scan</div>
                </div>
              </div>
            )}

            {/* Status */}
            <div className="pp-status">
              <span className="pp-spinner" />
              Waiting for payment…
            </div>
          </div>
        </section>

        <Footer />
      </main>
      <Styles />
    </div>
  );
}

// ═══ CONFETTI ═══
function Confetti() {
  return (
    <div className="pp-confetti-container">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="pp-confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${1.5 + Math.random() * 2}s`,
            background: ['#1d4ed8', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f43f5e'][i % 8],
            width: `${6 + Math.random() * 6}px`,
            height: `${4 + Math.random() * 8}px`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}

// ═══ FOOTER ═══
function Footer() {
  return (
    <footer className="pp-footer">
      <div className="pp-footer-badges">
        <span className="pp-footer-badge">🔒 256-bit encrypted</span>
        <span className="pp-footer-badge">UPI · NPCI</span>
      </div>
      <div>Powered by WePay Payment Gateway</div>
    </footer>
  );
}

// ═══ ALL STYLES ═══
function Styles() {
  return (
    <style>{`
      /* ── Base ── */
      .pp-page{min-height:100dvh;font-family:"Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
        color:#0b1b34;background:radial-gradient(900px 500px at 90% -10%,rgba(59,130,246,.10),transparent 60%),radial-gradient(700px 400px at -10% 110%,rgba(96,165,250,.08),transparent 60%),linear-gradient(180deg,#ffffff,#f6f9ff 60%,#eef4ff);
        background-attachment:fixed;-webkit-font-smoothing:antialiased;overflow-x:hidden}
      .pp-shell{width:100%;max-width:480px;margin:0 auto;padding:20px 16px 40px;padding-top:max(20px,env(safe-area-inset-top));padding-bottom:max(40px,env(safe-area-inset-bottom))}

      /* ── Topbar ── */
      .pp-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
      .pp-brand{display:flex;align-items:center;gap:10px}
      .pp-logo{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#1d4ed8,#60a5fa);box-shadow:0 6px 16px rgba(29,78,216,.30);display:grid;place-items:center;color:#fff;font-weight:700;font-size:16px}
      .pp-brand-name{font-weight:700;letter-spacing:.2px}
      .pp-secure{display:inline-flex;align-items:center;gap:8px;padding:6px 10px;border-radius:999px;background:#e8f7ee;border:1px solid #c6ebd2;color:#0f7a3f;font-size:12px;font-weight:600}
      .pp-dot{width:8px;height:8px;border-radius:50%;background:#16a34a;box-shadow:0 0 0 0 rgba(22,163,74,.55);animation:pp-pulse 1.8s infinite;display:inline-block}
      @keyframes pp-pulse{0%{box-shadow:0 0 0 0 rgba(22,163,74,.55)}70%{box-shadow:0 0 0 10px rgba(22,163,74,0)}100%{box-shadow:0 0 0 0 rgba(22,163,74,0)}}

      /* ── Card ── */
      .pp-card{position:relative;background:#fff;border:1px solid #e6ecf5;border-radius:20px;box-shadow:0 30px 60px -28px rgba(29,78,216,.28),0 10px 24px -14px rgba(15,30,60,.10);overflow:hidden}
      .pp-card-glow{position:absolute;inset:0;pointer-events:none;background:radial-gradient(700px 220px at 50% -20%,rgba(59,130,246,.10),transparent 60%)}
      .pp-card-inner{padding:22px;position:relative}

      /* ── Merchant ── */
      .pp-merchant{display:flex;align-items:center;gap:12px;margin-bottom:18px}
      .pp-merchant-avatar{width:40px;height:40px;border-radius:12px;background:#eaf1ff;border:1px solid #d6e4ff;display:grid;place-items:center;color:#1d4ed8;font-weight:700;font-size:16px}
      .pp-merchant small{display:block;color:#5b6b85;font-size:12px;margin-bottom:2px}
      .pp-merchant strong{font-weight:600;letter-spacing:.2px}

      /* ── Amount ── */
      .pp-amount-block{text-align:center;padding:6px 0 4px}
      .pp-amount-label{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#8a98b1;margin-bottom:6px}
      .pp-amount{font-size:clamp(40px,9vw,56px);font-weight:800;letter-spacing:-.02em;line-height:1}
      .pp-cur{font-weight:700;color:#1d4ed8;margin-right:4px}
      .pp-txn-ref{margin-top:10px;font-size:12px;color:#5b6b85;display:inline-flex;align-items:center;gap:8px;background:#f7faff;border:1px solid #e6ecf5;padding:6px 10px;border-radius:999px}
      .pp-ref-id{font-weight:600;color:#0b1b34}
      .pp-copy-btn{background:transparent;border:0;color:#8a98b1;cursor:pointer;padding:0;display:inline-flex;font-size:13px}
      .pp-copy-btn:hover{color:#1d4ed8}
      .pp-remark{text-align:center;margin-top:8px;font-size:13px;color:#5b6b85;font-style:italic}

      /* ── Timer ── */
      .pp-timer{margin:16px auto 4px;max-width:260px}
      .pp-timer-row{display:flex;justify-content:space-between;font-size:12px;color:#5b6b85;margin-bottom:6px}
      .pp-timer-value{font-weight:600;font-variant-numeric:tabular-nums;color:#0b1b34}
      .pp-timer-bar{height:6px;border-radius:999px;background:#eef2f8;overflow:hidden}
      .pp-timer-fill{height:100%;transform-origin:left;transition:transform 1s linear}

      /* ── Divider ── */
      .pp-divider{display:flex;align-items:center;gap:12px;margin:22px 0 18px;color:#8a98b1;font-size:11px;letter-spacing:.2em;text-transform:uppercase}
      .pp-divider::before,.pp-divider::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,transparent,#e3e9f3,transparent)}

      /* ── UPI Pay Button ── */
      .pp-upi-btn{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;padding:16px 20px;margin:6px 0 2px;border-radius:16px;
        background:linear-gradient(135deg,#1d4ed8 0%,#3b82f6 50%,#60a5fa 100%);color:#fff;font-size:16px;font-weight:700;letter-spacing:.3px;
        border:none;cursor:pointer;box-shadow:0 10px 28px -8px rgba(29,78,216,.55),0 2px 6px rgba(15,30,60,.12);
        transition:transform .15s ease,box-shadow .15s ease;-webkit-tap-highlight-color:transparent;position:relative;overflow:hidden;text-decoration:none}
      .pp-upi-btn:hover{transform:translateY(-1px);box-shadow:0 14px 32px -8px rgba(29,78,216,.60)}
      .pp-upi-btn:active{transform:scale(.98)}
      .pp-shimmer{position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);animation:pp-shimmer 3s infinite}
      @keyframes pp-shimmer{0%{left:-100%}100%{left:200%}}

      /* ── App buttons ── */
      .pp-apps{display:flex;flex-direction:column;gap:10px;margin-top:6px}
      .pp-app{display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:14px;background:#fff;border:1px solid #e6ecf5;
        color:#0b1b34;font-size:14px;font-weight:600;cursor:pointer;transition:transform .15s,box-shadow .15s,border-color .15s;
        -webkit-tap-highlight-color:transparent;box-shadow:0 1px 2px rgba(15,30,60,.04);text-decoration:none}
      .pp-app:hover{border-color:#bcd0f5;box-shadow:0 6px 18px -8px rgba(29,78,216,.18);background:#f7faff}
      .pp-app:active{transform:scale(.98)}
      .pp-app-icon{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;overflow:hidden;flex-shrink:0}
      .pp-icon-paytm{background:#e8f8ff;border:1px solid #c5edff}
      .pp-app-label{flex:1}
      .pp-app-arrow{color:#8a98b1;font-size:18px;transition:transform .15s}
      .pp-app:hover .pp-app-arrow{transform:translateX(3px);color:#1d4ed8}

      /* ── QR ── */
      .pp-qr-wrap{display:flex;flex-direction:column;align-items:center;gap:12px}
      .pp-qr{position:relative;background:#fff;padding:14px;border-radius:18px;border:1px solid #e6ecf5;box-shadow:0 18px 40px -22px rgba(29,78,216,.35),0 0 0 1px rgba(29,78,216,.04)}
      .pp-qr::after{content:"";position:absolute;inset:-6px;border-radius:24px;pointer-events:none;background:conic-gradient(from 0deg,rgba(29,78,216,.45),rgba(96,165,250,.55),rgba(29,78,216,.45));filter:blur(14px);opacity:.30;z-index:-1;animation:pp-spin 8s linear infinite}
      @keyframes pp-spin{to{transform:rotate(360deg)}}
      .pp-qr img{display:block;width:200px;height:200px;border-radius:6px}
      .pp-qr-hint{color:#5b6b85;font-size:13px;text-align:center}

      /* ── Status ── */
      .pp-status{text-align:center;margin-top:14px;display:inline-flex;align-items:center;gap:10px;padding:8px 12px;border-radius:999px;
        font-size:12.5px;background:#eaf1ff;border:1px solid #cfdfff;color:#1d4ed8;font-weight:600;width:fit-content;margin-left:auto;margin-right:auto}
      .pp-spinner{width:14px;height:14px;border-radius:50%;border:2px solid rgba(29,78,216,.25);border-top-color:#1d4ed8;animation:pp-rot 0.9s linear infinite;display:inline-block}
      @keyframes pp-rot{to{transform:rotate(360deg)}}

      /* ── Success State ── */
      .pp-card-success{border-color:#b8e6c8;box-shadow:0 30px 60px -28px rgba(16,185,129,.25)}
      .pp-success-state{text-align:center;padding:20px 0;animation:pp-fadeUp .5s ease}
      @keyframes pp-fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      .pp-success-icon{margin:0 auto 16px}
      .pp-success-title{font-weight:700;font-size:22px;margin:0 0 6px;color:#0b1b34}
      .pp-success-amount{margin:0;color:#5b6b85;font-size:15px}
      .pp-utr-badge{display:inline-flex;align-items:center;gap:6px;margin-top:12px;padding:6px 14px;border-radius:999px;background:#e8f7ee;border:1px solid #b8e6c8;color:#0f7a3f;font-size:12px;font-weight:600}
      .pp-utr-badge span{color:#5b6b85;font-weight:400}
      .pp-redirect-msg{margin-top:16px;font-size:12px;color:#8a98b1}
      .pp-countdown{color:#1d4ed8;font-weight:700}

      /* ── Animated Checkmark ── */
      .pp-checkmark{width:64px;height:64px;border-radius:50%;display:block;stroke-width:3;stroke:#0f9d58;stroke-miterlimit:10;
        box-shadow:inset 0 0 0 #0f9d58;animation:pp-fill .4s ease-in-out .4s forwards,pp-scale .3s ease-in-out .9s both}
      .pp-checkmark-circle{stroke-dasharray:166;stroke-dashoffset:166;stroke-width:3;stroke-miterlimit:10;stroke:#0f9d58;fill:#e8f7ee;animation:pp-stroke .6s cubic-bezier(.65,0,.45,1) forwards}
      .pp-checkmark-check{transform-origin:50% 50%;stroke-dasharray:48;stroke-dashoffset:48;animation:pp-stroke .3s cubic-bezier(.65,0,.45,1) .8s forwards}
      @keyframes pp-stroke{100%{stroke-dashoffset:0}}
      @keyframes pp-scale{0%,100%{transform:none}50%{transform:scale3d(1.1,1.1,1)}}
      @keyframes pp-fill{100%{box-shadow:inset 0 0 0 30px transparent}}

      /* ── Error State ── */
      .pp-error-state{text-align:center;padding:20px 0;animation:pp-fadeUp .5s ease}
      .pp-error-icon{width:64px;height:64px;border-radius:50%;background:#fdecec;border:1px solid #f5c2c2;display:grid;place-items:center;margin:0 auto 12px;color:#dc2626;animation:pp-shake .5s ease}
      @keyframes pp-shake{10%,90%{transform:translate3d(-1px,0,0)}20%,80%{transform:translate3d(2px,0,0)}30%,50%,70%{transform:translate3d(-4px,0,0)}40%,60%{transform:translate3d(4px,0,0)}}
      .pp-error-state h3{font-weight:700;font-size:20px;margin:0 0 6px}
      .pp-error-state p{color:#5b6b85;margin:0 0 16px;font-size:14px}
      .pp-cta{display:inline-flex;padding:10px 18px;border-radius:12px;background:#1d4ed8;color:#fff;font-weight:600;font-size:13.5px;cursor:pointer;border:0;box-shadow:0 8px 18px -8px rgba(29,78,216,.55)}
      .pp-cta:hover{background:#1742b8}

      /* ── Confetti ── */
      .pp-confetti-container{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1000;overflow:hidden}
      .pp-confetti-piece{position:absolute;top:-10px;animation:pp-confetti-fall linear forwards}
      @keyframes pp-confetti-fall{
        0%{transform:translateY(0) rotate(0deg);opacity:1}
        75%{opacity:1}
        100%{transform:translateY(100vh) rotate(720deg);opacity:0}
      }

      /* ── Footer ── */
      .pp-footer{margin-top:18px;text-align:center;color:#8a98b1;font-size:11.5px;display:flex;flex-direction:column;gap:6px;align-items:center}
      .pp-footer-badges{display:flex;gap:8px}
      .pp-footer-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;background:#fff;border:1px solid #e6ecf5;color:#5b6b85}

      /* ── Sandbox ── */
      .pp-sandbox{position:fixed;top:0;left:0;right:0;padding:8px;background:#f59e0b;color:#000;text-align:center;font-size:12px;font-weight:700;z-index:100;letter-spacing:.5px}

      /* ── Responsive ── */
      @media(max-width:360px){.pp-qr img{width:172px;height:172px}.pp-card-inner{padding:18px}}
      @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
    `}</style>
  );
}
