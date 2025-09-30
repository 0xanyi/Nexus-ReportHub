# Nexus ReportHub

A comprehensive church financial and inventory management system for Rhapsody of Reality distribution tracking across hierarchical church structures (Zone → Group → Church).

## Features

- 🔐 **Secure Authentication** - NextAuth.js v5 with role-based access control
- 📊 **Hierarchical Structure** - Zone → Group → Church organization
- 📤 **CSV Upload & Processing** - Bulk import of transactions and payments
- 📈 **Advanced Reporting** - Monthly/annual summaries, balance calculations
- 💰 **Multi-Currency Support** - GBP, USD, EUR, NGN, and Espees
- ☁️ **Cloud Storage** - Cloudflare R2 integration for file management
- 🔒 **Row-Level Security** - Users only see data relevant to their role
- 🎨 **Modern UI** - Built with Next.js 15, React 19, and Tailwind CSS

## Tech Stack

- **Framework**: Next.js 15.5.3 (App Router) with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Storage**: Cloudflare R2
- **UI**: Tailwind CSS + shadcn/ui components
- **Hosting**: Vercel

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Cloudflare R2 account (optional for development)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/0xanyi/Nexus-ReportHub.git
cd Nexus-ReportHub
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/nexus_reporthub?schema=public"

# NextAuth.js (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Cloudflare R2 (optional for development)
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET_NAME="nexus-reporthub"
R2_PUBLIC_URL="https://your-bucket.r2.cloudflarestorage.com"

# App Configuration
NEXT_PUBLIC_APP_NAME="Nexus ReportHub"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Initialize the database

```bash
# Push the schema to your database
npm run db:push

# Seed initial data (creates admin user, zones, groups, churches)
npm run db:seed
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Login with default credentials

After seeding, you can login with:

- **Super Admin**
  - Email: `admin@nexusreporthub.com`
  - Password: `Admin123!`

- **Zone Admin**
  - Email: `zone@nexusreporthub.com`
  - Password: `Admin123!`

## User Roles

- **SUPER_ADMIN** - Full system access, manage all zones
- **ZONE_ADMIN** - Manage specific zone and all groups/churches within
- **GROUP_ADMIN** - Manage specific group and churches within
- **CHURCH_USER** - View own church data only (read-only)

## Project Structure

```
├── app/
│   ├── (auth)/              # Authentication pages (login, register)
│   ├── (dashboard)/         # Protected dashboard pages
│   ├── api/                 # API routes
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/
│   └── ui/                  # Reusable UI components
├── lib/
│   ├── prisma.ts            # Prisma client
│   ├── r2.ts                # Cloudflare R2 utilities
│   └── utils.ts             # Helper functions
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Seed script
├── auth.config.ts           # NextAuth configuration
├── auth.ts                  # NextAuth instance
└── middleware.ts            # Route protection

```

## Database Schema

The system uses a hierarchical structure:

- **Zone** → Multiple Groups
- **Group** → Multiple Churches  
- **Church** → Transactions & Payments
- **Department** → Product Types
- **Transaction** → Line Items (product quantities)
- **Payment** → Financial records

## CSV Upload Format

The system accepts CSV files with the following format:

```csv
Church Name,Date,Product Type,Quantity,Unit Price,Payment Amount,Payment Method
LW BIRMINGHAM,2024-01-15,ROR English,2500,2.50,6250.00,BANK_TRANSFER
```

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema changes to database
npm run db:migrate   # Create migration
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database with initial data
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables
4. Deploy!

Vercel will automatically:
- Install dependencies
- Run Prisma generate
- Build the Next.js app
- Deploy to production

## Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT-based session management
- ✅ Role-based access control (RBAC)
- ✅ Row-level security in database queries
- ✅ Input validation with Zod
- ✅ HTTPS/TLS encryption in transit
- ✅ Database encryption at rest
- ✅ Audit logging for all uploads

## Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Real-time notifications
- [ ] Advanced analytics & forecasting
- [ ] Automated payment reconciliation
- [ ] Multi-department expansion
- [ ] Bulk SMS/Email to churches
- [ ] Export reports as PDF/Excel
- [ ] API for third-party integrations

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

ISC

## Support

For support, email admin@nexusreporthub.com or open an issue on GitHub.