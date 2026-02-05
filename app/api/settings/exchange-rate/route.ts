import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET /api/settings/exchange-rate - Get current exchange rate
export async function GET(req: NextRequest) {
  try {
    // Get the current active exchange rate
    const exchangeRate = await prisma.exchangeRate.findFirst({
      where: {
        currency: 'USD_KES',
        isActive: true,
      },
    });

    if (!exchangeRate) {
      // Return default rate if none exists in database
      return NextResponse.json({
        success: true,
        data: {
          rate: 130.00, // Default fallback rate
          source: 'default',
          lastUpdated: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: exchangeRate.id,
        rate: exchangeRate.rate,
        source: exchangeRate.source,
        lastUpdated: exchangeRate.updatedAt,
        currency: exchangeRate.currency,
      },
    });
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exchange rate' },
      { status: 500 }
    );
  }
}

// PUT /api/settings/exchange-rate - Update exchange rate (admin only)
export async function PUT(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { rate, source } = body;

    // Validate rate
    if (rate === undefined || rate === null || typeof rate !== 'number' || rate <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid exchange rate is required' },
        { status: 400 }
      );
    }

    // Validate source
    const validSources = ['manual', 'api', 'bank', 'central_bank'];
    const rateSource = source && validSources.includes(source) ? source : 'manual';

    // Update or create the exchange rate
    // First, deactivate any existing active rate for USD_KES
    await prisma.exchangeRate.updateMany({
      where: {
        currency: 'USD_KES',
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Create new active exchange rate
    const exchangeRate = await prisma.exchangeRate.create({
      data: {
        currency: 'USD_KES',
        rate: Number(rate),
        source: rateSource,
        isActive: true,
        updatedBy: userId,
      },
    });

    console.log(`[ExchangeRate] Admin ${userId} updated USD_KES rate to ${rate}`);

    return NextResponse.json({
      success: true,
      message: 'Exchange rate updated successfully',
      data: {
        id: exchangeRate.id,
        rate: exchangeRate.rate,
        source: exchangeRate.source,
        lastUpdated: exchangeRate.updatedAt,
        currency: exchangeRate.currency,
      },
    });
  } catch (error) {
    console.error('Error updating exchange rate:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update exchange rate' },
      { status: 500 }
    );
  }
}

