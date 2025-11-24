# 💱 Purple Currency Converter

A production-ready currency conversion application with real-time exchange rates and historical data visualization. Built with Next.js 16, tRPC, and Prisma.

Convert between 170+ world currencies with interactive charts and live statistics. Full internationalization support in English, Czech, and German.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![tRPC](https://img.shields.io/badge/tRPC-11-blue)
![Prisma](https://img.shields.io/badge/Prisma-6.19-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- **💱 Real-Time Currency Conversion** - 170+ currencies, up to 100 billion amount support
- **📊 Historical Charts** - Interactive visualization with multiple timeframes
- **🌍 Internationalization** - English, Czech, German with locale-aware formatting
- **📈 Live Statistics** - Real-time updates via Server-Sent Events
- **🎨 Modern UI** - Responsive design, smooth animations, smart validation

## 🛠 Tech Stack

- **🧙‍♂️ End-to-End Type Safety** - Full-stack TypeScript with tRPC
- **⚡ Next.js 16 App Router** - React 19 with server components
- **💾 Smart Database** - SQLite with automatic statistics triggers
- **✅ Comprehensive Testing** - Playwright E2E + Vitest unit tests
- **🚀 CI/CD Pipeline** - GitHub Actions with automated testing
- **🤖 AI-Ready** - Includes comprehensive Cursor rules

## 📋 Requirements

- **Node.js** 18.0.0+ ([Download](https://nodejs.org/))
- **pnpm** 8.5.0+ (`npm install -g pnpm`)
- **OpenExchangeRates API Key** - Free tier available at [openexchangerates.org/signup/free](https://openexchangerates.org/signup/free)

## 🚀 Quick Start

```bash
# Clone and install
git clone <repository-url>
cd currency-converter
pnpm install

# Setup environment
echo 'DATABASE_URL="file:./prisma/dev.db"' > .env
echo 'OPENEXCHANGERATES_API_KEY="your_key_here"' >> .env

# Setup database and start (all-in-one)
pnpm dx
```

The app will be running at **http://localhost:3000** 🎉

> **Tip:** `pnpm dx` runs migrations, seeds the database, starts the dev server, and opens Prisma Studio at http://localhost:5555

## 👨‍💻 Development Commands

### Essential Commands
```bash
pnpm dev              # Start dev server
pnpm dx               # Setup DB + seed + dev + Prisma Studio
pnpm build            # Production build
pnpm start            # Start production server
```

### Database
```bash
pnpm migrate-dev      # Create and apply migration
pnpm db-seed          # Add 5 sample conversions
pnpm prisma-studio    # Visual database editor
pnpm db-reset         # Reset database
```

### Testing & Quality
```bash
pnpm test-e2e         # Playwright E2E tests
pnpm test-unit        # Vitest unit tests
pnpm test-start       # Run all tests
pnpm lint-fix         # Auto-fix linting issues
pnpm typecheck        # TypeScript type checking
```

## 🏗 Architecture

### Technology Stack

**Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, Radix UI, Recharts, next-intl, React Hook Form, Zod

**Backend:** tRPC, Prisma, SQLite, Pino, Server-Sent Events

**Testing:** Playwright, Vitest, ESLint, TypeScript

### Key Implementation Details

#### Database Triggers
SQLite triggers automatically maintain statistics for O(1) read performance:
```sql
CREATE TRIGGER update_statistics_after_insert
AFTER INSERT ON conversion
BEGIN
  UPDATE statistic SET total_conversions = (SELECT COUNT(*) FROM conversion);
END;
```

#### Overflow-Safe Amounts
Handles up to 100 billion without overflow:
- **Database:** `STRING` (unlimited precision)
- **SQL Operations:** `CAST to REAL` for arithmetic
- **Application:** `number` (within safe integer range)

#### Locale-Aware Formatting
| Locale | Input | Displayed |
|--------|-------|-----------|
| en-US | `1000000.50` | `$1,000,000.50` |
| cs-CZ | `1000000,50` | `1 000 000,50 Kč` |
| de-DE | `1000000,50` | `1.000.000,50 €` |

#### Caching Strategy
- **Exchange Rates:** 1 hour (rates change infrequently)
- **Available Currencies:** 24 hours (list rarely changes)
- **Historical Data:** 24 hours (immutable data)

### Project Structure

```
currency-converter/
├── prisma/             # Database schema, migrations, seed
├── src/
│   ├── app/           # Next.js pages
│   ├── components/    # React components
│   ├── lib/           # Shared utilities and validation
│   ├── server/        # tRPC routers, services, config
│   └── utils/         # Client utilities
├── playwright/        # E2E tests
└── public/            # Static assets
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | SQLite database location |
| `OPENEXCHANGERATES_API_KEY` | Yes | - | API key for rates |
| `CACHE_EXCHANGE_RATES_TTL` | No | 3600000 | Cache duration (ms) |
| `API_TIMEOUT` | No | 10000 | Request timeout (ms) |
| `LOG_LEVEL` | No | info | Logging level |

See `src/server/config.ts` for all options.

## 🐛 Troubleshooting

**Invalid API Key:** Verify `.env` file has correct key without quotes/spaces. Restart server after changes.

**Port 3000 in use:** `lsof -ti:3000 | xargs kill -9` or `PORT=3001 pnpm dev`

**Migration errors:** `rm -f prisma/dev.db && pnpm migrate-dev`

**Playwright tests failing:** `pnpm exec playwright install chromium`

**TypeScript errors:** `pnpm generate` to regenerate Prisma client

## 🚀 Deployment

### CI/CD Pipeline

GitHub Actions runs automatically on push/PR:
- **Lint** - ESLint checks (~1 min)
- **E2E** - Playwright tests (~3-5 min)
- **Unit** - Vitest + TypeScript (~2 min)

**Setup:** Add `OPENEXCHANGERATES_API_KEY` to GitHub Secrets (Settings → Secrets → Actions)

### Deployment Options

**Vercel (Recommended)**
```bash
vercel --prod
```
Set environment variables in dashboard. Use managed database (Postgres) instead of SQLite.

**Railway:** Connect GitHub repo, add env vars, auto-deploy on push

**Self-Hosted:**
```bash
pnpm install && pnpm build
pnpm migrate
pm2 start "pnpm start" --name currency-converter
```

**Production Database:** Use PostgreSQL for production (better scalability). Update `prisma/schema.prisma` provider to `postgresql`.

## 📁 Key Files

| Path | Description |
|------|-------------|
| [`./prisma/schema.prisma`](./prisma/schema.prisma) | Database schema |
| [`./src/app/api/trpc/[trpc]/route.ts`](./src/app/api/trpc/[trpc]/route.ts) | tRPC handler |
| [`./src/server/routers`](./src/server/routers) | tRPC routers |
| [`./src/utils/trpc-client.ts`](./src/utils/trpc-client.ts) | Client setup |
| [`./src/utils/trpc-server.ts`](./src/utils/trpc-server.ts) | Server helpers |

## 💡 Development Insights

### AI-Assisted Development

Built extensively with **Cursor + Claude Sonnet** (architecture, code generation, debugging) and **v0 by Vercel** (UI components with shadcn/ui).

**Impact:**
- ✅ Dramatically faster prototyping (hours vs days)
- ✅ Better code quality through AI-suggested patterns
- ✅ Learning accelerator for new technologies (tRPC, SSE)
- ⚠️ Requires careful review for edge cases and architecture decisions

### Scalability Path

Current: Single-server deployment with filesystem cache, SQLite, and SSE.

For scale, would need:
- **Caching:** Redis/Memcached cluster for shared cache across instances
- **Database:** PostgreSQL (Neon, Supabase, RDS) for concurrent writes and read replicas
- **Real-Time:** Pusher/Ably/WebSockets for horizontal scaling
- **Architecture:** Microservices with dedicated conversion/statistics services, API gateway, CDN
- **Observability:** OpenTelemetry, Sentry, centralized logging (ELK/Loki)

### Beyond Basic Requirements

**Historical Data:** Free ECB API instead of paid timeseries, interactive Recharts visualization

**Full i18n:** 3 locales with locale-aware number formatting and custom `FormattedNumberInput`

**Real-Time Statistics:** SSE with database triggers for zero-overhead O(1) stats

**Overflow-Safe:** Handles up to 100 billion using string storage in DB, number in app logic

**UX Enhancements:** Currency swap button, auto-conversion, smart validation, responsive design, accessible components

### Technology Exploration

- **tRPC:** Type-safe API without codegen - game-changer coming from GraphQL/REST
- **SSE:** Simpler than WebSockets for unidirectional real-time updates, underutilized
- **SQLite Triggers:** Zero overhead statistics calculation at database level
- **Next.js 16 App Router:** Server components by default, reduced bundle size
- **Zod:** Runtime validation with TypeScript inference, essential for type safety

## 🤖 Cursor Rules

This repository includes comprehensive Cursor rules for AI-assisted development covering type safety, code organization, best practices, and domain-specific patterns. Rules are defined in workspace settings.

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repo and create a feature branch
2. Make your changes and add tests
3. Run `pnpm test-start && pnpm lint-fix && pnpm typecheck`
4. Submit a PR with clear description

For bugs/features, check existing [Issues](https://github.com/your-repo/issues) first.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [tRPC](https://trpc.io) - Type-safe API framework
- [Next.js](https://nextjs.org) - React framework
- [Prisma](https://prisma.io) - Next-generation ORM
- [OpenExchangeRates](https://openexchangerates.org) - Currency API
- [European Central Bank](https://www.ecb.europa.eu) - Historical data
- [Radix UI](https://www.radix-ui.com/) & [shadcn/ui](https://ui.shadcn.com/) - UI components

---

**Built with ❤️ using Next.js, tRPC, and Prisma**

Original tRPC starter template by [@alexdotjs](https://twitter.com/alexdotjs)
