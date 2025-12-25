import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { requireAuth, requireAdmin } from "@/lib/auth-guards"
import { requireCsrf } from "@/lib/csrf"

const createChurchSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  groupId: z.string().min(1, "Group is required"),
})

export async function GET() {
  try {
    const session = await auth()

    const authCheck = requireAuth(session)
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    const churches = await prisma.church.findMany({
      include: {
        group: {
          include: {
            zone: true,
          },
        },
        _count: {
          select: {
            transactions: true,
            payments: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(churches)
  } catch (error) {
    console.error("Get churches error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
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
    const validation = createChurchSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, groupId } = validation.data

    // Check if church with same name exists in the group
    const existingChurch = await prisma.church.findFirst({
      where: {
        name,
        groupId,
      },
    })

    if (existingChurch) {
      return NextResponse.json(
        { error: "A church with this name already exists in this group" },
        { status: 400 }
      )
    }

    const church = await prisma.church.create({
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

    return NextResponse.json(church, { status: 201 })
  } catch (error) {
    console.error("Create church error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
