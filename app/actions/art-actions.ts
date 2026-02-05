"use server"
import { v2 as cloudinary } from "cloudinary"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/auth"
import { auth } from "@clerk/nextjs/server"  // Added import for auth

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function createArtListing(formData: FormData) {
  const { userId } = await auth()
  if (!(await isAdmin(userId ?? undefined))) {
    return {
      success: false,
      message: "Unauthorized: You don't have permission to create art listings. Please sign in as an admin.",
    }
  }

  try {
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const categoryId = formData.get("categoryId") as string
    const material = formData.get("material") as string || ""
    const region = formData.get("region") as string
    const price = Number.parseFloat(formData.get("price") as string)
    const size = formData.get("size") as string
    const featured = formData.get("featured") === "on"

    // Validate required fields with specific error messages
    const validationErrors: string[] = []
    if (!title || title.trim().length === 0) {
      validationErrors.push("Please enter a title for your art piece")
    }
    if (!description || description.trim().length === 0) {
      validationErrors.push("Please provide a description for your art piece")
    }
    if (!categoryId) {
      validationErrors.push("Please select a category")
    }
    if (!region) {
      validationErrors.push("Please select a region")
    }
    if (isNaN(price) || price <= 0) {
      validationErrors.push("Please enter a valid price greater than 0")
    }
    if (!size || size.trim().length === 0) {
      validationErrors.push("Please specify the size of your art piece")
    }

    if (validationErrors.length > 0) {
      return {
        success: false,
        message: "Please fix the following errors:\n• " + validationErrors.join("\n• "),
      }
    }

    // Get the uploaded images from the form
    const uploadedImages = formData.getAll("images") as File[]
    let images: string[] = []

    // Validate that at least one image is uploaded
    if (!uploadedImages || uploadedImages.length === 0 || !(uploadedImages[0] instanceof File) || uploadedImages[0].size === 0) {
      validationErrors.push("Please select at least one image to upload for your art piece")
    }

    // If we have uploaded images, process them
    if (
      uploadedImages &&
      uploadedImages.length > 0 &&
      uploadedImages[0] instanceof File &&
      uploadedImages[0].size > 0
    ) {
      // Validate images
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
      const maxFileSize = 10 * 1024 * 1024 // 10MB

      for (const file of uploadedImages) {
        if (!allowedTypes.includes(file.type)) {
          return {
            success: false,
            message: `Invalid file type: ${file.name}. Please upload only JPEG, PNG, GIF, or WebP images.`,
          }
        }
        if (file.size > maxFileSize) {
          return {
            success: false,
            message: `File too large: ${file.name}. Maximum file size is 10MB.`,
          }
        }
      }

      // Upload each image to Cloudinary
      for (const file of uploadedImages) {
        try {
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)

          const uploadResult = await new Promise<{ secure_url: string; error?: any }>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: "arts_afrik",
                resource_type: "image",
                transformation: [
                  { quality: "auto:best" },
                  { fetch_format: "auto" }
                ]
              },
              (error: any, result: any) => {
                if (error) {
                  reject(error)
                } else {
                  resolve(result as { secure_url: string })
                }
              }
            )
            uploadStream.end(buffer)
          })

          images.push(uploadResult.secure_url)
        } catch (uploadError: any) {
          console.error("Cloudinary upload error:", uploadError)
          const errorMessage = uploadError.message || uploadError.error?.message || "Unknown upload error"
          return {
            success: false,
            message: `Failed to upload image "${file.name}": ${errorMessage}. Please try again or use a different image.`,
          }
        }
      }

      if (images.length === 0) {
        return {
          success: false,
          message: "No images were successfully uploaded. Please try uploading your images again.",
        }
      }
    } else {
      // Use default placeholder if no images were uploaded
      images = [`/placeholder.svg?height=600&width=400&text=${encodeURIComponent(title)}`]
    }

    // Create the art listing in the database
    const artListing = await prisma.artListing.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        material: material.trim(),
        region,
        price,
        size: size.trim(),
        featured,
        images,
      },
    })

    revalidatePath("/gallery")
    revalidatePath("/")
    revalidatePath("/dashboard")

    return {
      success: true,
      message: `Success! "${title}" has been uploaded and is now visible in the gallery.`,
      artId: artListing.id,
    }
  } catch (error: any) {
    console.error("Error creating art listing:", error)
    
    // Provide specific error messages based on the error type
    if (error.code === "P2002") {
      return {
        success: false,
        message: "An art listing with similar details already exists. Please modify the title or description.",
      }
    }
    if (error.code === "P2025") {
      return {
        success: false,
        message: "The category you selected doesn't exist. Please refresh the page and try again.",
      }
    }
    if (error.name === "PrismaClientInitializationError") {
      return {
        success: false,
        message: "Database connection error. Please check your connection and try again.",
      }
    }
    
    return {
      success: false,
      message: "Unable to save the art listing. Our team has been notified. Please try again in a few minutes.",
    }
  }
}

