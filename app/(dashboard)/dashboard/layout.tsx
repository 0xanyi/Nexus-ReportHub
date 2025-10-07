import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"

import {
  DashboardNavigation,
  type DashboardNavSection,
} from "@/components/dashboard/navigation"

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

  const navSections: DashboardNavSection[] = [
    {
      label: "Overview",
      items: [
        {
          label: "Dashboard",
          href: "/dashboard",
          description: "Executive snapshot of performance",
        },
        {
          label: "Analytics",
          href: "/dashboard/analytics",
          description: "Trend visualisations and insights",
        },
        {
          label: "Reports",
          href: "/dashboard/reports",
          description: "Detailed financial statements",
        },
      ],
    },
    {
      label: "Organization",
      items: [
        {
          label: "Churches",
          href: "/dashboard/churches",
          description: "All congregations and their health",
        },
        {
          label: "Campaigns",
          href: "/dashboard/campaigns",
          description: "Track fundraising initiatives",
        },
        ...(isAdmin
          ? [
              {
                label: "Products",
                href: "/dashboard/products",
                description: "Manage available products and pricing",
              },
            ]
          : []),
        ...(isAdmin
          ? [
              {
                label: "Groups",
                href: "/dashboard/groups",
                description: "Manage ministry group structure",
              },
              {
                label: "Departments",
                href: "/dashboard/departments",
                description: "Coordinate departmental operations",
              },
            ]
          : []),
        ...(session.user.role === "SUPER_ADMIN"
          ? [
              {
                label: "Zones",
                href: "/dashboard/zones",
                description: "Manage organizational zones",
              },
            ]
          : []),
      ],
    },
    {
      label: "Data Ops",
      items: [
        ...(isAdmin
          ? [
              {
                label: "CSV Uploads",
                href: "/dashboard/upload",
                description: "Import bulk transactions",
              },
              {
                label: "Upload History",
                href: "/dashboard/upload/history",
                description: "Review previous import runs",
              },
            ]
          : []),
      ],
    },
    ...(session.user.role === "SUPER_ADMIN"
      ? [
          {
            label: "Administration",
            items: [
              {
                label: "Users",
                href: "/dashboard/users",
                description: "Control platform access levels",
              },
            ],
          },
        ]
      : []),
  ].filter((section) => section.items.length > 0)

  const handleSignOut = async () => {
    "use server"
    await signOut({ redirectTo: "/login" })
  }

  return (
    <DashboardNavigation sections={navSections} user={session.user} signOutAction={handleSignOut}>
      {children}
    </DashboardNavigation>
  )
}
