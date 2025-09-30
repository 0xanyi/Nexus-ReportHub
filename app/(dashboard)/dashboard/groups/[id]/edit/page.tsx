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
    id: string
    name: string
  }
}

export default function EditGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string | null>(null)
  const [group, setGroup] = useState<Group | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")
  const [name, setName] = useState("")

  useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id)
      fetch(`/api/groups/${resolvedParams.id}`)
        .then((res) => res.json())
        .then((data) => {
          setGroup(data)
          setName(data.name)
        })
        .catch((err) => console.error("Failed to load group:", err))
    })
  }, [params])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/groups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to update group")
        setIsLoading(false)
      } else {
        router.push("/dashboard/groups")
        router.refresh()
      }
    } catch (err) {
      setError("An error occurred while updating the group")
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    if (!id || !confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    setError("")

    try {
      const response = await fetch(`/api/groups/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to delete group")
        setIsDeleting(false)
      } else {
        router.push("/dashboard/groups")
        router.refresh()
      }
    } catch (err) {
      setError("An error occurred while deleting the group")
      setIsDeleting(false)
    }
  }

  if (!group) {
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
          href="/dashboard/groups"
          className="text-sm text-primary hover:underline mb-2 inline-block"
        >
          ← Back to Groups
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Edit Group</h2>
        <p className="text-muted-foreground">
          Update group information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Group Information</CardTitle>
          <CardDescription>
            Zone: {group.zone.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Group Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., UK MIDLANDS GROUP"
                required
                maxLength={100}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Saving..." : "Save Changes"}
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

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete this group. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Group"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
