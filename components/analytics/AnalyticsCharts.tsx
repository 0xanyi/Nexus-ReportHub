"use client"

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface MonthlyData {
  month: string
  currentPurchases: number
  currentPayments: number
  lastPurchases: number
  lastPayments: number
  collectionRate: number
}

interface GroupData {
  name: string
  totalPurchases: number
  totalPayments: number
  collectionRate: number
  churchCount: number
}

interface AnalyticsChartsProps {
  monthlyData: MonthlyData[]
  groupData: GroupData[]
}

export function AnalyticsCharts({ monthlyData, groupData }: AnalyticsChartsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Year-over-Year Comparison */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Year-over-Year Purchase Comparison</CardTitle>
          <CardDescription>Compare current year vs previous year purchases by month</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `£${value.toLocaleString()}`} />
              <Legend />
              <Area
                type="monotone"
                dataKey="currentPurchases"
                stroke="#8884d8"
                fillOpacity={1}
                fill="url(#colorCurrent)"
                name="Current Year"
              />
              <Area
                type="monotone"
                dataKey="lastPurchases"
                stroke="#82ca9d"
                fillOpacity={1}
                fill="url(#colorLast)"
                name="Last Year"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Collection Rate Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Collection Rate</CardTitle>
          <CardDescription>Percentage of purchases collected each month</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
              <Line
                type="monotone"
                dataKey="collectionRate"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ r: 5 }}
                activeDot={{ r: 7 }}
                name="Collection Rate"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Group Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Group Performance</CardTitle>
          <CardDescription>Collection rates by group</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={groupData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(1)}%`}
                contentStyle={{ borderRadius: "8px" }}
              />
              <Bar dataKey="collectionRate" fill="#10b981" name="Collection Rate %" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Payments vs Purchases Trend */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Payments vs Purchases (Current Year)</CardTitle>
          <CardDescription>Monthly breakdown of purchases and payments</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `£${value.toLocaleString()}`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="currentPurchases"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Purchases"
              />
              <Line
                type="monotone"
                dataKey="currentPayments"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Payments"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Group Performance Radar */}
      <Card className="col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle>Group Performance Radar</CardTitle>
          <CardDescription>Multi-dimensional group comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={groupData.slice(0, 6)}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis domain={[0, 100]} />
              <Radar
                name="Collection Rate"
                dataKey="collectionRate"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Group Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Group Financial Summary</CardTitle>
          <CardDescription>Total purchases and payments by group</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={groupData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value: number) => `£${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="totalPurchases" fill="#8884d8" name="Purchases" radius={[8, 8, 0, 0]} />
              <Bar dataKey="totalPayments" fill="#82ca9d" name="Payments" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
