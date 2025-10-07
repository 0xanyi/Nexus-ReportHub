"use client"

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface FinancialChartsProps {
  monthlyData: Array<{ month: string; orders: number; payments: number }>
  productData: Array<{ name: string; value: number; quantity: number }>
  topChurches: Array<{ name: string; orders: number; payments: number; balance: number }>
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

export function FinancialCharts({ monthlyData, productData, topChurches }: FinancialChartsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Monthly Orders vs Payments */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Monthly Orders vs Payments</CardTitle>
          <CardDescription>Track orders and payments over the last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `£${value.toLocaleString()}`}
                contentStyle={{ borderRadius: "8px" }}
              />
              <Legend />
              <Bar dataKey="orders" fill="#8884d8" name="Orders" radius={[8, 8, 0, 0]} />
              <Bar dataKey="payments" fill="#82ca9d" name="Payments" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Product Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Product Distribution</CardTitle>
          <CardDescription>Breakdown of orders by product type</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={productData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: Record<string, unknown>) => `${props.name as string}: ${((props.percent as number) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {productData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `£${value.toLocaleString()}`}
                contentStyle={{ borderRadius: "8px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Churches by Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Top Churches by Orders</CardTitle>
          <CardDescription>Churches with highest order volumes</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topChurches} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip
                formatter={(value: number) => `£${value.toLocaleString()}`}
                contentStyle={{ borderRadius: "8px" }}
              />
              <Legend />
              <Bar dataKey="orders" fill="#8884d8" name="Orders" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Payment Trend Line Chart */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Payment Collection Trend</CardTitle>
          <CardDescription>Tracking payment collection over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `£${value.toLocaleString()}`}
                contentStyle={{ borderRadius: "8px" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="payments"
                stroke="#82ca9d"
                name="Payments"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#8884d8"
                name="Orders"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
