"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Payment = {
  id: string
  paymentDate: Date
  amount: number
  campaignCategory: {
    id: string
    name: string
  } | null
  campaignLabel: string | null
}

interface CampaignBreakdownProps {
  payments: Payment[]
  currency?: string
  zoneCurrency?: string
  title?: string
  description?: string
}

type DateRange = "all" | "year" | "quarter" | "month"

export function CampaignBreakdown({ 
  payments, 
  currency, 
  zoneCurrency = "GBP",
  title = "Campaign Breakdown",
  description = "Monthly contributions per campaign category"
}: CampaignBreakdownProps) {
  // Use zoneCurrency if currency is not provided
  const displayCurrency = currency || zoneCurrency
  const [dateRange, setDateRange] = useState<DateRange>("year")
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedQuarter, setSelectedQuarter] = useState<number>(1)
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)

  // Filter only sponsorship payments
  const campaignPayments = payments.filter((p) => 
    p.campaignCategory !== null || p.campaignLabel !== null
  )

  // Get unique years from payments
  const availableYears = useMemo(() => {
    const years = new Set(
      campaignPayments.map((p) => new Date(p.paymentDate).getFullYear())
    )
    return Array.from(years).sort((a, b) => b - a)
  }, [campaignPayments])

  // Filter payments based on selected date range
  const filteredPayments = useMemo(() => {
    return campaignPayments.filter((p) => {
      const paymentDate = new Date(p.paymentDate)
      const paymentYear = paymentDate.getFullYear()
      const paymentMonth = paymentDate.getMonth() + 1
      const paymentQuarter = Math.ceil(paymentMonth / 3)

      if (dateRange === "all") return true
      if (dateRange === "year") return paymentYear === selectedYear
      if (dateRange === "quarter") {
        return paymentYear === selectedYear && paymentQuarter === selectedQuarter
      }
      if (dateRange === "month") {
        return paymentYear === selectedYear && paymentMonth === selectedMonth
      }
      return true
    })
  }, [campaignPayments, dateRange, selectedYear, selectedQuarter, selectedMonth])

  // Group payments by campaign category
  const campaignGroups = useMemo(() => {
    const groups = new Map<
      string,
      { name: string; payments: Array<{ month: string; amount: number; date: Date }> }
    >()

    filteredPayments.forEach((payment) => {
      const campaignName =
        payment.campaignCategory?.name || payment.campaignLabel || "Uncategorized"
      const monthYear = new Date(payment.paymentDate).toLocaleString("default", {
        month: "long",
        year: "numeric",
      })

      if (!groups.has(campaignName)) {
        groups.set(campaignName, { name: campaignName, payments: [] })
      }

      groups.get(campaignName)!.payments.push({
        month: monthYear,
        amount: payment.amount,
        date: new Date(payment.paymentDate),
      })
    })

    // Sort payments within each group by date
    groups.forEach((group) => {
      group.payments.sort((a, b) => a.date.getTime() - b.date.getTime())
    })

    return groups
  }, [filteredPayments])

  // Group monthly payments for each campaign
  const monthlyBreakdown = useMemo(() => {
    const breakdown = new Map<string, Map<string, number>>()

    campaignGroups.forEach((group, campaignName) => {
      const monthlyTotals = new Map<string, number>()

      group.payments.forEach((payment) => {
        const existing = monthlyTotals.get(payment.month) || 0
        monthlyTotals.set(payment.month, existing + payment.amount)
      })

      breakdown.set(campaignName, monthlyTotals)
    })

    return breakdown
  }, [campaignGroups])

  const getDateRangeLabel = () => {
    if (dateRange === "all") return "All Time"
    if (dateRange === "year") return `${selectedYear}`
    if (dateRange === "quarter") return `Q${selectedQuarter} ${selectedYear}`
    if (dateRange === "month") {
      const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString("default", {
        month: "long",
      })
      return `${monthName} ${selectedYear}`
    }
    return ""
  }

  if (campaignPayments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Campaign Contributions</CardTitle>
          <CardDescription>No campaign contributions recorded yet</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>{title} - {getDateRangeLabel()}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Period</label>
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                  <SelectItem value="quarter">Quarter</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRange !== "all" && (
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm font-medium mb-2 block">Year</label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(v) => setSelectedYear(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {dateRange === "quarter" && (
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm font-medium mb-2 block">Quarter</label>
                <Select
                  value={selectedQuarter.toString()}
                  onValueChange={(v) => setSelectedQuarter(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Q1 (Jan-Mar)</SelectItem>
                    <SelectItem value="2">Q2 (Apr-Jun)</SelectItem>
                    <SelectItem value="3">Q3 (Jul-Sep)</SelectItem>
                    <SelectItem value="4">Q4 (Oct-Dec)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {dateRange === "month" && (
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm font-medium mb-2 block">Month</label>
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(v) => setSelectedMonth(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <SelectItem key={month} value={month.toString()}>
                        {new Date(2024, month - 1).toLocaleString("default", {
                          month: "long",
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Campaign Breakdown Tables */}
      {Array.from(monthlyBreakdown.entries()).map(([campaignName, monthlyData]) => {
        const total = Array.from(monthlyData.values()).reduce((sum, amount) => sum + amount, 0)

        return (
          <Card key={campaignName}>
            <CardHeader>
              <CardTitle className="text-lg">{campaignName}</CardTitle>
              <CardDescription>
                Total: {formatCurrency(total, displayCurrency)} •{" "}
                {Array.from(monthlyData.values()).length} months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold">Month</th>
                      <th className="text-right p-2 font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(monthlyData.entries()).map(([month, amount]) => (
                      <tr key={month} className="border-b hover:bg-muted/50">
                        <td className="p-2">{month}</td>
                        <td className="p-2 text-right font-medium">
                          {formatCurrency(amount, displayCurrency)}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-muted">
                      <td className="p-2">TOTAL</td>
                      <td className="p-2 text-right">{formatCurrency(total, displayCurrency)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {filteredPayments.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No campaign contributions found for the selected period
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
