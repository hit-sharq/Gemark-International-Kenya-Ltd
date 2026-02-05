import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/auth"
import slugify from "slugify"

export async function GET() {
  try {
    const blogPosts = await prisma.blogPost.findMany({
      orderBy: {
        date: "desc",
      },
    })

    return NextResponse.json(blogPosts)
  } catch (error) {
    console.error("Error fetching blog posts:", error)
    return NextResponse.json({ error: "Failed to fetch blog posts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Check if user is admin
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Generate a slug from the title
    let slug = slugify(data.title, { lower: true, strict: true })

    // Check if slug already exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug },
    })

    // If slug exists, append a random string
    if (existingPost) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`
    }

    // Create the blog post
    const blogPost = await prisma.blogPost.create({
      data: {
        ...data,
        slug,
        date: data.date ? new Date(data.date) : new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Blog post created successfully",
      id: blogPost.id,
      slug: blogPost.slug,
    })
  } catch (error) {
    console.error("Error creating blog post:", error)
    return NextResponse.json({ error: "Failed to create blog post" }, { status: 500 })
  }
}
