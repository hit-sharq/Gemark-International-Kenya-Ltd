export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

// GET /api/wishlist - Get user's wishlist
export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find or create wishlist
    let wishlist = await prisma.wishlist.findUnique({
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

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
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
      data: wishlist,
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
}

// POST /api/wishlist - Add item to wishlist
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { artListingId } = await req.json();

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

    // Find or create wishlist
    let wishlist = await prisma.wishlist.findUnique({
      where: { userId },
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: { userId },
      });
    }

    // Check if item already in wishlist
    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_artListingId: {
          wishlistId: wishlist.id,
          artListingId,
        },
      },
    });

    if (existingItem) {
      return NextResponse.json(
        { success: false, error: 'Item already in wishlist' },
        { status: 400 }
      );
    }

    // Add new item
    const newItem = await prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        artListingId,
      },
      include: {
        artListing: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: newItem,
      message: 'Item added to wishlist',
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add item to wishlist' },
      { status: 500 }
    );
  }
}

// DELETE /api/wishlist - Remove item from wishlist or clear wishlist
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
    const artListingId = searchParams.get('artListingId');
    const clearAll = searchParams.get('clearAll') === 'true';

    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
    });

    if (!wishlist) {
      return NextResponse.json(
        { success: false, error: 'Wishlist not found' },
        { status: 404 }
      );
    }

    if (clearAll) {
      // Clear all items
      await prisma.wishlistItem.deleteMany({
        where: { wishlistId: wishlist.id },
      });

      return NextResponse.json({
        success: true,
        message: 'Wishlist cleared',
      });
    }

    if (artListingId) {
      // Remove specific item
      const wishlistItem = await prisma.wishlistItem.findUnique({
        where: {
          wishlistId_artListingId: {
            wishlistId: wishlist.id,
            artListingId,
          },
        },
      });

      if (!wishlistItem) {
        return NextResponse.json(
          { success: false, error: 'Item not found in wishlist' },
          { status: 404 }
        );
      }

      await prisma.wishlistItem.delete({
        where: { id: wishlistItem.id },
      });

      return NextResponse.json({
        success: true,
        message: 'Item removed from wishlist',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Art listing ID or clearAll flag required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error deleting from wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete from wishlist' },
      { status: 500 }
    );
  }
}

