/**
 * ═══════════════════════════════════════════════════════════════
 * BharatPe Credential Extractor for WePay
 * ═══════════════════════════════════════════════════════════════
 * 
 * HOW TO USE:
 * 1. Open https://enterprise.bharatpe.in in Chrome
 * 2. Login to your BharatPe Enterprise account
 * 3. Once logged in, open Chrome DevTools (F12 or Cmd+Option+I)
 * 4. Go to the "Console" tab
 * 5. Paste this ENTIRE script and press Enter
 * 6. It will display all the credentials you need
 * 7. Copy the values and paste them in WePay merchant setup
 * 
 * ═══════════════════════════════════════════════════════════════
 */

(async function extractBharatPeCredentials() {
  console.clear();
  console.log('%c🔑 BharatPe Credential Extractor for WePay', 'font-size:18px;font-weight:bold;color:#1d4ed8');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color:#64748b');

  // ── 1. Get ALL cookies ──
  const cookie = document.cookie;
  if (!cookie || cookie.length < 20) {
    console.error('❌ No cookies found! Make sure you are logged into enterprise.bharatpe.in');
    return;
  }
  console.log('%c✅ Cookie extracted', 'color:#16a34a;font-weight:bold', `(${cookie.length} chars)`);

  // ── 2. Get token from localStorage ──
  let token = null;
  const possibleTokenKeys = ['token', 'auth_token', 'access_token', 'jwt', 'bharatpe_token', 'user_token'];
  
  // Check localStorage
  for (const key of possibleTokenKeys) {
    const val = localStorage.getItem(key);
    if (val && val.length > 10) {
      token = val.replace(/^["']|["']$/g, ''); // strip quotes
      console.log(`%c✅ Token found in localStorage["${key}"]`, 'color:#16a34a;font-weight:bold');
      break;
    }
  }

  // Also check sessionStorage
  if (!token) {
    for (const key of possibleTokenKeys) {
      const val = sessionStorage.getItem(key);
      if (val && val.length > 10) {
        token = val.replace(/^["']|["']$/g, '');
        console.log(`%c✅ Token found in sessionStorage["${key}"]`, 'color:#16a34a;font-weight:bold');
        break;
      }
    }
  }

  // Try to find any JWT-like string in localStorage
  if (!token) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const val = localStorage.getItem(key);
      if (val && (val.startsWith('eyJ') || (val.length > 30 && val.length < 2000 && !val.includes(' ')))) {
        token = val.replace(/^["']|["']$/g, '');
        console.log(`%c✅ Token candidate found in localStorage["${key}"]`, 'color:#f59e0b;font-weight:bold');
        break;
      }
    }
  }

  if (!token) {
    console.warn('⚠️ No token found in storage. Will try to extract from API call...');
  }

  // ── 3. Get merchantId by calling the API ──
  let merchantId = null;
  let upiId = null;
  let mobile = null;

  try {
    const headers = { 
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['token'] = token;
    }

    const resp = await fetch('https://enterprise.bharatpe.in/v1/api/brandMerchants', {
      credentials: 'include',
      headers,
    });

    if (resp.ok) {
      const data = await resp.json();
      console.log('%c✅ BharatPe API responded', 'color:#16a34a;font-weight:bold');
      
      // Extract merchant info
      const merchants = data.data || data.merchants || data || [];
      if (Array.isArray(merchants) && merchants.length > 0) {
        const m = merchants[0];
        merchantId = m.merchant_id || m.merchantId || m.id || null;
        upiId = m.upi_id || m.upiId || m.vpa || null;
        mobile = m.mobile || m.phone || null;
        console.log(`%c✅ Merchant found: ${merchantId}`, 'color:#16a34a;font-weight:bold');
      } else if (typeof data === 'object') {
        // Maybe it's a direct object
        merchantId = data.merchant_id || data.merchantId || null;
        upiId = data.upi_id || data.upiId || data.vpa || null;
      }
    } else {
      console.warn('⚠️ brandMerchants API returned', resp.status);
    }
  } catch (e) {
    console.error('❌ API call failed:', e.message);
  }

  // ── Also try merchantStores endpoint ──
  if (merchantId && !upiId) {
    try {
      const resp2 = await fetch(`https://enterprise.bharatpe.in/v1/api/merchantStores?merchant_id=${merchantId}`, {
        credentials: 'include',
      });
      if (resp2.ok) {
        const data2 = await resp2.json();
        const stores = data2.data || data2.stores || [];
        if (Array.isArray(stores) && stores.length > 0) {
          upiId = stores[0].upi_id || stores[0].vpa || null;
        }
      }
    } catch { /* ignore */ }
  }

  // ── 4. Display results ──
  console.log('\n');
  console.log('%c═══ CREDENTIALS FOR WEPAY ═══', 'font-size:16px;font-weight:bold;color:#1d4ed8;background:#eaf1ff;padding:8px 16px;border-radius:4px');
  console.log('\n');

  const results = {
    cookie: cookie,
    token: token || '(not found — check manually)',
    merchantId: merchantId || '(not found — check manually)',
    upiId: upiId || '(not found — check manually)',
    mobile: mobile || '(not found)',
  };

  // Pretty print each field
  console.log('%cCOOKIE:', 'font-weight:bold;color:#1d4ed8', cookie);
  console.log('%cTOKEN:', 'font-weight:bold;color:#1d4ed8', token || '⚠️ Not found');
  console.log('%cMERCHANT ID:', 'font-weight:bold;color:#1d4ed8', merchantId || '⚠️ Not found');
  console.log('%cUPI ID:', 'font-weight:bold;color:#1d4ed8', upiId || '⚠️ Not found');
  console.log('%cMOBILE:', 'font-weight:bold;color:#1d4ed8', mobile || '⚠️ Not found');

  console.log('\n');
  console.log('%c📋 Quick Copy (JSON):', 'font-weight:bold;color:#16a34a');
  console.log(JSON.stringify(results, null, 2));

  // Also copy to clipboard
  try {
    await navigator.clipboard.writeText(JSON.stringify(results, null, 2));
    console.log('%c✅ Copied to clipboard!', 'color:#16a34a;font-weight:bold;font-size:14px');
  } catch {
    console.log('⚠️ Could not auto-copy. Select the JSON above and copy manually.');
  }

  console.log('\n');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color:#64748b');
  console.log('%cPaste these values in WePay → Dashboard → Merchants → Add Merchant', 'color:#64748b;font-style:italic');

  return results;
})();
