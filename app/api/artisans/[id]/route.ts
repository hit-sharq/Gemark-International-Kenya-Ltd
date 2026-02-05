import { NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { isAdmin } from "lib/auth"

// Get artisan by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const artisan = await prisma.artisan.findUnique({
      where: { id },
      include: {
        artListings: {
          take: 20,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { artListings: true },
        },
      },
    })

    if (!artisan) {
      return NextResponse.json(
        { error: "Artisan not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(artisan)
  } catch (error) {
    console.error("Error fetching artisan:", error)
    return NextResponse.json(
      { error: "Failed to fetch artisan" },
      { status: 500 }
    )
  }
}

// Update artisan (for admin or the artisan themselves)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      shopName,
      shopBio,
      shopLogo,
      shopBanner,
      website,
      instagram,
      facebook,
      whatsapp,
      isVerified,
    } = body

    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if user is admin or the artisan themselves
    const artisan = await prisma.artisan.findUnique({
      where: { id },
    })

    if (!artisan) {
      return NextResponse.json(
        { error: "Artisan not found" },
        { status: 404 }
      )
    }

    const adminCheck = await isAdmin(userId)
    const isOwner = artisan.clerkId === userId

    if (!adminCheck && !isOwner) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Generate new shop slug if shop name changed
    let shopSlug = artisan.shopSlug
    if (shopName && shopName !== artisan.shopName) {
      const baseSlug = shopName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
      shopSlug = `${baseSlug}-${id.slice(-6)}`
    }

    const updatedArtisan = await prisma.artisan.update({
      where: { id },
      data: {
        shopName: shopName || artisan.shopName,
        shopSlug,
        shopBio: shopBio !== undefined ? shopBio : artisan.shopBio,
        shopLogo: shopLogo !== undefined ? shopLogo : artisan.shopLogo,
        shopBanner: shopBanner !== undefined ? shopBanner : artisan.shopBanner,
        website: website !== undefined ? website : artisan.website,
        instagram: instagram !== undefined ? instagram : artisan.instagram,
        facebook: facebook !== undefined ? facebook : artisan.facebook,
        whatsapp: whatsapp !== undefined ? whatsapp : artisan.whatsapp,
        isVerified: isVerified !== undefined ? isVerified : artisan.isVerified,
      },
    })

    return NextResponse.json(updatedArtisan)
  } catch (error) {
    console.error("Error updating artisan:", error)
    return NextResponse.json(
      { error: "Failed to update artisan" },
      { status: 500 }
    )
  }
}

// Delete artisan (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if user is admin
    const adminCheck = await isAdmin(userId)
    if (!adminCheck) {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      )
    }

    // Delete artisan (cascade will handle related records if configured)
    await prisma.artisan.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: "Artisan deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting artisan:", error)
    return NextResponse.json(
      { error: "Failed to delete artisan" },
      { status: 500 }
    )
  }
}

