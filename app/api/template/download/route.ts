import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") || "transaction"

  let csvContent: string
  let filename: string

  if (type === "order") {
    csvContent = `Chapter,ROR English Quantity,Teevo,Polish,French,Spanish,KROR,Hindi,Total Cost,Total Cost Including Delivery
LW BIRMINGHAM,500,100,50,30,20,0,0,2100,2150
LW GLASGOW,300,50,25,15,10,0,0,1200,1230
LW EDINBURGH,400,75,40,20,15,0,0,1650,1680`
    filename = "order_template.csv"
  } else if (type === "churches") {
    csvContent = `Church Name,Group Name
LW Birmingham,Birmingham Group
LW Glasgow,Glasgow Group
LW Edinburgh,Edinburgh Group
LW Manchester,Manchester Group
LW Leeds,Yorkshire Group
LW Cardiff,Wales Group`
    filename = "churches_template.csv"
  } else {
    csvContent = `Date,Amount,Chapter,Payment Type,Payment Method,Reference,Attributed Month
15/01/2025,6250.00,LW BIRMINGHAM,Print Payment,BANK_TRANSFER,REF12345,01-2025
15/01/2025,500.00,LW GLASGOW,Sponsorship,CASH,,
16/01/2025,1200.00,LW EDINBURGH,Missions Giving,BANK_TRANSFER,REF12346,
20/01/2025,300.00,LW MANCHESTER,Missions Giving,ESPEES,,02-2025`
    filename = "transaction_template.csv"
  }

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=${filename}`,
    },
  })
}
