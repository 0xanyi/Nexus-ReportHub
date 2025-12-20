import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ZONE_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  const financialYear = await prisma.financialYear.findUnique({ where: { id } })
  if (!financialYear) {
    return NextResponse.json({ error: "Financial year not found" }, { status: 404 })
  }

  const startDate = financialYear.startDate
  const endDate = financialYear.endDate

  const [payments, transactions, uploads] = await prisma.$transaction([
    prisma.payment.count({
      where: {
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
    prisma.transaction.count({
      where: {
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
    prisma.uploadHistory.count({
      where: {
        uploadedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
  ])

  return NextResponse.json({
    preview: {
      payments,
      transactions,
      uploads,
    },
  })
}
