"use server"

import { v2 as cloudinary } from "cloudinary"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/auth"

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function getTeamMembers() {
  try {
    const teamMembers = await prisma.teamMember.findMany({
      orderBy: {
        name: "asc",
      },
    })

    return {
      success: true,
      teamMembers,
    }
  } catch (error) {
    console.error("Error fetching team members:", error)
    return {
      success: false,
      message: "There was an error fetching team members. Please try again.",
    }
  }
}

export async function createTeamMember(formData: FormData) {
  if (!(await isAdmin())) {
    return {
      success: false,
      message: "Unauthorized. Only admins can create team members.",
    }
  }

  try {
    const name = formData.get("name") as string
    const title = formData.get("title") as string
    const bio = formData.get("bio") as string
    const order = Number.parseInt(formData.get("order") as string) || 0

    // Validate required fields
    if (!name || !title || !bio) {
      return {
        success: false,
        message: "Please fill in all required fields",
      }
    }

    // Get the uploaded image from the form
    const uploadedImage = formData.get("image") as File
    let imageUrl = "/placeholder.svg?height=300&width=300"

    // If we have an uploaded image, process it
    if (uploadedImage && uploadedImage instanceof File && uploadedImage.size > 0) {
      try {
        // Convert File to buffer
        const arrayBuffer = await uploadedImage.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload to Cloudinary
        const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "arts_afrik/team" },
            (error: any, result: any) => {
              if (error) {
                console.error("Cloudinary upload error:", error)
                reject(error)
              } else {
                resolve(result as { secure_url: string })
              }
            },
          )
          uploadStream.end(buffer)
        })

        imageUrl = uploadResult.secure_url
      } catch (uploadError) {
        console.error("Error uploading image to Cloudinary:", uploadError)
        return {
          success: false,
          message: `Error uploading image: ${
            uploadError instanceof Error
              ? uploadError.message
              : typeof uploadError === "object"
                ? JSON.stringify(uploadError)
                : String(uploadError)
          }`,
        }
      }
    }

    // Create the team member in the database
    const teamMember = await prisma.teamMember.create({
      data: {
        name,
        title,
        bio,
        image: imageUrl,
        order,
      },
    })

    // Revalidate the about page
    revalidatePath("/about")
    revalidatePath("/dashboard")

    return {
      success: true,
      message: "Team member created successfully",
      teamMemberId: teamMember.id,
    }
  } catch (error) {
    console.error("Error creating team member:", error)
    return {
      success: false,
      message: "There was an error creating the team member. Please try again.",
    }
  }
}

export async function updateTeamMember(formData: FormData) {
  if (!(await isAdmin())) {
    return {
      success: false,
      message: "Unauthorized. Only admins can update team members.",
    }
  }

  try {
    const id = formData.get("id") as string
    const name = formData.get("name") as string
    const title = formData.get("title") as string
    const bio = formData.get("bio") as string
    const order = Number.parseInt(formData.get("order") as string) || 0

    // Validate required fields
    if (!id || !name || !title || !bio) {
      return {
        success: false,
        message: "Please fill in all required fields",
      }
    }

    // Get the current team member to check if we need to update the image
    const currentTeamMember = await prisma.teamMember.findUnique({
      where: { id },
    })

    if (!currentTeamMember) {
      return {
        success: false,
        message: "Team member not found",
      }
    }

    let imageUrl = currentTeamMember.image

    // Get the uploaded image from the form
    const uploadedImage = formData.get("image") as File

    // If we have a new uploaded image, process it
    if (uploadedImage && uploadedImage instanceof File && uploadedImage.size > 0) {
      try {
        // Convert File to buffer
        const arrayBuffer = await uploadedImage.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload to Cloudinary
        const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "arts_afrik/team" },
            (error: any, result: any) => {
              if (error) {
                console.error("Cloudinary upload error:", error)
                reject(error)
              } else {
                resolve(result as { secure_url: string })
              }
            },
          )
          uploadStream.end(buffer)
        })

        imageUrl = uploadResult.secure_url
      } catch (uploadError) {
        console.error("Error uploading image to Cloudinary:", uploadError)
        return {
          success: false,
          message: `Error uploading image: ${
            uploadError instanceof Error
              ? uploadError.message
              : typeof uploadError === "object"
                ? JSON.stringify(uploadError)
                : String(uploadError)
          }`,
        }
      }
    }

    // Update the team member in the database
    await prisma.teamMember.update({
      where: { id },
      data: {
        name,
        title,
        bio,
        image: imageUrl,
        order,
      },
    })

    // Revalidate the about page
    revalidatePath("/about")
    revalidatePath("/dashboard")

    return {
      success: true,
      message: "Team member updated successfully",
    }
  } catch (error) {
    console.error("Error updating team member:", error)
    return {
      success: false,
      message: "There was an error updating the team member. Please try again.",
    }
  }
}

export async function deleteTeamMember(id: string) {
  if (!(await isAdmin())) {
    return {
      success: false,
      message: "Unauthorized. Only admins can delete team members.",
    }
  }

  try {
    // Check if the team member exists
    const teamMember = await prisma.teamMember.findUnique({
      where: { id },
    })

    if (!teamMember) {
      return {
        success: false,
        message: "Team member not found",
      }
    }

    // Delete the team member
    await prisma.teamMember.delete({
      where: { id },
    })

    // Revalidate the about page
    revalidatePath("/about")
    revalidatePath("/dashboard")

    return {
      success: true,
      message: "Team member deleted successfully",
    }
  } catch (error) {
    console.error("Error deleting team member:", error)
    return {
      success: false,
      message: "There was an error deleting the team member. Please try again.",
    }
  }
}
