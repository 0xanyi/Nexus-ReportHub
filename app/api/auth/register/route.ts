import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(12, "Password must be at least 12 characters"),
})

export async function POST(request: Request) {
  // Public registration is disabled
  // Users must be created by administrators through the dashboard
  return NextResponse.json(
    { error: "Public registration is disabled. Please contact your administrator." },
    { status: 403 }
  )
}
