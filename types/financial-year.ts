 /**
  * Shared types for Financial Year feature
  */
 
 export type FinancialYear = {
   id: string
   label: string
   startDate: string | Date
   endDate: string | Date
   isCurrent: boolean
 }
 
 export type FinancialYearWithCounts = FinancialYear & {
   transactionCount: number
   paymentCount: number
   uploadCount: number
 }
 
 export type FinancialYearBounds = {
   label: string
   startDate: Date
   endDate: Date
 }
 
 export type ResetPreview = {
   payments: number
   transactions: number
   uploads: number
 }
