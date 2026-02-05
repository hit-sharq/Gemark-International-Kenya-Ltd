import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

// GET /api/reviews - Get reviews for an artwork
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const artListingId = searchParams.get('artListingId');

    if (!artListingId) {
      return NextResponse.json(
        { success: false, error: 'Art listing ID is required' },
        { status: 400 }
      );
    }

    const reviews = await prisma.review.findMany({
      where: {
        artListingId,
        isApproved: true,
      },
      include: {
        user: {
          select: {
            clerkId: true,
          },
        },
        replies: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate average rating
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    // Calculate rating distribution
    const ratingDistribution = {
      1: reviews.filter(r => r.rating === 1).length,
      2: reviews.filter(r => r.rating === 2).length,
      3: reviews.filter(r => r.rating === 3).length,
      4: reviews.filter(r => r.rating === 4).length,
      5: reviews.filter(r => r.rating === 5).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        stats: {
          averageRating,
          totalReviews,
          ratingDistribution,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Create a new review
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { artListingId, rating, title, content } = await req.json();

    if (!artListingId || !rating || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
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

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { clerkId: userId },
      });
    }

    // Check if user already reviewed this artwork
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_artListingId: {
          userId: user.id,
          artListingId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'You have already reviewed this artwork' },
        { status: 400 }
      );
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        userId: user.id,
        artListingId,
        rating,
        title,
        content,
      },
    });

    return NextResponse.json({
      success: true,
      data: review,
      message: 'Review submitted successfully',
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create review' },
      { status: 500 }
    );
  }
}

