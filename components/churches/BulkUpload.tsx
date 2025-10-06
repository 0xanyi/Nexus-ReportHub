"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Link from "next/link"

export function ChurchBulkUpload() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string>("")
  const [result, setResult] = useState<{
    created: number
    skipped: number
    total: number
    errors?: string[]
  } | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.name.endsWith(".csv")) {
        setFile(selectedFile)
        setError("")
        setResult(null)
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
    setResult(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/churches/bulk-upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Upload failed")
        setIsUploading(false)
      } else {
        setResult(data)
        setFile(null)
        setIsUploading(false)

        // Refresh the page after successful upload
        if (data.created > 0) {
          setTimeout(() => {
            router.refresh()
            setIsOpen(false)
          }, 3000)
        }
      }
    } catch {
      setError("An error occurred during upload. Please try again.")
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          Bulk Upload Churches
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Upload Churches</DialogTitle>
          <DialogDescription>
            Upload a CSV file to create multiple churches at once. Each church must be assigned to
            an existing group.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {result && (
            <div
              className={`rounded-md p-4 ${
                result.created > 0 ? "bg-green-50" : "bg-yellow-50"
              }`}
            >
              <h4
                className={`font-semibold ${
                  result.created > 0 ? "text-green-800" : "text-yellow-800"
                }`}
              >
                Upload Complete
              </h4>
              <div className="mt-2 text-sm">
                <p>✅ Created: {result.created} churches</p>
                <p>⚠️ Skipped: {result.skipped} churches</p>
                <p>📊 Total rows: {result.total}</p>
              </div>
              {result.errors && result.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-yellow-800">Issues:</p>
                  <ul className="mt-1 list-disc list-inside text-sm text-yellow-700 space-y-1">
                    {result.errors.slice(0, 5).map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                    {result.errors.length > 5 && (
                      <li>...and {result.errors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="rounded-md border border-dashed border-gray-300 p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <label htmlFor="church-file" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="h-10 w-10 text-gray-400"
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
                    <span className="text-sm font-medium text-gray-700">
                      Click to select CSV file
                    </span>
                  </div>
                  <input
                    id="church-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>

              {file && (
                <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium">{file.name}</span>
                  <span className="text-gray-500">({(file.size / 1024).toFixed(2)} KB)</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-md bg-blue-50 p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">CSV Format</h4>
            <div className="text-sm text-blue-800 font-mono bg-white p-2 rounded">
              Church Name, Group Name
            </div>
            <p className="mt-2 text-xs text-blue-700">
              The Group Name must exactly match an existing group in your system.
            </p>
            <div className="mt-3">
              <Link href="/api/template/download?type=churches">
                <Button type="button" variant="link" size="sm" className="text-blue-600 p-0 h-auto">
                  <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download Template CSV
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={!file || isUploading} className="flex-1">
              {isUploading ? "Uploading..." : "Upload Churches"}
            </Button>
            {file && !isUploading && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFile(null)
                  setResult(null)
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
