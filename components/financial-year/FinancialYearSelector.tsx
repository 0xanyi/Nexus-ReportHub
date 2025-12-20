"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

type FinancialYear = {
  id: string
  label: string
  startDate: string
  endDate: string
  isCurrent: boolean
}

type Props = {
  className?: string
}

export function FinancialYearSelector({ className }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [years, setYears] = useState<FinancialYear[]>([])
  const [loading, setLoading] = useState(true)

  const currentFyParam = searchParams.get("fy")

  const fetchYears = useCallback(async () => {
    try {
      const res = await fetch("/api/financial-years")
      if (res.ok) {
        const data = await res.json()
        setYears(data.financialYears || [])
      }
    } catch {
      // Ignore fetch errors
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchYears()
  }, [fetchYears])

  const currentYear = years.find((y) => y.isCurrent)
  const selectedYear = currentFyParam
    ? years.find((y) => y.label === currentFyParam)
    : currentYear

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    // If selecting the current year, remove the param for cleaner URLs
    if (currentYear && value === currentYear.label) {
      params.delete("fy")
    } else {
      params.set("fy", value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className={className}>
        <div className="h-10 w-32 animate-pulse rounded-md bg-slate-100" />
      </div>
    )
  }

  if (years.length === 0) {
    return null
  }

  // Determine the select value - always use labels for consistency
  const selectValue = selectedYear?.label ?? currentYear?.label ?? ""

  return (
    <div className={className}>
      <Select
        value={selectValue}
        onValueChange={handleChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select year">
            {selectedYear ? (
              <span className="flex items-center gap-2">
                {selectedYear.label}
                {selectedYear.isCurrent && (
                  <Badge variant="secondary" className="text-xs">
                    Current
                  </Badge>
                )}
              </span>
            ) : (
              "Select year"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem
              key={year.id}
              value={year.label}
            >
              <span className="flex items-center gap-2">
                {year.label}
                {year.isCurrent && (
                  <Badge variant="secondary" className="text-xs">
                    Current
                  </Badge>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
