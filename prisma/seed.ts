import { PrismaClient, UserRole } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create UK Zone 1
  const ukZone1 = await prisma.zone.upsert({
    where: { name: "UK ZONE 1" },
    update: {},
    create: {
      name: "UK ZONE 1",
      currency: "GBP",
    },
  })

  console.log("✓ Created Zone: UK ZONE 1")

  // Create sample groups
  const groups = [
    { name: "London West", zoneId: ukZone1.id },
    { name: "London East", zoneId: ukZone1.id },
    { name: "Midlands", zoneId: ukZone1.id },
    { name: "Scotland", zoneId: ukZone1.id },
  ]

  const createdGroups = []
  for (const group of groups) {
    const g = await prisma.group.upsert({
      where: { zoneId_name: { zoneId: group.zoneId, name: group.name } },
      update: {},
      create: group,
    })
    createdGroups.push(g)
    console.log(`✓ Created Group: ${g.name}`)
  }

  // Create sample churches from the Excel file
  const churches = [
    { name: "LW NORTHWEST LONDON", groupId: createdGroups[0].id },
    { name: "LW THAMESMEAD", groupId: createdGroups[0].id },
    { name: "LW BIRMINGHAM", groupId: createdGroups[2].id },
    { name: "LW ABERDEEN", groupId: createdGroups[3].id },
    { name: "LW BARNSLEY", groupId: createdGroups[2].id },
    { name: "LW BATHGATE", groupId: createdGroups[3].id },
    { name: "LW BELVEDERE", groupId: createdGroups[1].id },
    { name: "LW BEXLEYHEATH OUTREACH", groupId: createdGroups[1].id },
    { name: "LW BIRKENHEAD", groupId: createdGroups[2].id },
    { name: "LW BIRMINGHAM CENTRAL", groupId: createdGroups[2].id },
    { name: "LW BOREHAMWOOD", groupId: createdGroups[0].id },
    { name: "LW BRADFORD CITY", groupId: createdGroups[2].id },
    { name: "LW BRADFORD", groupId: createdGroups[2].id },
    { name: "LW BRIDGEND", groupId: createdGroups[2].id },
    { name: "LW CARDIFF", groupId: createdGroups[2].id },
    { name: "LW CHESTER", groupId: createdGroups[2].id },
    { name: "LW DERBY", groupId: createdGroups[2].id },
    { name: "LW DARLINGTON", groupId: createdGroups[2].id },
    { name: "LW DONCASTER", groupId: createdGroups[2].id },
    { name: "LW DRUMCHAPEL", groupId: createdGroups[3].id },
    { name: "LW DUNDEE", groupId: createdGroups[3].id },
    { name: "LW EDINBURGH", groupId: createdGroups[3].id },
    { name: "LW JERSEY", groupId: createdGroups[0].id },
    { name: "LW GATESHEAD", groupId: createdGroups[2].id },
    { name: "LW GLASGOW", groupId: createdGroups[3].id },
    { name: "LW GLASGOW CENTRAL", groupId: createdGroups[3].id },
    { name: "LW HINCKLEY", groupId: createdGroups[2].id },
  ]

  for (const church of churches) {
    await prisma.church.upsert({
      where: { groupId_name: { groupId: church.groupId, name: church.name } },
      update: {},
      create: church,
    })
    console.log(`✓ Created Church: ${church.name}`)
  }

  // Create Rhapsody Department
  const rhapsodyDept = await prisma.department.upsert({
    where: { name: "UK ZONE 1 DSP" },
    update: {},
    create: {
      name: "UK ZONE 1 DSP",
      description: "Rhapsody of Realities Distribution",
    },
  })

  console.log("✓ Created Department: UK ZONE 1 DSP")

  // Create Product Types
  const productTypes = [
    { name: "ROR English Quantity", unitPrice: 2.5, departmentId: rhapsodyDept.id },
    { name: "Teevo", unitPrice: 1.5, departmentId: rhapsodyDept.id },
    { name: "Early Reader", unitPrice: 1.0, departmentId: rhapsodyDept.id },
    { name: "KROR", unitPrice: 1.0, departmentId: rhapsodyDept.id },
    { name: "French", unitPrice: 2.5, departmentId: rhapsodyDept.id },
    { name: "Polish", unitPrice: 2.5, departmentId: rhapsodyDept.id },
  ]

  for (const product of productTypes) {
    await prisma.productType.upsert({
      where: { departmentId_name: { departmentId: product.departmentId, name: product.name } },
      update: {},
      create: product,
    })
    console.log(`✓ Created Product Type: ${product.name}`)
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash("Admin123!", 10)
  
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@nexusreporthub.com" },
    update: {},
    create: {
      email: "admin@nexusreporthub.com",
      name: "System Administrator",
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      departmentId: rhapsodyDept.id,
      emailVerified: new Date(),
    },
  })

  console.log("✓ Created Admin User")
  console.log("  Email: admin@nexusreporthub.com")
  console.log("  Password: Admin123!")

  // Create zone admin
  const zoneAdmin = await prisma.user.upsert({
    where: { email: "zone@nexusreporthub.com" },
    update: {},
    create: {
      email: "zone@nexusreporthub.com",
      name: "Zone Administrator",
      password: hashedPassword,
      role: UserRole.ZONE_ADMIN,
      departmentId: rhapsodyDept.id,
      zoneId: ukZone1.id,
      emailVerified: new Date(),
    },
  })

  console.log("✓ Created Zone Admin User")
  console.log("  Email: zone@nexusreporthub.com")
  console.log("  Password: Admin123!")

  console.log("\n🎉 Seeding completed successfully!")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error("❌ Error seeding database:", e)
    await prisma.$disconnect()
    process.exit(1)
  })
