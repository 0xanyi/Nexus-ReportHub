import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const createZoneSchema = z.object({
  name: z.string().min(1, "Name is required"),
  currency: z.string().min(3).max(3).default("GBP"),
})

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const zones = await prisma.zone.findMany({
      include: {
        _count: {
          select: {
            groups: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(zones)
  } catch (error) {
    console.error("Get zones error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Super Admin access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = createZoneSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      )
    }

    const { name, currency } = validation.data

    // Check for duplicate name
    const existing = await prisma.zone.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: "A zone with this name already exists" }, { status: 400 })
    }

    const zone = await prisma.zone.create({
      data: {
        name,
        currency,
      },
      include: {
        _count: {
          select: {
            groups: true,
          },
        },
      },
    })

    return NextResponse.json(zone, { status: 201 })
  } catch (error) {
    console.error("Create zone error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
