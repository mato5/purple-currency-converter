# Prisma + tRPC

## Features

- 🧙‍♂️ E2E typesafety with [tRPC](https://trpc.io)
- ⚡ Full-stack React with Next.js App Router
- ⚡ Database with Prisma (SQLite for local development)
- ⚙️ VSCode extensions
- 🎨 ESLint + Prettier
- 💚 CI setup using GitHub Actions:
  - ✅ E2E testing with [Playwright](https://playwright.dev/)
  - ✅ Linting
- 🔐 Validates your env vars on build and start

## Setup

```bash
pnpm create next-app --example https://github.com/trpc/trpc --example-path examples/next-prisma-starter trpc-prisma-starter
cd trpc-prisma-starter
pnpm
pnpm dx
```

### Requirements

- Node >= 18.0.0
- SQLite (built-in, no separate installation required)

## Development

### Start project

```bash
pnpm create next-app --example https://github.com/trpc/trpc --example-path examples/next-prisma-starter trpc-prisma-starter
cd trpc-prisma-starter
pnpm
pnpm dx
```

### Commands

```bash
pnpm build      # runs `prisma generate` + `prisma migrate` + `next build`
pnpm db-reset   # resets local db
pnpm dev        # starts next.js with app router
pnpm dx         # runs migrations + seeds + starts next.js
pnpm test-dev   # runs e2e tests on dev
pnpm test-start # runs e2e + unit tests
pnpm test-unit  # runs normal Vitest unit tests
pnpm test-e2e   # runs e2e tests
```

## Deployment

### Using [Render](https://render.com/)

The project contains a [`render.yaml`](./render.yaml) [_"Blueprint"_](https://render.com/docs/blueprint-spec) which makes the project easily deployable on [Render](https://render.com/).

Go to [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints) and connect to this Blueprint and see how the app and database automatically gets deployed.

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

---

Created by [@alexdotjs](https://twitter.com/alexdotjs).
