import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { isAdmin } from '@/lib/auth';
import { 
  createShipment, 
  getShipments, 
  getShipmentById, 
  updateShipment, 
  deleteShipment,
  updateShipmentStatus 
} from '@/lib/shipment-service';
import type { CreateShipmentRequest, UpdateShipmentRequest } from '@/types/shipping';
import { ShipmentStatus } from '@prisma/client';

// ============================================
// Helper function to check admin access
// ============================================

async function checkAdminAccess(): Promise<{ isAdmin: boolean; userId: string | null }> {
  const { userId } = await auth();
  
  if (!userId) {
    return { isAdmin: false, userId: null };
  }
  
  const adminStatus = await isAdmin(userId);
  return { isAdmin: adminStatus, userId };
}

// ============================================
// GET /api/shipments - List shipments
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const adminStatus = await isAdmin(userId);
    if (!adminStatus) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const dateFrom = searchParams.get('dateFrom') 
      ? new Date(searchParams.get('dateFrom')!) 
      : undefined;
    const dateTo = searchParams.get('dateTo') 
      ? new Date(searchParams.get('dateTo')!) 
      : undefined;

    const result = await getShipments({
      page,
      limit,
      status: status as ShipmentStatus,
      search,
      dateFrom,
      dateTo,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching shipments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipments' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/shipments - Create shipment
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const adminStatus = await isAdmin(userId);
    if (!adminStatus) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body: CreateShipmentRequest = await request.json();

    // Validate required fields
    if (!body.destination || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Destination and items are required' },
        { status: 400 }
      );
    }

    const result = await createShipment(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error creating shipment:', error);
    return NextResponse.json(
      { error: 'Failed to create shipment' },
      { status: 500 }
    );
  }
}

