# Nexus ReportHub

A comprehensive church financial and inventory management system for Rhapsody of Reality distribution tracking across hierarchical church structures (Zone → Group → Church). Built with Next.js 15, React 19, TypeScript, Prisma, and PostgreSQL.

## Core Commands

• **Development**: `npm run dev` - Start Next.js dev server on http://localhost:3000
• **Build**: `npm run build` - Type-check, generate Prisma client, and build for production
• **Production**: `npm run start` - Start production server (requires build first)
• **Lint**: `npm run lint` - Run ESLint on all TypeScript files
• **Database Push**: `npm run db:push` - Push Prisma schema changes to database
• **Database Migration**: `npm run db:migrate` - Create and apply migration
• **Database Studio**: `npm run db:studio` - Open Prisma Studio at http://localhost:5555
• **Seed Database**: `npm run db:seed` - Populate database with initial data (UK Zone 1, churches, products, admin users)

All other scripts wrap these core tasks.

## Project Layout

```
├─ app/                      → Next.js App Router pages and API routes
│  ├─ (auth)/               → Public authentication pages (login, register)
│  ├─ (dashboard)/          → Protected dashboard pages (require authentication)
│  ├─ api/                  → API routes and server actions
│  ├─ globals.css           → Global styles and Tailwind directives
│  ├─ layout.tsx            → Root layout with fonts and providers
│  └─ page.tsx              → Landing page
├─ components/              → React components
│  ├─ analytics/            → Analytics components
│  │  ├─ AnalyticsCharts.tsx → 6 interactive chart types (area, line, bar, radar, etc.)
│  │  ├─ TrendAnalysis.tsx  → Performance categorization (top/low/inactive)
│  │  └─ CampaignGivingOverview.tsx → Campaign contribution breakdown by zone/group/church
│  ├─ charts/               → Chart components (Recharts integration)
│  │  └─ FinancialCharts.tsx → Financial charts (bar, line, pie)
│  ├─ churches/             → Church-specific components
│  │  └─ BulkUpload.tsx     → Bulk church CSV upload modal
│  ├─ users/                → User management components
│  │  └─ UserList.tsx       → User table with search, filter, delete
│  ├─ ui/                   → Reusable UI components (Button, Input, Card, Dialog, etc.)
│  ├─ ChurchListView.tsx    → Enhanced church list with grid/table views
│  ├─ TransactionHistory.tsx → Paginated transaction history
│  ├─ PaymentHistory.tsx    → Paginated payment history
│  └─ ExportButtons.tsx     → PDF/Excel export functionality
├─ lib/                     → Shared utilities and configurations
│  ├─ prisma.ts             → Prisma client singleton
│  ├─ r2.ts                 → Cloudflare R2 storage utilities
│  ├─ exports.ts            → PDF and Excel export utilities (jsPDF, xlsx)
│  ├─ utils.ts              → Helper functions (cn, formatCurrency, formatDate)
│  └─ campaigns.ts          → Campaign giving aggregation helpers
├─ prisma/                  → Database schema and migrations
│  ├─ schema.prisma         → Prisma schema (9 models, enums, indexes)
│  └─ seed.ts               → Database seeding script
├─ types/                   → TypeScript type definitions
│  └─ next-auth.d.ts        → NextAuth session and user type extensions
├─ auth.config.ts           → NextAuth configuration (providers, callbacks)
├─ auth.ts                  → NextAuth instance export
├─ middleware.ts            → Route protection middleware
├─ next.config.js           → Next.js configuration
├─ tailwind.config.ts       → Tailwind CSS configuration
└─ tsconfig.json            → TypeScript configuration (strict mode)
```

• **Frontend code** lives in `app/`, `components/`
• **API/Backend logic** lives in `app/api/` and Server Actions
• **Database schema** lives **only** in `prisma/schema.prisma`
• **Shared utilities** belong in `lib/`
• **Type definitions** go in `types/` or co-located with components

