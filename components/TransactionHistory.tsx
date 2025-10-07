"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Decimal } from "@prisma/client/runtime/library"

interface Transaction {
  id: string
  transactionDate: Date
  currency: string
  lineItems: Array<{
    id: string
    quantity: number
    unitPrice: number | string | Decimal
    totalAmount: number | string | Decimal
    productType: {
      name: string
    }
  }>
  uploader: {
    name: string
  }
  church?: {
    id: string
    name: string
  }
}

interface TransactionHistoryProps {
  transactions: Transaction[]
  currency?: string
  showChurchColumn?: boolean
}

export function TransactionHistory({ 
  transactions, 
  currency: defaultCurrency = "GBP",
  showChurchColumn = false 
}: TransactionHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Get unique years from transactions
  const years = useMemo(() => {
    const uniqueYears = Array.from(
      new Set(transactions.map((t) => new Date(t.transactionDate).getFullYear().toString()))
    ).sort((a, b) => parseInt(b) - parseInt(a))
    return ["all", ...uniqueYears]
  }, [transactions])

  const months = [
    "all",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.transactionDate)
      const year = transactionDate.getFullYear().toString()
      const month = transactionDate.toLocaleString("default", { month: "long" })

      // Product search
      const matchesSearch = transaction.lineItems.some((item) =>
        item.productType.name.toLowerCase().includes(searchQuery.toLowerCase())
      )

      // Year filter
      const matchesYear = selectedYear === "all" || year === selectedYear

      // Month filter
      const matchesMonth = selectedMonth === "all" || month === selectedMonth

      return matchesSearch && matchesYear && matchesMonth
    })
  }, [transactions, searchQuery, selectedYear, selectedMonth])

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Calculate totals for filtered transactions
  const filteredTotal = filteredTransactions.reduce((sum, transaction) => {
    return (
      sum +
      transaction.lineItems.reduce((lineSum, item) => lineSum + Number(item.totalAmount), 0)
    )
  }, 0)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>
          {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}{" "}
          • Total: {formatCurrency(filteredTotal, "GBP")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by product name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>

          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3 py-2 border rounded-md bg-background"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year === "all" ? "All Years" : year}
              </option>
            ))}
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3 py-2 border rounded-md bg-background"
          >
            {months.map((month) => (
              <option key={month} value={month}>
                {month === "all" ? "All Months" : month}
              </option>
            ))}
          </select>

          {(searchQuery || selectedYear !== "all" || selectedMonth !== "all") && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setSelectedYear("all")
                setSelectedMonth("all")
                setCurrentPage(1)
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Transactions List */}
        <div className="space-y-4">
          {paginatedTransactions.length > 0 ? (
            paginatedTransactions.map((transaction) => (
              <div key={transaction.id} className="p-4 border rounded-lg space-y-3">
                {/* Transaction Header */}
                <div className="flex items-start justify-between">
                  <div>
                    {showChurchColumn && transaction.church && (
                      <div className="font-medium text-slate-900">{transaction.church.name}</div>
                    )}
                    <div className="font-semibold">{formatDate(transaction.transactionDate)}</div>
                    <div className="text-sm text-muted-foreground">
                      Uploaded by {transaction.uploader.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {formatCurrency(
                        transaction.lineItems.reduce(
                          (sum, item) => sum + Number(item.totalAmount),
                          0
                        ),
                        defaultCurrency
                      )}
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                <div className="pt-3 border-t space-y-2">
                  {transaction.lineItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <span className="font-medium">{item.productType.name}</span>
                        <span className="text-muted-foreground ml-2">
                          ({item.quantity} × {formatCurrency(Number(item.unitPrice), transaction.currency)})
                        </span>
                      </div>
                      <div className="font-semibold">
                        {formatCurrency(Number(item.totalAmount), transaction.currency)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No transactions found matching your criteria
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} • Showing {paginatedTransactions.length} of{" "}
              {filteredTransactions.length} transactions
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber
                if (totalPages <= 5) {
                  pageNumber = i + 1
                } else if (currentPage <= 3) {
                  pageNumber = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i
                } else {
                  pageNumber = currentPage - 2 + i
                }
                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                )
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
