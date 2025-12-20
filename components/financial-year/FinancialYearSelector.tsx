 "use client"
 
 import { useRouter, useSearchParams, usePathname } from "next/navigation"
 import { useEffect, useState, useCallback } from "react"
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select"
 import { Badge } from "@/components/ui/badge"
 
 type FinancialYear = {
   id: string
   label: string
   startDate: string
   endDate: string
   isCurrent: boolean
 }
 
 type Props = {
   className?: string
 }
 
 export function FinancialYearSelector({ className }: Props) {
   const router = useRouter()
   const pathname = usePathname()
   const searchParams = useSearchParams()
   const [years, setYears] = useState<FinancialYear[]>([])
   const [loading, setLoading] = useState(true)
 
   const currentFyParam = searchParams.get("fy")
 
   const fetchYears = useCallback(async () => {
     try {
       const res = await fetch("/api/financial-years")
       if (res.ok) {
         const data = await res.json()
         setYears(data.financialYears || [])
       }
     } catch {
       // Ignore fetch errors
     } finally {
       setLoading(false)
     }
   }, [])
 
   useEffect(() => {
     void fetchYears()
   }, [fetchYears])
 
   const selectedYear = currentFyParam
     ? years.find((y) => y.label === currentFyParam)
     : years.find((y) => y.isCurrent)
 
   const handleChange = (value: string) => {
     const params = new URLSearchParams(searchParams.toString())
     if (value === "current") {
       params.delete("fy")
     } else {
       params.set("fy", value)
     }
     router.push(`${pathname}?${params.toString()}`)
   }
 
   if (loading) {
     return (
       <div className={className}>
         <div className="h-10 w-32 animate-pulse rounded-md bg-slate-100" />
       </div>
     )
   }
 
   if (years.length === 0) {
     return null
   }
 
   return (
     <div className={className}>
       <Select
         value={currentFyParam || "current"}
         onValueChange={handleChange}
       >
         <SelectTrigger className="w-[180px]">
           <SelectValue placeholder="Select year">
             {selectedYear ? (
               <span className="flex items-center gap-2">
                 {selectedYear.label}
                 {selectedYear.isCurrent && (
                   <Badge variant="secondary" className="text-xs">
                     Current
                   </Badge>
                 )}
               </span>
             ) : (
               "Select year"
             )}
           </SelectValue>
         </SelectTrigger>
         <SelectContent>
           {years.map((year) => (
             <SelectItem
               key={year.id}
               value={year.isCurrent ? "current" : year.label}
             >
               <span className="flex items-center gap-2">
                 {year.label}
                 {year.isCurrent && (
                   <Badge variant="secondary" className="text-xs">
                     Current
                   </Badge>
                 )}
               </span>
             </SelectItem>
           ))}
         </SelectContent>
       </Select>
     </div>
   )
 }
 
 export function useFinancialYearFilter() {
   const searchParams = useSearchParams()
   const [years, setYears] = useState<FinancialYear[]>([])
   const [loading, setLoading] = useState(true)
 
   const fyParam = searchParams.get("fy")
 
   useEffect(() => {
     void (async () => {
       try {
         const res = await fetch("/api/financial-years")
         if (res.ok) {
           const data = await res.json()
           setYears(data.financialYears || [])
         }
       } catch {
         // Ignore
       } finally {
         setLoading(false)
       }
     })()
   }, [])
 
   const selectedYear = fyParam
     ? years.find((y) => y.label === fyParam)
     : years.find((y) => y.isCurrent)
 
   return {
     loading,
     selectedYear,
     startDate: selectedYear ? new Date(selectedYear.startDate) : null,
     endDate: selectedYear ? new Date(selectedYear.endDate) : null,
   }
 }
