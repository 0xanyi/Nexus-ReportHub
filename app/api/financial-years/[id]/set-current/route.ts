 import { validateCsrfToken } from "@/lib/csrf"
 import { NextResponse } from "next/server"
 import { auth } from "@/auth"
 import { prisma } from "@/lib/prisma"
 
 /**
  * POST /api/financial-years/[id]/set-current
  * 
  * Sets the specified financial year as current (rolls back or advances).
  * Only SUPER_ADMIN and ZONE_ADMIN can perform this action.
  */
 export async function POST(
   _request: Request,
   { params }: { params: Promise<{ id: string }> }
 ) {
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
 
   const targetYear = await prisma.financialYear.findUnique({
     where: { id },
   })
 
   if (!targetYear) {
     return NextResponse.json({ error: "Financial year not found" }, { status: 404 })
   }
 
   const updated = await prisma.$transaction(async (tx) => {
     await tx.financialYear.updateMany({
       data: { isCurrent: false },
     })
 
     return tx.financialYear.update({
       where: { id },
       data: { isCurrent: true },
     })
   })
 
   return NextResponse.json({ financialYear: updated })
 }
