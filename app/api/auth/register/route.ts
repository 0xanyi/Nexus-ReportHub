import { NextResponse } from "next/server"

export async function POST() {
  // Public registration is disabled
  // Users must be created by administrators through the dashboard
  return NextResponse.json(
    { error: "Public registration is disabled. Please contact your administrator." },
    { status: 403 }
  )
}
