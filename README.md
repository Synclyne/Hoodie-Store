# HOODIE Store — Full-Stack E-Commerce Platform

A production-ready clothing store built with **React**, **Node.js/Express**, **MongoDB**, and **Stripe**.

---

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Frontend | React 18, React Router v6, Stripe.js   |
| Backend  | Node.js, Express, JWT auth             |
| Database | MongoDB (Mongoose ODM)                 |
| Payments | Stripe (PaymentIntents API)            |
| Hosting  | Render (backend) + Vercel (frontend)   |

---

## Project Structure

```
hoodie-store/
├── backend/
│   ├── src/
│   │   ├── middleware/     # auth.js, errorHandler.js
│   │   ├── models/         # User, Product, Cart, Order
│   │   ├── routes/         # auth, products, cart, orders, payments, admin
│   │   ├── utils/          # db.js, seed.js
│   │   └── server.js
│   ├── uploads/            # local image uploads
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/     # Navbar, CartDrawer, ProductCard, Toast
│   │   ├── context/        # AuthContext, CartContext
│   │   ├── pages/          # All customer + admin pages
│   │   ├── utils/          # api.js (axios instance)
│   │   ├── App.js
│   │   └── index.js
│   ├── .env.example
│   └── package.json
└── package.json            # root convenience scripts
```

---

## Local Setup (5 minutes)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd hoodie-store

# Install all dependencies (both backend and frontend)
npm run install:all
```

### 2. Configure environment variables

**Backend** — copy and fill in:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/hoodie_store
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_EXPIRES_IN=7d
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLIENT_URL=http://localhost:3000
ADMIN_EMAIL=admin@yourstore.com
ADMIN_PASSWORD=ChangeMe123!
```

**Frontend** — copy and fill in:
```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:
```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Start MongoDB

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Ubuntu/Debian
sudo systemctl start mongod

# Or use MongoDB Atlas (cloud) — paste the connection string in MONGODB_URI
```

### 4. Seed the database

```bash
npm run seed
```

This creates:
- **Admin account**: `admin@yourstore.com` / `ChangeMe123!`
- **Sample customer**: `customer@example.com` / `Customer123!`
- **6 sample products** with variants and stock

### 5. Run the project

```bash
# Run both backend and frontend together
npm run dev

# Or separately:
npm run dev:backend    # http://localhost:5000
npm run dev:frontend   # http://localhost:3000
```

---

## Stripe Setup

### Test payments
Use Stripe test card: `4242 4242 4242 4242` · any future expiry · any CVC

### Webhook (local testing)
```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:5000/api/payments/webhook
# Copy the webhook secret → paste into STRIPE_WEBHOOK_SECRET in .env
```

---

## Features

### Customer
- ✅ Register / Login / JWT auth
- ✅ Browse products with filters (category, gender, price)
- ✅ Full product detail page (variants, size/colour picker, reviews)
- ✅ Persistent cart (per user, synced to DB)
- ✅ Stripe checkout with real payment
- ✅ Order confirmation with status tracker
- ✅ Order history page
- ✅ Account management (profile, password, addresses)

### Admin (`/admin`)
- ✅ Analytics dashboard (revenue, orders, customers, top products)
- ✅ Revenue chart (last 6 months)
- ✅ Product CRUD (create, edit, publish/unpublish, delete)
- ✅ Variant management (size × colour × stock)
- ✅ Order management (update status, add tracking number)
- ✅ View all customers

---

## Deployment

### Backend → Render.com

1. Push code to GitHub
2. New Web Service on [render.com](https://render.com)
3. **Root directory**: `backend`
4. **Build command**: `npm install`
5. **Start command**: `node src/server.js`
6. Add all environment variables from `backend/.env.example`
7. Set `NODE_ENV=production` and `CLIENT_URL=https://your-frontend.vercel.app`

### Frontend → Vercel

1. New project on [vercel.com](https://vercel.com)
2. **Root directory**: `frontend`
3. **Build command**: `npm run build`
4. **Output directory**: `build`
5. Add environment variables:
   - `REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_...`
   - `REACT_APP_API_URL=https://your-backend.onrender.com/api`

### Database → MongoDB Atlas (free tier)

1. Create cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Add your server IP to Network Access
3. Copy connection string → paste into `MONGODB_URI`

---

## API Reference

### Auth
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Sign in |
| GET | `/api/auth/me` | ✅ | Get profile |
| PUT | `/api/auth/me` | ✅ | Update profile |
| PUT | `/api/auth/change-password` | ✅ | Change password |

### Products
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/products` | List with filters |
| GET | `/api/products/featured` | Featured products |
| GET | `/api/products/:slug` | Single product |
| GET | `/api/products/:slug/related` | Related products |
| POST | `/api/products/:id/reviews` | Add review (auth) |

### Cart
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/cart` | Get cart |
| POST | `/api/cart/items` | Add item |
| PUT | `/api/cart/items/:itemId` | Update qty |
| DELETE | `/api/cart/items/:itemId` | Remove item |
| DELETE | `/api/cart` | Clear cart |

### Orders
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/orders` | My orders |
| GET | `/api/orders/:id` | Single order |

### Payments
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/payments/create-intent` | Create Stripe PaymentIntent |
| POST | `/api/payments/confirm-order` | Confirm order after payment |
| POST | `/api/payments/webhook` | Stripe webhook |

### Admin (admin only)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/products` | All products |
| GET | `/api/admin/products/:id` | Single product |
| POST | `/api/admin/products` | Create product |
| PUT | `/api/admin/products/:id` | Update product |
| DELETE | `/api/admin/products/:id` | Unpublish product |
| GET | `/api/admin/orders` | All orders |
| PUT | `/api/admin/orders/:id` | Update order |
| GET | `/api/admin/users` | All users |
| GET | `/api/admin/analytics` | Dashboard stats |
| GET | `/api/admin/analytics/revenue-chart` | Revenue chart data |

---

## Customisation Guide

### Change brand name
Search and replace `HOODIE` in:
- `frontend/public/index.html` (title, meta)
- `frontend/src/pages/HomePage.js` (hero, footer)
- `frontend/src/components/Navbar.js` (logo)

### Change currency
- Backend: `backend/src/routes/payments.js` → change `currency: 'kes'` to your ISO code
- Frontend: Replace all `KSh` format strings in `fmt()` helpers

### Change shipping threshold
- Backend: `payments.js` → `subtotal >= 5000 ? 0 : 500`
- Frontend: Same threshold in `CartPage.js`, `CartDrawer.js`, `CheckoutPage.js`

### Change VAT rate
- Backend: `payments.js` → `subtotal * 0.16`
- Frontend: Same in `CartPage.js`, `CartDrawer.js`, `CheckoutPage.js`

---

## License
MIT — use freely for commercial projects.
