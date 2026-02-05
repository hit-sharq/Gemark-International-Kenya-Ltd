'use client';
import { useState, useEffect } from 'react';

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/shipments')
      .then(res => res.json())
      .then(data => {
        if (data.success) setShipments(data.data);
      })
      .finally(() => setLoading(false));
  }, []);
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Shipment Management</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">Tracking #</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Destination</th>
                <th className="p-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s: any) => (
                <tr key={s.id} className="border-b">
                  <td className="p-3">{s.trackingNumber || 'N/A'}</td>
                  <td className="p-3">{s.status}</td>
                  <td className="p-3">{s.destinationName || 'N/A'}</td>
                  <td className="p-3">{new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
