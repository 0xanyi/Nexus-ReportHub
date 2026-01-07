import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-guards"
import { requireCsrf } from "@/lib/csrf"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    const csrfError = await requireCsrf()
    if (csrfError) return csrfError

    const authCheck = requireAdmin(session)
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    const { id } = await params

    const uploadHistory = await prisma.uploadHistory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            transactions: true,
            payments: true,
          },
        },
      },
    })

    if (!uploadHistory) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 })
    }

    if (uploadHistory.status === "ROLLED_BACK") {
      return NextResponse.json({ error: "Upload has already been rolled back" }, { status: 400 })
    }

    if (uploadHistory.status === "PROCESSING") {
      return NextResponse.json({ error: "Cannot rollback an upload that is still processing" }, { status: 400 })
    }

    const transactionCount = uploadHistory._count.transactions
    const paymentCount = uploadHistory._count.payments

    if (transactionCount === 0 && paymentCount === 0) {
      return NextResponse.json({ error: "No records to rollback for this upload" }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      if (transactionCount > 0) {
        await tx.transaction.deleteMany({
          where: { uploadHistoryId: id },
        })
      }

      if (paymentCount > 0) {
        await tx.payment.deleteMany({
          where: { uploadHistoryId: id },
        })
      }

      await tx.uploadHistory.update({
        where: { id },
        data: {
          status: "ROLLED_BACK",
          rolledBackAt: new Date(),
        },
      })
    })

    return NextResponse.json({
      message: "Upload rolled back successfully",
      deletedTransactions: transactionCount,
      deletedPayments: paymentCount,
    })
  } catch (error) {
    console.error("Rollback error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
