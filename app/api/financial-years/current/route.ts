import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getFinancialYearBounds } from "@/lib/financialYear"

/**
 * GET /api/financial-years/current
 * 
 * Retrieves or auto-creates the current financial year (Dec 1 → Nov 30).
 * 
 * Authorization: All authenticated users can access this endpoint.
 * The current FY is needed by all users for dashboard filtering, so authorization
 * is deliberately permissive. Only SUPER_ADMIN and ZONE_ADMIN can modify FY state
 * via start-next and reset endpoints.
 * 
 * If no current FY exists, this endpoint auto-creates one based on today's date.
 * Only one FY can have isCurrent=true at any time (enforced by transactions).
 */
export async function GET() {
  const existing = await prisma.financialYear.findFirst({
    where: { isCurrent: true },
  })

  if (existing) {
    return NextResponse.json({ financialYear: existing })
  }

  const bounds = getFinancialYearBounds(new Date())

  const created = await prisma.$transaction(async (tx) => {
    await tx.financialYear.updateMany({ data: { isCurrent: false } })

    const already = await tx.financialYear.findUnique({
      where: { label: bounds.label },
    })

    if (already) {
      return tx.financialYear.update({
        where: { id: already.id },
        data: { isCurrent: true },
      })
    }

    return tx.financialYear.create({
      data: {
        label: bounds.label,
        startDate: bounds.startDate,
        endDate: bounds.endDate,
        isCurrent: true,
      },
    })
  })

  return NextResponse.json({ financialYear: created })
}
