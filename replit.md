# Arts Afrik

A Next.js 14 application for an African art marketplace.

## Tech Stack
- **Framework**: Next.js 14
- **Authentication**: Clerk
- **Database**: PostgreSQL with Prisma
- **Styles**: Tailwind CSS
- **Payments**: PesaPal, M-Pesa, Stripe

## Environment Variables
The following environment variables are required:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk publishable key
- `CLERK_SECRET_KEY`: Clerk secret key
- `PESAPAL_CONSUMER_KEY`: PesaPal consumer key
- `PESAPAL_CONSUMER_SECRET`: PesaPal consumer secret
- `PESAPAL_ENVIRONMENT`: `live` or `sandbox`
- `NEXT_PUBLIC_APP_URL`: The public URL of the application

## Getting Started
1. Install dependencies: `npm install`
2. Sync database: `npx prisma db push`
3. Start dev server: `npm run dev`
