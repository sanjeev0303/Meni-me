# Hub Fashion - System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                           │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Customer   │  │    Admin     │  │     Auth     │        │
│  │   Frontend   │  │  Dashboard   │  │    Pages     │        │
│  │  (React 19)  │  │  (React 19)  │  │  (React 19)  │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                  │                  │                 │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
┌─────────────────────────────▼─────────────────────────────────┐
│                    NEXT.JS 16 APP ROUTER                       │
│                      (Turbopack)                               │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Server Components (SSR/RSC)                │  │
│  │  ├─ Layout Components                                   │  │
│  │  ├─ Page Components                                     │  │
│  │  └─ Loading/Error Boundaries                            │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Client Components (CSR)                    │  │
│  │  ├─ Interactive Forms (React Hook Form)                │  │
│  │  ├─ State Management (TanStack Query)                  │  │
│  │  └─ UI Components (Radix UI)                           │  │
│  └─────────────────────────────────────────────────────────┘  │
└────────────────────────────┬───────────────────────────────────┘
                             │
┌─────────────────────────────▼─────────────────────────────────┐
│                      API ROUTES LAYER                          │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  /api/auth   │  │/api/storefront│  │  /api/admin  │        │
│  │  (Better     │  │   (Public)    │  │  (Protected) │        │
│  │   Auth)      │  │               │  │              │        │
│  └──────┬───────┘  └──────┬────────┘  └──────┬───────┘        │
│         │                  │                  │                 │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
┌─────────────────────────────▼─────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                         │
│                     (Server Services)                          │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │Cart Service  │  │Order Service │  │Profile Service│       │
│  │              │  │              │  │              │        │
│  │- Add items   │  │- Create order│  │- Update user │        │
│  │- Update qty  │  │- Track status│  │- Manage addr │        │
│  │- Clear cart  │  │- Generate PDF│  │- Handle auth │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                  │                  │                 │
│  ┌──────▼──────────────────▼──────────────────▼───────┐        │
│  │          Invoice Service (PDF Generation)          │        │
│  │  ├─ pdf-lib                                        │        │
│  │  ├─ @pdf-lib/fontkit (Noto Sans fonts)            │        │
│  │  └─ Email delivery (Resend API)                   │        │
│  └────────────────────────────────────────────────────┘        │
└────────────────────────────┬───────────────────────────────────┘
                             │
┌─────────────────────────────▼─────────────────────────────────┐
│                    DATA ACCESS LAYER                           │
│                      (Prisma ORM)                              │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                  Prisma Client                          │  │
│  │  ├─ Type-safe queries                                  │  │
│  │  ├─ Relation loading                                   │  │
│  │  ├─ Transaction support                                │  │
│  │  └─ Migration management                               │  │
│  └─────────────────────────────────────────────────────────┘  │
└────────────────────────────┬───────────────────────────────────┘
                             │
┌─────────────────────────────▼─────────────────────────────────┐
│                     DATABASE LAYER                             │
│                    PostgreSQL (Neon)                           │
│                                                                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐              │
│  │   Users    │  │  Products  │  │   Orders   │              │
│  │  Sessions  │  │Collections │  │ OrderItems │              │
│  │  Accounts  │  │  Reviews   │  │            │              │
│  └────────────┘  └────────────┘  └────────────┘              │
│                                                                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐              │
│  │    Cart    │  │  Wishlist  │  │  Addresses │              │
│  │ CartItems  │  │WishlistItem│  │            │              │
│  └────────────┘  └────────────┘  └────────────┘              │
└────────────────────────────────────────────────────────────────┘


                    EXTERNAL SERVICES
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐      ┌──────▼──────┐    ┌─────▼─────┐
   │ImageKit │      │   Resend    │    │  Google   │
   │  (CDN)  │      │   (Email)   │    │   OAuth   │
   │         │      │             │    │           │
   │- Upload │      │- Send PDF   │    │- Sign In  │
   │- Transform│    │- Templates  │    │- Profile  │
   │- Optimize│     │- Tracking   │    │           │
   └─────────┘      └─────────────┘    └───────────┘
```

---

## Data Flow Diagrams

### 1. User Authentication Flow

```
┌──────────┐
│  User    │
│  Browser │
└────┬─────┘
     │
     │ 1. Sign In Request
     ▼
┌─────────────────┐
│  Sign In Page   │
│  (Client)       │
└────┬────────────┘
     │
     │ 2. POST /api/auth/sign-in
     ▼
┌─────────────────┐
│  Better Auth    │
│  Handler        │
└────┬────────────┘
     │
     │ 3. Verify Credentials
     ▼
┌─────────────────┐
│  Prisma         │
│  (Query User)   │
└────┬────────────┘
     │
     │ 4. Create Session
     ▼
┌─────────────────┐
│  Set Cookie     │
│  Return Token   │
└────┬────────────┘
     │
     │ 5. Redirect
     ▼
