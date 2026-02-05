import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { isAdmin } from '@/lib/auth';
import { 
  getShipmentById, 
  updateShipment, 
  deleteShipment, 
  updateShipmentStatus 
} from '@/lib/shipment-service';
import type { UpdateShipmentRequest } from '@/types/shipping';
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
// GET /api/shipments/[id] - Get shipment by ID
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const result = await getShipmentById(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    // Check if user has access to this shipment
    const adminStatus = await isAdmin(userId);
    const shipment = result.data!;

    // Admins can view all shipments
    if (adminStatus) {
      return NextResponse.json({
        success: true,
        data: shipment,
      });
    }

    // For regular users, they can view their own shipments
    // This would need additional logic based on order ownership
    return NextResponse.json({
      success: true,
      data: shipment,
    });
  } catch (error) {
    console.error('Error fetching shipment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipment' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/shipments/[id] - Update shipment
// ============================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin access
    const { isAdmin: isAdminUser } = await checkAdminAccess();
    if (!isAdminUser) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body: UpdateShipmentRequest = await request.json();

    const result = await updateShipment(id, body);

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
    console.error('Error updating shipment:', error);
    return NextResponse.json(
      { error: 'Failed to update shipment' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/shipments/[id] - Delete shipment
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin access
    const { isAdmin: isAdminUser } = await checkAdminAccess();
    if (!isAdminUser) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const result = await deleteShipment(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Shipment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting shipment:', error);
    return NextResponse.json(
      { error: 'Failed to delete shipment' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/shipments/[id]/status - Update shipment status
// ============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin access
    const { isAdmin: isAdminUser } = await checkAdminAccess();
    if (!isAdminUser) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, location, description } = body;

    if (!status || !Object.values(ShipmentStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required' },
        { status: 400 }
      );
    }

    const result = await updateShipmentStatus(
      id,
      status,
      location,
      description
    );

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
    console.error('Error updating shipment status:', error);
    return NextResponse.json(
      { error: 'Failed to update shipment status' },
      { status: 500 }
    );
  }
}

