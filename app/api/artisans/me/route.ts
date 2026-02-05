export const dynamic = 'force-dynamic'

import { NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { auth } from "@clerk/nextjs/server"

// Get current authenticated artisan
export async function GET(request: Request) {
  try {
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in to access the artisan dashboard" },
        { status: 401 }
      )
    }

    // First, try to find artisan by Clerk ID (most reliable)
    let artisan = await prisma.artisan.findFirst({
      where: { clerkId: userId },
      include: {
        _count: {
          select: { artListings: true },
        },
      },
    })

    // If not found by Clerk ID, try by email from session claims
    if (!artisan) {
      const email = sessionClaims?.email as string | undefined
      const primaryEmail = sessionClaims?.primary_email as string | undefined
      const artisanEmail = email || primaryEmail

      if (artisanEmail) {
        artisan = await prisma.artisan.findFirst({
          where: { email: artisanEmail.toLowerCase() },
          include: {
            _count: {
              select: { artListings: true },
            },
          },
        })

        // If found by email, automatically link the Clerk ID
        if (artisan) {
          artisan = await prisma.artisan.update({
            where: { id: artisan.id },
            data: { clerkId: userId },
            include: {
              _count: {
                select: { artListings: true },
              },
            },
          })
        }
      }
    }

    if (!artisan) {
      return NextResponse.json(
        { error: "No artisan account found. Please register as an artisan." },
        { status: 404 }
      )
    }

    // Check if artisan is approved
    if (artisan.status === "PENDING") {
      return NextResponse.json(
        { error: "Your artisan application is pending approval. Please wait for admin review." },
        { status: 403 }
      )
    }

    if (artisan.status === "REJECTED") {
      return NextResponse.json(
        { error: "Your artisan registration has been rejected." },
        { status: 403 }
      )
    }

    return NextResponse.json(artisan)
  } catch (error) {
    console.error("Error fetching artisan:", error)
    return NextResponse.json(
      { error: "Failed to fetch artisan data" },
      { status: 500 }
    )
  }
}

