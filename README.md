# E-Commerce Next.js + Laravel — Frontend

A full-featured e-commerce frontend built with **Next.js, React, TypeScript, Tailwind CSS, Redux Toolkit, Recharts, Zod, and Radix UI primitives**. This repository contains the frontend application for a commerce platform designed to work with a separate Laravel backend.

## Overview

The frontend contains customer-facing shopping flows as well as administrative interfaces. The current codebase includes dedicated routes/components for authentication, products, categories, shopping cart, checkout, best sellers, new arrivals, and admin dashboard functionality.

## Tech Stack

| Technology | Purpose |
| --- | --- |
| [Next.js](https://nextjs.org/) 15 | Application framework and routing |
| [React](https://react.dev/) 19 | UI development |
| [TypeScript](https://www.typescriptlang.org/) | Static typing |
| [Tailwind CSS](https://tailwindcss.com/) 4 | Styling and responsive layouts |
| [Redux Toolkit](https://redux-toolkit.js.org/) | Application state management |
| [Recharts](https://recharts.org/) | Dashboard/data visualization |
| [Zod](https://zod.dev/) | Validation and typed schemas |
| [Radix UI](https://www.radix-ui.com/) | Accessible UI primitives |
| [Lucide React](https://lucide.dev/) | Icons |

## Key Features

### Storefront

- Product browsing and product detail flows
- Category pages and category navigation
- Best-seller and new-arrival sections
- Search/filter-oriented product interfaces
- Responsive reusable product/card components

### Shopping

- Shopping cart
- Checkout flow
- Product filtering
- Customer-facing commerce layouts

### Authentication

- Dedicated authentication routes
- Login-related frontend flows
- Shared application layout and UI infrastructure

### Admin

- Dedicated admin area
- Dashboard-oriented components
- Best-seller statistics and filtering components
- Reusable layout controls
- Administrative component organization

## Project Structure

```text
E-Commerce_Next.js_Laravel_Frontend/
├── app/
│   ├── about/              # About page
│   ├── admin/              # Admin dashboard area
│   ├── auth/               # Authentication routes
│   ├── best-sellers/       # Best-seller views
│   ├── cart/               # Shopping cart
│   ├── categories/         # Category listing
│   ├── checkout/           # Checkout
│   ├── common/             # Shared application pages
│   ├── components/         # Reusable UI components
│   ├── contexts/           # React context providers
│   ├── data/               # Mock product/category/sales data
│   └── ...                 # Additional commerce routes
│
├── utils/                  # Shared utility modules
├── public/                 # Static assets
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── package.json
└── README.md
```

## Development Data

The repository currently includes mock data modules for categories, products, new arrivals, best sellers, and sales in `app/data/`. These are useful for frontend development and UI prototyping and should be treated separately from production backend data.

## Getting Started

### 1. Clone

```bash
git clone https://github.com/Sharar12/E-Commerce_Next.js_Laravel_Frontend.git
cd E-Commerce_Next.js_Laravel_Frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

The project uses Next.js with Turbopack for the development command and opens at the local development URL shown by Next.js.

## Available Scripts

```bash
npm run dev      # Start Next.js development server with Turbopack
npm run build    # Create the production build
npm run start    # Start the production server
npm run lint     # Run ESLint
```

## Backend Integration

The repository name indicates a **Next.js + Laravel** architecture. This repository is the **frontend application**; Laravel API services, database operations, and backend business rules belong in the separate backend repository.

When backend integration is added or changed, keep API/service configuration environment-based rather than hard-coding production endpoints in components.

## Frontend Scope

This repository is intended for the web interface, client-side state, navigation, presentation components, validation, and frontend application behavior. It does not replace the Laravel backend or its server-side authorization.

## Development Notes

- Keep mock data isolated from production API adapters.
- Keep reusable components in `app/components/` and shared state/context in their dedicated folders.
- Keep secrets out of Git and use environment variables for deployment-specific configuration.
- Backend authorization must remain the final security boundary for protected operations.

## License

This project is distributed under the license included in the repository.
