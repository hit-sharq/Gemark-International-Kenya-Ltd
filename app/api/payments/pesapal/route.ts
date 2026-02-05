// PesaPal Payment API Route - v3 REST API
// Redone with improved architecture, error handling, and maintainability

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// ============================================
// Configuration
// ============================================

interface PesaPalConfig {
  environment: 'sandbox' | 'live';
  baseUrl: string;
  consumerKey: string;
  consumerSecret: string;
  appUrl: string;
}

function getConfig(): PesaPalConfig {
  const environment = (process.env.PESAPAL_ENVIRONMENT === 'live' ? 'live' : 'sandbox') as 'sandbox' | 'live';
  const baseUrl = environment === 'sandbox'
    ? 'https://cybqa.pesapal.com/pesapalv3/api'
    : 'https://pay.pesapal.com/v3/api';

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const cleanAppUrl = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;

  return {
    environment,
    baseUrl,
    consumerKey: process.env.PESAPAL_CONSUMER_KEY || '',
    consumerSecret: process.env.PESAPAL_CONSUMER_SECRET || '',
    appUrl: cleanAppUrl,
  };
}

// Exchange rate: USD to KES (adjust as needed)
const USD_TO_KES_RATE = 130;

function convertUsdToKes(usdAmount: number): number {
  return Math.round(usdAmount * USD_TO_KES_RATE);
}

// ============================================
// Token Management
// ============================================

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

