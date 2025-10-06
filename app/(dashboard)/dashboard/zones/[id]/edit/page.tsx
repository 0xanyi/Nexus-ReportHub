"use client"

import { useState, useEffect } from "react"
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

interface Zone {
  id: string
  name: string
  currency: string
  _count: {
    groups: number
  }
}

export default function EditZonePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string | null>(null)
  const [zone, setZone] = useState<Zone | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    currency: "GBP",
  })

  useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id)

      fetch(`/api/zones/${resolvedParams.id}`)
        .then((res) => res.json())
        .then((data) => {
          setZone(data)
          setFormData({
            name: data.name,
            currency: data.currency,
          })
        })
        .catch((err) => console.error("Failed to load zone:", err))
    })
  }, [params])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return

    setError("")

    if (!formData.name.trim()) {
      setError("Zone name is required")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/zones/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to update zone")
        setIsLoading(false)
      } else {
        router.push("/dashboard/zones")
        router.refresh()
      }
    } catch {
      setError("An error occurred while updating the zone")
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    if (!id || !zone) return

    if (zone._count.groups > 0) {
      setError("Cannot delete zone with existing groups. Please remove all groups first.")
      return
    }

    if (!confirm(`Are you sure you want to delete "${zone.name}"? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    setError("")

    try {
      const response = await fetch(`/api/zones/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to delete zone")
        setIsDeleting(false)
      } else {
        router.push("/dashboard/zones")
        router.refresh()
      }
    } catch {
      setError("An error occurred while deleting the zone")
      setIsDeleting(false)
    }
  }

  if (!zone) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
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
        <h2 className="text-3xl font-bold tracking-tight">Edit Zone</h2>
        <p className="text-muted-foreground">Update zone information</p>
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
              Update the zone name and default currency
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
                {zone._count.groups} group(s) in this zone
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
            {isLoading ? "Saving Changes..." : "Save Changes"}
          </Button>
          <Link href="/dashboard/zones" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
        </div>

        {zone._count.groups === 0 && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Permanently delete this zone. This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Zone"}
              </Button>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  )
}