## Development Patterns & Constraints

### Coding Style

• **TypeScript**: Strict mode enabled, no `any` types without justification
• **Line length**: 100-character limit for code readability
• **Formatting**: Use Prettier defaults (2-space indent, semicolons, double quotes for JSX)
• **Imports**: Use `@/` path alias for absolute imports from project root
• **Components**: Prefer Server Components by default; use `"use client"` only when necessary
• **Error handling**: Always include try-catch blocks in Server Actions and API routes
• **Security**: Never expose sensitive data (passwords, secrets, API keys) in client components or logs

### Database Patterns

• **Schema changes**: Always create migrations via `npm run db:migrate` before pushing to production
• **Queries**: Use Prisma Client for all database operations (no raw SQL without review)
• **Relations**: Always include proper indexes for foreign keys (see schema.prisma)
• **Transactions**: Use Prisma `$transaction` for operations that must succeed/fail together
• **Soft deletes**: Use `deletedAt` field pattern if implementing (not currently in schema)

### Authentication & Authorization

• **Session management**: NextAuth.js v5 with JWT strategy
• **Role-based access**: Four roles defined in enum: `SUPER_ADMIN`, `ZONE_ADMIN`, `GROUP_ADMIN`, `CHURCH_USER`
• **Route protection**: All `/dashboard/*` routes require authentication (enforced by middleware.ts)
• **Permission checks**: Always verify user role in Server Actions before mutating data
• **Password requirements**: Minimum 12 characters, hashed with bcrypt (10 rounds)

### UI/UX Patterns

• **Component library**: Use shadcn/ui components from `components/ui/` for consistency
• **Styling**: Tailwind CSS utility classes; use `cn()` helper for conditional classes
• **Forms**: React Hook Form + Zod for validation
• **Loading states**: Show spinners/disabled states during async operations
• **Error messages**: Display user-friendly error messages (no stack traces to users)
• **Accessibility**: All interactive elements must be keyboard accessible

### File Upload & Storage

• **CSV uploads**: Use Papa Parse for parsing, validate data before import
• **Cloud storage**: Cloudflare R2 via `lib/r2.ts` utilities
• **File validation**: Check file size (max 10MB), file type (CSV only), and content structure
• **Presigned URLs**: Use 1-hour expiry for upload/download URLs
• **Cleanup**: Auto-delete uploaded CSVs after 90 days (implement lifecycle policy)

## Git Workflow Essentials

1. **Branch naming**: 
   - Features: `feature/<description>` (e.g., `feature/csv-upload-ui`)
   - Bug fixes: `bugfix/<description>` (e.g., `bugfix/login-redirect`)
   - Hotfixes: `hotfix/<description>` (e.g., `hotfix/payment-calculation`)

2. **Before committing**:
   ```bash
   npm run lint           # Fix linting errors
   npm run build          # Ensure build succeeds
   npm run db:push        # If schema changed
   ```

3. **Commit messages**: Follow conventional commits
   - `feat: add CSV upload validation`
   - `fix: correct balance calculation logic`
   - `docs: update README with R2 setup`
   - `test: add unit tests for currency formatting`
   - `refactor: extract report generation to service`
   - `chore: update dependencies`

4. **Co-authorship**: All commits should include Droid as co-author:
   ```
   feat: implement monthly report generation
   
   Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
   ```

5. **Force pushes**: Allowed **only** on feature branches using `git push --force-with-lease`. **Never** force-push `main`.

6. **Pull requests**: Must target `main` branch (default branch)

## Evidence Required for Every PR

A pull request is reviewable when it includes:

### Code Quality
- ✅ Lint passes: `npm run lint` with no errors
- ✅ Type-check passes: `npm run build` succeeds
- ✅ No console.log statements (use proper logging in production)
- ✅ No commented-out code blocks
- ✅ No `@ts-ignore` or `any` types without justification in PR description

