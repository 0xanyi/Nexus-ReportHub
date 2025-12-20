 import { NextResponse } from "next/server"
 import { auth } from "@/auth"
 import { prisma } from "@/lib/prisma"
 
 /**
  * GET /api/financial-years
  * 
  * Returns all financial years ordered by start date descending.
  * Includes record counts for each year.
  */
 export async function GET() {
   const session = await auth()
 
   if (!session?.user) {
     return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
   }
 
   const financialYears = await prisma.financialYear.findMany({
     orderBy: { startDate: "desc" },
   })
 
   const yearsWithCounts = await Promise.all(
     financialYears.map(async (fy) => {
       const [transactionCount, paymentCount, uploadCount] = await Promise.all([
         prisma.transaction.count({
           where: {
             transactionDate: {
               gte: fy.startDate,
               lte: fy.endDate,
             },
           },
         }),
         prisma.payment.count({
           where: {
             paymentDate: {
               gte: fy.startDate,
               lte: fy.endDate,
             },
           },
         }),
         prisma.uploadHistory.count({
           where: {
             uploadedAt: {
               gte: fy.startDate,
               lte: fy.endDate,
             },
           },
         }),
       ])
 
       return {
         ...fy,
         transactionCount,
         paymentCount,
         uploadCount,
       }
     })
   )
 
   return NextResponse.json({ financialYears: yearsWithCounts })
 }
