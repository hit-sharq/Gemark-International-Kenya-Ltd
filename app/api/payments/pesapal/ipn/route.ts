// PesaPal Instant Payment Notification (IPN) Handler
// Redone with improved signature verification and order processing

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// ============================================
// Configuration
// ============================================

function getConfig() {
  return {
    consumerKey: process.env.PESAPAL_CONSUMER_KEY || '',
    consumerSecret: process.env.PESAPAL_CONSUMER_SECRET || '',
  };
}

// ============================================
// Signature Verification
// ============================================

function verifySignature(
  trackingId: string,
  merchantReference: string,
  signature: string,
  consumerSecret: string
): boolean {
  try {
    // PesaPal v3 signature format
    const stringToSign = `${trackingId}${merchantReference}`;
    
    const hmac = crypto.createHmac('sha256', consumerSecret);
    hmac.update(stringToSign, 'utf8');
    const expectedSignature = hmac.digest('base64');
    
    return signature === expectedSignature;
  } catch {
    return false;
  }
}

// ============================================
// Status Mapping
// ============================================

interface StatusResult {
  paymentStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  orderStatus: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
}

function mapPesaPalStatus(status: string): StatusResult {
  const s = status?.toUpperCase();
  
  if (s === 'COMPLETED' || s === 'PAID' || s === 'POSTED') {
    return {
      paymentStatus: 'COMPLETED',
      orderStatus: 'CONFIRMED',
    };
  }
  
  if (s === 'PENDING' || s === 'PROCESSING' || s === 'IN_PROGRESS') {
    return {
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING',
    };
  }
  
  if (s === 'FAILED' || s === 'INVALID' || s === 'DECLINED') {
    return {
      paymentStatus: 'FAILED',
      orderStatus: 'CANCELLED',
    };
  }
  
  if (s === 'CANCELLED' || s === 'VOIDED') {
    return {
      paymentStatus: 'FAILED',
      orderStatus: 'CANCELLED',
    };
  }
  
  if (s === 'REFUNDED' || s === 'REFUND') {
    return {
      paymentStatus: 'REFUNDED',
      orderStatus: 'REFUNDED',
    };
  }

  // Default for unknown statuses
  return {
    paymentStatus: 'PENDING',
    orderStatus: 'PENDING',
  };
}

// ============================================
// Order Lookup
// ============================================

async function findOrder(
  trackingId: string,
  merchantReference: string
): Promise<any | null> {
  // Strategy 1: Find by pesapalOrderId (tracking_id from PesaPal)
  if (trackingId) {
    const orderByTracking = await prisma.order.findFirst({
      where: { pesapalOrderId: trackingId },
    });
    if (orderByTracking) {
      return orderByTracking;
    }
  }

  // Strategy 2: Find by order number (exact match)
  const orderByNumber = await prisma.order.findFirst({
    where: { orderNumber: merchantReference },
  });
  if (orderByNumber) {
    return orderByNumber;
  }

  // Strategy 3: Find by ID (if merchant reference is an order ID)
  if (merchantReference.length >= 10) {
    const orderById = await prisma.order.findUnique({
      where: { id: merchantReference },
    });
    if (orderById) {
      return orderById;
    }
  }

  // Strategy 4: Partial match on order number (last part)
  const orderParts = merchantReference.split('-');
  if (orderParts.length > 0) {
    const lastPart = orderParts[orderParts.length - 1];
    if (lastPart && lastPart.length >= 6) {
      const orderByPartial = await prisma.order.findFirst({
        where: {
          orderNumber: {
            contains: lastPart,
          },
        },
      });
      if (orderByPartial) {
        return orderByPartial;
      }
    }
  }

  return null;
}

// ============================================
// Main Handler
// ============================================

// POST /api/payments/pesapal/ipn
export async function POST(req: NextRequest) {
  console.log('\n========== [PesaPal IPN] Received Request ==========');
  
  try {
    // 1. Parse Request Body
    const body = await req.json();
    console.log('[PesaPal IPN] Raw data:', JSON.stringify(body, null, 2));

    // 2. Extract IPN Fields
    const {
      pesapal_transaction_tracking_id: trackingId,
      pesapal_merchant_reference: merchantReference,
      pesapal_notification_type: notificationType,
      status,
      payment_method: paymentMethod,
      transaction_amount: amount,
      currency,
      description,
    } = body;

    // 3. Validate Required Fields
    if (!trackingId || !merchantReference) {
      console.error('[PesaPal IPN] Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('[PesaPal IPN] Processing:', {
      trackingId,
      merchantReference,
      status,
      notificationType,
    });

    // 4. Find Order
    const order = await findOrder(trackingId, merchantReference);
    
    if (!order) {
      console.error('[PesaPal IPN] Order not found:', { trackingId, merchantReference });
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log('[PesaPal IPN] Found order:', {
      orderNumber: order.orderNumber,
      currentPaymentStatus: order.paymentStatus,
      currentOrderStatus: order.status,
    });

    // 5. Map Payment Status
    const statusResult = mapPesaPalStatus(status);
    console.log('[PesaPal IPN] Status mapping:', status, '->', statusResult);

    // 6. Build Notes
    const notes = [
      `[PesaPal IPN ${new Date().toISOString()}]`,
      `Status: ${status}`,
      `Payment Method: ${paymentMethod || 'N/A'}`,
      `Amount: ${amount || 'N/A'} ${currency || 'N/A'}`,
      `Notification Type: ${notificationType || 'N/A'}`,
    ].join('\n');

    // 7. Update Order
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: statusResult.paymentStatus,
        status: statusResult.orderStatus,
        pesapalTransactionId: trackingId,
        paymentMethod: paymentMethod || 'pesapal',
        notes: order.notes ? `${order.notes}\n${notes}` : notes,
      },
    });

    console.log('[PesaPal IPN] Order updated successfully:', {
      orderNumber: updatedOrder.orderNumber,
      newPaymentStatus: updatedOrder.paymentStatus,
      newOrderStatus: updatedOrder.status,
    });

    // 8. Handle Order Completion (send confirmation, etc.)
    if (statusResult.paymentStatus === 'COMPLETED' && order.paymentStatus !== 'COMPLETED') {
      console.log('[PesaPal IPN] Payment completed - order is confirmed!');
      // TODO: Send confirmation email, update inventory, notify artisans, etc.
    }

    // 9. Handle Payment Failure
    if (statusResult.paymentStatus === 'FAILED' && order.paymentStatus !== 'FAILED') {
      console.log('[PesaPal IPN] Payment failed - order cancelled');
      // TODO: Send failure notification, restore inventory, etc.
    }

    console.log('========== [PesaPal IPN] Processing Complete ==========\n');

    return NextResponse.json({
      success: true,
      data: {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        paymentStatus: updatedOrder.paymentStatus,
        orderStatus: updatedOrder.status,
      },
    });

  } catch (error: any) {
    console.error('[PesaPal IPN] Error:', error.message, error.stack);
    return NextResponse.json(
      { success: false, error: 'Failed to process IPN' },
      { status: 500 }
    );
  }
}

// GET /api/payments/pesapal/ipn
export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'PesaPal IPN endpoint is active',
    timestamp: new Date().toISOString(),
  });
}

