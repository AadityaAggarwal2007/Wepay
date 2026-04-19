'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile || !password) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, password }),
        credentials: 'same-origin',
      });

      const data = await res.json();
      if (data.success && data.token) {
        // Set cookie directly via document.cookie — most reliable method
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
        document.cookie = `wepay_token=${data.token}; path=/; expires=${expires}; SameSite=Lax`;
        // Full page navigation to dashboard
        window.location.href = '/dashboard';
      } else {
        alert(data.message || 'Login failed');
        setLoading(false);
      }
    } catch {
      alert('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left panel */}
        <div className="auth-left">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="auth-badge">
              <span>⭐</span> Premium Experience
            </div>
            <h1>Welcome to WePay</h1>
            <p>
              Access your account to manage your services, view analytics, and
              customize your experience with our premium platform.
            </p>

            <ul className="auth-features">
              <li>
                <div className="icon-box"><i className="fas fa-shield-alt" /></div>
                Secure & reliable platform
              </li>
              <li>
                <div className="icon-box"><i className="fas fa-chart-bar" /></div>
                Advanced analytics dashboard
              </li>
              <li>
                <div className="icon-box"><i className="fas fa-headset" /></div>
                24/7 customer support
              </li>
            </ul>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="auth-right">
          <div className="auth-logo">
            <h2>WePay</h2>
          </div>

          <div className="auth-welcome">
            <h3>Welcome Back!</h3>
            <p>Please sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input
                type="tel"
                className="form-control"
                placeholder="Enter your mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                pattern="[0-9]{10}"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16,
                  }}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              disabled={loading}
              style={{ marginTop: 4 }}
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin" /> Signing in...</>
              ) : (
                'Log in'
              )}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, fontSize: 13 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                Remember me
              </label>
              <a href="/forgot-password" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                Forgot Password?
              </a>
            </div>
          </form>

          <div style={{ textAlign: 'center', marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border-light)', fontSize: 14 }}>
            New on our platform?{' '}
            <a href="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>
              Create an account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
