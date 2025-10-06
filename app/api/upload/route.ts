import { NextResponse } from "next/server"
import { Prisma, UploadType, type PaymentMethod } from "@prisma/client"
import Papa from "papaparse"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

type RawCsvRow = Record<string, string>

interface TransactionRow {
  date: string
  amount: string
  church: string
  group?: string
  type: string
  paymentMethod?: string
  reference?: string
}

interface OrderRow {
  chapter: string
  quantities: Record<string, string>
  total?: string
  totalWithDelivery?: string
}

const EXCEL_EPOCH = new Date("1899-12-30T00:00:00Z")
const MAX_FILE_SIZE = 10 * 1024 * 1024
const PRINT_KEYWORD = "print"
const DEFAULT_ORDER_UNIT_PRICE = new Prisma.Decimal(3)
const DEFAULT_ORDER_CURRENCY = "GBP"

const TRANSACTION_HEADER_MAP = {
  date: ["DATE", "TRANSACTION DATE"],
  amount: ["AMOUNT", "VALUE"],
  church: ["CHURCH", "CHURCH NAME", "CHAPTER"],
  group: ["GROUP"],
  type: ["TYPE", "CATEGORY"],
  paymentMethod: ["PAYMENT METHOD", "METHOD"],
  reference: ["REFERENCE", "REFERENCE NUMBER"],
}

const ORDER_METADATA_COLUMNS = new Set([
  "CHAPTER",
  "TOTAL COST",
  "TOTAL COST INCLUDING DELIVERY",
  "TOTAL",
  "DELIVERY",
  "NOTES",
  "COMMENTS",
])

function cleanString(value?: string | null): string {
  if (value === undefined || value === null) return ""
  return String(value).trim()
}

function parseAmount(raw: string): number | null {
  const cleaned = cleanString(raw).replace(/[^0-9.\-]/g, "")
  if (!cleaned) return null
  const parsed = parseFloat(cleaned)
  if (!Number.isFinite(parsed)) return null
  return parsed
}

function parseExcelSerialDate(value: number): Date | null {
  if (!Number.isFinite(value)) return null
  const ms = value * 24 * 60 * 60 * 1000
  const date = new Date(EXCEL_EPOCH.getTime() + ms)
  if (Number.isNaN(date.getTime())) return null
  return date
}

function parseUploadDate(value: string): Date | null {
  const trimmed = cleanString(value)
  if (!trimmed) return null

  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return parseExcelSerialDate(parseFloat(trimmed))
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split("/").map((part) => parseInt(part, 10))
    const date = new Date(Date.UTC(year, month - 1, day))
    if (!Number.isNaN(date.getTime())) return date
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split("-").map((part) => parseInt(part, 10))
    const date = new Date(Date.UTC(year, month - 1, day))
    if (!Number.isNaN(date.getTime())) return date
  }

  const parsed = new Date(trimmed)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed
  }

  return null
}

function parseOrderPeriod(value: string | null): Date | null {
  const trimmed = cleanString(value)
  if (!trimmed) return null

  if (/^\d{4}-\d{2}$/.test(trimmed)) {
    const [year, month] = trimmed.split("-").map((part) => parseInt(part, 10))
    return new Date(Date.UTC(year, month - 1, 1))
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split("-").map((part) => parseInt(part, 10))
    return new Date(Date.UTC(year, month - 1, day))
  }

  return null
}

