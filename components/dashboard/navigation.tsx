"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

export type DashboardNavItem = {
  label: string
  href: string
  description?: string
}

export type DashboardNavSection = {
  label: string
  items: DashboardNavItem[]
}

interface DashboardNavigationProps {
  sections: DashboardNavSection[]
  user: {
    name?: string | null
    role: string
  }
  signOutAction: () => Promise<void>
  children: ReactNode
}

export function DashboardNavigation({
  sections,
  user,
  signOutAction,
  children,
}: DashboardNavigationProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const roleLabel = user.role.replace(/_/g, " ")

  const navContent = (onNavigate?: () => void) => (
    <nav className="space-y-8">
      {sections.map((section) => (
        <div key={section.label}>
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {section.label}
          </p>
          <div className="mt-3 space-y-1">
            {section.items.map((item) => {
              const isActive = (() => {
                // Exact match
                if (pathname === item.href) return true

                // For nested routes, only highlight if it's a direct child
                if (pathname.startsWith(`${item.href}/`)) {
                  // Don't highlight parent if we're on a deeper nested route
                  const pathnameParts = pathname.split('/').filter(Boolean)
                  const hrefParts = item.href.split('/').filter(Boolean)
                  return pathnameParts.length === hrefParts.length + 1
                }

                return false
              })()

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate()
                    }
                  }}
                  className={cn(
                    "group flex flex-col gap-0.5 rounded-xl px-3 py-2 transition-all",
                    "hover:bg-slate-800/60",
                    isActive
                      ? "bg-blue-600/60 text-white shadow-inner outline outline-1 outline-blue-500/50"
                      : "text-slate-300 hover:text-slate-100"
                  )}
                >
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.description && (
                    <span className="text-xs text-slate-400 group-hover:text-slate-300">
                      {item.description}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-blue-950/40 lg:bg-blue-950 lg:px-4 lg:py-6 lg:shadow-xl lg:shadow-blue-900/30">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-2xl bg-blue-900/70 px-4 py-3 text-left font-semibold text-white shadow-lg shadow-blue-900/40"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/20 text-2xl">
            NR
          </span>
          <span className="leading-tight">
            Nexus
            <span className="block text-sm font-normal text-emerald-100/80">ReportHub</span>
          </span>
        </Link>
        <div className="mt-10 flex-1 overflow-y-auto pr-1">{navContent()}</div>
        <div className="mt-6 rounded-2xl border border-blue-800/60 bg-blue-900/80 p-4">
          <div className="text-sm text-blue-100">
            <p className="font-semibold text-white">{user.name ?? "Team Member"}</p>
            <p className="capitalize text-blue-100/70">{roleLabel}</p>
          </div>
          <form action={signOutAction} className="mt-4">
            <button
              type="submit"
              className="w-full rounded-xl bg-blue-800 px-4 py-2 text-sm font-medium text-blue-50 transition hover:bg-blue-700"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col bg-slate-100/95 text-slate-900">
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-10">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-slate-600 shadow-sm transition hover:bg-slate-50 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <div className="flex flex-1 items-center justify-between gap-4">
              <div className="hidden flex-col lg:flex">
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  Welcome back
                </span>
                <span className="text-base font-semibold text-slate-800">
                  {user.name ?? "Team Member"}
                </span>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <div className="rounded-2xl bg-slate-900/90 px-4 py-2 text-xs font-medium text-slate-100">
                  {roleLabel}
                </div>
                <form action={signOutAction} className="hidden sm:block">
                  <button
                    type="submit"
                    className="rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10">
          <div className="mx-auto w-full max-w-6xl space-y-8">{children}</div>
        </main>
      </div>

      {mobileOpen && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-blue-900/60 bg-blue-950/95 px-4 py-6">
            <div className="flex items-center justify-between">
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-2xl bg-blue-900/70 px-4 py-2 text-left text-sm font-semibold text-white"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/20 text-lg">
                  NR
                </span>
                <span className="leading-tight">
                  Nexus
                  <span className="block text-xs font-normal text-emerald-100/80">
                    ReportHub
                  </span>
                </span>
              </Link>
              <button
                type="button"
                className="rounded-xl border border-blue-900/60 bg-blue-900/80 p-2 text-blue-100 transition hover:bg-blue-800"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <div className="mt-8 flex-1 overflow-y-auto pr-1">
              {navContent(() => setMobileOpen(false))}
            </div>
            <div className="mt-6 rounded-2xl border border-blue-900/60 bg-blue-900/85 p-4">
              <div className="text-sm text-blue-100">
                <p className="font-semibold text-white">
                  {user.name ?? "Team Member"}
                </p>
                <p className="capitalize text-blue-100/70">{roleLabel}</p>
              </div>
              <form action={signOutAction} className="mt-4">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-800 px-4 py-2 text-sm font-medium text-blue-50 transition hover:bg-blue-700"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
