import { NextRequest, NextResponse } from 'next/server';
import { 
  calculateShipping, 
  calculateTotalWeight,
  getShippingOptions,
  type CartItemWithWeight 
} from '@/lib/shipping-calculator';

interface ShippingRequestBody {
  countryCode: string;
  items?: CartItemWithWeight[];
  weight?: number;
  subtotal?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: ShippingRequestBody = await request.json();
    const { countryCode, items, weight, subtotal = 0 } = body;
    
    if (!countryCode) {
      return NextResponse.json(
        { error: 'Country code is required' },
        { status: 400 }
      );
    }
    
    const totalWeight = items 
      ? calculateTotalWeight(items, 0.5) 
      : (weight || 0.5);
    
    const shipping = calculateShipping({
      weight: totalWeight,
      countryCode,
      subtotal,
    });
    
    const options = getShippingOptions(countryCode, subtotal).map(option => ({
      ...option,
      weight: totalWeight,
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        weight: totalWeight,
        mainShipping: shipping,
        options,
        currency: shipping.currency,
      },
    });
  } catch (error) {
    console.error('Shipping calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate shipping' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const countryCode = searchParams.get('country');
  const subtotal = parseFloat(searchParams.get('subtotal') || '0');
  const weight = parseFloat(searchParams.get('weight') || '0.5');
  
  if (!countryCode) {
    return NextResponse.json(
      { error: 'Country code is required' },
      { status: 400 }
    );
  }
  
  const shipping = calculateShipping({
    weight,
    countryCode,
    subtotal,
  });
  
  return NextResponse.json({
    success: true,
    data: shipping,
  });
}

