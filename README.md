# Nexus ReportHub

A comprehensive church financial and inventory management system for Rhapsody of Reality distribution tracking across hierarchical church structures (Zone → Group → Church).

## Features

### Core Functionality

- 🔐 **Secure Authentication** - NextAuth.js v5 with role-based access control (4 roles)
- 🌍 **Zone Management** - Complete CRUD for organizational zones with currency settings (Super Admin)
- 📊 **Hierarchical Management** - Full CRUD for Zones, Groups, and Churches
- 🏛️ **Church Transfer** - Move churches between groups while preserving history
- 📤 **Bulk Operations** - CSV upload for multiple churches and transactions at once
- 💳 **Campaign Tracking** - Detailed campaign contribution breakdown with date range filters
- 📦 **Automated Products** - Auto-created from CSV uploads, unlimited language editions
- 📥 **CSV Upload & Processing** - Three upload types (Transactions, Orders, Churches) with smart validation
- 🎯 **Campaign Management** - Track fundraising campaigns across zones, groups, and churches
- 📈 **Visual Analytics** - Interactive charts with Recharts (bar, line, pie, radar, area)
- 📊 **Advanced Reporting** - Monthly/annual summaries, balance calculations, campaign tracking
- 📄 **Export Capabilities** - Download reports as PDF or Excel
- 💰 **Multi-Currency Support** - GBP, USD, EUR, NGN, and Espees
- 🔍 **Audit Trails** - Complete upload history and transaction tracking
- 🎨 **Modern UI** - Built with Next.js 15, React 19, shadcn/ui, and Tailwind CSS

### Admin Features

- ✅ **Zone Management** - Create, edit, delete zones with currency settings (Super Admin only)
- ✅ **Campaign Management** - Create manual campaigns, view all campaigns with detailed breakdowns
- ✅ **Bulk Church Upload** - CSV import for creating multiple churches at once
- ✅ **Three CSV Upload Types** - Transactions, Orders, and Churches with separate templates
- ✅ **Dynamic Product Detection** - Automatically detect and create products from order CSVs
- ✅ **Manual Order Management** - Create, edit, and delete orders directly from church pages
- ✅ **Product Management** - Add, edit, and manage products with pricing and department assignment
- ✅ **Department Management** - Full CRUD for organizational departments
- ✅ Create, edit, delete groups and churches
- ✅ Move churches between groups
- ✅ View comprehensive financial reports with YoY comparisons
- ✅ Export church/group reports (PDF/Excel)
- ✅ Track upload history with detailed logs
- ✅ User management with organizational assignments

### User Features

- ✅ View financial dashboards with charts
- ✅ Browse churches and transaction histories
- ✅ View campaigns and contribution breakdowns by zone/group/church
- ✅ **Campaign breakdown by date range** - Filter by All Time, Year, Quarter, or Month
- ✅ Export individual church reports (with "Orders" terminology)
- ✅ Track orders, payments, balances, and campaign contributions
- ✅ View product breakdowns and monthly summaries

## Tech Stack

