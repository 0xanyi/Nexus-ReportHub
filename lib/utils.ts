import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string, currency: string = "GBP"): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount
  
  const currencySymbols: Record<string, string> = {
    GBP: "£",
    USD: "$",
    EUR: "€",
    NGN: "₦",
    ESPEES: "Ɛ",
  }

  const symbol = currencySymbols[currency] || currency
  return `${symbol}${numAmount.toFixed(2)}`
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
