"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { formatDate } from "@/lib/utils"
import { getResetConfirmationText, getNextFinancialYearBounds } from "@/lib/financialYear"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
type FinancialYear = {
  id: string
  label: string
  startDate: string | Date
  endDate: string | Date
  isCurrent: boolean
}

type FinancialYearWithCounts = FinancialYear & {
  transactionCount: number
  paymentCount: number
  uploadCount: number
}

type ResetPreview = {
  payments: number
  transactions: number
  uploads: number
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })

  const payload = (await res.json().catch(() => ({}))) as unknown

  if (!res.ok) {
    const error =
      typeof payload === "object" && payload && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `Request failed (${res.status})`
    throw new Error(error)
  }

  // Validate payload shape to prevent type mismatches
  if (!payload || typeof payload !== "object") {
    throw new Error(`Invalid response format from ${url}`)
  }

  return payload as T
}

export default function FinancialYearManager({
  initialCurrent,
}: {
  initialCurrent: FinancialYear | null
}) {
  const [current, setCurrent] = useState<FinancialYear | null>(initialCurrent)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetConfirmation, setResetConfirmation] = useState("")
  const [preview, setPreview] = useState<ResetPreview | null>(null)
  const [advanceConfirmation, setAdvanceConfirmation] = useState("")
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false)
  const [allYears, setAllYears] = useState<FinancialYearWithCounts[]>([])
  const [loadingYears, setLoadingYears] = useState(false)

  const expectedConfirmation = useMemo(() => {
    if (!current) return ""
    return getResetConfirmationText(current.label)
  }, [current])

  const nextYearBounds = useMemo(() => {
    if (!current) return null
    return getNextFinancialYearBounds({ endDate: new Date(current.endDate) })
  }, [current])

  const advanceExpectedConfirmation = useMemo(() => {
    if (!nextYearBounds) return ""
    return `START ${nextYearBounds.label}`
  }, [nextYearBounds])

  const fetchAllYears = useCallback(async () => {
    setLoadingYears(true)
    try {
      const res = await fetchJson<{ financialYears: FinancialYearWithCounts[] }>(
        "/api/financial-years"
      )
      setAllYears(res.financialYears)
    } catch {
      // Ignore errors for now
    } finally {
      setLoadingYears(false)
    }
  }, [])

  useEffect(() => {
    if (current) return

    let isMounted = true
    void (async () => {
      try {
        const result = await fetchJson<{ financialYear: FinancialYear }>(
          "/api/financial-years/current"
        )
        if (isMounted) setCurrent(result.financialYear)
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : "Failed to load financial year")
      }
    })()

    return () => {
      isMounted = false
    }
  }, [current])

  useEffect(() => {
    void fetchAllYears()
  }, [fetchAllYears, current])

  useEffect(() => {
    if (!current) return

    let isMounted = true
    void (async () => {
      try {
        const res = await fetchJson<{
          preview: ResetPreview
        }>(`/api/financial-years/${current.id}/preview-reset`)
        if (isMounted) setPreview(res.preview)
      } catch {
        if (isMounted) setPreview(null)
      }
    })()

    return () => {
      isMounted = false
    }
  }, [current])

  const handleSetCurrent = async (yearId: string) => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetchJson<{ financialYear: FinancialYear }>(
        `/api/financial-years/${yearId}/set-current`,
        { method: "POST" }
      )
      setCurrent(res.financialYear)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set financial year")
    } finally {
      setLoading(false)
    }
  }

  const handleAdvanceYear = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetchJson<{ financialYear: FinancialYear }>(
        "/api/financial-years/start-next",
        { method: "POST" }
      )
      setCurrent(res.financialYear)
      setAdvanceConfirmation("")
      setShowAdvanceDialog(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start next financial year")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Financial Year</h2>
        <p className="text-muted-foreground">
          Manage the reporting year (Dec → Nov). Reset will delete all orders and payments in the
          selected financial year.
        </p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4 text-sm text-red-800">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current Financial Year</CardTitle>
          <CardDescription>These bounds are used for dashboard filtering and resets.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {current ? (
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Label:</span>
                <span className="ml-2 font-medium">{current.label}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Range:</span>
                <span className="ml-2 font-medium">
                  {formatDate(new Date(current.startDate))} → {formatDate(new Date(current.endDate))}
                </span>
              </div>
              {preview && (
                <div className="pt-2 text-xs text-muted-foreground">
                  Reset will delete: {preview.transactions} orders, {preview.payments} payments, and
                  {" "}
                  {preview.uploads} upload history records.
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              disabled={!current || loading}
              onClick={() => setShowAdvanceDialog(true)}
            >
              Start Next Financial Year
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advance Year Confirmation Dialog */}
      <Dialog open={showAdvanceDialog} onOpenChange={setShowAdvanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-amber-700">Advance Financial Year</DialogTitle>
            <DialogDescription>
              This action will advance the system to a new financial year. All new data will be
              associated with the new year. This is a significant change.
            </DialogDescription>
          </DialogHeader>

          {nextYearBounds && (
            <div className="space-y-3 py-2">
              <div className="rounded-lg bg-amber-50 p-4 text-sm">
                <p className="font-medium text-amber-800">You are about to start:</p>
                <p className="mt-1 text-amber-700">
                  <span className="font-semibold">{nextYearBounds.label}</span>
                  {" "}({formatDate(nextYearBounds.startDate)} → {formatDate(nextYearBounds.endDate)})
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm">
                  Type{" "}
                  <span className="font-mono font-semibold">{advanceExpectedConfirmation}</span>
                  {" "}to confirm.
                </p>
                <Input
                  value={advanceConfirmation}
                  onChange={(e) => setAdvanceConfirmation(e.target.value)}
                  placeholder={advanceExpectedConfirmation}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAdvanceDialog(false)
                setAdvanceConfirmation("")
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              disabled={loading || advanceConfirmation !== advanceExpectedConfirmation}
              onClick={() => void handleAdvanceYear()}
            >
              {loading ? "Processing..." : "Confirm Advance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* All Financial Years Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Financial Years</CardTitle>
          <CardDescription>
            View and manage all historical financial years. Set any year as current to roll back.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingYears ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : allYears.length === 0 ? (
            <p className="text-sm text-muted-foreground">No financial years found.</p>
          ) : (
            <div className="space-y-3">
              {allYears.map((fy) => (
                <div
                  key={fy.id}
                  className="rounded-lg border p-4"
                >
                  <div className="flex justify-between items-center">
                    <div className="font-medium">
                      {fy.label}
                      {fy.isCurrent && (
                        <Badge className="ml-2" variant="default">
                          Current
                        </Badge>
                      )}
                    </div>
                    {!fy.isCurrent && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loading}
                        onClick={() => void handleSetCurrent(fy.id)}
                      >
                        Set as Current
                      </Button>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(new Date(fy.startDate))} → {formatDate(new Date(fy.endDate))}
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="text-center">{fy.transactionCount}</div>
                    <div className="text-center">{fy.paymentCount}</div>
                    <div className="text-center">{fy.uploadCount}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-700">Reset Financial Year</CardTitle>
          <CardDescription>
            This is destructive and will permanently delete all orders and payments within this
            financial year.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm">
              Type <span className="font-mono font-semibold">{expectedConfirmation || "RESET FY"}</span>
              {" "}
              to confirm.
            </p>
            <Input
              value={resetConfirmation}
              onChange={(e) => setResetConfirmation(e.target.value)}
              placeholder={expectedConfirmation}
              disabled={!current || loading}
            />
          </div>

          <Button
            variant="destructive"
            disabled={!current || loading || resetConfirmation !== expectedConfirmation}
            onClick={() => {
              if (!current) return
              setError(null)
              setLoading(true)
              void (async () => {
                try {
                  await fetchJson<{
                    paymentsDeleted: number
                    transactionsDeleted: number
                    uploadsDeleted: number
                  }>(`/api/financial-years/${current.id}/reset`, {
                    method: "POST",
                    body: JSON.stringify({ confirmation: resetConfirmation }),
                  })

                  const refreshed = await fetchJson<{ financialYear: FinancialYear }>(
                    "/api/financial-years/current"
                  )
                  setCurrent(refreshed.financialYear)
                  setResetConfirmation("")
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed to reset financial year")
                } finally {
                  setLoading(false)
                }
              })()
            }}
          >
            Reset This Financial Year
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
