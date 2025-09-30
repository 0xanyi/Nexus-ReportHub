"use client"

import { Button } from "@/components/ui/button"
import { exportChurchToPDF, exportChurchToExcel, exportGroupToPDF, exportGroupToExcel } from "@/lib/exports"

interface ChurchExportButtonsProps {
  type: "church"
  data: {
    name: string
    group: string
    zone: string
    totalPurchases: number
    totalPayments: number
    balance: number
    transactions: Array<{
      date: string
      products: string
      amount: number
    }>
    payments: Array<{
      date: string
      method: string
      amount: number
      reference?: string
    }>
  }
}

interface GroupExportButtonsProps {
  type: "group"
  data: {
    name: string
    zone: string
    churches: Array<{
      name: string
      purchases: number
      payments: number
      balance: number
    }>
    totalPurchases: number
    totalPayments: number
    totalBalance: number
  }
}

type ExportButtonsProps = ChurchExportButtonsProps | GroupExportButtonsProps

export function ExportButtons({ type, data }: ExportButtonsProps) {
  function handlePDFExport() {
    if (type === "church") {
      exportChurchToPDF(data)
    } else {
      exportGroupToPDF(data)
    }
  }

  function handleExcelExport() {
    if (type === "church") {
      exportChurchToExcel(data)
    } else {
      exportGroupToExcel(data)
    }
  }

  return (
    <div className="flex gap-2">
      <Button onClick={handlePDFExport} variant="outline" size="sm">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        Export PDF
      </Button>
      <Button onClick={handleExcelExport} variant="outline" size="sm">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export Excel
      </Button>
    </div>
  )
}