async function getAccessToken(config: PesaPalConfig): Promise<{ success: boolean; token?: string; error?: string }> {
  // Check cache first
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return { success: true, token: tokenCache.token };
  }

  if (!config.consumerKey || !config.consumerSecret) {
    return { success: false, error: 'PesaPal credentials not configured' };
  }

  try {
    console.log(`[PesaPal] Requesting new access token from ${config.baseUrl}...`);
    
    const response = await fetch(`${config.baseUrl}/Auth/RequestToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        consumer_key: config.consumerKey,
        consumer_secret: config.consumerSecret,
      }),
    });

    const text = await response.text();

    if (!response.ok) {
      console.error('[PesaPal] Token request failed:', text);
      return { success: false, error: `Token request failed: ${response.status}` };
    }

    let data: { token?: string };
    try {
      data = JSON.parse(text);
    } catch {
      return { success: false, error: 'Invalid JSON in token response' };
    }

    if (!data.token) {
      return { success: false, error: 'No token in PesaPal response' };
    }

    // Cache token for 55 minutes (tokens expire in 1 hour)
    tokenCache = {
      token: data.token,
      expiresAt: Date.now() + 55 * 60 * 1000,
    };

    console.log('[PesaPal] Access token obtained successfully');
    return { success: true, token: data.token };

  } catch (error: any) {
    console.error('[PesaPal] Network error getting token:', error.message);
    return { success: false, error: `Network error: ${error.message}` };
  }
}

// ============================================
// IPN Management
// ============================================

interface IpnsCache {
  ipnId: string;
  expiresAt: number;
}

let ipnIdCache: IpnsCache | null = null;

async function getIpnId(config: PesaPalConfig, token: string): Promise<{ success: boolean; ipnId?: string; error?: string }> {
  const now = Date.now();
  const cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  if (ipnIdCache && ipnIdCache.expiresAt > now) {
    return { success: true, ipnId: ipnIdCache.ipnId };
  }

  const ipnUrl = `${config.appUrl}/api/pesapal/ipn`;

  try {
    // First, check if IPN URL is already registered
    console.log('[PesaPal] Checking for existing IPN registration...');
    
    const listResponse = await fetch(`${config.baseUrl}/URLSetup/GetIPNList`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (listResponse.ok) {
      const text = await listResponse.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = {};
      }

      // Handle different response formats
      const ipns = data.ipn_list || data.ipns || data || [];
      
      const existing = ipns.find((ipn: any) => 
        ipn.url === ipnUrl || 
        ipn.url === ipnUrl + '/' ||
        ipn.url === ipnUrl.replace('http://', 'https://')
      );

      if (existing?.ipn_id) {
        console.log('[PesaPal] Found existing IPN:', existing.ipn_id);
        ipnIdCache = { ipnId: existing.ipn_id, expiresAt: now + cacheExpiry };
        return { success: true, ipnId: existing.ipn_id };
      }
    }

    // Register new IPN
    console.log('[PesaPal] Registering new IPN URL:', ipnUrl);
    
    const registerResponse = await fetch(`${config.baseUrl}/URLSetup/RegisterIPN`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        url: ipnUrl,
        ipn_notification_type: 'POST',
        ipn_trigger: 'POST',
      }),
    });

    const registerText = await registerResponse.text();

    if (!registerResponse.ok) {
      console.error('[PesaPal] IPN registration failed:', registerText);
      
      // Check for duplicate
      if (registerText.toLowerCase().includes('duplicate')) {
        // Try to get existing from list
        const listResult = await getExistingIpns(config, token);
        if (listResult.success && listResult.ipnId) {
          return { success: true, ipnId: listResult.ipnId };
        }
      }
      
      return { success: false, error: 'Failed to register IPN URL' };
    }

    let registerData: { ipn_id?: string };
    try {
      registerData = JSON.parse(registerText);
    } catch {
      return { success: false, error: 'Invalid IPN registration response' };
    }

    if (!registerData.ipn_id) {
      return { success: false, error: 'No IPN ID in registration response' };
    }

    ipnIdCache = { ipnId: registerData.ipn_id, expiresAt: now + cacheExpiry };
    console.log('[PesaPal] IPN registered:', registerData.ipn_id);
    return { success: true, ipnId: registerData.ipn_id };

  } catch (error: any) {
    console.error('[PesaPal] IPN error:', error.message);
    return { success: false, error: `IPN error: ${error.message}` };
  }
}

async function getExistingIpns(config: PesaPalConfig, token: string): Promise<{ success: boolean; ipnId?: string }> {
  try {
    const response = await fetch(`${config.baseUrl}/URLSetup/GetIPNList`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { success: false };
    }

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return { success: false };
    }

    const ipns = data.ipn_list || data.ipns || data || [];
    const ipnUrl = `${config.appUrl}/api/pesapal/ipn`;
    
    const existing = ipns.find((ipn: any) => 
      ipn.url === ipnUrl || 
      ipn.url === ipnUrl + '/'
    );

    if (existing?.ipn_id) {
      return { success: true, ipnId: existing.ipn_id };
    }

    return { success: false };
  } catch {
    return { success: false };
  }
}

// ============================================
// Utility Functions
// ============================================

function round2(num: number): number {
  return Math.round(num * 100) / 100;
}

function sanitizeOrderId(id: string): string {
  return id.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50);
}

function getPesaPalChannel(method: string): string {
  const m = method.toLowerCase();
  if (m === 'mpesa') return 'MPESA';
  if (m === 'card') return 'CREDITCARD';
  if (m === 'bank') return 'BANK';
  return 'ALL';
}

function getCurrency(method?: string): string {
  // Use KES for M-Pesa payments
  return method?.toLowerCase() === 'mpesa' ? 'KES' : 'USD';
}

function mapPaymentStatus(status: string): string {
  const s = status?.toUpperCase();
  if (s === 'COMPLETED' || s === 'PAID') return 'COMPLETED';
  if (s === 'PENDING' || s === 'PROCESSING') return 'PROCESSING';
  if (s === 'FAILED' || s === 'INVALID') return 'FAILED';
  if (s === 'REFUNDED') return 'REFUNDED';
  return 'PENDING';
}

// ============================================
// Order Submission
// ============================================

interface OrderSubmissionParams {
  orderId: string;
  currency: string;
  amount: number;
  description: string;
  callbackUrl: string;
  notificationId: string;
  paymentMethod?: string;
  billingAddress?: {
    emailAddress: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    countryCode?: string;
  };
  lineItems: Array<{ name: string; price: number; quantity: number }>;
}

async function submitOrder(
  config: PesaPalConfig,
  token: string,
  params: OrderSubmissionParams
): Promise<{ success: boolean; redirectUrl?: string; orderTrackingId?: string; error?: string }> {
  const channel = params.paymentMethod ? getPesaPalChannel(params.paymentMethod) : 'ALL';
  const currency = params.currency || 'USD';

  // Convert USD to KES if needed (M-Pesa payments)
  let convertedAmount: number;
  if (currency === 'KES') {
    // Convert from USD to KES
    convertedAmount = convertUsdToKes(params.amount);
  } else {
    // Use USD amount as-is
    convertedAmount = round2(params.amount);
  }

  console.log('[PesaPal] Submitting order:', {
    orderId: params.orderId,
    amount: convertedAmount,
    currency,
    channel,
    items: params.lineItems.length,
  });

  const payload: any = {
    id: params.orderId,
    currency,
    amount: convertedAmount,
    description: String(params.description).substring(0, 100),
    callback_url: params.callbackUrl,
    notification_id: params.notificationId,
    billing_address: {
      email_address: params.billingAddress?.emailAddress,
      first_name: params.billingAddress?.firstName,
      last_name: params.billingAddress?.lastName,
      phone_number: params.billingAddress?.phoneNumber,
      country_code: params.billingAddress?.countryCode || 'US',
    }
  };

  // Add line items if present in v3 schema
  if (params.lineItems && params.lineItems.length > 0) {
    payload.line_items = params.lineItems.map(item => ({
      name: String(item.name).substring(0, 100),
      unit_cost: round2(Number(item.price)),
      quantity: Math.max(1, Number(item.quantity)),
      details: String(item.name).substring(0, 100),
      sub_total: round2(Number(item.price) * Math.max(1, Number(item.quantity)))
    }));
  }

  try {
    const response = await fetch(`${config.baseUrl}/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();

    if (!response.ok) {
      console.error('[PesaPal] Submit order failed:', text);
      let errorMsg = 'Order submission failed';
      
      try {
        const errorData = JSON.parse(text);
        errorMsg = errorData.error_description || errorData.message || errorData.error || errorMsg;
      } catch {
        errorMsg = text.substring(0, 300);
      }
      
      return { success: false, error: errorMsg };
    }

    let data: { redirect_url?: string; order_tracking_id?: string };
    try {
      data = JSON.parse(text);
    } catch {
      return { success: false, error: 'Invalid JSON in response' };
    }

    if (!data.redirect_url || !data.order_tracking_id) {
      console.error('[PesaPal] Missing redirect URL or tracking ID:', data);
      return { success: false, error: 'Invalid response from PesaPal' };
    }

    console.log('[PesaPal] Order submitted:', data.order_tracking_id);
    return {
      success: true,
      redirectUrl: data.redirect_url,
      orderTrackingId: data.order_tracking_id,
    };

  } catch (error: any) {
    console.error('[PesaPal] Network error:', error.message);
    return { success: false, error: `Network error: ${error.message}` };
  }
}

