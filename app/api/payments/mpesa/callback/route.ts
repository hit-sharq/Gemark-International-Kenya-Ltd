// M-Pesa Callback API Route
// Handles STK Push callback results

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface MpesaCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}

// POST /api/payments/mpesa/callback - Handle M-Pesa callback
export async function POST(req: NextRequest) {
  try {
    const body: MpesaCallback = await req.json();

    const { stkCallback } = body.Body;
    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    console.log('M-Pesa callback received:', {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
    });

    // Find order by merchant request ID (we can store this in the order)
    // For now, we'll query by order number pattern
    const order = await prisma.order.findFirst({
      where: {
        mpesaTransactionId: MerchantRequestID, // We'll store this as reference
      },
    });

    if (!order) {
      console.log('Order not found for M-Pesa callback');
      return NextResponse.json({ success: true });
    }

    if (ResultCode === 0) {
      // Payment successful
      const metadata = CallbackMetadata?.Item || [];
      const mpesaReceiptNumber = metadata.find((item) => item.Name === 'MpesaReceiptNumber')?.Value as string;
      const amount = metadata.find((item) => item.Name === 'Amount')?.Value;
      const phoneNumber = metadata.find((item) => item.Name === 'PhoneNumber')?.Value;

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'COMPLETED',
          status: 'CONFIRMED',
          mpesaTransactionId: mpesaReceiptNumber || CheckoutRequestID,
          notifications: {
            create: {
              type: 'PAYMENT_RECEIVED',
              title: 'Payment Received',
              message: `Payment of ${amount} received from ${phoneNumber}. Receipt: ${mpesaReceiptNumber}`,
              emailSent: false,
            },
          },
        },
      });

      console.log('Payment successful:', mpesaReceiptNumber);
    } else {
      // Payment failed
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'FAILED',
          status: 'CANCELLED',
          notifications: {
            create: {
              type: 'ACCOUNT_UPDATE',
              title: 'Payment Failed',
              message: `Payment failed: ${ResultDesc}`,
              emailSent: false,
            },
          },
        },
      });

      console.log('Payment failed:', ResultDesc);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process callback' },
      { status: 500 }
    );
  }
}

