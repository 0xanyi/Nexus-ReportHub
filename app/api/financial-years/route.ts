import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/financial-years
 * 
 * Returns all financial years ordered by start date descending.
 * Includes record counts for each year using optimized batch queries.
 */
export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const financialYears = await prisma.financialYear.findMany({
    orderBy: { startDate: "desc" },
  })

  if (financialYears.length === 0) {
    return NextResponse.json({ financialYears: [] })
  }

  // Build date range conditions for all years at once
  const dateRanges = financialYears.map((fy) => ({
    gte: fy.startDate,
    lte: fy.endDate,
  }))

  // Batch count queries - one per table instead of N per table
  const [transactionCounts, paymentCounts, uploadCounts] = await Promise.all([
    Promise.all(
      dateRanges.map((range) =>
        prisma.transaction.count({
          where: { transactionDate: range },
        })
      )
    ),
    Promise.all(
      dateRanges.map((range) =>
        prisma.payment.count({
          where: { paymentDate: range },
        })
      )
    ),
    Promise.all(
      dateRanges.map((range) =>
        prisma.uploadHistory.count({
          where: { uploadedAt: range },
        })
      )
    ),
  ])

  const yearsWithCounts = financialYears.map((fy, index) => ({
    ...fy,
    transactionCount: transactionCounts[index],
    paymentCount: paymentCounts[index],
    uploadCount: uploadCounts[index],
  }))

  return NextResponse.json({ financialYears: yearsWithCounts })
}
