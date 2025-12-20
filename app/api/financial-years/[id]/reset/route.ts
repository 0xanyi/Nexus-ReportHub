import { validateCsrfToken } from "@/lib/csrf"
import { timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getResetConfirmationText } from "@/lib/financialYear"

type ResetBody = {
  confirmation?: string
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify CSRF token to prevent cross-site requests
  const csrfValid = await validateCsrfToken()
  if (!csrfValid) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 })
  }

  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ZONE_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = (await request.json().catch(() => ({}))) as ResetBody

  const financialYear = await prisma.financialYear.findUnique({ where: { id } })
  if (!financialYear) {
    return NextResponse.json({ error: "Financial year not found" }, { status: 404 })
  }

  const expected = getResetConfirmationText(financialYear.label)
  
  let confirmationValid = false
  try {
    const expectedBuffer = Buffer.from(expected, "utf8")
    const receivedBuffer = Buffer.from(body.confirmation || "", "utf8")
    
    if (expectedBuffer.length === receivedBuffer.length) {
      confirmationValid = timingSafeEqual(expectedBuffer, receivedBuffer)
    }
  } catch {
    confirmationValid = false
  }
  
  if (!confirmationValid) {
    return NextResponse.json(
      { error: `Invalid confirmation. Expected "${expected}".` },
      { status: 400 }
    )
  }

  const startDate = financialYear.startDate
  const endDate = financialYear.endDate

  const counts = await prisma.$transaction(async (tx) => {
    const payments = await tx.payment.deleteMany({
      where: {
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    const transactions = await tx.transaction.deleteMany({
      where: {
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    const uploads = await tx.uploadHistory.deleteMany({
      where: {
        uploadedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    return {
      paymentsDeleted: payments.count,
      transactionsDeleted: transactions.count,
      uploadsDeleted: uploads.count,
    }
  })

  return NextResponse.json({ financialYear, ...counts })
}
