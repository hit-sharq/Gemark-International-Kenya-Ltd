import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { auth } from "@clerk/nextjs/server"

// GET - Fetch current artisan's products
export async function GET(request: NextRequest) {
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

    const products = await prisma.artListing.findMany({
      where: { artisanId: artisan.id },
      include: {
        category: {
          select: { name: true },
        },
        _count: {
          select: { orderRequests: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    )
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
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
        { error: "Only approved artisans can add products" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      price,
      categoryId,
      material,
      region,
      size,
      images,
    } = body

    // Validation
    if (!title || !description || !price || !categoryId || !region || !size) {
      return NextResponse.json(
        { error: "Please fill in all required fields" },
        { status: 400 }
      )
    }

    if (typeof price !== "number" || price <= 0) {
      return NextResponse.json(
        { error: "Price must be a positive number" },
        { status: 400 }
      )
    }

    const product = await prisma.artListing.create({
      data: {
        title,
        description,
        price,
        categoryId,
        material,
        region,
        size,
        images: images || [],
        artisanId: artisan.id,
      },
      include: {
        category: {
          select: { name: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: "Product created successfully",
      product,
    })
  } catch (error: any) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    )
  }
}