### Database Changes
- ✅ Migration file included if schema changed
- ✅ Seed script updated if new models added
- ✅ No breaking changes to existing data (provide migration strategy)

### Security Review
- ✅ No sensitive data exposed in client components
- ✅ All user inputs validated (Zod schemas for forms)
- ✅ Role-based authorization checks in place for protected operations
- ✅ No SQL injection vulnerabilities (use Prisma, no raw queries)

### Proof Artifacts (choose relevant ones)
- **Bug fix** → Failing test added first, now passes (or detailed reproduction steps if no tests)
- **New feature** → Screenshots/video demonstrating functionality
- **UI change** → Before/after screenshots
- **API change** → Example request/response in PR description
- **Performance** → Benchmark comparison if claiming speed improvements

### Documentation
- ✅ README.md updated if public API changed
- ✅ SETUP.md updated if deployment steps changed
- ✅ Code comments for complex business logic
- ✅ One-paragraph PR description covering:
  - **What** changed (high-level summary)
  - **Why** it was needed (problem being solved)
  - **How** it works (approach taken)
  - **Testing** done (manual testing steps or automated tests added)

### File Constraints
- ✅ Changes confined to appropriate directories:
  - UI changes → `app/`, `components/`
  - API changes → `app/api/`
  - Database → `prisma/schema.prisma`
  - Utils → `lib/`
- ✅ No changes to auto-generated files (`node_modules/`, `.next/`, `@prisma/client/`)
- ✅ No environment variable changes without updating `.env.example`

## Application Features

### Core Functionality

1. **Authentication & Authorization**
   - Login with email and password
   - **Public registration disabled** - users must be created by administrators
   - Role-based access control (SUPER_ADMIN, ZONE_ADMIN, GROUP_ADMIN, CHURCH_USER)
   - Secure session management with NextAuth.js v5

2. **Church Hierarchy Management**
   - **Zones** (Super Admin Only):
     - Full CRUD operations for organizational zones
     - Set default currency per zone (GBP, USD, EUR, NGN)
     - View zone statistics (groups, churches)
     - Delete protection for zones with existing groups
     - Navigation link in admin sidebar
   - **Groups** (Admin Only):
     - Create, edit, delete ministry groups within zones
     - Assign groups to zones
   - **Churches**:
     - Individual church creation and editing
     - **Bulk Church Upload**: CSV import for multiple churches at once
     - Move churches between groups
     - View financial summaries and transaction history
   - **Departments** (Admin Only):
     - Manage organizational departments with products, users, and transactions
     - Full CRUD operations with statistics dashboard
   - Church transfer functionality maintains all transaction history
   - Prevent deletion of groups/churches/departments/zones with dependencies

3. **Automated Product Management**
   - Products are automatically created during CSV order uploads
   - Support for unlimited language editions (ROR English, French, Polish, German, Spanish, Arabic, etc.)
   - Default pricing: £3 per copy (GBP)
   - Products persist in database for historical tracking and reporting
   - No manual product management UI needed

4. **CSV Upload System** (Admin Only)
   - **Three Upload Types**:
     - **Transaction Upload**: Bank transactions with campaign tracking
     - **Order Upload**: Monthly product orders with dynamic column detection
     - **Bulk Church Upload**: Create multiple churches at once
   - Drag-and-drop file upload interface with selectable modes
   - Automatic parsing with Papa Parse, including Excel serial date handling
   - Smart validation (church names, categories, dates, quantities, payment amounts)
   - **Dynamic Order Parsing**: Automatically detects all product columns (not hardcoded)
   - Order uploads generate £3-per-copy product line items; transaction uploads create payments
   - **Auto-Product Creation**: Products are created on-the-fly if they don't exist
   - Non-print transaction types seen 3+ times auto-create campaign categories and link payments
   - Upload history tracking with success/partial/failed status and processed summaries
   - **Separate Template Downloads**: Each upload type has its own correctly-formatted template
   - Supports variable product sets across different months and churches
   - **Flexible Department Lookup**: Uses first available department if user has no assignment