- **Framework**: Next.js 15.5.4 (App Router) with TypeScript
- **Database**: PostgreSQL with Prisma ORM v6
- **Authentication**: NextAuth.js v5
- **Charts**: Recharts for data visualization
- **CSV Processing**: Papa Parse
- **PDF Export**: jsPDF with autoTable
- **Excel Export**: SheetJS (xlsx)
- **UI**: Tailwind CSS v3 + shadcn/ui + Radix UI components
- **Icons**: Lucide React for modern iconography
- **Storage**: Cloudflare R2 (optional)
- **Hosting**: Vercel-ready

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
│   │   ├── dashboard/       # Main dashboard
│   │   ├── reports/         # Financial reports with charts
│   │   ├── churches/        # Church management with campaign breakdown
│   │   ├── campaigns/       # Campaign management and tracking
│   │   ├── groups/          # Group management (admin only)
│   │   ├── departments/     # Department management (admin only)
│   │   ├── zones/           # Zone management (super admin only)
│   │   └── upload/          # CSV upload system (admin only)
│   ├── api/                 # API routes (RESTful endpoints)
│   │   ├── auth/            # Authentication endpoints
│   │   ├── campaigns/       # Campaign CRUD operations
│   │   ├── churches/        # Church CRUD operations
│   │   ├── departments/     # Department CRUD operations
│   │   ├── groups/          # Group CRUD operations
│   │   ├── transactions/    # Manual order CRUD operations
│   │   ├── upload/          # CSV upload processing
│   │   ├── users/           # User management
│   │   ├── zones/           # Zone CRUD operations
│   │   └── template/        # CSV template download
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/
│   ├── charts/              # Chart components (Recharts)
│   ├── churches/            # Church-specific components
│   │   ├── BulkUpload.tsx   # Bulk church CSV upload
│   │   ├── CampaignBreakdown.tsx  # Campaign contribution filters
│   │   ├── OrderForm.tsx    # Manual order creation/editing dialog
│   │   └── ChurchOrdersManager.tsx # Order management wrapper component
│   ├── ui/                  # shadcn/ui + Radix UI components
│   └── ExportButtons.tsx    # PDF/Excel export buttons
├── lib/
│   ├── prisma.ts            # Prisma client singleton
│   ├── campaigns.ts         # Campaign giving aggregation helpers
│   ├── exports.ts           # PDF/Excel export utilities
│   ├── r2.ts                # Cloudflare R2 utilities
│   └── utils.ts             # Helper functions
├── prisma/
│   ├── schema.prisma        # Database schema (10 models)
│   └── seed.ts              # Database seeding script
├── auth.config.ts           # NextAuth configuration
├── auth.ts                  # NextAuth instance
└── middleware.ts            # Route protection middleware
```

## Database Schema

The system uses a hierarchical structure with 11 models:

- **Zone** → Multiple Groups
- **Group** → Multiple Churches  
- **Church** → Transactions & Payments
- **Department** → Product Types & Campaign Categories
- **Transaction** → Line Items (product quantities)
- **Payment** → Financial records with optional campaign linking
- **CampaignCategory** → Campaign tracking (auto-generated or manual)
- **UploadHistory** → CSV upload audit trail

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

## Deployment to Production

### Prerequisites

1. **Database**: Set up a production PostgreSQL database (e.g., Neon, Supabase, Railway)
2. **Vercel Account**: Create an account at [vercel.com](https://vercel.com)
3. **Environment Variables**: Prepare your production environment variables

### Step 1: Prepare Database

```bash
# Connect to your production database
DATABASE_URL="your-production-database-url"

# Run migrations
npx prisma migrate deploy

# Seed initial data (zones, groups, churches)
npm run db:seed
```

### Step 2: Deploy to Vercel

**Via Vercel Dashboard:**

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your Git repository
4. Add environment variables:
   - `DATABASE_URL` - Your production database URL
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` - Your production URL (e.g., `https://nexus-reporthub.vercel.app`)
   - `NEXT_PUBLIC_APP_NAME` - "Nexus ReportHub"
   - `NEXT_PUBLIC_APP_URL` - Your production URL
5. Click **Deploy**

**Via Vercel CLI:**

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Add environment variables
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
```

### Step 3: Post-Deployment

1. **Verify Deployment**: Visit your production URL and test login
2. **Create Admin Users**: Use the seeded admin account or create new users
3. **Configure Monitoring**: Set up error tracking (optional, Sentry recommended)
4. **Enable Analytics**: Configure Vercel Analytics (optional)
5. **Custom Domain**: Add your custom domain in Vercel settings (optional)

### Step 4: Database Migrations

For future schema changes:

```bash
# Create a migration
npm run db:migrate

# Deploy migration to production
npx prisma migrate deploy
```

### Troubleshooting

- **Build fails**: Check Node.js version (18+ required)
- **Database connection errors**: Verify `DATABASE_URL` format and credentials
- **Authentication issues**: Ensure `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are set correctly
- **Missing tables**: Run `npx prisma migrate deploy` to apply migrations

## Recent Updates

### Version 2.5.0 (January 2026)

**Product Management System**
- ✅ **Product Creation**: Add new products manually with department assignment
- ✅ **Product Editing**: Update product names, prices, and department assignments
- ✅ **Product Deletion**: Remove products with protection for products in use
- ✅ **Pricing Management**: Set and update product prices with currency support
- ✅ **Department Organization**: Products organized by department with uniqueness constraints
- ✅ **Usage Tracking**: Display order count for each product
- ✅ **Admin-only Access**: Only SUPER_ADMIN and ZONE_ADMIN can manage products
- ✅ **Form Validation**: Client and server-side validation with error handling
- ✅ **Responsive UI**: Card-based layout with edit/delete actions
- ✅ **API Endpoints**: Full REST API for product operations (`/api/products`, `/api/products/[id]`)
- ✅ **Navigation Integration**: Products link added to admin sidebar

## Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Real-time notifications (Pusher/WebSockets)
- [ ] Advanced analytics & forecasting
- [ ] Automated payment reconciliation
- [ ] Multi-department expansion
- [ ] Bulk SMS/Email to churches
- [ ] API for third-party integrations
- [ ] Two-factor authentication (2FA)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

ISC

## Support

For support, email admin@nexusreporthub.com or open an issue on GitHub.