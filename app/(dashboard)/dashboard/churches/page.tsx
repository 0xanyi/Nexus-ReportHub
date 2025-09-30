import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"

export default async function ChurchesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ZONE_ADMIN"

  const churches = await prisma.church.findMany({
    include: {
      group: {
        include: {
          zone: true,
        },
      },
      _count: {
        select: {
          transactions: true,
          payments: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  })

  // Group churches by their groups
  const churchesByGroup = churches.reduce((acc, church) => {
    const groupName = church.group.name
    if (!acc[groupName]) {
      acc[groupName] = []
    }
    acc[groupName].push(church)
    return acc
  }, {} as Record<string, typeof churches>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Churches</h2>
          <p className="text-muted-foreground">
            View all churches and their transaction summaries
          </p>
        </div>
        {isAdmin && (
          <Link href="/dashboard/churches/new">
            <Button>Add New Church</Button>
          </Link>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Churches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{churches.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(churchesByGroup).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Churches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {churches.filter((c) => c._count.transactions > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">With transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Churches by Group */}
      {Object.entries(churchesByGroup).map(([groupName, groupChurches]) => (
        <Card key={groupName}>
          <CardHeader>
            <CardTitle>{groupName}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {groupChurches.length} churches
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {groupChurches.map((church) => (
                <Link
                  key={church.id}
                  href={`/dashboard/churches/${church.id}`}
                  className="block"
                >
                  <div className="p-4 border rounded-lg hover:border-primary hover:bg-accent transition-colors">
                    <div className="font-medium mb-2">{church.name}</div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{church._count.transactions} transactions</span>
                      <span>{church._count.payments} payments</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
