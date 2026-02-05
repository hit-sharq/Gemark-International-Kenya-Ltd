export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

// GET /api/cart - Get user's cart
export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            artListing: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              artListing: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: cart,
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

// POST /api/cart - Add item to cart
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { artListingId, quantity = 1 } = await req.json();

    if (!artListingId) {
      return NextResponse.json(
        { success: false, error: 'Art listing ID is required' },
        { status: 400 }
      );
    }

    // Check if art listing exists
    const artListing = await prisma.artListing.findUnique({
      where: { id: artListingId },
    });

    if (!artListing) {
      return NextResponse.json(
        { success: false, error: 'Art listing not found' },
        { status: 404 }
      );
    }

    // Find or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_artListingId: {
          cartId: cart.id,
          artListingId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: {
          artListing: true,
        },
      });

      return NextResponse.json({
        success: true,
        data: updatedItem,
        message: 'Cart item quantity updated',
      });
    }

    // Add new item
    const newItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        artListingId,
        quantity,
      },
      include: {
        artListing: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: newItem,
      message: 'Item added to cart',
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

// PUT /api/cart - Update cart item quantity
export async function PUT(req: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { cartItemId, quantity } = await req.json();

    if (!cartItemId || quantity === undefined) {
      return NextResponse.json(
        { success: false, error: 'Cart item ID and quantity are required' },
        { status: 400 }
      );
    }

    // Find user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return NextResponse.json(
        { success: false, error: 'Cart not found' },
        { status: 404 }
      );
    }

    // Find cart item
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
    });

    if (!cartItem || cartItem.cartId !== cart.id) {
      return NextResponse.json(
        { success: false, error: 'Cart item not found' },
        { status: 404 }
      );
    }

    if (quantity <= 0) {
      // Remove item
      await prisma.cartItem.delete({
        where: { id: cartItemId },
      });

      return NextResponse.json({
        success: true,
        message: 'Item removed from cart',
      });
    }

    // Update quantity
    const updatedItem = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
      include: {
        artListing: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedItem,
      message: 'Cart item updated',
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update cart' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart - Remove item from cart or clear cart
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const cartItemId = searchParams.get('cartItemId');
    const clearAll = searchParams.get('clearAll') === 'true';

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return NextResponse.json(
        { success: false, error: 'Cart not found' },
        { status: 404 }
      );
    }

    if (clearAll) {
      // Clear all items
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return NextResponse.json({
        success: true,
        message: 'Cart cleared',
      });
    }

    if (cartItemId) {
      // Remove specific item
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: cartItemId },
      });

      if (!cartItem || cartItem.cartId !== cart.id) {
        return NextResponse.json(
          { success: false, error: 'Cart item not found' },
          { status: 404 }
        );
      }

      await prisma.cartItem.delete({
        where: { id: cartItemId },
      });

      return NextResponse.json({
        success: true,
        message: 'Item removed from cart',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Cart item ID or clearAll flag required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error deleting from cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete from cart' },
      { status: 500 }
    );
  }
}

