/**
 * ═══════════════════════════════════════════════════════════════
 *  WePay — BharatPe Credential Extractor
 * ═══════════════════════════════════════════════════════════════
 * 
 *  HOW TO USE:
 *  ───────────
 *  1. Open Chrome / Brave
 *  2. Go to https://enterprise.bharatpe.in and LOG IN
 *  3. Once you're on the dashboard, press F12 (or Cmd+Opt+I on Mac)
 *  4. Click the "Console" tab
 *  5. Paste this ENTIRE script and press Enter
 *  6. It will print everything you need — copy the JSON output
 *  7. Go to http://187.127.153.28/dashboard/merchants
 *  8. Use the extracted data to connect your merchant
 * 
 * ═══════════════════════════════════════════════════════════════
 */

(async function extractBharatPeCredentials() {
  console.log('%c═══ WePay BharatPe Extractor ═══', 'color: #1d4ed8; font-size: 18px; font-weight: bold;');
  console.log('%cExtracting all credentials...', 'color: #5b6b85; font-size: 13px;');

  const result = {
    cookie: '',
    token: '',
    merchantId: '',
    upiId: '',
    mobile: '',
    merchantName: '',
    mcc: '',
    orgid: '159002',
    sign: '',
    allMerchants: [],
    allUpiIds: [],
  };

  // ════════════════════════════════════════
  // 1. EXTRACT COOKIES (the most important)
  // ════════════════════════════════════════
  result.cookie = document.cookie;
  console.log('%c✅ Cookies extracted', 'color: #16a34a; font-weight: bold;');

  // ════════════════════════════════════════
  // 2. EXTRACT AUTH TOKEN from localStorage / sessionStorage
  // ════════════════════════════════════════
  const storageKeys = ['token', 'auth_token', 'access_token', 'jwt', 'authToken', 'accessToken', 'bharatpe_token'];
  
  for (const key of storageKeys) {
    const val = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (val) {
      result.token = val.replace(/^["']|["']$/g, '');
      console.log(`%c✅ Token found in storage key: ${key}`, 'color: #16a34a; font-weight: bold;');
      break;
    }
  }

  // Also check all localStorage keys
  if (!result.token) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const val = localStorage.getItem(key);
      if (val && val.length > 50 && val.length < 2000 && (val.startsWith('ey') || val.includes('Bearer'))) {
        result.token = val.replace(/^["']|["']$/g, '').replace('Bearer ', '');
        console.log(`%c✅ Token found in: ${key}`, 'color: #16a34a; font-weight: bold;');
        break;
      }
    }
  }

  // Check for token in meta tags or script data
  if (!result.token) {
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const match = script.textContent?.match(/["']token["']\s*:\s*["']([^"']+)["']/);
      if (match) {
        result.token = match[1];
        console.log('%c✅ Token found in page script', 'color: #16a34a; font-weight: bold;');
        break;
      }
    }
  }

  // ════════════════════════════════════════
  // 3. FETCH MERCHANT DATA from BharatPe API
  // ════════════════════════════════════════
  const headers = {
    'Accept': 'application/json',
    'Cookie': result.cookie,
  };
  if (result.token) {
    headers['Authorization'] = `Bearer ${result.token}`;
    headers['token'] = result.token;
  }

  // Try to get merchant list
  const merchantEndpoints = [
    'https://enterprise.bharatpe.in/v1/api/brandMerchants',
    'https://enterprise.bharatpe.in/v1/api/merchants',
    'https://enterprise.bharatpe.in/api/merchants',
  ];

  for (const url of merchantEndpoints) {
    try {
      const res = await fetch(url, { headers, credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const merchants = data.data || data.merchants || data.result || data || [];
        
        if (Array.isArray(merchants) && merchants.length > 0) {
          result.allMerchants = merchants.map(m => ({
            id: m.merchant_id || m.merchantId || m.id,
            name: m.merchant_name || m.merchantName || m.name || m.business_name,
            mobile: m.mobile || m.phone || m.contact,
            upiId: m.vpa || m.upi_id || m.upiId || m.qr_string,
            status: m.status,
          }));

          // Use first merchant
          const first = merchants[0];
          result.merchantId = first.merchant_id || first.merchantId || first.id || '';
          result.merchantName = first.merchant_name || first.merchantName || first.name || first.business_name || '';
          result.mobile = first.mobile || first.phone || first.contact || '';
          
          console.log(`%c✅ Found ${merchants.length} merchant(s)`, 'color: #16a34a; font-weight: bold;');
          break;
        }
      }
    } catch (e) {
      // Try next endpoint
    }
  }

  // ════════════════════════════════════════
  // 4. FETCH UPI IDs / VPAs
  // ════════════════════════════════════════
  const upiEndpoints = [
    `https://enterprise.bharatpe.in/v1/api/merchantStores?merchant_id=${result.merchantId}`,
    'https://enterprise.bharatpe.in/v1/api/qr',
    'https://enterprise.bharatpe.in/v1/api/vpa',
  ];

  for (const url of upiEndpoints) {
    try {
      const res = await fetch(url, { headers, credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const stores = data.data || data.stores || data.result || data || [];
        
        if (Array.isArray(stores)) {
          for (const store of stores) {
            const vpa = store.vpa || store.upi_id || store.upiId || store.qr_string;
            if (vpa && vpa.includes('@')) {
              result.allUpiIds.push(vpa);
              if (!result.upiId) result.upiId = vpa;
            }
          }
        } else if (typeof stores === 'object') {
          const vpa = stores.vpa || stores.upi_id || stores.upiId;
          if (vpa) {
            result.allUpiIds.push(vpa);
            if (!result.upiId) result.upiId = vpa;
          }
        }

        if (result.upiId) {
          console.log(`%c✅ Found UPI ID: ${result.upiId}`, 'color: #16a34a; font-weight: bold;');
          break;
        }
      }
    } catch (e) {
      // Try next
    }
  }

  // ════════════════════════════════════════
  // 5. TRY TO FIND UPI ID FROM PAGE CONTENT
  // ════════════════════════════════════════
  if (!result.upiId) {
    // Check page for VPA patterns
    const pageText = document.body.innerText;
    const vpaMatch = pageText.match(/\b[\w.-]+@(?:bharatpe|paytm|ybl|okhdfcbank|oksbi|okicici|okaxis|upi|apl|ibl|axl)\b/i);
    if (vpaMatch) {
      result.upiId = vpaMatch[0];
      console.log(`%c✅ Found UPI ID in page: ${result.upiId}`, 'color: #16a34a; font-weight: bold;');
    }
  }

  // ════════════════════════════════════════
  // 6. TEST CONNECTION
  // ════════════════════════════════════════
  try {
    const testRes = await fetch('https://enterprise.bharatpe.in/v1/api/brandMerchants', { 
      headers, credentials: 'include' 
    });
    if (testRes.ok) {
      console.log('%c✅ Connection test PASSED — credentials are valid', 'color: #16a34a; font-weight: bold; font-size: 14px;');
    } else {
      console.log(`%c⚠️ Connection test returned ${testRes.status}`, 'color: #f59e0b; font-weight: bold;');
    }
  } catch (e) {
    console.log('%c❌ Connection test failed', 'color: #dc2626; font-weight: bold;');
  }

  // ════════════════════════════════════════
  // 7. FETCH RECENT TRANSACTIONS (verify tracking works)
  // ════════════════════════════════════════
  try {
    const txnRes = await fetch('https://enterprise.bharatpe.in/v1/api/transactions?page=1&limit=5&type=CREDIT', {
      headers, credentials: 'include'
    });
    if (txnRes.ok) {
      const txnData = await txnRes.json();
      const txns = txnData.data || txnData.transactions || [];
      console.log(`%c✅ Can access transactions — ${Array.isArray(txns) ? txns.length : 0} recent found`, 'color: #16a34a; font-weight: bold;');
    }
  } catch (e) {
    // Silent
  }

  // ════════════════════════════════════════
  // 8. OUTPUT RESULTS
  // ════════════════════════════════════════
  console.log('\n');
  console.log('%c═══════════════════════════════════════', 'color: #1d4ed8; font-weight: bold;');
  console.log('%c  EXTRACTED CREDENTIALS — COPY THIS:', 'color: #1d4ed8; font-size: 16px; font-weight: bold;');
  console.log('%c═══════════════════════════════════════', 'color: #1d4ed8; font-weight: bold;');
  
  const output = {
    // What WePay needs:
    cookie: result.cookie,
    token: result.token,
    merchantId: result.merchantId,
    upiId: result.upiId,
    mobile: result.mobile,
    merchantName: result.merchantName,
    
    // Additional info:
    allMerchants: result.allMerchants,
    allUpiIds: result.allUpiIds,
  };

  console.log(JSON.stringify(output, null, 2));

  // ════════════════════════════════════════
  // 9. COPY-PASTE READY FORMAT
  // ════════════════════════════════════════
  console.log('\n');
  console.log('%c═══ QUICK SETUP (paste into WePay merchant form) ═══', 'color: #8b5cf6; font-size: 14px; font-weight: bold;');
  console.log(`%cMerchant ID: %c${result.merchantId || 'NOT FOUND'}`, 'color: #5b6b85;', 'color: #0b1b34; font-weight: bold;');
  console.log(`%cUPI ID:      %c${result.upiId || 'NOT FOUND'}`, 'color: #5b6b85;', 'color: #0b1b34; font-weight: bold;');
  console.log(`%cMobile:      %c${result.mobile || 'NOT FOUND'}`, 'color: #5b6b85;', 'color: #0b1b34; font-weight: bold;');
  console.log(`%cCookie:      %c${result.cookie ? result.cookie.substring(0, 60) + '...' : 'NOT FOUND'}`, 'color: #5b6b85;', 'color: #0b1b34; font-weight: bold;');
  console.log(`%cToken:       %c${result.token ? result.token.substring(0, 40) + '...' : 'NOT FOUND'}`, 'color: #5b6b85;', 'color: #0b1b34; font-weight: bold;');

  if (!result.cookie) {
    console.log('%c\n⚠️ Cookie is empty! Make sure you:', 'color: #f59e0b; font-weight: bold; font-size: 14px;');
    console.log('%c   1. Are logged into enterprise.bharatpe.in', 'color: #f59e0b;');
    console.log('%c   2. Running this on the BharatPe page (not a different tab)', 'color: #f59e0b;');
  }

  if (!result.upiId) {
    console.log('%c\n⚠️ UPI ID not auto-detected. You can find it in:', 'color: #f59e0b; font-weight: bold;');
    console.log('%c   BharatPe Dashboard → QR Code section → The VPA shown below QR', 'color: #f59e0b;');
  }

  // Also copy to clipboard
  try {
    const clipboardText = JSON.stringify({
      cookie: result.cookie,
      token: result.token,
      merchantId: result.merchantId,
      upiId: result.upiId,
      mobile: result.mobile,
    }, null, 2);
    await navigator.clipboard.writeText(clipboardText);
    console.log('%c\n📋 Credentials copied to clipboard!', 'color: #16a34a; font-size: 14px; font-weight: bold;');
  } catch (e) {
    console.log('%c\n📋 Could not auto-copy. Please manually select and copy the JSON above.', 'color: #f59e0b;');
  }

  return output;
})();
