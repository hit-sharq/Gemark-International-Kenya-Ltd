import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

// Initialize Stripe only if key is available
const stripeKey = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe | null = null;

if (stripeKey) {
  stripe = new Stripe(stripeKey, {
    apiVersion: '2025-12-15.clover' as any,
  });
}

// POST /api/payments/create-intent - Create a payment intent
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { cartId, cartItems, shippingInfo, notes } = await req.json();

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

      subtotal = cart.items.reduce((sum: number, item: any) => {
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

    const shippingCost = subtotal > 500 ? 0 : 25;
    const tax = subtotal * 0.08;
    const total = subtotal + shippingCost + tax;

    // Get or create user using upsert to prevent race conditions
    let user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {},
      create: { clerkId: userId },
    });

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
        shippingPhone: shippingInfo?.phone,
        shippingAddress: shippingInfo?.address,
        shippingCity: shippingInfo?.city,
        shippingCountry: shippingInfo?.country,
        paymentMethod: 'stripe',
        notes,
        items: {
          create: cartItemsData.map((item) => ({
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

    // Check if Stripe is configured
    if (!stripe) {
      // Development mode - return mock payment intent
      console.log('⚠️ Stripe not configured. Running in development mode.');
      
      // Clear the cart after creating order (only if using database cart)
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
          clientSecret: `dev_mock_secret_${Date.now()}`,
          total: total,
          isDevelopment: true,
          message: 'Development mode: Payment processing simulated',
        },
      });
    }

    // Validate email for Stripe
    const receiptEmail = shippingInfo?.email;
    const isValidEmail = receiptEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(receiptEmail);

    if (!isValidEmail) {
      console.error('Invalid or missing email for Stripe payment:', receiptEmail);
      return NextResponse.json(
        { success: false, error: 'Valid email address is required for payment processing' },
        { status: 400 }
      );
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order.id,
        orderNumber,
        userId: user.id,
      },
      receipt_email: receiptEmail,
      shipping: shippingInfo
        ? {
            name: shippingInfo.name,
            phone: shippingInfo.phone,
            address: {
              line1: shippingInfo.address,
              city: shippingInfo.city,
              country: shippingInfo.country,
            },
          }
        : undefined,
    });

    // Update order with payment intent ID
    await prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: paymentIntent.id },
    });

    // Clear the cart after creating order (only if using database cart)
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
        clientSecret: paymentIntent.client_secret,
        total: total,
      },
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

// GET /api/payments/status - Get payment status
export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get order
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.id,
      },
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

    // Check payment status with Stripe if applicable
    let paymentStatus = order.paymentStatus;
    if (stripe && order.stripePaymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          order.stripePaymentIntentId
        );
        
        if (paymentIntent.status === 'succeeded' && order.paymentStatus !== 'COMPLETED') {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'COMPLETED',
              status: 'CONFIRMED',
            },
          });
          paymentStatus = 'COMPLETED';
        }
      } catch (stripeError) {
        console.error('Error checking Stripe payment:', stripeError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        paymentStatus,
      },
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment status' },
      { status: 500 }
    );
  }
}

