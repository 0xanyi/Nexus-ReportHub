import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ZONE_ADMIN"

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard">
            <h1 className="text-2xl font-bold cursor-pointer hover:text-primary">
              Nexus ReportHub
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <p className="font-medium">{session.user.name}</p>
              <p className="text-gray-500">{session.user.role.replace("_", " ")}</p>
            </div>
            <form action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
        <div className="border-t">
          <nav className="container mx-auto px-4">
            <ul className="flex gap-6 text-sm">
              <li>
                <Link
                  href="/dashboard"
                  className="block py-3 border-b-2 border-transparent hover:border-primary transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/reports"
                  className="block py-3 border-b-2 border-transparent hover:border-primary transition-colors"
                >
                  Reports
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/analytics"
                  className="block py-3 border-b-2 border-transparent hover:border-primary transition-colors"
                >
                  Analytics
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/churches"
                  className="block py-3 border-b-2 border-transparent hover:border-primary transition-colors"
                >
                  Churches
                </Link>
              </li>
              {isAdmin && (
                <>
                  <li>
                    <Link
                      href="/dashboard/groups"
                      className="block py-3 border-b-2 border-transparent hover:border-primary transition-colors"
                    >
                      Groups
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/departments"
                      className="block py-3 border-b-2 border-transparent hover:border-primary transition-colors"
                    >
                      Departments
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/products"
                      className="block py-3 border-b-2 border-transparent hover:border-primary transition-colors"
                    >
                      Products
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/upload"
                      className="block py-3 border-b-2 border-transparent hover:border-primary transition-colors"
                    >
                      Upload CSV
                    </Link>
                  </li>
                  {session.user.role === "SUPER_ADMIN" && (
                    <li>
                      <Link
                        href="/dashboard/users"
                        className="block py-3 border-b-2 border-transparent hover:border-primary transition-colors"
                      >
                        Users
                      </Link>
                    </li>
                  )}
                </>
              )}
            </ul>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
