import { NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { isAdmin } from "lib/auth"

export async function GET() {
  try {
    // Check if user is admin
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized. Only admins can view order requests." }, { status: 401 })
    }

    console.log("Fetching order requests")
    const orderRequests = await prisma.orderRequest.findMany({
      include: {
        artListing: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    console.log(`Fetched ${orderRequests.length} order requests`)

    return NextResponse.json({
      success: true,
      orders: orderRequests,
    })
  } catch (error) {
    console.error("Error fetching order requests:", error)
    return NextResponse.json({ error: "Failed to fetch order requests" }, { status: 500 })
  }
}
