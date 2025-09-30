import { auth } from "@/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import type { ComponentType, SVGProps } from "react"

type TopMetric = {
  churchId: string
  name: string
  value: number
}

type SummaryStats = {
  totalPurchases: number
  totalPayments: number
  totalOutstanding: number
  totalCopies: number
  monthPayments: number
  monthCopies: number
  topCopiesChurch: TopMetric | null
  topRemittanceChurch: TopMetric | null
}

type ActivityItem = {
  id: string
  title: string
  description: string
  timestamp: Date
}

function formatTimeAgo(date: Date): string {
  const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min${diffInMinutes === 1 ? "" : "s"} ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hr${diffInHours === 1 ? "" : "s"} ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`
  }

  return date.toLocaleDateString()
}

export default async function DashboardPage() {
  const session = await auth()

  const now = new Date()
  const isCurrentMonth = (date: Date) =>
    date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()

  const [churches, recentUploads, recentTransactions] = await Promise.all([
    prisma.church.findMany({
      select: {
        id: true,
        name: true,
        transactions: {
          where: {
            transactionType: "PURCHASE",
          },
          select: {
            transactionDate: true,
            lineItems: {
              select: {
                totalAmount: true,
                quantity: true,
              },
            },
          },
        },
        payments: {
          select: {
            amount: true,
            paymentDate: true,
          },
        },
      },
    }),
    prisma.uploadHistory.findMany({
      orderBy: { uploadedAt: "desc" },
      take: 5,
      select: {
        id: true,
        fileName: true,
        recordsProcessed: true,
        uploadedAt: true,
      },
    }),
    prisma.transaction.findMany({
      where: {
        transactionType: "PURCHASE",
      },
      orderBy: { transactionDate: "desc" },
      take: 5,
      select: {
        id: true,
        transactionDate: true,
        church: {
          select: {
            name: true,
          },
        },
        lineItems: {
          select: {
            totalAmount: true,
          },
        },
      },
    }),
  ])

  const stats = churches.reduce<SummaryStats>(
    (acc, church) => {
      let churchPurchases = 0
      let churchCopies = 0
      let churchCopiesThisMonth = 0

      for (const transaction of church.transactions) {
        const transactionAmount = transaction.lineItems.reduce((sum, item) => sum + Number(item.totalAmount), 0)
        const transactionCopies = transaction.lineItems.reduce((sum, item) => sum + item.quantity, 0)

        churchPurchases += transactionAmount
        churchCopies += transactionCopies

        if (isCurrentMonth(transaction.transactionDate)) {
          churchCopiesThisMonth += transactionCopies
        }
      }

      const churchPayments = church.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
      const churchPaymentsThisMonth = church.payments.reduce((sum, payment) => {
        if (isCurrentMonth(payment.paymentDate)) {
          return sum + Number(payment.amount)
        }
        return sum
      }, 0)

      acc.totalPurchases += churchPurchases
      acc.totalPayments += churchPayments
      acc.totalOutstanding += Math.max(churchPurchases - churchPayments, 0)
      acc.totalCopies += churchCopies
      acc.monthPayments += churchPaymentsThisMonth
      acc.monthCopies += churchCopiesThisMonth

      if (!acc.topCopiesChurch || churchCopies > acc.topCopiesChurch.value) {
        acc.topCopiesChurch = {
          churchId: church.id,
          name: church.name,
          value: churchCopies,
        }
      }

      if (!acc.topRemittanceChurch || churchPayments > acc.topRemittanceChurch.value) {
        acc.topRemittanceChurch = {
          churchId: church.id,
          name: church.name,
          value: churchPayments,
        }
      }

      return acc
    },
    {
      totalPurchases: 0,
      totalPayments: 0,
      totalOutstanding: 0,
      totalCopies: 0,
      monthPayments: 0,
      monthCopies: 0,
      topCopiesChurch: null,
      topRemittanceChurch: null,
    }
  )

  const totalChurches = churches.length

  const activities: ActivityItem[] = [
    ...recentUploads.map((upload) => ({
      id: upload.id,
      title: "CSV Upload",
      description: `${upload.fileName} • ${upload.recordsProcessed} records processed`,
      timestamp: upload.uploadedAt,
    })),
    ...recentTransactions.map((transaction) => ({
      id: transaction.id,
      title: `Purchase • ${transaction.church.name}`,
      description: formatCurrency(
        transaction.lineItems.reduce((sum, item) => sum + Number(item.totalAmount), 0),
        "GBP"
      ),
      timestamp: transaction.transactionDate,
    })),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 6)

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Welcome back, {session?.user?.name ?? "team member"}. Here is how things look right now.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
  <Card className="border-none bg-white/90 shadow-lg shadow-slate-900/5 xl:col-span-2">
          <CardHeader className="space-y-2 pb-4">
            <CardTitle className="text-sm font-medium text-slate-600">Total Churches</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Across all groups in the network
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-semibold text-slate-900">{totalChurches}</div>
          </CardContent>
        </Card>

  <Card className="border-none bg-gradient-to-br from-emerald-500/15 via-emerald-400/10 to-teal-500/15 shadow-lg shadow-emerald-500/10 xl:col-span-2">
          <CardHeader className="space-y-2 pb-4">
            <CardTitle className="text-sm font-medium text-emerald-900">Collections This Month</CardTitle>
            <CardDescription className="text-xs text-emerald-900/70">
              Total payments recorded in {now.toLocaleString("default", { month: "long" })}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-semibold text-emerald-900">
              {formatCurrency(stats.monthPayments, "GBP")}
            </div>
          </CardContent>
        </Card>

  <Card className="border-none bg-gradient-to-br from-rose-500/15 via-rose-400/10 to-orange-500/15 shadow-lg shadow-rose-500/10 xl:col-span-2">
          <CardHeader className="space-y-2 pb-4">
            <CardTitle className="text-sm font-medium text-rose-900">Outstanding Balance</CardTitle>
            <CardDescription className="text-xs text-rose-900/70">
              Difference between purchases and payments
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-semibold text-rose-900">
              {formatCurrency(stats.totalOutstanding, "GBP")}
            </div>
          </CardContent>
        </Card>

  <Card className="border-none bg-white/90 shadow-lg shadow-slate-900/5 xl:col-span-2">
          <CardHeader className="space-y-2 pb-4">
            <CardTitle className="text-sm font-medium text-slate-600">Copies Distributed</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Shipments logged during {now.toLocaleString("default", { month: "long" })}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-semibold text-slate-900">
              {stats.monthCopies.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-white/90 shadow-lg shadow-violet-500/10">
          <CardHeader className="space-y-2 pb-4">
            <CardTitle className="text-sm font-medium text-violet-900">Top Copies</CardTitle>
            <CardDescription className="text-xs text-violet-900/70">
              Church with the highest distribution
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {stats.topCopiesChurch ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">
                  {stats.topCopiesChurch.name}
                </p>
                <p className="text-xs text-slate-500">
                  {stats.topCopiesChurch.value.toLocaleString()} copies
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No copies recorded yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-none bg-white/90 shadow-lg shadow-sky-500/10">
          <CardHeader className="space-y-2 pb-4">
            <CardTitle className="text-sm font-medium text-sky-900">Top Remittance</CardTitle>
            <CardDescription className="text-xs text-sky-900/70">
              Highest total payments to date
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {stats.topRemittanceChurch ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">
                  {stats.topRemittanceChurch.name}
                </p>
                <p className="text-xs text-slate-500">
                  {formatCurrency(stats.topRemittanceChurch.value, "GBP")}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No remittances recorded yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="col-span-7 lg:col-span-4 border-none bg-white/90 shadow-lg shadow-slate-900/5">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg font-semibold text-slate-900">Quick actions</CardTitle>
            <CardDescription className="text-sm text-slate-500">
              Jump straight into common workflows
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6 pt-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <QuickAction href="/dashboard/upload" icon={UploadIcon} label="CSV" />
              <QuickAction href="/dashboard/reports" icon={ReportIcon} label="Reports" />
              <QuickAction href="/dashboard/churches" icon={ChurchIcon} label="Churches" />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-7 lg:col-span-3 border-none bg-white/90 shadow-lg shadow-slate-900/5">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg font-semibold text-slate-900">Recent activity</CardTitle>
            <CardDescription className="text-sm text-slate-500">
              Latest uploads and purchase entries
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-6 pt-6">
            {activities.length === 0 ? (
              <p className="text-sm text-slate-500">No activity recorded yet. Upload data to see updates here.</p>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{activity.title}</p>
                    <p className="text-xs text-slate-500">{activity.description}</p>
                  </div>
                  <span className="text-xs font-medium text-slate-400">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

type QuickActionProps = {
  href: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

function QuickAction({ href, label, icon: Icon }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/5 text-slate-700">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      {label}
    </Link>
  )
}

function UploadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 16V4" />
      <path d="m6 10 6-6 6 6" />
      <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  )
}

function ReportIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 8h10" />
      <path d="M7 12h6" />
      <path d="M5 4h10l4 4v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    </svg>
  )
}

function ChurchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3 6 4v5h-3v6H9v-6H6V7z" />
      <path d="M12 22v-4" />
    </svg>
  )
}
