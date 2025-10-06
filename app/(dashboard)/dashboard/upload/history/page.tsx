import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

export default async function UploadHistoryPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Only admins can view upload history
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ZONE_ADMIN") {
    redirect("/dashboard")
  }

  const uploads = await prisma.uploadHistory.findMany({
    include: {
      uploader: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      uploadedAt: "desc",
    },
    take: 50,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Upload History</h2>
          <p className="text-muted-foreground">
            View all CSV uploads and their processing status
          </p>
        </div>
        <Link href="/dashboard/upload">
          <Button>Upload New CSV</Button>
        </Link>
      </div>

      <div className="space-y-4">
        {uploads.map((upload) => (
          <Card key={upload.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{upload.fileName}</CardTitle>
                  <CardDescription>
                    Uploaded by {upload.uploader.name} on {formatDate(upload.uploadedAt)}
                  </CardDescription>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    upload.status === "SUCCESS"
                      ? "bg-green-100 text-green-800"
                      : upload.status === "PARTIAL"
                      ? "bg-yellow-100 text-yellow-800"
                      : upload.status === "FAILED"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {upload.status}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8 text-sm">
                <div>
                  <span className="text-muted-foreground">Records Processed:</span>
                  <span className="ml-2 font-medium">{upload.recordsProcessed}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Upload Type:</span>
                  <span className="ml-2 font-medium capitalize">{upload.uploadType.toLowerCase()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Upload Time:</span>
                  <span className="ml-2 font-medium">
                    {new Date(upload.uploadedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {upload.errorLog && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                  <h4 className="text-sm font-semibold text-yellow-800 mb-2">Errors/Warnings:</h4>
                  <pre className="text-xs text-yellow-700 whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
                    {upload.errorLog}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {uploads.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No upload history found</p>
              <Link href="/dashboard/upload">
                <Button>Upload Your First CSV</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
