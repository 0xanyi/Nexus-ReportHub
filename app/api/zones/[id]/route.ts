import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireSuperAdmin } from "@/lib/auth-guards"
import { requireCsrf } from "@/lib/csrf"

const updateZoneSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  currency: z.string().min(3).max(3).optional(),
})

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    const authCheck = requireAuth(session)
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    const params = await context.params
    const zone = await prisma.zone.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            groups: true,
          },
        },
      },
    })

    if (!zone) {
      return NextResponse.json({ error: "Zone not found" }, { status: 404 })
    }

    return NextResponse.json(zone)
  } catch (error) {
    console.error("Get zone error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    // CSRF validation
    const csrfError = await requireCsrf()
    if (csrfError) return csrfError

    // Auth and role check
    const authCheck = requireSuperAdmin(session)
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    const params = await context.params
    const body = await request.json()
    const validation = updateZoneSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      )
    }

    // Check if zone exists
    const existingZone = await prisma.zone.findUnique({
      where: { id: params.id },
    })

    if (!existingZone) {
      return NextResponse.json({ error: "Zone not found" }, { status: 404 })
    }

    const { name, currency } = validation.data

    // Check for duplicate name if name is being changed
    if (name && name !== existingZone.name) {
      const duplicate = await prisma.zone.findFirst({
        where: {
          name: {
            equals: name,
            mode: "insensitive",
          },
          id: {
            not: params.id,
          },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: "A zone with this name already exists" },
          { status: 400 }
        )
      }
    }

    const zone = await prisma.zone.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(currency && { currency }),
      },
      include: {
        _count: {
          select: {
            groups: true,
          },
        },
      },
    })

    return NextResponse.json(zone)
  } catch (error) {
    console.error("Update zone error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    // CSRF validation
    const csrfError = await requireCsrf()
    if (csrfError) return csrfError

    // Auth and role check
    const authCheck = requireSuperAdmin(session)
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    const params = await context.params

    // Check if zone has groups
    const zoneWithGroups = await prisma.zone.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            groups: true,
          },
        },
      },
    })

    if (!zoneWithGroups) {
      return NextResponse.json({ error: "Zone not found" }, { status: 404 })
    }

    if (zoneWithGroups._count.groups > 0) {
      return NextResponse.json(
        { error: "Cannot delete zone with existing groups. Please remove all groups first." },
        { status: 400 }
      )
    }

    await prisma.zone.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Zone deleted successfully" })
  } catch (error) {
    console.error("Delete zone error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
