 import { describe, it, expect } from "vitest"
 import {
   getFinancialYearBounds,
   getNextFinancialYearBounds,
   getResetConfirmationText,
   isValidFYLabel,
 } from "../financialYear"
 
 describe("financialYear utilities", () => {
   describe("getFinancialYearBounds", () => {
     it("should return correct bounds for Dec 1 (start of FY)", () => {
       const dec1 = new Date(Date.UTC(2024, 11, 1))
       const bounds = getFinancialYearBounds(dec1)
       
       expect(bounds.label).toBe("FY2025")
       expect(bounds.startDate.getUTCFullYear()).toBe(2024)
       expect(bounds.startDate.getUTCMonth()).toBe(11) // December
       expect(bounds.startDate.getUTCDate()).toBe(1)
       expect(bounds.endDate.getUTCFullYear()).toBe(2025)
       expect(bounds.endDate.getUTCMonth()).toBe(10) // November
       expect(bounds.endDate.getUTCDate()).toBe(30)
     })
     
     it("should return correct bounds for Nov 30 (end of FY)", () => {
       const nov30 = new Date(Date.UTC(2025, 10, 30))
       const bounds = getFinancialYearBounds(nov30)
       
       expect(bounds.label).toBe("FY2025")
       expect(bounds.startDate.getUTCFullYear()).toBe(2024)
       expect(bounds.startDate.getUTCMonth()).toBe(11)
       expect(bounds.endDate.getUTCFullYear()).toBe(2025)
       expect(bounds.endDate.getUTCMonth()).toBe(10)
       expect(bounds.endDate.getUTCDate()).toBe(30)
     })
     
     it("should return correct bounds for dates within FY (e.g., June)", () => {
       const june = new Date(Date.UTC(2025, 5, 15))
       const bounds = getFinancialYearBounds(june)
       
       expect(bounds.label).toBe("FY2025")
       expect(bounds.startDate.getUTCMonth()).toBe(11)
       expect(bounds.startDate.getUTCFullYear()).toBe(2024)
       expect(bounds.endDate.getUTCMonth()).toBe(10)
       expect(bounds.endDate.getUTCFullYear()).toBe(2025)
     })
     
     it("should have correct time boundaries (UTC)", () => {
       const date = new Date(Date.UTC(2024, 11, 1))
       const bounds = getFinancialYearBounds(date)
       
       // Start date should be 00:00:00.000 UTC
       expect(bounds.startDate.getUTCHours()).toBe(0)
       expect(bounds.startDate.getUTCMinutes()).toBe(0)
       expect(bounds.startDate.getUTCSeconds()).toBe(0)
       expect(bounds.startDate.getUTCMilliseconds()).toBe(0)
       
       // End date should be 23:59:59.999 UTC
       expect(bounds.endDate.getUTCHours()).toBe(23)
       expect(bounds.endDate.getUTCMinutes()).toBe(59)
       expect(bounds.endDate.getUTCSeconds()).toBe(59)
       expect(bounds.endDate.getUTCMilliseconds()).toBe(999)
     })
   })
   
   describe("getNextFinancialYearBounds", () => {
     it("should return next FY bounds from current FY", () => {
       const currentBounds = getFinancialYearBounds(new Date(Date.UTC(2024, 11, 1)))
       const nextBounds = getNextFinancialYearBounds(currentBounds)
       
       expect(nextBounds.label).toBe("FY2026")
       expect(nextBounds.startDate.getUTCFullYear()).toBe(2025)
       expect(nextBounds.startDate.getUTCMonth()).toBe(11)
       expect(nextBounds.endDate.getUTCFullYear()).toBe(2026)
       expect(nextBounds.endDate.getUTCMonth()).toBe(10)
     })
   })
   
   describe("getResetConfirmationText", () => {
     it("should return formatted reset text", () => {
       expect(getResetConfirmationText("FY2025")).toBe("RESET FY2025")
       expect(getResetConfirmationText("FY2024")).toBe("RESET FY2024")
     })
   })
   
   describe("isValidFYLabel", () => {
     it("should validate correct FY label format", () => {
       expect(isValidFYLabel("FY2025")).toBe(true)
       expect(isValidFYLabel("FY2024")).toBe(true)
       expect(isValidFYLabel("FY2000")).toBe(true)
     })
     
     it("should reject invalid FY label formats", () => {
       expect(isValidFYLabel("fy2025")).toBe(false) // lowercase
       expect(isValidFYLabel("FY-2025")).toBe(false) // with dash
       expect(isValidFYLabel("2025")).toBe(false) // no FY prefix
       expect(isValidFYLabel("FY 2025")).toBe(false) // with space
       expect(isValidFYLabel("FY202")).toBe(false) // too short
       expect(isValidFYLabel("")).toBe(false) // empty
     })
   })
 })
