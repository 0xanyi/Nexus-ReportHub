import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-guards"
import { requireCsrf } from "@/lib/csrf"

const VALID_PERIOD_REGEX = /^\d{4}-\d{2}$/
const MAX_YEAR_OFFSET = 2 // Allow syncing up to 2 years back

function parseOrderPeriod(value: string): { start: Date; end: Date } | null {
  const trimmed = value.trim()
  if (!VALID_PERIOD_REGEX.test(trimmed)) {
    return null
  }

  const [year, month] = trimmed.split("-").map((part) => parseInt(part, 10))
  if (month < 1 || month > 12) {
    return null
  }

  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))

  return { start, end }
}

interface LineItemUpdate {
  lineItemId: string
  productTypeId: string
  quantity: number
  newUnitPrice: Prisma.Decimal
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    const csrfError = await requireCsrf()
    if (csrfError) return csrfError

    const authCheck = requireAdmin(session)
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    const body = await request.json()
    const { orderPeriod } = body

    if (!orderPeriod || typeof orderPeriod !== "string") {
      return NextResponse.json(
        { error: "orderPeriod is required (format: YYYY-MM)" },
        { status: 400 }
      )
    }

    const periodBounds = parseOrderPeriod(orderPeriod)
    if (!periodBounds) {
      return NextResponse.json(
        { error: "Invalid orderPeriod format. Use YYYY-MM (e.g., 2025-12)" },
        { status: 400 }
      )
    }

    // Validate date range (prevent syncing ancient data)
    const now = new Date()
    const twoYearsAgo = new Date(now.getFullYear() - MAX_YEAR_OFFSET, now.getMonth(), 1)
    if (periodBounds.start < twoYearsAgo) {
      return NextResponse.json(
        { error: `Cannot sync data older than ${MAX_YEAR_OFFSET} years` },
        { status: 400 }
      )
    }

    const { start, end } = periodBounds

    // Fetch all products with their current prices
    const products = await prisma.productType.findMany({
      select: {
        id: true,
        unitPrice: true,
      },
    })

    const productPriceMap = new Map<string, Prisma.Decimal>()
    for (const product of products) {
      productPriceMap.set(product.id, product.unitPrice)
    }

    // Fetch all transactions and line items within the period
    const transactions = await prisma.transaction.findMany({
      where: {
        transactionDate: {
          gte: start,
          lte: end,
        },
        transactionType: "PURCHASE",
      },
      select: {
        id: true,
        lineItems: {
          select: {
            id: true,
            productTypeId: true,
            quantity: true,
            unitPrice: true,
          },
        },
      },
    })

    // Collect line items that need updating, grouped by product type for batch updates
    const lineItemsToUpdate: LineItemUpdate[] = []
    const lineItemIdsToUpdate = new Set<string>()

    for (const transaction of transactions) {
      for (const lineItem of transaction.lineItems) {
        const currentProductPrice = productPriceMap.get(lineItem.productTypeId)
        if (!currentProductPrice) {
          continue
        }

        if (!lineItem.unitPrice.equals(currentProductPrice)) {
          lineItemsToUpdate.push({
            lineItemId: lineItem.id,
            productTypeId: lineItem.productTypeId,
            quantity: lineItem.quantity,
            newUnitPrice: currentProductPrice,
          })
          lineItemIdsToUpdate.add(lineItem.id)
        }
      }
    }

    // If no updates needed, return early
    if (lineItemsToUpdate.length === 0) {
      const monthName = new Date(start).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      })
      return NextResponse.json({
        message: `No price updates needed for ${monthName}`,
        period: orderPeriod,
        transactionsAffected: 0,
        lineItemsUpdated: 0,
        totalTransactionsInPeriod: transactions.length,
      })
    }

    // Perform updates in a single transaction
    await prisma.$transaction(async (tx) => {
      // Batch update line items by product type for efficiency
      // Group updates by new unit price (products with same price can be updated together)
      const updatesByPrice = new Map<string, string[]>() // price -> lineItemIds

      for (const item of lineItemsToUpdate) {
        const priceKey = item.newUnitPrice.toString()
        if (!updatesByPrice.has(priceKey)) {
          updatesByPrice.set(priceKey, [])
        }
        updatesByPrice.get(priceKey)!.push(item.lineItemId)
      }

      // Execute batch updates
      for (const [priceStr, ids] of updatesByPrice) {
        const price = new Prisma.Decimal(priceStr)
        for (const lineItem of lineItemsToUpdate) {
          if (ids.includes(lineItem.lineItemId)) {
            const newTotalAmount = price.mul(lineItem.quantity)
            await tx.transactionLineItem.update({
              where: { id: lineItem.lineItemId },
              data: {
                unitPrice: price,
                totalAmount: newTotalAmount,
              },
            })
          }
        }
      }
    })

    const monthName = new Date(start).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    })

    const transactionsAffected = transactions.filter((t) =>
      t.lineItems.some((li) => lineItemIdsToUpdate.has(li.id))
    ).length

    return NextResponse.json({
      message: `Prices synced successfully for ${monthName}`,
      period: orderPeriod,
      transactionsAffected,
      lineItemsUpdated: lineItemsToUpdate.length,
      totalTransactionsInPeriod: transactions.length,
    })
  } catch (error) {
    console.error("Sync prices error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
