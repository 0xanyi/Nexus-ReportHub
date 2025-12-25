import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { requireAuth, requireAdmin } from "@/lib/auth-guards"
import { requireCsrf } from "@/lib/csrf"

const updateChurchSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  groupId: z.string().min(1, "Group is required"),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await auth()

    const authCheck = requireAuth(session)
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    const church = await prisma.church.findUnique({
      where: { id },
      include: {
        group: {
          include: {
            zone: true,
          },
        },
      },
    })

    if (!church) {
      return NextResponse.json({ error: "Church not found" }, { status: 404 })
    }

    return NextResponse.json(church)
  } catch (error) {
    console.error("Get church error:", error)
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

    // CSRF validation
    const csrfError = await requireCsrf()
    if (csrfError) return csrfError

    // Auth and role check
    const authCheck = requireAdmin(session)
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    const body = await request.json()
    const validation = updateChurchSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, groupId } = validation.data

    // Check if church exists
    const existingChurch = await prisma.church.findUnique({
      where: { id },
    })

    if (!existingChurch) {
      return NextResponse.json({ error: "Church not found" }, { status: 404 })
    }

    // Check if name conflicts with another church in the target group
    const nameConflict = await prisma.church.findFirst({
      where: {
        name,
        groupId,
        id: { not: id },
      },
    })

    if (nameConflict) {
      return NextResponse.json(
        { error: "A church with this name already exists in this group" },
        { status: 400 }
      )
    }

    const church = await prisma.church.update({
      where: { id },
      data: { 
        name,
        groupId,
      },
      include: {
        group: {
          include: {
            zone: true,
          },
        },
      },
    })

    return NextResponse.json(church)
  } catch (error) {
    console.error("Update church error:", error)
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

    // CSRF validation
    const csrfError = await requireCsrf()
    if (csrfError) return csrfError

    // Auth and role check
    const authCheck = requireAdmin(session)
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    // Check if church exists
    const church = await prisma.church.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            transactions: true,
            payments: true,
          },
        },
      },
    })

    if (!church) {
      return NextResponse.json({ error: "Church not found" }, { status: 404 })
    }

    // Check if church has transactions or payments
    if (church._count.transactions > 0 || church._count.payments > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete church with ${church._count.transactions} transactions and ${church._count.payments} payments. Data integrity must be preserved.` 
        },
        { status: 400 }
      )
    }

    await prisma.church.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Church deleted successfully" })
  } catch (error) {
    console.error("Delete church error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
