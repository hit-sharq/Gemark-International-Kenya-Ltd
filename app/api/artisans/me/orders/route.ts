export const dynamic = 'force-dynamic'

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

// GET - Fetch current artisan's orders
export async function GET(request: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const artisan = await findArtisan(userId, sessionClaims)

    if (!artisan) {
      return NextResponse.json({ error: "Artisan not found" }, { status: 404 })
    }

    // Get all products by this artisan
    const artisanProducts = await prisma.artListing.findMany({
      where: { artisanId: artisan.id },
      select: { id: true },
    })

    const productIds = artisanProducts.map((p) => p.id)

    if (productIds.length === 0) {
      return NextResponse.json([])
    }

    // Get orders containing artisan's products
    const orders = await prisma.orderRequest.findMany({
      where: {
        artListingId: { in: productIds },
      },
      include: {
        artListing: {
          select: {
            title: true,
            price: true,
            images: true,
            artisan: {
              select: {
                shopName: true,
                shopSlug: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Group orders by order ID if needed (for future order model)
    // For now, return individual order requests
    return NextResponse.json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    )
  }
}

// Update order status
export async function PUT(request: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const artisan = await findArtisan(userId, sessionClaims)

    if (!artisan) {
      return NextResponse.json({ error: "Artisan not found" }, { status: 404 })
    }

    const body = await request.json()
    const { orderId, status } = body

    // Validate status
    const validStatuses = ["pending", "approved", "shipped", "delivered", "cancelled"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    // Check the order belongs to artisan's product
    const order = await prisma.orderRequest.findFirst({
      where: {
        id: orderId,
        artListing: {
          artisanId: artisan.id,
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or unauthorized" },
        { status: 404 }
      )
    }

    const updatedOrder = await prisma.orderRequest.update({
      where: { id: orderId },
      data: { status },
    })

    return NextResponse.json({
      success: true,
      message: "Order status updated",
      order: updatedOrder,
    })
  } catch (error: any) {
    console.error("Error updating order:", error)
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    )
  }
}

