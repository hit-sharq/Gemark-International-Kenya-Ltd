// Shipment Service for ArtAfrik
// Handles shipment CRUD operations and tracking

import { prisma } from '@/lib/prisma';
import { 
  calculateTotalWeight, 
  getEstimatedDeliveryDate,
  getZoneByCountry 
} from '@/lib/shipping-calculator';
import type { 
  CreateShipmentRequest, 
  UpdateShipmentRequest,
  TrackingInfo
} from '@/types/shipping';
import { ShipmentStatus as PrismaShipmentStatus } from '@prisma/client';

// ============================================
// Tracking Number Generation
// ============================================

function generateTrackingNumber(prefix: string = 'AF'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

// ============================================
// Create Shipment
// ============================================

export async function createShipment(data: CreateShipmentRequest) {
  try {
    // Calculate weight and dimensions
    const totalWeight = calculateTotalWeight(data.items as any);
    const estimatedDelivery = getEstimatedDeliveryDate(
      getZoneByCountry(data.destination.countryCode)
    );

    // Create shipment (using orderId instead of direct relation)
    const shipment = await prisma.shipment.create({
      data: {
        orderId: data.orderId,
        trackingNumber: generateTrackingNumber(),
        carrier: data.courier,
        shippingMethod: data.serviceType,
        serviceType: data.serviceType,
        paymentType: data.paymentType,
        estimatedDelivery,
        status: PrismaShipmentStatus.PENDING,
        originName: `${data.origin.firstName} ${data.origin.lastName}`,
        originAddress: formatAddress(data.origin),
        originPhone: data.origin.phone,
        originEmail: data.origin.email,
        destinationName: `${data.destination.firstName} ${data.destination.lastName}`,
        destinationAddress: formatAddress(data.destination),
        destinationPhone: data.destination.phone,
        destinationEmail: data.destination.email,
        destinationCity: data.destination.city,
        destinationCountry: data.destination.countryCode,
        totalWeight,
        notes: data.specialInstructions,
      },
    });

    // Create shipment items separately
    for (const item of data.items) {
      await prisma.shipmentItem.create({
        data: {
          shipmentId: shipment.id,
          artListingId: item.artListingId,
          title: item.title,
          quantity: item.quantity,
          weight: item.weight || 0.5,
          value: item.value,
        },
      });
    }

    return {
      success: true,
      data: {
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber,
        estimatedDelivery: shipment.estimatedDelivery,
      },
    };
  } catch (error) {
    console.error('Error creating shipment:', error);
    return {
      success: false,
      error: 'Failed to create shipment',
    };
  }
}

// ============================================
// Get Shipment by ID
// ============================================

export async function getShipmentById(shipmentId: string) {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        items: true,
        events: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!shipment) {
      return { success: false, error: 'Shipment not found' };
    }

    return { success: true, data: shipment as any };
  } catch (error) {
    console.error('Error fetching shipment:', error);
    return { success: false, error: 'Failed to fetch shipment' };
  }
}

// ============================================
// Get Shipment by Tracking Number
// ============================================

export async function getShipmentByTracking(trackingNumber: string) {
  try {
    const shipment = await prisma.shipment.findFirst({
      where: { trackingNumber },
      include: {
        items: true,
        events: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!shipment) {
      return { success: false, error: 'Shipment not found' };
    }

    return { success: true, data: shipment as any };
  } catch (error) {
    console.error('Error fetching shipment:', error);
    return { success: false, error: 'Failed to fetch shipment' };
  }
}

// ============================================
// Get Shipments with Pagination
// ============================================

export async function getShipments(params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  const {
    page = 1,
    limit = 20,
    status,
    search,
    dateFrom,
    dateTo,
  } = params;

  const skip = (page - 1) * limit;
  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { trackingNumber: { contains: search, mode: 'insensitive' } },
      { destinationName: { contains: search, mode: 'insensitive' } },
      { destinationPhone: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = dateFrom;
    if (dateTo) where.createdAt.lte = dateTo;
  }

  try {
    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          _count: {
            select: { events: true },
          },
        },
      }),
      prisma.shipment.count({ where }),
    ]);

    return {
      success: true,
      data: shipments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching shipments:', error);
    return { success: false, error: 'Failed to fetch shipments' };
  }
}

// ============================================
// Update Shipment
// ============================================

