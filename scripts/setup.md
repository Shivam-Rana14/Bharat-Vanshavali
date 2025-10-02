# Bharat Vanshavali Setup Guide

## 🚀 Complete Production Setup

This guide will help you set up the Bharat Vanshavali project with Supabase backend integration.

### Prerequisites
- Node.js 18+ installed
- Supabase account and project created
- Git installed

### 1. Environment Setup

Create a `.env.local` file in the root directory with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://zsaghazunjddfmaohnqn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

#### Run the migrations in your Supabase SQL Editor:

1. Go to your Supabase dashboard → SQL Editor
2. Run each migration file in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_functions_and_triggers.sql`
   - `supabase/migrations/003_row_level_security.sql`
   - `supabase/migrations/004_storage_policies.sql`

#### Create Storage Buckets:

**Option A: Automated Script (Recommended)**
```bash
node scripts/create-storage-buckets.js
```

**Option B: Manual Setup**
In Supabase Dashboard → Storage:
1. Create bucket `documents` (private, 10MB limit)
2. Create bucket `avatars` (public, 5MB limit) 
3. Create bucket `family-photos` (private, 10MB limit)

**Option C: SQL Script**
Run `supabase/storage-setup.sql` in SQL Editor

### 4. Create Admin User

#### Option A: Through Supabase Auth (Recommended)
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Create admin user: `admin@bharatvanshavali.com`
4. Set password: `admin123` (change in production!)
5. Run this SQL to make them admin:
```sql
UPDATE profiles 
SET user_type = 'admin', verification_status = 'verified', verified_at = NOW()
WHERE email = 'admin@bharatvanshavali.com';
```

#### Option B: Through Registration
1. Start the app: `npm run dev`
2. Go to `/register` and create account
3. Manually update the user in Supabase to admin type

### 5. Seed Sample Data (Optional)

Run the seed script in SQL Editor:
```sql
-- Copy content from lib/supabase/seed.sql
```

### 6. Start the Application

```bash
npm run dev
```

Visit `http://localhost:3000`

## 🎯 Login Credentials

### Admin Login:
- **Email**: admin@bharatvanshavali.com
- **Password**: admin123

### Test User Login:
Create through registration form or Supabase Auth UI

## 📋 Features Implemented

✅ **Authentication System**
- Supabase Auth integration
- Admin and citizen roles
- Session management
- Password reset

✅ **Database Schema**
- Users/Profiles table
- Family trees and members
- Documents storage
- Notifications system
- Activity logging

✅ **API Layer**
- Authentication endpoints
- Family member CRUD
- Document upload/management
- Admin verification workflow
- Notifications system

✅ **Security**
- Row Level Security (RLS)
- Storage policies
- User data protection
- Admin-only operations

✅ **File Management**
- Document upload to Supabase Storage
- Image handling for avatars and family photos
- File type validation
- Size limits

## 🛠️ Development Features

### Real-time Updates
- Supabase realtime subscriptions for notifications
- Live updates when family members are added/verified

### Error Handling
- Comprehensive error handling in API routes
- User-friendly error messages
- Validation on both client and server

### Performance Optimization
- Efficient database queries
- Image optimization
- Caching strategies
- Lazy loading

## 🚀 Production Deployment

### Environment Variables for Production:
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-domain.com
```

### Security Checklist:
- [ ] Update all default passwords
- [ ] Enable SSL/TLS
- [ ] Set up proper CORS policies
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Regular security audits

## 📞 Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify all environment variables are set
3. Ensure Supabase project is properly configured
4. Check the Network tab for failed API calls

---

**🎉 Your Bharat Vanshavali application is now ready for production use!**