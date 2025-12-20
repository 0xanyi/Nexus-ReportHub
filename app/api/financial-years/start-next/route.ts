import { validateCsrfToken } from "@/lib/csrf"

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getNextFinancialYearBounds } from "@/lib/financialYear"

export async function POST() {
  // Verify CSRF token to prevent cross-site requests
  const csrfValid = await validateCsrfToken()
  if (!csrfValid) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 })
  }

  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ZONE_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const current = await prisma.financialYear.findFirst({
    where: { isCurrent: true },
  })

  if (!current) {
    return NextResponse.json(
      { error: "No current financial year found. Fetch /api/financial-years/current first." },
      { status: 400 }
    )
  }

  const nextBounds = getNextFinancialYearBounds({ endDate: current.endDate })

  const next = await prisma.$transaction(async (tx) => {
    // Step 1: Set all existing FYs to isCurrent: false first
    await tx.financialYear.updateMany({ data: { isCurrent: false } })

    // Step 2: Check if next FY already exists or create it
    const existingNext = await tx.financialYear.findUnique({
      where: { label: nextBounds.label },
    })

    if (existingNext) {
      // Step 3a: If exists, update it to be current
      return tx.financialYear.update({
        where: { id: existingNext.id },
        data: { isCurrent: true },
      })
    }

    // Step 3b: If doesn't exist, create it as current
    return (
      (await tx.financialYear.create({
        data: {
          label: nextBounds.label,
          startDate: nextBounds.startDate,
          endDate: nextBounds.endDate,
          isCurrent: true,
        },
      }))
    )
  })

  return NextResponse.json({ financialYear: next })
}