// ============================================
// Validation Functions
// ============================================

function validateCartItem(item: any): { valid: boolean; data?: any; error?: string } {
  const id = item.artListingId || item.id;
  const price = item.price ?? item.artListing?.price;
  const quantity = item.quantity;

  if (!id) {
    return { valid: false, error: 'Cart item missing ID' };
  }

  if (quantity === undefined || quantity < 1) {
    return { valid: false, error: `Invalid quantity for item ${id}` };
  }

  if (price === undefined || price < 0) {
    return { valid: false, error: `Invalid price for item ${id}` };
  }

  return {
    valid: true,
    data: {
      artListingId: id,
      title: item.title || item.artListing?.title || 'Artwork',
      price: Number(price),
      quantity: Number(quantity),
    },
  };
}

function validateShippingInfo(shippingInfo: any): { valid: boolean; data?: any; error?: string } {
  if (!shippingInfo) {
    return { valid: false, error: 'Shipping information is required' };
  }

  const errors: string[] = [];
  
  if (!shippingInfo.name || shippingInfo.name.trim().length < 2) {
    errors.push('Valid name is required');
  }
  
  if (!shippingInfo.email || !shippingInfo.email.includes('@')) {
    errors.push('Valid email is required');
  }
  
  if (!shippingInfo.address || shippingInfo.address.trim().length < 5) {
    errors.push('Valid address is required');
  }
  
  if (!shippingInfo.city || shippingInfo.city.trim().length < 2) {
    errors.push('Valid city is required');
  }
  
  if (!shippingInfo.country || shippingInfo.country.trim().length < 2) {
    errors.push('Valid country is required');
  }

  if (errors.length > 0) {
    return { valid: false, error: errors.join('; ') };
  }

  return {
    valid: true,
    data: {
      name: shippingInfo.name.trim(),
      email: shippingInfo.email.trim().toLowerCase(),
      address: shippingInfo.address.trim(),
      city: shippingInfo.city.trim(),
      country: shippingInfo.country.trim(),
      phone: shippingInfo.phone || '',
    },
  };
}

// ============================================
// Main Handler
// ============================================

