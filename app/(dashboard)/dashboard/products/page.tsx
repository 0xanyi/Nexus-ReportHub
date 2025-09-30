import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ProductsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Only admins can manage products
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ZONE_ADMIN") {
    redirect("/dashboard")
  }

  const products = await prisma.productType.findMany({
    include: {
      department: true,
    },
    orderBy: {
      name: "asc",
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Product Types</h2>
          <p className="text-muted-foreground">
            Manage Rhapsody editions and other products
          </p>
        </div>
        <Link href="/dashboard/products/new">
          <Button>Add Product Type</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription>{product.department.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Unit Price</span>
                  <span className="font-semibold">
                    {product.currency} {Number(product.unitPrice).toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link href={`/dashboard/products/${product.id}/edit`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      Edit
                    </Button>
                  </Link>
                  <form action={`/dashboard/products/${product.id}/delete`} method="POST" className="flex-1">
                    <Button variant="destructive" className="w-full" size="sm" type="submit">
                      Delete
                    </Button>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {products.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No product types found</p>
              <Link href="/dashboard/products/new">
                <Button>Add Your First Product</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
