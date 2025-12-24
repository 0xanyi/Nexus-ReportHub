import { auth } from "@/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/utils"
import { getFinancialYearFromParam } from "@/lib/financialYear"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { ComponentType, SVGProps } from "react"
import { DashboardHeader } from "@/components/financial-year/DashboardHeader"



function formatTimeAgo(date: Date): string {
  const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes} min${diffInMinutes === 1 ? "" : "s"} ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hr${diffInHours === 1 ? "" : "s"} ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`
  
  return date.toLocaleDateString()
}

function getCollectionRateColor(rate: number): string {
  if (rate >= 90) return "text-emerald-600 bg-emerald-50 border-emerald-200"
  if (rate >= 70) return "text-blue-600 bg-blue-50 border-blue-200"
  if (rate >= 50) return "text-amber-600 bg-amber-50 border-amber-200"
  return "text-red-600 bg-red-50 border-red-200"
}

function getPerformanceLabel(rate: number): string {
  if (rate >= 90) return "Excellent"
  if (rate >= 70) return "Good"
  if (rate >= 50) return "Fair"
  return "Needs Attention"
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth()
  const resolvedSearchParams = await searchParams
  const fyParam = resolvedSearchParams.fy as string | undefined
  
  const fyBounds = await getFinancialYearFromParam(fyParam, prisma)
  const fyStartDate = fyBounds?.startDate ?? new Date(new Date().getFullYear(), 0, 1)
  const fyEndDate = fyBounds?.endDate ?? new Date()
  const fyLabel = fyBounds?.label ?? "Current Year"
  
  const now = new Date()
  // For "this month" calculations, use the last month of the selected FY
  // If viewing current FY and we're within it, use current month
  // If viewing archived FY, use the last month of that FY
  const isViewingCurrentFy = fyEndDate >= now
  const lastMonthOfFy = new Date(fyEndDate.getFullYear(), fyEndDate.getMonth(), 1)
  const currentMonthStart = isViewingCurrentFy
    ? new Date(now.getFullYear(), now.getMonth(), 1)
    : lastMonthOfFy

  const isRecentMonth = (date: Date) => date >= currentMonthStart && date <= fyEndDate

  // Fetch comprehensive dashboard data
  const [
    zones,
    groups,
    churches,
    campaigns,
    recentUploads,
    recentTransactions,
    recentPayments
  ] = await Promise.all([
    prisma.zone.findMany({
      select: {
        id: true,
        name: true,
        currency: true,
        groups: {
          select: { id: true }
        }
      }
    }),
    prisma.group.findMany({
      select: {
        id: true,
        name: true,
        zoneId: true,
        churches: {
          select: { id: true }
        }
      }
    }),
    prisma.church.findMany({
      select: {
        id: true,
        name: true,
        groupId: true,
        transactions: {
          where: {
            transactionType: "PURCHASE",
            transactionDate: { gte: fyStartDate, lte: fyEndDate }
          },
          select: {
            transactionDate: true,
            lineItems: {
              select: {
                totalAmount: true,
                quantity: true,
                productType: {
                  select: { name: true }
                }
              }
            }
          }
        },
        payments: {
          where: {
            paymentDate: { gte: fyStartDate, lte: fyEndDate }
          },
          select: {
            amount: true,
            paymentDate: true,
            paymentMethod: true,
            campaignCategory: {
              select: { name: true }
            }
          }
        }
      }
    }),
    prisma.campaignCategory.findMany({
      include: {
        payments: {
          where: {
            paymentDate: { gte: fyStartDate, lte: fyEndDate }
          },
          select: { amount: true }
        },
        _count: {
          select: {
            payments: {
              where: {
                paymentDate: { gte: fyStartDate, lte: fyEndDate }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    }),
    prisma.uploadHistory.findMany({
      orderBy: { uploadedAt: "desc" },
      take: 5,
      select: {
        id: true,
        fileName: true,
        recordsProcessed: true,
        uploadType: true,
        uploadedAt: true,
      }
    }),
    prisma.transaction.findMany({
      where: {
        transactionType: "PURCHASE",
        transactionDate: { gte: fyStartDate, lte: fyEndDate }
      },
      orderBy: { transactionDate: "desc" },
      take: 5,
      select: {
        id: true,
        transactionDate: true,
        church: { select: { name: true } },
        lineItems: {
          select: { totalAmount: true, quantity: true }
        }
      }
    }),
    prisma.payment.findMany({
      where: {
        paymentDate: { gte: fyStartDate, lte: fyEndDate }
      },
      orderBy: { paymentDate: "desc" },
      take: 5,
      select: {
        id: true,
        paymentDate: true,
        amount: true,
        church: { select: { name: true } },
        paymentMethod: true,
        campaignCategory: { select: { name: true } }
      }
    })
  ])

  // Create lookup maps for O(1) access instead of O(n) .find() calls
  const groupLookup = new Map(groups.map(g => [g.id, g]))
  const zoneLookup = new Map(zones.map(z => [z.id, z]))

  // Process data for metrics
  let totalOrdersValue = 0
  let totalPaymentsValue = 0
  let monthlyPayments = 0
  let monthlyCopiesDistributed = 0

  const zoneMetrics = new Map<string, {
    name: string
    totalOrders: number
    totalPayments: number
    churchCount: number
  }>()

  const groupMetrics = new Map<string, {
    name: string
    totalOrders: number
    totalPayments: number
    churchCount: number
    zoneId: string
  }>()

  const churchMetrics = new Map<string, {
    name: string
    totalOrders: number
    totalPayments: number
    copiesDistributed: number
  }>()

  // Process church data
  churches.forEach(church => {
    let churchOrders = 0
    let churchPayments = 0
    let churchCopies = 0
    let churchMonthlyPayments = 0
    let churchMonthlyCopies = 0

    church.transactions.forEach(transaction => {
      const orderAmount = transaction.lineItems.reduce((sum, item) => sum + Number(item.totalAmount), 0)
      const orderCopies = transaction.lineItems.reduce((sum, item) => sum + item.quantity, 0)
      
      churchOrders += orderAmount
      churchCopies += orderCopies

      if (isRecentMonth(transaction.transactionDate)) {
        churchMonthlyCopies += orderCopies
      }
    })

    church.payments.forEach(payment => {
      const paymentAmount = Number(payment.amount)
      churchPayments += paymentAmount

      if (isRecentMonth(payment.paymentDate)) {
        churchMonthlyPayments += paymentAmount
      }
    })

    totalOrdersValue += churchOrders
    totalPaymentsValue += churchPayments
    monthlyPayments += churchMonthlyPayments
    monthlyCopiesDistributed += churchMonthlyCopies

    churchMetrics.set(church.id, {
      name: church.name,
      totalOrders: churchOrders,
      totalPayments: churchPayments,
      copiesDistributed: churchCopies
    })

    // Aggregate by group and zone
    const group = groupLookup.get(church.groupId)
    if (group) {
      // Update group metrics
      const existingGroup = groupMetrics.get(group.id) || {
        name: group.name,
        totalOrders: 0,
        totalPayments: 0,
        churchCount: 0,
        zoneId: group.zoneId
      }
      groupMetrics.set(group.id, {
        ...existingGroup,
        totalOrders: existingGroup.totalOrders + churchOrders,
        totalPayments: existingGroup.totalPayments + churchPayments,
        churchCount: existingGroup.churchCount + 1
      })

      // Update zone metrics
      const zone = zoneLookup.get(group.zoneId)
      if (zone) {
        const existing = zoneMetrics.get(zone.id) || { name: zone.name, totalOrders: 0, totalPayments: 0, churchCount: 0 }
        zoneMetrics.set(zone.id, {
          ...existing,
          totalOrders: existing.totalOrders + churchOrders,
          totalPayments: existing.totalPayments + churchPayments,
          churchCount: existing.churchCount + 1
        })
      }
    }
  })

  const outstandingBalance = Math.max(totalOrdersValue - totalPaymentsValue, 0)
  const collectionRate = totalOrdersValue > 0 ? (totalPaymentsValue / totalOrdersValue) * 100 : 0

  // Calculate top performers
  const topPerformingZone = Array.from(zoneMetrics.values())
    .map(zone => ({
      ...zone,
      collectionRate: zone.totalOrders > 0 ? (zone.totalPayments / zone.totalOrders) * 100 : 0
    }))
    .sort((a, b) => b.collectionRate - a.collectionRate)[0] || null

  const topPerformingGroup = Array.from(groupMetrics.values())
    .map(group => ({
      ...group,
      collectionRate: group.totalOrders > 0 ? (group.totalPayments / group.totalOrders) * 100 : 0
    }))
    .sort((a, b) => b.collectionRate - a.collectionRate)[0] || null

  const topPerformingChurch = Array.from(churchMetrics.values())
    .map(church => ({
      ...church,
      collectionRate: church.totalOrders > 0 ? (church.totalPayments / church.totalOrders) * 100 : 0
    }))
    .sort((a, b) => b.collectionRate - a.collectionRate)[0] || null

  // Process campaign data
  const activeCampaigns = campaigns.filter(c => c._count.payments > 0).length
  const campaignTotalRaised = campaigns.reduce((sum, campaign) => 
    sum + campaign.payments.reduce((paymentSum, payment) => paymentSum + Number(payment.amount), 0), 0
  )

  const campaignBreakdown = campaigns.slice(0, 5).map(campaign => ({
    name: campaign.name,
    amount: campaign.payments.reduce((sum, payment) => sum + Number(payment.amount), 0),
    paymentCount: campaign._count.payments,
    isAutoGenerated: campaign.autoGenerated
  }))

  // Process recent activity
  const recentActivity = [
    ...recentUploads.map(upload => ({
      id: upload.id,
      type: 'upload' as const,
      title: 'CSV Upload',
      description: `${upload.fileName} • ${upload.recordsProcessed} records`,
      timestamp: upload.uploadedAt
    })),
    ...recentTransactions.map(transaction => ({
      id: transaction.id,
      type: 'transaction' as const,
      title: `Order • ${transaction.church.name}`,
      description: `${transaction.lineItems.reduce((sum, item) => sum + item.quantity, 0)} copies`,
      timestamp: transaction.transactionDate,
      amount: transaction.lineItems.reduce((sum, item) => sum + Number(item.totalAmount), 0)
    })),
    ...recentPayments.map(payment => ({
      id: payment.id,
      type: 'payment' as const,
      title: `Payment • ${payment.church.name}`,
      description: `${payment.paymentMethod.replace('_', ' ')}${payment.campaignCategory ? ` • ${payment.campaignCategory.name}` : ''}`,
      timestamp: payment.paymentDate,
      amount: Number(payment.amount)
    }))
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 6)

  

  // Process zone performance
  const zonePerformance = Array.from(zoneMetrics.values()).map(zone => ({
    zoneName: zone.name,
    churchCount: zone.churchCount,
    totalOrders: zone.totalOrders,
    totalPayments: zone.totalPayments,
    collectionRate: zone.totalOrders > 0 ? (zone.totalPayments / zone.totalOrders) * 100 : 0
  }))

  return (
    <div className="space-y-8">
      {/* Header */}
      <DashboardHeader
        role={session?.user?.role ?? "CHURCH_USER"}
        userName={session?.user?.name ?? "Admin"}
        fyLabel={fyLabel}
      />

      {/* Key Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Churches */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Churches</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
              <BuildingIcon className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{churches.length.toLocaleString()}</div>
            <p className="text-xs text-slate-500">
              Across {zones.length} zones • {groups.length} groups
            </p>
          </CardContent>
        </Card>

        {/* Payment Received */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Payment Received</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
              <TrendingUpIcon className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(monthlyPayments, 'GBP')}
            </div>
            <p className="text-xs text-slate-500">
              {monthlyCopiesDistributed.toLocaleString()} copies this month
            </p>
          </CardContent>
        </Card>

        {/* Remittance Rate */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Remittance Rate</CardTitle>
            <div className="h-8 w-8 rounded-full bg-violet-50 flex items-center justify-center">
              <TargetIcon className="h-4 w-4 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collectionRate.toFixed(1)}%</div>
            <Badge className={`text-xs ${getCollectionRateColor(collectionRate)}`}>
              {getPerformanceLabel(collectionRate)}
            </Badge>
          </CardContent>
        </Card>

        {/* Outstanding Balance */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Outstanding</CardTitle>
            <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center">
              <AlertTriangleIcon className="h-4 w-4 text-rose-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">
              {formatCurrency(outstandingBalance, 'GBP')}
            </div>
            <p className="text-xs text-slate-500">
              From total orders of {formatCurrency(totalOrdersValue, "GBP")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Top Performers */}
        <Card className="lg:col-span-4 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Performance Leaders</CardTitle>
            <CardDescription>
              {session?.user?.role === 'SUPER_ADMIN'
                ? 'Top performing zones and churches this period'
                : 'Top performing groups and churches in your zone'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Top Zone for Super Admin, Top Group for Zonal Admin */}
            {session?.user?.role === 'SUPER_ADMIN' && topPerformingZone && (
              <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrophyIcon className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Top Zone</span>
                  </div>
                  <p className="font-semibold text-slate-900">{topPerformingZone.name}</p>
                  <p className="text-sm text-slate-600">
                    {topPerformingZone.churchCount} churches • {formatCurrency(topPerformingZone.totalPayments, 'GBP')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{topPerformingZone.collectionRate.toFixed(1)}%</div>
                  <p className="text-xs text-blue-600">remittance rate</p>
                </div>
              </div>
            )}

            {session?.user?.role === 'ZONE_ADMIN' && topPerformingGroup && (
              <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrophyIcon className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Top Group</span>
                  </div>
                  <p className="font-semibold text-slate-900">{topPerformingGroup.name}</p>
                  <p className="text-sm text-slate-600">
                    {topPerformingGroup.churchCount} churches • {formatCurrency(topPerformingGroup.totalPayments, 'GBP')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{topPerformingGroup.collectionRate.toFixed(1)}%</div>
                  <p className="text-xs text-blue-600">remittance rate</p>
                </div>
              </div>
            )}

            {/* Top Church */}
            {topPerformingChurch && (
              <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <StarIcon className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-900">Top Church</span>
                  </div>
                  <p className="font-semibold text-slate-900">{topPerformingChurch.name}</p>
                  <p className="text-sm text-slate-600">
                    {topPerformingChurch.copiesDistributed.toLocaleString()} copies distributed
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-600">{topPerformingChurch.collectionRate.toFixed(1)}%</div>
                  <p className="text-xs text-emerald-600">remittance rate</p>
                </div>
              </div>
            )}

            {/* Zone Performance Summary - Only for Super Admin */}
            {session?.user?.role === 'SUPER_ADMIN' && (
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-3">All Zones Performance</h4>
                <div className="space-y-3">
                  {zonePerformance.slice(0, 4).map((zone, index) => (
                    <div key={zone.zoneName} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{zone.zoneName}</p>
                          <p className="text-xs text-slate-500">{zone.churchCount} churches</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-900">{zone.collectionRate.toFixed(1)}%</p>
                          <p className="text-xs text-slate-500">{formatCurrency(zone.totalPayments, 'GBP')}</p>
                        </div>
                        <Progress value={zone.collectionRate} className="w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Group Performance Summary - Only for Zonal Admin */}
            {session?.user?.role === 'ZONE_ADMIN' && (
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-3">Groups Performance</h4>
                <div className="space-y-3">
                  {Array.from(groupMetrics.values())
                    .map(group => ({
                      ...group,
                      collectionRate: group.totalOrders > 0 ? (group.totalPayments / group.totalOrders) * 100 : 0
                    }))
                    .sort((a, b) => b.collectionRate - a.collectionRate)
                    .slice(0, 4)
                    .map((group, index) => (
                      <div key={group.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{group.name}</p>
                            <p className="text-xs text-slate-500">{group.churchCount} churches</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-900">{group.collectionRate.toFixed(1)}%</p>
                            <p className="text-xs text-slate-500">{formatCurrency(group.totalPayments, 'GBP')}</p>
                          </div>
                          <Progress value={group.collectionRate} className="w-16" />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campaign Activity */}
        <Card className="lg:col-span-3 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Campaign Activity</CardTitle>
            <CardDescription>Active fundraising initiatives</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-slate-50">
                <div className="text-2xl font-bold text-slate-900">{activeCampaigns}</div>
                <p className="text-xs text-slate-600">Active Campaigns</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-emerald-50">
                <div className="text-2xl font-bold text-emerald-600">{formatCurrency(campaignTotalRaised, 'GBP')}</div>
                <p className="text-xs text-slate-600">Total Raised</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-3">Recent Campaigns</h4>
              <div className="space-y-2">
                {campaignBreakdown.slice(0, 4).map((campaign) => (
                  <div key={campaign.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 truncate max-w-[120px]">{campaign.name}</p>
                        <p className="text-xs text-slate-500">{campaign.paymentCount} payments</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">{formatCurrency(campaign.amount, 'GBP')}</p>
                      {campaign.isAutoGenerated && (
                        <Badge variant="secondary" className="text-xs">Auto</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            <CardDescription>Latest system activities and transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto mb-3 flex items-center justify-center">
                    <ActivityIcon className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500">No recent activity</p>
                  <p className="text-xs text-slate-400">Start by uploading data or creating transactions</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'upload' ? 'bg-blue-50' :
                      activity.type === 'transaction' ? 'bg-purple-50' :
                      'bg-emerald-50'
                    }`}>
                      {activity.type === 'upload' ? <UploadIcon className="h-4 w-4 text-blue-600" /> :
                       activity.type === 'transaction' ? <ShoppingCartIcon className="h-4 w-4 text-purple-600" /> :
                       <CreditCardIcon className="h-4 w-4 text-emerald-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                      <p className="text-xs text-slate-500 truncate">{activity.description}</p>
                      {(activity.type === 'transaction' || activity.type === 'payment') && activity.amount && (
                        <p className="text-xs font-medium text-slate-700">{formatCurrency(activity.amount, 'GBP')}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            <CardDescription>Common tasks and workflows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <QuickAction 
              href="/dashboard/upload" 
              icon={UploadIcon} 
              label="Upload CSV Data"
              description="Import orders, payments, or churches"
            />
            <QuickAction 
              href="/dashboard/reports" 
              icon={FileTextIcon} 
              label="View Reports"
              description="Generate detailed financial reports"
            />
            <QuickAction 
              href="/dashboard/churches" 
              icon={BuildingIcon} 
              label="Manage Churches"
              description="View and edit church information"
            />
            <QuickAction 
              href="/dashboard/campaigns" 
              icon={TargetIcon} 
              label="Campaigns"
              description="Track fundraising initiatives"
            />
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
  description: string
}

function QuickAction({ href, label, description, icon: Icon }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 p-3 rounded-lg border border-slate-200/60 hover:bg-slate-50 hover:border-slate-300 transition-all group"
    >
      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-200 transition-colors">
        <Icon className="h-5 w-5 text-slate-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </Link>
  )
}

// Icon Components
function BuildingIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  )
}

function TrendingUpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
      <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
  )
}

function TargetIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="6"></circle>
      <circle cx="12" cy="12" r="2"></circle>
    </svg>
  )
}

function AlertTriangleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  )
}

function TrophyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
      <path d="M4 22h16"></path>
      <path d="M10 14.66V17c0 .55.47.98.97 1.21C12.5 18.66 14 18.83 15.3 18.42c.5-.16.97-.58.97-1.21v-2.34"></path>
      <path d="M18 10a6 6 0 0 0-12 0v8h12V10Z"></path>
    </svg>
  )
}

function StarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  )
}

function ActivityIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
    </svg>
  )
}

function ShoppingCartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="21" r="1"></circle>
      <circle cx="20" cy="21" r="1"></circle>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
    </svg>
  )
}

function CreditCardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="14" x="2" y="5" rx="2"></rect>
      <line x1="2" x2="22" y1="10" y2="10"></line>
    </svg>
  )
}

function FileTextIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
      <polyline points="14,2 14,8 20,8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  )
}

function UploadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  )
}
