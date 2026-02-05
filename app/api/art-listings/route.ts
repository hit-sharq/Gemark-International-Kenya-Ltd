export const dynamic = 'force-dynamic'

import { NextResponse } from "next/server"
import { prisma } from "lib/prisma"

export async function GET(request: Request) {
  try {
    console.log("Fetching art listings")
    const url = new URL(request.url)
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "10", 10), 100)
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0)

    const artListings = await prisma.artListing.findMany({
      skip: offset,
      take: limit,
      include: {
        category: true,
      },
    })

    console.log(`Fetched ${artListings.length} art listings with limit=${limit} offset=${offset}`)
    return NextResponse.json(artListings)
  } catch (error) {
    console.error("Error fetching art listings:", error)
    return NextResponse.json({ error: "Failed to fetch art listings" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, categoryId, region, price, size, featured, images } = body

    if (!title || !description || !categoryId || !region || !price || !size) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const artListing = await prisma.artListing.create({
      data: {
        title,
        description,
        categoryId,
        region,
        price: parseFloat(price),
        size,
        featured: featured || false,
        images: images || [],
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json(artListing, { status: 201 })
  } catch (error) {
    console.error("Error creating art listing:", error)
    return NextResponse.json(
      { error: "Failed to create art listing" },
      { status: 500 }
    )
  }
}
