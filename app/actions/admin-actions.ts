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

// Get current exchange rate
export async function getExchangeRate() {
  if (!(await isAdmin())) {
    return {
      success: false,
      message: "Unauthorized. Only admins can view exchange rates.",
    }
  }

  try {
    const exchangeRate = await prisma.exchangeRate.findFirst({
      where: {
        currency: 'USD_KES',
        isActive: true,
      },
    })

    if (!exchangeRate) {
      return {
        success: true,
        rate: 130.00, // Default fallback
        source: 'default',
        lastUpdated: null,
      }
    }

    return {
      success: true,
      rate: exchangeRate.rate,
      source: exchangeRate.source,
      lastUpdated: exchangeRate.updatedAt,
      currency: exchangeRate.currency,
    }
  } catch (error) {
    console.error("Error fetching exchange rate:", error)
    return {
      success: false,
      message: "There was an error fetching the exchange rate. Please try again.",
    }
  }
}

// Update exchange rate
export async function updateExchangeRate(rate: number, source: string = 'manual') {
  if (!(await isAdmin())) {
    return {
      success: false,
      message: "Unauthorized. Only administrators can update exchange rates.",
    }
  }

  try {
    // Validate rate
    if (typeof rate !== 'number' || isNaN(rate) || rate <= 0) {
      return {
        success: false,
        message: "Invalid exchange rate. Please enter a positive number greater than 0.",
      }
    }

    // Validate rate range (reasonable bounds: 50-500 KES per USD)
    if (rate < 50 || rate > 500) {
      return {
        success: false,
        message: `Exchange rate ${rate.toFixed(2)} seems unusual. Current market rate is typically between 125-135 KES per USD. Please verify your input.`,
      }
    }

    const { userId } = await auth()
    if (!userId) {
      return {
        success: false,
        message: "Authentication error. Please sign out and sign in again.",
      }
    }

    // Use upsert to handle the unique constraint - update existing or create new
    const exchangeRate = await prisma.exchangeRate.upsert({
      where: {
        currency_isActive: {
          currency: 'USD_KES',
          isActive: true,
        },
      },
      update: {
        rate: rate,
        source: source,
        updatedBy: userId,
        updatedAt: new Date(),
      },
      create: {
        currency: 'USD_KES',
        rate: rate,
        source: source,
        isActive: true,
        updatedBy: userId,
      },
    })

    revalidatePath("/dashboard")
    revalidatePath("/checkout")

    return {
      success: true,
      message: "Exchange rate updated successfully!",
      rate: exchangeRate.rate,
      lastUpdated: exchangeRate.updatedAt,
    }
  } catch (error: any) {
    console.error("Error updating exchange rate:", error)
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return {
        success: false,
        message: "A database conflict occurred. Another admin may have just updated the rate. Please try again.",
      }
    }
    
    if (error.code === 'P2025') {
      return {
        success: false,
        message: "Database record not found. Please refresh the page and try again.",
      }
    }
    
    return {
      success: false,
      message: "An unexpected error occurred while updating the exchange rate. Please try again or contact support if the problem persists.",
    }
  }
}
