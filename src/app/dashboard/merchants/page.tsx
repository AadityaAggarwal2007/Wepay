'use client';

import { useState } from 'react';

const mockMerchants = [
  { id: 1, type: 'BHARATPE', mobile: '9717090962', date: '18 Apr 2026, 08:12 PM', status: 'Active', verified: true },
];

export default function MerchantsPage() {
  const [merchantType, setMerchantType] = useState('');
  const [mobile, setMobile] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API call to add merchant
    alert('Merchant connection initiated! OTP will be sent to the mobile number.');
  };

  return (
    <>
      {/* Add Merchant Form */}
      <div className="card mb-24">
        <div className="card-body">
          <h2 className="card-title" style={{ marginBottom: 4 }}>
            <i className="fas fa-plus-circle" style={{ color: 'var(--primary)' }} />
            Add New Merchant
          </h2>
          <p className="card-subtitle">Connect a new payment merchant</p>

          <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Merchant Name</label>
                <select
                  className="form-select"
                  value={merchantType}
                  onChange={(e) => setMerchantType(e.target.value)}
                  required
                >
                  <option value="">Select Merchant Type</option>
                  <option value="bharatpe">BharatPe</option>
                  <option value="phonepe">PhonePe Business</option>
                  <option value="paytm">Paytm Business</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Cashier Mobile Number</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="Enter 10-digit mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  pattern="[0-9]{10}"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-lg">
                <i className="fas fa-plus" /> Add Merchant
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Connected Merchants Table */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-16">
            <div>
              <h2 className="card-title">
                <i className="fas fa-list" style={{ color: 'var(--primary)' }} />
                All Connected Merchants
              </h2>
              <p className="card-subtitle">Manage your connected payment merchants</p>
            </div>
            <select className="form-select" style={{ width: 'auto' }}>
              <option>10 entries</option>
              <option>25 entries</option>
              <option>50 entries</option>
            </select>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Merchant Type</th>
                <th>Mobile Number</th>
                <th>Added Date</th>
                <th>Status</th>
                <th>Verify</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {mockMerchants.map((m) => (
                <tr key={m.id}>
                  <td>{m.id}</td>
                  <td><span className="badge badge-warning">{m.type}</span></td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className="fas fa-phone" style={{ fontSize: 12, color: 'var(--text-muted)' }} />
                      {m.mobile}
                    </span>
                  </td>
                  <td>{m.date}</td>
                  <td><span className="badge badge-success">{m.status}</span></td>
                  <td>
                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                      <i className="fas fa-check-circle" /> Verified
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-danger" style={{ padding: '6px 16px', fontSize: 12 }}>
                      <i className="fas fa-trash" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <span className="pagination-info">Showing 1 to {mockMerchants.length} of {mockMerchants.length} entries</span>
            <div className="pagination-controls">
              <button className="pagination-btn">Previous</button>
              <button className="pagination-btn active">1</button>
              <button className="pagination-btn">Next</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
