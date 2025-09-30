import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function GroupsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Only admins can manage groups
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ZONE_ADMIN") {
    redirect("/dashboard")
  }

  const groups = await prisma.group.findMany({
    include: {
      zone: true,
      _count: {
        select: {
          churches: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  })

  const zones = await prisma.zone.findMany({
    orderBy: {
      name: "asc",
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Group Management</h2>
          <p className="text-muted-foreground">
            Manage ministry groups within zones
          </p>
        </div>
        <Link href="/dashboard/groups/new">
          <Button>Add New Group</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Zones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{zones.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Churches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {groups.reduce((sum, g) => sum + g._count.churches, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Groups List */}
      <Card>
        <CardHeader>
          <CardTitle>All Groups</CardTitle>
          <CardDescription>View and manage all ministry groups</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Group Name</th>
                  <th className="text-left p-3 font-medium">Zone</th>
                  <th className="text-center p-3 font-medium">Churches</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{group.name}</td>
                    <td className="p-3 text-muted-foreground">{group.zone.name}</td>
                    <td className="p-3 text-center">{group._count.churches}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/dashboard/groups/${group.id}/edit`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Link href={`/dashboard/groups/${group.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
