import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ZonesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard")
  }

  const zones = await prisma.zone.findMany({
    include: {
      _count: {
        select: {
          groups: true,
        },
      },
      groups: {
        include: {
          _count: {
            select: {
              churches: true,
            },
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  })

  const totalGroups = zones.reduce((sum, zone) => sum + zone._count.groups, 0)
  const totalChurches = zones.reduce(
    (sum, zone) => sum + zone.groups.reduce((gSum, group) => gSum + group._count.churches, 0),
    0
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Zones</h2>
          <p className="text-muted-foreground">Manage organizational zones and their structure</p>
        </div>
        <Link href="/dashboard/zones/new">
          <Button>Add New Zone</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGroups}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Churches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalChurches}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Zones with Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {zones.filter((z) => z._count.groups > 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Zones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold">Name</th>
                  <th className="text-left p-4 font-semibold">Currency</th>
                  <th className="text-right p-4 font-semibold">Groups</th>
                  <th className="text-right p-4 font-semibold">Churches</th>
                  <th className="text-right p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {zones.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-muted-foreground">
                      No zones found. Create your first zone to get started.
                    </td>
                  </tr>
                ) : (
                  zones.map((zone) => {
                    const churchCount = zone.groups.reduce(
                      (sum, group) => sum + group._count.churches,
                      0
                    )
                    return (
                      <tr key={zone.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">{zone.name}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                            {zone.currency}
                          </span>
                        </td>
                        <td className="p-4 text-right">{zone._count.groups}</td>
                        <td className="p-4 text-right">{churchCount}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/dashboard/zones/${zone.id}/edit`}>
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
