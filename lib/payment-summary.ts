import { prisma } from "@/lib/prisma"

export type ReportLevel = "ZONE" | "GROUP"
export type TimePeriod = "MONTHLY" | "QUARTERLY" | "YEARLY"

export interface MonthlyPaymentData {
  month: number
  monthName: string
  printIncomePounds: number
  printIncomeEspees: number
  reachoutWorldPayPounds: number
  zonePoundPayment: number
  zoneNairaPayment: number
  zoneEspeesPayment: number
  groupLinksPounds: number
  groupLinksEspees: number
  comment?: string
}

export interface PaymentSummaryData {
  title: string
  year: number
  months: MonthlyPaymentData[]
  totals: {
    printIncomePounds: number
    printIncomeEspees: number
    reachoutWorldPayPounds: number
    zonePoundPayment: number
    zoneNairaPayment: number
    zoneEspeesPayment: number
    groupLinksPounds: number
    groupLinksEspees: number
  }
  grandTotal: {
    pounds: number
    naira: number
    espees: number
  }
}

const MONTH_NAMES = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
]

export async function generatePaymentSummary(
  reportLevel: ReportLevel,
  entityId: string,
  year: number
): Promise<PaymentSummaryData> {
  // Get entity details
  let entityName = ""
  let churchIds: string[] = []

  if (reportLevel === "ZONE") {
    const zone = await prisma.zone.findUnique({
      where: { id: entityId },
      include: {
        groups: {
          include: {
            churches: true,
          },
        },
      },
    })

    if (!zone) throw new Error("Zone not found")

    entityName = zone.name
    churchIds = zone.groups.flatMap((group) => group.churches.map((church) => church.id))
  } else {
    const group = await prisma.group.findUnique({
      where: { id: entityId },
      include: {
        zone: true,
        churches: true,
      },
    })

    if (!group) throw new Error("Group not found")

    entityName = group.name
    churchIds = group.churches.map((church) => church.id)
  }

  // Fetch all payments for the year
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31, 23, 59, 59)

  const payments = await prisma.payment.findMany({
    where: {
      churchId: { in: churchIds },
      paymentDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      campaignCategory: true,
    },
  })

  // Get campaign categories for "REACHOUT WORLD PAY PAYMENT" and "GROUP LINKS"
  const reachoutCampaign = await prisma.campaignCategory.findFirst({
    where: {
      normalizedName: "reachout_world_pay_payment",
    },
  })

  // Initialize monthly data
  const monthlyData: MonthlyPaymentData[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    monthName: MONTH_NAMES[i],
    printIncomePounds: 0,
    printIncomeEspees: 0,
    reachoutWorldPayPounds: 0,
    zonePoundPayment: 0,
    zoneNairaPayment: 0,
    zoneEspeesPayment: 0,
    groupLinksPounds: 0,
    groupLinksEspees: 0,
  }))

  // Aggregate payments by month
  payments.forEach((payment) => {
    const month = new Date(payment.paymentDate).getMonth()
    const monthData = monthlyData[month]
    const amount = Number(payment.amount)

    // Income towards Prints
    if (payment.forPurpose === "PRINTING") {
      if (payment.currency === "GBP") {
        monthData.printIncomePounds += amount
      } else if (payment.currency === "ESPEES") {
        monthData.printIncomeEspees += amount
      }
    }

    // Sponsorship/Project payments
    if (payment.forPurpose === "SPONSORSHIP") {
      // Reachout World Pay Payment (specific campaign)
      if (
        payment.campaignCategoryId === reachoutCampaign?.id ||
        payment.campaignLabel?.toLowerCase().includes("reachout world pay")
      ) {
        if (payment.currency === "GBP") {
          monthData.reachoutWorldPayPounds += amount
        }
      }
      // Group Links (online campaigns by groups)
      else if (
        payment.campaignLabel?.toLowerCase().includes("group link") ||
        payment.campaignLabel?.toLowerCase().includes("online campaign")
      ) {
        if (payment.currency === "GBP") {
          monthData.groupLinksPounds += amount
        } else if (payment.currency === "ESPEES") {
          monthData.groupLinksEspees += amount
        }
      }
      // Other sponsorship payments grouped by currency under "ZONE"
      else {
        if (payment.currency === "GBP") {
          monthData.zonePoundPayment += amount
        } else if (payment.currency === "NGN") {
          monthData.zoneNairaPayment += amount
        } else if (payment.currency === "ESPEES") {
          monthData.zoneEspeesPayment += amount
        }
      }
    }
  })

  // Calculate totals
  const totals = monthlyData.reduce(
    (acc, month) => ({
      printIncomePounds: acc.printIncomePounds + month.printIncomePounds,
      printIncomeEspees: acc.printIncomeEspees + month.printIncomeEspees,
      reachoutWorldPayPounds: acc.reachoutWorldPayPounds + month.reachoutWorldPayPounds,
      zonePoundPayment: acc.zonePoundPayment + month.zonePoundPayment,
      zoneNairaPayment: acc.zoneNairaPayment + month.zoneNairaPayment,
      zoneEspeesPayment: acc.zoneEspeesPayment + month.zoneEspeesPayment,
      groupLinksPounds: acc.groupLinksPounds + month.groupLinksPounds,
      groupLinksEspees: acc.groupLinksEspees + month.groupLinksEspees,
    }),
    {
      printIncomePounds: 0,
      printIncomeEspees: 0,
      reachoutWorldPayPounds: 0,
      zonePoundPayment: 0,
      zoneNairaPayment: 0,
      zoneEspeesPayment: 0,
      groupLinksPounds: 0,
      groupLinksEspees: 0,
    }
  )

  // Calculate grand total
  const grandTotal = {
    pounds:
      totals.printIncomePounds +
      totals.reachoutWorldPayPounds +
      totals.zonePoundPayment +
      totals.groupLinksPounds,
    naira: totals.zoneNairaPayment,
    espees: totals.printIncomeEspees + totals.zoneEspeesPayment + totals.groupLinksEspees,
  }

  return {
    title: `${entityName} PAYMENT SUMMARY - ${year}`,
    year,
    months: monthlyData,
    totals,
    grandTotal,
  }
}

