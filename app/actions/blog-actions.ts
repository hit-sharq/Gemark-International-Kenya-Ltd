"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/auth"
import slugify from "slugify"
import { z } from "zod"

// Form schema validation
const blogPostSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(50, "Content must be at least 50 characters"),
  excerpt: z
    .string()
    .min(10, "Excerpt must be at least 10 characters")
    .max(300, "Excerpt must be less than 300 characters"),
  category: z.string().min(1, "Category is required"),
  author: z.string().min(1, "Author is required"),
  authorTitle: z.string().optional(),
  tags: z.array(z.string()).optional(),
  image: z.string().optional(),
  featured: z.boolean().optional(),
  allowComments: z.boolean().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  publishDate: z.date().optional(),
})

export type BlogFormData = z.infer<typeof blogPostSchema>

export async function createBlogPost(formData: FormData) {
  if (!(await isAdmin())) {
    return {
      success: false,
      message: "Unauthorized. Only admins can create blog posts.",
    }
  }

  try {
    const title = formData.get("title") as string
    const content = formData.get("content") as string
    const excerpt = (formData.get("excerpt") as string) || title.substring(0, 150) + "..."
    const category = formData.get("category") as string
    const author = formData.get("author") as string
    const authorTitle = (formData.get("authorTitle") as string) || undefined
    const tagsString = formData.get("tags") as string
    const tags = tagsString ? tagsString.split(",").map((tag) => tag.trim()) : []
    const image = (formData.get("image") as string) || "/placeholder.svg?height=600&width=1200"
    const featured = formData.get("featured") === "on"
    const allowComments = formData.get("allowComments") === "on"
    const status = (formData.get("status") as string) || "draft"
    const publishDateStr = formData.get("publishDate") as string
    const publishDate = publishDateStr ? new Date(publishDateStr) : new Date()

    // Generate a slug from the title
    let slug = slugify(title, { lower: true, strict: true })

    // Check if slug already exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug },
    })

    // If slug exists, append a random string
    if (existingPost) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`
    }

    // Create the blog post in the database
    const blogPost = await prisma.blogPost.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        category,
        author,
        authorTitle,
        tags,
        image,
        featured,
        allowComments,
        status,
        date: publishDate,
      },
    })

    revalidatePath("/blog")
    revalidatePath("/dashboard")

    return {
      success: true,
      message: "Blog post created successfully",
      blogId: blogPost.id,
      slug: blogPost.slug,
    }
  } catch (error) {
    console.error("Error creating blog post:", error)
    return {
      success: false,
      message: "There was an error creating the blog post. Please try again.",
    }
  }
}

export async function updateBlogPost(formData: FormData) {
  if (!(await isAdmin())) {
    return {
      success: false,
      message: "Unauthorized. Only admins can update blog posts.",
    }
  }

  try {
    const id = formData.get("id") as string
    const title = formData.get("title") as string
    const content = formData.get("content") as string
    const excerpt = (formData.get("excerpt") as string) || title.substring(0, 150) + "..."
    const category = formData.get("category") as string
    const author = formData.get("author") as string
    const authorTitle = (formData.get("authorTitle") as string) || undefined
    const tagsString = formData.get("tags") as string
    const tags = tagsString ? tagsString.split(",").map((tag) => tag.trim()) : []
    const image = (formData.get("image") as string) || "/placeholder.svg?height=600&width=1200"
    const featured = formData.get("featured") === "on"
    const allowComments = formData.get("allowComments") === "on"
    const status = (formData.get("status") as string) || "draft"
    const publishDateStr = formData.get("publishDate") as string
    const publishDate = publishDateStr ? new Date(publishDateStr) : new Date()

    // Check if the blog post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
    })

    if (!existingPost) {
      return {
        success: false,
        message: "Blog post not found",
      }
    }

    // Update the blog post
    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: {
        title,
        content,
        excerpt,
        category,
        author,
        authorTitle,
        tags,
        image,
        featured,
        allowComments,
        status,
        date: publishDate,
        updatedAt: new Date(),
      },
    })

    revalidatePath("/blog")
    revalidatePath(`/blog/${updatedPost.slug}`)
    revalidatePath("/dashboard")

    return {
      success: true,
      message: "Blog post updated successfully",
      slug: updatedPost.slug,
    }
  } catch (error) {
    console.error("Error updating blog post:", error)
    return {
      success: false,
      message: "There was an error updating the blog post. Please try again.",
    }
  }
}

export async function deleteBlogPost(id: string) {
  if (!(await isAdmin())) {
    return {
      success: false,
      message: "Unauthorized. Only admins can delete blog posts.",
    }
  }

  try {
    // Check if the blog post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
    })

    if (!existingPost) {
      return {
        success: false,
        message: "Blog post not found",
      }
    }

    // Delete the blog post
    await prisma.blogPost.delete({
      where: { id },
    })

    revalidatePath("/blog")
    revalidatePath("/dashboard")

    return {
      success: true,
      message: "Blog post deleted successfully",
    }
  } catch (error) {
    console.error("Error deleting blog post:", error)
    return {
      success: false,
      message: "There was an error deleting the blog post. Please try again.",
    }
  }
}

export async function getBlogPosts() {
  try {
    const blogPosts = await prisma.blogPost.findMany({
      orderBy: {
        date: "desc",
      },
    })

    return {
      success: true,
      posts: blogPosts,
    }
  } catch (error) {
    console.error("Error fetching blog posts:", error)
    return {
      success: false,
      message: "There was an error fetching blog posts. Please try again.",
    }
  }
}

export async function getBlogPost(slug: string) {
  try {
    const blogPost = await prisma.blogPost.findUnique({
      where: { slug },
    })

    if (!blogPost) {
      return {
        success: false,
        message: "Blog post not found",
      }
    }

    return {
      success: true,
      post: blogPost,
    }
  } catch (error) {
    console.error("Error fetching blog post:", error)
    return {
      success: false,
      message: "There was an error fetching the blog post. Please try again.",
    }
  }
}