function normalizeCategoryName(value: string): string {
  return cleanString(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

function isPrintType(type: string): boolean {
  return normalizeCategoryName(type).includes(PRINT_KEYWORD)
}

function resolveTransactionRow(row: RawCsvRow): TransactionRow | null {
  const date = resolveHeader(row, TRANSACTION_HEADER_MAP.date)
  const amount = resolveHeader(row, TRANSACTION_HEADER_MAP.amount)
  const church = resolveHeader(row, TRANSACTION_HEADER_MAP.church)
  const group = resolveHeader(row, TRANSACTION_HEADER_MAP.group)
  const type = resolveHeader(row, TRANSACTION_HEADER_MAP.type)
  const paymentMethod = resolveHeader(row, TRANSACTION_HEADER_MAP.paymentMethod)
  const reference = resolveHeader(row, TRANSACTION_HEADER_MAP.reference)

  if (!date && !amount && !church && !type) {
    return null
  }

  return {
    date,
    amount,
    church,
    group,
    type,
    paymentMethod,
    reference,
  }
}

function resolveHeader(row: RawCsvRow, keys: string[]): string {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      return cleanString(row[key])
    }
  }
  return ""
}

function extractOrderRow(row: RawCsvRow): OrderRow | null {
  const chapter = cleanString(row["CHAPTER"])
  const total = cleanString(row["TOTAL COST"])
  const totalWithDelivery = cleanString(row["TOTAL COST INCLUDING DELIVERY"])

  const quantities: Record<string, string> = {}
  let hasQuantity = false

  for (const [header, value] of Object.entries(row)) {
    const headerUpper = header.toUpperCase()
    
    if (ORDER_METADATA_COLUMNS.has(headerUpper)) {
      continue
    }

    const cleanedValue = cleanString(value)
    if (cleanedValue) {
      const quantity = parseInt(cleanedValue, 10)
      if (Number.isFinite(quantity) && quantity > 0) {
        const productName = header
          .replace(/\s+QUANTITY$/i, "")
          .replace(/\s+QTY$/i, "")
          .trim()
        
        quantities[productName] = cleanedValue
        hasQuantity = true
      }
    }
  }

  if (!chapter && !hasQuantity) {
    return null
  }

  return {
    chapter,
    quantities,
    total,
    totalWithDelivery,
  }
}

async function ensureCampaignCategories(departmentId: string, counts: Map<string, { raw: string; count: number }>) {
  const existing = await prisma.campaignCategory.findMany({
    where: { departmentId },
  })

  const categoryMap = new Map<string, (typeof existing)[number]>()
  for (const category of existing) {
    categoryMap.set(category.normalizedName, category)
  }

  const created: string[] = []

  for (const [normalized, info] of counts) {
    if (info.count <= 2 || !info.raw || isPrintType(info.raw)) {
      continue
    }

    if (categoryMap.has(normalized)) {
      continue
    }

    const category = await prisma.campaignCategory.create({
      data: {
        name: info.raw,
        normalizedName: normalized,
        departmentId,
        autoGenerated: true,
      },
    })

    categoryMap.set(normalized, category)
    created.push(category.name)
  }

  return { categoryMap, created }
}

