"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

const CURRENCIES = [
  { code: "GBP", name: "British Pound (£)" },
  { code: "USD", name: "US Dollar ($)" },
  { code: "EUR", name: "Euro (€)" },
  { code: "NGN", name: "Nigerian Naira (₦)" },
]

export default function NewZonePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    currency: "GBP",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!formData.name.trim()) {
      setError("Zone name is required")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to create zone")
        setIsLoading(false)
      } else {
        router.push("/dashboard/zones")
        router.refresh()
      }
    } catch {
      setError("An error occurred while creating the zone")
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/zones"
          className="text-sm text-primary hover:underline mb-2 inline-block"
        >
          ← Back to Zones
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Add New Zone</h2>
        <p className="text-muted-foreground">Create a new organizational zone</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Zone Details</CardTitle>
            <CardDescription>
              Enter the zone name and select the default currency
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Zone Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., UK ZONE 1, US ZONE 2"
                required
              />
              <p className="text-sm text-muted-foreground">
                Enter a descriptive name for the zone
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency *</Label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-muted-foreground">
                This will be the default currency for all transactions in this zone
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? "Creating Zone..." : "Create Zone"}
          </Button>
          <Link href="/dashboard/zones" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
