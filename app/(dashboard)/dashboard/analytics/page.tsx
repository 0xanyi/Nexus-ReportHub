import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts"
import { TrendAnalysis } from "@/components/analytics/TrendAnalysis"
import { resolveFYFromSearchParams, getFinancialYearBounds } from "@/lib/financialYear"
import { FinancialYearSelector } from "@/components/financial-year/FinancialYearSelector"
import { Suspense } from "react"

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const resolvedSearchParams = await searchParams
  const fyParam = resolvedSearchParams.fy as string | undefined
  const { startDate: fyStartDate, endDate: fyEndDate, label: fyLabel } =
    await resolveFYFromSearchParams(fyParam, prisma)

  // Calculate previous FY for comparison
  const prevFYBounds = getFinancialYearBounds(new Date(fyStartDate.getTime() - 1))

  // Get transactions filtered by current FY
  const transactions = await prisma.transaction.findMany({
    where: {
      transactionDate: {
        gte: fyStartDate,
        lte: fyEndDate,
      },
    },
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

  // Get transactions from previous FY for comparison
  const prevFYTransactions = await prisma.transaction.findMany({
    where: {
      transactionDate: {
        gte: prevFYBounds.startDate,
        lte: prevFYBounds.endDate,
      },
    },
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

  // Get payments filtered by current FY
  const payments = await prisma.payment.findMany({
    where: {
      paymentDate: {
        gte: fyStartDate,
        lte: fyEndDate,
      },
    },
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

  // Get payments from previous FY for comparison
  const prevFYPayments = await prisma.payment.findMany({
    where: {
      paymentDate: {
        gte: prevFYBounds.startDate,
        lte: prevFYBounds.endDate,
      },
    },
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

  // Use FY-filtered data directly
  const currentTransactions = transactions
  const compareTransactions = prevFYTransactions
  const currentPayments = payments
  const comparePayments = prevFYPayments

  // Calculate totals
  const currentYearOrders = currentTransactions.reduce((sum, t) => {
    return sum + t.lineItems.reduce((lineSum, item) => lineSum + Number(item.totalAmount), 0)
  }, 0)

  const lastYearOrders = compareTransactions.reduce((sum, t) => {
    return sum + t.lineItems.reduce((lineSum, item) => lineSum + Number(item.totalAmount), 0)
  }, 0)

  const currentYearPaymentsTotal = currentPayments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  )
  const lastYearPaymentsTotal = comparePayments.reduce((sum, p) => sum + Number(p.amount), 0)

  // Calculate collection rates
  const currentCollectionRate =
    currentYearOrders > 0 ? (currentYearPaymentsTotal / currentYearOrders) * 100 : 0
  const lastCollectionRate =
    lastYearOrders > 0 ? (lastYearPaymentsTotal / lastYearOrders) * 100 : 0

  // Calculate growth rates
  const orderGrowth =
    lastYearOrders > 0
      ? ((currentYearOrders - lastYearOrders) / lastYearOrders) * 100
      : 0
  const paymentGrowth =
    lastYearPaymentsTotal > 0
      ? ((currentYearPaymentsTotal - lastYearPaymentsTotal) / lastYearPaymentsTotal) * 100
      : 0

  // Group data by month for current and comparison periods
  // FY months: Dec (11), Jan (0), Feb (1), ..., Nov (10)
  const fyMonthOrder = [11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const fyYear = fyEndDate.getFullYear()

  const monthlyData = fyMonthOrder.map((monthIndex, i) => {
    const displayYear = monthIndex === 11 ? fyYear - 1 : fyYear
    const month = new Date(displayYear, monthIndex, 1).toLocaleString("default", { month: "short" })

    // Current period
    const currentMonthTransactions = currentTransactions.filter(
      (t) => new Date(t.transactionDate).getMonth() === monthIndex
    )
    const currentMonthPayments = currentPayments.filter(
      (p) => new Date(p.paymentDate).getMonth() === monthIndex
    )

    const currentOrders = currentMonthTransactions.reduce((sum, t) => {
      return sum + t.lineItems.reduce((lineSum, item) => lineSum + Number(item.totalAmount), 0)
    }, 0)

    const currentPaymentsAmount = currentMonthPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    )

    // Comparison period
    const lastMonthTransactions = compareTransactions.filter(
      (t) => new Date(t.transactionDate).getMonth() === monthIndex
    )
    const lastMonthPayments = comparePayments.filter(
      (p) => new Date(p.paymentDate).getMonth() === monthIndex
    )

    const lastOrders = lastMonthTransactions.reduce((sum, t) => {
      return sum + t.lineItems.reduce((lineSum, item) => lineSum + Number(item.totalAmount), 0)
    }, 0)

    const lastPaymentsAmount = lastMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0)

    return {
      month,
      currentOrders: Math.round(currentOrders),
      currentPayments: Math.round(currentPaymentsAmount),
      lastOrders: Math.round(lastOrders),
      lastPayments: Math.round(lastPaymentsAmount),
      collectionRate: currentOrders > 0 ? (currentPaymentsAmount / currentOrders) * 100 : 0,
    }
  })

  // Top performing churches by payment collection rate (filtered by FY)
  const churches = await prisma.church.findMany({
    include: {
      group: true,
      transactions: {
        where: {
          transactionDate: { gte: fyStartDate, lte: fyEndDate },
        },
        include: {
          lineItems: true,
        },
      },
      payments: {
        where: {
          paymentDate: { gte: fyStartDate, lte: fyEndDate },
        },
      },
    },
  })

  const churchPerformance = churches
    .map((church) => {
      const totalOrders = church.transactions.reduce((sum, t) => {
        return sum + t.lineItems.reduce((lineSum, item) => lineSum + Number(item.totalAmount), 0)
      }, 0)

      const totalPayments = church.payments.reduce((sum, p) => sum + Number(p.amount), 0)

      const collectionRate = totalOrders > 0 ? (totalPayments / totalOrders) * 100 : 0

      return {
        name: church.name,
        group: church.group.name,
        totalOrders,
        totalPayments,
        collectionRate,
        transactionCount: church.transactions.length,
      }
    })
    .filter((c) => c.totalOrders > 0)
    .sort((a, b) => b.collectionRate - a.collectionRate)

  // Group performance (filtered by FY)
  const groupPerformance = await prisma.group.findMany({
    include: {
      churches: {
        include: {
          transactions: {
            where: {
              transactionDate: { gte: fyStartDate, lte: fyEndDate },
            },
            include: {
              lineItems: true,
            },
          },
          payments: {
            where: {
              paymentDate: { gte: fyStartDate, lte: fyEndDate },
            },
          },
        },
      },
    },
  })

  const groupData = groupPerformance.map((group) => {
    const totalOrders = group.churches.reduce((sum, church) => {
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
      totalOrders: Math.round(totalOrders),
      totalPayments: Math.round(totalPayments),
      collectionRate: totalOrders > 0 ? (totalPayments / totalOrders) * 100 : 0,
      churchCount: group.churches.length,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Advanced Analytics</h2>
          <p className="text-muted-foreground">
            In-depth analysis of orders, payments, and collection trends.{" "}
            Viewing <span className="font-semibold">{fyLabel}</span>.
          </p>
        </div>
        <Suspense fallback={<div className="h-10 w-32 animate-pulse rounded-md bg-slate-100" />}>
          <FinancialYearSelector />
        </Suspense>
      </div>

      {/* FY Comparison Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {fyLabel} Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentYearOrders, "GBP")}
            </div>
            {compareTransactions.length > 0 && (
              <p
                className={`text-xs ${
                  orderGrowth >= 0 ? "text-green-600" : "text-destructive"
                }`}
              >
                {orderGrowth >= 0 ? "+" : ""}
                {orderGrowth.toFixed(1)}% vs {prevFYBounds.label}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {fyLabel} Payments
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
                {paymentGrowth.toFixed(1)}% vs {prevFYBounds.label}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Remittance Rate</CardTitle>
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
                {(currentCollectionRate - lastCollectionRate).toFixed(1)}% vs {prevFYBounds.label}
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
              {formatCurrency(currentYearOrders - currentYearPaymentsTotal, "GBP")}
            </div>
            <p className="text-xs text-muted-foreground">{fyLabel} balance</p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Charts */}
      <AnalyticsCharts monthlyData={monthlyData} groupData={groupData} />

      {/* Trend Analysis */}
      <TrendAnalysis
        churchPerformance={churchPerformance}
        currentYear={fyYear}
        lastYear={prevFYBounds.endDate.getFullYear()}
      />
    </div>
  )
}
