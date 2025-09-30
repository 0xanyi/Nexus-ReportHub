"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

interface User {
  id: string
  email: string
  name: string
  role: string
  zoneId: string | null
  groupId: string | null
  churchId: string | null
  departmentId: string | null
}

interface Zone {
  id: string
  name: string
}

interface Group {
  id: string
  name: string
  zone: { name: string }
}

interface Church {
  id: string
  name: string
  group: { name: string }
}

interface Department {
  id: string
  name: string
}

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [zones, setZones] = useState<Zone[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [churches, setChurches] = useState<Church[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    role: "CHURCH_USER" as const,
    zoneId: "",
    groupId: "",
    churchId: "",
    departmentId: "",
    password: "",
    confirmPassword: "",
  })

  useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id)

      // Load user data
      fetch(`/api/users/${resolvedParams.id}`)
        .then((res) => res.json())
        .then((data) => {
          setUser(data)
          setFormData({
            name: data.name,
            role: data.role,
            zoneId: data.zoneId || "",
            groupId: data.groupId || "",
            churchId: data.churchId || "",
            departmentId: data.departmentId || "",
            password: "",
            confirmPassword: "",
          })
        })
        .catch((err) => console.error("Failed to load user:", err))

      // Load zones
      fetch("/api/zones")
        .then((res) => res.json())
        .then((data) => setZones(data))
        .catch((err) => console.error("Failed to load zones:", err))

      // Load groups
      fetch("/api/groups")
        .then((res) => res.json())
        .then((data) => setGroups(data))
        .catch((err) => console.error("Failed to load groups:", err))

      // Load churches
      fetch("/api/churches")
        .then((res) => res.json())
        .then((data) => setChurches(data))
        .catch((err) => console.error("Failed to load churches:", err))

      // Load departments
      fetch("/api/products")
        .then((res) => res.json())
        .then((data) => {
          const uniqueDepts: Record<string, Department> = {}
          data.forEach((product: any) => {
            if (product.department) {
              uniqueDepts[product.department.id] = product.department
            }
          })
          setDepartments(Object.values(uniqueDepts))
        })
        .catch((err) => console.error("Failed to load departments:", err))
    })
  }, [params])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return

    setError("")

    // Validate passwords match if provided
    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match")
        return
      }

      if (formData.password.length < 12) {
        setError("Password must be at least 12 characters long")
        return
      }
    }

    setIsLoading(true)

    try {
      const updateData: any = {
        name: formData.name,
        role: formData.role,
        zoneId: formData.zoneId || null,
        groupId: formData.groupId || null,
        churchId: formData.churchId || null,
        departmentId: formData.departmentId || null,
      }

      // Only include password if it's provided
      if (formData.password) {
        updateData.password = formData.password
      }

      const response = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to update user")
        setIsLoading(false)
      } else {
        router.push("/dashboard/users")
        router.refresh()
      }
    } catch (err) {
      setError("An error occurred while updating the user")
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const roleDescriptions = {
    SUPER_ADMIN: "Full system access - can manage all zones, groups, churches, and users",
    ZONE_ADMIN: "Manage a specific zone and all groups/churches within it",
    GROUP_ADMIN: "Manage a specific group and churches within it",
    CHURCH_USER: "View data for a specific church only",
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/users"
          className="text-sm text-primary hover:underline mb-2 inline-block"
        >
          ← Back to Users
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Edit User</h2>
        <p className="text-muted-foreground">
          Update user information, role, and assignments
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Email: {user.email} (cannot be changed)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password (Optional)</CardTitle>
            <CardDescription>
              Leave blank to keep current password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min. 12 characters"
                  minLength={12}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Re-enter new password"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Role Assignment</CardTitle>
            <CardDescription>Define user's access level and permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">User Role *</Label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="CHURCH_USER">Church User</option>
                <option value="GROUP_ADMIN">Group Admin</option>
                <option value="ZONE_ADMIN">Zone Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
              <p className="text-sm text-muted-foreground">
                {roleDescriptions[formData.role]}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Organizational Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Organizational Assignments</CardTitle>
            <CardDescription>Update zone, group, church, or department assignments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="zoneId">Zone</Label>
                <select
                  id="zoneId"
                  value={formData.zoneId}
                  onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">No zone assignment</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="groupId">Group</Label>
                <select
                  id="groupId"
                  value={formData.groupId}
                  onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">No group assignment</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.zone.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="churchId">Church</Label>
                <select
                  id="churchId"
                  value={formData.churchId}
                  onChange={(e) => setFormData({ ...formData, churchId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">No church assignment</option>
                  {churches.map((church) => (
                    <option key={church.id} value={church.id}>
                      {church.name} ({church.group.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="departmentId">Department</Label>
                <select
                  id="departmentId"
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">No department assignment</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? "Saving Changes..." : "Save Changes"}
          </Button>
          <Link href="/dashboard/users" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
