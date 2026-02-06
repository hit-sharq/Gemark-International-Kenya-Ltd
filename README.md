# 🪵 Gemark International Kenya Ltd

**Gemark International** is a premium e-commerce platform showcasing exquisite African woodwork and art, specializing in black wood ebony carvings, rose wood art, traditional masks, antiques, gemstones, and authentic African jewellery.

---

## 🏪 About Us

Located in the heart of Nairobi at Two Rivers Mall, we curate the finest handcrafted African art pieces from skilled artisans across Kenya and East Africa.

### Our Collections
- **Black Ebony Carvings** - Premium handcrafted ebony sculptures
- **Rose Wood Art** - Elegant wooden art pieces
- **Traditional Masks** - Authentic cultural masks
- **Antiques** - Vintage and historical pieces
- **Gemstones** - Raw and polished gemstones
- **African Jewellery** - Handcrafted jewelry

---

## 🌍 Vision

To become Africa's premier destination for authentic, handcrafted woodwork and art, connecting collectors worldwide with Kenya's finest artisans and their extraordinary creations.

---

## 🚀 Tech Stack

### Frontend
- **Next.js 14+** with **TypeScript**
- **React** with modern hooks
- **Tailwind CSS** + **Custom CSS**
- **Cloudinary** for image hosting
- **Lucide React** for icons

### Backend
- **Next.js API Routes**
- **Prisma ORM** with **PostgreSQL**
- **Clerk** for authentication

### Payment Gateways
- **PesaPal** - Primary East African payment gateway
- **Stripe** - International card payments
- **M-Pesa** - Kenyan mobile money

### Deployment
- **Vercel** (Frontend & API)
- **Supabase** (PostgreSQL Database)

---

## ✨ Core Features

### Shopping
- Browse art by category and collection
- Shopping cart with persistent storage
- Wishlist functionality
- Real-time shipping calculation

### Checkout & Payments
- Multi-payment support (PesaPal, Stripe, M-Pesa)
- Automatic currency conversion (USD/KES)
- Order confirmation emails

### User Dashboard
- Order history and tracking
- Profile management

### Admin Dashboard
- Manage art listings (CRUD)
- Featured artwork management
- Order management and tracking

---

## 📁 Project Structure

```
gemark-international/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── payments/      # Payment processing
│   │   ├── orders/        # Order management
│   │   ├── cart/          # Cart operations
│   │   ├── shipping/      # Shipping calculations
│   │   └── ...
│   ├── checkout/          # Checkout pages
│   ├── dashboard/         # Admin dashboard
│   ├── gallery/           # Gallery pages
│   ├── cart/              # Cart page
│   └── ...
├── components/            # React components
│   ├── ui/              # UI primitives
│   ├── CartSidebar.tsx
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── ...
├── contexts/             # React contexts
│   ├── CartContext.tsx   # Cart state
│   └── WishlistContext.tsx
├── lib/                  # Utilities
│   ├── prisma.ts         # DB client
│   ├── auth.ts           # Auth helpers
│   ├── shipping-calculator.ts
│   └── ...
├── prisma/              # Database
│   └── schema.prisma
├── hooks/               # Custom React hooks
└── types/               # TypeScript types
```

---

## 🛠️ Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/your-username/gemark-international.git
cd gemark-international
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/gemark"

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# ==============
# PAYMENT GATEWAYS
# ==============

# Stripe (International Cards)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# M-Pesa (Kenya Mobile Money)
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_PASSKEY=your_passkey
MPESA_SHORTCODE=522533

# PesaPal (East Africa Gateway)
PESAPAL_ENVIRONMENT=sandbox
PESAPAL_CONSUMER_KEY=your_consumer_key
PESAPAL_CONSUMER_SECRET=your_consumer_secret
```

### 4. Setup database
```bash
npx prisma migrate dev --name init
```

### 5. Start development server
```bash
npm run dev
```

Visit `http://localhost:3000`

---

## 💳 Payment Integration

### PesaPal Integration

PesaPal supports:
- **M-Pesa** - Mobile money (Kenya)
- **Credit/Debit Cards** - Visa, Mastercard
- **Bank Transfer** - Equity, KCB, etc.

### Stripe Integration

For international credit/debit card payments.

### M-Pesa Integration

Kenyan mobile money via STK Push.

---

## 📦 Order Total Calculation

```
Subtotal = Sum of (item price × quantity)
Shipping = Calculated based on destination
Tax = 8% of subtotal
Total = Subtotal + Shipping + Tax
```

---

## 🚀 Deployment

### Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

---

## 📞 Contact

**Gemark International Kenya Ltd**

- 📍 Two Rivers Mall, Limuru Road, Nairobi, Kenya
- 📞 +254 727 205 718
- ✉️ info@gemark.co.ke
- 🕐 Mon - Sat: 10am - 8pm | Sun: 11am - 6pm

---

## 👤 Developer

**Joshua Mwendwa**
- Founder & Lead Developer, Gemark International
- GitHub: https://github.com/hit-sharq

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [PesaPal](https://pesapal.com/)
- [Stripe](https://stripe.com/)
- [Clerk](https://clerk.com/)

---

## 📜 License

This project is licensed under the MIT License.

