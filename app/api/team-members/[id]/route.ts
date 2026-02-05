import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const teamMember = await prisma.teamMember.findUnique({
      where: { id },
    })

    if (!teamMember) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }

    return NextResponse.json(teamMember)
  } catch (error) {
    console.error("Error fetching team member:", error)
    return NextResponse.json({ error: "Failed to fetch team member" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check if user is admin
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = params.id
    const data = await request.json()
    const { name, title, bio, image, order } = data

    // Validate required fields
    if (!name || !title || !bio) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if team member exists
    const existingMember = await prisma.teamMember.findUnique({
      where: { id },
    })

    if (!existingMember) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }

    // Update team member
    const updatedMember = await prisma.teamMember.update({
      where: { id },
      data: {
        name,
        title,
        bio,
        image: image || existingMember.image,
        order: typeof order === "number" ? order : existingMember.order,
      },
    })

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error("Error updating team member:", error)
    return NextResponse.json({ error: "Failed to update team member" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check if user is admin
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = params.id

    // Check if team member exists
    const existingMember = await prisma.teamMember.findUnique({
      where: { id },
    })

    if (!existingMember) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }

    // Delete team member
    await prisma.teamMember.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting team member:", error)
    return NextResponse.json({ error: "Failed to delete team member" }, { status: 500 })
  }
}
