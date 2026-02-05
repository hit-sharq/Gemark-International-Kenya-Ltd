import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Try to fetch a count of art listings
    const count = await prisma.artListing.count()

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      count,
    })
  } catch (error) {
    console.error("Database connection error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
