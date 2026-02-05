// M-Pesa Payment API Route
// Implements M-Pesa STK Push for mobile payments
// Paybill: 522533 | Account: 7771828 (KCB Bank)

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

// M-Pesa Configuration
// Paybill: 522533 | Account: 7771828 (KCB Bank)
const MPESA_ENV = process.env.MPESA_ENVIRONMENT || 'sandbox'; // 'sandbox' or 'live'
const MPESA_BASE_URL = MPESA_ENV === 'live'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

// Paybill Configuration
const SHORTCODE = process.env.MPESA_SHORTCODE || '522533'; // Default paybill from your requirement
const ACCOUNT_NUMBER = process.env.MPESA_ACCOUNT_NUMBER || '7771828'; // Default account from your requirement
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const PASSKEY = process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'; // Sandbox passkey

// Generate M-Pesa access token
async function getAccessToken(): Promise<{ token: string | null; error?: string }> {
  try {
    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
      return { token: null, error: 'M-Pesa credentials not configured' };
    }

    const credentials = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');

    const response = await fetch(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        'Authorization': `Basic ${credentials}`,
      },
    });

    const responseText = await response.text();
    
    if (!responseText || responseText.trim() === '') {
      return { token: null, error: 'Empty response from M-Pesa OAuth' };
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return { token: null, error: 'Invalid JSON from M-Pesa OAuth' };
    }

    if (!response.ok) {
      console.error('Failed to get M-Pesa access token:', data);
      return { token: null, error: data.errorDescription || 'Failed to get access token' };
    }

    return { token: data.access_token };
  } catch (error: any) {
    console.error('Error getting M-Pesa access token:', error);
    return { token: null, error: error.message };
  }
}

// Generate STK push password
function generatePassword(): string {
  const timestamp = new Date().toISOString().replace(/[-:TZ]/g, '').substring(0, 14);
  const shortcode = SHORTCODE || '';
  const passkey = PASSKEY || '';
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
}

// POST /api/payments/mpesa - Send STK Push
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const bodyText = await req.text();
    
    if (!bodyText || bodyText.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Request body is empty' },
        { status: 400 }
      );
    }

    let body;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { cartId, cartItems, shippingInfo, phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Support both local cart (cartItems array) and database cart (cartId)
    let cartItemsData: any[] = [];
    let subtotal = 0;

    if (cartItems && Array.isArray(cartItems)) {
      // Local cart - use provided cart items
      cartItemsData = cartItems;
      subtotal = cartItems.reduce((sum: number, item: any) => {
        return sum + (item.price || 0) * item.quantity;
      }, 0);
    } else if (cartId && cartId !== 'local') {
      // Database cart - fetch from database
      const cart = await prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          items: {
            include: {
              artListing: true,
            },
          },
        },
      });

      if (!cart || cart.userId !== userId) {
        return NextResponse.json(
          { success: false, error: 'Cart not found' },
          { status: 404 }
        );
      }

      if (cart.items.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Cart is empty' },
          { status: 400 }
        );
      }

      cartItemsData = cart.items.map(item => ({
        artListingId: item.artListingId,
        artListing: item.artListing,
        quantity: item.quantity,
        price: item.artListing.price,
        title: item.artListing.title,
      }));

      subtotal = cart.items.reduce((sum, item) => {
        return sum + (item.artListing.price || 0) * item.quantity;
      }, 0);
    } else {
      return NextResponse.json(
        { success: false, error: 'Valid cart items or cart ID is required' },
        { status: 400 }
      );
    }

    if (cartItemsData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Format phone number (remove + and ensure starts with 254)
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('7')) {
      formattedPhone = '254' + formattedPhone;
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    const shippingCost = subtotal > 500 ? 0 : 25;
    const tax = subtotal * 0.08;
    const total = Math.ceil(subtotal + shippingCost + tax); // M-Pesa needs integer amount

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { clerkId: userId },
      });
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order in database
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        orderNumber,
        subtotal,
        shippingCost,
        tax,
        total,
        shippingName: shippingInfo?.name,
        shippingEmail: shippingInfo?.email,
        shippingPhone: phoneNumber,
        shippingAddress: shippingInfo?.address,
        shippingCity: shippingInfo?.city,
        shippingCountry: shippingInfo?.country,
        paymentMethod: 'mpesa',
        notes: body.notes,
        items: {
          create: cartItemsData.map((item: any) => ({
            artListingId: item.artListingId || item.id,
            title: item.title || item.artListing?.title,
            price: item.price || item.artListing?.price,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: true,
      },
    });

// Check if M-Pesa is configured
    const { token, error: tokenError } = await getAccessToken();

    if (!token) {
      // Development mode - simulate STK push
      console.log('⚠️ M-Pesa not fully configured. Running in simulation mode.');
      console.log('Paybill:', SHORTCODE, 'Account:', ACCOUNT_NUMBER);

      // Clear cart (only if using database cart)
      if (cartId && cartId !== 'local') {
        await prisma.cartItem.deleteMany({
          where: { cartId },
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          paymentMethod: 'mpesa',
          isDevelopment: true,
          paybillInfo: {
            paybill: SHORTCODE,
            account: ACCOUNT_NUMBER,
            bank: 'KCB',
          },
          message: `STK push simulated. In production, payment would be sent to Paybill ${SHORTCODE} Account ${ACCOUNT_NUMBER} (KCB Bank).`,
          simulation: {
            phoneNumber: formattedPhone,
            amount: total,
            message: `Would send STK push to ${formattedPhone} for KES ${total}`,
          },
        },
      });
    }

    // Send STK Push
    const timestamp = new Date().toISOString().replace(/[-:TZ]/g, '').substring(0, 14);
    const password = generatePassword();

    const stkPushRequest = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: total,
      PartyA: formattedPhone,
      PartyB: SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/mpesa/callback`,
      AccountReference: ACCOUNT_NUMBER, // Using the configured account number
      TransactionDesc: `ArtAfrik Order ${orderNumber} - Paybill ${SHORTCODE}`,
    };

    console.log('Sending STK Push to:', formattedPhone);
    console.log('Paybill:', SHORTCODE, 'Account:', ACCOUNT_NUMBER);

    const response = await fetch(`${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPushRequest),
    });

    const responseText = await response.text();
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { ResponseDescription: responseText || 'Unknown error' };
    }

    if (response.ok && responseData.ResponseCode === '0') {
      // Clear cart (only if using database cart)
      if (cartId && cartId !== 'local') {
        await prisma.cartItem.deleteMany({
          where: { cartId },
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          paymentMethod: 'mpesa',
          checkoutRequestId: responseData.CheckoutRequestID,
          merchantRequestId: responseData.MerchantRequestID,
          message: 'STK push sent successfully. Please check your phone.',
          paybillInfo: {
            paybill: SHORTCODE,
            account: ACCOUNT_NUMBER,
            bank: 'KCB',
          },
        },
      });
    } else {
      // Handle error
      console.error('M-Pesa STK push error:', responseData);

      return NextResponse.json(
        { success: false, error: responseData.ResponseDescription || 'Failed to send STK push' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error sending M-Pesa STK push:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initiate payment: ' + error.message },
      { status: 500 }
    );
  }
}