┌──────────┐
│Dashboard │
└──────────┘
```

### 2. Product Browsing Flow

```
┌──────────┐
│   User   │
└────┬─────┘
     │
     │ 1. Visit /collections/men
     ▼
┌─────────────────────┐
│  Server Component   │
│  (SSR)              │
└────┬────────────────┘
     │
     │ 2. Fetch Collection Data
     ▼
┌─────────────────────┐
│ Storefront Service  │
│ (Server)            │
└────┬────────────────┘
     │
     │ 3. Query Products
     ▼
┌─────────────────────┐
│   Prisma Client     │
│   (SQL Query)       │
└────┬────────────────┘
     │
     │ 4. Return Products
     ▼
┌─────────────────────┐
│  Product Grid       │
│  (Rendered HTML)    │
└────┬────────────────┘
     │
     │ 5. Hydrate Client
     ▼
┌─────────────────────┐
│ Interactive Features│
│ (Wishlist, Cart)    │
└─────────────────────┘
```

### 3. Cart Management Flow

```
┌──────────┐
│   User   │
└────┬─────┘
     │
     │ 1. Click "Add to Cart"
     ▼
┌─────────────────────┐
│  Client Component   │
│  (useState)         │
└────┬────────────────┘
     │
     │ 2. POST /api/storefront/cart/items
     ▼
┌─────────────────────┐
│   Auth Check        │
│   (Middleware)      │
└────┬────────────────┘
     │
     │ 3. Call Cart Service
     ▼
┌─────────────────────┐
│   Cart Service      │
│   (Business Logic)  │
└────┬────────────────┘
     │
     │ 4. Upsert CartItem
     ▼
┌─────────────────────┐
│   Prisma Client     │
│   (Transaction)     │
└────┬────────────────┘
     │
     │ 5. Return Updated Cart
     ▼
┌─────────────────────┐
│  TanStack Query     │
│  (Cache Update)     │
└────┬────────────────┘
     │
     │ 6. Rerender UI
     ▼
┌──────────┐
│  Cart    │
│  Badge   │
└──────────┘
```

### 4. Order Processing Flow

```
┌──────────┐
│   User   │
└────┬─────┘
     │
     │ 1. Click "Place Order"
     ▼
┌─────────────────────┐
│  Checkout Page      │
│  (Form Validation)  │
└────┬────────────────┘
     │
     │ 2. POST /api/storefront/orders
     ▼
┌─────────────────────┐
│   Order Service     │
│   (Create Order)    │
└────┬────────────────┘
     │
     │ 3. Database Transaction
     ▼
┌─────────────────────┐
│   Prisma            │
│   - Create Order    │
│   - Create Items    │
│   - Clear Cart      │
└────┬────────────────┘
     │
     │ 4. Return Order
     ▼
┌─────────────────────┐
│   Success Page      │
│   (Order Details)   │
└─────────────────────┘

     [Admin Updates Status]
             │
             │ PATCH /api/admin/order/[id]
             ▼
┌─────────────────────┐
│   Order Service     │
│   (Update Status)   │
└────┬────────────────┘
     │
     │ If status = DELIVERED
     ▼
┌─────────────────────┐
│  Invoice Service    │
│  - Generate PDF     │
│  - Send Email       │
└────┬────────────────┘
     │
     │ Send via Resend API
     ▼
┌──────────┐
│ Customer │
│  Email   │
└──────────┘
```

### 5. Search Flow

```
┌──────────┐
│   User   │
└────┬─────┘
     │
     │ 1. Type search query
     ▼
┌─────────────────────┐
│   Navbar Search     │
│   (useState)        │
└────┬────────────────┘
     │
     │ 2. Press Enter
     ▼
┌─────────────────────┐
│  Navigate to        │
│  /search?q=...      │
└────┬────────────────┘
     │
     │ 3. GET /api/storefront/search?q=...
     ▼
┌─────────────────────┐
│   Search API        │
│   (Route Handler)   │
└────┬────────────────┘
     │
     │ 4. Full-text search
     ▼
┌─────────────────────┐
│   Prisma Query      │
│   WHERE name/desc   │
│   CONTAINS query    │
└────┬────────────────┘
     │
     │ 5. Return results
     ▼
┌─────────────────────┐
│  Search Results     │
│  Component          │
└────┬────────────────┘
     │
     │ 6. Render Grid
     ▼
