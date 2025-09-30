import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { FinancialCharts } from "@/components/charts/FinancialCharts"

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

  // Prepare data for charts
  // Monthly data for last 12 months
  const monthlyData = (() => {
    const months = []
    const now = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const monthName = date.toLocaleString("default", { month: "short", year: "2-digit" })
      
      const monthPurchases = churches.reduce((sum, church) => {
        return (
          sum +
          church.transactions
            .filter((t) => {
              const tDate = new Date(t.transactionDate)
              const tKey = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, "0")}`
              return tKey === monthKey
            })
            .reduce((tSum, t) => {
              return (
                tSum + t.lineItems.reduce((lSum, l) => lSum + Number(l.totalAmount), 0)
              )
            }, 0)
        )
      }, 0)

      const monthPayments = churches.reduce((sum, church) => {
        return (
          sum +
          church.payments
            .filter((p) => {
              const pDate = new Date(p.paymentDate)
              const pKey = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, "0")}`
              return pKey === monthKey
            })
            .reduce((pSum, p) => pSum + Number(p.amount), 0)
        )
      }, 0)

      months.push({
        month: monthName,
        purchases: Math.round(monthPurchases),
        payments: Math.round(monthPayments),
      })
    }
    
    return months
  })()

  // Product distribution data
  const productData = (() => {
    const productTotals: Record<string, { value: number; quantity: number }> = {}
    
    churches.forEach((church) => {
      church.transactions.forEach((transaction) => {
        transaction.lineItems.forEach((item) => {
          const productName = item.productType.name
          if (!productTotals[productName]) {
            productTotals[productName] = { value: 0, quantity: 0 }
          }
          productTotals[productName].value += Number(item.totalAmount)
          productTotals[productName].quantity += item.quantity
        })
      })
    })

    return Object.entries(productTotals)
      .map(([name, data]) => ({
        name,
        value: Math.round(data.value),
        quantity: data.quantity,
      }))
      .sort((a, b) => b.value - a.value)
  })()

  // Top churches data
  const topChurches = churches
    .map((church) => {
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

      return {
        name: church.name.length > 20 ? church.name.substring(0, 20) + "..." : church.name,
        purchases: Math.round(purchases),
        payments: Math.round(payments),
        balance: Math.round(payments - purchases),
      }
    })
    .sort((a, b) => b.purchases - a.purchases)
    .slice(0, 10)

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Financial Reports</h2>
        <p className="text-muted-foreground">
          Overview of all church transactions and financial summaries
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Churches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChurches}</div>
            <p className="text-xs text-muted-foreground">
              {stats.churchesWithDebt} with outstanding balance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalPurchases, "GBP")}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCopies.toLocaleString()} copies ordered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalPayments, "GBP")}
            </div>
            <p className="text-xs text-muted-foreground">
              Collection rate: {stats.totalPurchases > 0 
                ? ((stats.totalPayments / stats.totalPurchases) * 100).toFixed(1)
                : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(stats.totalOutstanding, "GBP")}
            </div>
            <p className="text-xs text-muted-foreground">
              Amount owed by churches
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Charts */}
      <FinancialCharts 
        monthlyData={monthlyData}
        productData={productData}
        topChurches={topChurches}
      />

      {/* Church Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Church Financial Summary</CardTitle>
          <CardDescription>
            Overview of purchases, payments, and balances for all churches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Church Name</th>
                  <th className="text-left p-2 font-medium">Group</th>
                  <th className="text-right p-2 font-medium">Total Purchases</th>
                  <th className="text-right p-2 font-medium">Total Payments</th>
                  <th className="text-right p-2 font-medium">Balance</th>
                  <th className="text-center p-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
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
                    <tr key={church.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{church.name}</td>
                      <td className="p-2 text-muted-foreground">{church.group.name}</td>
                      <td className="p-2 text-right">
                        {formatCurrency(totalPurchases, "GBP")}
                      </td>
                      <td className="p-2 text-right">
                        {formatCurrency(totalPayments, "GBP")}
                      </td>
                      <td
                        className={`p-2 text-right font-medium ${
                          balance < 0 ? "text-destructive" : "text-green-600"
                        }`}
                      >
                        {formatCurrency(Math.abs(balance), "GBP")}
                        {balance < 0 ? " owed" : " credit"}
                      </td>
                      <td className="p-2 text-center">
                        <Link href={`/dashboard/churches/${church.id}`}>
                          <button className="text-primary hover:underline text-xs">
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

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest 10 transactions across all churches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">{transaction.church.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {transaction.lineItems.map((item) => (
                      <span key={item.id}>
                        {item.quantity}x {item.productType.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {formatCurrency(
                      transaction.lineItems.reduce(
                        (sum, item) => sum + Number(item.totalAmount),
                        0
                      ),
                      transaction.currency
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(transaction.transactionDate).toLocaleDateString()}
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
