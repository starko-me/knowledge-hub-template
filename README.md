# My App

A **Next.js** application that powers a full-featured **Help Center** backed by [Starko](https://starko.one). It provides a public knowledge base (categories, articles, search), support ticket management, and a real-time inbox—all with optional user authentication via Supabase.

---

## What it does

- **Help Center** (`/help-center`) — Browse categories and subcategories, read articles, and search the knowledge base. Content and workspace branding are driven by the Starko API.
- **Support tickets** — Users can create and view support tickets (with auth when configured).
- **Inbox** — Real-time messaging/inbox experience using Supabase Realtime.
- **Starko integration** — Fetches workspace info, categories, articles, and ticket data from the Starko v2 API using your workspace ID.

Built with **Next.js 16**, **React 19**, **Tailwind CSS**, **TanStack Query**, **Supabase**, and **Radix UI**.

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) (or [Bun](https://bun.sh/) — the repo includes `bun.lock`)
- A [Starko](https://starko.one) workspace (for help center content and API)
- A [Supabase](https://supabase.com) project (for auth and real-time inbox)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd my-app
bun install
# or: npm install
```

### 2. Environment variables

Create a `.env.local` file in the project root with the following variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_STARKO_WORKSPACE_ID` | **Yes** | Your Starko workspace ID. Used as the `x-starko-workspace-id` header when calling the Starko API for categories, articles, workspace info, and tickets. |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** (for auth/inbox) | Your Supabase project URL (e.g. `https://xxxxx.supabase.co`). Required for Supabase client and real-time features. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** (for auth/inbox) | Your Supabase anonymous (public) key. Safe to use in the browser; used for auth and Realtime. |

**Example `.env.local`:**

```env
# Starko Help Center API
NEXT_PUBLIC_STARKO_WORKSPACE_ID=your-starko-workspace-id

# Supabase (auth + real-time inbox)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

- Get **Starko** credentials from your [Starko](https://starko.one) dashboard.
- Get **Supabase** URL and anon key from your project: **Settings → API** in the Supabase dashboard.

### 3. Run the app

```bash
bun dev
# or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The Help Center is at [http://localhost:3000/help-center](http://localhost:3000/help-center).

---

## Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start the Next.js dev server |
| `bun run build` | Build for production |
| `bun run start` | Start the production server |
| `bun run lint` | Run ESLint |

---

## Project structure (overview)

- `app/` — Next.js App Router: home page and `/help-center` routes (categories, articles, tickets, inbox).
- `components/` — UI and help-center-specific components (search, navbar, tickets, auth dialog, etc.).
- `lib/` — Server actions and client helpers: Starko API (`help-center.ts`), Supabase client (`supabase.ts`), config (`help-center-config.ts`), session, prefetch, and utilities.

---

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Starko](https://starko.one)
