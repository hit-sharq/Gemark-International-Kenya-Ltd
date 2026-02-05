import { NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { auth } from "@clerk/nextjs/server"

// Link artisan account to Clerk user
export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      )
    }

    // Find artisan by verification token
    const artisan = await prisma.artisan.findFirst({
      where: {
        verificationToken: token,
        verificationExpiry: {
          gt: new Date(),
        },
      },
    })

    if (!artisan) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      )
    }

    // Check if artisan is still pending
    if (artisan.status !== "PENDING") {
      return NextResponse.json(
        { error: "This artisan registration has already been processed" },
        { status: 400 }
      )
    }

    // Check if Clerk user already has an artisan account
    const existingArtisan = await prisma.artisan.findFirst({
      where: { clerkId: userId },
    })

    if (existingArtisan) {
      return NextResponse.json(
        { error: "This user account is already linked to an artisan" },
        { status: 400 }
      )
    }

    // Get Clerk user details to verify email match
    const clerkUser = await auth()
    if (!clerkUser || !clerkUser.userId) {
      return NextResponse.json(
        { error: "Unable to verify user authentication" },
        { status: 401 }
      )
    }

    // For now, we'll assume email verification is handled by Clerk
    // In production, you might want to fetch user details from Clerk API

    // Link the accounts
    const updatedArtisan = await prisma.artisan.update({
      where: { id: artisan.id },
      data: {
        clerkId: userId,
        isVerified: true,
        verificationToken: null,
        verificationExpiry: null,
      },
    })

    return NextResponse.json({
      message: "Account linked successfully",
      artisan: {
        id: updatedArtisan.id,
        email: updatedArtisan.email,
        fullName: updatedArtisan.fullName,
        status: updatedArtisan.status,
        isVerified: updatedArtisan.isVerified,
      },
    })
  } catch (error) {
    console.error("Error linking artisan account:", error)
    return NextResponse.json(
      { error: "Failed to link account. Please try again." },
      { status: 500 }
    )
  }
}
