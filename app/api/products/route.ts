import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  unitPrice: z.number().positive("Price must be positive"),
  currency: z.string().default("GBP"),
  departmentId: z.string().min(1, "Department is required"),
});

// GET /api/products - List all products
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");

    const products = await prisma.productType.findMany({
      where: departmentId ? { departmentId } : undefined,
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            lineItems: true,
          },
        },
      },
      orderBy: [
        { department: { name: "asc" } },
        { name: "asc" },
      ],
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true },
    });

    if (!user || !["SUPER_ADMIN", "ZONE_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createProductSchema.parse(body);

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: validatedData.departmentId },
    });

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    // Check if product with same name already exists in department
    const existingProduct = await prisma.productType.findUnique({
      where: {
        departmentId_name: {
          departmentId: validatedData.departmentId,
          name: validatedData.name,
        },
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: "Product with this name already exists in the department" },
        { status: 409 }
      );
    }

    const product = await prisma.productType.create({
      data: {
        name: validatedData.name,
        unitPrice: validatedData.unitPrice,
        currency: validatedData.currency,
        departmentId: validatedData.departmentId,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}