'use client';

const sdkItems = [
  { name: 'Android SDK', desc: 'Android app integration', file: 'android.zip', icon: 'fab fa-android', popular: false },
  { name: 'PHP SDK', desc: 'PHP web application integration', file: 'php.zip', icon: 'fab fa-php', popular: false },
  { name: 'Java SDK', desc: 'Java application integration', file: 'java.zip', icon: 'fab fa-java', popular: false },
  { name: 'Python SDK', desc: 'Python application integration', file: 'python.zip', icon: 'fab fa-python', popular: false },
  { name: 'C# SDK', desc: '.NET application integration', file: 'csharp.zip', icon: 'fas fa-code', popular: false },
  { name: 'Ruby SDK', desc: 'Ruby application integration', file: 'ruby.zip', icon: 'fas fa-gem', popular: false },
  { name: 'JavaScript SDK', desc: 'Web application integration', file: 'javascript.zip', icon: 'fab fa-js-square', popular: false },
  { name: 'C++ SDK', desc: 'C++ application integration', file: 'cpp.zip', icon: 'fas fa-microchip', popular: false },
  { name: 'Kotlin SDK', desc: 'Android Kotlin integration', file: 'kotlin.zip', icon: 'fas fa-mobile-alt', popular: false },
  { name: 'TypeScript SDK', desc: 'TypeScript web integration', file: 'typescript.zip', icon: 'fab fa-js', popular: false },
  { name: 'WHMCS SDK', desc: 'Web hosting integration', file: 'whmcs.zip', icon: 'fas fa-server', popular: false },
  { name: 'Trova SDK', desc: 'Trova game integration', file: 'trova.zip', icon: 'fas fa-gamepad', popular: false },
  { name: 'Fastwin SDK', desc: 'Fastwin game integration', file: 'fastwin.zip', icon: 'fas fa-trophy', popular: false },
  { name: 'WordPress SDK', desc: 'WooCommerce payment gateway plugin', file: 'wordpress.zip', icon: 'fab fa-wordpress', popular: true },
];

export default function SdkPage() {
  return (
    <div className="sdk-grid">
      {sdkItems.map((sdk) => (
        <div className="sdk-card" key={sdk.name} style={{ position: 'relative' }}>
          {sdk.popular && (
            <span style={{
              position: 'absolute', top: 12, right: 12,
              background: 'linear-gradient(135deg, var(--success), #059669)',
              color: 'white', padding: '2px 10px', borderRadius: 'var(--radius-full)',
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase'
            }}>
              Popular
            </span>
          )}
          <span className="sdk-badge">FREE</span>
          <h3 className="sdk-name">
            <i className={sdk.icon} style={{ marginRight: 6, color: 'var(--primary)' }} />
            {sdk.name}
          </h3>
          <p className="sdk-desc">{sdk.desc}</p>
          <a
            href={`/sdk/${sdk.file}`}
            download
            className="btn btn-primary btn-block"
            style={{ textDecoration: 'none' }}
          >
            Download
          </a>
        </div>
      ))}
    </div>
  );
}
