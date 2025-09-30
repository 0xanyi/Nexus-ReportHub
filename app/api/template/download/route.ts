import { NextResponse } from "next/server"

export async function GET() {
  const csvContent = `Church Name,Date,Product Type,Quantity,Unit Price,Payment Amount,Payment Method,Reference
LW BIRMINGHAM,2025-01-15,ROR English Quantity,2500,2.50,6250.00,BANK_TRANSFER,REF12345
LW GLASGOW,2025-01-15,Teevo,150,1.50,225.00,CASH,
LW EDINBURGH,2025-01-16,Early Reader,500,1.00,500.00,BANK_TRANSFER,REF12346`

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=transaction_template.csv",
    },
  })
}
