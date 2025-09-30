# Nexus ReportHub - Setup Guide

## Current Status ✅

The foundational architecture is complete! Here's what has been implemented:

### ✅ Completed

1. **Project Initialization**
   - Next.js 15.5.3 with TypeScript
   - All dependencies installed
   - Proper project structure

2. **Database Layer**
   - Complete Prisma schema with all models
   - Hierarchical structure: Zone → Group → Church
   - Transaction and Payment tracking
   - User management with roles
   - Upload history tracking

3. **Authentication System**
   - NextAuth.js v5 configured
   - Login and Register pages
   - Role-based access control (RBAC)
   - JWT session management
   - Password hashing with bcrypt

4. **UI Foundation**
   - Tailwind CSS configured
   - shadcn/ui components (Button, Input, Label, Card)
   - Responsive layouts
   - Authentication pages styled

5. **Cloud Storage**
   - Cloudflare R2 integration ready
   - Upload/download utilities
   - Presigned URL generation

6. **Seed Data**
   - UK Zone 1 with 4 groups
   - 27 churches from your Excel file
   - Product types (ROR English, Teevo, etc.)
   - Admin users (Super Admin, Zone Admin)

7. **Basic Dashboard**
   - Protected route
   - User session display
   - Quick stats cards
   - Activity feed

## Next Steps (Not Yet Implemented)

### Phase 1 - Core Features

1. **CSV Upload System** 📤
   - File upload UI
   - CSV parser (Papa Parse)
   - Data validation
   - Bulk import logic
   - Error handling
   - Progress indicators

2. **Reporting Dashboard** 📊
   - Church-level reports
   - Group-level aggregations
   - Zone-wide analytics
   - Monthly/annual summaries
   - Balance calculations
   - Export to PDF/Excel

3. **Church Management** 🏢
   - List all churches
   - View church details
   - Edit church information
   - Transaction history
   - Payment history

4. **User Management** 👥
   - List users
   - Create new users
   - Assign roles
   - Manage permissions

### Phase 2 - Advanced Features

5. **Advanced Reporting** 📈
   - Interactive charts (Recharts)
   - Trend analysis
   - Forecasting
   - Currency conversion

6. **Audit Logging** 📝
   - Track all changes
   - User activity logs
   - Data access logs

7. **Notifications** 🔔
   - Email notifications
   - In-app notifications
   - Payment reminders

8. **Export & Download** 💾
   - PDF reports
   - Excel exports
   - Custom report builder

## Quick Start

### 1. Set up your database

Create a PostgreSQL database:

```bash
# Using psql
createdb nexus_reporthub

# Or use a hosted solution like:
# - Supabase
# - Railway
# - Neon
# - PlanetScale
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

**Required variables:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/nexus_reporthub"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

**Optional (for R2 storage):**
```env
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="nexus-reporthub"
R2_PUBLIC_URL="https://..."
```

### 3. Initialize database

```bash
# Push schema to database
npm run db:push

