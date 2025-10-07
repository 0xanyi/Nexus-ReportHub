import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import {
  generatePaymentSummary,
  aggregateQuarterly,
  ReportLevel,
  TimePeriod,
} from "@/lib/payment-summary"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const reportLevel = searchParams.get("reportLevel") as ReportLevel
    const entityId = searchParams.get("entityId")
    const timePeriod = searchParams.get("timePeriod") as TimePeriod
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString())

    if (!reportLevel || !entityId) {
      return NextResponse.json(
        { error: "Missing required parameters: reportLevel, entityId" },
        { status: 400 }
      )
    }

    if (!["ZONE", "GROUP"].includes(reportLevel)) {
      return NextResponse.json(
        { error: "Invalid reportLevel. Must be ZONE or GROUP" },
        { status: 400 }
      )
    }

    if (!["MONTHLY", "QUARTERLY", "YEARLY"].includes(timePeriod)) {
      return NextResponse.json(
        { error: "Invalid timePeriod. Must be MONTHLY, QUARTERLY, or YEARLY" },
        { status: 400 }
      )
    }

    // Generate the report
    let data = await generatePaymentSummary(reportLevel, entityId, year)

    // Aggregate to quarterly if needed
    if (timePeriod === "QUARTERLY") {
      data = aggregateQuarterly(data)
    }

    // For yearly, just return totals
    if (timePeriod === "YEARLY") {
      data.months = [
        {
          month: 1,
          monthName: year.toString(),
          ...data.totals,
        },
      ]
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error generating payment summary:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate payment summary" },
      { status: 500 }
    )
  }
}
