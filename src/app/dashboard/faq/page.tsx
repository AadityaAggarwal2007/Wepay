'use client';

import { useState } from 'react';

const faqItems = [
  { q: 'Khud Developer Hire Karna Hoga', a: 'Yes, you need to hire your own developer for API integration. We provide complete documentation, SDK files, and code examples to make integration as smooth as possible.' },
  { q: 'Documentation Hi Support Hai', a: 'Our documentation serves as your primary support resource. It includes detailed API references, code samples in multiple languages, and webhook integration guides.' },
  { q: 'Developer Experience Mandatory', a: 'Basic programming knowledge is required for API integration. Our SDKs support PHP, Java, Python, JavaScript, and more. Choose the language your team is comfortable with.' },
  { q: 'No Direct Technical Support', a: 'We do not provide hands-on coding support. However, our documentation is comprehensive and our SDK files are plug-and-play for most popular frameworks.' },
  { q: 'Subscription ≠ Integration', a: 'Purchasing a subscription gives you access to the API and dashboard. Integration into your application is a separate process that your development team handles.' },
  { q: 'Non-Interference Policy', a: 'We maintain a strict non-interference policy regarding your business operations. Our role is limited to providing payment gateway infrastructure.' },
  { q: 'Testing Responsibility', a: 'All testing of payment flows, webhook handling, and error scenarios is the responsibility of your development team. Use our test mode for safe testing.' },
  { q: 'Pre-Sales Consultation', a: 'Contact us via WhatsApp for any pre-purchase questions about plans, features, and API capabilities before committing to a subscription.' },
  { q: 'Integration Fees', a: 'There are no additional integration fees beyond your subscription plan. The subscription covers full API access, dashboard, and SDK downloads.' },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="card">
      <div className="card-body" style={{ padding: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Important Information</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 14 }}>
          Please read carefully before using our API & services
        </p>

        <div>
          {faqItems.map((item, i) => (
            <div key={i} className={`accordion-item ${openIndex === i ? 'open' : ''}`}>
              <div
                className="accordion-header"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span>{i + 1}. {item.q}</span>
                <span className="accordion-icon">+</span>
              </div>
              <div className="accordion-body">
                {item.a}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