5. **Financial Reports**
   - **Dashboard Overview**: Summary cards with key metrics
   - **Visual Charts**: Monthly trends, product distribution, top churches (Recharts)
   - **Church Financial Summary**: Complete table with purchases, payments, balances
   - **Recent Transactions**: Latest activity feed
   - Color-coded balance indicators (red for debt, green for credit)
   - **Campaign Giving Overview**: Zone/group/church totals for active campaign categories

6. **Advanced Analytics Dashboard** (All Users)
   - **Year-over-Year Comparisons**: Current vs previous year with growth %
   - **6 Interactive Chart Types**:
     - Area Chart: YoY purchase comparison with gradient fills
     - Line Chart: Monthly collection rate trends (0-100%)
     - Horizontal Bar: Group performance by collection rate
     - Dual Line: Purchases vs payments comparison
     - Radar Chart: Multi-dimensional group comparison
     - Grouped Bar: Group financial summary side-by-side
   - **Trend Analysis** with 3 Performance Categories:
     - Top Performers (highest collection rates)
     - Low Performers (<50% collection rate)
     - Inactive Churches (no transaction history)
   - **Performance Badges**: Excellent (≥90%), Good (70-89%), Fair (50-69%), Needs Attention (<50%)
   - **Actionable Insights**: Specific recommendations for each category

7. **User Management System** (Super Admin Only)
   - **User List Page**:
     - Role statistics dashboard (5 cards)
     - Real-time search by name/email
     - Filter by role (Super Admin, Zone Admin, Group Admin, Church User)
     - Color-coded role badges (purple, blue, green, gray)
     - Display organizational assignments
     - Inline delete with confirmation
     - Self-deletion prevention
   - **Create User Form**:
     - Basic info (name, email, password with confirmation)
     - Password strength validation (min 12 characters)
     - Role selection with descriptions
     - Organizational assignments (zone, group, church, department)
     - Form validation and error handling
     - **Only method to create users** (public registration disabled)
   - **Edit User Form**:
     - Update name and role
     - Optional password change
     - Update organizational assignments
     - Pre-filled with current data

8. **Department Management System** (Admin)
   - **Department List Page**:
     - Overview dashboard with statistics
     - Product count, user count, transaction totals
     - Sortable table with action buttons
   - **Department Detail Page**:
     - View all products in department
     - List assigned users with roles
     - Transaction and payment counts
   - **Create/Edit Department**:
     - Name and description fields
     - Super Admin only access
     - Delete protection for departments with dependencies
   - **Navigation**: Departments link added to admin sidebar

9. **Church Management**
   - **Bulk Church Upload** (Admin Only):
     - CSV upload for creating multiple churches at once
     - Validates group assignments and checks for duplicates
     - Detailed success/error reporting per row
     - Template download available
     - Modal dialog interface with drag-and-drop
   - **Enhanced Church List View**:
     - Grid and table view toggle
     - Real-time search and filtering
     - Sort by name, group, balance
     - Filter by group, balance status
     - Clear filters button
   - Individual church detail pages with:
     - Financial summary (purchases, payments, balance, copies)
     - Product breakdown by type
     - Monthly summary for current year
     - **Paginated Transaction History**: Filter by year, month, product
     - **Paginated Payment History**: Filter by method, color-coded
   - **Export functionality**: Download reports as PDF or Excel

10. **Dashboard Quick Actions**
    - Upload CSV Data → Links to `/dashboard/upload`
    - View Reports → Links to `/dashboard/reports`
    - Manage Churches → Links to `/dashboard/churches`
    - All quick action buttons functional with proper navigation

11. **Transaction Tracking**
   - Purchase transactions with line items
   - Product quantities and unit prices
   - Automatic total calculations
   - Multi-currency support
   - Uploader audit trail
   - Pagination and filtering in history views

