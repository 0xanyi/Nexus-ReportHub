import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChurchListView } from "@/components/ChurchListView"
import { ChurchBulkUpload } from "@/components/churches/BulkUpload"

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
      transactions: {
        include: {
          lineItems: true,
        },
      },
      payments: true,
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

  // Calculate financial data for each church
  const churchesWithFinancials = churches.map((church) => {
    const totalPurchases = church.transactions.reduce((sum, transaction) => {
      return (
        sum +
        transaction.lineItems.reduce((lineSum, item) => lineSum + Number(item.totalAmount), 0)
      )
    }, 0)

    const totalPayments = church.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)

    const balance = totalPayments - totalPurchases

    return {
      id: church.id,
      name: church.name,
      group: church.group,
      _count: church._count,
      totalPurchases,
      totalPayments,
      balance,
    }
  })

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
          <div className="flex gap-2">
            <ChurchBulkUpload />
            <Link href="/dashboard/churches/new">
              <Button>Add New Church</Button>
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Active Churches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {churches.filter((c) => c._count.transactions > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">With transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {churches.reduce((sum, c) => sum + c._count.transactions, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Churches with Debt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {churchesWithFinancials.filter((c) => c.balance < 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Church List */}
      <ChurchListView churches={churchesWithFinancials} isAdmin={isAdmin} />
    </div>
  )
}
