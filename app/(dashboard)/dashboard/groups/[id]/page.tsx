import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { TransactionHistory } from "@/components/TransactionHistory"
import { PaymentHistory } from "@/components/PaymentHistory"
import { CampaignBreakdown } from "@/components/churches/CampaignBreakdown"
import { resolveFYFromSearchParams, buildPaymentDateFilter } from "@/lib/financialYear"
import { FinancialYearSelector } from "@/components/financial-year/FinancialYearSelector"
import { Suspense } from "react"

export default async function GroupDetailPage({
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
  const { startDate: fyStartDate, endDate: fyEndDate, label: fyLabel } =
    await resolveFYFromSearchParams(fyParam, prisma)

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      zone: true,
      churches: {
        include: {
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
            where: buildPaymentDateFilter(fyStartDate, fyEndDate),
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
        orderBy: {
          name: "asc",
        },
      },
    },
  })

  if (!group) {
    notFound()
  }

  // Helper function to sum payments by purpose
  const sumPaymentsByPurpose = (payments: typeof group.churches[0]["payments"], purpose: string) =>
    payments
      .filter((p) => p.forPurpose === purpose)
      .reduce((sum, payment) => sum + Number(payment.amount), 0)

  // Calculate financial summary for the entire group
  const churchSummaries = group.churches.map((church) => {
    const orders = church.transactions.reduce((sum, transaction) => {
      return (
        sum +
        transaction.lineItems.reduce((lineSum, item) => lineSum + Number(item.totalAmount), 0)
      )
    }, 0)

    const printing = sumPaymentsByPurpose(church.payments, "PRINTING")

    const campaigns = sumPaymentsByPurpose(church.payments, "SPONSORSHIP")

    // Count total copies across all transactions
    const copies = church.transactions.reduce((sum, transaction) => {
      return sum + transaction.lineItems.reduce((lineSum, item) => lineSum + item.quantity, 0)
    }, 0)

    return {
      id: church.id,
      name: church.name,
      orders,
      payments: printing,
      campaigns,
      balance: printing - orders,
    }
  })

  const totalOrders = churchSummaries.reduce((sum, church) => sum + church.orders, 0)
  const printingPayments = churchSummaries.reduce((sum, church) => sum + church.payments, 0)
  const totalCampaigns = churchSummaries.reduce((sum, church) => sum + church.campaigns, 0)
  const totalCopies = group.churches.reduce((sum, church) => {
    return sum + church.transactions.reduce((lineSum, transaction) => {
      return lineSum + transaction.lineItems.reduce((itemSum, item) => itemSum + item.quantity, 0)
    }, 0)
  }, 0)

  const balance = printingPayments - totalOrders

  // Aggregate all transactions from all churches (serialize Decimal to number)
  const allTransactions = group.churches
    .flatMap((church) =>
      church.transactions.map((t) => ({
        ...t,
        lineItems: t.lineItems.map((item) => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          totalAmount: Number(item.totalAmount),
          productType: {
            ...item.productType,
            unitPrice: Number(item.productType.unitPrice),
          },
        })),
        church: { id: church.id, name: church.name },
      }))
    )
    .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())

  // Aggregate all payments from all churches (serialize Decimal to number)
  const allPayments = group.churches
    .flatMap((church) =>
      church.payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
        church: { id: church.id, name: church.name },
      }))
    )
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())

  // Calculate product breakdown across all churches
  const productBreakdown = group.churches
    .flatMap((church) => church.transactions)
    .reduce(
      (acc, transaction) => {
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
      },
      {} as Record<string, { quantity: number; totalAmount: number }>
    )

  // Aggregate all campaign payments from all churches (for CampaignBreakdown)
  const allCampaignPayments = group.churches.flatMap((church) =>
    church.payments
      .filter((p) => p.forPurpose === "SPONSORSHIP")
      .map((p) => ({
        ...p,
        amount: Number(p.amount),
      }))
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{group.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {group.zone.name} • {group.churches.length} churches
          </p>
          <p className="text-sm text-slate-500">
            Viewing <span className="font-semibold">{fyLabel}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Suspense fallback={<div className="h-10 w-32 animate-pulse rounded-md bg-slate-100" />}>
            <FinancialYearSelector />
          </Suspense>
          <Link
            href="/dashboard/reports"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Back to Reports
          </Link>
          {isAdmin && (
            <Link
              href={`/dashboard/groups/${group.id}/edit`}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Edit Group
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-none bg-white/70 shadow-lg shadow-slate-900/5">
          <CardHeader className="space-y-3">
            <CardTitle className="text-sm font-medium text-slate-700">Total Orders</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {totalCopies.toLocaleString()} copies ordered overall
            </CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">
            {formatCurrency(totalOrders, group.zone.currency)}
          </CardContent>
        </Card>
        <Card className="border-none bg-white/70 shadow-lg shadow-slate-900/5">
          <CardHeader className="space-y-3">
            <CardTitle className="text-sm font-medium text-slate-700">Total Payments</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Printing payments received
            </CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">
            {formatCurrency(printingPayments, group.zone.currency)}
          </CardContent>
        </Card>
        <Card className="border-none bg-white/70 shadow-lg shadow-slate-900/5">
          <CardHeader className="space-y-3">
            <CardTitle className="text-sm font-medium text-slate-700">Total Campaigns</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Sponsorship contributions (separate from balance)
            </CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">
            {formatCurrency(totalCampaigns, group.zone.currency)}
          </CardContent>
        </Card>
        <Card
          className={`border-none shadow-lg ${
            balance < 0
              ? "bg-gradient-to-br from-rose-500/15 via-rose-400/10 to-orange-500/15 shadow-rose-500/10"
              : "bg-gradient-to-br from-emerald-500/15 via-emerald-400/5 to-teal-500/15 shadow-emerald-500/10"
          }`}
        >
          <CardHeader className="space-y-3">
            <CardTitle
              className={`text-sm font-medium ${balance < 0 ? "text-rose-900" : "text-emerald-900"}`}
            >
              Balance
            </CardTitle>
            <CardDescription
              className={`text-xs ${balance < 0 ? "text-rose-900/70" : "text-emerald-900/70"}`}
            >
              {balance < 0 ? "Amount outstanding" : "Credit balance"}
            </CardDescription>
          </CardHeader>
          <CardContent
            className={`text-3xl font-semibold ${balance < 0 ? "text-rose-900" : "text-emerald-900"}`}
          >
            {formatCurrency(Math.abs(balance), group.zone.currency)}
            {balance < 0 ? " owed" : " credit"}
          </CardContent>
        </Card>
      </div>

      <Card className="border-none bg-white/80 shadow-lg shadow-slate-900/5">
        <CardHeader>
          <CardTitle>Product Breakdown</CardTitle>
          <CardDescription>
            Distribution by product type across all churches • {totalCopies.toLocaleString()} total copies
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
                    {formatCurrency(data.totalAmount, group.zone.currency)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none bg-white/90 shadow-xl shadow-slate-900/5">
        <CardHeader>
          <CardTitle>Church Financial Summary</CardTitle>
          <CardDescription>Financial breakdown for each church in this group</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50/80">
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3 font-medium">Church</th>
                  <th className="px-3 py-3 font-medium text-right">Orders</th>
                  <th className="px-3 py-3 font-medium text-right">Payments</th>
                  <th className="px-3 py-3 font-medium text-right">Campaigns</th>
                  <th className="px-3 py-3 font-medium text-right">Balance</th>
                  <th className="px-3 py-3 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {churchSummaries.map((church) => (
                  <tr key={church.id} className="transition hover:bg-slate-50/80">
                    <td className="px-3 py-3 font-medium text-slate-800">{church.name}</td>
                    <td className="px-3 py-3 text-right text-slate-800">
                      {formatCurrency(church.orders, group.zone.currency)}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-800">
                      {formatCurrency(church.payments, group.zone.currency)}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-800">
                      {formatCurrency(church.campaigns, group.zone.currency)}
                    </td>
                    <td
                      className={`px-3 py-3 text-right font-semibold ${
                        church.balance < 0 ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {formatCurrency(Math.abs(church.balance), group.zone.currency)}
                      {church.balance < 0 ? " owed" : " credit"}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Link href={`/dashboard/churches/${church.id}`}>
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

      {allCampaignPayments.length > 0 && (
        <CampaignBreakdown
          payments={allCampaignPayments}
          zoneCurrency={group.zone.currency}
          title="Campaign Contributions"
          description="Sponsorship payments across all churches in this group"
        />
      )}

      <TransactionHistory
        transactions={allTransactions}
        currency={group.zone.currency}
        showChurchColumn={true}
      />

      <PaymentHistory
        payments={allPayments}
        currency={group.zone.currency}
        showChurchColumn={true}
      />
    </div>
  )
}
