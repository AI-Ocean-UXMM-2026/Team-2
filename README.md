# ResolveMate

ResolveMate is the exception-handling layer for **one delivery company** that serves many sellers and their customers. The company's existing delivery system keeps owning delivery creation and execution; ResolveMate handles what goes wrong: delivery exceptions, customer reports, staff replies, driver reports, proactive delay notices and seller refund handoffs.

It is one responsive Next.js website with four portals, each behind Google sign-in and database-controlled roles:

| Portal     | Route                                                                                                                | For                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Operations | `/overview`, `/dashboard`, `/exceptions/[id]`, `/requests`, `/analytics`, `/activity`, `/conditions`, `/demo/events` | Delivery company staff                        |
| Customer   | `/customer/complaint`                                                                                                | People receiving deliveries                   |
| Seller     | `/seller`                                                                                                            | Shops whose orders the company delivers       |
| Driver     | `/driver`                                                                                                            | Delivery staff reporting problems on the road |

## Features

- **Exception inbox:** priority and SLA ordering, filters (priority, seller, status, category, assignment, SLA, age) and summary cards that apply them.
- **Exception detail:** a deterministic, explained next-action suggestion, assignment and audited status transitions, customer replies, private staff notes, seller updates and full history.
- **Customer portal:** pick an authorized order, report an issue with optional photos, follow status and replies with unread indicators, receive reviewed delay notices.
- **Seller portal:** only that seller's exceptions and refund-information handoffs. Customer conversations, staff notes and evidence stay private.
- **Driver reporting and route conditions:** drivers report attempt problems and road conditions; operations reviews which packages and customers are affected (from assignment history) before publishing a notice.
- **Complaint analytics:** daily, weekly and monthly complaint statistics with charts and calculated insights.
- **AI, with limits:** Groq (`openai/gpt-oss-120b`) only drafts apology and delay wording that staff edit and publish themselves, and can explain aggregate analytics numbers. It never classifies, routes, picks recipients, suggests actions or changes anything on its own. Everything works without it.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Supabase (Postgres, Auth with Google, Storage, row-level security) · Radix Themes + Tailwind CSS v4 · TanStack Query · Recharts · Vitest

## Run locally

Requirements: Node.js 20+ and a Supabase project.

```sh
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

| Variable                               | Required | Purpose                                                                     |
| -------------------------------------- | -------- | --------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | yes      | Supabase project URL                                                        |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes      | Supabase publishable (anon) key                                             |
| `GROQ_API_KEY`, `GROQ_MODEL`           | no       | Server-only AI drafting. Without them, staff use templates or write replies |

No service-role key is needed: reads go through row-level security and every write goes through guarded, audited database functions.

### Netlify deployment

Set the variables above in Netlify's environment settings. Next.js intentionally embeds
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in browser assets; use a Supabase publishable
key, never a secret or service-role key. `GROQ_API_KEY` stays server-only.

`netlify.toml` excludes only the public Supabase publishable key and the non-secret
`GROQ_MODEL` identifier from secrets scanning. Scanning remains enabled for API
keys and other secrets. Environment files are ignored except for `.env.example`,
which contains placeholders. If a subsequent scan flags another value, inspect
the reported files and remove any exposed credentials rather than disabling scanning.

### Database

For a new, empty Supabase project:

1. Run `supabase/bootstrap.sql` in the SQL editor (empty projects only).
2. Apply `supabase/migrations/*.sql` in filename order.
3. Enable the Google provider in Supabase Auth and add `http://localhost:3000/auth/callback` (and your deployed `/auth/callback`) to the redirect allowlist.

### Accounts and roles

Anyone can sign in with Google and use the customer portal. Staff and seller access is granted by an administrator in the database, never from Google profile data:

```sql
insert into public.staff_profiles(user_id, full_name, role)
values ('<auth-user-uuid>', 'Operations member', 'OPERATIONS');

insert into public.seller_users(user_id, seller_id, full_name)
select '<auth-user-uuid>', id, 'Seller member' from public.sellers where external_seller_id = 'demo-lotus';
```

### Demo data

The delivery company's real data interface is not connected. Instead, a signed-in customer can choose **Load my demo orders** to receive four fictional orders from two demo shops (Lotus Home and River Books), and operations can feed simulated source updates from `/demo/events`. All demo records are labeled `DEMO`. Demo features are switched by `exception_private.settings.demo_enabled`.

## Project structure

```
src/
  app/                    routes, API handlers, OAuth callback, staff access gate
  features/portal/        the connected portal screens
  core/domain/            pure business rules (classification, guidance, SLA, driver impact, analytics)
  infrastructure/         Supabase clients and data adapters, server-only Groq calls
  shared/                 design system: Radix Themes primitives, page patterns, theme
supabase/
  migrations/             database schema, RLS policies and guarded functions
  tests/                  SQL assertions (run through a trusted connection; fixtures roll back)
```

## Checks

```sh
npm test            # unit and component tests
npm run typecheck
npm run lint
npm run build
```
