'use client';

export default function DocumentationPage() {
  return (
    <div className="card">
      <div className="card-body" style={{ padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <i className="fas fa-credit-card" style={{ color: 'var(--primary)', fontSize: 18 }} />
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>API Gateway Docs</span>
        </div>

        {/* Overview */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Overview</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            This API allows you to create a PayIN Request using the platform.
          </p>
        </section>

        {/* Create Order Endpoint */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Endpoint PayIN API</h2>
          <p style={{ fontFamily: 'monospace', background: 'var(--success-bg)', color: 'var(--success)', padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontWeight: 600, display: 'inline-block', marginBottom: 16 }}>
            POST https://yourdomain.com/api/create-order
          </p>

          <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 12 }}>Request Parameters</h3>
          <table className="data-table" style={{ marginBottom: 20 }}>
            <thead><tr><th>Parameter</th><th>Type</th></tr></thead>
            <tbody>
              {[
                ['customer_mobile', 'Integer'],
                ['user_token', 'string'],
                ['amount', 'float'],
                ['order_id', 'string'],
                ['redirect_url', 'url'],
                ['remark1', 'string'],
                ['remark2', 'string'],
              ].map(([param, type]) => (
                <tr key={param}><td style={{ fontWeight: 600 }}>{param}</td><td>{type}</td></tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Example - Create PayIN Request</h3>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Request:</p>
          <div className="code-block">
            <pre>{`<?php
// API URL
$api_url = 'https://yourdomain.com/api/create-order';

// Form-encoded payload data
$post_data = [
    'customer_mobile' => '8145344963',
    'user_token' => "YOUR_API_TOKEN",
    'amount' => '1',
    'order_id' => '8787772321800',
    'redirect_url' => "your website url",
    'remark1' => 'testremark',
    'remark2' => 'testremark2',
];

// Initialize cURL session
$ch = curl_init($api_url);

// Set cURL options
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post_data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/x-www-form-urlencoded'
]);

$response = curl_exec($ch);

if (curl_errno($ch)) {
    echo 'cURL Error: ' . curl_error($ch);
} else {
    echo $response;
}

curl_close($ch);
?>`}</pre>
          </div>

          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 16, marginBottom: 8 }}>Response (Success):</p>
          <div className="code-block">
            <pre>{`{
  "status": true,
  "message": "Order Created Successfully",
  "result": {
    "orderId": "1234561705047510",
    "payment_url": "https://yourdomain.com/pay?data=MTIzNDU2MTcwNTA0NzUxMkyNTIy"
  }
}`}</pre>
          </div>
        </section>

        {/* Error Handling */}
        <section style={{ marginBottom: 32, padding: '16px 20px', background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--danger)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Error Handling</h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            If the status in the response is error, check the message field for details on the issue.
          </p>
        </section>

        {/* Check Order Status Endpoint */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Endpoint for Payin Status</h2>
          <p style={{ fontFamily: 'monospace', background: 'var(--info-bg)', color: 'var(--info)', padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontWeight: 600, display: 'inline-block', marginBottom: 16 }}>
            POST https://yourdomain.com/api/check-order-status
          </p>

          <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 12 }}>Request Parameters</h3>
          <table className="data-table" style={{ marginBottom: 20 }}>
            <thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
            <tbody>
              <tr><td style={{ fontWeight: 600 }}>user_token</td><td>string</td><td>The API Key.</td></tr>
              <tr><td style={{ fontWeight: 600 }}>order_id</td><td>string</td><td>AlphaNumeric.</td></tr>
            </tbody>
          </table>

          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Request Headers</h3>
          <table className="data-table" style={{ marginBottom: 20 }}>
            <thead><tr><th>Parameter</th><th>Description</th></tr></thead>
            <tbody>
              <tr><td style={{ fontWeight: 600 }}>Content-Type</td><td>Form-Encoded Payload (application/x-www-form-urlencoded)</td></tr>
            </tbody>
          </table>

          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Response</h3>
          <table className="data-table" style={{ marginBottom: 20 }}>
            <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
            <tbody>
              {[
                ['status', 'boolean', 'API request success status.'],
                ['message', 'string', 'API result message.'],
                ['result', 'object', 'Details of transaction.'],
                ['txnStatus', 'string', 'Transaction status.'],
                ['orderId', 'string', 'Order ID.'],
                ['amount', 'string', 'Transaction amount.'],
                ['date', 'string', 'Transaction time.'],
                ['utr', 'string', 'UTR Number.'],
              ].map(([field, type, desc]) => (
                <tr key={field}><td style={{ fontWeight: 600 }}>{field}</td><td>{type}</td><td>{desc}</td></tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Example - Check PayIN Status</h3>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Request:</p>
          <div className="code-block">
            <pre>{`<?php
$api_url = 'https://yourdomain.com/api/check-order-status';

$post_data = [
    'user_token' => "YOUR_API_TOKEN",
    'order_id' => '8787772321800'
];

$ch = curl_init($api_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post_data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/x-www-form-urlencoded'
]);

$response = curl_exec($ch);

if (curl_errno($ch)) {
    echo 'cURL Error: ' . curl_error($ch);
} else {
    echo $response;
}

curl_close($ch);
?>`}</pre>
          </div>

          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 16, marginBottom: 8 }}>Response (Success):</p>
          <div className="code-block">
            <pre>{`{
    "status": true,
    "message": "Transaction Successfully",
    "result": {
        "txnStatus": "SUCCESS",
        "orderId": "784525sdD",
        "amount": "1",
        "date": "2024-01-12 13:22:08",
        "utr": "454525454245"
    }
}`}</pre>
          </div>

          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 16, marginBottom: 8 }}>Response (Error):</p>
          <div className="code-block">
            <pre>{`{
    "status": false,
    "message": "Error Message"
}`}</pre>
          </div>
        </section>

        {/* Webhook */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Example - Webhook Response</h2>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>POST:</p>
          <div className="code-block">
            <pre>{`<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $status = $_POST['status'];
    $order_id = $_POST['order_id'];
    $customer_mobile = $_POST['customer_mobile'];
    $amount = $_POST['amount'];
    $remark1 = $_POST['remark1'];
    $remark2 = $_POST['remark2'];

    // Process the received data
    // Save to database, log it, or perform other actions
   
} else {
    http_response_code(405);
    echo 'Only POST requests are allowed';
}
?>`}</pre>
          </div>
        </section>
      </div>
    </div>
  );
}
