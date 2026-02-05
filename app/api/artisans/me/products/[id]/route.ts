import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { auth } from "@clerk/nextjs/server"

// Helper function to find artisan by clerkId or email
async function findArtisan(userId: string, sessionClaims: any) {
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

  return artisan
}

// GET - Fetch single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const artisan = await findArtisan(userId, sessionClaims)

    if (!artisan) {
      return NextResponse.json({ error: "Artisan not found" }, { status: 404 })
    }

    const product = await prisma.artListing.findFirst({
      where: {
        id,
        artisanId: artisan.id,
      },
      include: {
        category: {
          select: { name: true, id: true },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    )
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const artisan = await findArtisan(userId, sessionClaims)

    if (!artisan) {
      return NextResponse.json({ error: "Artisan not found" }, { status: 404 })
    }

    if (artisan.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Only approved artisans can update products" },
        { status: 403 }
      )
    }

    // Check product exists and belongs to artisan
    const existingProduct = await prisma.artListing.findFirst({
      where: {
        id,
        artisanId: artisan.id,
      },
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found or unauthorized" },
        { status: 404 }
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
      featured,
    } = body

    const product = await prisma.artListing.update({
      where: { id },
      data: {
        title,
        description,
        price,
        categoryId,
        material,
        region,
        size,
        images,
        featured,
      },
      include: {
        category: {
          select: { name: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      product,
    })
  } catch (error: any) {
    console.error("Error updating product:", error)
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    )
  }
}

// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const artisan = await findArtisan(userId, sessionClaims)

    if (!artisan) {
      return NextResponse.json({ error: "Artisan not found" }, { status: 404 })
    }

    // Check product exists and belongs to artisan
    const existingProduct = await prisma.artListing.findFirst({
      where: {
        id,
        artisanId: artisan.id,
      },
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found or unauthorized" },
        { status: 404 }
      )
    }

    await prisma.artListing.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    })
  } catch (error: any) {
    console.error("Error deleting product:", error)
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    )
  }
}

