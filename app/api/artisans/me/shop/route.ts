export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { auth } from "@clerk/nextjs/server"

// GET - Fetch current artisan's shop data
export async function GET(request: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // First try by clerkId
    let artisan = await prisma.artisan.findFirst({
      where: { clerkId: userId },
      select: {
        shopName: true,
        shopSlug: true,
        shopBio: true,
        shopLogo: true,
        shopBanner: true,
        website: true,
        instagram: true,
        facebook: true,
        whatsapp: true,
        status: true,
        fullName: true,
      },
    })

    // If not found, try by email and link clerkId
    if (!artisan) {
      const email = sessionClaims?.email as string | undefined
      const primaryEmail = sessionClaims?.primary_email as string | undefined
      const artisanEmail = email || primaryEmail

      if (artisanEmail) {
        artisan = await prisma.artisan.findFirst({
          where: { email: artisanEmail.toLowerCase() },
          select: {
            shopName: true,
            shopSlug: true,
            shopBio: true,
            shopLogo: true,
            shopBanner: true,
            website: true,
            instagram: true,
            facebook: true,
            whatsapp: true,
            status: true,
            fullName: true,
          },
        })

        if (artisan) {
          // Link clerkId
          await prisma.artisan.updateMany({
            where: { email: artisanEmail.toLowerCase() },
            data: { clerkId: userId },
          })
        }
      }
    }

    if (!artisan) {
      return NextResponse.json({ error: "Artisan not found" }, { status: 404 })
    }

    return NextResponse.json(artisan)
  } catch (error) {
    console.error("Error fetching shop:", error)
    return NextResponse.json(
      { error: "Failed to fetch shop details" },
      { status: 500 }
    )
  }
}

// PUT - Update current artisan's shop data
export async function PUT(request: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // First try by clerkId
    let artisan = await prisma.artisan.findFirst({
      where: { clerkId: userId },
    })

    // If not found, try by email and link clerkId
    if (!artisan) {
      const email = sessionClaims?.email as string | undefined
      const primaryEmail = sessionClaims?.primary_email as string | undefined
      const artisanEmail = email || primaryEmail

      if (artisanEmail) {
        artisan = await prisma.artisan.findFirst({
          where: { email: artisanEmail.toLowerCase() },
        })

        if (artisan) {
          // Link clerkId
          await prisma.artisan.updateMany({
            where: { email: artisanEmail.toLowerCase() },
            data: { clerkId: userId },
          })
        }
      }
    }

    if (!artisan) {
      return NextResponse.json({ error: "Artisan not found" }, { status: 404 })
    }

    if (artisan.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Only approved artisans can update shop details" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { shopName, shopBio, shopLogo, shopBanner, website, instagram, facebook, whatsapp } = body

    // Generate shop slug from shop name
    let shopSlug = artisan.shopSlug
    if (shopName && shopName !== artisan.shopName) {
      shopSlug = shopName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    }

    const updatedArtisan = await prisma.artisan.update({
      where: { id: artisan.id },
      data: {
        shopName,
        shopSlug,
        shopBio,
        shopLogo,
        shopBanner,
        website,
        instagram,
        facebook,
        whatsapp,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Shop updated successfully",
      shopName: updatedArtisan.shopName,
      shopSlug: updatedArtisan.shopSlug,
      shopBio: updatedArtisan.shopBio,
      shopLogo: updatedArtisan.shopLogo,
      shopBanner: updatedArtisan.shopBanner,
      website: updatedArtisan.website,
      instagram: updatedArtisan.instagram,
      facebook: updatedArtisan.facebook,
      whatsapp: updatedArtisan.whatsapp,
    })
  } catch (error: any) {
    console.error("Shop update error:", error)

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Shop name already exists. Please choose a different name." },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update shop details" },
      { status: 500 }
    )
  }
}