# Seed initial data
npm run db:seed
```

### 4. Run development server

```bash
npm run dev
```

Visit http://localhost:3000

### 5. Login

Use one of the seeded accounts:

**Super Admin:**
- Email: `admin@nexusreporthub.com`
- Password: `Admin123!`

**Zone Admin:**
- Email: `zone@nexusreporthub.com`
- Password: `Admin123!`

## Project Structure

```
nexus-reporthub/
├── app/
│   ├── (auth)/              # Auth pages (public)
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/         # Protected dashboard
│   │   └── dashboard/
│   ├── api/                 # API routes
│   │   └── auth/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ui/                  # Reusable UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── label.tsx
├── lib/
│   ├── prisma.ts           # Prisma client
│   ├── r2.ts               # R2 utilities
│   └── utils.ts            # Helper functions
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed script
├── auth.config.ts          # NextAuth config
├── auth.ts                 # NextAuth instance
├── middleware.ts           # Route protection
└── package.json
```

## Database Schema Overview

### Core Models

- **User** - System users with roles
- **Zone** - Top-level organizational unit (e.g., UK Zone 1)
- **Group** - Collection of churches
- **Church** - Individual church branches
- **Department** - Business units (e.g., DSP - Rhapsody)
- **ProductType** - Products/publications
- **Transaction** - Purchase records
- **TransactionLineItem** - Individual product quantities
- **Payment** - Financial payments
- **UploadHistory** - CSV upload tracking

### Relationships

```
Zone (1) → (N) Group
Group (1) → (N) Church
Church (1) → (N) Transaction
Church (1) → (N) Payment
Department (1) → (N) ProductType
Transaction (1) → (N) TransactionLineItem
```

## User Roles & Permissions

### SUPER_ADMIN
- Full system access
- Manage all zones, groups, churches
- Manage all users
- System configuration

### ZONE_ADMIN
- Manage specific zone
- View all groups and churches in zone
- Upload data for zone
- Generate zone reports

### GROUP_ADMIN
- Manage specific group
- View all churches in group
- Upload data for group
- Generate group reports

### CHURCH_USER
- View own church data only
- Read-only access
- Download reports for own church

## Technology Stack

- **Framework**: Next.js 15.5.3 (App Router, React 19)
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js v5
- **Storage**: Cloudflare R2
- **UI**: Tailwind CSS + shadcn/ui
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **CSV**: Papa Parse
- **State**: Zustand + React Server Components

## Development Workflow

### Making Schema Changes

```bash
# After editing prisma/schema.prisma
npm run db:push

# Or create a migration
npm run db:migrate
```

### Viewing Database

```bash
npm run db:studio
```

Opens Prisma Studio at http://localhost:5555

### Running Linter

```bash
npm run lint
```

### Building for Production

```bash
npm run build
npm run start
```

## Deployment Checklist

### Vercel Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial setup"
   git push
   ```

2. **Import in Vercel**
   - Go to vercel.com
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Add Environment Variables**
   - `DATABASE_URL` - Your production database
   - `NEXTAUTH_SECRET` - Generate new secret
   - `NEXTAUTH_URL` - Your production URL
   - R2 credentials (if using)

4. **Deploy**
   - Vercel will automatically build and deploy
   - Runs `npm run build` which includes Prisma generate

5. **Run Migrations**
   ```bash
   # On first deployment
   npx prisma db push --preview-feature
   npx prisma db seed
   ```

### Database Hosting Options

- **Supabase** (Recommended)
  - Free tier available
  - PostgreSQL with extensions
  - Built-in auth (can integrate)

- **Railway**
  - Easy PostgreSQL deployment
  - Good for development

- **Neon**
  - Serverless PostgreSQL
  - Auto-scaling

- **PlanetScale**
  - MySQL (would need schema changes)

## Security Considerations

✅ **Implemented:**
- Password hashing (bcrypt)
- JWT sessions
- Role-based access control
- Input validation (Zod)
- SQL injection protection (Prisma)

⚠️ **TODO:**
- Rate limiting
- CSRF protection
- 2FA for admins
- Email verification
- Password reset flow
- Audit logging
- Data encryption at rest

## Testing

Currently no tests implemented. Recommended:

```bash
# Install testing dependencies
npm install -D jest @testing-library/react @testing-library/jest-dom

# Add test scripts to package.json
"test": "jest",
"test:watch": "jest --watch"
```

## Support & Troubleshooting

### Common Issues

**Database connection fails:**
- Check DATABASE_URL format
- Ensure PostgreSQL is running
- Verify credentials

**NextAuth errors:**
- Regenerate NEXTAUTH_SECRET
- Check NEXTAUTH_URL matches your domain
- Clear browser cookies

**Build fails:**
- Run `npm install` again
- Delete `.next` folder
- Check Node.js version (18+)

**R2 upload fails:**
- Verify R2 credentials
- Check bucket permissions
- Ensure CORS is configured

## Contributing

When adding new features:

1. Create a new branch
2. Make changes
3. Test locally
4. Update documentation
5. Submit pull request

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js Docs](https://authjs.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

---

**Status**: Foundation Complete ✅  
**Next**: Implement CSV Upload System 📤  
**Version**: 1.0.0  
**Last Updated**: 2025