12. **Payment Recording**
    - Multiple payment methods (Bank Transfer, Cash, Espees)
    - Payment purpose tracking (Printing, Sponsorship)
    - Reference number support
    - Linked to transactions for balance calculation
    - Color-coded display in history views

## Recent Fixes & Improvements (January 2026)

### CSV Upload & Data Import Enhancements
- ✅ **Dynamic Order CSV Parsing** - Order uploads now support ANY product column names, not just hardcoded ones
- ✅ **Flexible Product Detection** - Any column with numeric quantities (except metadata like Chapter, Total Cost) is treated as a product
- ✅ **Auto-Product Creation** - Products are automatically created if they don't exist in the database
- ✅ **Column Name Flexibility** - Supports various naming conventions (e.g., "ROR English", "Polish", "Teevo Quantity", "Spanish")
- ✅ **Month-to-Month Variability** - Different months can have different product sets; churches can order different language editions
- ✅ **Removed Manual Product Management** - Product pages removed; products are now fully automated via CSV uploads
- ✅ **Separate Template Downloads** - Transaction and Order templates now have dedicated download buttons with correct formats
- ✅ **Department Lookup Fix** - Upload route now uses first available department instead of hardcoded name
- ✅ **Bulk Church Upload** - New CSV bulk upload feature for creating multiple churches at once
- ✅ **Church Template Available** - Download template for bulk church uploads with proper format

### Zone Management System
- ✅ **Complete Zone CRUD** - List, create, edit, and delete zones (Super Admin only)
- ✅ **Zone Statistics Dashboard** - View total zones, groups, churches, and active zones
- ✅ **Currency Management** - Set default currency per zone (GBP, USD, EUR, NGN)
- ✅ **Delete Protection** - Cannot delete zones with existing groups
- ✅ **Navigation Integration** - Zones link added to Organization section in admin sidebar
- ✅ **API Endpoints** - Full REST API for zone management (`/api/zones`, `/api/zones/[id]`)

### User Management Fixes
- ✅ **Real Department Fetching** - User create/edit pages now fetch actual departments from `/api/departments`
- ✅ **Fixed Internal Server Error** - Removed hardcoded fake department data that caused save failures
- ✅ **Department Dropdown** - Now shows real departments like "Rhapsody of Realities" instead of fake data

## Recent Fixes & Improvements (October 2025)

### Campaign & Upload Enhancements
- ✅ Added dual CSV upload modes for bank transactions and monthly orders with contextual validation
- ✅ Auto-generate and persist campaign categories when transaction types repeat across uploads
- ✅ Extended upload history with upload type, processed summaries, and category creation counts
- ✅ Created campaign giving aggregation utilities and dashboard overview component

## Recent Fixes & Improvements (January 2025)

### Authentication & Navigation
- ✅ **Fixed logout functionality** - Now uses NextAuth server action with proper redirect
- ✅ **Disabled public registration** - Users can only be created via `/dashboard/users/new` by Super Admins
- ✅ **Removed register links** - Cleaned up from login page and landing page
- ✅ **Register page redirects** - `/register` now automatically redirects to `/login`
- ✅ **Register API disabled** - Returns 403 with clear message directing to admin

### Department Management
- ✅ **Complete department CRUD system** implemented
- ✅ **Department list page** with statistics dashboard
- ✅ **Department detail pages** showing products, users, and activity
- ✅ **Department create/edit forms** with validation
- ✅ **Navigation added** - Departments link in admin sidebar
- ✅ **Delete protection** - Cannot delete departments with dependencies
- ✅ **Textarea component** created for description fields

### Dashboard Enhancements
- ✅ **Quick action buttons wired** - All buttons now link to correct pages
- ✅ **Upload CSV Data** → `/dashboard/upload`
- ✅ **View Reports** → `/dashboard/reports`
- ✅ **Manage Churches** → `/dashboard/churches`

