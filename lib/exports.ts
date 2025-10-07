import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
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
    purchases: number
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
  const workbook = XLSX.utils.book_new()
  
  // Summary Sheet
  const summaryData = [
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
  ]
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary")
  
  // Transactions Sheet
  if (data.transactions.length > 0) {
    const transactionsData = [
      ["Date", "Products", "Amount"],
      ...data.transactions.map((t) => [t.date, t.products, t.amount]),
    ]
    const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsData)
    XLSX.utils.book_append_sheet(workbook, transactionsSheet, "Transactions")
  }
  
  // Payments Sheet
  if (data.payments.length > 0) {
    const paymentsData = [
      ["Date", "Method", "Amount", "Reference"],
      ...data.payments.map((p) => [p.date, p.method, p.amount, p.reference || ""]),
    ]
    const paymentsSheet = XLSX.utils.aoa_to_sheet(paymentsData)
    XLSX.utils.book_append_sheet(workbook, paymentsSheet, "Payments")
  }
  
  // Save
  XLSX.writeFile(
    workbook,
    `${data.name.replace(/ /g, "_")}_Report_${new Date().toISOString().split("T")[0]}.xlsx`
  )
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
    head: [["Church", "Purchases", "Payments", "Balance", "Status"]],
    body: data.churches.map((c) => [
      c.name,
      `£${c.purchases.toLocaleString()}`,
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
  const workbook = XLSX.utils.book_new()
  
  // Summary Sheet
  const summaryData = [
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
  ]
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary")
  
  // Churches Sheet
  const churchesData = [
    ["Church", "Purchases", "Payments", "Balance", "Status"],
    ...data.churches.map((c) => [
      c.name,
      c.purchases,
      c.payments,
      Math.abs(c.balance),
      c.balance < 0 ? "Owed" : "Credit",
    ]),
  ]
  const churchesSheet = XLSX.utils.aoa_to_sheet(churchesData)
  XLSX.utils.book_append_sheet(workbook, churchesSheet, "Churches")
  
  // Save
  XLSX.writeFile(
    workbook,
    `${data.name.replace(/ /g, "_")}_Group_Report_${new Date().toISOString().split("T")[0]}.xlsx`
  )
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
  const workbook = XLSX.utils.book_new()
  
  // Create data array
  const excelData = [
    [data.title],
    [],
    ["S/N", "MONTH", "PRINT", "", "SPONSORSHIP / PROJECTS / CAMPAIGNS PAYMENT", "", "", "GROUPS ONLINE CAMPAIGN", ""],
    ["", "", "POUNDS", "ESPEES", "POUNDS", "NAIRA", "ESPEES", "POUNDS", "ESPEES"],
    ...data.months.map((month, index) => [
      index + 1,
      month.monthName,
      month.printIncomePounds || "",
      month.printIncomeEspees || "",
      month.zonePoundPayment || "",
      month.zoneNairaPayment || "",
      month.zoneEspeesPayment || "",
      month.groupLinksPounds || "",
      month.groupLinksEspees || "",
    ]),
    [
      "",
      "TOTAL",
      data.totals.printIncomePounds,
      data.totals.printIncomeEspees,
      data.totals.zonePoundPayment,
      data.totals.zoneNairaPayment,
      data.totals.zoneEspeesPayment,
      data.totals.groupLinksPounds,
      data.totals.groupLinksEspees,
    ],
    [
      "",
      "GRAND TOTAL:",
      data.totals.printIncomePounds,
      data.totals.printIncomeEspees,
      data.totals.zonePoundPayment,
      data.totals.zoneNairaPayment,
      data.totals.zoneEspeesPayment,
      data.totals.groupLinksPounds,
      data.totals.groupLinksEspees,
    ],
  ]
  
  const worksheet = XLSX.utils.aoa_to_sheet(excelData)
  
  // Set column widths
  worksheet["!cols"] = [
    { wch: 5 },   // S/N
    { wch: 15 },  // Month
    { wch: 15 },  // Print Income
    { wch: 20 },  // Reachout World
    { wch: 15 },  // Zone Pound
    { wch: 15 },  // Naira
    { wch: 15 },  // Espees
    { wch: 15 },  // Group Links Pounds
    { wch: 15 },  // Group Links Espees
  ]
  
  XLSX.utils.book_append_sheet(workbook, worksheet, "Payment Summary")
  
  // Save
  const filename = data.title.replace(/[^a-z0-9]/gi, "_")
  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`)
}
