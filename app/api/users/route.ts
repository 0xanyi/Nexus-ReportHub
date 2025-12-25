import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { requireSuperAdmin } from "@/lib/auth-guards"
import { requireCsrf } from "@/lib/csrf"

const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(12, "Password must be at least 12 characters"),
  role: z.enum(["SUPER_ADMIN", "ZONE_ADMIN", "GROUP_ADMIN", "CHURCH_USER"]),
  zoneId: z.string().optional().nullable(),
  groupId: z.string().optional().nullable(),
  churchId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
})

export async function GET() {
  try {
    const session = await auth()

    const authCheck = requireSuperAdmin(session)
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        zoneId: true,
        groupId: true,
        churchId: true,
        departmentId: true,
        createdAt: true,
        zone: {
          select: {
            name: true,
          },
        },
        group: {
          select: {
            name: true,
          },
        },
        church: {
          select: {
            name: true,
          },
        },
        department: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Get users error:", error)
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
    const authCheck = requireSuperAdmin(session)
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    const body = await request.json()
    const validation = createUserSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, name, password, role, zoneId, groupId, churchId, departmentId } =
      validation.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
        zoneId: zoneId || null,
        groupId: groupId || null,
        churchId: churchId || null,
        departmentId: departmentId || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        zoneId: true,
        groupId: true,
        churchId: true,
        departmentId: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
