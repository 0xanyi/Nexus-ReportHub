import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
  currency: z.enum(["GBP", "USD", "EUR", "NGN", "ESPEES"]),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const product = await prisma.productType.findUnique({
      where: { id },
      include: {
        department: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error("Product fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can update products
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

    // Check if product exists
    const existingProduct = await prisma.productType.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Check if name is being changed and if new name conflicts
    if (name !== existingProduct.name) {
      const conflictingProduct = await prisma.productType.findUnique({
        where: {
          departmentId_name: {
            departmentId: existingProduct.departmentId,
            name,
          },
        },
      })

      if (conflictingProduct) {
        return NextResponse.json(
          { error: "A product with this name already exists" },
          { status: 400 }
        )
      }
    }

    const product = await prisma.productType.update({
      where: { id },
      data: {
        name,
        unitPrice,
        currency,
      },
      include: {
        department: true,
      },
    })

    return NextResponse.json({
      message: "Product updated successfully",
      product,
    })
  } catch (error) {
    console.error("Product update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can delete products
    if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ZONE_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if product exists
    const product = await prisma.productType.findUnique({
      where: { id },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Check if product is being used in transactions
    const transactionCount = await prisma.transactionLineItem.count({
      where: { productTypeId: id },
    })

    if (transactionCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete product. It is used in ${transactionCount} transaction(s)` },
        { status: 400 }
      )
    }

    await prisma.productType.delete({
      where: { id },
    })

    return NextResponse.json({
      message: "Product deleted successfully",
    })
  } catch (error) {
    console.error("Product deletion error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
