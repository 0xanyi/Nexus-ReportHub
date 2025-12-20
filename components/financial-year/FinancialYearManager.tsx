"use client"

import { useEffect, useMemo, useState } from "react"
import { formatDate } from "@/lib/utils"
import { getResetConfirmationText } from "@/lib/financialYear"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type FinancialYear = {
  id: string
  label: string
  startDate: string | Date
  endDate: string | Date
  isCurrent: boolean
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

  const expectedConfirmation = useMemo(() => {
    if (!current) return ""
    return getResetConfirmationText(current.label)
  }, [current])

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
              onClick={() => {
                setError(null)
                setLoading(true)
                void (async () => {
                  try {
                    const res = await fetchJson<{ financialYear: FinancialYear }>(
                      "/api/financial-years/start-next",
                      { method: "POST" }
                    )
                    setCurrent(res.financialYear)
                    setResetConfirmation("")
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to start next financial year")
                  } finally {
                    setLoading(false)
                  }
                })()
              }}
            >
              Start Next Financial Year
            </Button>
          </div>
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
