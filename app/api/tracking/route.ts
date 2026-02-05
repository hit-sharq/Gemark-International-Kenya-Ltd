import { NextRequest, NextResponse } from 'next/server';
import { getTrackingInfo } from '@/lib/shipment-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trackingNumber = searchParams.get('tracking');
  
  if (!trackingNumber) {
    return NextResponse.json({ error: 'Tracking number required' }, { status: 400 });
  }
  
  const trackingInfo = await getTrackingInfo(trackingNumber);
  
  if (!trackingInfo) {
    return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
  }
  
  return NextResponse.json({ success: true, data: trackingInfo });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { trackingNumber } = body;
  
  if (!trackingNumber) {
    return NextResponse.json({ error: 'Tracking number required' }, { status: 400 });
  }
  
  const trackingInfo = await getTrackingInfo(trackingNumber);
  
  if (!trackingInfo) {
    return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
  }
  
  return NextResponse.json({ success: true, data: trackingInfo });
}
