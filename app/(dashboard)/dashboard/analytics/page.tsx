import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts"
import { TrendAnalysis } from "@/components/analytics/TrendAnalysis"

export default async function AnalyticsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Get all transactions with related data
  const transactions = await prisma.transaction.findMany({
    include: {
      church: {
        include: {
          group: true,
        },
      },
      lineItems: {
        include: {
          productType: true,
        },
      },
    },
    orderBy: {
      transactionDate: "desc",
    },
  })

  // Get all payments
  const payments = await prisma.payment.findMany({
    include: {
      church: {
        include: {
          group: true,
        },
      },
    },
    orderBy: {
      paymentDate: "desc",
    },
  })

  // Calculate year-over-year data
  const currentYear = new Date().getFullYear()
  const lastYear = currentYear - 1

  const currentYearTransactions = transactions.filter(
    (t) => new Date(t.transactionDate).getFullYear() === currentYear
  )
  const lastYearTransactions = transactions.filter(
    (t) => new Date(t.transactionDate).getFullYear() === lastYear
  )

  const currentYearPayments = payments.filter(
    (p) => new Date(p.paymentDate).getFullYear() === currentYear
  )
  const lastYearPayments = payments.filter(
    (p) => new Date(p.paymentDate).getFullYear() === lastYear
  )

  // Calculate totals
  const currentYearPurchases = currentYearTransactions.reduce((sum, t) => {
    return sum + t.lineItems.reduce((lineSum, item) => lineSum + Number(item.totalAmount), 0)
  }, 0)

  const lastYearPurchases = lastYearTransactions.reduce((sum, t) => {
    return sum + t.lineItems.reduce((lineSum, item) => lineSum + Number(item.totalAmount), 0)
  }, 0)

  const currentYearPaymentsTotal = currentYearPayments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  )
  const lastYearPaymentsTotal = lastYearPayments.reduce((sum, p) => sum + Number(p.amount), 0)

  // Calculate collection rates
  const currentCollectionRate =
    currentYearPurchases > 0 ? (currentYearPaymentsTotal / currentYearPurchases) * 100 : 0
  const lastCollectionRate =
    lastYearPurchases > 0 ? (lastYearPaymentsTotal / lastYearPurchases) * 100 : 0

  // Calculate growth rates
  const purchaseGrowth =
    lastYearPurchases > 0
      ? ((currentYearPurchases - lastYearPurchases) / lastYearPurchases) * 100
      : 0
  const paymentGrowth =
    lastYearPaymentsTotal > 0
      ? ((currentYearPaymentsTotal - lastYearPaymentsTotal) / lastYearPaymentsTotal) * 100
      : 0

  // Group data by month for current and last year
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(currentYear, i, 1).toLocaleString("default", { month: "short" })

    // Current year
    const currentMonthTransactions = currentYearTransactions.filter(
      (t) => new Date(t.transactionDate).getMonth() === i
    )
    const currentMonthPayments = currentYearPayments.filter(
      (p) => new Date(p.paymentDate).getMonth() === i
    )

    const currentPurchases = currentMonthTransactions.reduce((sum, t) => {
      return sum + t.lineItems.reduce((lineSum, item) => lineSum + Number(item.totalAmount), 0)
    }, 0)

    const currentPaymentsAmount = currentMonthPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    )

    // Last year
    const lastMonthTransactions = lastYearTransactions.filter(
      (t) => new Date(t.transactionDate).getMonth() === i
    )
    const lastMonthPayments = lastYearPayments.filter(
      (p) => new Date(p.paymentDate).getMonth() === i
    )

    const lastPurchases = lastMonthTransactions.reduce((sum, t) => {
      return sum + t.lineItems.reduce((lineSum, item) => lineSum + Number(item.totalAmount), 0)
    }, 0)

    const lastPaymentsAmount = lastMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0)

    return {
      month,
      currentPurchases: Math.round(currentPurchases),
      currentPayments: Math.round(currentPaymentsAmount),
      lastPurchases: Math.round(lastPurchases),
      lastPayments: Math.round(lastPaymentsAmount),
      collectionRate: currentPurchases > 0 ? (currentPaymentsAmount / currentPurchases) * 100 : 0,
    }
  })

  // Top performing churches by payment collection rate
  const churches = await prisma.church.findMany({
    include: {
      group: true,
      transactions: {
        include: {
          lineItems: true,
        },
      },
      payments: true,
    },
  })

  const churchPerformance = churches
    .map((church) => {
      const totalPurchases = church.transactions.reduce((sum, t) => {
        return sum + t.lineItems.reduce((lineSum, item) => lineSum + Number(item.totalAmount), 0)
      }, 0)

      const totalPayments = church.payments.reduce((sum, p) => sum + Number(p.amount), 0)

      const collectionRate = totalPurchases > 0 ? (totalPayments / totalPurchases) * 100 : 0

      return {
        name: church.name,
        group: church.group.name,
        totalPurchases,
        totalPayments,
        collectionRate,
        transactionCount: church.transactions.length,
      }
    })
    .filter((c) => c.totalPurchases > 0)
    .sort((a, b) => b.collectionRate - a.collectionRate)

  // Group performance
  const groupPerformance = await prisma.group.findMany({
    include: {
      churches: {
        include: {
          transactions: {
            include: {
              lineItems: true,
            },
          },
          payments: true,
        },
      },
    },
  })

  const groupData = groupPerformance.map((group) => {
    const totalPurchases = group.churches.reduce((sum, church) => {
      return (
        sum +
        church.transactions.reduce((tSum, t) => {
          return tSum + t.lineItems.reduce((lSum, item) => lSum + Number(item.totalAmount), 0)
        }, 0)
      )
    }, 0)

    const totalPayments = group.churches.reduce((sum, church) => {
      return sum + church.payments.reduce((pSum, p) => pSum + Number(p.amount), 0)
    }, 0)

    return {
      name: group.name,
      totalPurchases: Math.round(totalPurchases),
      totalPayments: Math.round(totalPayments),
      collectionRate: totalPurchases > 0 ? (totalPayments / totalPurchases) * 100 : 0,
      churchCount: group.churches.length,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Advanced Analytics</h2>
        <p className="text-muted-foreground">
          In-depth analysis of purchases, payments, and collection trends
        </p>
      </div>

      {/* Year-over-Year Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{currentYear} Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentYearPurchases, "GBP")}
            </div>
            <p
              className={`text-xs ${
                purchaseGrowth >= 0 ? "text-green-600" : "text-destructive"
              }`}
            >
              {purchaseGrowth >= 0 ? "+" : ""}
              {purchaseGrowth.toFixed(1)}% vs {lastYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{currentYear} Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentYearPaymentsTotal, "GBP")}
            </div>
            <p
              className={`text-xs ${paymentGrowth >= 0 ? "text-green-600" : "text-destructive"}`}
            >
              {paymentGrowth >= 0 ? "+" : ""}
              {paymentGrowth.toFixed(1)}% vs {lastYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentCollectionRate.toFixed(1)}%</div>
            <p
              className={`text-xs ${
                currentCollectionRate >= lastCollectionRate ? "text-green-600" : "text-destructive"
              }`}
            >
              {currentCollectionRate >= lastCollectionRate ? "+" : ""}
              {(currentCollectionRate - lastCollectionRate).toFixed(1)}% vs {lastYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(currentYearPurchases - currentYearPaymentsTotal, "GBP")}
            </div>
            <p className="text-xs text-muted-foreground">Current year balance</p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Charts */}
      <AnalyticsCharts monthlyData={monthlyData} groupData={groupData} />

      {/* Trend Analysis */}
      <TrendAnalysis
        churchPerformance={churchPerformance}
        currentYear={currentYear}
        lastYear={lastYear}
      />
    </div>
  )
}