// POST /api/payments/pesapal
export async function POST(req: NextRequest) {
  console.log('\n========== [PesaPal] New Order Request ==========');
  
  try {
    // 1. Authentication
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult.userId ?? null;
      console.log('[PesaPal] User:', userId || 'Guest');
    } catch (authError: any) {
      console.log('[PesaPal] Auth:', authError?.message || 'Proceeding without auth');
    }

    // 2. Configuration
    const config = getConfig();
    const isConfigured = !!(config.consumerKey && config.consumerSecret);
    console.log('[PesaPal] Environment:', config.environment);
    console.log('[PesaPal] Configured:', isConfigured);

    // 3. Parse Request Body
    let body: any;
    try {
      const text = await req.text();
      body = JSON.parse(text);
    } catch (e: any) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { cartItems, shippingInfo, phoneNumber, paymentMethod } = body;

    // 4. Validate Cart
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart is empty or invalid' },
        { status: 400 }
      );
    }

    console.log('[PesaPal] Cart items:', cartItems.length);

    // 5. Validate Cart Items
    const validatedItems: any[] = [];
    for (let i = 0; i < cartItems.length; i++) {
      const validation = validateCartItem(cartItems[i]);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: `Cart item ${i + 1}: ${validation.error}` },
          { status: 400 }
        );
      }
      validatedItems.push(validation.data);
    }

    // 6. Validate Shipping Info
    const shippingValidation = validateShippingInfo(shippingInfo);
    if (!shippingValidation.valid) {
      return NextResponse.json(
        { success: false, error: shippingValidation.error },
        { status: 400 }
      );
    }

    // 7. Calculate Totals
    const subtotal = validatedItems.reduce((sum, item) => sum + round2(item.price * item.quantity), 0);
    const shippingCost = round2(25); // Fixed shipping cost
    const tax = round2(subtotal * 0.08);
    const total = round2(subtotal + shippingCost + tax);

    console.log('[PesaPal] Totals:', { subtotal, shippingCost, tax, total });

    // 8. Create Order in Database
    let order: any = null;
    if (userId) {
      try {
        let user = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user) {
          user = await prisma.user.create({ data: { clerkId: userId } });
        }

        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        order = await prisma.order.create({
          data: {
            userId: user.id,
            orderNumber,
            subtotal,
            shippingCost,
            tax,
            total,
            shippingName: shippingValidation.data.name,
            shippingEmail: shippingValidation.data.email,
            shippingPhone: phoneNumber || shippingInfo?.phone || '',
            shippingAddress: shippingValidation.data.address,
            shippingCity: shippingValidation.data.city,
            shippingCountry: shippingValidation.data.country,
            paymentMethod: 'pesapal',
            items: {
              create: validatedItems.map(item => ({
                artListingId: item.artListingId,
                title: item.title,
                price: item.price,
                quantity: item.quantity,
              })),
            },
          },
        });
        console.log('[PesaPal] Order created:', order.id);

      } catch (dbError: any) {
        console.error('[PesaPal] Database error:', dbError.code, dbError.message);
        
        if (dbError.code === 'P2021') {
          return NextResponse.json(
            { success: false, error: 'Database tables not created. Please run: npx prisma db push' },
            { status: 500 }
          );
        }
        
        if (dbError.code === 'P2002') {
          return NextResponse.json(
            { success: false, error: 'Duplicate order. Please try again.' },
            { status: 500 }
          );
        }
        
        return NextResponse.json(
          { success: false, error: 'Database error creating order' },
          { status: 500 }
        );
      }
    }

    // 9. Development Mode (no credentials)
    if (!isConfigured) {
      console.log('[PesaPal] Running in development mode');
      return NextResponse.json({
        success: true,
        data: {
          orderId: order?.id || `dev-${Date.now()}`,
          orderNumber: order?.orderNumber || `DEV-${Date.now()}`,
          paymentMethod: 'pesapal',
          isDevelopment: true,
        },
      });
    }

    // 10. Get Access Token
    console.log('[PesaPal] Getting access token...');
    const tokenResult = await getAccessToken(config);
    if (!tokenResult.success || !tokenResult.token) {
      return NextResponse.json(
        { success: false, error: tokenResult.error || 'Failed to get access token' },
        { status: 500 }
      );
    }

    // 11. Get IPN ID
    console.log('[PesaPal] Getting IPN ID...');
    const ipnResult = await getIpnId(config, tokenResult.token);
    if (!ipnResult.success) {
      return NextResponse.json(
        { success: false, error: ipnResult.error || 'Failed to get IPN ID' },
        { status: 500 }
      );
    }

    // 12. Build Line Items
    const lineItems: Array<{ name: string; price: number; quantity: number }> = validatedItems.map(item => ({
      name: (item.title || 'Artwork').substring(0, 100),
      price: round2(Number(item.price)),
      quantity: Math.max(1, Number(item.quantity)),
    }));

    // Add shipping and tax as line items
    lineItems.push({ name: 'Shipping', price: round2(shippingCost), quantity: 1 });
    if (tax > 0) {
      lineItems.push({ name: 'Tax', price: round2(tax), quantity: 1 });
    }

    // 13. Build Callback URL
    const orderId = order?.id || `dev_${Date.now()}`;
    const callbackUrl = `${config.appUrl}/checkout/success?orderId=${orderId}&method=pesapal`;
    console.log('[PesaPal] Callback URL:', callbackUrl);

    // 14. Parse Customer Name
    const nameParts = shippingValidation.data.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // 15. Submit Order to PesaPal
    console.log('[PesaPal] Submitting order to PesaPal...');
    const notificationId = ipnResult.ipnId;
    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'Failed to get IPN ID' },
        { status: 500 }
      );
    }
    
    const accessToken = tokenResult.token;
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Failed to get access token' },
        { status: 500 }
      );
    }
    
    const submitResult = await submitOrder(config, accessToken, {
      orderId: order?.id || `order_${Date.now()}`,
      currency: 'USD',
      amount: total,
      description: `ArtAfrik Order - ${validatedItems.length} item(s)`,
      callbackUrl,
      notificationId,
      paymentMethod,
      billingAddress: {
        emailAddress: shippingValidation.data.email,
        firstName,
        lastName,
        phoneNumber: phoneNumber || shippingInfo?.phone || '',
        countryCode: 'US',
      },
      lineItems,
    });

    if (!submitResult.success) {
      return NextResponse.json(
        { success: false, error: `PesaPal error: ${submitResult.error}` },
        { status: 500 }
      );
    }

    // 16. Update Order with Tracking ID
    if (order) {
      try {
        await prisma.order.update({
          where: { id: order.id },
          data: { pesapalOrderId: submitResult.orderTrackingId },
        });
      } catch (updateError) {
        console.error('[PesaPal] Failed to update order:', updateError);
      }
    }

    console.log('[PesaPal] Order submitted successfully!');
    console.log('========== [PesaPal] Request Complete ==========\n');

    return NextResponse.json({
      success: true,
      data: {
        orderId: order?.id || 'dev',
        orderNumber: order?.orderNumber || 'DEV',
        paymentMethod: 'pesapal',
        pesapalOrderId: submitResult.orderTrackingId,
        redirectUrl: submitResult.redirectUrl,
      },
    });

  } catch (error: any) {
    console.error('[PesaPal] Unexpected error:', error.message, error.stack);
    return NextResponse.json(
      { success: false, error: `An unexpected error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}

// GET /api/payments/pesapal
export async function GET(req: NextRequest) {
  console.log('\n========== [PesaPal] Status Check ==========');
  
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const trackingId = searchParams.get('trackingId');

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, shipment: true },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const config = getConfig();
    const isConfigured = !!config.consumerKey;

    if (!isConfigured || !trackingId) {
      return NextResponse.json({
        success: true,
        data: { order, paymentStatus: order.paymentStatus, isDevelopment: true },
      });
    }

    const tokenResult = await getAccessToken(config);
    if (!tokenResult.success || !tokenResult.token) {
      return NextResponse.json({ success: false, error: 'Failed to get token' }, { status: 500 });
    }

    const response = await fetch(
      `${config.baseUrl}/Transactions/GetTransactionStatus?orderTrackingId=${trackingId}`,
      {
        headers: { 'Authorization': `Bearer ${tokenResult.token}` },
      }
    );

    const text = await response.text();
    let data: { payment_status?: string };
    try {
      data = JSON.parse(text);
    } catch {
      data = { payment_status: 'UNKNOWN' };
    }

    const paymentStatus = mapPaymentStatus(data.payment_status || '');
    const updateData: any = { paymentStatus };

    if (paymentStatus === 'COMPLETED') updateData.status = 'CONFIRMED';
    if (paymentStatus === 'FAILED') updateData.status = 'CANCELLED';

    if (paymentStatus !== order.paymentStatus) {
      await prisma.order.update({ where: { id: order.id }, data: updateData });
    }

    console.log('========== [PesaPal] Status Check Complete ==========\n');

    return NextResponse.json({
      success: true,
      data: {
        order: { ...order, ...updateData },
        paymentStatus,
        pesapalStatus: data.payment_status,
      },
    });

  } catch (error: any) {
    console.error('[PesaPal] Status check error:', error.message);
    return NextResponse.json({ success: false, error: 'Failed to check status' }, { status: 500 });
  }
}

