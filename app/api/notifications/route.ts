export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "lib/notification-service"

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "20", 10)
    const unreadOnly = searchParams.get("unreadOnly") === "true"

    const result = await getUserNotifications(userId, { limit, unreadOnly })

    return NextResponse.json({
      notifications: result.notifications,
      unreadCount: result.unreadCount,
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}

// PUT /api/notifications - Mark notification(s) as read
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { notificationId, markAll } = body

    if (markAll) {
      await markAllNotificationsAsRead(userId)
      return NextResponse.json({ success: true, message: "All notifications marked as read" })
    }

    if (notificationId) {
      await markNotificationAsRead(notificationId)
      return NextResponse.json({ success: true, message: "Notification marked as read" })
    }

    return NextResponse.json(
      { error: "Notification ID or markAll flag required" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    )
  }
}

// GET /api/notifications/count - Get unread notification count
export async function HEAD(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ unreadCount: 0 })
    }

    const result = await getUserNotifications(userId, { unreadOnly: true })

    return NextResponse.json({ unreadCount: result.unreadCount })
  } catch (error) {
    return NextResponse.json({ unreadCount: 0 })
  }
}

