import { prisma } from "@/lib/prisma"

// Notification types
export type NotificationType =
  | 'ARTISAN_REGISTRATION_RECEIVED'
  | 'ARTISAN_APPROVED'
  | 'ARTISAN_REJECTED'
  | 'ORDER_PLACED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'PAYMENT_RECEIVED'
  | 'PRODUCT_APPROVED'
  | 'PRODUCT_REJECTED'
  | 'REVIEW_RECEIVED'
  | 'GENERAL'

interface CreateNotificationParams {
  userId?: string
  artisanId?: string
  orderId?: string
  type: NotificationType
  title: string
  message: string
  metadata?: Record<string, unknown>
}

interface NotificationWithUser {
  id: string
  userId: string | null
  artisanId: string | null
  orderId: string | null
  type: string
  title: string
  message: string
  isRead: boolean
  emailSent: boolean
  createdAt: Date
}

// Create a new notification
export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        orderId: params.orderId,
        type: params.type,
        title: params.title,
        message: params.message,
        metadata: params.metadata || {},
      },
    })

    return { success: true, notification }
  } catch (error) {
    console.error("Error creating notification:", error)
    return { success: false, error }
  }
}

// Get notifications for a user
export async function getUserNotifications(userId: string, options?: { limit?: number; unreadOnly?: boolean }) {
  try {
    const where: Record<string, unknown> = {
      userId,
    }

    if (options?.unreadOnly) {
      where.isRead = false
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options?.limit || 50,
    })

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    })

    return { success: true, notifications, unreadCount }
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return { success: false, notifications: [], unreadCount: 0 }
  }
}

// Get notifications for an artisan
export async function getArtisanNotifications(artisanId: string, options?: { limit?: number; unreadOnly?: boolean }) {
  try {
    const artisan = await prisma.artisan.findUnique({
      where: { id: artisanId },
      select: { clerkId: true },
    })

    if (!artisan || !artisan.clerkId) {
      return { success: false, notifications: [], unreadCount: 0 }
    }

    const where: Record<string, unknown> = {
      userId: artisan.clerkId,
    }

    if (options?.unreadOnly) {
      where.isRead = false
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options?.limit || 50,
    })

    const unreadCount = await prisma.notification.count({
      where: {
        userId: artisan.clerkId,
        isRead: false,
      },
    })

    return { success: true, notifications, unreadCount }
  } catch (error) {
    console.error("Error fetching artisan notifications:", error)
    return { success: false, notifications: [], unreadCount: 0 }
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    })

    return { success: true }
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return { success: false, error }
  }
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: string) {
  try {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })

    return { success: true }
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return { success: false, error }
  }
}

// Delete a notification
export async function deleteNotification(notificationId: string) {
  try {
    await prisma.notification.delete({
      where: { id: notificationId },
    })

    return { success: true }
  } catch (error) {
    console.error("Error deleting notification:", error)
    return { success: false, error }
  }
}

// Artisan-specific notification creators
export const artisanNotifications = {
  registrationReceived: async (artisanId: string, fullName: string, specialty: string, region: string) => {
    const artisan = await prisma.artisan.findUnique({
      where: { id: artisanId },
      select: { clerkId: true },
    })

    if (!artisan?.clerkId) return { success: false, error: "Artisan not found" }

    return createNotification({
      userId: artisan.clerkId,
      artisanId,
      type: "ARTISAN_REGISTRATION_RECEIVED",
      title: "Application Received",
      message: `Thank you for registering as an artisan! Your application for ${specialty} in ${region} is being reviewed.`,
    })
  },

  approved: async (artisanId: string, fullName: string, shopName: string) => {
    const artisan = await prisma.artisan.findUnique({
      where: { id: artisanId },
      select: { clerkId: true },
    })

    if (!artisan?.clerkId) return { success: false, error: "Artisan not found" }

    return createNotification({
      userId: artisan.clerkId,
      artisanId,
      type: "ARTISAN_APPROVED",
      title: "Congratulations! You're Approved! 🎉",
      message: `Your artisan application has been approved! Your shop "${shopName}" is now active. Start adding your products!`,
    })
  },

  rejected: async (artisanId: string, fullName: string, reason?: string) => {
    const artisan = await prisma.artisan.findUnique({
      where: { id: artisanId },
      select: { clerkId: true },
    })

    if (!artisan?.clerkId) return { success: false, error: "Artisan not found" }

    return createNotification({
      userId: artisan.clerkId,
      artisanId,
      type: "ARTISAN_REJECTED",
      title: "Application Update",
      message: reason || "Unfortunately, your artisan application was not approved at this time.",
    })
  },
}

// Order notification creators
export const orderNotifications = {
  placed: async (orderId: string, orderNumber: string, artisanIds: string[]) => {
    for (const artisanId of artisanIds) {
      const artisan = await prisma.artisan.findUnique({
        where: { id: artisanId },
        select: { clerkId: true },
      })

      if (artisan?.clerkId) {
        await createNotification({
          userId: artisan.clerkId,
          orderId,
          type: "ORDER_PLACED",
          title: "New Order Received!",
          message: `You have received a new order #${orderNumber}. Log in to your dashboard to view details.`,
        })
      }
    }
  },

  shipped: async (orderId: string, orderNumber: string, customerEmail: string) => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    })

    if (order?.userId) {
      await createNotification({
        userId: order.userId,
        orderId,
        type: "ORDER_SHIPPED",
        title: "Your Order Has Shipped! 📦",
        message: `Order #${orderNumber} is on its way to you. Check your email for tracking details.`,
      })
    }
  },
}

