 "use client"
 
 import { useState } from "react"
 import { Button } from "@/components/ui/button"
 import { Input } from "@/components/ui/input"
 import { Label } from "@/components/ui/label"
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog"
 
 interface SyncResult {
   message: string
   period: string
   transactionsAffected: number
   lineItemsUpdated: number
   totalTransactionsInPeriod: number
 }
 
 export function SyncPricesSection() {
   const [orderPeriod, setOrderPeriod] = useState("")
   const [isLoading, setIsLoading] = useState(false)
   const [showConfirm, setShowConfirm] = useState(false)
   const [result, setResult] = useState<SyncResult | null>(null)
   const [error, setError] = useState<string | null>(null)
 
   const handleSync = async () => {
     setShowConfirm(false)
     setIsLoading(true)
     setError(null)
     setResult(null)
 
     try {
       const response = await fetch("/api/admin/sync-prices", {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
         },
         body: JSON.stringify({ orderPeriod }),
       })
 
       const data = await response.json()
 
       if (!response.ok) {
         setError(data.error || "Failed to sync prices")
         return
       }
 
       setResult(data)
     } catch {
       setError("Network error. Please try again.")
     } finally {
       setIsLoading(false)
     }
   }
 
   const formatPeriodDisplay = (period: string) => {
     if (!/^\d{4}-\d{2}$/.test(period)) return period
     const [year, month] = period.split("-").map(Number)
     const date = new Date(year, month - 1)
     return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
   }
 
   const isValidPeriod = /^\d{4}-\d{2}$/.test(orderPeriod)
 
   return (
     <>
       <Card>
         <CardHeader>
           <CardTitle>Sync Prices to Product Catalog</CardTitle>
           <CardDescription>
             Update order prices for a specific month to match current product catalog prices.
             This only affects orders within the selected period.
           </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
           <div className="space-y-2">
             <Label htmlFor="syncPeriod">Order Period (YYYY-MM)</Label>
             <Input
               id="syncPeriod"
               type="month"
               value={orderPeriod}
               onChange={(e) => setOrderPeriod(e.target.value)}
               placeholder="2025-12"
               className="max-w-xs"
             />
           </div>
 
           <Button
             onClick={() => setShowConfirm(true)}
             disabled={!isValidPeriod || isLoading}
           >
             {isLoading ? "Syncing..." : "Sync Prices"}
           </Button>
 
           {error && (
             <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
               {error}
             </div>
           )}
 
           {result && (
             <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
               <p className="font-medium">{result.message}</p>
               <ul className="mt-2 list-inside list-disc">
                 <li>Orders affected: {result.transactionsAffected}</li>
                 <li>Line items updated: {result.lineItemsUpdated}</li>
                 <li>Total orders in period: {result.totalTransactionsInPeriod}</li>
               </ul>
             </div>
           )}
         </CardContent>
       </Card>
 
       <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Confirm Price Sync</DialogTitle>
             <DialogDescription>
               This will update all order prices for{" "}
               <strong>{formatPeriodDisplay(orderPeriod)}</strong> to match current
               product catalog prices.
             </DialogDescription>
           </DialogHeader>
           <p className="text-sm text-muted-foreground">
             This action cannot be undone. Historical prices for this period will be
             replaced with current product prices.
           </p>
           <DialogFooter>
             <Button variant="outline" onClick={() => setShowConfirm(false)}>
               Cancel
             </Button>
             <Button onClick={handleSync}>Confirm Sync</Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </>
   )
 }
