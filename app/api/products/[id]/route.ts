import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateProductSchema = z.object({
  name: z.string().min(1, "Product name is required").optional(),
  unitPrice: z.number().positive("Price must be positive").optional(),
  currency: z.string().optional(),
  departmentId: z.string().min(1, "Department is required").optional(),
});

// GET /api/products/[id] - Get a specific product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const product = await prisma.productType.findUnique({
      where: { id },
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
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);

    // Check if product exists
    const existingProduct = await prisma.productType.findUnique({
      where: { id },
      include: {
        department: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // If changing department, check if new department exists
    if (validatedData.departmentId && validatedData.departmentId !== existingProduct.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: validatedData.departmentId },
      });

      if (!department) {
        return NextResponse.json(
          { error: "Department not found" },
          { status: 404 }
        );
      }
    }

    // If changing name, check for uniqueness within department
    if (validatedData.name && validatedData.name !== existingProduct.name) {
      const departmentId = validatedData.departmentId || existingProduct.departmentId;

      const duplicateProduct = await prisma.productType.findUnique({
        where: {
          departmentId_name: {
            departmentId,
            name: validatedData.name,
          },
        },
      });

      if (duplicateProduct) {
        return NextResponse.json(
          { error: "Product with this name already exists in the department" },
          { status: 409 }
        );
      }
    }

    const updatedProduct = await prisma.productType.update({
      where: { id },
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
        _count: {
          select: {
            lineItems: true,
          },
        },
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Check if product exists and get line item count
    const product = await prisma.productType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            lineItems: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Prevent deletion if product has associated line items
    if (product._count.lineItems > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete product with existing orders",
          message: `This product has ${product._count.lineItems} associated order(s) and cannot be deleted.`,
        },
        { status: 409 }
      );
    }

    await prisma.productType.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}