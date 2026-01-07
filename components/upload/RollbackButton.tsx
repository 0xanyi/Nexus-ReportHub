"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface RollbackButtonProps {
  uploadId: string
  fileName: string
  recordsProcessed: number
  status: string
  onRollbackComplete?: () => void
}

export function RollbackButton({
  uploadId,
  fileName,
  recordsProcessed,
  status,
  onRollbackComplete,
}: RollbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isRolledBack = status === "ROLLED_BACK"
  const isProcessing = status === "PROCESSING"
  const canRollback = !isRolledBack && !isProcessing && recordsProcessed > 0

  async function handleRollback() {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/upload/${uploadId}/rollback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to rollback upload")
        setIsLoading(false)
        return
      }

      setIsOpen(false)
      onRollbackComplete?.()
      window.location.reload()
    } catch {
      setError("An error occurred while rolling back the upload")
      setIsLoading(false)
    }
  }

  if (isRolledBack) {
    return (
      <span className="text-sm text-muted-foreground italic">
        Rolled back
      </span>
    )
  }

  if (!canRollback) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Rollback
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Rollback</DialogTitle>
          <DialogDescription>
            Are you sure you want to rollback this upload? This action will permanently delete all
            records created by this upload.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">Warning</h4>
            <p className="text-sm text-yellow-700">
              This will delete <strong>{recordsProcessed}</strong> record(s) from the upload{" "}
              <strong>&quot;{fileName}&quot;</strong>.
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              This action cannot be undone. You will need to re-upload the CSV if you want to
              restore the data.
            </p>
          </div>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleRollback} disabled={isLoading}>
            {isLoading ? "Rolling back..." : "Yes, Rollback Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
