import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function DepartmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const resolvedParams = await params
  const isSuperAdmin = session.user.role === "SUPER_ADMIN"

  const department = await prisma.department.findUnique({
    where: { id: resolvedParams.id },
    include: {
      productTypes: {
        orderBy: { name: "asc" },
      },
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
        orderBy: { name: "asc" },
      },
      _count: {
        select: {
          productTypes: true,
          transactions: true,
          payments: true,
          users: true,
        },
      },
    },
  })

  if (!department) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Department Not Found</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">The requested department could not be found.</p>
            <Link href="/dashboard/departments" className="inline-block mt-4">
              <Button>Back to Departments</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/departments"
            className="text-sm text-primary hover:underline mb-2 inline-block"
          >
            ← Back to Departments
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">{department.name}</h2>
          {department.description && (
            <p className="text-muted-foreground">{department.description}</p>
          )}
        </div>
        {isSuperAdmin && (
          <Link href={`/dashboard/departments/${department.id}/edit`}>
            <Button>Edit Department</Button>
          </Link>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{department._count.productTypes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{department._count.users}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{department._count.transactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{department._count.payments}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Types</CardTitle>
        </CardHeader>
        <CardContent>
          {department.productTypes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Product Name</th>
                    <th className="text-right py-3 px-4">Unit Price</th>
                    <th className="text-right py-3 px-4">Currency</th>
                  </tr>
                </thead>
                <tbody>
                  {department.productTypes.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{product.name}</td>
                      <td className="py-3 px-4 text-right">
                        {Number(product.unitPrice).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">{product.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No products in this department yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          {department.users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-right py-3 px-4">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {department.users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{user.name}</td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4 text-right">
                        {user.role.replace("_", " ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No users assigned to this department yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
