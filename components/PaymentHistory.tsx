"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Decimal } from "@prisma/client/runtime/library"

interface Payment {
  id: string
  paymentDate: Date
  amount: number | string | Decimal
  currency: string
  paymentMethod: string
  forPurpose: string
  referenceNumber: string | null
  uploader: {
    name: string
  }
  church?: {
    id: string
    name: string
  }
}

interface PaymentHistoryProps {
  payments: Payment[]
  currency?: string
  showChurchColumn?: boolean
}

export function PaymentHistory({ 
  payments, 
  currency: defaultCurrency = "GBP",
  showChurchColumn = false 
}: PaymentHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [selectedMethod, setSelectedMethod] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Get unique years and methods
  const years = useMemo(() => {
    const uniqueYears = Array.from(
      new Set(payments.map((p) => new Date(p.paymentDate).getFullYear().toString()))
    ).sort((a, b) => parseInt(b) - parseInt(a))
    return ["all", ...uniqueYears]
  }, [payments])

  const paymentMethods = useMemo(() => {
    const uniqueMethods = Array.from(new Set(payments.map((p) => p.paymentMethod)))
    return ["all", ...uniqueMethods]
  }, [payments])

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const year = new Date(payment.paymentDate).getFullYear().toString()

      // Reference search
      const matchesSearch =
        payment.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.uploader.name.toLowerCase().includes(searchQuery.toLowerCase())

      // Year filter
      const matchesYear = selectedYear === "all" || year === selectedYear

      // Method filter
      const matchesMethod = selectedMethod === "all" || payment.paymentMethod === selectedMethod

      return matchesSearch && matchesYear && matchesMethod
    })
  }, [payments, searchQuery, selectedYear, selectedMethod])

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage)
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Calculate totals
  const filteredTotal = filteredPayments.reduce((sum, payment) => sum + Number(payment.amount), 0)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case "BANK_TRANSFER":
        return "bg-blue-100 text-blue-800"
      case "CASH":
        return "bg-green-100 text-green-800"
      case "ESPEES":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <CardDescription>
          {filteredPayments.length} payment{filteredPayments.length !== 1 ? "s" : ""} • Total:{" "}
          {formatCurrency(filteredTotal, "GBP")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by reference or uploader..."
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
            value={selectedMethod}
            onChange={(e) => {
              setSelectedMethod(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3 py-2 border rounded-md bg-background"
          >
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {method === "all" ? "All Methods" : method.replace("_", " ")}
              </option>
            ))}
          </select>

          {(searchQuery || selectedYear !== "all" || selectedMethod !== "all") && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setSelectedYear("all")
                setSelectedMethod("all")
                setCurrentPage(1)
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Payments List */}
        <div className="space-y-3">
          {paginatedPayments.length > 0 ? (
            paginatedPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1">
                  {showChurchColumn && payment.church && (
                    <div className="font-medium text-slate-900 mb-1">{payment.church.name}</div>
                  )}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="font-semibold">{formatDate(payment.paymentDate)}</div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getMethodBadgeColor(
                        payment.paymentMethod
                      )}`}
                    >
                      {payment.paymentMethod.replace("_", " ")}
                    </span>
                    {payment.forPurpose && (
                      <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                        {payment.forPurpose}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {payment.referenceNumber && (
                      <span className="mr-3">Ref: {payment.referenceNumber}</span>
                    )}
                    <span>Uploaded by {payment.uploader.name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(Number(payment.amount), defaultCurrency)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No payments found matching your criteria
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} • Showing {paginatedPayments.length} of{" "}
              {filteredPayments.length} payments
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
