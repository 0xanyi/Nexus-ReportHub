import "dotenv/config"
import { defineConfig } from "prisma/config"

// `prisma generate` / postinstall must work before .env exists.
// Migrate, db push, and seed still need a real DATABASE_URL to connect.
const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://localhost:5432/nexus_reporthub"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: DATABASE_URL,
  },
})
