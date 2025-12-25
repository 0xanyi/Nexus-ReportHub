 import { NextResponse } from "next/server"
 import { Prisma } from "@prisma/client"
 import { auth } from "@/auth"
 import { prisma } from "@/lib/prisma"
 import { requireAdmin } from "@/lib/auth-guards"
 import { requireCsrf } from "@/lib/csrf"
 
 function parseOrderPeriod(value: string): { start: Date; end: Date } | null {
   const trimmed = value.trim()
   if (!/^\d{4}-\d{2}$/.test(trimmed)) {
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
 
     const { start, end } = periodBounds
 
     const products = await prisma.productType.findMany({
       select: {
         id: true,
         name: true,
         unitPrice: true,
       },
     })
 
     const productPriceMap = new Map<string, Prisma.Decimal>()
     for (const product of products) {
       productPriceMap.set(product.id, product.unitPrice)
     }
 
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
 
     let lineItemsUpdated = 0
     let transactionsAffected = 0
 
     for (const transaction of transactions) {
       let transactionModified = false
 
       for (const lineItem of transaction.lineItems) {
         const currentProductPrice = productPriceMap.get(lineItem.productTypeId)
         if (!currentProductPrice) {
           continue
         }
 
         if (!lineItem.unitPrice.equals(currentProductPrice)) {
           const newTotalAmount = currentProductPrice.mul(lineItem.quantity)
 
           await prisma.transactionLineItem.update({
             where: { id: lineItem.id },
             data: {
               unitPrice: currentProductPrice,
               totalAmount: newTotalAmount,
             },
           })
 
           lineItemsUpdated++
           transactionModified = true
         }
       }
 
       if (transactionModified) {
         transactionsAffected++
       }
     }
 
     const monthName = new Date(start).toLocaleDateString("en-GB", {
       month: "long",
       year: "numeric",
     })
 
     return NextResponse.json({
       message: `Prices synced successfully for ${monthName}`,
       period: orderPeriod,
       transactionsAffected,
       lineItemsUpdated,
       totalTransactionsInPeriod: transactions.length,
     })
   } catch (error) {
     console.error("Sync prices error:", error)
     return NextResponse.json({ error: "Internal server error" }, { status: 500 })
   }
 }
