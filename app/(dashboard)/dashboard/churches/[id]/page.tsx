import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import { ExportButtons } from "@/components/ExportButtons"
import { PaymentHistory } from "@/components/PaymentHistory"
import { CampaignBreakdown } from "@/components/churches/CampaignBreakdown"
import { ChurchOrdersManager } from "@/components/churches/ChurchOrdersManager"
import { getFinancialYearFromParam } from "@/lib/financialYear"
import { FinancialYearSelector } from "@/components/financial-year/FinancialYearSelector"
import { Suspense } from "react"

export default async function ChurchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ZONE_ADMIN"

  const fyParam = resolvedSearchParams.fy as string | undefined
  const fyBounds = await getFinancialYearFromParam(fyParam, prisma)
  const fyStartDate = fyBounds?.startDate ?? new Date(new Date().getFullYear(), 0, 1)
  const fyEndDate = fyBounds?.endDate ?? new Date()
  const fyLabel = fyBounds?.label ?? "Current Year"

  const church = await prisma.church.findUnique({
    where: { id },
    include: {
      group: {
        include: {
          zone: true,
        },
      },
      transactions: {
        where: {
          transactionDate: {
            gte: fyStartDate,
            lte: fyEndDate,
          },
        },
        include: {
          lineItems: {
            include: {
              productType: true,
            },
          },
          uploader: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          transactionDate: "desc",
        },
      },
      payments: {
        where: {
          paymentDate: {
            gte: fyStartDate,
            lte: fyEndDate,
          },
        },
        include: {
          uploader: {
            select: {
              name: true,
            },
          },
          campaignCategory: true,
        },
        orderBy: {
          paymentDate: "desc",
        },
      },
    },
  })

  if (!church) {
    notFound()
  }

  // Calculate financial summary
  const totalOrders = church.transactions.reduce((sum, transaction) => {
    return (
      sum +
      transaction.lineItems.reduce(
        (lineSum, item) => lineSum + Number(item.totalAmount),
        0
      )
    )
  }, 0)

  // Calculate total copies ordered
  const totalCopies = church.transactions.reduce((sum, transaction) => {
    return (
      sum +
      transaction.lineItems.reduce(
        (lineSum, item) => lineSum + item.quantity,
        0
      )
    )
  }, 0)

  // Calculate PRINTING payments only (for balance calculation)
  const printingPayments = church.payments
    .filter((p) => p.forPurpose === "PRINTING")
    .reduce((sum, payment) => sum + Number(payment.amount), 0)

  // Calculate campaign-specific payments (SPONSORSHIP purpose only - separate from balance)
  const totalCampaigns = church.payments
    .filter((p) => p.forPurpose === "SPONSORSHIP")
    .reduce((sum, payment) => sum + Number(payment.amount), 0)

  // Balance = PRINTING payments - Orders (campaigns are NOT included)
  const balance = printingPayments - totalOrders

  // Calculate product breakdown
  const productBreakdown = church.transactions.reduce((acc, transaction) => {
    transaction.lineItems.forEach((item) => {
      const productName = item.productType.name
      if (!acc[productName]) {
        acc[productName] = {
          quantity: 0,
          totalAmount: 0,
        }
      }
      acc[productName].quantity += item.quantity
      acc[productName].totalAmount += Number(item.totalAmount)
    })
    return acc
  }, {} as Record<string, { quantity: number; totalAmount: number }>)

  // Calculate monthly summary for current year
  const monthlySummary = church.transactions
    .reduce((acc, transaction) => {
      const month = new Date(transaction.transactionDate).toLocaleString("default", {
        month: "short",
      })
      const total = transaction.lineItems.reduce(
        (sum, item) => sum + Number(item.totalAmount),
        0
      )
      
      if (!acc[month]) {
        acc[month] = 0
      }
      acc[month] += total
      return acc
    }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/churches"
          className="text-sm text-primary hover:underline mb-2 inline-block"
        >
          ← Back to Churches
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{church.name}</h2>
            <p className="text-muted-foreground mt-1">
              {church.group.name} • {church.group.zone.name}
            </p>
            <p className="text-sm text-muted-foreground">
              Viewing <span className="font-semibold">{fyLabel}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButtons
              type="church"
              data={{
                name: church.name,
                group: church.group.name,
                zone: church.group.zone.name,
                totalOrders,
                totalPayments: printingPayments,
                balance,
                transactions: church.transactions.map((t) => ({
                  date: formatDate(t.transactionDate),
                  products: t.lineItems
                    .map((item) => `${item.quantity}x ${item.productType.name}`)
                    .join(", "),
                  amount: t.lineItems.reduce((sum, item) => sum + Number(item.totalAmount), 0),
                })),
                payments: church.payments.map((p) => ({
                  date: formatDate(p.paymentDate),
                  method: p.paymentMethod.replace("_", " "),
                  amount: Number(p.amount),
                  reference: p.referenceNumber || undefined,
                })),
              }}
            />
            {isAdmin && (
              <Link href={`/dashboard/churches/${id}/edit`}>
                <button className="px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors">
                  Edit Church
                </button>
              </Link>
            )}
            <Suspense fallback={<div className="h-10 w-32 animate-pulse rounded-md bg-slate-100" />}>
              <FinancialYearSelector />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalOrders, "GBP")}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalCopies.toLocaleString()} copies ordered overall
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(printingPayments, "GBP")}
            </div>
            <p className="text-xs text-muted-foreground">
              {church.payments.filter((p) => p.forPurpose === "PRINTING").length} payments (printing)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                balance < 0 ? "text-destructive" : "text-green-600"
              }`}
            >
              {formatCurrency(Math.abs(balance), "GBP")}
            </div>
            <p className="text-xs text-muted-foreground">
              {balance < 0 ? "Amount owed" : "Credit balance"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalCampaigns, "GBP")}
            </div>
            <p className="text-xs text-muted-foreground">
              {church.payments.filter((p) => p.forPurpose === "SPONSORSHIP").length} contributions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Product Breakdown */}
      <Card className="border-none bg-white/80 shadow-lg shadow-slate-900/5">
        <CardHeader>
          <CardTitle>Product Breakdown</CardTitle>
          <CardDescription>
            Copies ordered by product type • {totalCopies.toLocaleString()} total copies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(productBreakdown).map(([productName, data]) => (
              <div
                key={productName}
                className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm"
              >
                <div className="text-sm font-medium text-slate-900">{productName}</div>
                <div className="mt-2 flex items-end justify-between">
                  <div className="text-2xl font-semibold text-slate-800">{data.quantity}</div>
                  <div className="text-sm text-slate-500">
                    {formatCurrency(data.totalAmount, "GBP")}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {Object.keys(productBreakdown).length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No orders recorded yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Monthly Summary - Current Year */}
      {Object.keys(monthlySummary).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
            <CardDescription>Orders by month for {fyLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-6">
              {Object.entries(monthlySummary).map(([month, amount]) => (
                <div key={month} className="p-3 border rounded-lg">
                  <div className="text-sm text-muted-foreground">{month}</div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(amount, "GBP")}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Transaction History with Order Management */}
      <ChurchOrdersManager
        churchId={church.id}
        churchName={church.name}
        transactions={church.transactions.map(t => ({
          ...t,
          lineItems: t.lineItems.map(item => ({
            ...item,
            unitPrice: Number(item.unitPrice),
            totalAmount: Number(item.totalAmount),
            productType: {
              ...item.productType,
              unitPrice: Number(item.productType.unitPrice),
            },
          })),
        }))}
        isAdmin={isAdmin}
      />

      {/* Enhanced Payment History with Filtering */}
      <PaymentHistory 
        payments={church.payments.map(p => ({
          ...p,
          amount: Number(p.amount),
        }))} 
      />

      {/* Campaign Contributions Breakdown */}
      <CampaignBreakdown
        payments={church.payments.map((p) => ({
          id: p.id,
          paymentDate: p.paymentDate,
          amount: Number(p.amount),
          campaignCategory: p.campaignCategory,
          campaignLabel: p.campaignLabel,
        }))}
        currency={church.group.zone.currency}
      />
    </div>
  )
}