export async function updateShipment(shipmentId: string, data: UpdateShipmentRequest) {
  try {
    const updateData: any = {};

    if (data.status) updateData.status = data.status;
    if (data.trackingNumber) updateData.trackingNumber = data.trackingNumber;
    if (data.courier) updateData.carrier = data.courier;
    if (data.estimatedDelivery) updateData.estimatedDelivery = data.estimatedDelivery;
    if (data.shippedAt) updateData.shippedAt = data.shippedAt;
    if (data.deliveredAt) updateData.deliveredAt = data.deliveredAt;
    if (data.notes) updateData.notes = data.notes;
    if (data.location) updateData.location = data.location;

    const shipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: updateData,
      include: {
        items: true,
        events: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    // Add tracking event if status changed
    if (data.status) {
      await addShipmentEvent(shipmentId, {
        status: data.status,
        statusCode: data.status,
        description: `Shipment status updated to ${data.status}`,
        location: data.location,
        timestamp: new Date(),
      });
    }

    return { success: true, data: shipment as any };
  } catch (error) {
    console.error('Error updating shipment:', error);
    return { success: false, error: 'Failed to update shipment' };
  }
}

// ============================================
// Update Shipment Status
// ============================================

export async function updateShipmentStatus(
  shipmentId: string,
  status: string,
  location?: string,
  description?: string
) {
  try {
    // First add the event
    await addShipmentEvent(shipmentId, {
      status,
      statusCode: status,
      description: description || `Shipment ${status.toLowerCase().replace('_', ' ')}`,
      location,
      timestamp: new Date(),
    });

    // Then update the shipment
    const updateData: any = {
      status: status as any,
      location,
    };

    if (status === 'SHIPPED') updateData.shippedAt = new Date();
    if (status === 'PICKED_UP') updateData.pickedUpAt = new Date();
    if (status === 'OUT_FOR_DELIVERY') updateData.outForDeliveryAt = new Date();
    if (status === 'DELIVERED') updateData.deliveredAt = new Date();

    const shipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: updateData,
      include: {
        items: true,
        events: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    return { success: true, data: shipment as any };
  } catch (error) {
    console.error('Error updating shipment status:', error);
    return { success: false, error: 'Failed to update shipment status' };
  }
}

// ============================================
// Delete Shipment
// ============================================

export async function deleteShipment(shipmentId: string) {
  try {
    await prisma.shipment.delete({
      where: { id: shipmentId },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting shipment:', error);
    return { success: false, error: 'Failed to delete shipment' };
  }
}

// ============================================
// Shipment Events (Tracking History)
// ============================================

export async function addShipmentEvent(
  shipmentId: string,
  event: {
    status: string;
    statusCode: string;
    description: string;
    location?: string;
    timestamp: Date;
  }
) {
  try {
    const shipmentEvent = await prisma.shipmentEvent.create({
      data: {
        shipmentId,
        status: event.status,
        statusCode: event.statusCode,
        description: event.description,
        location: event.location,
        timestamp: event.timestamp,
      },
    });

    return { success: true, data: shipmentEvent };
  } catch (error) {
    console.error('Error adding shipment event:', error);
    return { success: false, error: 'Failed to add event' };
  }
}

export async function getShipmentEvents(shipmentId: string) {
  try {
    const events = await prisma.shipmentEvent.findMany({
      where: { shipmentId },
      orderBy: { timestamp: 'desc' },
    });

    return { success: true, data: events };
  } catch (error) {
    console.error('Error fetching shipment events:', error);
    return { success: false, error: 'Failed to fetch events' };
  }
}

// ============================================
// Get Tracking Info (for public tracking page)
// ============================================

export async function getTrackingInfo(trackingNumber: string): Promise<TrackingInfo | null> {
  const result = await getShipmentByTracking(trackingNumber);
  
  if (!result.success || !result.data) {
    return null;
  }

  const shipment = result.data as any;

  // Get status description
  const statusDescriptions: Record<string, string> = {
    PENDING: 'Your shipment is being prepared',
    PICKED_UP: 'Your shipment has been picked up',
    IN_TRANSIT: 'Your shipment is on its way',
    OUT_FOR_DELIVERY: 'Your shipment is out for delivery',
    DELIVERED: 'Your shipment has been delivered',
    RETURNED: 'Your shipment is being returned',
    FAILED: 'Delivery attempt failed',
  };

  // Map events to tracking events
  const events = (shipment.events || []).map((event: any) => ({
    timestamp: event.timestamp,
    status: event.status,
    statusCode: event.statusCode,
    location: event.location || undefined,
    description: event.description,
    isCurrentLocation: false,
  }));

  // Mark current status event
  if (events.length > 0) {
    events[0].isCurrentLocation = true;
  }

  return {
    trackingNumber: shipment.trackingNumber || '',
    courier: shipment.carrier || 'ArtAfrik Shipping',
    status: shipment.status as any,
    statusDescription: statusDescriptions[shipment.status] || 'Unknown status',
    origin: shipment.originName || 'ArtAfrik Warehouse',
    destination: shipment.destinationName || 'Recipient',
    estimatedDelivery: shipment.estimatedDelivery || undefined,
    actualDelivery: shipment.deliveredAt || undefined,
    events,
    lastUpdated: shipment.updatedAt,
  };
}

// ============================================
// Shipment Statistics
// ============================================

export async function getShipmentStats() {
  try {
    const [
      totalShipments,
      pendingShipments,
      inTransitShipments,
      deliveredShipments,
      returnedShipments,
    ] = await Promise.all([
      prisma.shipment.count(),
      prisma.shipment.count({ where: { status: PrismaShipmentStatus.PENDING } }),
      prisma.shipment.count({ where: { status: PrismaShipmentStatus.IN_TRANSIT } }),
      prisma.shipment.count({ where: { status: PrismaShipmentStatus.DELIVERED } }),
      prisma.shipment.count({ where: { status: PrismaShipmentStatus.RETURNED } }),
    ]);

    return {
      success: true,
      data: {
        totalShipments,
        pendingShipments,
        inTransitShipments,
        deliveredShipments,
        returnedShipments,
      },
    };
  } catch (error) {
    console.error('Error fetching shipment stats:', error);
    return { success: false, error: 'Failed to fetch stats' };
  }
}

// ============================================
// Helper Functions
// ============================================

function formatAddress(address: any): string {
  const parts = [
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ].filter(Boolean);
  
  return parts.join(', ');
}

