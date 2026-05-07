# Ballers App

> **Wear the Game** - Official Soccer Kits for National Teams & League Clubs

A PWA-enabled React e-commerce application for customizable soccer team jerseys — national teams and league clubs.

## Features

- 🏆 Browse national teams and league clubs
- 👕 Shop official replica kits (Home, Away, Third)
- ✂️ Customize jerseys with name and number
- 🛒 Shopping cart with persistent state
- 💳 Full checkout flow
- 🔐 User authentication (JWT)
- 📱 PWA support (offline, installable)
- 🎙️ Responsive design (mobile-first)

## Tech Stack

- **React 18** with React Router 6
- **Tailwind CSS** with custom design tokens
- **Context API** for auth and cart state
- **React Hook Form + Zod** for form validation
- **Axios** for API calls
- **Workbox** for PWA service worker

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your backend URL
# REACT_APP_API_URL=http://localhost:5000

# Start development server
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `REACT_APP_API_URL` | Backend API base URL | `http://localhost:5000` |

### Build for Production

```bash
npm run build
```

Builds the app to the `build/` folder with optimizations.

## Project Structure

```
src/
├── index.js              # Entry point + SW registration
├── App.js                # Router + context providers
├── components/
│   ├── Header.js           # Sticky nav with cart badge
│   ├── Footer.js           # Footer with links
│   └── PageLoader.js       # Loading spinner
├── pages/
│   ├── HomePage.js         # Hero + featured teams + kits
│   ├── TeamsPage.js        # All teams grid with search
│   ├── ProductsPage.js     # Products grid with filters
│   ├── ProductDetailPage.js # Product detail + customization
│   ├── CartPage.js         # Cart with quantity controls
│   ├── CheckoutPage.js     # Multi-step checkout form
│   ├── LoginPage.js        # Authentication
│   ├── RegisterPage.js     # New user registration
│   └── NotFoundPage.js     # 404 page
├── context/
│   ├── AuthContext.js      # JWT auth state
│   └── CartContext.js      # Cart state + localStorage
├── services/
│   └── api.js              # Axios instance + API methods
├── hooks/
│   ├── useAuth.js          # Auth hook
│   └── useCart.js          # Cart hook
├── utils/
│   ├── constants.js        # App constants
│   └── validation.js       # Zod schemas
└── styles/
    └── globals.css         # Tailwind + custom styles
```

## Routes

| Path | Page | Description |
|---|---|---|
| `/` | Home | Hero, featured teams, most wanted kits |
| `/teams` | Teams | National teams and league clubs |
| `/products` | Products | All products |
| `/products/:teamId` | Products | Products filtered by team |
| `/product/:id` | Product Detail | Full product page + customization |
| `/cart` | Cart | Shopping cart |
| `/checkout` | Checkout | Order placement |
| `/login` | Login | User authentication |
| `/register` | Register | New user registration |

## API Integration

The app consumes the Ballers backend API:

- `GET /api/teams` - All teams
- `GET /api/products?teamId=` - Products (with filters)
- `GET /api/products/:id` - Product detail
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/cart/add` - Add to cart
- `POST /api/orders` - Create order

## PWA

The app is PWA-ready with:
- `public/manifest.json` - App manifest
- `src/service-worker.js` - Workbox caching strategies
- Cache-First for static assets
- Network-First for API calls
- Offline fallback support