// GET /api/payments/mpesa - Check payment status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const checkoutRequestId = searchParams.get('checkoutRequestId');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        shipment: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // If no checkout request ID, return current status
    if (!checkoutRequestId) {
      return NextResponse.json({
        success: true,
        data: {
          order,
          paymentStatus: order.paymentStatus,
          isDevelopment: !CONSUMER_KEY,
        },
      });
    }

    // Check status with M-Pesa
    const accessToken = await getAccessToken();

    if (!accessToken) {
      return NextResponse.json({
        success: true,
        data: {
          order,
          paymentStatus: order.paymentStatus,
          isDevelopment: true,
        },
      });
    }

    // Query transaction status
    const timestamp = new Date().toISOString().replace(/[-:TZ]/g, '').substring(0, 14);
    const password = generatePassword();

    const queryRequest = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    const response = await fetch(`${MPESA_BASE_URL}/mpesa/stkquery/v1/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queryRequest),
    });

    const responseData = await response.json();

    if (response.ok && responseData.ResponseCode === '0') {
      // Update order status
      const resultCode = parseInt(responseData.ResultCode);
      
      if (resultCode === 0) {
        // Payment successful
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'COMPLETED',
            status: 'CONFIRMED',
            mpesaTransactionId: responseData.MpesaReceiptNumber,
          },
        });

        return NextResponse.json({
          success: true,
          data: {
            order: { ...order, paymentStatus: 'COMPLETED', mpesaTransactionId: responseData.MpesaReceiptNumber },
            paymentStatus: 'COMPLETED',
            mpesaReceiptNumber: responseData.MpesaReceiptNumber,
          },
        });
      } else {
        // Payment failed
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'FAILED',
            status: 'CANCELLED',
          },
        });

        return NextResponse.json({
          success: true,
          data: {
            order: { ...order, paymentStatus: 'FAILED' },
            paymentStatus: 'FAILED',
            resultCode,
            resultDesc: responseData.ResultDesc,
          },
        });
      }
    } else {
      return NextResponse.json(
        { success: false, error: responseData.ResponseDescription || 'Failed to check payment status' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error checking M-Pesa payment status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}

