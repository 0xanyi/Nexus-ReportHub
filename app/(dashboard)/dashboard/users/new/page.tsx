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

export default function NewUserPage() {
  const router = useRouter()
  const [zones, setZones] = useState<Zone[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [churches, setChurches] = useState<Church[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState<{
    name: string
    email: string
    password: string
    confirmPassword: string
    role: "CHURCH_USER" | "GROUP_ADMIN" | "ZONE_ADMIN" | "SUPER_ADMIN"
    zoneId: string
    groupId: string
    churchId: string
    departmentId: string
  }>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "CHURCH_USER",
    zoneId: "",
    groupId: "",
    churchId: "",
    departmentId: "",
  })

  useEffect(() => {
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

    // Load departments - get from first available zone's department
    fetch("/api/zones")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          // For now, use a hardcoded department list
          // In production, you'd have a dedicated departments API
          setDepartments([
            { id: "dept-1", name: "UK ZONE 1 DSP" },
          ])
        }
      })
      .catch((err) => console.error("Failed to load departments:", err))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    // Validate password strength
    if (formData.password.length < 12) {
      setError("Password must be at least 12 characters long")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          zoneId: formData.zoneId || null,
          groupId: formData.groupId || null,
          churchId: formData.churchId || null,
          departmentId: formData.departmentId || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to create user")
        setIsLoading(false)
      } else {
        router.push("/dashboard/users")
        router.refresh()
      }
    } catch {
      setError("An error occurred while creating the user")
      setIsLoading(false)
    }
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
        <h2 className="text-3xl font-bold tracking-tight">Add New User</h2>
        <p className="text-muted-foreground">
          Create a new user account and assign roles and permissions
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
            <CardDescription>User&rsquo;s personal details and login credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min. 12 characters"
                  required
                  minLength={12}
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 12 characters long
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Re-enter password"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Role Assignment</CardTitle>
            <CardDescription>Define user&rsquo;s access level and permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">User Role *</Label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as "CHURCH_USER" | "GROUP_ADMIN" | "ZONE_ADMIN" | "SUPER_ADMIN" })}
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
            <CardDescription>
              Assign user to specific zone, group, church, or department (optional)
            </CardDescription>
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

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Assignments are optional and can be used to filter data and
                restrict access based on the user&rsquo;s role.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? "Creating User..." : "Create User"}
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
