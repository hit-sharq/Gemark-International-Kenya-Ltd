<!-- # 🎨 Gemark International Kenya Ltd

**Gemark International Kenya Ltd** is your premier destination for authentic African woodwork and art in Nairobi, Kenya. Located at Two Rivers Mall on Limuru Road, we specialize in exquisite black wood ebony carvings, rose wood masterpieces, traditional masks, antiques, gemstones, and African jewellery.

---

## 🏪 Our Collections

- **Black Wood Ebony Carvings** - Exquisite sculptures and decorative pieces
- **Rose Wood Art** - Beautiful carvings with warm, rich tones
- **Traditional Masks** - Authentic ceremonial and decorative pieces
- **Antiques** - Rare and valuable historical pieces
- **Gemstones** - Exquisite African tsavorite, tourmaline, and more
- **African Jewellery** - Handcrafted traditional and contemporary pieces

---

## 📍 Location

**Two Rivers Mall, Limuru Road**
Nairobi, Kenya

**Contact**: +254 727 205 718
**Email**: info@gemark.co.ke

---

## 🌍 Vision

To share the rich cultural heritage and artistic traditions of Kenya and East Africa with collectors and enthusiasts worldwide, while supporting local artisan communities.

---

## 🚀 Tech Stack

### Frontend
- **Next.js 14+** with **TypeScript**
- **React** with **Zustand** (state management)
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
- Browse art by category (Ebony, Rosewood, Masks, Antiques, Gemstones, Jewellery)
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
│   ├── gallery/          # Gallery pages
│   ├── cart/             # Cart page
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
├── types/               # TypeScript types
└── docs/                # Documentation
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

PesaPal supports M-Pesa, Credit/Debit Cards, and Bank Transfer.

### Stripe Integration

For international credit/debit card payments.

### M-Pesa Integration

Kenyan mobile money via STK Push.

---

## 📦 Order Total Calculation

```
Subtotal = Sum of (item price × quantity)
Shipping = $25 (flat rate, no free shipping)
Tax = 8% of subtotal
Total = Subtotal + Shipping + Tax
```

---

## 🗂️ Database Schema

### Core Models

```prisma
model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  email     String
  name      String?
  orders    Order[]
  createdAt DateTime @default(now())
}

model Order {
  id              String        @id @default(cuid())
  orderNumber     String        @unique
  userId          String
  status          OrderStatus   @default(PENDING)
  paymentStatus   PaymentStatus @default(PENDING)
  subtotal        Float
  shippingCost    Float
  tax             Float
  total           Float
  // ... shipping and payment fields
  items           OrderItem[]
  shipment        Shipment?
}

model ArtListing {
  id          String   @id @default(cuid())
  title       String
  description String
  price       Float
  categoryId  String
  material    String?
  region      String
  size        String
  images      String[]
  featured    Boolean  @default(false)
  category    Category @relation(fields: [categoryId], references: [id])
}
```

---

## 🌐 API Reference

### Payments

#### Create PesaPal Payment
```bash
POST /api/payments/pesapal
Content-Type: application/json

{
  "cartItems": [...],
  "shippingInfo": {...},
  "paymentMethod": "mpesa"
}
```

#### Check Payment Status
```bash
GET /api/payments/pesapal?orderId=xxx&trackingId=xxx
```

---

## 🚀 Deployment

### Deploy to Vercel

1. Push to GitHub
2. Import in Vercel: `https://vercel.com/import/project`
3. Add environment variables
4. Deploy

---

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx prisma studio    # Open Prisma DB GUI
npx prisma db push   # Push schema to database
npx prisma generate  # Generate Prisma client
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License.

---

## 👤 Contact

**Gemark International Kenya Ltd**

- **Phone**: +254 727 205 718
- **Email**: info@gemark.co.ke
- **Location**: Two Rivers Mall, Limuru Road, Nairobi, Kenya

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [PesaPal](https://pesapal.com/)
- [Stripe](https://stripe.com/)
- [Clerk](https://clerk.com/)
- [Tailwind CSS](https://tailwindcss.com/)
 -->
