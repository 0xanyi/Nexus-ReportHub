"use client"

import { PaymentSummaryData } from "@/lib/payment-summary"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileSpreadsheet } from "lucide-react"
import { exportPaymentSummaryToExcel, exportPaymentSummaryToPDF } from "@/lib/exports"

interface PaymentSummaryReportProps {
  data: PaymentSummaryData
}

export function PaymentSummaryReport({ data }: PaymentSummaryReportProps) {
  const handleExportExcel = () => {
    exportPaymentSummaryToExcel(data)
  }

  const handleExportPDF = () => {
    exportPaymentSummaryToPDF(data)
  }

  const formatAmount = (amount: number, showZero = false) => {
    if (amount === 0 && !showZero) return ""
    return amount.toLocaleString("en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  return (
    <Card className="border-none bg-white/90 shadow-xl shadow-slate-900/5">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900">{data.title}</CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              Comprehensive payment breakdown by category and period
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExportExcel}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
            <Button
              onClick={handleExportPDF}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-slate-300 bg-sky-100 p-2 text-center font-semibold text-slate-900"></th>
                <th className="border border-slate-300 bg-sky-100 p-2 text-center font-semibold text-slate-900"></th>
                <th
                  colSpan={2}
                  className="border border-slate-300 bg-sky-100 p-2 text-center font-semibold text-slate-900"
                >
                  PRINT
                </th>
                <th
                  colSpan={4}
                  className="border border-slate-300 bg-sky-100 p-2 text-center font-semibold text-slate-900"
                >
                  INCOME TOWARDS SPONSORSHIP / PROJECT PAYMENT
                </th>
                <th className="border border-slate-300 bg-sky-100 p-2 text-center font-semibold text-slate-900"></th>
                <th
                  colSpan={2}
                  className="border border-slate-300 bg-sky-100 p-2 text-center font-semibold text-slate-900"
                >
                  INCOME FROM THE GROUP LINKS
                </th>
              </tr>
              <tr>
                <th className="border border-slate-300 bg-sky-100 p-2 text-center text-xs font-medium text-slate-700">
                  S/N
                </th>
                <th className="border border-slate-300 bg-sky-100 p-2 text-center text-xs font-medium text-slate-700">
                  MONTH
                </th>
                <th className="border border-slate-300 bg-sky-100 p-2 text-center text-xs font-medium text-slate-700">
                  INCOME TOWARDS PRINTS
                  <br />
                  POUNDS
                </th>
                <th className="border border-slate-300 bg-sky-100 p-2 text-center text-xs font-medium text-slate-700">
                  REACHOUT WORLD PAY PAYMENT
                  <br />
                  POUNDS
                </th>
                <th className="w-24 border border-slate-300 bg-sky-100 p-2 text-center text-xs font-medium text-slate-700">
                  ZONE
                  <br />
                  POUND
                  <br />
                  PAYMENT
                </th>
                <th className="w-24 border border-slate-300 bg-sky-100 p-2 text-center text-xs font-medium text-slate-700">
                  NAIRA
                  <br />
                  PAYMENT
                </th>
                <th className="w-24 border border-slate-300 bg-sky-100 p-2 text-center text-xs font-medium text-slate-700">
                  ESPEES
                  <br />
                  PAYMENT
                </th>
                <th className="border border-slate-300 bg-sky-100 p-2"></th>
                <th className="w-28 border border-slate-300 bg-sky-100 p-2 text-center text-xs font-medium text-slate-700">
                  TOTAL INCOME DEC 24-NOV 2025 (ESPEES)
                </th>
                <th className="border border-slate-300 bg-sky-100 p-2 text-center text-xs font-medium text-slate-700">
                  POUNDS
                </th>
                <th className="border border-slate-300 bg-sky-100 p-2 text-center text-xs font-medium text-slate-700">
                  ESPEES
                </th>
                <th className="border border-slate-300 bg-sky-100 p-2 text-center text-xs font-medium text-slate-700">
                  COMMENT
                </th>
              </tr>
            </thead>
            <tbody>
              {data.months.map((month, index) => (
                <tr key={month.month} className="hover:bg-slate-50">
                  <td className="border border-slate-300 p-2 text-center text-slate-700">
                    {index + 1}
                  </td>
                  <td className="border border-slate-300 p-2 text-center font-medium text-slate-800">
                    {month.monthName}
                  </td>
                  <td className="border border-slate-300 p-2 text-right tabular-nums text-slate-800">
                    {month.printIncomePounds > 0 && "£"}
                    {formatAmount(month.printIncomePounds)}
                  </td>
                  <td className="border border-slate-300 p-2 text-right tabular-nums text-slate-800">
                    {month.reachoutWorldPayPounds > 0 && "£"}
                    {formatAmount(month.reachoutWorldPayPounds)}
                  </td>
                  <td className="border border-slate-300 p-2 text-right tabular-nums text-slate-800">
                    {month.zonePoundPayment > 0 && "£"}
                    {formatAmount(month.zonePoundPayment)}
                  </td>
                  <td className="border border-slate-300 p-2 text-right tabular-nums text-slate-800">
                    {month.zoneNairaPayment > 0 && "₦"}
                    {formatAmount(month.zoneNairaPayment)}
                  </td>
                  <td className="border border-slate-300 p-2 text-right tabular-nums text-slate-800">
                    {formatAmount(month.zoneEspeesPayment)}
                  </td>
                  <td className="border border-slate-300 p-2"></td>
                  <td className="border border-slate-300 p-2"></td>
                  <td className="border border-slate-300 p-2 text-right tabular-nums text-slate-800">
                    {month.groupLinksPounds > 0 && "£"}
                    {formatAmount(month.groupLinksPounds)}
                  </td>
                  <td className="border border-slate-300 p-2 text-right tabular-nums text-slate-800">
                    {formatAmount(month.groupLinksEspees)}
                  </td>
                  <td className="border border-slate-300 p-2 text-sm text-slate-500">
                    {month.comment || ""}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-semibold">
                <td className="border border-slate-300 p-2"></td>
                <td className="border border-slate-300 p-2 text-center text-slate-900">TOTAL</td>
                <td className="border border-slate-300 p-2 text-right tabular-nums text-slate-900">
                  £ {formatAmount(data.totals.printIncomePounds, true)}
                </td>
                <td className="border border-slate-300 p-2 text-right tabular-nums text-slate-900">
                  {data.totals.reachoutWorldPayPounds > 0 && "£"}
                  {formatAmount(data.totals.reachoutWorldPayPounds, true)}
                </td>
                <td className="border border-slate-300 p-2 text-right tabular-nums text-slate-900">
                  £ {formatAmount(data.totals.zonePoundPayment, true)}
                </td>
                <td className="border border-slate-300 p-2 text-right tabular-nums text-slate-900">
                  ₦ {formatAmount(data.totals.zoneNairaPayment, true)}
                </td>
                <td className="border border-slate-300 p-2 text-right tabular-nums text-slate-900">
                  {formatAmount(data.totals.zoneEspeesPayment, true)}
                </td>
                <td className="border border-slate-300 p-2"></td>
                <td className="border border-slate-300 p-2"></td>
                <td className="border border-slate-300 p-2 text-right tabular-nums text-slate-900">
                  £ {formatAmount(data.totals.groupLinksPounds, true)}
                </td>
                <td className="border border-slate-300 p-2 text-right tabular-nums text-slate-900">
                  {formatAmount(data.totals.groupLinksEspees, true)}
                </td>
                <td className="border border-slate-300 p-2"></td>
              </tr>
              <tr className="bg-slate-100 font-bold">
                <td className="border border-slate-300 p-2"></td>
                <td className="border border-slate-300 p-2 text-center text-slate-900">
                  GRAND TOTAL :
                </td>
                <td
                  colSpan={2}
                  className="border border-slate-300 p-2 text-right tabular-nums text-slate-900"
                >
                  £ {formatAmount(data.grandTotal.pounds, true)}
                </td>
                <td className="border border-slate-300 p-2 text-right tabular-nums text-slate-900">
                  £
                </td>
                <td className="border border-slate-300 p-2 text-right tabular-nums text-slate-900">
                  ₦ {formatAmount(data.grandTotal.naira, true)}
                </td>
                <td className="border border-slate-300 p-2 text-right tabular-nums text-slate-900">
                  {formatAmount(data.grandTotal.espees, true)}
                </td>
                <td className="border border-slate-300 p-2"></td>
                <td className="border border-slate-300 p-2"></td>
                <td className="border border-slate-300 p-2 text-right tabular-nums text-slate-900">
                  £
                </td>
                <td className="border border-slate-300 p-2 text-right tabular-nums text-slate-900">
                  ₦
                </td>
                <td className="border border-slate-300 p-2"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