┌──────────┐
│ Product  │
│  Cards   │
└──────────┘
```

---

## Component Architecture

### Public Routes (Storefront)

```
app/(public)/
├── layout.tsx                    # Public layout with navbar
├── page.tsx                      # Homepage
├── products/
│   ├── page.tsx                  # Product listing
│   └── [slug]/
│       └── page.tsx              # Product detail
├── collections/
│   ├── page.tsx                  # All collections
│   └── [slug]/
│       ├── page.tsx              # Collection products (SSR)
│       ├── collection-page-client.tsx  # Client interactions
│       ├── loading.tsx           # Loading skeleton
│       └── not-found.tsx         # 404 page
├── cart/
│   └── page.tsx                  # Cart page
├── checkout/
│   └── page.tsx                  # Checkout flow
└── search/
    ├── page.tsx                  # Search results (SSR)
    └── search-results-client.tsx # Client component
```

### Protected Routes (Customer)

```
app/(protected)/
├── layout.tsx                    # Protected layout
├── profile/
│   └── page.tsx                  # User profile
├── orders/
│   ├── page.tsx                  # Order history
│   └── [id]/
│       └── page.tsx              # Order details
└── wishlist/
    └── page.tsx                  # Wishlist
```

### Admin Routes

```
app/admin/
├── layout.tsx                    # Admin layout with sidebar
├── page.tsx                      # Admin dashboard
├── products/
│   └── page.tsx                  # Product management
├── collections/
│   └── page.tsx                  # Collection management
├── order/
│   └── page.tsx                  # Order management
├── customer/
│   └── page.tsx                  # Customer management
├── dashboard/
│   └── page.tsx                  # Analytics
└── report/
    └── page.tsx                  # Reports
```

### Shared Components

```
src/components/
├── layout/
│   ├── navbar.tsx                # Main navigation
│   ├── footer.tsx                # Site footer
│   └── sidebar.tsx               # Admin sidebar
├── products/
│   ├── product-card.tsx          # Product display
│   ├── product-grid.tsx          # Grid layout
│   └── product-carousel.tsx      # Image carousel
├── cart/
│   ├── cart-item.tsx             # Cart item row
│   └── cart-summary.tsx          # Totals
├── ui/
│   ├── button.tsx                # Button component
│   ├── input.tsx                 # Input field
│   ├── dialog.tsx                # Modal dialog
│   └── ...                       # Other UI primitives
└── providers/
    ├── query-provider.tsx        # TanStack Query
    └── toast-provider.tsx        # Toast notifications
```

---

## State Management Strategy

### Server State (TanStack Query)

```typescript
// Used for data fetched from APIs
const { data, isLoading, error } = useQuery({
  queryKey: ['products', collectionSlug],
  queryFn: () => fetchProducts(collectionSlug),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### Client State (React Hooks)

```typescript
// Used for UI state (modals, filters, etc.)
const [isOpen, setIsOpen] = useState(false);
const [filters, setFilters] = useState({
  minPrice: 0,
  maxPrice: 10000,
});
```

### Form State (React Hook Form)

```typescript
// Used for forms with validation
const { register, handleSubmit, formState } = useForm({
  resolver: zodResolver(schema),
});
```

### URL State (Next.js Router)

```typescript
// Used for shareable state (filters, pagination)
const router = useRouter();
const searchParams = useSearchParams();
const page = searchParams.get('page') || '1';
```

---

## Security Architecture

### Authentication Layers

1. **Session Management**: Better Auth with secure cookies
2. **Route Protection**: Middleware checks for authenticated users
3. **API Authorization**: Role-based access control (RBAC)
4. **CSRF Protection**: Built into Better Auth

### Data Protection

1. **SQL Injection**: Prisma parameterized queries
2. **XSS Protection**: React auto-escaping + CSP headers
3. **Password Hashing**: Better Auth bcrypt hashing
4. **Environment Variables**: Secrets not in code

---

## Performance Optimizations

### Frontend

1. **Server Components**: Default for non-interactive content
2. **Code Splitting**: Automatic route-based splitting
3. **Image Optimization**: Next.js Image + ImageKit CDN
4. **Lazy Loading**: Dynamic imports for heavy components
5. **Prefetching**: Link prefetching for navigation

### Backend

1. **Database Indexes**: On frequently queried columns
2. **Connection Pooling**: Prisma connection pooling
3. **Query Optimization**: Selective field loading
4. **Caching**: TanStack Query + Prisma Accelerate
5. **Pagination**: Cursor-based pagination

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Vercel Edge                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Caching   │  │     CDN     │  │   Routing   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│              Next.js Application                    │
│  ┌─────────────────────────────────────────────┐   │
│  │   Server Components (Lambda Functions)     │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │   API Routes (Lambda Functions)             │   │
│  └─────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────▼────┐    ┌─────▼─────┐   ┌────▼────┐
   │  Neon   │    │ ImageKit  │   │ Resend  │
   │   DB    │    │    CDN    │   │  Email  │
   └─────────┘    └───────────┘   └─────────┘
```

---

This architecture provides:
- ✅ Scalability through serverless functions
- ✅ Security through layered protection
- ✅ Performance through caching and optimization
- ✅ Maintainability through clear separation of concerns
- ✅ Reliability through managed services
