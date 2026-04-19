'use client';

const plans = [
  { name: 'Basic', price: 1299, duration: '1 Month', features: ['0% Fee', 'Realtime', 'No Limit'], extras: { dynamicQr: false, paytm: false, support: true }, color: 'var(--primary)' },
  { name: 'Enterprise', price: 14999, duration: '12 Months', popular: true, features: ['0% Fee', 'Realtime', 'No Limit'], extras: { dynamicQr: true, paytm: true, support: true }, color: '#ec4899' },
  { name: 'Starter', price: 3499, duration: '3 Months', features: ['0% Fee', 'Realtime', 'No Limit'], extras: { dynamicQr: true, paytm: true, support: true }, color: 'var(--primary)' },
  { name: 'Business', price: 6999, duration: '6 Months', features: ['0% Fee', 'Realtime', 'No Limit'], extras: { dynamicQr: true, paytm: true, support: true }, color: 'var(--primary)' },
];

export default function SubscriptionPage() {
  return (
    <>
      <div className="text-center" style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, fontStyle: 'italic', color: 'var(--primary)' }}>
          Choose Your Plan
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
          Flexible plans for your business growth
        </p>
      </div>

      <div className="plans-grid">
        {plans.map((plan) => (
          <div key={plan.name} className={`plan-card ${plan.popular ? 'popular' : ''}`}>
            {plan.popular && (
              <span className="plan-badge">
                <i className="fas fa-check-circle" /> Popular
              </span>
            )}
            <h3 className="plan-name">{plan.name}</h3>
            <div className="plan-price" style={{ color: plan.popular ? '#ec4899' : 'var(--primary)' }}>
              ₹{plan.price.toLocaleString()}<span>/mo</span>
            </div>
            <div className="plan-duration">
              <i className="fas fa-calendar-alt" /> {plan.duration}
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="fas fa-check-circle" style={{ color: 'var(--primary)' }} /> Features
              </div>
              <ul className="plan-features">
                {plan.features.map((f) => (
                  <li key={f}>
                    <span className="check">✓</span> {f}
                  </li>
                ))}
                <li>
                  <span className={plan.extras.dynamicQr ? 'check' : 'cross'}>
                    {plan.extras.dynamicQr ? '✓' : '−'}
                  </span>
                  <span style={{ color: plan.extras.dynamicQr ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    Dynamic QR
                  </span>
                </li>
                <li>
                  <span className={plan.extras.paytm ? 'check' : 'cross'}>
                    {plan.extras.paytm ? '✓' : '−'}
                  </span>
                  <span style={{ color: plan.extras.paytm ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    Paytm Button
                  </span>
                </li>
                <li>
                  <span className="check">✓</span> 24/7 Support
                </li>
              </ul>
            </div>

            <button
              className="btn btn-primary btn-lg btn-block"
              style={{
                background: plan.popular
                  ? 'linear-gradient(135deg, #ec4899, #f43f5e)'
                  : 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                marginTop: 16,
              }}
            >
              Get Started <i className="fas fa-arrow-right" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
