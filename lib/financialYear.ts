import type { PrismaClient } from "@prisma/client"
export type FinancialYearBounds = {
  label: string
  startDate: Date
  endDate: Date
}

/**
 * Get the start and end dates for a financial year (Dec 1 → Nov 30).
 * 
 * Examples:
 * - Dec 1, 2024 is in FY2025 (ends Nov 30, 2025)
 * - Nov 30, 2025 is in FY2025 (ends Nov 30, 2025)
 * - Dec 1, 2025 is in FY2026 (ends Nov 30, 2026)
 * 
 * All dates are in UTC.
 */
function startOfUtcDay(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day, 0, 0, 0, 0))
}

function endOfUtcDay(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day, 23, 59, 59, 999))
}

export function getFinancialYearBounds(referenceDate: Date): FinancialYearBounds {
  const year = referenceDate.getUTCFullYear()
  const monthIndex = referenceDate.getUTCMonth()

  const endYear = monthIndex >= 11 ? year + 1 : year
  const startYear = endYear - 1

  const startDate = startOfUtcDay(startYear, 11, 1)
  const endDate = endOfUtcDay(endYear, 10, 30)

  return {
    label: `FY${endYear}`,
    startDate,
    endDate,
  }
}

export function getNextFinancialYearBounds(currentYear: {
  endDate: Date
}): FinancialYearBounds {
  const currentEndYear = currentYear.endDate.getUTCFullYear()
  return {
    label: `FY${currentEndYear + 1}`,
    startDate: startOfUtcDay(currentEndYear, 11, 1),
    endDate: endOfUtcDay(currentEndYear + 1, 10, 30),
  }
}

export function getResetConfirmationText(fyLabel: string): string {
  return `RESET ${fyLabel}`
}

/**
 * Validate FY label format (e.g., "FY2025")
 */
const FY_LABEL_PATTERN = /^FY\d{4}$/

export function isValidFYLabel(label: string): boolean {
  return FY_LABEL_PATTERN.test(label)
}

export async function getFinancialYearFromParam(
  fyLabel: string | undefined,
  prisma: Pick<PrismaClient, "financialYear">
): Promise<{ startDate: Date; endDate: Date; label: string } | null> {
  // Validate input format before querying
  if (fyLabel && isValidFYLabel(fyLabel)) {
    const fy = await prisma.financialYear.findFirst({
      where: { label: fyLabel },
    })
    if (fy) {
      return { startDate: fy.startDate, endDate: fy.endDate, label: fy.label }
    }
  }

  const current = await prisma.financialYear.findFirst({
    where: { isCurrent: true },
  })

  if (current) {
    return { startDate: current.startDate, endDate: current.endDate, label: current.label }
  }

  const bounds = getFinancialYearBounds(new Date())
  return bounds
}

/**
 * Resolved FY bounds with guaranteed non-null values.
 * Use this in pages to avoid repeating the same resolution logic.
 */
export type ResolvedFYBounds = {
  startDate: Date
  endDate: Date
  label: string
}

/**
 * Resolve FY bounds from a search param, with proper fallbacks.
 * Centralizes the repeated pattern across all pages.
 */
export async function resolveFYFromSearchParams(
  fyParam: string | undefined,
  prisma: Pick<PrismaClient, "financialYear">
): Promise<ResolvedFYBounds> {
  const fyBounds = await getFinancialYearFromParam(fyParam, prisma)
  
  if (fyBounds) {
    return fyBounds
  }
  
  // Fallback to calculated FY bounds (Dec 1 - Nov 30), not calendar year
  const calculatedBounds = getFinancialYearBounds(new Date())
  return {
    startDate: calculatedBounds.startDate,
    endDate: calculatedBounds.endDate,
    label: calculatedBounds.label,
  }
}
