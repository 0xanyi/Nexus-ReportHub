import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// POST /api/transactions - Create a new order/transaction
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can create manual orders
    if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ZONE_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { churchId, transactionDate, notes, lineItems } = body

    // Validation
    if (!churchId || !transactionDate || !lineItems || !Array.isArray(lineItems)) {
      return NextResponse.json(
        { error: "Missing required fields: churchId, transactionDate, lineItems" },
        { status: 400 }
      )
    }

    if (lineItems.length === 0) {
      return NextResponse.json(
        { error: "At least one line item is required" },
        { status: 400 }
      )
    }

    // Verify church exists
    const church = await prisma.church.findUnique({
      where: { id: churchId },
      include: {
        group: {
          include: {
            zone: true,
          },
        },
      },
    })

    if (!church) {
      return NextResponse.json({ error: "Church not found" }, { status: 404 })
    }

    // Get department
    let department
    if (session.user.departmentId) {
      department = await prisma.department.findUnique({
        where: { id: session.user.departmentId },
      })
    } else {
      department = await prisma.department.findFirst()
    }

    if (!department) {
      return NextResponse.json(
        { error: "No department found" },
        { status: 404 }
      )
    }

    // Validate line items and calculate totals
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

    // Create transaction with line items
    const transaction = await prisma.transaction.create({
      data: {
        churchId,
        departmentId: department.id,
        uploadedBy: session.user.id,
        transactionDate: new Date(transactionDate),
        transactionType: "PURCHASE",
        currency: church.group.zone.currency || "GBP",
        notes: notes || null,
        lineItems: {
          create: validatedLineItems,
        },
      },
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
      message: "Order created successfully",
      transaction,
    })
  } catch (error) {
    console.error("Create transaction error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
