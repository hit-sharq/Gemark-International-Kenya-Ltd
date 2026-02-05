import { NextResponse } from "next/server"
import { prisma } from "../../../lib/prisma"

export async function GET() {
  try {
    console.log("Fetching featured artworks from database...")
    
    // First, count total artworks and featured ones
    const totalCount = await prisma.artListing.count()
    const featuredCount = await prisma.artListing.count({
      where: { featured: true }
    })
    
    console.log(`Total artworks: ${totalCount}, Featured: ${featuredCount}`)

    let featuredArtworks = await prisma.artListing.findMany({
      where: { featured: true },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        category: true,
        region: true,
        size: true,
        images: true,
        featured: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    console.log(`Found ${featuredArtworks.length} featured artworks`)

    // If no featured artworks, fetch recent artworks as fallback
    if (featuredArtworks.length === 0 && totalCount > 0) {
      console.log("No featured artworks, fetching recent artworks as fallback...")
      featuredArtworks = await prisma.artListing.findMany({
        take: 8,
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          category: true,
          region: true,
          size: true,
          images: true,
          featured: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      })
      console.log(`Fetched ${featuredArtworks.length} recent artworks as fallback`)
    }

    return NextResponse.json(featuredArtworks)
  } catch (error) {
    console.error("Error fetching featured artworks:", error)
    return NextResponse.json({ error: "Failed to fetch featured artworks" }, { status: 500 })
  }
}
