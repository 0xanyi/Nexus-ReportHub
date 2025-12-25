import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { requireAuth, requireSuperAdmin } from "@/lib/auth-guards"
import { requireCsrf } from "@/lib/csrf"

const updateDepartmentSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().optional(),
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

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        productTypes: true,
        _count: {
          select: {
            transactions: true,
            payments: true,
            users: true,
          },
        },
      },
    })

    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 })
    }

    return NextResponse.json(department)
  } catch (error) {
    console.error("Get department error:", error)
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
    const authCheck = requireSuperAdmin(session)
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    const body = await request.json()
    const validation = updateDepartmentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, description } = validation.data

    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { id },
    })

    if (!existingDepartment) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 })
    }

    // Check if another department with same name exists
    const duplicateDepartment = await prisma.department.findFirst({
      where: {
        name,
        id: { not: id },
      },
    })

    if (duplicateDepartment) {
      return NextResponse.json(
        { error: "A department with this name already exists" },
        { status: 400 }
      )
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        name,
        description,
      },
    })

    return NextResponse.json(department)
  } catch (error) {
    console.error("Update department error:", error)
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
    const authCheck = requireSuperAdmin(session)
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            productTypes: true,
            transactions: true,
            payments: true,
            users: true,
          },
        },
      },
    })

    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 })
    }

    // Check if department has dependencies
    if (
      department._count.productTypes > 0 ||
      department._count.transactions > 0 ||
      department._count.payments > 0 ||
      department._count.users > 0
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot delete department with existing products, transactions, payments, or users",
        },
        { status: 400 }
      )
    }

    await prisma.department.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Department deleted successfully" })
  } catch (error) {
    console.error("Delete department error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
