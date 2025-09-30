import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts"
import { TrendAnalysis } from "@/components/analytics/TrendAnalysis"
import { DateRangeSelector, type ComparisonMode, type DateRange } from "@/components/ui/date-range-selector"
import { AnalyticsControls } from "@/components/analytics/AnalyticsControls"

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Parse comparison mode and date range from search params
  const comparisonMode = (searchParams.mode as ComparisonMode) || "year-over-year"
  const fromDate = searchParams.from as string
  const toDate = searchParams.to as string

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

  // Calculate comparison data based on selected mode
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()

  function getComparisonData(mode: ComparisonMode, from?: string, to?: string) {
    switch (mode) {
      case "year-over-year":
        const lastYear = currentYear - 1
        return {
          currentPeriod: { year: currentYear, label: currentYear.toString() },
          comparePeriod: { year: lastYear, label: lastYear.toString() },
          currentTransactions: transactions.filter(
            (t) => new Date(t.transactionDate).getFullYear() === currentYear
          ),
          compareTransactions: transactions.filter(
            (t) => new Date(t.transactionDate).getFullYear() === lastYear
          ),
          currentPayments: payments.filter(
            (p) => new Date(p.paymentDate).getFullYear() === currentYear
          ),
          comparePayments: payments.filter(
            (p) => new Date(p.paymentDate).getFullYear() === lastYear
          ),
        }

      case "month-to-month":
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

        return {
          currentPeriod: { month: currentMonth, year: currentYear, label: new Date(currentYear, currentMonth).toLocaleString("default", { month: "long", year: "numeric" }) },
          comparePeriod: { month: lastMonth, year: lastMonthYear, label: new Date(lastMonthYear, lastMonth).toLocaleString("default", { month: "long", year: "numeric" }) },
          currentTransactions: transactions.filter(
            (t) => new Date(t.transactionDate).getMonth() === currentMonth &&
                   new Date(t.transactionDate).getFullYear() === currentYear
          ),
          compareTransactions: transactions.filter(
            (t) => new Date(t.transactionDate).getMonth() === lastMonth &&
                   new Date(t.transactionDate).getFullYear() === lastMonthYear
          ),
          currentPayments: payments.filter(
            (p) => new Date(p.paymentDate).getMonth() === currentMonth &&
                   new Date(p.paymentDate).getFullYear() === currentYear
          ),
          comparePayments: payments.filter(
            (p) => new Date(p.paymentDate).getMonth() === lastMonth &&
                   new Date(p.paymentDate).getFullYear() === lastMonthYear
          ),
        }

      case "custom":
        if (!from || !to) {
          // Fallback to year-over-year if no dates provided
          return getComparisonData("year-over-year")
        }

        const fromDateObj = new Date(from)
        const toDateObj = new Date(to)

        return {
          currentPeriod: { from: from, to: to, label: `${from} to ${to}` },
          comparePeriod: { from: from, to: to, label: `${from} to ${to}` },
          currentTransactions: transactions.filter((t) => {
            const tDate = new Date(t.transactionDate)
            return tDate >= fromDateObj && tDate <= toDateObj
          }),
          compareTransactions: [], // No comparison for custom ranges
          currentPayments: payments.filter((p) => {
            const pDate = new Date(p.paymentDate)
            return pDate >= fromDateObj && pDate <= toDateObj
          }),
          comparePayments: [], // No comparison for custom ranges
        }

      default:
        return getComparisonData("year-over-year")
    }
  }

  const comparisonData = getComparisonData(comparisonMode, fromDate, toDate)

  const {
    currentTransactions,
    compareTransactions,
    currentPayments,
    comparePayments,
    currentPeriod,
    comparePeriod,
  } = comparisonData

  // Calculate totals
  const currentYearPurchases = currentTransactions.reduce((sum, t) => {
    return sum + t.lineItems.reduce((lineSum, item) => lineSum + Number(item.totalAmount), 0)
  }, 0)

  const lastYearPurchases = compareTransactions.reduce((sum, t) => {
    return sum + t.lineItems.reduce((lineSum, item) => lineSum + Number(item.totalAmount), 0)
  }, 0)

  const currentYearPaymentsTotal = currentPayments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  )
  const lastYearPaymentsTotal = comparePayments.reduce((sum, p) => sum + Number(p.amount), 0)

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

  // Group data by month for current and comparison periods
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(currentYear, i, 1).toLocaleString("default", { month: "short" })

    // Current period
    const currentMonthTransactions = currentTransactions.filter(
      (t) => new Date(t.transactionDate).getMonth() === i
    )
    const currentMonthPayments = currentPayments.filter(
      (p) => new Date(p.paymentDate).getMonth() === i
    )

    const currentPurchases = currentMonthTransactions.reduce((sum, t) => {
      return sum + t.lineItems.reduce((lineSum, item) => lineSum + Number(item.totalAmount), 0)
    }, 0)

    const currentPaymentsAmount = currentMonthPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    )

    // Comparison period
    const lastMonthTransactions = compareTransactions.filter(
      (t) => new Date(t.transactionDate).getMonth() === i
    )
    const lastMonthPayments = comparePayments.filter(
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

      {/* Controls for date range selection */}
      <AnalyticsControls />

      {/* Year-over-Year Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {typeof currentPeriod.label === 'string' ? currentPeriod.label : `${currentPeriod.from} to ${currentPeriod.to}`} Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentYearPurchases, "GBP")}
            </div>
            {compareTransactions.length > 0 && (
              <p
                className={`text-xs ${
                  purchaseGrowth >= 0 ? "text-green-600" : "text-destructive"
                }`}
              >
                {purchaseGrowth >= 0 ? "+" : ""}
                {purchaseGrowth.toFixed(1)}% vs {comparePeriod.label}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {typeof currentPeriod.label === 'string' ? currentPeriod.label : `${currentPeriod.from} to ${currentPeriod.to}`} Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentYearPaymentsTotal, "GBP")}
            </div>
            {comparePayments.length > 0 && (
              <p
                className={`text-xs ${paymentGrowth >= 0 ? "text-green-600" : "text-destructive"}`}
              >
                {paymentGrowth >= 0 ? "+" : ""}
                {paymentGrowth.toFixed(1)}% vs {comparePeriod.label}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentCollectionRate.toFixed(1)}%</div>
            {compareTransactions.length > 0 && comparePayments.length > 0 && (
              <p
                className={`text-xs ${
                  currentCollectionRate >= lastCollectionRate ? "text-green-600" : "text-destructive"
                }`}
              >
                {currentCollectionRate >= lastCollectionRate ? "+" : ""}
                {(currentCollectionRate - lastCollectionRate).toFixed(1)}% vs {comparePeriod.label}
              </p>
            )}
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
        lastYear={comparePeriod.year || currentYear - 1}
      />
    </div>
  )
}
