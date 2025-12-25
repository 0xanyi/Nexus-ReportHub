"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { SyncPricesSection } from "@/components/upload/SyncPricesSection"

export default function UploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{
    status: string
    processed: number
    total: number
    errors?: string[]
    summary?: {
      campaignCategoriesCreated?: number
      ordersCreated?: number
      orderLineItemsCreated?: number
    }
  } | null>(null)
  const [uploadType, setUploadType] = useState<"TRANSACTION" | "ORDER">("TRANSACTION")
  const [orderPeriod, setOrderPeriod] = useState("")

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile)
      setError("")
    } else {
      setError("Please upload a CSV file")
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile)
        setError("")
      } else {
        setError("Please upload a CSV file")
        setFile(null)
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!file) {
      setError("Please select a file to upload")
      return
    }

    if (uploadType === "ORDER" && !orderPeriod) {
      setError("Please provide the order period (YYYY-MM) for order uploads")
      return
    }

    setIsUploading(true)
    setError("")
    setSuccess("")
    setUploadProgress(null)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("uploadType", uploadType)
    if (uploadType === "ORDER" && orderPeriod) {
      formData.append("orderPeriod", orderPeriod)
    }

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Upload failed")
        setIsUploading(false)
      } else {
        setSuccess(`Successfully uploaded and processed ${data.recordsProcessed} records`)
        setUploadProgress({
          status: data.status,
          processed: data.recordsProcessed,
          total: data.recordsProcessed,
          errors: data.errors,
          summary: data.summary,
        })
        setFile(null)
        setIsUploading(false)
        
        // Refresh after 2 seconds
        setTimeout(() => {
          router.refresh()
        }, 2000)
      }
    } catch {
      setError("An error occurred during upload. Please try again.")
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Upload CSV Data</h2>
          <p className="text-muted-foreground">
            Import transaction and payment data from CSV files
          </p>
        </div>
        <Link href="/dashboard/upload/history">
          <Button variant="outline">View Upload History</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CSV File Upload</CardTitle>
          <CardDescription>
            Upload a CSV file containing order or transaction data for churches in the zone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                {success}
              </div>
            )}

            {uploadProgress && uploadProgress.errors && uploadProgress.errors.length > 0 && (
              <div className="rounded-md bg-yellow-50 p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">
                  Upload completed with {uploadProgress.errors.length} warning(s):
                </h4>
                <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                  {uploadProgress.errors.slice(0, 5).map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                  {uploadProgress.errors.length > 5 && (
                    <li>...and {uploadProgress.errors.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}

            {uploadProgress?.summary && (
              <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
                <div className="font-medium">Summary</div>
                <ul className="mt-2 space-y-1">
                  {typeof uploadProgress.summary.campaignCategoriesCreated === "number" && (
                    <li>
                      Campaign categories created: {uploadProgress.summary.campaignCategoriesCreated}
                    </li>
                  )}
                  {typeof uploadProgress.summary.ordersCreated === "number" && (
                    <li>Orders recorded: {uploadProgress.summary.ordersCreated}</li>
                  )}
                  {typeof uploadProgress.summary.orderLineItemsCreated === "number" && (
                    <li>Order line items recorded: {uploadProgress.summary.orderLineItemsCreated}</li>
                  )}
                </ul>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Upload Type</label>
                <select
                  value={uploadType}
                  onChange={(event) => setUploadType(event.target.value as typeof uploadType)}
                  disabled={isUploading}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="TRANSACTION">Bank Transaction Upload</option>
                  <option value="ORDER">Monthly Order Upload</option>
                </select>
              </div>

              {uploadType === "ORDER" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Order Period (MM-YYYY)</label>
                  <input
                    type="month"
                    value={orderPeriod}
                    onChange={(event) => setOrderPeriod(event.target.value)}
                    disabled={isUploading}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="2025-09"
                  />
                </div>
              )}
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-gray-300 hover:border-primary"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>

                <div>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-primary font-semibold hover:underline">
                      Click to upload
                    </span>
                    <span className="text-gray-600"> or drag and drop</span>
                  </label>
                  <p className="text-sm text-gray-500 mt-1">CSV files only (max 10MB)</p>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                </div>

                {file && (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-medium">{file.name}</span>
                    <span className="text-gray-500">
                      ({(file.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={!file || isUploading}
                className="flex-1"
              >
                {isUploading ? "Uploading & Processing..." : "Upload & Process CSV"}
              </Button>
              {file && !isUploading && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFile(null)}
                >
                  Clear
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CSV Format Requirements</CardTitle>
          <CardDescription>
            Prepare your CSV depending on the selected upload type:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Bank Transaction Upload</h4>
              <div className="mt-2 space-y-2 rounded-md bg-gray-50 p-4 font-mono text-sm">
                <div>Date, Amount, Chapter, Group, Type, Payment Method (optional), Reference (optional)</div>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>Amounts are assumed to be GBP and will be stored as sponsorship giving unless the type contains &ldquo;print&rdquo;.</li>
                <li>Types appearing more than twice will automatically create a campaign category.</li>
                <li>Dates can be Excel serial values or DD/MM/YYYY formats.</li>
              </ul>
              <div className="mt-3">
                <Link href="/api/template/download?type=transaction">
                  <Button variant="outline" size="sm">
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Transaction Template
                  </Button>
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900">Monthly Order Upload</h4>
              <div className="mt-2 space-y-2 rounded-md bg-gray-50 p-4 font-mono text-sm">
                <div>Chapter, [Any Product Name], [Another Product], ..., Total Cost (optional), Total Cost Including Delivery (optional)</div>
                <div className="mt-2 text-xs text-gray-600">Example: Chapter, ROR English Quantity, Teevo, Polish, French, Spanish, Total Cost</div>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>Any column with a numeric quantity (except Chapter, Total Cost, Delivery, Notes) will be treated as a product.</li>
                <li>Product columns can be named anything (e.g., &quot;ROR English&quot;, &quot;Polish&quot;, &quot;Teevo Quantity&quot;).</li>
                <li>Each product is costed at £3 per copy. Products are auto-created if they don&apos;t exist.</li>
                <li>Provide the order period month so transactions can be recorded accurately.</li>
                <li>Only existing churches in the system will be processed.</li>
              </ul>
              <div className="mt-3">
                <Link href="/api/template/download?type=order">
                  <Button variant="outline" size="sm">
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Order Template
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <SyncPricesSection />
    </div>
  )
}
