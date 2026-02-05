export const dynamic = 'force-dynamic'

import { isAdmin } from "../../../lib/auth"
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

export async function GET() {
  try {
    const { userId } = await auth()

    // Log the current user ID for debugging
    console.log("API: Current Clerk user ID:", userId)

    // If no user is authenticated, return early
    if (!userId) {
      return NextResponse.json({
        isAdmin: false,
        userId: null,
        message: "No authenticated user",
      })
    }

    try {
      const adminStatus = await isAdmin(userId)

      // Log the result of the admin check
      console.log("API: Admin status result:", adminStatus)

      return NextResponse.json({
        isAdmin: adminStatus,
        userId: userId, // Include the userId in the response for debugging
      })
    } catch (error) {
      console.error("API: Error checking admin status:", error)
      return NextResponse.json({
        isAdmin: false,
        error: "Error checking admin status",
        userId: userId,
      })
    }
  } catch (error) {
    console.error("API: Error in check-admin API:", error)
    return NextResponse.json(
      {
        isAdmin: false,
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
