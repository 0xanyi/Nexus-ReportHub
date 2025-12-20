import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import ExcelJS from "exceljs"
import { PaymentSummaryData } from "./payment-summary"

interface ChurchData {
  name: string
  group: string
  zone: string
  totalOrders: number
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

interface GroupData {
  name: string
  zone: string
  churches: Array<{
    name: string
    orders: number
    payments: number
    balance: number
  }>
  totalOrders: number
  totalPayments: number
  totalBalance: number
}

export function exportChurchToPDF(data: ChurchData) {
  const doc = new jsPDF()
  
  // Title
  doc.setFontSize(18)
  doc.text("Church Financial Report", 14, 20)
  
  // Church Info
  doc.setFontSize(12)
  doc.text(`Church: ${data.name}`, 14, 30)
  doc.text(`Group: ${data.group}`, 14, 37)
  doc.text(`Zone: ${data.zone}`, 14, 44)
  doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 14, 51)
  
  // Summary
  doc.setFontSize(14)
  doc.text("Financial Summary", 14, 65)
  doc.setFontSize(10)
  doc.text(`Total Orders: £${data.totalOrders.toLocaleString()}`, 14, 73)
  doc.text(`Total Payments: £${data.totalPayments.toLocaleString()}`, 14, 80)
  doc.text(
    `Balance: £${Math.abs(data.balance).toLocaleString()} ${data.balance < 0 ? "(Owed)" : "(Credit)"}`,
    14,
    87
  )
  
  // Transactions Table
  if (data.transactions.length > 0) {
    autoTable(doc, {
      startY: 95,
      head: [["Date", "Products", "Amount"]],
      body: data.transactions.map((t) => [
        t.date,
        t.products,
        `£${t.amount.toLocaleString()}`,
      ]),
      theme: "striped",
      headStyles: { fillColor: [66, 139, 202] },
    })
  }
  
  // Payments Table
  const finalY = 95
  if (data.payments.length > 0) {
    doc.text("Payment History", 14, finalY + 10)
    autoTable(doc, {
      startY: finalY + 15,
      head: [["Date", "Method", "Amount", "Reference"]],
      body: data.payments.map((p) => [
        p.date,
        p.method,
        `£${p.amount.toLocaleString()}`,
        p.reference || "-",
      ]),
      theme: "striped",
      headStyles: { fillColor: [92, 184, 92] },
    })
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages()
  doc.setFontSize(8)
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    )
  }
  
  // Save
  doc.save(`${data.name.replace(/ /g, "_")}_Report_${new Date().toISOString().split("T")[0]}.pdf`)
}

export function exportChurchToExcel(data: ChurchData) {
  const workbook = new ExcelJS.Workbook()
  
  // Summary Sheet
  const summarySheet = workbook.addWorksheet("Summary")
  summarySheet.addRows([
    ["Church Financial Report"],
    [],
    ["Church", data.name],
    ["Group", data.group],
    ["Zone", data.zone],
    ["Report Date", new Date().toLocaleDateString()],
    [],
    ["Financial Summary"],
    ["Total Orders", data.totalOrders],
    ["Total Payments", data.totalPayments],
    ["Balance", data.balance],
    ["Status", data.balance < 0 ? "Owed" : "Credit"],
  ])
  summarySheet.getColumn(1).width = 20
  summarySheet.getColumn(2).width = 30
  
  // Transactions Sheet
  if (data.transactions.length > 0) {
    const transactionsSheet = workbook.addWorksheet("Transactions")
    transactionsSheet.addRow(["Date", "Products", "Amount"])
    transactionsSheet.getRow(1).font = { bold: true }
    data.transactions.forEach((t) => {
      transactionsSheet.addRow([t.date, t.products, t.amount])
    })
    transactionsSheet.getColumn(1).width = 15
    transactionsSheet.getColumn(2).width = 40
    transactionsSheet.getColumn(3).width = 15
  }
  
  // Payments Sheet
  if (data.payments.length > 0) {
    const paymentsSheet = workbook.addWorksheet("Payments")
    paymentsSheet.addRow(["Date", "Method", "Amount", "Reference"])
    paymentsSheet.getRow(1).font = { bold: true }
    data.payments.forEach((p) => {
      paymentsSheet.addRow([p.date, p.method, p.amount, p.reference || ""])
    })
    paymentsSheet.getColumn(1).width = 15
    paymentsSheet.getColumn(2).width = 20
    paymentsSheet.getColumn(3).width = 15
    paymentsSheet.getColumn(4).width = 25
  }
  
  // Save - download via blob in browser
  void workbook.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${data.name.replace(/ /g, "_")}_Report_${new Date().toISOString().split("T")[0]}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  })
}

