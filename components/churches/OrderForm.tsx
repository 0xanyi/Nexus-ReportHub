"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Loader2 } from "lucide-react"

interface ProductType {
  id: string
  name: string
  unitPrice: number
  currency: string
}

interface LineItem {
  id?: string
  productTypeId: string
  productName?: string
  quantity: number
  unitPrice?: number
  totalAmount?: number
}

interface Transaction {
  id: string
  transactionDate: Date
  notes?: string | null
  lineItems: {
    id: string
    productTypeId: string
    quantity: number
    unitPrice: number
    totalAmount: number
    productType: ProductType
  }[]
}

interface OrderFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  churchId: string
  churchName: string
  transaction?: Transaction | null
  mode: "create" | "edit"
}

export function OrderForm({ open, onClose, onSuccess, churchId, churchName, transaction, mode }: OrderFormProps) {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<ProductType[]>([])
  const [transactionDate, setTransactionDate] = useState("")
  const [notes, setNotes] = useState("")
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { productTypeId: "", quantity: 1 },
  ])
  const [error, setError] = useState("")

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/departments")
        if (response.ok) {
          const data = await response.json()
          // Flatten products from all departments
          const allProducts: ProductType[] = []
          for (const dept of data.departments) {
            if (dept.productTypes) {
              allProducts.push(
                ...dept.productTypes.map((p: ProductType) => ({
                  ...p,
                  unitPrice: Number(p.unitPrice),
                }))
              )
            }
          }
          setProducts(allProducts)
        }
      } catch (error) {
        console.error("Failed to fetch products:", error)
      }
    }

    if (open) {
      fetchProducts()
    }
  }, [open])

  // Initialize form when transaction changes (edit mode)
  useEffect(() => {
    if (mode === "edit" && transaction) {
      setTransactionDate(new Date(transaction.transactionDate).toISOString().split("T")[0])
      setNotes(transaction.notes || "")
      setLineItems(
        transaction.lineItems.map((item) => ({
          id: item.id,
          productTypeId: item.productTypeId,
          productName: item.productType.name,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalAmount: Number(item.totalAmount),
        }))
      )
    } else if (mode === "create") {
      // Reset form for create mode
      setTransactionDate(new Date().toISOString().split("T")[0])
      setNotes("")
      setLineItems([{ productTypeId: "", quantity: 1 }])
    }
  }, [mode, transaction])

  const addLineItem = () => {
    setLineItems([...lineItems, { productTypeId: "", quantity: 1 }])
  }

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index))
    }
  }

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems]
    updated[index] = { ...updated[index], [field]: value }
    setLineItems(updated)
  }

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productTypeId)
      if (product && item.quantity > 0) {
        return sum + product.unitPrice * item.quantity
      }
      return sum
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Validate
      if (!transactionDate) {
        setError("Transaction date is required")
        setLoading(false)
        return
      }

      const validLineItems = lineItems.filter(
        (item) => item.productTypeId && item.quantity > 0
      )

      if (validLineItems.length === 0) {
        setError("At least one product with quantity is required")
        setLoading(false)
        return
      }

      const payload = {
        churchId,
        transactionDate,
        notes,
        lineItems: validLineItems.map((item) => ({
          productTypeId: item.productTypeId,
          quantity: item.quantity,
        })),
      }

      const url = mode === "create" 
        ? "/api/transactions"
        : `/api/transactions/${transaction?.id}`
      
      const method = mode === "create" ? "POST" : "PUT"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save order")
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Order form error:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Order" : "Edit Order"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? `Create a manual order for ${churchName}`
              : `Edit order for ${churchName}`
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Date */}
          <div className="space-y-2">
            <Label htmlFor="transactionDate">Order Date *</Label>
            <Input
              id="transactionDate"
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              required
            />
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Products *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLineItem}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Product
              </Button>
            </div>

            {lineItems.map((item, index) => {
              const product = products.find((p) => p.id === item.productTypeId)
              const itemTotal = product ? product.unitPrice * item.quantity : 0

              return (
                <div
                  key={index}
                  className="flex gap-4 items-end p-4 border rounded-lg bg-slate-50"
                >
                  <div className="flex-1">
                    <Label htmlFor={`product-${index}`}>Product</Label>
                    <select
                      id={`product-${index}`}
                      value={item.productTypeId}
                      onChange={(e) =>
                        updateLineItem(index, "productTypeId", e.target.value)
                      }
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Select a product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {product.currency} {product.unitPrice.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-32">
                    <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateLineItem(index, "quantity", parseInt(e.target.value) || 1)
                      }
                      required
                    />
                  </div>

                  <div className="w-32">
                    <Label>Total</Label>
                    <div className="mt-1 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm font-medium">
                      {product?.currency || "GBP"} {itemTotal.toFixed(2)}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLineItem(index)}
                    disabled={lineItems.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )
            })}

            {/* Total */}
            <div className="flex justify-end pt-2">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Order Total</p>
                <p className="text-2xl font-bold">
                  {products[0]?.currency || "GBP"} {calculateTotal().toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about this order..."
              rows={3}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Dialog Footer */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : mode === "create" ? (
                "Create Order"
              ) : (
                "Update Order"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
