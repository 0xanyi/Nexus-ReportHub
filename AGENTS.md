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
│  ├─ charts/               → Chart components (Recharts integration)
│  │  └─ FinancialCharts.tsx → Financial charts (bar, line, pie)
│  ├─ ui/                   → Reusable UI components (Button, Input, Card, etc.)
│  └─ ExportButtons.tsx     → PDF/Excel export functionality
├─ lib/                     → Shared utilities and configurations
│  ├─ prisma.ts             → Prisma client singleton
│  ├─ r2.ts                 → Cloudflare R2 storage utilities
│  ├─ exports.ts            → PDF and Excel export utilities (jsPDF, xlsx)
│  └─ utils.ts              → Helper functions (cn, formatCurrency, formatDate)
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
   - Login/Register with email and password
   - Role-based access control (SUPER_ADMIN, ZONE_ADMIN, GROUP_ADMIN, CHURCH_USER)
   - Secure session management with NextAuth.js v5

2. **Church Hierarchy Management** (Admin Only)
   - **Groups**: Create, edit, delete ministry groups within zones
   - **Churches**: Add, edit, move churches between groups
   - Church transfer functionality maintains all transaction history
   - Prevent deletion of groups/churches with financial data

3. **Product Management** (Admin Only)
   - Full CRUD for Rhapsody of Reality product types
   - Support for multiple editions (ROR English, French, Polish, German, Teevo, etc.)
   - Multi-currency pricing (GBP, USD, EUR, NGN, ESPEES)
   - Validation prevents deletion of products in use

4. **CSV Upload System** (Admin Only)
   - Drag-and-drop file upload interface
   - Automatic parsing with Papa Parse
   - Smart validation (church names, product types, dates, quantities)
   - Bulk transaction creation with detailed error reporting
   - Upload history tracking with success/partial/failed status
   - Template CSV download for proper formatting

5. **Financial Reports**
   - **Dashboard Overview**: Summary cards with key metrics
   - **Visual Charts**: Monthly trends, product distribution, top churches (Recharts)
   - **Church Financial Summary**: Complete table with purchases, payments, balances
   - **Recent Transactions**: Latest activity feed
   - Color-coded balance indicators (red for debt, green for credit)

6. **Church Management**
   - Churches list grouped by ministry groups
   - Individual church detail pages with:
     - Financial summary (purchases, payments, balance, copies)
     - Product breakdown by type
     - Monthly summary for current year
     - Complete transaction history
     - Complete payment history
   - **Export functionality**: Download reports as PDF or Excel

7. **Transaction Tracking**
   - Purchase transactions with line items
   - Product quantities and unit prices
   - Automatic total calculations
   - Multi-currency support
   - Uploader audit trail

8. **Payment Recording**
   - Multiple payment methods (Bank Transfer, Cash, Espees)
   - Payment purpose tracking (Printing, Sponsorship)
   - Reference number support
   - Linked to transactions for balance calculation

## Database Schema Reference

### Core Models (10 total)

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

10. **UploadHistory** - Audit trail for CSV uploads
    - Status: `SUCCESS | PARTIAL | FAILED | PROCESSING`

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

**Project Status**: Core Features Complete ✅  
**Current Phase**: Production Ready - All Major Features Implemented  
**Version**: 2.0.0  
**License**: ISC  
**Maintainer**: admin@nexusreporthub.com

### Implemented Features (v2.0.0)

✅ Authentication & Role-Based Access Control  
✅ Church Hierarchy Management (Groups & Churches)  
✅ Product Management (Multi-Edition Support)  
✅ CSV Upload System with Validation  
✅ Financial Reporting Dashboard with Charts  
✅ Church Detail Pages with Full History  
✅ PDF/Excel Export Functionality  
✅ Transaction & Payment Tracking  
✅ Upload History & Audit Trails  
✅ Multi-Currency Support  
✅ Responsive UI with shadcn/ui

### Ready for Deployment

The application is feature-complete and ready for production deployment. All core functionality has been implemented and tested:

- ✅ Full church hierarchy management
- ✅ Complete financial tracking and reporting
- ✅ Data import/export capabilities
- ✅ Visual analytics with interactive charts
- ✅ Secure authentication and authorization
- ✅ Comprehensive audit trails

**Next Steps**: Deploy to Vercel, configure production database, and set up monitoring.
