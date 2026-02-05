import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/auth"

export async function GET() {
  try {
    const teamMembers = await prisma.teamMember.findMany({
      orderBy: {
        order: "asc",
      },
    })

    return NextResponse.json(teamMembers)
  } catch (error) {
    console.error("Error fetching team members:", error)
    return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Check if user is admin
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { name, title, bio, image, order = 0 } = data

    // Validate required fields
    if (!name || !title || !bio || !image) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create team member
    const teamMember = await prisma.teamMember.create({
      data: {
        name,
        title,
        bio,
        image,
        order: typeof order === "number" ? order : 0,
      },
    })

    return NextResponse.json(teamMember)
  } catch (error) {
    console.error("Error creating team member:", error)
    return NextResponse.json({ error: "Failed to create team member" }, { status: 500 })
  }
}
