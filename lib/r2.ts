import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

if (!process.env.R2_ACCOUNT_ID) throw new Error("R2_ACCOUNT_ID is not set")
if (!process.env.R2_ACCESS_KEY_ID) throw new Error("R2_ACCESS_KEY_ID is not set")
if (!process.env.R2_SECRET_ACCESS_KEY) throw new Error("R2_SECRET_ACCESS_KEY is not set")
if (!process.env.R2_BUCKET_NAME) throw new Error("R2_BUCKET_NAME is not set")

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ""

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array | Blob,
  contentType: string = "application/octet-stream"
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  })

  await r2Client.send(command)
  return `${R2_PUBLIC_URL}/${key}`
}

export async function getPresignedUploadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  })

  return await getSignedUrl(r2Client, command, { expiresIn })
}

export async function getPresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  })

  return await getSignedUrl(r2Client, command, { expiresIn })
}

export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  })

  await r2Client.send(command)
}

export async function downloadFromR2(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  })

  const response = await r2Client.send(command)
  const chunks: Buffer[] = []

  if (response.Body) {
    const stream = response.Body as NodeJS.ReadableStream
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk))
    }
  }

  return Buffer.concat(chunks)
}

export function generateR2Key(type: "csv" | "report", filename: string): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const timestamp = Date.now()

  if (type === "csv") {
    return `uploads/csv/${year}/${month}/${timestamp}-${filename}`
  } else {
    return `exports/reports/${year}/${month}/${timestamp}-${filename}`
  }
}
