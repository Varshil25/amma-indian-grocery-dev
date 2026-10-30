# Amma Grocery - Indian Grocery Store Website

A modern, responsive website for Amma Grocery, an authentic Indian grocery store located in Malvern, Pennsylvania.

## Project Overview

**Business**: Amma Grocery  
**Location**: 123 Lancaster Ave, Malvern, PA 19355  
**Phone**: (610) 555-0123  
**Hours**: Monday–Saturday 9:00 AM – 8:00 PM, Sunday 10:00 AM – 6:00 PM

## Features

- **Responsive Design**: Mobile-first approach with modern UI components
- **Product Catalog**: Browse Indian groceries, spices, produce, and more
- **Special Offers**: Current deals and promotions
- **Contact Information**: Store details, hours, and contact form
- **SEO Optimized**: Proper meta tags and structured data for local search

## Technologies Used

This project is built with:

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **State Management**: React Query (TanStack Query)
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd amma-indian-grocery-dev
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Running the full stack (store, admin, API)

The storefront shows only what's in the database — there is no built-in sample data.
Everything (categories, products, images, stock, deals, coupons, home banners, info pages,
store details, tax and delivery settings) is managed from the admin panel.

```bash
cp apps/api/.env.example apps/api/.env      # set DATABASE_URL and the two JWT secrets
npm run db:push --workspace=apps/api        # create the tables
ADMIN_EMAIL=you@yourstore.com ADMIN_PASSWORD='a-long-password' npm run db:seed
npm run dev:api      # http://localhost:8000
npm run dev:admin    # http://localhost:3001  — sign in with the admin account above
npm run dev:web      # http://localhost:3000
```

The seed creates the first admin, starter categories and the info pages; re-running it never
overwrites anything.

**Removing old sample data.** Databases seeded by older versions of this project contain 10
sample products (Basmati Rice, Fresh Oranges, …), the coupons WELCOME10/SPICE5 and an admin
login whose password was in this repo. Remove the samples with:

```bash
npm run db:remove-sample-data              # dry run: lists what would change
npm run db:remove-sample-data -- --apply   # do it
```

Samples already used on an order are hidden instead of deleted, so order history stays intact.
Also change the password of (or remove) `admin@ammagrocery.com` if it exists.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Layout components (Header, Footer)
│   └── ui/            # shadcn/ui components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
└── assets/             # Images and static assets

public/
├── data/               # JSON data files (products, offers)
└── favicon.ico         # Site favicon
```

## Customization

### Business Information
Update the following files to modify business details:
- `src/pages/Index.tsx` - Homepage content
- `src/pages/About.tsx` - About page and business hours
- `src/pages/Contact.tsx` - Contact information
- `src/components/layout/SiteHeader.tsx` - Header business name
- `src/components/layout/SiteFooter.tsx` - Footer information

### Products and Offers
- `public/data/products.json` - Product catalog
- `public/data/offers.json` - Special offers and promotions

### Styling
- `tailwind.config.ts` - Tailwind CSS configuration
- `src/index.css` - Global styles

## Deployment

### Build for Production
```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment to any static hosting service.

### Recommended Hosting
- **Vercel**: Easy deployment with automatic builds
- **Netlify**: Great for static sites with form handling
- **GitHub Pages**: Free hosting for public repositories
- **AWS S3 + CloudFront**: Scalable and cost-effective

## Support

For questions or support regarding this website, please contact:
- **Email**: info@ammagrocery.com
- **Phone**: (610) 555-0123

## License

This project is proprietary to Amma Grocery. All rights reserved.
