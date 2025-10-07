"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PaymentSummaryReport } from "./PaymentSummaryReport"
import { PaymentSummaryData, ReportLevel, TimePeriod } from "@/lib/payment-summary"
import { Loader2 } from "lucide-react"

interface Zone {
  id: string
  name: string
  groups: Array<{ id: string; name: string }>
}

interface PaymentSummaryGeneratorProps {
  zones: Zone[]
}

export function PaymentSummaryGenerator({ zones }: PaymentSummaryGeneratorProps) {
  const [reportLevel, setReportLevel] = useState<ReportLevel>("ZONE")
  const [selectedZoneId, setSelectedZoneId] = useState<string>("")
  const [selectedGroupId, setSelectedGroupId] = useState<string>("")
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("MONTHLY")
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<PaymentSummaryData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectedZone = zones.find((z) => z.id === selectedZoneId)
  const availableGroups = selectedZone?.groups || []

  // Reset group selection when zone changes
  useEffect(() => {
    setSelectedGroupId("")
  }, [selectedZoneId])

  // Reset selections when report level changes
  useEffect(() => {
    setSelectedZoneId("")
    setSelectedGroupId("")
    setReportData(null)
  }, [reportLevel])

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push(i)
    }
    return years
  }

  const handleGenerateReport = async () => {
    const entityId = reportLevel === "ZONE" ? selectedZoneId : selectedGroupId

    if (!entityId) {
      setError(`Please select a ${reportLevel.toLowerCase()}`)
      return
    }

    setLoading(true)
    setError(null)
    setReportData(null)

    try {
      const params = new URLSearchParams({
        reportLevel,
        entityId,
        timePeriod,
        year: year.toString(),
      })

      const response = await fetch(`/api/reports/payment-summary?${params}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate report")
      }

      const data = await response.json()
      setReportData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-none bg-white/80 shadow-lg shadow-slate-900/5">
        <CardHeader>
          <CardTitle>Generate Payment Summary Report</CardTitle>
          <CardDescription>
            Create comprehensive payment statements for zones or groups showing income breakdown by
            category and period
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reportLevel">Report Level</Label>
              <Select
                value={reportLevel}
                onValueChange={(value) => setReportLevel(value as ReportLevel)}
              >
                <SelectTrigger id="reportLevel">
                  <SelectValue placeholder="Select report level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ZONE">Zone Report</SelectItem>
                  <SelectItem value="GROUP">Group Report</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Zone reports aggregate all groups; Group reports aggregate all churches
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zone">Zone</Label>
              <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
                <SelectTrigger id="zone">
                  <SelectValue placeholder="Select zone" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {reportLevel === "GROUP" && (
              <div className="space-y-2">
                <Label htmlFor="group">Group</Label>
                <Select
                  value={selectedGroupId}
                  onValueChange={setSelectedGroupId}
                  disabled={!selectedZoneId}
                >
                  <SelectTrigger id="group">
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!selectedZoneId && (
                  <p className="text-xs text-slate-500">Select a zone first</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="timePeriod">Time Period</Label>
              <Select
                value={timePeriod}
                onValueChange={(value) => setTimePeriod(value as TimePeriod)}
              >
                <SelectTrigger id="timePeriod">
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monthly (12 months)</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly (4 quarters)</SelectItem>
                  <SelectItem value="YEARLY">Yearly (annual total)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select value={year.toString()} onValueChange={(value) => setYear(parseInt(value))}>
                <SelectTrigger id="year">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {generateYearOptions().map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm font-medium text-rose-900">{error}</p>
            </div>
          )}

          <Button onClick={handleGenerateReport} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Report...
              </>
            ) : (
              "Generate Payment Summary"
            )}
          </Button>
        </CardContent>
      </Card>

      {reportData && <PaymentSummaryReport data={reportData} />}
    </div>
  )
}
