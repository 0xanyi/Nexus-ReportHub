import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { requireAuth, requireAdmin } from "@/lib/auth-guards"
import { requireCsrf } from "@/lib/csrf"

const createGroupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  zoneId: z.string().min(1, "Zone is required"),
})

export async function GET() {
  try {
    const session = await auth()

    const authCheck = requireAuth(session)
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    const groups = await prisma.group.findMany({
      include: {
        zone: true,
        _count: {
          select: {
            churches: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error("Get groups error:", error)
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
    const validation = createGroupSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, zoneId } = validation.data

    // Check if group with same name exists in the zone
    const existingGroup = await prisma.group.findFirst({
      where: {
        name,
        zoneId,
      },
    })

    if (existingGroup) {
      return NextResponse.json(
        { error: "A group with this name already exists in this zone" },
        { status: 400 }
      )
    }

    const group = await prisma.group.create({
      data: {
        name,
        zoneId,
      },
      include: {
        zone: true,
      },
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error("Create group error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
