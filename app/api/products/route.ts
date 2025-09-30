import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
  currency: z.enum(["GBP", "USD", "EUR", "NGN", "ESPEES"]),
})

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can create products
    if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ZONE_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = productSchema.safeParse(body)

    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, unitPrice, currency } = validatedData.data

    // Get the user's department or default department
    const department = await prisma.department.findFirst({
      where: session.user.departmentId 
        ? { id: session.user.departmentId }
        : { name: "UK ZONE 1 DSP" },
    })

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      )
    }

    // Check if product with same name already exists in this department
    const existingProduct = await prisma.productType.findUnique({
      where: {
        departmentId_name: {
          departmentId: department.id,
          name,
        },
      },
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: "A product with this name already exists" },
        { status: 400 }
      )
    }

    const product = await prisma.productType.create({
      data: {
        name,
        unitPrice,
        currency,
        departmentId: department.id,
      },
      include: {
        department: true,
      },
    })

    return NextResponse.json(
      { message: "Product created successfully", product },
      { status: 201 }
    )
  } catch (error) {
    console.error("Product creation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const products = await prisma.productType.findMany({
      include: {
        department: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error("Product fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
