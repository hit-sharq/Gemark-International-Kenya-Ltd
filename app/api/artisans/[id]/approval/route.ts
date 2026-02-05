import { NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { isAdmin } from "lib/auth"
import { sendArtisanApprovedEmail, sendArtisanRejectedEmail } from "lib/email-service"

// Approve artisan registration
export async function POST(
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

    const artisan = await prisma.artisan.findUnique({
      where: { id },
    })

    if (!artisan) {
      return NextResponse.json(
        { error: "Artisan not found" },
        { status: 404 }
      )
    }

    if (artisan.status !== "PENDING") {
      return NextResponse.json(
        { error: "Artisan is not in pending status" },
        { status: 400 }
      )
    }

    // Generate shop slug if not set
    let shopSlug = artisan.shopSlug
    if (!shopSlug) {
      const baseSlug = (artisan.shopName || artisan.fullName)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
      shopSlug = `${baseSlug}-${id.slice(-6)}`
    }

    const updatedArtisan = await prisma.artisan.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedBy: userId,
        shopSlug,
      },
    })

    // Send approval email with shop link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const shopUrl = `${appUrl}/shop/${shopSlug}`

    await sendArtisanApprovedEmail(artisan.email, {
      fullName: artisan.fullName,
      shopName: artisan.shopName || artisan.fullName,
      shopUrl: shopUrl,
    })

    // Create in-app notification
    await prisma.notification.create({
      data: {
        userId: artisan.clerkId || undefined,
        type: "ACCOUNT_UPDATE",
        title: "Artisan Account Approved",
        message: `Congratulations! Your artisan application has been approved. Your shop "${artisan.shopName || artisan.fullName}" is now live!`,
        metadata: {
          artisanId: artisan.id,
          actionUrl: shopUrl,
        },
      },
    })

    return NextResponse.json({
      message: "Artisan approved successfully",
      artisan: {
        id: updatedArtisan.id,
        email: updatedArtisan.email,
        fullName: updatedArtisan.fullName,
        status: updatedArtisan.status,
        shopSlug: updatedArtisan.shopSlug,
      },
    })
  } catch (error) {
    console.error("Error approving artisan:", error)
    return NextResponse.json(
      { error: "Failed to approve artisan" },
      { status: 500 }
    )
  }
}

// Reject artisan registration
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId } = await auth()
    const body = await request.json()
    const { reason } = body

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

    const artisan = await prisma.artisan.findUnique({
      where: { id },
    })

    if (!artisan) {
      return NextResponse.json(
        { error: "Artisan not found" },
        { status: 404 }
      )
    }

    if (artisan.status !== "PENDING") {
      return NextResponse.json(
        { error: "Artisan is not in pending status" },
        { status: 400 }
      )
    }

    const updatedArtisan = await prisma.artisan.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionReason: reason || "Your registration was not approved.",
      },
    })

    // Send rejection email
    await sendArtisanRejectedEmail(artisan.email, {
      fullName: artisan.fullName,
      reason: reason || "Your registration was not approved at this time.",
    })

    // Create in-app notification
    await prisma.notification.create({
      data: {
        userId: artisan.clerkId || undefined,
        type: "ACCOUNT_UPDATE",
        title: "Artisan Application Update",
        message: reason || "Unfortunately, your artisan application was not approved at this time.",
        metadata: {
          artisanId: artisan.id,
        },
      },
    })

    return NextResponse.json({
      message: "Artisan registration rejected",
      artisan: {
        id: updatedArtisan.id,
        email: updatedArtisan.email,
        fullName: updatedArtisan.fullName,
        status: updatedArtisan.status,
        rejectionReason: updatedArtisan.rejectionReason,
      },
    })
  } catch (error) {
    console.error("Error rejecting artisan:", error)
    return NextResponse.json(
      { error: "Failed to reject artisan" },
      { status: 500 }
    )
  }
}

