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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploying on cPanel

This app is deployed via cPanel's "Setup Node.js App" (Phusion Passenger), running `next start` as a persistent process — not a static export or serverless functions. Two things need somewhere to live outside the deployed app folder so a redeploy never wipes them:

- **Database** (`TURSO_DATABASE_URL`) — a local SQLite file works fine (no Turso account needed) since the process is long-running. Point it at an absolute path in a sibling folder, e.g. `file:/home/youruser/fk_olaine-data/app.db`; the parent directory is created automatically on startup if missing. Leave `TURSO_AUTH_TOKEN` empty. Back the file up yourself (e.g. a cPanel cron job copying it out on a schedule) — a local file has no built-in replication. See `.env.example` for the full comment.
- **Uploaded photos** (`UPLOADS_DIR`) — same idea: an absolute path outside the app folder, ideally inside `public_html/` so Apache/LiteSpeed can serve the files directly. See `.env.example`.

Set both env vars (plus `SESSION_SECRET`, `ADMIN_PASSWORD`, `CRON_SECRET`, `SITE_URL`, and the `SMTP_*` vars below) in the Node.js App's environment variable UI, then run `npm run db:push` once against production to create the schema.

`SITE_URL` should be the real public domain (`https://fkolaine.com`, no trailing slash) — `robots.txt` and `sitemap.xml` build their absolute links from it.

For an existing database, add league-source logo and main-league fields before deploying this version:

```sh
NODE_ENV=production node scripts/migrate-league-source-metadata.mjs
```

The migration is safe to rerun and only adds `logo_url` and `is_main_league`. Existing sources start with no logo and `is_main_league = false`; set the values under **Līgu avoti**. Uploaded league logos use the existing uploads directory and image limits. The main-league flag is stored per source and does not enforce uniqueness. The homepage sponsor strip uses the first marked source in display order for its league logo. Match cards use the logo of the source matching their team and league name. If no logo is saved, the sponsor strip omits the league mark and match cards show the league name.

- **Outgoing email** (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`) — used for notification emails (e.g. the LFF sync alerting an admin that a game needs review). In cPanel: Email Accounts → pick/create a mailbox (e.g. `info@yourdomain.com`) → "Connect Devices" next to it shows the exact host/port to use (typically `mail.yourdomain.com`, port `465` for SSL or `587` for STARTTLS). `SMTP_USER`/`SMTP_PASSWORD` are that mailbox's full address and password. Leave unset to disable email sending entirely — `src/lib/mailer.ts` just logs a warning and skips it rather than failing whatever triggered the notification.

## Shared database package

The source of truth is the private repository https://github.com/dantol29/olaine-database
(local checkout: ../olaine_database). Both websites install the same exact release from
GitHub Packages using the npm alias `@olaine/database` → `@dantol29/database`.
Do not edit the installed package or maintain a separate schema in either website.

### Installing and deploying

Configure `NODE_AUTH_TOKEN` with a GitHub classic token granting `read:packages`
on your development machine and in the cPanel deployment shell. The committed
`.npmrc` contains only an environment-variable placeholder; never commit a token.
For cPanel, the token must be available to the shell running `npm install`,
not just the running Node application. Both deployments run `npm run db:migrate`
before building. Both apps need the same database URL to share actual data.

### Releasing a database change

Edit the standalone repository, add any required idempotent migration, bump its
package version, commit, and push a matching `vVERSION` tag. GitHub Actions
publishes the private release using its own `GITHUB_TOKEN`.
From FK Olaine, run `npm run db:update-shared -- VERSION` to install that exact
release in both websites, then commit both manifests and lockfiles.
Website database schema/client files are only compatibility imports.
