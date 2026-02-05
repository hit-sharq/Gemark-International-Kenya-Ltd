"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function submitOrderRequest(formData: FormData) {
  const { userId } = await auth()

  if (!userId) {
    return {
      success: false,
      message: "You must be signed in to submit an order request",
    }
  }

  try {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const location = formData.get("location") as string
    const message = formData.get("message") as string
    const artListingId = formData.get("artListingId") as string

    // Validate required fields
    if (!name || !email || !location || !artListingId) {
      return {
        success: false,
        message: "Please fill in all required fields",
      }
    }

    // Create the order request in the database
    const orderRequest = await prisma.orderRequest.create({
      data: {
        name,
        email,
        location,
        message: message || undefined,
        userId,
        artListingId,
      },
    })

    return {
      success: true,
      message: "Your order request has been submitted successfully",
      orderId: orderRequest.id,
    }
  } catch (error) {
    console.error("Error submitting order request:", error)
    return {
      success: false,
      message: "There was an error submitting your order request. Please try again.",
    }
  }
}
