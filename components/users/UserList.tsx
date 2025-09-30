"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

interface User {
  id: string
  email: string
  name: string
  role: string
  zoneId: string | null
  groupId: string | null
  churchId: string | null
  departmentId: string | null
  createdAt: Date
  zone: { name: string } | null
  group: { name: string } | null
  church: { name: string } | null
  department: { name: string } | null
}

interface UserListProps {
  users: User[]
  currentUserId: string
}

export function UserList({ users, currentUserId }: UserListProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const roles = ["all", "SUPER_ADMIN", "ZONE_ADMIN", "GROUP_ADMIN", "CHURCH_USER"]

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesRole = selectedRole === "all" || user.role === selectedRole

      return matchesSearch && matchesRole
    })
  }, [users, searchQuery, selectedRole])

  const getRoleBadge = (role: string) => {
    const badges = {
      SUPER_ADMIN: "bg-purple-100 text-purple-800 border-purple-200",
      ZONE_ADMIN: "bg-blue-100 text-blue-800 border-blue-200",
      GROUP_ADMIN: "bg-green-100 text-green-800 border-green-200",
      CHURCH_USER: "bg-gray-100 text-gray-800 border-gray-200",
    }
    return badges[role as keyof typeof badges] || badges.CHURCH_USER
  }

  const handleDelete = async (userId: string, userName: string) => {
    if (userId === currentUserId) {
      alert("You cannot delete your own account!")
      return
    }

    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(userId)

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || "Failed to delete user")
        setIsDeleting(null)
      } else {
        router.refresh()
      }
    } catch {
      alert("An error occurred while deleting the user")
      setIsDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role === "all" ? "All Roles" : role.replace("_", " ")}
                </option>
              ))}
            </select>

            {(searchQuery || selectedRole !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedRole("all")
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Role</th>
                  <th className="text-left p-3 font-medium">Assignments</th>
                  <th className="text-left p-3 font-medium">Created</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <div className="font-medium">{user.name}</div>
                        {user.id === currentUserId && (
                          <span className="text-xs text-muted-foreground">(You)</span>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">{user.email}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium border ${getRoleBadge(
                            user.role
                          )}`}
                        >
                          {user.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-xs space-y-0.5">
                          {user.zone && (
                            <div className="text-muted-foreground">
                              Zone: {user.zone.name}
                            </div>
                          )}
                          {user.group && (
                            <div className="text-muted-foreground">
                              Group: {user.group.name}
                            </div>
                          )}
                          {user.church && (
                            <div className="text-muted-foreground">
                              Church: {user.church.name}
                            </div>
                          )}
                          {user.department && (
                            <div className="text-muted-foreground">
                              Dept: {user.department.name}
                            </div>
                          )}
                          {!user.zone && !user.group && !user.church && !user.department && (
                            <span className="text-muted-foreground italic">No assignments</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/dashboard/users/${user.id}/edit`}>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(user.id, user.name)}
                            disabled={isDeleting === user.id || user.id === currentUserId}
                          >
                            {isDeleting === user.id ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
