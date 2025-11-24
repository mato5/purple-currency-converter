# 💱 Currency Converter

A modern, production-ready currency conversion application with real-time exchange rates and historical data visualization. Built with Next.js 15, tRPC, and Prisma.

**Live Demo:** Convert between 170+ world currencies, view interactive charts, and see live statistics - all with full internationalization support in English, Czech, and German.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![tRPC](https://img.shields.io/badge/tRPC-11-blue)
![Prisma](https://img.shields.io/badge/Prisma-6.19-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ What This App Does

This is a **full-featured currency converter** that provides:

1. **💱 Real-Time Currency Conversion**
   - Convert between 170+ world currencies instantly
   - Live exchange rates from OpenExchangeRates API
   - Support for amounts up to 100 billion (overflow-safe)
   - Smart input formatting with locale-aware thousands separators

2. **📊 Historical Data Visualization**
   - Interactive charts showing exchange rate trends
   - Multiple timeframes: 30 days, 90 days, and 1 year
   - Data sourced from European Central Bank (ECB)

3. **🌍 Full Internationalization**
   - Available in English (en), Czech (cs), and German (de)
   - Automatic number formatting per locale (e.g., `1,000.00` vs `1 000,00`)
   - Locale-specific currency symbols and formatting

4. **📈 Live Statistics Dashboard**
   - Real-time conversion statistics via Server-Sent Events
   - Track total conversions and trending currencies
   - Auto-updating with database triggers

5. **🎨 Modern User Experience**
   - Beautiful, responsive design that works on all devices
   - Instant currency swapping with smooth animations
   - Auto-conversion when changing currencies
   - Smart validation with helpful error messages

## 🛠 Technical Highlights

- **🧙‍♂️ End-to-End Type Safety** - Full-stack TypeScript with tRPC
- **⚡ Next.js 15 App Router** - Latest React features with server components
- **💾 Smart Database Design** - SQLite with automatic statistics triggers
- **🔒 Type-safe Configuration** - Zod validation for all environment variables
- **✅ Production-Ready Testing** - Comprehensive E2E tests with Playwright
- **🚀 CI/CD Pipeline** - Automated testing and deployment with GitHub Actions
- **📦 Optimized Performance** - Smart caching, efficient queries, and minimal bundle size

## 📋 Requirements

Before you begin, make sure you have:

### System Requirements
- **Node.js** version 18.0.0 or higher
  - Check your version: `node --version`
  - [Download latest version](https://nodejs.org/)
  
- **pnpm** version 8.5.0 or higher
  - Check your version: `pnpm --version`
  - Install: `npm install -g pnpm`
  - [Installation guide](https://pnpm.io/installation)

- **Git**
  - Check your version: `git --version`
  - [Download](https://git-scm.com/downloads)

- **SQLite** (built-in, no separate installation needed)

### API Access
- **OpenExchangeRates API Key** (free tier available)
  - Sign up at: [openexchangerates.org/signup/free](https://openexchangerates.org/signup/free)
  - Free tier includes: 1,000 requests/month
  - Sufficient for development and small production deployments

## 🚀 Quick Start (TL;DR)

```bash
# 1. Clone and navigate to the project
git clone <repository-url>
cd currency-converter

# 2. Install dependencies
pnpm install

# 3. Create .env file with your API key
echo 'DATABASE_URL="file:./prisma/dev.db"' > .env
echo 'OPENEXCHANGERATES_API_KEY="your_key_here"' >> .env

# 4. Setup database and start dev server (all-in-one)
pnpm dx
```

The app will be running at **http://localhost:3000** 🎉

---

## 📖 Detailed Setup Guide

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd currency-converter
```

### Step 2: Install Dependencies

This project uses **pnpm** as the package manager:

```bash
pnpm install
```

> **Note:** If you don't have pnpm installed, run `npm install -g pnpm` first.

### Step 3: Get Your API Key

1. **Visit:** [openexchangerates.org/signup/free](https://openexchangerates.org/signup/free)
2. **Sign up** for a free account
3. **Copy** your API key from the dashboard

The free tier provides:
- ✅ 1,000 API requests per month
- ✅ Hourly updates
- ✅ 170+ currencies
- ✅ Perfect for development and testing

### Step 4: Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Required: Database location (SQLite)
DATABASE_URL="file:./prisma/dev.db"

# Required: Your OpenExchangeRates API key
OPENEXCHANGERATES_API_KEY="your_actual_api_key_here"
```

**💡 Tip:** Replace `your_actual_api_key_here` with the API key you got in Step 3.

### Step 5: Initialize the Database

Run the database migrations to create the required tables:

```bash
pnpm migrate-dev
```

**Optional:** Seed the database with 5 sample conversions:

```bash
pnpm db-seed
```

### Step 6: Start the Development Server

```bash
pnpm dev
```

The application will start at:
- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **API:** [http://localhost:3000/api/trpc](http://localhost:3000/api/trpc)

### Alternative: One-Command Setup

Use the `dx` command to run migrations, seed the database, and start the dev server all at once:

```bash
pnpm dx
```

This is equivalent to:
```bash
pnpm migrate-dev && pnpm db-seed && next dev
```

And also runs Prisma Studio in parallel at http://localhost:5555

## ✅ Verify Installation

Once the server is running, you should see:

1. **Currency converter form** with EUR → CZK as default
2. **Statistics section** showing conversion data
3. **Historical chart** with timeframe selector
4. **Language selector** in the top-right corner

Try converting some currencies to make sure everything works!

## 👨‍💻 Development

### Available Commands

#### Development & Build
| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server at http://localhost:3000 |
| `pnpm dx` | Setup database + seed + start dev server + Prisma Studio (all-in-one) |
| `pnpm build` | Create production build |
| `pnpm start` | Start production server |
| `pnpm prebuild` | Run Prisma generate (automatically runs before build) |

#### Database Management
| Command | Description |
|---------|-------------|
| `pnpm migrate-dev` | Create and apply new migration |
| `pnpm migrate` | Apply pending migrations (production) |
| `prisma db push` | Push schema changes without migration (development only) |
| `pnpm db-seed` | Populate database with 5 sample conversions |
| `pnpm prisma-studio` | Open visual database editor (http://localhost:5555) |
| `pnpm db-reset` | ⚠️  Clear all data and re-run migrations |

#### Testing
| Command | Description |
|---------|-------------|
| `pnpm test-e2e` | Run Playwright E2E tests (headless) |
| `pnpm test-unit` | Run Vitest unit tests |
| `pnpm test-start` | Run all tests (unit + E2E sequentially) |

#### Code Quality
| Command | Description |
|---------|-------------|
| `pnpm lint` | Run ESLint |
| `pnpm lint-fix` | Run ESLint and auto-fix issues |
| `pnpm typecheck` | Type-check with TypeScript (no emit) |

### Common Development Tasks

#### Adding a New Currency Conversion

The app automatically fetches all available currencies from OpenExchangeRates API, so no code changes are needed to add new currencies.

#### Modifying the Database Schema

1. Update `prisma/schema.prisma`
2. Run `pnpm migrate-dev` (it will prompt you for a migration name)
3. Migration files will be created in `prisma/migrations/`

#### Viewing the Database

Open Prisma Studio to browse and edit database records:

```bash
pnpm prisma-studio
```

This opens a GUI at http://localhost:5555

**Tip:** The `pnpm dx` command automatically runs Prisma Studio alongside the dev server!

#### Resetting the Database

If you need to start fresh:

```bash
pnpm db-reset  # Clears all data and re-runs migrations
pnpm db-seed   # Re-populate with sample data
```

## 🐛 Troubleshooting

### Common Issues

#### "Invalid API Key" Error

**Problem:** Getting API errors when trying to convert currencies.

**Solution:**
1. Verify your API key is correct in `.env`
2. Make sure there are no extra spaces or quotes
3. Restart the dev server after changing `.env`
4. Check your API usage at openexchangerates.org (you might have hit the free tier limit)

```bash
# Verify your .env file
cat .env

# Should look like:
# OPENEXCHANGERATES_API_KEY=abc123def456  (no quotes or spaces)
```

#### Port 3000 Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find and kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 pnpm dev
```

#### Database Migration Errors

**Problem:** `P3018 A migration failed to apply`

**Solution:**
```bash
# Reset the database completely
rm -f prisma/dev.db prisma/dev.db-journal
pnpm migrate-dev
```

#### Playwright Tests Failing

**Problem:** E2E tests fail with timeout errors

**Solution:**
```bash
# Install browsers
pnpm exec playwright install chromium

# Run tests in headed mode to see what's happening
pnpm exec playwright test --headed
```

#### TypeScript Errors After Updating Schema

**Problem:** TypeScript complains about Prisma types

**Solution:**
```bash
# Regenerate Prisma Client
pnpm generate

# Restart TypeScript server in your IDE
# VS Code: Cmd+Shift+P > "TypeScript: Restart TS Server"
```

### Getting Help

If you encounter other issues:

1. Check the [GitHub Issues](https://github.com/your-repo/issues)
2. Make sure all dependencies are installed: `pnpm install`
3. Verify Node.js version: `node --version` (should be >= 18)
4. Clear Next.js cache: `rm -rf .next`

### Project Structure

```
currency-converter/
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Database migrations
│   └── seed.ts                 # Database seeding script
├── src/
│   ├── app/                    # Next.js App Router pages
│   ├── components/             # React components
│   ├── lib/                    # Shared utilities and validation
│   ├── server/
│   │   ├── routers/           # tRPC routers and procedures
│   │   ├── services/          # Business logic (currency conversion, etc.)
│   │   ├── config.ts          # Server configuration
│   │   └── logger.ts          # Logging setup
│   └── utils/                  # Client utilities
├── playwright/                 # E2E tests
└── public/                     # Static assets
```

### Environment Variables

All configuration is managed through environment variables with sensible defaults:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | SQLite database file location |
| `OPENEXCHANGERATES_API_KEY` | Yes | - | API key for currency rates |
| `CACHE_EXCHANGE_RATES_TTL` | No | 3600000 | Cache duration for rates (ms) |
| `API_TIMEOUT` | No | 10000 | API request timeout (ms) |
| `LOG_LEVEL` | No | info | Logging level (fatal/error/warn/info/debug/trace) |
| `STATISTIC_SINGLETON_ID` | No | singleton | ID for singleton statistic row |

See `src/server/config.ts` for all available configuration options.

## 🏗 Architecture & Technical Details

### Technology Stack

#### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 15** | React framework with App Router |
| **React 19** | UI library with latest features |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Utility-first styling |
| **Radix UI** | Accessible component primitives |
| **Recharts** | Interactive data visualization |
| **next-intl** | Internationalization (i18n) |
| **React Hook Form** | Form state management |
| **Zod** | Schema validation |

#### Backend
| Technology | Purpose |
|------------|---------|
| **tRPC** | End-to-end type-safe API |
| **Prisma** | Type-safe ORM |
| **SQLite** | Local database |
| **Pino** | High-performance logging |
| **Server-Sent Events** | Real-time statistics updates |

#### Testing & Quality
| Technology | Purpose |
|------------|---------|
| **Playwright** | E2E browser testing |
| **Vitest** | Fast unit testing |
| **ESLint** | Code linting |
| **TypeScript** | Compile-time type checking |

### Key Implementation Details

#### 1. Database Triggers for Real-time Statistics

The app uses **SQLite triggers** to automatically maintain statistics with zero application overhead:

```sql
CREATE TRIGGER update_statistics_after_insert
AFTER INSERT ON conversion
BEGIN
  -- Automatically recalculate stats after each conversion
  UPDATE statistic SET
    total_conversions = (SELECT COUNT(*) FROM conversion),
    most_converted_currency = (SELECT target_currency FROM conversion 
                                GROUP BY target_currency 
                                ORDER BY COUNT(*) DESC LIMIT 1);
END;
```

**Benefits:**
- ⚡ O(1) read performance - statistics are pre-calculated
- 🔄 Always up-to-date - triggers run automatically
- 🎯 Efficient - uses indexes for fast aggregation

#### 2. Overflow-Safe Amount Storage

Handles amounts up to **100 billion** without JavaScript integer overflow:

| Layer | Type | Purpose |
|-------|------|---------|
| **Database** | `STRING` | Store amounts as text (unlimited precision) |
| **SQL Operations** | `CAST to REAL` | Perform arithmetic in queries |
| **Application** | `number` | Use JavaScript numbers (within safe range) |

```typescript
// Stored in DB as: "10000000000"
// Used in app as: 10000000000 (safe integer)
// Displayed as: "100,000,000.00" (formatted)
```

#### 3. Smart Number Formatting

Automatically adapts to user's locale:

| Locale | Amount Input | Displayed As |
|--------|--------------|--------------|
| **en-US** | `1000000.50` | `$1,000,000.50` |
| **cs-CZ** | `1000000,50` | `1 000 000,50 Kč` |
| **de-DE** | `1000000,50` | `1.000.000,50 €` |

The `FormattedNumberInput` component:
- Parses locale-specific input (commas, periods, spaces)
- Converts to standard format for validation
- Formats beautifully on blur

#### 4. Efficient Caching Strategy

| Data Type | Cache Duration | Why |
|-----------|----------------|-----|
| **Exchange Rates** | 1 hour | Rates don't change frequently |
| **Available Currencies** | 24 hours | List rarely changes |
| **Historical Data** | 24 hours | Historical data is immutable |

Cache is filesystem-based (no Redis needed) and automatically invalidates.

#### 5. Type-Safe Configuration

All environment variables are validated at startup:

```typescript
// src/server/config.ts
const configSchema = z.object({
  databaseUrl: z.string().min(1),
  openExchangeRatesApiKey: z.string().min(1),
  apiTimeout: z.number().positive().default(10000),
  // ... more config
});
```

**Benefits:**
- ✅ Fail fast - errors caught at startup, not runtime
- 📝 Self-documenting - schema shows all required config
- 🔒 Type-safe - TypeScript knows all config values

## 🚀 Deployment

### GitHub Actions CI/CD

The project includes a **complete CI/CD pipeline** (`.github/workflows/main.yml`) that automatically runs on every push and pull request:

| Job | What It Does | Duration |
|-----|--------------|----------|
| **Lint** | ESLint code quality checks | ~1 min |
| **E2E** | Full Playwright browser tests | ~3-5 min |
| **Unit** | Vitest tests + TypeScript checks | ~2 min |

#### Setting Up CI/CD

1. Push your code to GitHub
2. Add your API key as a secret:
   - Go to **Settings → Secrets and variables → Actions**
   - Click **New repository secret**
   - Name: `OPENEXCHANGERATES_API_KEY`
   - Value: Your actual API key
3. The workflow will run automatically on push

All three jobs must pass before merging pull requests (configure branch protection rules).

### Production Deployment

This Next.js app can be deployed to any Node.js hosting platform:

#### Option 1: Vercel (Recommended)

**Best for:** Next.js apps, zero config, free tier available

1. **Connect to Vercel:**
   ```bash
   pnpm install -g vercel
   vercel
   ```

2. **Set environment variables** in Vercel dashboard:
   - `DATABASE_URL` - Path to your SQLite database or PostgreSQL connection string
   - `OPENEXCHANGERATES_API_KEY` - Your API key

3. **Deploy:**
   ```bash
   vercel --prod
   ```

**Note:** For production with Vercel, consider using a managed database (Vercel Postgres, PlanetScale, etc.) instead of SQLite.

#### Option 2: Railway

**Best for:** Persistent storage, PostgreSQL support

1. Connect your GitHub repository
2. Add environment variables:
   - `OPENEXCHANGERATES_API_KEY`
   - `DATABASE_URL` (Railway provides PostgreSQL)
3. Deploy automatically on push

#### Option 3: Render

**Best for:** Full control, free tier available

1. Connect repository
2. Set build command: `pnpm install && pnpm build`
3. Set start command: `pnpm start`
4. Add environment variables
5. Add PostgreSQL database (update schema for PostgreSQL)

#### Option 4: Self-Hosted

**Best for:** Full control, custom infrastructure

```bash
# On your server
git clone <repository-url>
cd currency-converter
pnpm install
pnpm build

# Set up environment variables
nano .env

# Run migrations
pnpm migrate

# Start with PM2 (process manager)
pm2 start "pnpm start" --name currency-converter
```

### Pre-Deployment Checklist

Before deploying to production:

- [ ] Set all required environment variables
- [ ] Run migrations: `pnpm migrate`
- [ ] Update `DATABASE_URL` for production database
- [ ] Test the build locally: `pnpm build && pnpm start`
- [ ] Set up error monitoring (optional: Sentry, LogRocket)
- [ ] Configure custom domain (optional)
- [ ] Set up SSL certificate (handled by most platforms)

### Production Database Notes

**SQLite in Production:**
- ✅ Good for: Single-server deployments, low traffic
- ❌ Not ideal for: Serverless, high traffic, multiple servers

**PostgreSQL in Production:**
- ✅ Recommended for most production deployments
- ✅ Better concurrency, scalability, and reliability
- Update `prisma/schema.prisma` provider to `postgresql`

## Files of note

<table>
  <thead>
    <tr>
      <th>Path</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><a href="./prisma/schema.prisma"><code>./prisma/schema.prisma</code></a></td>
      <td>Prisma schema (SQLite)</td>
    </tr>
    <tr>
      <td><a href="./src/app/api/trpc/[trpc]/route.ts"><code>./src/app/api/trpc/[trpc]/route.ts</code></a></td>
      <td>tRPC response handler (App Router)</td>
    </tr>
    <tr>
      <td><a href="./src/server/routers"><code>./src/server/routers</code></a></td>
      <td>Your app's different tRPC-routers</td>
    </tr>
    <tr>
      <td><a href="./src/utils/trpc-client.ts"><code>./src/utils/trpc-client.ts</code></a></td>
      <td>tRPC client setup for client components</td>
    </tr>
    <tr>
      <td><a href="./src/utils/trpc-server.ts"><code>./src/utils/trpc-server.ts</code></a></td>
      <td>tRPC server-side helpers for server components</td>
    </tr>
  </tbody>
</table>

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/your-repo/issues)
2. If not, create a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Your environment (OS, Node version, browser)

### Suggesting Features

1. Check existing [Issues](https://github.com/your-repo/issues) and [Pull Requests](https://github.com/your-repo/pulls)
2. Create a new issue describing:
   - The feature you'd like to see
   - Why it would be useful
   - How it might work

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `pnpm test-start`
5. Run linter: `pnpm lint-fix`
6. Type-check: `pnpm typecheck`
7. Commit: `git commit -m 'Add amazing feature'`
8. Push: `git push origin feature/amazing-feature`
9. Open a Pull Request

**Please ensure:**
- All tests pass
- Code follows existing style (ESLint will help)
- Commit messages are clear and descriptive
- PR description explains what and why

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[tRPC](https://trpc.io)** - Type-safe API framework
- **[Next.js](https://nextjs.org)** - React framework
- **[Prisma](https://prisma.io)** - Next-generation ORM
- **[OpenExchangeRates](https://openexchangerates.org)** - Currency exchange rate API
- **[European Central Bank](https://www.ecb.europa.eu)** - Historical exchange rate data
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful component patterns

## 📞 Support

- **Documentation**: This README
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)

---

**Built with ❤️ using Next.js, tRPC, and Prisma**

Original tRPC starter template by [@alexdotjs](https://twitter.com/alexdotjs)
