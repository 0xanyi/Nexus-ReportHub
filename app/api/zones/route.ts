import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

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
