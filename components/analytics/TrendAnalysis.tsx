"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface ChurchPerformance {
  name: string
  group: string
  totalPurchases: number
  totalPayments: number
  collectionRate: number
  transactionCount: number
}

interface TrendAnalysisProps {
  churchPerformance: ChurchPerformance[]
  currentYear: number
  lastYear: number
}

export function TrendAnalysis({ churchPerformance }: TrendAnalysisProps) {
  const [selectedCategory, setSelectedCategory] = useState<"top" | "low" | "inactive">("top")

  const topPerformers = churchPerformance.slice(0, 10)
  const lowPerformers = churchPerformance.filter((c) => c.collectionRate < 50).slice(0, 10)
  const inactiveChurches = churchPerformance.filter((c) => c.transactionCount === 0)

  const getStatusBadge = (rate: number) => {
    if (rate >= 90) return { text: "Excellent", color: "bg-green-100 text-green-800" }
    if (rate >= 70) return { text: "Good", color: "bg-blue-100 text-blue-800" }
    if (rate >= 50) return { text: "Fair", color: "bg-yellow-100 text-yellow-800" }
    return { text: "Needs Attention", color: "bg-red-100 text-red-800" }
  }

  const categories = [
    {
      id: "top",
      label: "Top Performers",
      count: topPerformers.length,
      data: topPerformers,
    },
    {
      id: "low",
      label: "Low Collection Rate",
      count: lowPerformers.length,
      data: lowPerformers,
    },
    {
      id: "inactive",
      label: "Inactive Churches",
      count: inactiveChurches.length,
      data: inactiveChurches,
    },
  ] as const

  const selectedData =
    categories.find((c) => c.id === selectedCategory)?.data || topPerformers

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Category Selector */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Church Performance Analysis</CardTitle>
          <CardDescription>
            Analyze church performance by collection rates and activity levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {category.label}
                <span className="ml-2 px-2 py-0.5 rounded-full bg-background/20">
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance List */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>
            {categories.find((c) => c.id === selectedCategory)?.label}
          </CardTitle>
          <CardDescription>
            {selectedCategory === "top" &&
              "Churches with the highest payment collection rates"}
            {selectedCategory === "low" &&
              "Churches with collection rates below 50% - may need follow-up"}
            {selectedCategory === "inactive" &&
              "Churches with no transaction history - verify status"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {selectedData.length > 0 ? (
              selectedData.map((church, index) => (
                <div
                  key={church.name}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{church.name}</div>
                      <div className="text-sm text-muted-foreground">{church.group}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Purchases</div>
                      <div className="font-semibold">
                        {formatCurrency(church.totalPurchases, "GBP")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Payments</div>
                      <div className="font-semibold text-green-600">
                        {formatCurrency(church.totalPayments, "GBP")}
                      </div>
                    </div>
                    {church.collectionRate > 0 && (
                      <div className="text-right min-w-[100px]">
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            getStatusBadge(church.collectionRate).color
                          }`}
                        >
                          {church.collectionRate.toFixed(1)}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No churches in this category
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Insights Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedCategory === "top" && (
            <>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="font-semibold text-green-800 mb-1">Success Factors</div>
                <p className="text-sm text-green-700">
                  These churches maintain excellent payment records. Consider them as case studies
                  for best practices.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Average Collection Rate</span>
                  <span className="font-semibold">
                    {topPerformers.length > 0
                      ? (
                          topPerformers.reduce((sum, c) => sum + c.collectionRate, 0) /
                          topPerformers.length
                        ).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Purchases</span>
                  <span className="font-semibold">
                    {formatCurrency(
                      topPerformers.reduce((sum, c) => sum + c.totalPurchases, 0),
                      "GBP"
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Collected</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(
                      topPerformers.reduce((sum, c) => sum + c.totalPayments, 0),
                      "GBP"
                    )}
                  </span>
                </div>
              </div>
            </>
          )}

          {selectedCategory === "low" && (
            <>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="font-semibold text-yellow-800 mb-1">Action Required</div>
                <p className="text-sm text-yellow-700">
                  These churches have collection rates below 50%. Follow-up communication
                  recommended.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Outstanding</span>
                  <span className="font-semibold text-destructive">
                    {formatCurrency(
                      lowPerformers.reduce(
                        (sum, c) => sum + (c.totalPurchases - c.totalPayments),
                        0
                      ),
                      "GBP"
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avg Collection Rate</span>
                  <span className="font-semibold">
                    {lowPerformers.length > 0
                      ? (
                          lowPerformers.reduce((sum, c) => sum + c.collectionRate, 0) /
                          lowPerformers.length
                        ).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
              </div>
              <div className="pt-3 border-t">
                <div className="text-sm font-semibold mb-2">Recommended Actions:</div>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Send payment reminders</li>
                  <li>Schedule follow-up calls</li>
                  <li>Review credit terms</li>
                </ul>
              </div>
            </>
          )}

          {selectedCategory === "inactive" && (
            <>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="font-semibold text-red-800 mb-1">Inactive Status</div>
                <p className="text-sm text-red-700">
                  These churches have no transaction history. Verify their status and engagement.
                </p>
              </div>
              <div className="pt-3">
                <div className="text-sm font-semibold mb-2">Next Steps:</div>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Verify church information</li>
                  <li>Contact church leadership</li>
                  <li>Assess engagement level</li>
                  <li>Consider removal if closed</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
