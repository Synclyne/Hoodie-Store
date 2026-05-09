# HOODIE Store

Full-stack streetwear store built with Next.js, Node.js/Express, MongoDB, JWT auth, and Flutterwave payments.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 18, route-level SEO |
| Backend | Node.js, Express, JWT auth |
| Database | MongoDB, Mongoose |
| Payments | Flutterwave, Cash on Delivery |
| Hosting | Render backend + Vercel frontend |

## Project Structure

```text
hoodie-store/
  backend/
    src/
      middleware/
      models/
      routes/
      utils/
      server.js
    uploads/
    package.json
  frontend/
    pages/                 Next.js routes, SEO, sitemap, robots
    public/                static assets
    src/
      components/
      context/
      hooks/
      next/                Next shell, SEO helpers, router compatibility
      pages/               storefront/admin screen components
      styles/
      utils/
    .env.example
    next.config.js
    package.json
  package.json             root convenience scripts
```

## Local Setup

Install dependencies:

```bash
npm run install:all
```

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/hoodie_store
JWT_SECRET=<secure random value>
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
ADMIN_EMAIL=admin@yourstore.com
ADMIN_PASSWORD=ChangeMe123!
```

Create `frontend/.env` from `frontend/.env.example`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Seed and run:

```bash
npm run seed
npm run dev
```

Frontend: `http://localhost:3000`
Backend: `http://localhost:5000`

## SEO

The frontend is now served by Next.js route files instead of a single CRA shell.

- Public routes emit route-specific titles, descriptions, canonicals, Open Graph tags, and Twitter card tags.
- Product pages fetch product data during server rendering and emit product-specific metadata.
- Product pages include Product JSON-LD when product data is available.
- The homepage includes ClothingStore JSON-LD.
- `/robots.txt` and `/sitemap.xml` are served by Next.js.
- `/sitemap.xml` includes static storefront routes and published products from `GET /api/products/seo/sitemap`.
- Private, auth, checkout, and admin pages are marked `noindex`.

Set `NEXT_PUBLIC_SITE_URL` to the production domain before deployment so canonical URLs and sitemap URLs are correct.

## Scripts

Root:

```bash
npm run install:all
npm run dev
npm run build
npm run start
npm run seed
```

Frontend:

```bash
npm run dev --prefix frontend
npm run build --prefix frontend
npm run start --prefix frontend
```

Backend:

```bash
npm run dev --prefix backend
npm start --prefix backend
```

## Deployment

### Backend on Render

1. Create a Render Web Service.
2. Root directory: `backend`
3. Build command: `npm install`
4. Start command: `node src/server.js`
5. Set `NODE_ENV=production`.
6. Set `CLIENT_URL` to the production frontend URL.
7. Add the remaining backend environment variables.

### Frontend on Vercel

1. Create a Vercel project.
2. Root directory: `frontend`
3. Build command: `npm run build`
4. Framework preset: Next.js
5. Add:

```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
NEXT_PUBLIC_SITE_URL=https://your-frontend-domain.com
```

## Key Routes

Customer:

- `/`
- `/shop`
- `/shop/[category]`
- `/product/[slug]`
- `/cart`
- `/checkout`
- `/account`
- `/account/orders`
- `/wishlist`

Admin:

- `/admin`
- `/admin/products`
- `/admin/products/new`
- `/admin/products/[id]/edit`
- `/admin/orders`
- `/admin/homepage`
- `/admin/media`
- `/admin/coupons`
- `/admin/shipping`
- `/admin/settings`
- `/admin/staff`
- `/admin/support`

SEO:

- `/robots.txt`
- `/sitemap.xml`

## API Highlights

Products:

- `GET /api/products`
- `GET /api/products/featured`
- `GET /api/products/trending`
- `GET /api/products/:slug`
- `GET /api/products/:slug/related`
- `GET /api/products/seo/sitemap`

Settings:

- `GET /api/settings`

Admin:

- `GET /api/admin/products`
- `POST /api/admin/products`
- `PUT /api/admin/products/:id`
- `GET /api/admin/orders`
- `PUT /api/admin/orders/:id`
- `GET /api/admin/homepage`
- `PUT /api/admin/homepage`

## Notes

- The interactive storefront and admin screens are hydrated client-side under Next route files.
- Product SEO is server-rendered when `NEXT_PUBLIC_API_URL` is reachable during the request.
- Keep `NEXT_PUBLIC_SITE_URL` accurate in every environment that should be indexed.