export async function updateArtListing(formData: FormData) {
  const { userId } = await auth()  // Get userId from Clerk auth
  if (!(await isAdmin(userId ?? undefined))) {  // Pass userId to isAdmin, handle null case
    return {
      success: false,
      message: "Unauthorized. Only admins can update art listings.",
    }
  }

  try {
    const id = formData.get("id") as string
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const categoryId = formData.get("categoryId") as string
    const material = formData.get("material") as string || ""
    const region = formData.get("region") as string
    const price = Number.parseFloat(formData.get("price") as string)
    const size = formData.get("size") as string
    const featured = formData.get("featured") === "on"

    // Validate required fields
    if (!id || !title || !description || !categoryId || !region || isNaN(price) || !size) {
      return {
        success: false,
        message: "Please fill in all required fields",
      }
    }

    // Update the art listing in the database
    await prisma.artListing.update({
      where: { id },
      data: {
        title,
        description,
        categoryId,
        material,
        region,
        price,
        size,
        featured,
      },
    })

    revalidatePath("/gallery")
    revalidatePath(`/gallery/${id}`)
    revalidatePath("/")
    revalidatePath("/dashboard")

    return {
      success: true,
      message: "Art listing updated successfully",
    }
  } catch (error) {
    console.error("Error updating art listing:", error)
    return {
      success: false,
      message: "There was an error updating the art listing. Please try again.",
    }
  }
}

export async function toggleFeatured(id: string) {
  const { userId } = await auth()  // Get userId from Clerk auth
  if (!(await isAdmin(userId ?? undefined))) {  // Pass userId to isAdmin, handle null case
    return {
      success: false,
      message: "Unauthorized. Only admins can update art listings.",
    }
  }

  try {
    // Get the current art listing
    const artListing = await prisma.artListing.findUnique({
      where: { id },
    })

    if (!artListing) {
      return {
        success: false,
        message: "Art listing not found",
      }
    }

    // Toggle the featured status
    await prisma.artListing.update({
      where: { id },
      data: {
        featured: !artListing.featured,
      },
    })

    revalidatePath("/gallery")
    revalidatePath("/")
    revalidatePath("/dashboard")

    return {
      success: true,
      message: `Art listing ${artListing.featured ? "unfeatured" : "featured"} successfully`,
    }
  } catch (error) {
    console.error("Error toggling featured status:", error)
    return {
      success: false,
      message: "There was an error updating the art listing. Please try again.",
    }
  }
}

export async function deleteArtListing(id: string) {
  const { userId } = await auth()  // Get userId from Clerk auth
  if (!(await isAdmin(userId ?? undefined))) {  // Pass userId to isAdmin, handle null case
    return {
      success: false,
      message: "Unauthorized. Only admins can delete art listings.",
    }
  }

  try {
    // Check if the art listing exists
    const artListing = await prisma.artListing.findUnique({
      where: { id },
    })

    if (!artListing) {
      return {
        success: false,
        message: "Art listing not found",
      }
    }

    // Delete the art listing
    await prisma.artListing.delete({
      where: { id },
    })

    revalidatePath("/gallery")
    revalidatePath("/")
    revalidatePath("/dashboard")

    return {
      success: true,
      message: "Art listing deleted successfully",
    }
  } catch (error) {
    console.error("Error deleting art listing:", error)
    return {
      success: false,
      message: "There was an error deleting the art listing. Please try again.",
    }
  }
}
