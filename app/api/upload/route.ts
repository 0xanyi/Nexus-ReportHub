import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Papa from "papaparse"

interface CSVRow {
  "Church Name": string
  Date: string
  "Product Type": string
  Quantity: string
  "Unit Price"?: string
  "Payment Amount"?: string
  "Payment Method"?: string
  Reference?: string
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can upload CSV
    if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ZONE_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 })
    }

    // Check file type
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "Only CSV files are allowed" }, { status: 400 })
    }

    // Read file content
    const fileContent = await file.text()

    // Parse CSV
    const parseResult = await new Promise<Papa.ParseResult<CSVRow>>((resolve) => {
      Papa.parse<CSVRow>(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => resolve(result),
      })
    })

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        { error: "CSV parsing failed", details: parseResult.errors },
        { status: 400 }
      )
    }

    const rows = parseResult.data
    const errors: string[] = []
    let recordsProcessed = 0

    // Get user's department
    const department = await prisma.department.findFirst({
      where: session.user.departmentId
        ? { id: session.user.departmentId }
        : { name: "UK ZONE 1 DSP" },
    })

    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 })
    }

    // Create upload history record
    const uploadHistory = await prisma.uploadHistory.create({
      data: {
        fileName: file.name,
        uploadedBy: session.user.id,
        status: "PROCESSING",
      },
    })

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // +2 because of header and 1-indexed

      try {
        // Validate required fields
        if (!row["Church Name"]) {
          errors.push(`Row ${rowNum}: Missing church name`)
          continue
        }

        if (!row.Date) {
          errors.push(`Row ${rowNum}: Missing date`)
          continue
        }

        if (!row["Product Type"]) {
          errors.push(`Row ${rowNum}: Missing product type`)
          continue
        }

        if (!row.Quantity || isNaN(parseInt(row.Quantity))) {
          errors.push(`Row ${rowNum}: Invalid or missing quantity`)
          continue
        }

        // Find church
        const church = await prisma.church.findFirst({
          where: {
            name: {
              equals: row["Church Name"].trim(),
              mode: "insensitive",
            },
          },
        })

        if (!church) {
          errors.push(`Row ${rowNum}: Church "${row["Church Name"]}" not found`)
          continue
        }

        // Find product type
        const productType = await prisma.productType.findFirst({
          where: {
            name: {
              equals: row["Product Type"].trim(),
              mode: "insensitive",
            },
            departmentId: department.id,
          },
        })

        if (!productType) {
          errors.push(`Row ${rowNum}: Product type "${row["Product Type"]}" not found`)
          continue
        }

        // Parse date
        let transactionDate: Date
        try {
          transactionDate = new Date(row.Date)
          if (isNaN(transactionDate.getTime())) {
            throw new Error("Invalid date")
          }
        } catch {
          errors.push(`Row ${rowNum}: Invalid date format "${row.Date}"`)
          continue
        }

        const quantity = parseInt(row.Quantity)
        const unitPrice = row["Unit Price"]
          ? parseFloat(row["Unit Price"])
          : Number(productType.unitPrice)
        const totalAmount = quantity * unitPrice

        // Create transaction
        await prisma.transaction.create({
          data: {
            churchId: church.id,
            departmentId: department.id,
            uploadedBy: session.user.id,
            transactionDate,
            transactionType: "PURCHASE",
            currency: productType.currency,
            lineItems: {
              create: {
                productTypeId: productType.id,
                quantity,
                unitPrice,
                totalAmount,
              },
            },
          },
        })

        // If payment info is provided, create payment record
        if (row["Payment Amount"] && parseFloat(row["Payment Amount"]) > 0) {
          const paymentMethod = row["Payment Method"]?.toUpperCase() as
            | "BANK_TRANSFER"
            | "CASH"
            | "ESPEES"
            | undefined

          if (
            paymentMethod &&
            ["BANK_TRANSFER", "CASH", "ESPEES"].includes(paymentMethod)
          ) {
            await prisma.payment.create({
              data: {
                churchId: church.id,
                departmentId: department.id,
                uploadedBy: session.user.id,
                paymentDate: transactionDate,
                amount: parseFloat(row["Payment Amount"]),
                currency: productType.currency,
                paymentMethod,
                forPurpose: "PRINTING",
                referenceNumber: row.Reference || null,
              },
            })
          }
        }

        recordsProcessed++
      } catch (error) {
        console.error(`Error processing row ${rowNum}:`, error)
        errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }

    // Update upload history
    await prisma.uploadHistory.update({
      where: { id: uploadHistory.id },
      data: {
        status: errors.length > 0 ? "PARTIAL" : "SUCCESS",
        recordsProcessed,
        errorLog: errors.length > 0 ? errors.join("\n") : null,
      },
    })

    return NextResponse.json({
      message: "Upload processed",
      status: errors.length > 0 ? "PARTIAL" : "SUCCESS",
      recordsProcessed,
      totalRows: rows.length,
      errors: errors.length > 0 ? errors : undefined,
      uploadId: uploadHistory.id,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
