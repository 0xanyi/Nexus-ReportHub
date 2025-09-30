import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import { ExportButtons } from "@/components/ExportButtons"
import { TransactionHistory } from "@/components/TransactionHistory"
import { PaymentHistory } from "@/components/PaymentHistory"

export default async function ChurchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ZONE_ADMIN"

  const church = await prisma.church.findUnique({
    where: { id },
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
        include: {
          uploader: {
            select: {
              name: true,
            },
          },
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
  const totalPurchases = church.transactions.reduce((sum, transaction) => {
    return (
      sum +
      transaction.lineItems.reduce(
        (lineSum, item) => lineSum + Number(item.totalAmount),
        0
      )
    )
  }, 0)

  const totalPayments = church.payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  )

  const balance = totalPayments - totalPurchases

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
  const currentYear = new Date().getFullYear()
  const monthlySummary = church.transactions
    .filter((t) => new Date(t.transactionDate).getFullYear() === currentYear)
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
            <p className="text-muted-foreground">
              {church.group.name} • {church.group.zone.name}
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButtons
              type="church"
              data={{
                name: church.name,
                group: church.group.name,
                zone: church.group.zone.name,
                totalPurchases,
                totalPayments,
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
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalPurchases, "GBP")}
            </div>
            <p className="text-xs text-muted-foreground">
              {church.transactions.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalPayments, "GBP")}
            </div>
            <p className="text-xs text-muted-foreground">
              {church.payments.length} payments
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
            <CardTitle className="text-sm font-medium">Total Copies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {church.transactions
                .reduce(
                  (sum, t) =>
                    sum + t.lineItems.reduce((s, i) => s + i.quantity, 0),
                  0
                )
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Product Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Product Breakdown</CardTitle>
          <CardDescription>Copies purchased by product type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(productBreakdown).map(([productName, data]) => (
              <div
                key={productName}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{productName}</div>
                  <div className="text-sm text-muted-foreground">
                    {data.quantity.toLocaleString()} copies
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatCurrency(data.totalAmount, "GBP")}
                  </div>
                </div>
              </div>
            ))}
            {Object.keys(productBreakdown).length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No purchases recorded yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Summary - Current Year */}
      {Object.keys(monthlySummary).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary {currentYear}</CardTitle>
            <CardDescription>Purchases by month this year</CardDescription>
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

      {/* Enhanced Transaction History with Filtering */}
      <TransactionHistory transactions={church.transactions} />

      {/* Enhanced Payment History with Filtering */}
      <PaymentHistory payments={church.payments} />
    </div>
  )
}
