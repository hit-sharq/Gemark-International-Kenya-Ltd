import { auth, currentUser } from "@clerk/nextjs/server"

// Update the function to work in both client and server contexts
export async function isAdmin(providedUserId?: string | null): Promise<boolean> {
  try {
    // If a userId is provided and not null, use it
    let userId = providedUserId

    // Otherwise, try to get it from the current auth context
    if (!userId) {
      try {
        // Try server-side auth first
        const authResult = await auth()
        userId = authResult.userId
      } catch (e) {
        // If server-side auth fails, we can't use client hooks in this context
        // We'll need to rely on the API route for client components
        console.log("Server-side auth failed, this might be a client component")
      }

      // Only try currentUser if we still don't have a userId
      if (!userId) {
        try {
          const user = await currentUser()
          userId = user?.id
        } catch (e) {
          // Ignore errors from currentUser
          console.log("currentUser() failed, this might be a client component")
        }
      }
    }

    // If we still don't have a userId, the user is not authenticated
    if (!userId) {
      return false
    }

    // Get the list of admin IDs from environment variables
    const adminIds = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(",") : []

    console.log("Checking if user is admin:", userId)
    console.log("Admin IDs:", adminIds)

    // Check if the user's ID is in the list of admin IDs
    return adminIds.includes(userId)
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}
