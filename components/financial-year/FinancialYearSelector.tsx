"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import useSWR from "swr"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { FinancialYear } from "@/types/financial-year"

type Props = {
  className?: string
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch financial years: ${res.status}`)
  }
  return res.json()
}

export function FinancialYearSelector({ className }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const { data, isLoading } = useSWR<{ financialYears: FinancialYear[] }>(
    "/api/financial-years",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  )

  const currentFyParam = searchParams.get("fy")
  const years = data?.financialYears ?? []

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

  if (isLoading) {
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
