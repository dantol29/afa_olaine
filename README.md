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

For an isolated local setup with admin, LFF sync and a local mail sink, see
[docs/local-development.md](docs/local-development.md).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploying on cPanel

This app is deployed via cPanel's "Setup Node.js App" (Phusion Passenger), running `next start` as a persistent process — not a static export or serverless functions. Two things need somewhere to live outside the deployed app folder so a redeploy never wipes them:

- **Database** (`TURSO_DATABASE_URL`) — a local SQLite file works fine (no Turso account needed) since the process is long-running. Point it at an absolute path in a sibling folder, e.g. `file:/home/youruser/afa_olaine-data/app.db`; the parent directory is created automatically on startup if missing. Leave `TURSO_AUTH_TOKEN` empty. Back the file up yourself (e.g. a cPanel cron job copying it out on a schedule) — a local file has no built-in replication. See `.env.example` for the full comment.
- **Uploaded photos** (`UPLOADS_DIR`) — same idea: an absolute path outside the app folder, ideally inside `public_html/` so Apache/LiteSpeed can serve the files directly. See `.env.example`.

Set both env vars (plus `SESSION_SECRET`, `ADMIN_PASSWORD`, `CRON_SECRET`, `SITE_URL`, and the `SMTP_*` vars below) in the Node.js App's environment variable UI, then run `npm run db:push` once against production to create the schema.

`SITE_URL` should be the real public domain (`https://afaolaine.lv`, no trailing slash) — `robots.txt` and `sitemap.xml` build their absolute links from it.

League-source logos and the main-league flag (`is_main_league`) are set under **Līgu avoti**. Uploaded league logos use the existing uploads directory and image limits. The main-league flag is stored per source and does not enforce uniqueness. The homepage sponsor strip uses the first marked source in display order for its league logo. Match cards use the logo of the source matching their team and league name. If no logo is saved, the sponsor strip omits the league mark and match cards show the league name.

### Updating production

Deployment is manual, from the cPanel terminal (there is no automatic deploy hook).

**Back up the database first.** `scripts/backup-db.sh` copies the SQLite file (and any `-journal`, `-wal` or `-shm` file next to it) into `/home3/afaolain/afa_olaine-backups`, adding the current date and time to each name, e.g. `app.db.20261112-153045`. It prints the `TS` value and the rollback command. Set `DATA_DIR` or `BACKUP_DIR` if `TURSO_DATABASE_URL` or the backups folder point elsewhere.

```sh
cd /home3/afaolain/repositories/afa_olaine
git pull
bash scripts/backup-db.sh
```

`app.db.<TS>` must appear and its size must match the original (check against `/home3/afaolain/afa_olaine-data/app.db`). To roll the data back, stop the app in **Setup Node.js App**, copy `app.db.<TS>` over `/home3/afaolain/afa_olaine-data/app.db` with `cp -p`, and start the app again.

Then build the update:

```sh
source /home3/afaolain/nodevenv/repositories/afa_olaine/24/bin/activate
cd /home3/afaolain/repositories/afa_olaine
npm install            # only if package.json or package-lock.json changed
npm run db:migrate     # only if the @olaine/database version changed
npm run build -- --webpack
```

Then restart the app with the ⟳ button in **Setup Node.js App**.

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
