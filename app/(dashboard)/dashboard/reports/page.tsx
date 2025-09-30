import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"

export default async function ReportsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
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
        const purchases = church.transactions.reduce((sum, transaction) => {
          return (
            sum +
            transaction.lineItems.reduce(
              (lineSum, item) => lineSum + Number(item.totalAmount),
              0
            )
          )
        }, 0)

        const payments = church.payments.reduce(
          (sum, payment) => sum + Number(payment.amount),
          0
        )

        if (!acc[groupKey]) {
          acc[groupKey] = {
            id: church.group.id,
            name: church.group.name,
            zone: church.group.zone.name,
            churches: 0,
            purchases: 0,
            payments: 0,
            outstanding: 0,
          }
        }

        acc[groupKey].churches += 1
        acc[groupKey].purchases += purchases
        acc[groupKey].payments += payments
        acc[groupKey].outstanding += Math.max(purchases - payments, 0)

        return acc
      },
      {} as Record<
        string,
        {
          id: string
          name: string
          zone: string
          churches: number
          purchases: number
          payments: number
          outstanding: number
        }
      >
    )
  )
    .map((group) => ({
      ...group,
      collectionRate: group.purchases > 0 ? (group.payments / group.purchases) * 100 : 0,
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

      <Card className="border-none bg-white/80 shadow-lg shadow-slate-900/5">
        <CardHeader>
          <CardTitle>Group Performance</CardTitle>
          <CardDescription>
            Benchmark payments and outstanding balances by ministry group
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-3 pr-4 font-medium">Group</th>
                  <th className="py-3 pr-4 font-medium">Zone</th>
                  <th className="py-3 pr-4 font-medium text-right">Churches</th>
                  <th className="py-3 pr-4 font-medium text-right">Purchases</th>
                  <th className="py-3 pr-4 font-medium text-right">Payments</th>
                  <th className="py-3 pr-4 font-medium text-right">Outstanding</th>
                  <th className="py-3 font-medium text-right">Collection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groupSummaries.map((group) => (
                  <tr key={group.id} className="transition hover:bg-slate-50/80">
                    <td className="py-3 pr-4 font-medium text-slate-800">{group.name}</td>
                    <td className="py-3 pr-4 text-slate-500">{group.zone}</td>
                    <td className="py-3 pr-4 text-right text-slate-500">{group.churches}</td>
                    <td className="py-3 pr-4 text-right text-slate-800">
                      {formatCurrency(group.purchases, "GBP")}
                    </td>
                    <td className="py-3 pr-4 text-right text-slate-800">
                      {formatCurrency(group.payments, "GBP")}
                    </td>
                    <td className="py-3 pr-4 text-right font-medium text-rose-600">
                      {formatCurrency(group.outstanding, "GBP")}
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={
                          group.collectionRate >= 90
                            ? "rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-600"
                            : group.collectionRate >= 70
                              ? "rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-600"
                              : "rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-600"
                        }
                      >
                        {group.collectionRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none bg-white/90 shadow-xl shadow-slate-900/5">
        <CardHeader>
          <CardTitle>Church Financial Summary</CardTitle>
          <CardDescription>
            Drill-down of purchases, payments, and balances for every church
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50/80">
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3 font-medium">Church</th>
                  <th className="px-3 py-3 font-medium">Group</th>
                  <th className="px-3 py-3 font-medium text-right">Purchases</th>
                  <th className="px-3 py-3 font-medium text-right">Payments</th>
                  <th className="px-3 py-3 font-medium text-right">Balance</th>
                  <th className="px-3 py-3 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {churches.map((church) => {
                  const totalPurchases = church.transactions.reduce((sum, transaction) => {
                    return sum + transaction.lineItems.reduce(
                      (lineSum, item) => lineSum + Number(item.totalAmount),
                      0
                    )
                  }, 0)

                  const totalPayments = church.payments.reduce(
                    (sum, payment) => sum + Number(payment.amount),
                    0
                  )

                  const balance = totalPayments - totalPurchases

                  return (
                    <tr key={church.id} className="transition hover:bg-slate-50/80">
                      <td className="px-3 py-3 font-medium text-slate-800">{church.name}</td>
                      <td className="px-3 py-3 text-slate-500">{church.group.name}</td>
                      <td className="px-3 py-3 text-right text-slate-800">
                        {formatCurrency(totalPurchases, "GBP")}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-800">
                        {formatCurrency(totalPayments, "GBP")}
                      </td>
                      <td
                        className={`px-3 py-3 text-right font-semibold ${
                          balance < 0 ? "text-rose-600" : "text-emerald-600"
                        }`}
                      >
                        {formatCurrency(Math.abs(balance), "GBP")}
                        {balance < 0 ? " owed" : " credit"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Link href={`/dashboard/churches/${church.id}`}>
                          <button className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
                            View Details
                          </button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
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
