"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { DateRangeSelector, type ComparisonMode, type DateRange } from "@/components/ui/date-range-selector"

export function AnalyticsControls() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const comparisonMode = (searchParams.get("mode") as ComparisonMode) || "year-over-year"
  const fromDate = searchParams.get("from") || ""
  const toDate = searchParams.get("to") || ""

  const handleComparisonModeChange = (mode: ComparisonMode) => {
    const params = new URLSearchParams(searchParams.toString())

    if (mode === "year-over-year" || mode === "month-to-month") {
      params.delete("from")
      params.delete("to")
    }

    params.set("mode", mode)
    router.push(`?${params.toString()}`)
  }

  const handleCustomDateRangeChange = (range: DateRange) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("mode", "custom")
    params.set("from", range.from)
    params.set("to", range.to)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="mb-6">
      <DateRangeSelector
        comparisonMode={comparisonMode}
        onComparisonModeChange={handleComparisonModeChange}
        customDateRange={fromDate && toDate ? { from: fromDate, to: toDate } : undefined}
        onCustomDateRangeChange={handleCustomDateRangeChange}
      />
    </div>
  )
}