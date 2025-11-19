# 🛍️ Hub Fashion - Full-Stack E-Commerce Platform

A modern, production-ready e-commerce platform built with Next.js 16, featuring comprehensive admin management, customer storefront, authentication, cart/wishlist functionality, order processing with automated PDF invoicing, and advanced search capabilities.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Overview

Hub Fashion is a complete e-commerce solution that provides:

- **Customer Experience**: Browse products, manage cart/wishlist, place orders, track shipments, download invoices
- **Admin Dashboard**: Manage products, collections, orders, customers, and reports
- **Authentication**: Email/password and Google OAuth integration
- **Image Management**: ImageKit integration for optimized media delivery
- **Order Processing**: Automated PDF invoice generation and email delivery
- **Search**: Full-text product search with filtering and sorting
- **Responsive Design**: Mobile-first design with Tailwind CSS 4

---

## 🏗️ Architecture

### Application Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 16 App Router                │
│                   (React 19 + Turbopack)                │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼────┐       ┌──────▼──────┐     ┌─────▼─────┐
   │ Public  │       │   Admin     │     │   Auth    │
   │ Routes  │       │   Routes    │     │  Routes   │
   └────┬────┘       └──────┬──────┘     └─────┬─────┘
        │                   │                   │
   ┌────▼────────────────────▼───────────────────▼─────┐
   │              API Routes Layer                      │
   │  /api/storefront/*  /api/admin/*  /api/auth/*     │
   └─────────────────────┬──────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼─────┐   ┌──────▼──────┐  ┌─────▼──────┐
   │ Business │   │   Better    │  │  ImageKit  │
   │ Services │   │    Auth     │  │   Service  │
   └────┬─────┘   └──────┬──────┘  └─────┬──────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
                  ┌──────▼──────┐
                  │   Prisma    │
                  │   Client    │
                  └──────┬──────┘
                         │
                  ┌──────▼──────┐
                  │ PostgreSQL  │
                  │  (Neon DB)  │
                  └─────────────┘
```

### Key Architectural Patterns

1. **Layered Architecture**
   - **Presentation Layer**: React Server/Client Components
   - **API Layer**: Next.js Route Handlers
   - **Business Logic Layer**: Service modules (`src/server/*`)
   - **Data Access Layer**: Prisma ORM

2. **Authentication Flow**
   - Better Auth with Prisma adapter
   - Session-based authentication with cookies
   - Role-based access control (CUSTOMER/ADMIN)

3. **State Management**
   - Server state: TanStack Query (React Query)
   - Local state: React hooks
   - Form state: React Hook Form + Zod validation

4. **File Organization**
   - Route groups for logical separation `(public)`, `(protected)`, `(auth)`, `admin`
   - Co-located components with their routes
   - Shared components in `src/components/`
   - Business logic in `src/server/`

---

## 🛠️ Tech Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.1 | React framework with App Router |
| **React** | 19.2.0 | UI library |
| **TypeScript** | 5.x | Type safety |
| **PostgreSQL** | - | Primary database (Neon) |
| **Prisma** | 6.19.0 | ORM and database toolkit |

### Authentication & Authorization

| Package | Version | Purpose |
|---------|---------|---------|
| **better-auth** | 1.3.34 | Authentication framework |
| **better-auth/react** | - | React hooks for auth |
| **prisma-adapter** | - | Prisma integration for Better Auth |

### UI & Styling

| Package | Version | Purpose |
|---------|---------|---------|
| **Tailwind CSS** | 4.1.16 | Utility-first CSS framework |
| **Radix UI** | Various | Headless UI components |
| **Lucide React** | 0.552.0 | Icon library |
| **next-themes** | 0.4.6 | Theme management |
| **Embla Carousel** | 8.6.0 | Image carousel |
| **class-variance-authority** | 0.7.1 | Component variants |
| **tailwind-merge** | 3.3.1 | Tailwind class merging |
| **clsx** | 2.1.1 | Conditional classnames |

### Forms & Validation

| Package | Version | Purpose |
|---------|---------|---------|
| **react-hook-form** | 7.66.0 | Form state management |
| **@hookform/resolvers** | 5.2.2 | Validation resolvers |
| **Zod** | 4.1.12 | Schema validation |

### Data Fetching & State

| Package | Version | Purpose |
|---------|---------|---------|
| **@tanstack/react-query** | 5.62.5 | Server state management |
| **@tanstack/react-query-devtools** | 5.62.5 | Query debugging tools |
| **@prisma/extension-accelerate** | 2.0.2 | Prisma caching layer |

### PDF Generation & Email

| Package | Version | Purpose |
|---------|---------|---------|
| **pdf-lib** | 1.17.1 | PDF document generation |
| **@pdf-lib/fontkit** | 1.1.1 | Custom font support for PDFs |
| **Resend** | - | Email delivery service (API) |

### Image Management

| Package | Version | Purpose |
|---------|---------|---------|
| **imagekit** | 6.0.0 | ImageKit SDK (server) |
| **imagekitio-react** | 4.3.0 | ImageKit React components |

### Development Tools

| Package | Version | Purpose |
|---------|---------|---------|
| **ESLint** | 9.x | Code linting |
| **eslint-config-next** | 16.0.1 | Next.js ESLint config |
| **babel-plugin-react-compiler** | 1.0.0 | React compiler plugin |
| **patch-package** | 8.0.0 | NPM package patching |

### Notifications

| Package | Version | Purpose |
|---------|---------|---------|
| **sonner** | 2.0.7 | Toast notifications |

---

## ✨ Features

### 👤 Customer Features

#### 🛒 Shopping Experience
- **Product Browsing**: Grid view with filters and sorting
- **Product Details**: Image carousel, size/color selection, reviews
- **Search**: Full-text search across products with real-time results
- **Collections**: Browse products by categories (Men, Women, Sale, etc.)
- **Responsive Design**: Optimized for mobile, tablet, and desktop

#### 🛍️ Cart & Wishlist
- **Shopping Cart**: Add items, update quantities, size/color variants
- **Wishlist**: Save favorite products with heart icon
- **Persistent State**: Cart and wishlist sync across sessions
- **Empty States**: Helpful messages with call-to-action buttons

#### 📦 Order Management
- **Checkout**: Multi-step checkout with address management
- **Order History**: View all orders with status tracking
- **Order Details**: Line items, totals, shipping address
- **PDF Invoices**: Download professional invoices with company branding
- **Email Notifications**: Automatic invoice delivery on order completion

#### 🔐 Account Management
- **Registration**: Email/password or Google OAuth
- **Profile**: Update personal information, phone, avatar
- **Addresses**: Manage multiple shipping addresses
- **Default Address**: Set preferred shipping address

### 👨‍💼 Admin Features

#### 📊 Dashboard
- **Analytics**: Revenue, orders, customers overview
- **Recent Activity**: Latest orders and customer actions
- **Reports**: Sales reports and insights

#### 🏷️ Product Management
- **CRUD Operations**: Create, edit, delete products
- **Bulk Upload**: ImageKit integration for media
- **Variants**: Size and color options
- **Inventory**: Stock tracking and SKU management
- **Pricing**: Regular and compare-at pricing
- **Publishing**: Draft/published state control

#### 📚 Collection Management
- **Category Organization**: Hierarchical collections
- **Product Assignment**: Assign products to multiple collections
- **Slug Management**: SEO-friendly URLs with validation
- **Featured Images**: Collection cover images via ImageKit

#### 📋 Order Management
- **Order Dashboard**: View and filter all orders
- **Status Management**: Update order status (Pending → Processing → Shipped → Delivered)
- **Payment Tracking**: Monitor payment status
- **Invoice Generation**: Automatic PDF creation
- **Email Delivery**: Send invoices to customers
- **Order Details**: Full order information and line items

#### 👥 Customer Management
- **Customer List**: View all registered users
- **Customer Details**: Order history and account info
- **Role Management**: Assign CUSTOMER/ADMIN roles

### 🔍 Search & Filtering

#### Product Search
- **Full-Text Search**: Search by name, description, SKU
- **Collection Search**: Find products within collections
- **Real-Time Results**: Instant search with loading states
- **Empty States**: Helpful messages when no results found
- **Responsive Images**: Optimized image loading with Next.js Image

#### Filtering & Sorting
- **Price Range**: Filter by min/max price
- **Size & Color**: Filter by available variants
- **Sort Options**: Price (low/high), newest, popularity
- **Active Filters**: Chip display with quick removal
- **Clear All**: Reset all filters at once

### 📧 Email System

#### Invoice Delivery
- **Automatic Sending**: Triggered on order status → DELIVERED
- **Professional PDFs**: Custom-branded invoices with Noto Sans fonts
- **Unicode Support**: Properly renders currency symbols (₹, $, €)
- **Email Templates**: Clean, responsive HTML emails via Resend
- **Fallback Handling**: Graceful degradation if email fails

### 🖼️ Media Management

#### ImageKit Integration
- **Cloud Storage**: Centralized image hosting
- **Transformations**: On-the-fly image resizing and optimization
- **Upload Authentication**: Secure signed uploads
- **File Organization**: Folder-based structure
- **Deletion Management**: Clean up unused media

---

## 🌍 Environment Variables

Create a `.env` file in the root directory with the following variables:

### Required Variables

```bash
# Database Configuration (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# Authentication
BETTER_AUTH_SECRET="your-secure-random-string-min-32-characters"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email Service (Resend)
RESEND_API_KEY="re_YourResendApiKey"
RESEND_FROM_EMAIL="onboarding@resend.dev"  # Use onboarding@resend.dev for testing
```

### Optional Variables

```bash
# Google OAuth (optional but recommended)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# ImageKit (for media management)
IMAGEKIT_PUBLIC_KEY="public_your_imagekit_public_key"
IMAGEKIT_PRIVATE_KEY="private_your_imagekit_private_key"
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your_imagekit_id"
IMAGEKIT_UPLOAD_FOLDER="/products"  # Default upload folder
```

### Environment Variable Details

| Variable | Purpose | Required | Example |
|----------|---------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ | `postgresql://...` |
| `BETTER_AUTH_SECRET` | Session encryption key | ✅ | Random 32+ char string |
| `BETTER_AUTH_URL` | Auth service URL | ✅ | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | Public app URL | ✅ | `http://localhost:3000` |
| `RESEND_API_KEY` | Resend API key for emails | ✅ | `re_...` |
| `RESEND_FROM_EMAIL` | Sender email address | ✅ | `orders@yourdomain.com` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ❌ | `...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | ❌ | OAuth secret string |
| `IMAGEKIT_PUBLIC_KEY` | ImageKit public key | ❌ | Public key string |
| `IMAGEKIT_PRIVATE_KEY` | ImageKit private key | ❌ | Private key string |
| `IMAGEKIT_URL_ENDPOINT` | ImageKit CDN endpoint | ❌ | `https://ik.imagekit.io/...` |
| `IMAGEKIT_UPLOAD_FOLDER` | Default upload directory | ❌ | `/products` |

### Setting Up Services

#### 1. Neon Database
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Remove `channel_binding=require` if present

#### 2. Resend Email
1. Sign up at [resend.com](https://resend.com)
2. Get your API key from dashboard
3. For testing: use `onboarding@resend.dev`
4. For production: verify your domain

#### 3. Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Set authorized origins: `http://localhost:3000`
4. Set redirect URI: `http://localhost:3000/api/auth/callback/google`

#### 4. ImageKit
1. Sign up at [imagekit.io](https://imagekit.io)
2. Get your public/private keys
3. Copy your URL endpoint
4. Configure upload folder structure

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 18.x or higher
- **pnpm**: 8.x or higher (recommended) or npm
- **PostgreSQL**: Neon account or local PostgreSQL

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sanjeev0303/hub_fashiion.git
   cd hub_fashiion
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Generate Prisma client**
   ```bash
   pnpm exec prisma generate
   ```

5. **Run database migrations**
   ```bash
   # For development (creates and applies migrations)
   pnpm exec prisma migrate dev --name init

   # For production (applies existing migrations)
   pnpm exec prisma migrate deploy
   ```

6. **Seed the database (optional)**
   ```bash
   # Create initial admin user and sample data
   pnpm exec prisma db seed
   ```

7. **Start development server**
   ```bash
   pnpm dev
   ```

8. **Open your browser**
   ```
   http://localhost:3000
   ```

### NPM Scripts

```bash
# Development
pnpm dev          # Start dev server with Turbopack
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint

# Database
pnpm exec prisma studio          # Open Prisma Studio
pnpm exec prisma migrate dev     # Create and apply migration
pnpm exec prisma migrate deploy  # Apply migrations in production
pnpm exec prisma generate        # Generate Prisma Client
pnpm exec prisma db push         # Push schema without migration
```

---

## 📁 Project Structure

```
hub_fashiion/
├── prisma/
│   └── schema.prisma              # Database schema
├── public/                        # Static assets
│   ├── fonts/                     # Custom fonts (Noto Sans)
│   └── images/                    # Static images
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/                # Auth routes (sign-in, sign-up)
│   │   ├── (protected)/           # Protected routes (profile, orders)
│   │   ├── (public)/              # Public routes (products, collections)
│   │   ├── admin/                 # Admin dashboard
│   │   ├── api/                   # API route handlers
│   │   │   ├── admin/             # Admin API endpoints
│   │   │   ├── auth/              # Better Auth endpoints
│   │   │   ├── profile/           # User profile APIs
│   │   │   └── storefront/        # Public storefront APIs
│   │   ├── globals.css            # Global styles
│   │   ├── layout.tsx             # Root layout
│   │   └── not-found.tsx          # 404 page
│   ├── assets/                    # Asset files
│   │   └── fonts/                 # Font files (Noto Sans TTF)
│   ├── components/                # React components
│   │   ├── admin/                 # Admin components
│   │   ├── auth/                  # Auth forms
│   │   ├── cart/                  # Cart components
│   │   ├── checkout/              # Checkout flow
│   │   ├── collections/           # Collection components
│   │   ├── layout/                # Layout components (Navbar, Footer)
│   │   ├── orders/                # Order components
│   │   ├── products/              # Product components
│   │   ├── profile/               # Profile components
│   │   ├── providers/             # Context providers
│   │   ├── ui/                    # Reusable UI components
│   │   └── wishlist/              # Wishlist components
│   ├── config/                    # Configuration files
│   │   └── site.ts                # Site metadata
│   ├── generated/                 # Generated files
│   │   └── prisma/                # Prisma Client
│   ├── hooks/                     # Custom React hooks
│   ├── lib/                       # Utility libraries
│   │   ├── auth.ts                # Better Auth configuration
│   │   ├── auth-client.ts         # Auth client hooks
│   │   ├── auth-helpers.ts        # Auth utility functions
│   │   ├── db.ts                  # Prisma client instance
│   │   ├── imagekit.ts            # ImageKit configuration
│   │   ├── mail.ts                # Email utilities
│   │   └── utils.ts               # General utilities
│   └── server/                    # Server-side business logic
│       ├── cart-service.ts        # Cart operations
│       ├── invoice-service.ts     # PDF invoice generation
│       ├── order-service.ts       # Order management
│       ├── profile-service.ts     # Profile operations
│       └── storefront-service.ts  # Storefront data
├── .env                           # Environment variables
├── .env.example                   # Environment template
├── .gitignore                     # Git ignore rules
├── eslint.config.mjs              # ESLint configuration
├── next.config.ts                 # Next.js configuration
├── package.json                   # Dependencies
├── pnpm-lock.yaml                 # Lock file
├── postcss.config.mjs             # PostCSS config
├── README.md                      # This file
└── tsconfig.json                  # TypeScript configuration
```

---

## 🔌 API Documentation

### Authentication APIs

**Base Path**: `/api/auth/*`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/sign-in` | POST | Email/password sign-in |
| `/api/auth/sign-up` | POST | Create new account |
| `/api/auth/sign-out` | POST | Sign out current session |
| `/api/auth/session` | GET | Get current session |
| `/api/auth/callback/google` | GET | Google OAuth callback |

### Storefront APIs

**Base Path**: `/api/storefront/*`

#### Cart
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/storefront/cart` | GET | Get user's cart |
| `/api/storefront/cart/items` | POST | Add item to cart |
| `/api/storefront/cart/items` | PATCH | Update cart item quantity |
| `/api/storefront/cart/items` | DELETE | Remove item from cart |
| `/api/storefront/cart/clear` | POST | Clear entire cart |

#### Wishlist
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/storefront/wishlist` | GET | Get user's wishlist |
| `/api/storefront/wishlist/items` | POST | Add item to wishlist |
| `/api/storefront/wishlist/items` | DELETE | Remove item from wishlist |

#### Orders
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/storefront/orders` | GET | Get user's orders |
| `/api/storefront/orders` | POST | Create new order |
| `/api/storefront/orders/[orderId]` | GET | Get order details |
| `/api/storefront/orders/[orderId]/invoice` | GET | Download PDF invoice |

#### Other
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/storefront/commerce-counts` | GET | Cart/wishlist counts |
| `/api/storefront/reviews` | GET/POST | Product reviews |
| `/api/storefront/search` | GET | Product search |

### Admin APIs

**Base Path**: `/api/admin/*`

#### Products
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/products` | GET | List all products |
| `/api/admin/products` | POST | Create product |
| `/api/admin/products/[productId]` | GET | Get product details |
| `/api/admin/products/[productId]` | PUT | Update product |
| `/api/admin/products/[productId]` | DELETE | Delete product |

#### Collections
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/collections` | GET | List collections |
| `/api/admin/collections` | POST | Create collection |
| `/api/admin/collections/[collectionId]` | PUT | Update collection |
| `/api/admin/collections/[collectionId]` | DELETE | Delete collection |

#### Orders
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/order` | GET | List all orders |
| `/api/admin/order/[orderId]` | GET | Get order details |
| `/api/admin/order/[orderId]` | PATCH | Update order status |

#### Customers
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/customer` | GET | List customers |
| `/api/admin/customer/[userId]` | GET | Get customer details |
| `/api/admin/customer/[userId]` | PATCH | Update customer |

#### Media
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/upload/imagekit` | POST | Get ImageKit auth params |

#### Reports
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/report` | GET | Get analytics data |

### Profile APIs

**Base Path**: `/api/profile/*`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/profile` | GET | Get user profile |
| `/api/profile` | PATCH | Update profile |
| `/api/profile/addresses` | GET | List addresses |
| `/api/profile/addresses` | POST | Create address |
| `/api/profile/addresses/[addressId]` | PUT | Update address |
| `/api/profile/addresses/[addressId]` | DELETE | Delete address |
| `/api/profile/addresses/[addressId]/default` | PUT | Set default address |

---

## 🗄️ Database Schema

### Core Models

#### User
```prisma
model User {
  id               String        @id
  name             String
  email            String        @unique
  emailVerified    Boolean       @default(false)
  phoneNumber      String?
  image            String?
  avatarFileId     String?
  role             UserRole      @default(CUSTOMER)
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  
  // Relations
  sessions         Session[]
  accounts         Account[]
  orders           Order[]
  reviews          Review[]
  cart             Cart?
  wishlist         Wishlist?
  addresses        UserAddress[]
  defaultAddress   UserAddress?
}
```

#### Product
```prisma
model Product {
  id             String              @id @default(cuid())
  name           String
  slug           String              @unique
  description    String?
  sku            String?
  price          Decimal             @db.Decimal(10, 2)
  compareAtPrice Decimal?            @db.Decimal(10, 2)
  stock          Int                 @default(0)
  mediaUrls      String[]            @default([])
  mediaFileIds   String[]            @default([])
  sizeOptions    String[]            @default([])
  colorOptions   String[]            @default([])
  isPublished    Boolean             @default(true)
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt
  
  // Relations
  collections    ProductCollection[]
  reviews        Review[]
  orderItems     OrderItem[]
  cartItems      CartItem[]
  wishlistItems  WishlistItem[]
}
```

#### Order
```prisma
model Order {
  id              String        @id @default(cuid())
  orderNumber     String        @unique
  status          OrderStatus   @default(PENDING)
  paymentStatus   PaymentStatus @default(PENDING)
  subtotal        Decimal       @db.Decimal(10, 2)
  shippingFee     Decimal?      @db.Decimal(10, 2)
  tax             Decimal?      @db.Decimal(10, 2)
  total           Decimal       @db.Decimal(10, 2)
  currency        String        @default("USD")
  notes           String?
  placedAt        DateTime      @default(now())
  fulfilledAt     DateTime?
  cancelledAt     DateTime?
  shippingAddress Json?
  billingAddress  Json?
  userId          String
  
  // Relations
  user            User          @relation(...)
  items           OrderItem[]
}
```

### Enums

```prisma
enum UserRole {
  CUSTOMER
  ADMIN
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  RETURNED
}

enum PaymentStatus {
  PENDING
  PAID
  REFUNDED
  FAILED
}
```

### Relationships

- **User ↔ Cart**: One-to-One
- **User ↔ Wishlist**: One-to-One
- **User ↔ Orders**: One-to-Many
- **User ↔ Addresses**: One-to-Many
- **Product ↔ Collections**: Many-to-Many (via ProductCollection)
- **Order ↔ OrderItems**: One-to-Many
- **Collection ↔ Collection**: Self-referential (parent-child hierarchy)

---

## ❗ Troubleshooting

### Common Issues

#### 1. Database Connection Errors

**Problem**: `P1001: Can't reach database server`

**Solutions**:
- Remove `channel_binding=require` from `DATABASE_URL`
- Use the non-pooled connection string from Neon
- Check firewall/network settings
- Verify database is running

#### 2. Google OAuth Not Working

**Problem**: Google button doesn't redirect

**Solutions**:
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Check authorized origins in Google Cloud Console
- Restart dev server after changing environment variables
- Ensure redirect URI matches: `http://localhost:3000/api/auth/callback/google`

#### 3. Prisma Migration Errors

**Problem**: `P2021: The table does not exist in the current database`

**Solutions**:
```bash
# Reset database (WARNING: deletes all data)
pnpm exec prisma migrate reset

# Or apply migrations
pnpm exec prisma migrate deploy
```

#### 4. Invoice Generation Fails

**Problem**: PDF invoice doesn't download or errors

**Solutions**:
- Check font files exist in `public/fonts/NotoSans-*.ttf`
- Verify order has all required data
- Check browser console for errors
- Ensure `pdf-lib` and `@pdf-lib/fontkit` are installed

#### 5. Email Not Sending

**Problem**: Invoice emails not delivered

**Solutions**:
- Verify `RESEND_API_KEY` is valid
- Use `onboarding@resend.dev` for testing
- Check Resend dashboard for delivery status
- Verify domain is verified (for production)
- Check order status is set to `DELIVERED`

#### 6. ImageKit Upload Fails

**Problem**: Images won't upload

**Solutions**:
- Verify all ImageKit environment variables are set
- Check ImageKit dashboard for API key status
- Ensure upload folder exists in ImageKit
- Check browser console for CORS errors

#### 7. Search Not Working

**Problem**: Search returns no results

**Solutions**:
- Ensure products are marked as `isPublished: true`
- Check products have name/description fields
- Verify database connection
- Clear browser cache and reload

#### 8. Build Errors

**Problem**: `pnpm build` fails

**Solutions**:
```bash
# Clean build artifacts
rm -rf .next

# Regenerate Prisma Client
pnpm exec prisma generate

# Rebuild
pnpm build
```

### Development Tips

1. **Hot Reload Issues**: Restart dev server if changes aren't reflected
2. **TypeScript Errors**: Run `pnpm exec prisma generate` after schema changes
3. **Port Already in Use**: Kill process on port 3000 or use different port
4. **Memory Issues**: Increase Node memory: `NODE_OPTIONS="--max-old-space-size=4096" pnpm dev`

---

## 📚 Additional Documentation

- [SEARCH_FUNCTIONALITY.md](./SEARCH_FUNCTIONALITY.md) - Search implementation details
- [INVOICE_EMAIL_SETUP.md](./INVOICE_EMAIL_SETUP.md) - Email configuration guide
- [COLLECTION_LOADING_IMPLEMENTATION.md](./COLLECTION_LOADING_IMPLEMENTATION.md) - Loading states
- [COLLECTION_NOT_FOUND_FIX.md](./COLLECTION_NOT_FOUND_FIX.md) - 404 page implementation

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add some feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a pull request

---

## 📄 License

This project is private and proprietary.

---

## 👥 Authors

- **Sanjeev** - [@sanjeev0303](https://github.com/sanjeev0303)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Better Auth](https://www.better-auth.com/) - Authentication
- [Prisma](https://www.prisma.io/) - Database ORM
- [Radix UI](https://www.radix-ui.com/) - Headless UI components
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [ImageKit](https://imagekit.io/) - Image management
- [Resend](https://resend.com/) - Email delivery

---

## 📞 Support

For support, email support@hubfashion.com or open an issue in the repository.
