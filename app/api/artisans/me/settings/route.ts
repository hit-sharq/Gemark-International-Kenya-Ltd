export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { auth } from "@clerk/nextjs/server"

// GET - Fetch current artisan's settings
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
        id: true,
        email: true,
        fullName: true,
        phone: true,
        specialty: true,
        region: true,
        location: true,
        yearsExperience: true,
        status: true,
        createdAt: true,
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
            id: true,
            email: true,
            fullName: true,
            phone: true,
            specialty: true,
            region: true,
            location: true,
            yearsExperience: true,
            status: true,
            createdAt: true,
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
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

// PUT - Update current artisan's profile
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

    const body = await request.json()
    const { fullName, phone, specialty, region, location, yearsExperience } = body

    // Validation
    if (!fullName || !specialty || !region) {
      return NextResponse.json(
        { error: "Please fill in all required fields" },
        { status: 400 }
      )
    }

    const updatedArtisan = await prisma.artisan.update({
      where: { id: artisan.id },
      data: {
        fullName,
        phone,
        specialty,
        region,
        location,
        yearsExperience: yearsExperience ? parseInt(yearsExperience) : null,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      artisan: {
        id: updatedArtisan.id,
        email: updatedArtisan.email,
        fullName: updatedArtisan.fullName,
        phone: updatedArtisan.phone,
        specialty: updatedArtisan.specialty,
        region: updatedArtisan.region,
        location: updatedArtisan.location,
        yearsExperience: updatedArtisan.yearsExperience,
        status: updatedArtisan.status,
      },
    })
  } catch (error: any) {
    console.error("Error updating settings:", error)
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    )
  }
}

