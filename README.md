This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3014](http://localhost:3014) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Production CI/CD

The production origin is `https://pte-practice.duckdns.org`.

`.github/workflows/deploy-production.yml` starts on pushes to `main` or manual
workflow dispatch. It runs five separate jobs:

1. **Lint practice:** `npm ci` and `npm run lint`.
2. **Unit tests:** `npm ci` and `npm run test:unit`.
3. **Build practice:** production build, including TypeScript validation, with
   `NEXT_PUBLIC_API_BASE_URL=https://pte-practice.duckdns.org`.
4. **Deploy to Oracle VPS:** runs only after all three checks pass, synchronizes
   the three main branches and deploys the shared Docker Compose stack.
5. **Verify public endpoints:** checks HTTPS practice pages, tenant/admin,
   backend health and the expected unauthenticated practice API response.

Lint, tests and build run in parallel. Deploys are serialized across repositories
by `/tmp/pte-platform-production-deploy.lock` on the VPS; an ongoing deployment
is never canceled by a newer push.

Configure these four secrets in the repository's `production` GitHub environment:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_PRIVATE_KEY`
- `DEPLOY_KNOWN_HOSTS`

The VPS must contain clean `main` checkouts at `/home/ubuntu/pte-org/pte-api`,
`/home/ubuntu/pte-org/pte-web`, and `/home/ubuntu/pte-org/pte-practice`.
The ignored API `.env` must have mode `600`. Practice itself needs no secrets
in its frontend bundle. `/api/v1/` is forwarded through the practice domain to
the backend.

For the first rollout, publish the API deployment support
(`deploy/production.sh`, `deploy/ensure-certificates.sh`, practice Dockerfile,
Compose service and Nginx routes) to API `main` before running the new practice
workflow. The practice workflow deliberately fails if that shared deployment
support is missing; it does not modify tracked server files or bypass checks.