async function ensureProductType(departmentId: string, name: string) {
  const existing = await prisma.productType.findFirst({
    where: {
      departmentId,
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
  })

  if (existing) {
    return existing
  }

  return prisma.productType.create({
    data: {
      name,
      departmentId,
      unitPrice: DEFAULT_ORDER_UNIT_PRICE,
      currency: DEFAULT_ORDER_CURRENCY,
    },
  })
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ZONE_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const uploadTypeValue = cleanString((formData.get("uploadType") as string | null) ?? "")
    const orderPeriodValue = cleanString(formData.get("orderPeriod") as string | null)

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 })
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "Only CSV files are allowed" }, { status: 400 })
    }

    const uploadType = uploadTypeValue === UploadType.ORDER ? UploadType.ORDER : UploadType.TRANSACTION

    const fileContent = await file.text()

    const parseResult = await new Promise<Papa.ParseResult<RawCsvRow>>((resolve) => {
      Papa.parse<RawCsvRow>(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => cleanString(header).toUpperCase(),
        complete: (result) => resolve(result),
      })
    })

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        { error: "CSV parsing failed", details: parseResult.errors },
        { status: 400 }
      )
    }

    const rawRows = parseResult.data.filter((row) =>
      Object.values(row).some((value) => cleanString(value).length > 0)
    )

    if (rawRows.length === 0) {
      return NextResponse.json({ error: "CSV file is empty" }, { status: 400 })
    }

    let department
    
    if (session.user.departmentId) {
      department = await prisma.department.findUnique({
        where: { id: session.user.departmentId },
      })
    } else {
      department = await prisma.department.findFirst()
    }

    if (!department) {
      return NextResponse.json({ 
        error: "No department found. Please ensure at least one department exists in the system." 
      }, { status: 404 })
    }

    const uploadHistory = await prisma.uploadHistory.create({
      data: {
        fileName: file.name,
        uploadedBy: session.user.id,
        status: "PROCESSING",
        uploadType,
      },
    })

    const errors: string[] = []
    let recordsProcessed = 0
    let categoriesCreated: string[] = []
    let ordersCreated = 0
    let orderLineItemsCreated = 0

    if (uploadType === UploadType.TRANSACTION) {
      const transactionRows: TransactionRow[] = []

      for (let index = 0; index < rawRows.length; index++) {
        const resolved = resolveTransactionRow(rawRows[index])
        if (resolved) {
          transactionRows.push(resolved)
        }
      }

      const typeCounts = new Map<string, { raw: string; count: number }>()
      for (const row of transactionRows) {
        if (!row.type) continue
        const normalized = normalizeCategoryName(row.type)
        if (!typeCounts.has(normalized)) {
          typeCounts.set(normalized, { raw: row.type, count: 0 })
        }
        typeCounts.get(normalized)!.count += 1
      }

      const { categoryMap, created } = await ensureCampaignCategories(department.id, typeCounts)
      categoriesCreated = created

      for (let i = 0; i < transactionRows.length; i++) {
        const row = transactionRows[i]
        const rowNum = i + 2

        try {
          if (!row.church) {
            errors.push(`Row ${rowNum}: Missing church name`)
            continue
          }

          if (!row.type) {
            errors.push(`Row ${rowNum}: Missing category/type`)
            continue
          }

          const amount = parseAmount(row.amount)
          if (amount === null || amount <= 0) {
            errors.push(`Row ${rowNum}: Invalid amount "${row.amount}"`)
            continue
          }

          const paymentDate = parseUploadDate(row.date)
          if (!paymentDate) {
            errors.push(`Row ${rowNum}: Invalid date "${row.date}"`)
            continue
          }

          const church = await prisma.church.findFirst({
            where: {
              name: {
                equals: row.church,
                mode: "insensitive",
              },
            },
            include: {
              group: {
                include: {
                  zone: true,
                },
              },
            },
          })

          if (!church) {
            errors.push(`Row ${rowNum}: Church "${row.church}" not found`)
            continue
          }

          const normalizedType = normalizeCategoryName(row.type)
          const isPrint = isPrintType(row.type)
          const category = !isPrint ? categoryMap.get(normalizedType) ?? null : null

          const paymentMethodRaw = cleanString(row.paymentMethod).toUpperCase()
          const paymentMethodCandidate = (["BANK_TRANSFER", "CASH", "ESPEES"] as const).find(
            (method) => method === paymentMethodRaw
          )
          const paymentMethod: PaymentMethod = paymentMethodCandidate ?? "BANK_TRANSFER"

          await prisma.payment.create({
            data: {
              churchId: church.id,
              departmentId: department.id,
              uploadedBy: session.user.id,
              paymentDate,
              amount: new Prisma.Decimal(amount.toFixed(2)),
              currency: DEFAULT_ORDER_CURRENCY,
              paymentMethod,
              forPurpose: isPrint ? "PRINTING" : "SPONSORSHIP",
              referenceNumber: cleanString(row.reference) || null,
              campaignCategoryId: category?.id,
              campaignLabel: row.type,
              notes: row.group ? `Group: ${row.group}` : undefined,
            },
          })

          recordsProcessed += 1
        } catch (error) {
          console.error(`Transaction upload error (row ${rowNum}):`, error)
          errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : "Unknown error"}`)
        }
      }
    } else {
      const orderRows: OrderRow[] = []

      for (const row of rawRows) {
        const extracted = extractOrderRow(row)
        if (extracted) {
          orderRows.push(extracted)
        }
      }

      const orderPeriodDate = parseOrderPeriod(orderPeriodValue)
      if (!orderPeriodDate) {
        errors.push("Order uploads require a valid orderPeriod (YYYY-MM) value")
      }

      const productCache = new Map<string, Awaited<ReturnType<typeof ensureProductType>>>()

      for (let i = 0; i < orderRows.length; i++) {
        const row = orderRows[i]
        const rowNum = i + 2

        if (!row.chapter) {
          continue
        }

        const normalizedChapter = row.chapter.toUpperCase()
        if (normalizedChapter === "CHAPTER" || normalizedChapter.startsWith("UK ZONE")) {
          continue
        }

        try {
          const church = await prisma.church.findFirst({
            where: {
              name: {
                equals: row.chapter,
                mode: "insensitive",
              },
            },
          })

          if (!church) {
            errors.push(`Row ${rowNum}: Church "${row.chapter}" not found`)
            continue
          }

          const lineItems: {
            productTypeId: string
            quantity: number
            unitPrice: Prisma.Decimal
            totalAmount: Prisma.Decimal
          }[] = []

          for (const [productName, rawValue] of Object.entries(row.quantities)) {
            const quantity = parseInt(rawValue, 10)
            if (!Number.isFinite(quantity) || quantity <= 0) {
              continue
            }

            if (!productCache.has(productName)) {
              const product = await ensureProductType(department.id, productName)
              productCache.set(productName, product)
            }

            const product = productCache.get(productName)!
            const total = DEFAULT_ORDER_UNIT_PRICE.mul(quantity)

            lineItems.push({
              productTypeId: product.id,
              quantity,
              unitPrice: DEFAULT_ORDER_UNIT_PRICE,
              totalAmount: total,
            })
          }

          if (lineItems.length === 0) {
            continue
          }

          if (!orderPeriodDate) {
            errors.push(`Row ${rowNum}: Unable to determine order period for church ${row.chapter}`)
            continue
          }

          await prisma.transaction.create({
            data: {
              churchId: church.id,
              departmentId: department.id,
              uploadedBy: session.user.id,
              transactionDate: orderPeriodDate,
              transactionType: "PURCHASE",
              currency: DEFAULT_ORDER_CURRENCY,
              notes: row.totalWithDelivery
                ? `Total with delivery: £${row.totalWithDelivery}`
                : row.total
                ? `Total: £${row.total}`
                : undefined,
              lineItems: {
                create: lineItems,
              },
            },
          })

          ordersCreated += 1
          orderLineItemsCreated += lineItems.length
          recordsProcessed += 1
        } catch (error) {
          console.error(`Order upload error (row ${rowNum}):`, error)
          errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : "Unknown error"}`)
        }
      }
    }

    await prisma.uploadHistory.update({
      where: { id: uploadHistory.id },
      data: {
        status: errors.length > 0 ? "PARTIAL" : "SUCCESS",
        recordsProcessed,
        errorLog: errors.length > 0 ? errors.join("\n") : null,
        uploadType,
      },
    })

    return NextResponse.json({
      message: "Upload processed",
      status: errors.length > 0 ? "PARTIAL" : "SUCCESS",
      recordsProcessed,
      totalRows: rawRows.length,
      errors: errors.length > 0 ? errors : undefined,
      uploadId: uploadHistory.id,
      uploadType,
      summary: {
        campaignCategoriesCreated: categoriesCreated.length,
        ordersCreated,
        orderLineItemsCreated,
      },
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
