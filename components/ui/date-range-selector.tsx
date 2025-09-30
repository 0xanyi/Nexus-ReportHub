"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type ComparisonMode = "year-over-year" | "month-to-month" | "custom"

export interface DateRange {
  from: string // YYYY-MM-DD format
  to: string   // YYYY-MM-DD format
}

export interface DateRangeSelectorProps {
  comparisonMode: ComparisonMode
  onComparisonModeChange: (mode: ComparisonMode) => void
  customDateRange?: DateRange
  onCustomDateRangeChange?: (range: DateRange) => void
  className?: string
}

export function DateRangeSelector({
  comparisonMode,
  onComparisonModeChange,
  customDateRange,
  onCustomDateRangeChange,
  className,
}: DateRangeSelectorProps) {
  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onCustomDateRangeChange && customDateRange) {
      onCustomDateRangeChange({
        ...customDateRange,
        from: e.target.value,
      })
    }
  }

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onCustomDateRangeChange && customDateRange) {
      onCustomDateRangeChange({
        ...customDateRange,
        to: e.target.value,
      })
    }
  }

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="flex items-center gap-2">
        <Label htmlFor="comparison-mode" className="text-sm font-medium">
          Compare:
        </Label>
        <select
          id="comparison-mode"
          value={comparisonMode}
          onChange={(e) => onComparisonModeChange(e.target.value as ComparisonMode)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="year-over-year">Year over Year</option>
          <option value="month-to-month">Month to Month</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      {comparisonMode === "custom" && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="from-date" className="text-sm">
              From:
            </Label>
            <Input
              id="from-date"
              type="date"
              value={customDateRange?.from || ""}
              onChange={handleFromDateChange}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-1">
            <Label htmlFor="to-date" className="text-sm">
              To:
            </Label>
            <Input
              id="to-date"
              type="date"
              value={customDateRange?.to || ""}
              onChange={handleToDateChange}
              className="w-40"
            />
          </div>
        </div>
      )}
    </div>
  )
}