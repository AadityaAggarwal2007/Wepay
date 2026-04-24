/**
 * ═══════════════════════════════════════════════════════════════
 * WePay Token Auto-Refresher (One-Click)
 * ═══════════════════════════════════════════════════════════════
 * 
 * HOW TO USE:
 * 1. Login to https://enterprise.bharatpe.in in Chrome
 * 2. Open DevTools (F12) → Console tab
 * 3. Paste this script and press Enter
 * 4. It extracts the token AND auto-updates it on your WePay server
 * 
 * That's it! No manual copying needed.
 * ═══════════════════════════════════════════════════════════════
 */

(async function refreshWePayToken() {
  const WEPAY_URL = 'https://pay.aadityaswhatsapp.fun';
  const CRON_SECRET = 'wepay-cron-2026-secret-key';
  const MERCHANT_DB_ID = 2; // Your merchant row ID in the DB

  console.clear();
  console.log('%c🔄 WePay Token Auto-Refresher', 'font-size:18px;font-weight:bold;color:#1d4ed8');

  // Step 1: Find token from localStorage
  let token = null;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const val = localStorage.getItem(key);
    if (key?.toLowerCase().includes('token') && val && val.length > 20 && val.length < 200) {
      token = val.replace(/^["']|["']$/g, '');
      console.log(`%c✅ Found token in localStorage["${key}"]`, 'color:#16a34a;font-weight:bold');
      break;
    }
  }

  // Also check for hex tokens (32 chars)
  if (!token) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const val = localStorage.getItem(key);
      if (val && /^[a-f0-9]{32}$/i.test(val)) {
        token = val;
        console.log(`%c✅ Found hex token in localStorage["${key}"]`, 'color:#16a34a;font-weight:bold');
        break;
      }
    }
  }

  if (!token) {
    console.error('❌ No token found! Make sure you are logged in.');
    console.log('%cTip: Go to Network tab, make any click, find a request with "token" header', 'color:#f59e0b');
    return;
  }

  console.log('%cToken:', 'font-weight:bold', token);

  // Step 2: Send to WePay server
  console.log('%c⏳ Updating WePay server...', 'color:#3b82f6;font-weight:bold');

  try {
    const resp = await fetch(`${WEPAY_URL}/api/admin/update-merchant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: CRON_SECRET,
        action: 'update-credentials',
        merchantId: MERCHANT_DB_ID,
        token: token,
        cookie: document.cookie,
      }),
    });

    const data = await resp.json();

    if (data.success) {
      console.log('%c✅ TOKEN UPDATED SUCCESSFULLY!', 'color:#16a34a;font-weight:bold;font-size:16px');
      console.log('%cPayment detection is now active.', 'color:#16a34a');
    } else {
      console.error('❌ Update failed:', data);
    }
  } catch (e) {
    console.error('❌ Network error:', e.message);
    console.log('%cManual fallback — copy this token and paste in admin API:', 'color:#f59e0b');
    console.log(token);
  }
})();
