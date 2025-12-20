 "use client"
 
 import { Suspense } from "react"
 import { FinancialYearSelector } from "./FinancialYearSelector"
 
 type Props = {
   role: string
   userName: string
   fyLabel: string
 }
 
 export function DashboardHeader({ role, userName, fyLabel }: Props) {
   return (
     <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
       <div className="flex flex-col gap-2">
         <h1 className="text-3xl font-bold tracking-tight text-slate-900">
           {role === "SUPER_ADMIN" ? "Global" : "Zone"} Dashboard
         </h1>
         <p className="text-slate-600">
           Welcome back, {userName}. Viewing data for{" "}
           <span className="font-semibold">{fyLabel}</span>.
         </p>
       </div>
       <Suspense fallback={<div className="h-10 w-32 animate-pulse rounded-md bg-slate-100" />}>
         <FinancialYearSelector />
       </Suspense>
     </div>
   )
 }
