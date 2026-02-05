import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Default categories to use if none exist in the database
const DEFAULT_CATEGORIES = [
  { name: "Paintings", slug: "paintings", description: "Traditional and contemporary African paintings", order: 1 },
  { name: "Sculptures", slug: "sculptures", description: "Wood, stone, and metal sculptures", order: 2 },
  { name: "Textiles", slug: "textiles", description: "Fabrics, woven goods, and clothing", order: 3 },
  { name: "Jewelry", slug: "jewelry", description: "Beadwork, metalwork, and decorative accessories", order: 4 },
  { name: "Pottery", slug: "pottery", description: "Clay vessels and ceramic art", order: 5 },
  { name: "Woodcarving", slug: "woodcarving", description: "Carved wooden art and functional items", order: 6 },
  { name: "Basketry", slug: "basketry", description: "Woven baskets and containers", order: 7 },
  { name: " Masks", slug: "masks", description: "Traditional and decorative masks", order: 8 },
  { name: "Leatherwork", slug: "leatherwork", description: "Leather goods and accessories", order: 9 },
  { name: "Metalwork", slug: "metalwork", description: "Iron, bronze, and other metal crafts", order: 10 },
]

export async function GET() {
  try {
    console.log("Fetching categories from database...")
    
    let categories = await prisma.category.findMany({
      orderBy: {
        order: "asc",
      },
    })

    console.log(`Found ${categories.length} categories in database`)

    // If no categories exist, create default categories
    if (categories.length === 0) {
      console.log("No categories found, creating default categories...")
      
      for (const defaultCat of DEFAULT_CATEGORIES) {
        try {
          await prisma.category.create({
            data: defaultCat,
          })
        } catch (createError) {
          console.error("Error creating category:", defaultCat.name, createError)
        }
      }
      
      // Fetch the newly created categories
      categories = await prisma.category.findMany({
        orderBy: {
          order: "asc",
        },
      })
      console.log(`Created ${categories.length} categories`)
    }

    // If still no categories (DB might be down), return defaults
    if (categories.length === 0) {
      console.log("Database unavailable, returning default categories")
      return NextResponse.json(DEFAULT_CATEGORIES)
    }

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    // Return default categories even if database fails
    console.log("Returning default categories due to error")
    return NextResponse.json(DEFAULT_CATEGORIES)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, slug, description } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingCategory = await prisma.category.findUnique({
      where: { slug },
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category with this slug already exists" },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        order: await prisma.category.count() + 1,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    )
  }
}