export function exportGroupToPDF(data: GroupData) {
  const doc = new jsPDF()
  
  // Title
  doc.setFontSize(18)
  doc.text("Group Financial Report", 14, 20)
  
  // Group Info
  doc.setFontSize(12)
  doc.text(`Group: ${data.name}`, 14, 30)
  doc.text(`Zone: ${data.zone}`, 14, 37)
  doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 14, 44)
  
  // Summary
  doc.setFontSize(14)
  doc.text("Financial Summary", 14, 58)
  doc.setFontSize(10)
  doc.text(`Total Churches: ${data.churches.length}`, 14, 66)
  doc.text(`Total Orders: £${data.totalOrders.toLocaleString()}`, 14, 73)
  doc.text(`Total Payments: £${data.totalPayments.toLocaleString()}`, 14, 80)
  doc.text(
    `Total Balance: £${Math.abs(data.totalBalance).toLocaleString()} ${data.totalBalance < 0 ? "(Owed)" : "(Credit)"}`,
    14,
    87
  )
  
  // Churches Table
  autoTable(doc, {
    startY: 95,
    head: [["Church", "Orders", "Payments", "Balance", "Status"]],
    body: data.churches.map((c) => [
      c.name,
      `£${c.orders.toLocaleString()}`,
      `£${c.payments.toLocaleString()}`,
      `£${Math.abs(c.balance).toLocaleString()}`,
      c.balance < 0 ? "Owed" : "Credit",
    ]),
    theme: "striped",
    headStyles: { fillColor: [66, 139, 202] },
  })
  
  // Footer
  const pageCount = doc.getNumberOfPages()
  doc.setFontSize(8)
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    )
  }
  
  // Save
  doc.save(`${data.name.replace(/ /g, "_")}_Group_Report_${new Date().toISOString().split("T")[0]}.pdf`)
}

export function exportGroupToExcel(data: GroupData) {
  const workbook = new ExcelJS.Workbook()
  
  // Summary Sheet
  const summarySheet = workbook.addWorksheet("Summary")
  summarySheet.addRows([
    ["Group Financial Report"],
    [],
    ["Group", data.name],
    ["Zone", data.zone],
    ["Report Date", new Date().toLocaleDateString()],
    [],
    ["Financial Summary"],
    ["Total Churches", data.churches.length],
    ["Total Orders", data.totalOrders],
    ["Total Payments", data.totalPayments],
    ["Total Balance", data.totalBalance],
    ["Status", data.totalBalance < 0 ? "Owed" : "Credit"],
  ])
  summarySheet.getColumn(1).width = 20
  summarySheet.getColumn(2).width = 30
  
  // Churches Sheet
  const churchesSheet = workbook.addWorksheet("Churches")
  churchesSheet.addRow(["Church", "Orders", "Payments", "Balance", "Status"])
  churchesSheet.getRow(1).font = { bold: true }
  data.churches.forEach((c) => {
    churchesSheet.addRow([
      c.name,
      c.orders,
      c.payments,
      Math.abs(c.balance),
      c.balance < 0 ? "Owed" : "Credit",
    ])
  })
  churchesSheet.getColumn(1).width = 30
  churchesSheet.getColumn(2).width = 15
  churchesSheet.getColumn(3).width = 15
  churchesSheet.getColumn(4).width = 15
  churchesSheet.getColumn(5).width = 12
  
  // Save - download via blob in browser
  void workbook.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${data.name.replace(/ /g, "_")}_Group_Report_${new Date().toISOString().split("T")[0]}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  })
}

