import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/auth"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user is admin
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized. Only admins can update order status." }, { status: 401 })
    }

    const id = params.id
    const data = await request.json()
    const { status } = data

    // Validate status
    const validStatuses = ["pending", "approved", "shipped", "delivered", "cancelled"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Update the order status in the database
    const updatedOrder = await prisma.orderRequest.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
    })
  } catch (error) {
    console.error("Error updating order status:", error)
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 })
  }
}
