# Nexus ReportHub - Deployment Guide

## 🚀 Quick Deployment to Vercel

### Prerequisites Completed ✅
- [x] Code pushed to GitHub: `https://github.com/0xanyi/Nexus-ReportHub.git`
- [x] Vercel CLI installed
- [x] Build passing locally
- [x] Database schema ready

### Option 1: Deploy via Vercel Dashboard (Recommended)

#### Step 1: Import Project
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your GitHub account and repository: `0xanyi/Nexus-ReportHub`
4. Click **"Import"**

#### Step 2: Configure Project
- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `./` (leave default)
- **Build Command**: `prisma generate && next build` (auto-configured)
- **Output Directory**: `.next` (auto-configured)
- **Install Command**: `npm install` (auto-configured)

#### Step 3: Add Environment Variables

Click **"Environment Variables"** and add the following:

**Required Variables:**

| Variable | Value | Where to Get It |
|----------|-------|-----------------|
| `DATABASE_URL` | Your PostgreSQL connection string | See Database Setup below |
| `NEXTAUTH_SECRET` | Random 32-character string | Run: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Will be provided after first deploy |

**Optional Variables:**

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_APP_NAME` | `Nexus ReportHub` |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |
| `R2_ACCOUNT_ID` | Your Cloudflare R2 Account ID (optional) |
| `R2_ACCESS_KEY_ID` | Your R2 Access Key (optional) |
| `R2_SECRET_ACCESS_KEY` | Your R2 Secret Key (optional) |
| `R2_BUCKET_NAME` | `nexus-reporthub` (optional) |

#### Step 4: Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. Vercel will provide you with a deployment URL

#### Step 5: Update Environment Variables
1. Go to your project settings in Vercel
2. Update `NEXTAUTH_URL` with your actual deployment URL
3. Redeploy (Settings → Deployments → ... → Redeploy)

---

### Option 2: Deploy via Vercel CLI

```bash
# 1. Login to Vercel
vercel login

# 2. Deploy to production
vercel --prod

# 3. Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? nexus-reporthub (or your choice)
# - Directory? ./ (default)
# - Override settings? No

# 4. Add environment variables
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production

# 5. Redeploy with environment variables
vercel --prod
```

---

## 💾 Database Setup

### Option A: Neon (Recommended - Free Tier Available)

1. Go to [neon.tech](https://neon.tech)
2. Sign up and create a new project
3. Create a database named `nexus_reporthub`
4. Copy the connection string (it looks like):
   ```
   postgresql://username:password@ep-xxxxx.region.aws.neon.tech/nexus_reporthub?sslmode=require
   ```
5. Use this as your `DATABASE_URL`

### Option B: Supabase (Free Tier Available)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the "Connection string" (Session mode)
5. Use this as your `DATABASE_URL`

### Option C: Railway (Free Tier Available)

1. Go to [railway.app](https://railway.app)
2. Create a new PostgreSQL database
3. Copy the connection string from the "Connect" tab
4. Use this as your `DATABASE_URL`

### Option D: Your Own PostgreSQL Server

If you have your own PostgreSQL server:

```
postgresql://username:password@hostname:5432/nexus_reporthub?sslmode=require
```

---

## 🗄️ Database Migration & Seeding

After your first deployment, you need to set up the database:

### Method 1: Via Vercel CLI

```bash
# Install Vercel CLI if you haven't
npm install -g vercel

# Link to your project
vercel link

# Run migrations
vercel env pull .env.production
npx prisma migrate deploy

# Seed the database (creates zones, groups, churches, admin users)
npx prisma db seed
```

### Method 2: Via Local Environment

```bash
# Set your production DATABASE_URL temporarily
export DATABASE_URL="your-production-database-url"

# Run migrations
npx prisma migrate deploy

# Seed the database
npm run db:seed

# Unset the variable
unset DATABASE_URL
```

---

## 🔑 Default Admin Credentials

After seeding, you can login with:

**Super Admin:**
- Email: `admin@nexusreporthub.com`
- Password: `Admin123!`

**Zone Admin:**
- Email: `zone@nexusreporthub.com`
- Password: `Admin123!`

⚠️ **IMPORTANT**: Change these passwords immediately after first login!

---

## ✅ Post-Deployment Checklist

1. **Test Login**
   - [ ] Visit your deployment URL
   - [ ] Login with admin credentials
   - [ ] Verify dashboard loads

2. **Test Core Features**
   - [ ] Create a new group
   - [ ] Add a church to the group
   - [ ] Add a product type
   - [ ] Upload a test CSV file
   - [ ] View reports page (charts should render)
   - [ ] Export a church report (PDF/Excel)

3. **Security Review**
   - [ ] Change default admin passwords
   - [ ] Verify only admins can access admin pages
   - [ ] Test CSV upload with invalid data
   - [ ] Verify church transfer preserves data

4. **Performance Check**
   - [ ] Test page load times
   - [ ] Verify charts render smoothly
   - [ ] Test with multiple concurrent users

5. **Optional Enhancements**
   - [ ] Set up custom domain in Vercel
   - [ ] Enable Vercel Analytics
   - [ ] Configure error monitoring (Sentry)
   - [ ] Set up Cloudflare R2 for file storage

---

## 🔧 Troubleshooting

### Build Fails with "Prisma Client not found"
```bash
# Solution: Ensure build command includes prisma generate
# In vercel.json, build command should be:
"buildCommand": "prisma generate && next build"
```

### Database Connection Errors
```bash
# Check DATABASE_URL format:
# ✅ Correct: postgresql://user:pass@host:5432/db?sslmode=require
# ❌ Wrong: postgres://... (should be postgresql://)

# Verify database is accessible from Vercel's network
# Some databases require whitelisting Vercel's IP ranges
```

### NextAuth Session Undefined
```bash
# Ensure NEXTAUTH_SECRET is set and matches in all environments
openssl rand -base64 32

# Ensure NEXTAUTH_URL matches your deployment URL exactly
# Including https:// and no trailing slash
```

### Charts Not Rendering
```bash
# This is usually a client-side issue
# Check browser console for errors
# Ensure recharts is installed: npm list recharts
```

### CSV Upload Fails
```bash
# Check file size (max 10MB)
# Verify CSV format matches template
# Check console logs in Vercel for detailed errors
```

---

## 📊 Monitoring & Maintenance

### View Logs
```bash
# Via Vercel CLI
vercel logs

# Via Vercel Dashboard
# Go to your project → Deployments → Select deployment → Logs
```

### Database Backups

**Neon**: Automatic daily backups (retained for 7 days on free tier)

**Supabase**: Automatic daily backups

**Railway**: Manual backups via dashboard

**Self-hosted**: Set up pg_dump cron job:
```bash
# Daily backup at 2 AM
0 2 * * * pg_dump DATABASE_URL > /backups/nexus_$(date +\%Y\%m\%d).sql
```

### Update Deployments

```bash
# When you push to main, Vercel auto-deploys
git push origin main

# Or trigger manual deploy
vercel --prod
```

---

## 🎉 Success!

Your Nexus ReportHub should now be live! 

**Next Steps:**
1. Share the URL with your team
2. Create user accounts for zone admins and church users
3. Upload your first CSV file
4. Generate your first financial report

Need help? Check the main [README.md](./README.md) or [AGENTS.md](./AGENTS.md) for detailed documentation.

---

**Deployment URL**: https://nexus-reporthub.vercel.app (update this after deployment)

**Last Updated**: 2025-01-20

**Version**: 2.0.0
