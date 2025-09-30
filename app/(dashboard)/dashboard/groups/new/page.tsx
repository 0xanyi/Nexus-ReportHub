"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

interface Zone {
  id: string
  name: string
}

export default function NewGroupPage() {
  const router = useRouter()
  const [zones, setZones] = useState<Zone[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    zoneId: "",
  })

  useEffect(() => {
    fetch("/api/zones")
      .then((res) => res.json())
      .then((data) => setZones(data))
      .catch((err) => console.error("Failed to load zones:", err))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to create group")
        setIsLoading(false)
      } else {
        router.push("/dashboard/groups")
        router.refresh()
      }
    } catch (err) {
      setError("An error occurred while creating the group")
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/groups"
          className="text-sm text-primary hover:underline mb-2 inline-block"
        >
          ← Back to Groups
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Add New Group</h2>
        <p className="text-muted-foreground">
          Create a new ministry group within a zone
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Group Information</CardTitle>
          <CardDescription>Enter the details for the new group</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="zoneId">Zone *</Label>
              <select
                id="zoneId"
                value={formData.zoneId}
                onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Select a zone</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Group Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., UK MIDLANDS GROUP"
                required
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                The name of the ministry group within the zone
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Creating..." : "Create Group"}
              </Button>
              <Link href="/dashboard/groups" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