### Bug Fixes
- ✅ **Webpack bundling error resolved** - Cleared `.next` cache
- ✅ **TypeScript errors fixed** - Updated API route params for Next.js 15
- ✅ **Build verification** - All pages compile successfully

## Database Schema Reference

### Core Models (11 total)

1. **User** - System users with authentication
   - Roles: `SUPER_ADMIN | ZONE_ADMIN | GROUP_ADMIN | CHURCH_USER`
   - Relations: Zone, Group, Church, Department

2. **Zone** - Top-level organizational unit (e.g., UK ZONE 1)
   - Currency: Default GBP, supports multi-currency

3. **Group** - Collection of churches within a zone
   - Unique per zone: `@@unique([zoneId, name])`

4. **Church** - Individual church branches
   - Unique per group: `@@unique([groupId, name])`

5. **Department** - Business units (e.g., "UK ZONE 1 DSP")
   - Currently: Rhapsody of Realities distribution

6. **ProductType** - Products/publications (ROR English, Teevo, etc.)
   - Price tracking with currency per product

7. **Transaction** - Purchase records
   - Types: `PURCHASE | PAYMENT | SPONSORSHIP`
   - Always has line items (quantities of products)

8. **TransactionLineItem** - Individual product quantities in transaction
   - Links Transaction to ProductType with quantity

9. **Payment** - Financial payment records
   - Methods: `BANK_TRANSFER | CASH | ESPEES`
   - Purpose: `PRINTING | SPONSORSHIP`
   - Optional `campaignLabel` text and `campaignCategoryId` foreign key

10. **CampaignCategory** - Normalized campaign groupings auto/shared across uploads
    - Unique per department (`@@unique([departmentId, normalizedName])`)
    - Tracks whether the category was auto-generated from uploads

11. **UploadHistory** - Audit trail for CSV uploads
    - Status: `SUCCESS | PARTIAL | FAILED | PROCESSING`
    - Upload type: `ORDER | TRANSACTION`

### Key Relationships
```
Zone (1) → (N) Group → (N) Church → (N) Transaction
                                  → (N) Payment
Department (1) → (N) ProductType
Transaction (1) → (N) TransactionLineItem → (1) ProductType
```

## Environment Variables

Required for all environments:

```env
DATABASE_URL="postgresql://..."           # PostgreSQL connection string
NEXTAUTH_SECRET="..."                     # Generate: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"      # Your app URL
```

Optional (Cloudflare R2 storage):

```env
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="nexus-reporthub"
R2_PUBLIC_URL="https://....r2.cloudflarestorage.com"
```

**Security note**: Never commit `.env` file. Use `.env.example` as template.

## Common Pitfalls & Solutions

### Issue: "Module not found" errors
- **Solution**: Run `npm install` and restart dev server

### Issue: Prisma Client not found
- **Solution**: Run `npx prisma generate` or `npm run build`

### Issue: Database connection fails
- **Solution**: Verify `DATABASE_URL` format and PostgreSQL is running

### Issue: NextAuth session undefined
- **Solution**: Check `NEXTAUTH_SECRET` is set, clear cookies, restart server

### Issue: Build fails with type errors
- **Solution**: Run `npx tsc --noEmit` to see detailed errors

### Issue: R2 upload fails
- **Solution**: Verify R2 credentials, check bucket CORS settings

### Issue: CSV import fails silently
- **Solution**: Check console logs, validate CSV format matches expected schema

## Testing Strategy (To Be Implemented)

When adding tests:

• **Unit tests**: Pure functions in `lib/` (formatCurrency, generateR2Key, etc.)
• **Integration tests**: API routes and Server Actions
• **E2E tests**: Critical user flows (login, upload CSV, generate report)
• **Test location**: Co-locate with code or in `__tests__/` directory
• **Coverage target**: >80% for core business logic
• **Run tests**: `npm test` (once test suite is set up)

