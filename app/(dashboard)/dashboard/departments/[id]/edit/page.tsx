"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"

interface Department {
  id: string
  name: string
  description: string | null
  _count: {
    productTypes: number
    transactions: number
    payments: number
    users: number
  }
}

export default function EditDepartmentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string | null>(null)
  const [department, setDepartment] = useState<Department | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id)
      
      fetch(`/api/departments/${resolvedParams.id}`)
        .then((res) => res.json())
        .then((data) => {
          setDepartment(data)
          setFormData({
            name: data.name,
            description: data.description || "",
          })
        })
        .catch((err) => console.error("Failed to load department:", err))
    })
  }, [params])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/departments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to update department")
        setIsLoading(false)
      } else {
        router.push(`/dashboard/departments/${id}`)
        router.refresh()
      }
    } catch (err) {
      setError("An error occurred while updating the department")
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    if (!id || !department) return

    const hasDependencies = 
      department._count.productTypes > 0 ||
      department._count.transactions > 0 ||
      department._count.payments > 0 ||
      department._count.users > 0

    if (hasDependencies) {
      setError(
        "Cannot delete department with existing products, transactions, payments, or users. " +
        "Please remove or reassign these items first."
      )
      return
    }

    if (!confirm("Are you sure you want to delete this department? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    setError("")

    try {
      const response = await fetch(`/api/departments/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to delete department")
        setIsDeleting(false)
      } else {
        router.push("/dashboard/departments")
        router.refresh()
      }
    } catch (err) {
      setError("An error occurred while deleting the department")
      setIsDeleting(false)
    }
  }

  if (!department) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const canDelete = 
    department._count.productTypes === 0 &&
    department._count.transactions === 0 &&
    department._count.payments === 0 &&
    department._count.users === 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href={`/dashboard/departments/${id}`}
          className="text-sm text-primary hover:underline mb-2 inline-block"
        >
          ← Back to Department Details
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Edit Department</h2>
        <p className="text-muted-foreground">
          Update department information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department Information</CardTitle>
          <CardDescription>
            {department._count.productTypes} products, {department._count.users} users, {department._count.transactions} transactions
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
              <Label htmlFor="name">Department Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., UK ZONE 1 DSP"
                required
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the department's purpose..."
                rows={4}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
              <Link href={`/dashboard/departments/${id}`} className="flex-1">
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
            {canDelete
              ? "Permanently delete this department. This action cannot be undone."
              : "Cannot delete department with existing products, transactions, payments, or users."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || !canDelete}
          >
            {isDeleting ? "Deleting..." : "Delete Department"}
          </Button>
          {!canDelete && (
            <p className="text-sm text-muted-foreground mt-2">
              This department has {department._count.productTypes} product(s), {department._count.users} user(s), 
              {department._count.transactions} transaction(s), and {department._count.payments} payment(s).
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
