"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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
  } | null>(null)

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

    setIsUploading(true)
    setError("")
    setSuccess("")
    setUploadProgress(null)

    const formData = new FormData()
    formData.append("file", file)

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
        })
        setFile(null)
        setIsUploading(false)
        
        // Refresh after 2 seconds
        setTimeout(() => {
          router.refresh()
        }, 2000)
      }
    } catch (err) {
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
            Upload a CSV file containing transaction data. The file should include church names,
            dates, product types, quantities, and payment information.
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
            Your CSV file should include the following columns:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md font-mono text-sm overflow-x-auto">
              Church Name, Date, Product Type, Quantity, Unit Price, Payment Amount, Payment Method, Reference
            </div>
            
            <div className="grid gap-3 text-sm">
              <div>
                <span className="font-semibold">Church Name:</span> Must match existing church names exactly
              </div>
              <div>
                <span className="font-semibold">Date:</span> Format: YYYY-MM-DD or DD/MM/YYYY
              </div>
              <div>
                <span className="font-semibold">Product Type:</span> Must match existing product names (e.g., "ROR English", "Teevo")
              </div>
              <div>
                <span className="font-semibold">Quantity:</span> Number of copies ordered
              </div>
              <div>
                <span className="font-semibold">Unit Price:</span> Price per copy (optional if product has default price)
              </div>
              <div>
                <span className="font-semibold">Payment Amount:</span> Total amount paid (optional)
              </div>
              <div>
                <span className="font-semibold">Payment Method:</span> BANK_TRANSFER, CASH, or ESPEES
              </div>
              <div>
                <span className="font-semibold">Reference:</span> Transaction reference number (optional)
              </div>
            </div>

            <div className="mt-4">
              <Link href="/api/template/download">
                <Button variant="outline" size="sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Template CSV
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
