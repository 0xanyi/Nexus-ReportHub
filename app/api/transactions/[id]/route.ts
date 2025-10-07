import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

// GET /api/transactions/[id] - Get a specific transaction
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        lineItems: {
          include: {
            productType: true,
          },
        },
        church: {
          include: {
            group: {
              include: {
                zone: true,
              },
            },
          },
        },
        uploader: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error("Get transaction error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/transactions/[id] - Update a transaction
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can edit orders
    if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ZONE_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { transactionDate, notes, lineItems } = body

    // Check if transaction exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        lineItems: true,
        church: {
          include: {
            group: {
              include: {
                zone: true,
              },
            },
          },
        },
      },
    })

    if (!existingTransaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Validation
    if (lineItems && !Array.isArray(lineItems)) {
      return NextResponse.json(
        { error: "lineItems must be an array" },
        { status: 400 }
      )
    }

    if (lineItems && lineItems.length === 0) {
      return NextResponse.json(
        { error: "At least one line item is required" },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: {
      transactionDate?: Date
      notes?: string | null
      lineItems?: {
        create: Array<{
          productTypeId: string
          quantity: number
          unitPrice: Prisma.Decimal
          totalAmount: Prisma.Decimal
        }>
      }
    } = {}

    if (transactionDate) {
      updateData.transactionDate = new Date(transactionDate)
    }

    if (notes !== undefined) {
      updateData.notes = notes || null
    }

    // If line items are provided, update them
    if (lineItems) {
      // Validate and prepare line items
      const validatedLineItems = []
      for (const item of lineItems) {
        if (!item.productTypeId || !item.quantity || item.quantity <= 0) {
          return NextResponse.json(
            { error: "Invalid line item: missing productTypeId or quantity" },
            { status: 400 }
          )
        }

        // Verify product exists
        const product = await prisma.productType.findUnique({
          where: { id: item.productTypeId },
        })

        if (!product) {
          return NextResponse.json(
            { error: `Product not found: ${item.productTypeId}` },
            { status: 404 }
          )
        }

        const unitPrice = product.unitPrice
        const totalAmount = unitPrice.mul(item.quantity)

        validatedLineItems.push({
          productTypeId: item.productTypeId,
          quantity: item.quantity,
          unitPrice,
          totalAmount,
        })
      }

      // Delete existing line items and create new ones
      await prisma.transactionLineItem.deleteMany({
        where: { transactionId: id },
      })

      updateData.lineItems = {
        create: validatedLineItems,
      }
    }

    // Update transaction
    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        lineItems: {
          include: {
            productType: true,
          },
        },
        church: true,
        uploader: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: "Order updated successfully",
      transaction,
    })
  } catch (error) {
    console.error("Update transaction error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/transactions/[id] - Delete a transaction
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can delete orders
    if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ZONE_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params

    // Check if transaction exists
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    })

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Delete transaction (line items will be cascade deleted)
    await prisma.transaction.delete({
      where: { id },
    })

    return NextResponse.json({
      message: "Order deleted successfully",
    })
  } catch (error) {
    console.error("Delete transaction error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
