"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

interface Product {
  id: string
  name: string
  unitPrice: number
  currency: string
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string>("")
  const [product, setProduct] = useState<Product | null>(null)

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`/api/products/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setProduct(data.product)
        } else {
          setError("Product not found")
        }
      } catch {
        setError("Failed to load product")
      } finally {
        setIsFetching(false)
      }
    }

    fetchProduct()
  }, [params.id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      unitPrice: parseFloat(formData.get("unitPrice") as string),
      currency: formData.get("currency") as string,
    }

    try {
      const response = await fetch(`/api/products/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to update product")
        setIsLoading(false)
      } else {
        router.push("/dashboard/products")
        router.refresh()
      }
    } catch {
      setError("An error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Loading product...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-destructive mb-4">Product not found</p>
        <Link href="/dashboard/products">
          <Button>Back to Products</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Edit Product Type</h2>
        <p className="text-muted-foreground">
          Update the details for {product.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
          <CardDescription>
            Modify the product information below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={product.name}
                placeholder="e.g., ROR German, Teevo Spanish, etc."
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit Price *</Label>
                <Input
                  id="unitPrice"
                  name="unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={product.unitPrice}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <select
                  id="currency"
                  name="currency"
                  defaultValue={product.currency}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  disabled={isLoading}
                >
                  <option value="GBP">GBP (£)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="NGN">NGN (₦)</option>
                  <option value="ESPEES">ESPEES (Ɛ)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
              <Link href="/dashboard/products" className="flex-1">
                <Button type="button" variant="outline" className="w-full" disabled={isLoading}>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