## Performance Guidelines

• **Server Components**: Use by default for better performance
• **Database queries**: Always include relevant fields with `select`, avoid `SELECT *`
• **Indexes**: Add to frequently queried fields (see `@@index` in schema.prisma)
• **Image optimization**: Use Next.js `<Image>` component
• **Bundle size**: Monitor with `npm run build` output
• **Caching**: Use Next.js built-in caching for static data

## Deployment Checklist

Before deploying to production:

1. ✅ All environment variables set in Vercel/hosting platform
2. ✅ Database migrations applied: `npx prisma migrate deploy`
3. ✅ Seed data loaded (first deployment only): `npm run db:seed`
4. ✅ Build succeeds locally: `npm run build`
5. ✅ All tests pass (once implemented)
6. ✅ Security review completed (no exposed secrets)
7. ✅ Monitoring/error tracking configured (Sentry recommended)

## Resources & References

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js v5](https://authjs.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [React Hook Form](https://react-hook-form.com)
- [Zod Validation](https://zod.dev)
- [Cloudflare R2 API](https://developers.cloudflare.com/r2/)
- [Recharts Documentation](https://recharts.org)
- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [SheetJS (xlsx) Documentation](https://docs.sheetjs.com)
- [Papa Parse Documentation](https://www.papaparse.com/docs)

---

**Project Status**: Production Ready ✅  
**Current Phase**: All Major Features Implemented & Deployed  
**Version**: 2.3.0  
**License**: ISC  
**Maintainer**: admin@nexusreporthub.com

### Implemented Features (v2.3.0)

#### Core Features
✅ Authentication & Role-Based Access Control (4 roles)  
✅ **Public Registration Disabled** - Admin-only user creation  
✅ **Fixed Logout Functionality** - Server action with redirect  
✅ **Zone Management** - Complete CRUD for organizational zones (Super Admin)  
✅ Church Hierarchy Management (Zone → Group → Church)  
✅ **Bulk Church Upload** - CSV upload for multiple churches  
✅ **Department Management System** - Full CRUD with UI  
✅ **Automated Product Management** - Auto-created from CSV uploads  
✅ **Three CSV Upload Types** - Transactions, Orders, and Churches  
✅ **Separate Template Downloads** - Dedicated templates per upload type  
✅ Financial Reporting Dashboard with Charts  
✅ **Dashboard Quick Actions** - All buttons functional  
✅ Church Detail Pages with Complete History  
✅ PDF/Excel Export Functionality  
✅ Transaction & Payment Tracking  
✅ Upload History & Audit Trails  
✅ Multi-Currency Support (GBP, USD, EUR, NGN, ESPEES)  

#### Advanced Features (v2.2.0)
✅ **Advanced Analytics Dashboard**
  - 6 interactive chart types (Area, Line, Bar, Radar, etc.)
  - Year-over-year comparisons with growth calculations
  - Collection rate tracking and trends
  - Group performance comparison
  - Performance categorization (Top/Low/Inactive)
  - Actionable insights and recommendations

✅ **User Management System** (Super Admin)
  - Complete CRUD operations for users
  - Role assignment and management
  - Organizational assignments (zone, group, church, department)
  - Password management with bcrypt security
  - Search, filter, and delete functionality
  - Role statistics dashboard
  - **Only method for user creation** (public registration removed)

✅ **Department Management System** (Admin)
  - Complete CRUD operations for departments
  - Department list with statistics dashboard
  - Detail pages showing products, users, transactions
  - Create/edit forms with validation
  - Delete protection for departments with dependencies
  - Navigation link in admin sidebar

✅ **Enhanced Church Management**
  - Grid and table view toggle
  - Advanced search and filtering
  - Paginated transaction history with filters
  - Paginated payment history with color coding
  - Sort by multiple criteria
  - Balance status indicators

✅ **Responsive UI with shadcn/ui**
  - Mobile-friendly layouts
  - Interactive components
  - Color-coded badges and indicators
  - Professional card-based designs
  - Custom Textarea component for forms

### Deployment Status

**LIVE ON VERCEL** 🚀

The application is fully deployed and production-ready:

- ✅ All 30+ pages functional
- ✅ 15+ API endpoints secured
- ✅ 10+ interactive charts operational
- ✅ Complete user management system
- ✅ Advanced analytics with YoY comparisons
- ✅ Enhanced church management with filtering
- ✅ Zero console errors
- ✅ Build passing (35KB middleware)
- ✅ Security hardened (bcrypt, JWT, role checks)

### Recent Updates (v2.3.0)

**Zone Management** (Jan 2026)
- Implemented complete zone CRUD system for Super Admins
- Created zone list page with statistics dashboard
- Built zone create/edit pages with currency selection
- Added delete functionality with protection for zones with groups
- Integrated zones navigation link in admin sidebar (Super Admin only)
- Created full REST API for zone operations

**CSV Upload & Data Import** (Jan 2026)
- Implemented dynamic product column detection for Order uploads
- Removed hardcoded product mappings - supports unlimited language editions
- Created bulk church upload feature with validation
- Added separate template downloads for each upload type (Transaction, Order, Churches)
- Fixed department lookup to use first available department
- Enhanced upload UI with modal dialogs and drag-and-drop
- Added Radix UI Dialog component for modals

**User Management Fixes** (Jan 2026)
- Fixed internal server error when editing users with department assignments
- Updated user create/edit pages to fetch real departments from API
- Removed hardcoded fake department data ("UK ZONE 1 DSP" with id "dept-1")
- Department dropdowns now show actual departments from database

**Security & Authentication** (Jan 2025)
- Fixed logout functionality using NextAuth server actions
- Disabled public registration entirely
- Removed all register links from UI
- Updated register API to return 403 Forbidden
- Enforced admin-only user creation

**Department Management** (Jan 2025)
- Built complete department CRUD system
- Created department list page with statistics
- Implemented department detail views
- Added create/edit/delete functionality
- Integrated departments into admin navigation
- Added delete protection for departments with data

**Dashboard Improvements** (Jan 2025)
- Wired all quick action buttons to correct pages
- Fixed navigation for Upload CSV, View Reports, Manage Churches
- Improved landing page (removed register button)

**Bug Fixes** (Jan 2025)
- Resolved webpack bundling error
- Fixed Next.js 15 TypeScript errors in API routes
- Updated route params to use Promise type
- Created missing Textarea UI component
- Cleared build cache issues

**Previous Updates (v2.1.0)**

**Advanced Analytics** (Jan 2025)
- Added 6 chart types for data visualization
- Implemented year-over-year comparison logic
- Created trend analysis with performance categories
- Added actionable insights for low performers

**User Management** (Jan 2025)
- Built complete user CRUD system
- Created user list with search/filter
- Implemented role-based permission system
- Added organizational assignment management

**Church Enhancements** (Jan 2025)
- Enhanced list view with grid/table toggle
- Added pagination to transaction history
- Implemented payment history filtering
- Created advanced filtering options

### Optional Future Enhancements

- 📧 Email notifications for outstanding balances
- 📱 Mobile app version (React Native)
- 🔍 Advanced search across all entities
- 📊 Custom report builder
- 🔐 Two-factor authentication
- 📝 User activity logs and audit trail
- 🔄 Password reset via email
- 🧪 Automated testing suite (Jest, Playwright)
- 📈 Real-time dashboard updates
- 🌐 Multi-language support

### System Requirements

**Development:**
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

**Production:**
- Vercel (or similar Node.js hosting)
- PostgreSQL (Supabase, Neon, etc.)
- Optional: Cloudflare R2 for file storage

**Browser Support:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
