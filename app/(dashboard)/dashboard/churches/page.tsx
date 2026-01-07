import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChurchListView } from "@/components/ChurchListView"
import { ChurchBulkUpload } from "@/components/churches/BulkUpload"
import { resolveFYFromSearchParams, buildPaymentDateFilter } from "@/lib/financialYear"
import { FinancialYearSelector } from "@/components/financial-year/FinancialYearSelector"
import { Suspense } from "react"

export default async function ChurchesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ZONE_ADMIN"

  const resolvedSearchParams = await searchParams
  const fyParam = resolvedSearchParams.fy as string | undefined
  const { startDate: fyStartDate, endDate: fyEndDate, label: fyLabel } =
    await resolveFYFromSearchParams(fyParam, prisma)

  const churches = await prisma.church.findMany({
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
          lineItems: true,
        },
      },
      payments: {
        where: buildPaymentDateFilter(fyStartDate, fyEndDate),
      },
      _count: {
        select: {
          transactions: { where: { transactionDate: { gte: fyStartDate, lte: fyEndDate } } },
          payments: { where: buildPaymentDateFilter(fyStartDate, fyEndDate) },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  })

  // Calculate financial data for each church
  const churchesWithFinancials = churches.map((church) => {
    const totalOrders = church.transactions.reduce((sum, transaction) => {
      return (
        sum +
        transaction.lineItems.reduce((lineSum, item) => lineSum + Number(item.totalAmount), 0)
      )
    }, 0)

    // Only PRINTING payments count towards balance
    const printingPayments = church.payments
      .filter((p) => p.forPurpose === "PRINTING")
      .reduce((sum, payment) => sum + Number(payment.amount), 0)

    // Campaign payments are separate (SPONSORSHIP purpose)
    const totalCampaigns = church.payments
      .filter((p) => p.forPurpose === "SPONSORSHIP")
      .reduce((sum, payment) => sum + Number(payment.amount), 0)

    // Balance = PRINTING payments - Orders (campaigns NOT included)
    const balance = printingPayments - totalOrders

    return {
      id: church.id,
      name: church.name,
      group: church.group,
      _count: church._count,
      totalOrders,
      totalPayments: printingPayments,
      totalCampaigns,
      balance,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Churches</h2>
          <p className="text-muted-foreground">
            View all churches and their transaction summaries.{" "}
            Viewing <span className="font-semibold">{fyLabel}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Suspense fallback={<div className="h-10 w-32 animate-pulse rounded-md bg-slate-100" />}>
            <FinancialYearSelector />
          </Suspense>
          {isAdmin && (
            <>
              <ChurchBulkUpload />
              <Link href="/dashboard/churches/new">
                <Button>Add New Church</Button>
              </Link>
            </>
          )}
        </div>
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
