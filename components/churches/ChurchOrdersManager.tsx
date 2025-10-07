"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TransactionHistory } from "@/components/TransactionHistory"
import { OrderForm } from "@/components/churches/OrderForm"
import { Plus } from "lucide-react"
import { Decimal } from "@prisma/client/runtime/library"

interface Transaction {
  id: string
  transactionDate: Date
  currency: string
  notes?: string | null
  lineItems: Array<{
    id: string
    quantity: number
    unitPrice: number | string | Decimal
    totalAmount: number | string | Decimal
    productType: {
      id: string
      name: string
      unitPrice?: number | string | Decimal
    }
  }>
  uploader: {
    name: string
  }
}

interface FormTransaction {
  id: string
  transactionDate: Date
  notes?: string | null
  lineItems: Array<{
    id: string
    productTypeId: string
    quantity: number
    unitPrice: number
    totalAmount: number
    productType: {
      id: string
      name: string
      unitPrice: number
      currency: string
    }
  }>
}

interface ChurchOrdersManagerProps {
  churchId: string
  churchName: string
  transactions: Transaction[]
  isAdmin: boolean
}

export function ChurchOrdersManager({ 
  churchId, 
  churchName, 
  transactions, 
  isAdmin 
}: ChurchOrdersManagerProps) {
  const router = useRouter()
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<FormTransaction | null>(null)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")

  const handleCreateOrder = () => {
    setEditingTransaction(null)
    setFormMode("create")
    setShowOrderForm(true)
  }

  const handleEditOrder = (transaction: Transaction) => {
    // Convert the transaction to the format expected by OrderForm
    const formattedTransaction = {
      id: transaction.id,
      transactionDate: transaction.transactionDate,
      notes: transaction.notes,
      lineItems: transaction.lineItems.map(item => ({
        id: item.id,
        productTypeId: item.productType.id,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalAmount: Number(item.totalAmount),
        productType: {
          id: item.productType.id,
          name: item.productType.name,
          unitPrice: item.productType.unitPrice ? Number(item.productType.unitPrice) : 0,
          currency: transaction.currency,
        }
      }))
    }
    setEditingTransaction(formattedTransaction)
    setFormMode("edit")
    setShowOrderForm(true)
  }

  const handleDeleteOrder = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete order")
      }

      // Refresh the page to show updated data
      router.refresh()
    } catch (error) {
      console.error("Delete order error:", error)
      alert(error instanceof Error ? error.message : "Failed to delete order")
    }
  }

  const handleSuccess = () => {
    setShowOrderForm(false)
    setEditingTransaction(null)
    // Refresh the page to show updated data
    router.refresh()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Order History</CardTitle>
              <CardDescription>
                {transactions.length} order{transactions.length !== 1 ? "s" : ""} recorded
              </CardDescription>
            </div>
            {isAdmin && (
              <Button onClick={handleCreateOrder}>
                <Plus className="h-4 w-4 mr-2" />
                Add Order
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <TransactionHistory
            transactions={transactions}
            isAdmin={isAdmin}
            onEdit={isAdmin ? handleEditOrder : undefined}
            onDelete={isAdmin ? handleDeleteOrder : undefined}
          />
        </CardContent>
      </Card>

      {/* Order Form Dialog */}
      <OrderForm
        open={showOrderForm}
        onClose={() => {
          setShowOrderForm(false)
          setEditingTransaction(null)
        }}
        onSuccess={handleSuccess}
        churchId={churchId}
        churchName={churchName}
        transaction={editingTransaction}
        mode={formMode}
      />
    </>
  )
}
