import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const artListing = await prisma.artListing.findUnique({
      where: { id },
      include: {
        category: true,
      },
    })

    if (!artListing) {
      return NextResponse.json({ error: "Art listing not found" }, { status: 404 })
    }

    return NextResponse.json(artListing)
  } catch (error) {
    console.error("Error fetching art listing:", error)
    return NextResponse.json({ error: "Failed to fetch art listing" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Check if the art listing exists
    const artListing = await prisma.artListing.findUnique({
      where: { id },
    })

    if (!artListing) {
      return NextResponse.json({ error: "Art listing not found" }, { status: 404 })
    }

    // Delete the art listing
    await prisma.artListing.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting art listing:", error)
    return NextResponse.json({ error: "Failed to delete art listing" }, { status: 500 })
  }
}
