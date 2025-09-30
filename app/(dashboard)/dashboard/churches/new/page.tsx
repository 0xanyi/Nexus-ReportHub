"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

interface Group {
  id: string
  name: string
  zone: {
    name: string
  }
}

export default function NewChurchPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    groupId: "",
  })

  useEffect(() => {
    fetch("/api/groups")
      .then((res) => res.json())
      .then((data) => setGroups(data))
      .catch((err) => console.error("Failed to load groups:", err))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/churches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to create church")
        setIsLoading(false)
      } else {
        router.push("/dashboard/churches")
        router.refresh()
      }
    } catch (err) {
      setError("An error occurred while creating the church")
      setIsLoading(false)
    }
  }

  const selectedGroup = groups.find((g) => g.id === formData.groupId)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/churches"
          className="text-sm text-primary hover:underline mb-2 inline-block"
        >
          ← Back to Churches
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Add New Church</h2>
        <p className="text-muted-foreground">
          Register a new church in your ministry network
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Church Information</CardTitle>
          <CardDescription>Enter the details for the new church</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="groupId">Group *</Label>
              <select
                id="groupId"
                value={formData.groupId}
                onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Select a group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.zone.name})
                  </option>
                ))}
              </select>
              {selectedGroup && (
                <p className="text-xs text-muted-foreground">
                  Zone: {selectedGroup.zone.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Church Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., LW BIRMINGHAM"
                required
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                Enter the full church name (e.g., LW BIRMINGHAM, LW MANCHESTER)
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Creating..." : "Create Church"}
              </Button>
              <Link href="/dashboard/churches" className="flex-1">
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
