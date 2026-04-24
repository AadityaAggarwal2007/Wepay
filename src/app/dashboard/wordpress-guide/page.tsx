'use client';

const steps = [
  {
    num: 1,
    title: 'Download the Plugin',
    icon: 'fas fa-download',
    content: `Go to **SDK File** in the sidebar and download the **WordPress SDK** (wordpress.zip).`,
    note: 'Or download directly from the SDK page — it\'s the one marked "Popular".',
  },
  {
    num: 2,
    title: 'Install in WordPress',
    icon: 'fab fa-wordpress',
    content: `In your WordPress admin panel, go to **Plugins → Add New → Upload Plugin**. Choose the downloaded \`wordpress.zip\` file and click **Install Now**, then **Activate**.`,
    note: null,
  },
  {
    num: 3,
    title: 'Get Your API Token',
    icon: 'fas fa-key',
    content: `Go to **API Details** in this dashboard. Copy your **API Token** — you'll need it in the next step.`,
    note: 'Make sure you have an active merchant connected first (Connect Merchant page).',
  },
  {
    num: 4,
    title: 'Configure the Plugin',
    icon: 'fas fa-cog',
    content: `In WordPress, go to **WooCommerce → Settings → Payments**. You'll see **WePay UPI** listed. Click **Manage** and fill in:`,
    fields: [
      { label: 'Enable', value: '✅ Check to enable' },
      { label: 'Title', value: 'UPI Payment (GPay, PhonePe, Paytm)' },
      { label: 'API URL', value: 'https://pay.aadityaswhatsapp.fun' },
      { label: 'API Token', value: 'Paste your API token from Step 3' },
    ],
    note: null,
  },
  {
    num: 5,
    title: 'Test a Payment',
    icon: 'fas fa-shopping-cart',
    content: `Place a test order on your WooCommerce store. At checkout, select **UPI Payment** and complete the payment. The order status will update automatically when the payment is confirmed.`,
    note: 'Payments are detected in real-time. The customer sees a QR code and can pay with any UPI app.',
  },
];

export default function WordPressGuidePage() {
  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
          <i className="fab fa-wordpress" style={{ color: '#21759b', marginRight: 10 }} />
          WordPress Integration Guide
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6 }}>
          Accept UPI payments on your WooCommerce store with WePay.
          Zero transaction fees, instant payment detection.
        </p>
      </div>

      {/* Prerequisites */}
      <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid var(--warning)' }}>
        <div className="card-body" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <i className="fas fa-exclamation-triangle" style={{ color: 'var(--warning)', fontSize: 20, marginTop: 2 }} />
          <div>
            <strong style={{ fontSize: 15 }}>Prerequisites</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8 }}>
              <li>WordPress with <strong>WooCommerce</strong> installed and activated</li>
              <li>A <strong>WePay account</strong> with an active merchant connected</li>
              <li>Your <strong>API Token</strong> (from API Details page)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {steps.map((step) => (
          <div className="card" key={step.num} style={{ overflow: 'hidden' }}>
            <div className="card-body" style={{ display: 'flex', gap: 20 }}>
              {/* Step number */}
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 18, flexShrink: 0,
              }}>
                {step.num}
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className={step.icon} style={{ color: 'var(--primary)', fontSize: 16 }} />
                  {step.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, margin: 0 }}
                   dangerouslySetInnerHTML={{ __html: step.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`(.*?)`/g, '<code style="background:var(--bg-body);padding:2px 6px;border-radius:4px;font-size:13px">$1</code>') }}
                />

                {/* Config fields table */}
                {step.fields && (
                  <table style={{
                    width: '100%', marginTop: 12, borderCollapse: 'collapse',
                    fontSize: 13, border: '1px solid var(--border-light)', borderRadius: 8,
                  }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-body)' }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700 }}>Setting</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700 }}>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {step.fields.map((f) => (
                        <tr key={f.label} style={{ borderTop: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 600 }}>{f.label}</td>
                          <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{f.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Note */}
                {step.note && (
                  <div style={{
                    marginTop: 12, padding: '10px 14px',
                    background: 'var(--bg-body)', borderRadius: 'var(--radius-md)',
                    fontSize: 13, color: 'var(--text-muted)',
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                  }}>
                    <i className="fas fa-info-circle" style={{ color: 'var(--info)', marginTop: 2 }} />
                    {step.note}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* API Reference */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <h3 className="card-title">
            <i className="fas fa-code" style={{ marginRight: 8, color: 'var(--primary)' }} />
            API Reference (Advanced)
          </h3>
        </div>
        <div className="card-body">
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
            The plugin uses the <strong>Create Order API</strong> to generate payment links:
          </p>
          <div style={{
            background: '#1e1e2e', color: '#cdd6f4', padding: 20, borderRadius: 'var(--radius-md)',
            fontFamily: 'monospace', fontSize: 13, lineHeight: 1.8, overflowX: 'auto',
          }}>
            <div><span style={{ color: '#89b4fa' }}>POST</span> /api/create-order</div>
            <br />
            <div style={{ color: '#6c7086' }}>// Request Body (JSON)</div>
            <div>{'{'}</div>
            <div>  &quot;<span style={{ color: '#a6e3a1' }}>customer_mobile</span>&quot;: &quot;9876543210&quot;,</div>
            <div>  &quot;<span style={{ color: '#a6e3a1' }}>user_token</span>&quot;: &quot;your-api-token&quot;,</div>
            <div>  &quot;<span style={{ color: '#a6e3a1' }}>amount</span>&quot;: &quot;100.00&quot;,</div>
            <div>  &quot;<span style={{ color: '#a6e3a1' }}>order_id</span>&quot;: &quot;WC-123-1234567890&quot;,</div>
            <div>  &quot;<span style={{ color: '#a6e3a1' }}>redirect_url</span>&quot;: &quot;https://yoursite.com/thank-you&quot;</div>
            <div>{'}'}</div>
            <br />
            <div style={{ color: '#6c7086' }}>// Response</div>
            <div>{'{'}</div>
            <div>  &quot;<span style={{ color: '#a6e3a1' }}>status</span>&quot;: <span style={{ color: '#fab387' }}>true</span>,</div>
            <div>  &quot;<span style={{ color: '#a6e3a1' }}>result</span>&quot;: {'{'}</div>
            <div>    &quot;<span style={{ color: '#a6e3a1' }}>orderId</span>&quot;: &quot;17770529...&quot;,</div>
            <div>    &quot;<span style={{ color: '#a6e3a1' }}>payment_url</span>&quot;: &quot;https://pay.../pay?data=...&quot;</div>
            <div>  {'}'}</div>
            <div>{'}'}</div>
          </div>
        </div>
      </div>
    </>
  );
}
