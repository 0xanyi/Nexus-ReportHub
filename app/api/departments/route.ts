import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createDepartmentSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().optional(),
})

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const departments = await prisma.department.findMany({
      include: {
        productTypes: {
          orderBy: {
            name: "asc",
          },
        },
        _count: {
          select: {
            productTypes: true,
            transactions: true,
            payments: true,
            users: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json({ departments })
  } catch (error) {
    console.error("Get departments error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can create departments
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validation = createDepartmentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, description } = validation.data

    // Check if department with same name exists
    const existingDepartment = await prisma.department.findUnique({
      where: { name },
    })

    if (existingDepartment) {
      return NextResponse.json(
        { error: "A department with this name already exists" },
        { status: 400 }
      )
    }

    const department = await prisma.department.create({
      data: {
        name,
        description,
      },
    })

    return NextResponse.json(department, { status: 201 })
  } catch (error) {
    console.error("Create department error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
