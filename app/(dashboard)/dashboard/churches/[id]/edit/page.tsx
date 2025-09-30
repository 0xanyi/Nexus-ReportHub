"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

interface Church {
  id: string
  name: string
  group: {
    id: string
    name: string
    zone: {
      name: string
    }
  }
}

interface Group {
  id: string
  name: string
  zone: {
    name: string
  }
}

export default function EditChurchPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string | null>(null)
  const [church, setChurch] = useState<Church | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    groupId: "",
  })

  useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id)
      
      // Load church data
      fetch(`/api/churches/${resolvedParams.id}`)
        .then((res) => res.json())
        .then((data) => {
          setChurch(data)
          setFormData({
            name: data.name,
            groupId: data.group.id,
          })
        })
        .catch((err) => console.error("Failed to load church:", err))

      // Load groups
      fetch("/api/groups")
        .then((res) => res.json())
        .then((data) => setGroups(data))
        .catch((err) => console.error("Failed to load groups:", err))
    })
  }, [params])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/churches/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to update church")
        setIsLoading(false)
      } else {
        router.push(`/dashboard/churches/${id}`)
        router.refresh()
      }
    } catch (err) {
      setError("An error occurred while updating the church")
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    if (!id || !confirm("Are you sure you want to delete this church? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    setError("")

    try {
      const response = await fetch(`/api/churches/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to delete church")
        setIsDeleting(false)
      } else {
        router.push("/dashboard/churches")
        router.refresh()
      }
    } catch (err) {
      setError("An error occurred while deleting the church")
      setIsDeleting(false)
    }
  }

  if (!church) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const selectedGroup = groups.find((g) => g.id === formData.groupId)
  const isGroupChanged = formData.groupId !== church.group.id

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href={`/dashboard/churches/${id}`}
          className="text-sm text-primary hover:underline mb-2 inline-block"
        >
          ← Back to Church Details
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Edit Church</h2>
        <p className="text-muted-foreground">
          Update church information and move between groups
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Church Information</CardTitle>
          <CardDescription>
            Current Group: {church.group.name} ({church.group.zone.name})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {isGroupChanged && (
              <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
                <strong>Warning:</strong> You are moving this church to a different group. 
                All transaction history will remain associated with this church.
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
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
              <Link href={`/dashboard/churches/${id}`} className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete this church. This action cannot be undone and is only 
            possible if the church has no transactions or payments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Church"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
