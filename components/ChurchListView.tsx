"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

interface Church {
  id: string
  name: string
  group: {
    id: string
    name: string
    zone: {
      name: string
    }
  }
  _count: {
    transactions: number
    payments: number
  }
  totalOrders: number
  totalPayments: number
  totalCampaigns: number
  balance: number
}

interface ChurchListViewProps {
  churches: Church[]
  isAdmin: boolean
}

type SortField = "name" | "group" | "orders" | "payments" | "campaigns" | "balance"
type SortOrder = "asc" | "desc"
type ViewMode = "grid" | "table"

export function ChurchListView({ churches }: ChurchListViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [selectedGroup, setSelectedGroup] = useState<string>("all")

  // Get unique groups for filtering
  const groups = useMemo(() => {
    const uniqueGroups = Array.from(new Set(churches.map((c) => c.group.name))).sort()
    return ["all", ...uniqueGroups]
  }, [churches])

  // Filter and sort churches
  const filteredChurches = useMemo(() => {
    const filtered = churches.filter((church) => {
      const matchesSearch =
        church.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        church.group.name.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesGroup = selectedGroup === "all" || church.group.name === selectedGroup

      return matchesSearch && matchesGroup
    })

    // Sort
    filtered.sort((a, b) => {
      let compareValue = 0

      switch (sortField) {
        case "name":
          compareValue = a.name.localeCompare(b.name)
          break
        case "group":
          compareValue = a.group.name.localeCompare(b.group.name)
          break
        case "orders":
          compareValue = a.totalOrders - b.totalOrders
          break
        case "payments":
          compareValue = a.totalPayments - b.totalPayments
          break
        case "campaigns":
          compareValue = a.totalCampaigns - b.totalCampaigns
          break
        case "balance":
          compareValue = a.balance - b.balance
          break
      }

      return sortOrder === "asc" ? compareValue : -compareValue
    })

    return filtered
  }, [churches, searchQuery, selectedGroup, sortField, sortOrder])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return "↕️"
    return sortOrder === "asc" ? "↑" : "↓"
  }

  return (
    <div className="space-y-4">
      {/* Filters and Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search churches by name or group..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Group Filter */}
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              {groups.map((group) => (
                <option key={group} value={group}>
                  {group === "all" ? "All Groups" : group}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex border rounded-md">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2 text-sm ${
                  viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-background"
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-4 py-2 text-sm ${
                  viewMode === "table" ? "bg-primary text-primary-foreground" : "bg-background"
                }`}
              >
                Table
              </button>
            </div>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredChurches.length} of {churches.length} churches
          </div>
        </CardContent>
      </Card>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredChurches.map((church) => (
            <Link key={church.id} href={`/dashboard/churches/${church.id}`}>
              <Card className="hover:border-primary transition-colors h-full">
                <CardHeader>
                  <CardTitle className="text-lg">{church.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {church.group.name} • {church.group.zone.name}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Orders:</span>
                      <span className="font-medium">
                        {formatCurrency(church.totalOrders, "GBP")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payments:</span>
                      <span className="font-medium">
                        {formatCurrency(church.totalPayments, "GBP")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Campaigns:</span>
                      <span className="font-medium text-blue-600">
                        {formatCurrency(church.totalCampaigns, "GBP")}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-muted-foreground">Balance:</span>
                      <span
                        className={`font-semibold ${
                          church.balance < 0 ? "text-destructive" : "text-green-600"
                        }`}
                      >
                        {formatCurrency(Math.abs(church.balance), "GBP")}
                        {church.balance < 0 ? " owed" : " credit"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-3">
                      <button
                        onClick={() => handleSort("name")}
                        className="font-medium hover:text-primary flex items-center gap-1"
                      >
                        Church Name {getSortIcon("name")}
                      </button>
                    </th>
                    <th className="text-left p-3">
                      <button
                        onClick={() => handleSort("group")}
                        className="font-medium hover:text-primary flex items-center gap-1"
                      >
                        Group {getSortIcon("group")}
                      </button>
                    </th>
                    <th className="text-right p-3">
                      <button
                        onClick={() => handleSort("orders")}
                        className="font-medium hover:text-primary flex items-center gap-1 justify-end ml-auto"
                      >
                        Orders {getSortIcon("orders")}
                      </button>
                    </th>
                    <th className="text-right p-3">
                      <button
                        onClick={() => handleSort("payments")}
                        className="font-medium hover:text-primary flex items-center gap-1 justify-end ml-auto"
                      >
                        Payments {getSortIcon("payments")}
                      </button>
                    </th>
                    <th className="text-right p-3">
                      <button
                        onClick={() => handleSort("campaigns")}
                        className="font-medium hover:text-primary flex items-center gap-1 justify-end ml-auto"
                      >
                        Campaigns {getSortIcon("campaigns")}
                      </button>
                    </th>
                    <th className="text-right p-3">
                      <button
                        onClick={() => handleSort("balance")}
                        className="font-medium hover:text-primary flex items-center gap-1 justify-end ml-auto"
                      >
                        Balance {getSortIcon("balance")}
                      </button>
                    </th>
                    <th className="text-center p-3">
                      <span className="font-medium">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChurches.map((church) => (
                    <tr key={church.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <div className="font-medium">{church.name}</div>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        <div>{church.group.name}</div>
                        <div className="text-xs">{church.group.zone.name}</div>
                      </td>
                      <td className="p-3 text-right font-medium">
                        {formatCurrency(church.totalOrders, "GBP")}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {formatCurrency(church.totalPayments, "GBP")}
                      </td>
                      <td className="p-3 text-right font-medium text-blue-600">
                        {formatCurrency(church.totalCampaigns, "GBP")}
                      </td>
                      <td className="p-3 text-right">
                        <div
                          className={`font-semibold ${
                            church.balance < 0 ? "text-destructive" : "text-green-600"
                          }`}
                        >
                          {formatCurrency(Math.abs(church.balance), "GBP")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {church.balance < 0 ? "owed" : "credit"}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Link href={`/dashboard/churches/${church.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredChurches.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              No churches found matching your criteria
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
