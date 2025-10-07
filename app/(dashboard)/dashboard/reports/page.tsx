import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { CampaignGivingOverview } from "@/components/analytics/CampaignGivingOverview"
import { PaymentSummaryGenerator } from "@/components/reports/PaymentSummaryGenerator"

export default async function ReportsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  let department

  if (session.user.departmentId) {
    department = await prisma.department.findUnique({
      where: { id: session.user.departmentId },
    })
  } else {
    department = await prisma.department.findFirst()
  }

  if (!department) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Financial Reports</h1>
        <Card className="border-none bg-white/80 shadow-lg shadow-slate-900/5">
          <CardHeader>
            <CardTitle>Department not configured</CardTitle>
            <CardDescription>
              No department found. Please ensure at least one department exists in the system or assign a department to your profile.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Get all churches with their transactions and payments
  const churches = await prisma.church.findMany({
    include: {
      group: {
        include: {
          zone: true,
        },
      },
      transactions: {
        include: {
          lineItems: {
            include: {
              productType: true,
            },
          },
        },
      },
      payments: true,
    },
    orderBy: {
      name: "asc",
    },
  })

  // Calculate summary statistics
  const stats = churches.reduce(
    (acc, church) => {
      // Calculate total purchases
      const totalPurchases = church.transactions.reduce((sum, transaction) => {
        const transactionTotal = transaction.lineItems.reduce(
          (lineSum, item) => lineSum + Number(item.totalAmount),
          0
        )
        return sum + transactionTotal
      }, 0)

      // Calculate total payments
      const totalPayments = church.payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0
      )

      // Calculate balance (negative means church owes money)
      const balance = totalPayments - totalPurchases

      acc.totalChurches++
      acc.totalPurchases += totalPurchases
      acc.totalPayments += totalPayments
      
      if (balance < 0) {
        acc.totalOutstanding += Math.abs(balance)
        acc.churchesWithDebt++
      }

      // Count copies
      church.transactions.forEach((transaction) => {
        transaction.lineItems.forEach((item) => {
          acc.totalCopies += item.quantity
        })
      })

      return acc
    },
    {
      totalChurches: 0,
      totalPurchases: 0,
      totalPayments: 0,
      totalOutstanding: 0,
      totalCopies: 0,
      churchesWithDebt: 0,
    }
  )

  const groupSummaries = Object.values(
    churches.reduce(
      (acc, church) => {
        const groupKey = church.group.id
        const orders = church.transactions.reduce((sum, transaction) => {
          return (
            sum +
            transaction.lineItems.reduce(
              (lineSum, item) => lineSum + Number(item.totalAmount),
              0
            )
          )
        }, 0)

        // PRINTING payments only (for balance calculation)
        const printingPayments = church.payments
          .filter((p) => p.forPurpose === "PRINTING")
          .reduce((sum, payment) => sum + Number(payment.amount), 0)

        // SPONSORSHIP payments (campaigns - separate from balance)
        const campaignPayments = church.payments
          .filter((p) => p.forPurpose === "SPONSORSHIP")
          .reduce((sum, payment) => sum + Number(payment.amount), 0)

        if (!acc[groupKey]) {
          acc[groupKey] = {
            id: church.group.id,
            name: church.group.name,
            zone: church.group.zone.name,
            churches: 0,
            orders: 0,
            payments: 0,
            campaigns: 0,
            outstanding: 0,
          }
        }

        acc[groupKey].churches += 1
        acc[groupKey].orders += orders
        acc[groupKey].payments += printingPayments
        acc[groupKey].campaigns += campaignPayments
        acc[groupKey].outstanding += Math.max(orders - printingPayments, 0)

        return acc
      },
      {} as Record<
        string,
        {
          id: string
          name: string
          zone: string
          churches: number
          orders: number
          payments: number
          campaigns: number
          outstanding: number
        }
      >
    )
  )
    .map((group) => ({
      ...group,
      collectionRate: group.orders > 0 ? (group.payments / group.orders) * 100 : 0,
    }))
    .sort((a, b) => b.payments - a.payments)

  // Get recent transactions
  const recentTransactions = await prisma.transaction.findMany({
    include: {
      church: true,
      lineItems: {
        include: {
          productType: true,
        },
      },
    },
    orderBy: {
      transactionDate: "desc",
    },
    take: 10,
  })

  const overallCollectionRate =
    stats.totalPurchases > 0 ? (stats.totalPayments / stats.totalPurchases) * 100 : 0

  // Get zones with groups for payment summary generator
  const zones = await prisma.zone.findMany({
    include: {
      groups: {
        orderBy: {
          name: "asc",
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  })

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Financial Reports
        </h1>
        <p className="text-sm text-slate-500">
          View consolidated balances, collection rates, and the latest activity across the
          network. Charts now live inside the dedicated analytics workspace.
        </p>
        <Link
          href="/dashboard/analytics"
          className="inline-flex w-fit items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          Jump to Analytics
        </Link>
      </div>

      <PaymentSummaryGenerator zones={zones} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-none bg-gradient-to-br from-emerald-500/15 via-emerald-400/5 to-teal-500/15 shadow-lg shadow-emerald-500/10">
          <CardHeader className="space-y-3">
            <CardTitle className="text-sm font-medium text-emerald-900">
              Active Churches
            </CardTitle>
            <CardDescription className="text-xs text-emerald-900/70">
              {stats.churchesWithDebt} currently have outstanding balances
            </CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-emerald-900">
            {stats.totalChurches}
          </CardContent>
        </Card>
        <Card className="border-none bg-white/70 shadow-lg shadow-slate-900/5">
          <CardHeader className="space-y-3">
            <CardTitle className="text-sm font-medium text-slate-700">
              Purchase Volume
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {stats.totalCopies.toLocaleString()} copies distributed overall
            </CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">
            {formatCurrency(stats.totalPurchases, "GBP")}
          </CardContent>
        </Card>
        <Card className="border-none bg-white/70 shadow-lg shadow-slate-900/5">
          <CardHeader className="space-y-3">
            <CardTitle className="text-sm font-medium text-slate-700">
              Payments Received
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Collection rate {overallCollectionRate.toFixed(1)}%
            </CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">
            {formatCurrency(stats.totalPayments, "GBP")}
          </CardContent>
        </Card>
        <Card className="border-none bg-gradient-to-br from-rose-500/15 via-rose-400/10 to-orange-500/15 shadow-lg shadow-rose-500/10">
          <CardHeader className="space-y-3">
            <CardTitle className="text-sm font-medium text-rose-900">
              Outstanding Balance
            </CardTitle>
            <CardDescription className="text-xs text-rose-900/70">
              Amount due across all congregations
            </CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-rose-900">
            {formatCurrency(stats.totalOutstanding, "GBP")}
          </CardContent>
        </Card>
      </div>

      <CampaignGivingOverview departmentId={department.id} />

      <Card className="border-none bg-white/80 shadow-lg shadow-slate-900/5">
        <CardHeader>
          <CardTitle>Group Performance</CardTitle>
          <CardDescription>
            Benchmark payments and outstanding balances by ministry group
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-3 pr-4 font-medium">Group</th>
                  <th className="py-3 pr-4 font-medium">Zone</th>
                  <th className="py-3 pr-4 font-medium text-right">Churches</th>
                  <th className="py-3 pr-4 font-medium text-right">Orders</th>
                  <th className="py-3 pr-4 font-medium text-right">Payments</th>
                  <th className="py-3 pr-4 font-medium text-right">Campaigns</th>
                  <th className="py-3 pr-4 font-medium text-right">Outstanding</th>
                  <th className="py-3 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groupSummaries.map((group) => (
                  <tr key={group.id} className="transition hover:bg-slate-50/80">
                    <td className="py-3 pr-4 font-medium text-slate-800">{group.name}</td>
                    <td className="py-3 pr-4 text-slate-500">{group.zone}</td>
                    <td className="py-3 pr-4 text-right text-slate-500">{group.churches}</td>
                    <td className="py-3 pr-4 text-right text-slate-800">
                      {formatCurrency(group.orders, "GBP")}
                    </td>
                    <td className="py-3 pr-4 text-right text-slate-800">
                      {formatCurrency(group.payments, "GBP")}
                    </td>
                    <td className="py-3 pr-4 text-right text-slate-800">
                      {formatCurrency(group.campaigns, "GBP")}
                    </td>
                    <td className="py-3 pr-4 text-right font-medium text-rose-600">
                      {formatCurrency(group.outstanding, "GBP")}
                    </td>
                    <td className="py-3 text-center">
                      <Link href={`/dashboard/groups/${group.id}`}>
                        <button className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
                          View Details
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none bg-white/70 shadow-lg shadow-slate-900/5">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Latest 10 transactions across all churches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm shadow-slate-900/5 transition hover:border-slate-300"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium text-slate-800">{transaction.church.name}</div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                    {new Date(transaction.transactionDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-end justify-between gap-4 text-sm">
                  <div className="flex flex-wrap gap-2 text-slate-500">
                    {transaction.lineItems.map((item) => (
                      <span key={item.id}>
                        {item.quantity}x {item.productType.name}
                      </span>
                    ))}
                  </div>
                  <div className="text-right text-sm font-semibold text-slate-800">
                    {formatCurrency(
                      transaction.lineItems.reduce(
                        (sum, item) => sum + Number(item.totalAmount),
                        0
                      ),
                      transaction.currency
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
