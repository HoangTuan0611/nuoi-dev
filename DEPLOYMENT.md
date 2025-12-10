# Deployment Guide - Vercel

This guide explains how to deploy the Nuôi DEV application to Vercel with proper storage configuration.

## Prerequisites

- A Vercel account
- GitHub repository connected to Vercel
- A Cloudinary account (free tier available at https://cloudinary.com)

## Storage Setup

The application uses two storage solutions:

### 1. Vercel KV (Redis) - For Data Storage

Stores all application data (users, profiles, posts, chat messages, votes).

**Setup Steps:**

1. Go to your Vercel project dashboard
2. Navigate to the **Storage** tab
3. Click **Create Database** → Select **KV**
4. Name it (e.g., `nuoi-dev-kv`)
5. Click **Create**
6. Vercel will automatically add environment variables to your project:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

### 2. Cloudinary - For Image Uploads

Stores uploaded images (avatars, gallery images).

**Setup Steps:**

1. Go to [Cloudinary](https://cloudinary.com) and create a free account
2. From your Cloudinary dashboard, copy:
   - **Cloud Name**
   - **API Key**
   - **API Secret**
3. In your Vercel project dashboard, go to **Settings** → **Environment Variables**
4. Add these environment variables:
   - `CLOUDINARY_CLOUD_NAME` = your cloud name
   - `CLOUDINARY_API_KEY` = your API key
   - `CLOUDINARY_API_SECRET` = your API secret

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click **New Project**
4. Import your GitHub repository
5. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: (leave default)
6. Click **Deploy**

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# For production
vercel --prod
```

## Environment Variables

After setting up storage, verify these environment variables exist in your Vercel project settings:

**Vercel KV:**
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

**Cloudinary:**
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

**System (Auto-set):**
- `VERCEL=1`
- `VERCEL_ENV=production`

## Data Migration (Optional)

If you have existing data in local JSON files (`/data/*.json`), you can migrate it to Vercel KV:

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables locally:
   - Copy the KV environment variables from Vercel dashboard
   - Create a `.env.local` file:
```env
KV_URL=your_kv_url
KV_REST_API_URL=your_rest_api_url
KV_REST_API_TOKEN=your_token
KV_REST_API_READ_ONLY_TOKEN=your_readonly_token
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
VERCEL=1
```

3. Run the migration script:
```bash
npm run migrate-to-kv
```

## Post-Deployment

1. Visit your deployed URL
2. Test registration and login
3. Create a profile
4. Upload an image to test Blob storage
5. Post a message to test KV storage

## Troubleshooting

### Build Errors

**Error: "Cannot find module '@vercel/blob'"**
- Solution: Make sure dependencies are installed
- Run: `npm install @vercel/blob @vercel/kv`

**Error: "EROFS: read-only file system"**
- This means you're trying to write to the filesystem in production
- The code should automatically use KV/Blob when `VERCEL=1`
- Check that environment variables are set correctly

### Runtime Errors

**Error: "KV_REST_API_TOKEN is not set"**
- Solution: Create a Vercel KV database in your project
- The environment variables will be added automatically

**Error: "BLOB_READ_WRITE_TOKEN is not set"**
- Solution: This error is now obsolete - the app uses Cloudinary for image uploads
- Make sure Cloudinary environment variables are set instead

**Error: "Upload failed" or Cloudinary errors**
- Solution: Verify your Cloudinary credentials in environment variables
- Check that your Cloudinary account is active
- Ensure you haven't exceeded free tier limits

### Data Not Persisting

- Check Vercel KV dashboard to see if data is being written
- Verify environment variables are set in Vercel project settings
- Check deployment logs for errors

### Images Not Uploading

- Check Cloudinary dashboard to see if images are being uploaded
- Verify Cloudinary credentials in environment variables
- Check browser console and server logs for errors
- Ensure file size is under 5MB

## Local Development

The app automatically uses local JSON files when running locally:

```bash
npm run dev
```

Data will be stored in `/data/*.json` files when running locally.

## Architecture

### Production (Vercel)
- **Data Storage**: Vercel KV (Redis)
- **File Storage**: Cloudinary
- **Compute**: Serverless Functions

### Local Development
- **Data Storage**: Local JSON files (`/data/*.json`)
- **File Storage**: Cloudinary (using credentials from .env.local)
- **Compute**: Next.js Dev Server

## Support

For issues:
1. Check Vercel deployment logs
2. Check Vercel KV dashboard for data
3. Check Vercel Blob dashboard for uploaded files
4. Review this deployment guide

## Resources

- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