export function exportPaymentSummaryToPDF(data: PaymentSummaryData) {
  const doc = new jsPDF("landscape", "mm", "a3")
  
  // Title
  doc.setFontSize(16)
  doc.text(data.title, doc.internal.pageSize.getWidth() / 2, 15, { align: "center" })
  
  // Report Info
  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 25)
  
  // Main table
  const tableData = [
    // Header rows
    [
      { content: "S/N", rowSpan: 2 },
      { content: "MONTH", rowSpan: 2 },
      { content: "PRINT", colSpan: 2 },
      { content: "SPONSORSHIP / PROJECTS / CAMPAIGNS PAYMENT", colSpan: 3 },
      { content: "GROUPS ONLINE CAMPAIGN", colSpan: 2 },
    ],
    [
      "POUNDS",
      "ESPEES",
      "POUNDS",
      "NAIRA",
      "ESPEES",
      "POUNDS",
      "ESPEES",
    ],
    // Data rows
    ...data.months.map((month, index) => [
      (index + 1).toString(),
      month.monthName,
      month.printIncomePounds > 0 ? `£${month.printIncomePounds.toLocaleString()}` : "",
      month.printIncomeEspees > 0 ? month.printIncomeEspees.toLocaleString() : "",
      month.zonePoundPayment > 0 ? `£${month.zonePoundPayment.toLocaleString()}` : "",
      month.zoneNairaPayment > 0 ? `₦${month.zoneNairaPayment.toLocaleString()}` : "",
      month.zoneEspeesPayment > 0 ? month.zoneEspeesPayment.toLocaleString() : "",
      month.groupLinksPounds > 0 ? `£${month.groupLinksPounds.toLocaleString()}` : "",
      month.groupLinksEspees > 0 ? month.groupLinksEspees.toLocaleString() : "",
    ]),
    // Total row
    [
      "",
      "TOTAL",
      `£${data.totals.printIncomePounds.toLocaleString()}`,
      data.totals.printIncomeEspees.toLocaleString(),
      `£${data.totals.zonePoundPayment.toLocaleString()}`,
      `₦${data.totals.zoneNairaPayment.toLocaleString()}`,
      data.totals.zoneEspeesPayment.toLocaleString(),
      `£${data.totals.groupLinksPounds.toLocaleString()}`,
      data.totals.groupLinksEspees.toLocaleString(),
    ],
    // Grand total row
    [
      "",
      "GRAND TOTAL:",
      `£${data.totals.printIncomePounds.toLocaleString()}`,
      data.totals.printIncomeEspees.toLocaleString(),
      `£${data.totals.zonePoundPayment.toLocaleString()}`,
      `₦${data.totals.zoneNairaPayment.toLocaleString()}`,
      data.totals.zoneEspeesPayment.toLocaleString(),
      `£${data.totals.groupLinksPounds.toLocaleString()}`,
      data.totals.groupLinksEspees.toLocaleString(),
    ],
  ]
  
  autoTable(doc, {
    startY: 30,
    head: tableData.slice(0, 2),
    body: tableData.slice(2),
    theme: "grid",
    headStyles: { 
      fillColor: [135, 206, 235],
      textColor: [0, 0, 0],
      fontSize: 8,
      halign: "center",
    },
    bodyStyles: {
      fontSize: 7,
      halign: "right",
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { halign: "center", cellWidth: 25 },
    },
    didParseCell: (data) => {
      // Bold the total and grand total rows
      if (data.section === "body" && data.row.index >= tableData.length - 4) {
        data.cell.styles.fontStyle = "bold"
        data.cell.styles.fillColor = [240, 240, 240]
      }
    },
  })
  
  // Footer
  const pageCount = doc.getNumberOfPages()
  doc.setFontSize(8)
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    )
  }
  
  // Save
  const filename = data.title.replace(/[^a-z0-9]/gi, "_")
  doc.save(`${filename}_${new Date().toISOString().split("T")[0]}.pdf`)
}

export function exportPaymentSummaryToExcel(data: PaymentSummaryData) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet("Payment Summary")
  
  // Title row
  worksheet.addRow([data.title])
  worksheet.addRow([])
  
  // Header rows
  worksheet.addRow(["S/N", "MONTH", "PRINT", "", "SPONSORSHIP / PROJECTS / CAMPAIGNS PAYMENT", "", "", "GROUPS ONLINE CAMPAIGN", ""])
  worksheet.addRow(["", "", "POUNDS", "ESPEES", "POUNDS", "NAIRA", "ESPEES", "POUNDS", "ESPEES"])
  worksheet.getRow(3).font = { bold: true }
  worksheet.getRow(4).font = { bold: true }
  
  // Data rows
  data.months.forEach((month, index) => {
    worksheet.addRow([
      index + 1,
      month.monthName,
      month.printIncomePounds || "",
      month.printIncomeEspees || "",
      month.zonePoundPayment || "",
      month.zoneNairaPayment || "",
      month.zoneEspeesPayment || "",
      month.groupLinksPounds || "",
      month.groupLinksEspees || "",
    ])
  })
  
  // Total row
  const totalRow = worksheet.addRow([
    "",
    "TOTAL",
    data.totals.printIncomePounds,
    data.totals.printIncomeEspees,
    data.totals.zonePoundPayment,
    data.totals.zoneNairaPayment,
    data.totals.zoneEspeesPayment,
    data.totals.groupLinksPounds,
    data.totals.groupLinksEspees,
  ])
  totalRow.font = { bold: true }
  
  // Grand total row
  const grandTotalRow = worksheet.addRow([
    "",
    "GRAND TOTAL:",
    data.totals.printIncomePounds,
    data.totals.printIncomeEspees,
    data.totals.zonePoundPayment,
    data.totals.zoneNairaPayment,
    data.totals.zoneEspeesPayment,
    data.totals.groupLinksPounds,
    data.totals.groupLinksEspees,
  ])
  grandTotalRow.font = { bold: true }
  
  // Set column widths
  worksheet.getColumn(1).width = 5
  worksheet.getColumn(2).width = 15
  worksheet.getColumn(3).width = 15
  worksheet.getColumn(4).width = 15
  worksheet.getColumn(5).width = 15
  worksheet.getColumn(6).width = 15
  worksheet.getColumn(7).width = 15
  worksheet.getColumn(8).width = 15
  worksheet.getColumn(9).width = 15
  
  // Save - download via blob in browser
  const filename = data.title.replace(/[^a-z0-9]/gi, "_")
  void workbook.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  })
}
