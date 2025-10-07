import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

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