export function aggregateQuarterly(data: PaymentSummaryData): PaymentSummaryData {
  const quarterlyData: MonthlyPaymentData[] = []

  for (let q = 0; q < 4; q++) {
    const startMonth = q * 3
    const quarterMonths = data.months.slice(startMonth, startMonth + 3)

    const quarterData: MonthlyPaymentData = {
      month: q + 1,
      monthName: `Q${q + 1} (${quarterMonths.map((m) => m.monthName.slice(0, 3)).join("-")})`,
      printIncomePounds: 0,
      printIncomeEspees: 0,
      reachoutWorldPayPounds: 0,
      zonePoundPayment: 0,
      zoneNairaPayment: 0,
      zoneEspeesPayment: 0,
      groupLinksPounds: 0,
      groupLinksEspees: 0,
    }

    quarterMonths.forEach((month) => {
      quarterData.printIncomePounds += month.printIncomePounds
      quarterData.printIncomeEspees += month.printIncomeEspees
      quarterData.reachoutWorldPayPounds += month.reachoutWorldPayPounds
      quarterData.zonePoundPayment += month.zonePoundPayment
      quarterData.zoneNairaPayment += month.zoneNairaPayment
      quarterData.zoneEspeesPayment += month.zoneEspeesPayment
      quarterData.groupLinksPounds += month.groupLinksPounds
      quarterData.groupLinksEspees += month.groupLinksEspees
    })

    quarterlyData.push(quarterData)
  }

  return {
    ...data,
    months: quarterlyData,
  }
}
