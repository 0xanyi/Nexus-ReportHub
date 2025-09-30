import { auth } from "@/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Churches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">27</div>
            <p className="text-xs text-muted-foreground">
              Across all groups
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£12,450</div>
            <p className="text-xs text-muted-foreground">
              Total collections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£2,340</div>
            <p className="text-xs text-muted-foreground">
              Pending payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Copies Distributed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8,450</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full p-4 text-left border rounded-lg hover:bg-accent transition-colors">
              <div className="font-medium">Upload CSV Data</div>
              <div className="text-sm text-muted-foreground">
                Import transactions and payments
              </div>
            </button>
            <button className="w-full p-4 text-left border rounded-lg hover:bg-accent transition-colors">
              <div className="font-medium">View Reports</div>
              <div className="text-sm text-muted-foreground">
                Generate monthly and annual summaries
              </div>
            </button>
            <button className="w-full p-4 text-left border rounded-lg hover:bg-accent transition-colors">
              <div className="font-medium">Manage Churches</div>
              <div className="text-sm text-muted-foreground">
                Add or update church information
              </div>
            </button>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest uploads and changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    CSV Upload
                  </p>
                  <p className="text-sm text-muted-foreground">
                    January data processed
                  </p>
                </div>
                <div className="ml-auto font-medium text-sm text-muted-foreground">
                  2 hours ago
                </div>
              </div>
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Report Generated
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Monthly summary for December
                  </p>
                </div>
                <div className="ml-auto font-medium text-sm text-muted-foreground">
                  5 hours ago
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
