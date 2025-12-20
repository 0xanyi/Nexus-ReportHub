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

export async function getFinancialYearFromParam(
  fyLabel: string | undefined,
  prisma: { financialYear: { findFirst: (args: { where: object }) => Promise<{ id: string; label: string; startDate: Date; endDate: Date; isCurrent: boolean } | null> } }
): Promise<{ startDate: Date; endDate: Date; label: string } | null> {
  if (fyLabel) {
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
