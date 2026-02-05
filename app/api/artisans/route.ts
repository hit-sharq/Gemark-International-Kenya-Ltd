import { NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { sendArtisanRegistrationReceivedEmail } from "lib/email-service"
import { artisanNotifications } from "lib/notification-service"

// Artisan registration
export async function POST(request: Request) {
  try {
    // Get Clerk user ID from authentication
    const { userId: clerkId } = await auth()

    const body = await request.json()
    const {
      email,
      fullName,
      phone,
      specialty,
      region,
      location,
      yearsExperience,
      bio,
    } = body

    // Validate required fields
    if (!email || !fullName || !specialty || !region) {
      return NextResponse.json(
        { error: "Missing required fields: email, fullName, specialty, and region are required" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingArtisan = await prisma.artisan.findUnique({
      where: { email },
    })

    if (existingArtisan) {
      return NextResponse.json(
        { error: "An artisan with this email already exists" },
        { status: 400 }
      )
    }

    // Generate shop slug from full name
    const baseSlug = fullName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

// Generate verification token for account linking
    const verificationToken = crypto.randomUUID()
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create artisan with PENDING status
    const artisan = await prisma.artisan.create({
      data: {
        email,
        clerkId, // Store the Clerk user ID
        fullName,
        phone,
        specialty,
        region,
        location,
        yearsExperience: yearsExperience ? parseInt(yearsExperience) : null,
        shopBio: bio,
        shopSlug: `${baseSlug}-${Date.now()}`, // Ensure uniqueness
        status: "PENDING",
        verificationToken,
        verificationExpiry,
      },
    })

    // Send confirmation email (non-blocking)
    sendArtisanRegistrationReceivedEmail(email, {
      fullName,
      specialty,
      region,
    }).catch((err) => console.error("Failed to send registration email:", err))

    // Create in-app notification (non-blocking)
    artisanNotifications.registrationReceived(artisan.id, fullName, specialty, region)
      .catch((err) => console.error("Failed to create notification:", err))

    return NextResponse.json(
      {
        message: "Registration submitted successfully. Awaiting admin approval.",
        artisan: {
          id: artisan.id,
          email: artisan.email,
          fullName: artisan.fullName,
          status: artisan.status,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error registering artisan:", error)
    return NextResponse.json(
      { error: "Failed to register artisan. Please try again." },
      { status: 500 }
    )
  }
}

// Get all artisans (for admin)
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const status = url.searchParams.get("status")
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100)
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0)

    const where = status ? { status: status as any } : {}

    const artisans = await prisma.artisan.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { artListings: true },
        },
      },
    })

    const total = await prisma.artisan.count({ where })

    return NextResponse.json({
      artisans,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error fetching artisans:", error)
    return NextResponse.json(
      { error: "Failed to fetch artisans" },
      { status: 500 }
    )
  }
}

