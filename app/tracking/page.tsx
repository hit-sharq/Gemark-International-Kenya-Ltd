'use client';
import { useState } from 'react';

interface TrackingEvent {
  description: string;
  timestamp: string;
  location?: string;
}

interface TrackingInfo {
  trackingNumber: string;
  statusDescription: string;
  destination: string;
  estimatedDelivery?: string;
  events: TrackingEvent[];
}

export default function TrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [error, setError] = useState('');
  
  const searchTracking = async () => {
    setError('');
    setTrackingInfo(null);
    
    const res = await fetch(`/api/tracking?tracking=${trackingNumber}`);
    const data = await res.json();
    
    if (data.success) {
      setTrackingInfo(data.data);
    } else {
      setError(data.error || 'Shipment not found');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Track Your Shipment</h1>
      
      <div className="flex gap-2 mb-8">
        <input
          type="text"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="Enter tracking number (e.g., AF...)"
          className="flex-1 p-3 border rounded-lg"
        />
        <button
          onClick={searchTracking}
          className="bg-black text-white px-6 py-3 rounded-lg"
        >
          Track
        </button>
      </div>
      
      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      {trackingInfo && (
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-500">Tracking Number</p>
            <p className="text-xl font-mono font-bold">{trackingInfo.trackingNumber}</p>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-500">Status</p>
            <p className="text-lg font-semibold">{trackingInfo.statusDescription}</p>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-500">Destination</p>
            <p>{trackingInfo.destination}</p>
          </div>
          
          {trackingInfo.estimatedDelivery && (
            <div className="mb-4">
              <p className="text-sm text-gray-500">Estimated Delivery</p>
              <p>{new Date(trackingInfo.estimatedDelivery).toLocaleDateString()}</p>
            </div>
          )}
          
          <div className="mt-6">
            <h3 className="font-semibold mb-3">Tracking History</h3>
            {trackingInfo.events.map((event, i) => (
              <div key={i} className="border-l-2 border-gray-200 pl-4 py-2">
                <p className="font-medium">{event.description}</p>
                <p className="text-sm text-gray-500">
                  {new Date(event.timestamp).toLocaleString()}
                  {event.location && ` - ${event.location}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

