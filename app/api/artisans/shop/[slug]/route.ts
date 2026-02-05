import { NextResponse } from "next/server"
import { prisma } from "lib/prisma"

// Get shop by slug (public route)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const artisan = await prisma.artisan.findFirst({
      where: {
        shopSlug: slug,
        status: "APPROVED", // Only show approved artisans
      },
      include: {
        artListings: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { artListings: true },
        },
      },
    })

    if (!artisan) {
      return NextResponse.json(
        { error: "Shop not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(artisan)
  } catch (error) {
    console.error("Error fetching shop:", error)
    return NextResponse.json(
      { error: "Failed to fetch shop" },
      { status: 500 }
    )
  }
}

