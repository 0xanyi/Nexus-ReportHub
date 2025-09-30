import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateGroupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        zone: true,
        churches: true,
      },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    return NextResponse.json(group)
  } catch (error) {
    console.error("Get group error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can update groups
    if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ZONE_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validation = updateGroupSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name } = validation.data

    // Check if group exists
    const existingGroup = await prisma.group.findUnique({
      where: { id },
    })

    if (!existingGroup) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Check if name conflicts with another group in the same zone
    const nameConflict = await prisma.group.findFirst({
      where: {
        name,
        zoneId: existingGroup.zoneId,
        id: { not: id },
      },
    })

    if (nameConflict) {
      return NextResponse.json(
        { error: "A group with this name already exists in this zone" },
        { status: 400 }
      )
    }

    const group = await prisma.group.update({
      where: { id },
      data: { name },
      include: {
        zone: true,
        churches: true,
      },
    })

    return NextResponse.json(group)
  } catch (error) {
    console.error("Update group error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can delete groups
    if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ZONE_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            churches: true,
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Check if group has churches
    if (group._count.churches > 0) {
      return NextResponse.json(
        { error: `Cannot delete group with ${group._count.churches} churches. Move or delete churches first.` },
        { status: 400 }
      )
    }

    await prisma.group.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Group deleted successfully" })
  } catch (error) {
    console.error("Delete group error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
