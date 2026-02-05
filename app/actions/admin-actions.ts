"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// Function to check if user is admin
async function isAdmin() {
  const { userId } = await auth()

  if (!userId) {
    return false
  }

  // In a real app, you would check if the user has admin role
  // For now, we'll assume the authenticated user is an admin
  return true
}

export async function updateOrderStatus(orderId: string, status: string) {
  if (!(await isAdmin())) {
    return {
      success: false,
      message: "Unauthorized. Only admins can update order status.",
    }
  }

  try {
    // Validate status
    const validStatuses = ["pending", "approved", "shipped", "delivered", "cancelled"]
    if (!validStatuses.includes(status)) {
      return {
        success: false,
        message: "Invalid status",
      }
    }

    // Update the order status in the database
    await prisma.orderRequest.update({
      where: { id: orderId },
      data: { status },
    })

    revalidatePath("/dashboard")

    return {
      success: true,
      message: "Order status updated successfully",
    }
  } catch (error) {
    console.error("Error updating order status:", error)
    return {
      success: false,
      message: "There was an error updating the order status. Please try again.",
    }
  }
}

export async function getOrderRequests() {
  if (!(await isAdmin())) {
    return {
      success: false,
      message: "Unauthorized. Only admins can view order requests.",
    }
  }

  try {
    const orderRequests = await prisma.orderRequest.findMany({
      include: {
        artListing: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return {
      success: true,
      orders: orderRequests,
    }
  } catch (error) {
    console.error("Error fetching order requests:", error)
    return {
      success: false,
      message: "There was an error fetching order requests. Please try again.",
    }
  }
}

export async function getArtListings() {
  if (!(await isAdmin())) {
    return {
      success: false,
      message: "Unauthorized. Only admins can view all art listings.",
    }
  }

  try {
    const artListings = await prisma.artListing.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    return {
      success: true,
      artListings,
    }
  } catch (error) {
    console.error("Error fetching art listings:", error)
    return {
      success: false,
      message: "There was an error fetching art listings. Please try again.",
    }
  }
}
