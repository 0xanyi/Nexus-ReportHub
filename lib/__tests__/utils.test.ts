 import { describe, it, expect } from "vitest"
 import { formatCurrency, formatDate, cn } from "../utils"
 
 describe("formatCurrency", () => {
   describe("with GBP (default)", () => {
     it("should format positive amounts with GBP symbol", () => {
       expect(formatCurrency(100)).toBe("£100.00")
       expect(formatCurrency(1234.56)).toBe("£1234.56")
     })
 
     it("should format zero correctly", () => {
       expect(formatCurrency(0)).toBe("£0.00")
     })
 
     it("should format negative amounts", () => {
       expect(formatCurrency(-50)).toBe("£-50.00")
     })
 
     it("should handle string input", () => {
       expect(formatCurrency("100")).toBe("£100.00")
       expect(formatCurrency("99.99")).toBe("£99.99")
     })
 
     it("should round to 2 decimal places", () => {
       expect(formatCurrency(99.999)).toBe("£100.00")
       expect(formatCurrency(99.994)).toBe("£99.99")
     })
   })
 
   describe("with different currencies", () => {
     it("should format USD", () => {
       expect(formatCurrency(100, "USD")).toBe("$100.00")
     })
 
     it("should format EUR", () => {
       expect(formatCurrency(100, "EUR")).toBe("€100.00")
     })
 
     it("should format NGN", () => {
       expect(formatCurrency(100, "NGN")).toBe("₦100.00")
     })
 
     it("should format ESPEES", () => {
       expect(formatCurrency(100, "ESPEES")).toBe("Ɛ100.00")
     })
 
     it("should use currency code for unknown currencies", () => {
       expect(formatCurrency(100, "XYZ")).toBe("XYZ100.00")
     })
   })
 
   describe("edge cases", () => {
     it("should handle very large numbers", () => {
       expect(formatCurrency(1000000)).toBe("£1000000.00")
     })
 
     it("should handle very small positive numbers", () => {
       expect(formatCurrency(0.01)).toBe("£0.01")
     })
   })
 })
 
 describe("formatDate", () => {
   it("should format Date objects", () => {
     const date = new Date(2025, 0, 15) // Jan 15, 2025
     const result = formatDate(date)
     expect(result).toMatch(/15/)
     expect(result).toMatch(/Jan/)
     expect(result).toMatch(/2025/)
   })
 
   it("should format date strings", () => {
     const result = formatDate("2025-06-15")
     expect(result).toMatch(/15/)
     expect(result).toMatch(/Jun/)
     expect(result).toMatch(/2025/)
   })
 
   it("should handle ISO date strings", () => {
     const result = formatDate("2025-12-25T10:30:00Z")
     expect(result).toMatch(/2025/)
   })
 })
 
 describe("cn (className merge)", () => {
   it("should merge class names", () => {
     expect(cn("foo", "bar")).toBe("foo bar")
   })
 
   it("should handle conditional classes", () => {
     expect(cn("base", true && "active")).toBe("base active")
     expect(cn("base", false && "hidden")).toBe("base")
   })
 
   it("should merge Tailwind classes correctly", () => {
     expect(cn("px-4", "px-2")).toBe("px-2")
     expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500")
   })
 
   it("should handle arrays", () => {
     expect(cn(["foo", "bar"])).toBe("foo bar")
   })
 
   it("should handle objects", () => {
     expect(cn({ foo: true, bar: false })).toBe("foo")
   })
 
   it("should handle empty inputs", () => {
     expect(cn()).toBe("")
     expect(cn("")).toBe("")
   })
 
   it("should handle undefined and null", () => {
     expect(cn("foo", undefined, "bar")).toBe("foo bar")
     expect(cn("foo", null, "bar")).toBe("foo bar")
   })
 })
