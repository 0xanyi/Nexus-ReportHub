import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

import FinancialYearManager from "@/components/financial-year/FinancialYearManager"

export default async function FinancialYearSettingsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ZONE_ADMIN"
  if (!isAdmin) {
    redirect("/dashboard")
  }

  const current = await prisma.financialYear.findFirst({
    where: { isCurrent: true },
  })

  return <FinancialYearManager initialCurrent={current} />
}
