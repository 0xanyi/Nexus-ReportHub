import { NextResponse } from "next/server"
import Papa from "papaparse"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-guards"
import { requireCsrf } from "@/lib/csrf"

type RawCsvRow = Record<string, string>

interface ChurchRow {
  name: string
  groupName: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024

function cleanString(value?: string | null): string {
  if (value === undefined || value === null) return ""
  return String(value).trim()
}

function extractChurchRow(row: RawCsvRow): ChurchRow | null {
  const name = cleanString(row["CHURCH NAME"] || row["CHURCH"] || row["NAME"])
  const groupName = cleanString(row["GROUP NAME"] || row["GROUP"])

  if (!name || !groupName) {
    return null
  }

  return { name, groupName }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    // CSRF validation
    const csrfError = await requireCsrf()
    if (csrfError) return csrfError

    // Auth and role check
    const authCheck = requireAdmin(session)
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 })
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "Only CSV files are allowed" }, { status: 400 })
    }

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

    const churchRows: ChurchRow[] = []
    const errors: string[] = []

    for (let i = 0; i < rawRows.length; i++) {
      const row = extractChurchRow(rawRows[i])
      if (row) {
        churchRows.push(row)
      } else {
        errors.push(`Row ${i + 2}: Missing required fields (Church Name or Group Name)`)
      }
    }

    if (churchRows.length === 0) {
      return NextResponse.json(
        { error: "No valid church rows found in CSV", errors },
        { status: 400 }
      )
    }

    // Get all groups to validate
    const groups = await prisma.group.findMany({
      select: {
        id: true,
        name: true,
        zoneId: true,
      },
    })

    const groupMap = new Map<string, string>()
    for (const group of groups) {
      groupMap.set(group.name.toLowerCase(), group.id)
    }

    // Get existing churches to check for duplicates
    const existingChurches = await prisma.church.findMany({
      select: {
        name: true,
        groupId: true,
      },
    })

    const existingChurchMap = new Map<string, string>()
    for (const church of existingChurches) {
      const key = `${church.name.toLowerCase()}|${church.groupId}`
      existingChurchMap.set(key, church.name)
    }

    let created = 0
    let skipped = 0

    for (let i = 0; i < churchRows.length; i++) {
      const row = churchRows[i]
      const rowNum = i + 2

      try {
        const groupId = groupMap.get(row.groupName.toLowerCase())
        
        if (!groupId) {
          errors.push(`Row ${rowNum}: Group "${row.groupName}" not found`)
          skipped++
          continue
        }

        const checkKey = `${row.name.toLowerCase()}|${groupId}`
        if (existingChurchMap.has(checkKey)) {
          errors.push(`Row ${rowNum}: Church "${row.name}" already exists in group "${row.groupName}"`)
          skipped++
          continue
        }

        await prisma.church.create({
          data: {
            name: row.name,
            groupId,
          },
        })

        created++
        existingChurchMap.set(checkKey, row.name)
      } catch (error) {
        console.error(`Church bulk upload error (row ${rowNum}):`, error)
        errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : "Unknown error"}`)
        skipped++
      }
    }

    return NextResponse.json({
      message: "Church bulk upload completed",
      created,
      skipped,
      total: churchRows.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("Church bulk upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
