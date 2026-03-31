# UniSchedule — Next.js + Supabase

A full-stack university schedule app with PDF upload, schedule browser, teacher directory, and resource library.

---

## Project Structure

```
uni-schedule/
├── src/
│   ├── app/
│   │   ├── page.tsx                   # Schedule (home)
│   │   ├── teachers/page.tsx          # Teachers directory
│   │   ├── resources/page.tsx         # Resources / books
│   │   ├── admin/page.tsx             # Admin dashboard
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       ├── upload-pdf/route.ts    # POST — parse & store PDF
│   │       ├── schedule/route.ts      # GET  — fetch schedule
│   │       ├── teachers/route.ts      # GET  — fetch teachers
│   │       ├── resources/route.ts     # GET + POST resources
│   │       ├── groups/route.ts        # GET  — fetch groups
│   │       └── subjects/route.ts      # GET  — fetch subjects
│   ├── components/
│   │   └── Nav.tsx
│   └── lib/
│       ├── supabase.ts                # Supabase client helpers
│       └── pdfParser.ts               # PDF parsing logic
├── supabase/
│   └── migrations/
│       └── 001_init.sql               # Database schema
├── .env.local.example
├── next.config.js
├── tailwind.config.js
└── vercel.json
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to https://supabase.com and create a new project.
2. Open the **SQL Editor** and run the contents of `supabase/migrations/001_init.sql`.
3. Go to **Project Settings → API** and copy:
   - `Project URL`
   - `anon public` key
   - `service_role` key (keep this secret — server-side only)

### 3. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_SECRET=choose_a_strong_secret_password
```

> **Never commit `.env.local`** — it contains secrets.

### 4. Run locally

```bash
npm run dev
```

Open http://localhost:3000

---

## Usage

### Schedule page (/)
- Browse the full schedule.
- Filter by group using the dropdown.

### Teachers page (/teachers)
- View all teachers imported from the PDF.
- Search by name.

### Resources page (/resources)
- Browse books/resources per subject.
- Filter by subject.

### Admin dashboard (/admin)
- Enter your `ADMIN_SECRET` to authenticate.
- **Upload Schedule PDF**: parses the PDF and imports groups, subjects, teachers, and schedule rows into the database.
- **Add Resource**: attach a title + link URL or file upload to a subject.

---

## PDF Parsing Notes

The parser (`src/lib/pdfParser.ts`) uses two strategies:

1. **Table format**: If the PDF contains a header row with keywords like `group`, `subject`, or `Группа`, `Предмет`, it splits subsequent lines by tabs or 2+ spaces into columns.

2. **Block format**: Falls back to detecting group names (e.g. `CS-101`) and reading the next lines as time → subject → teacher → room.

**If your PDF has a different layout**, edit `src/lib/pdfParser.ts`:
- For table PDFs: adjust `mapColumns()` column index mapping.
- For other formats: update the regex patterns in `parseBlockFormat()`.

You can preview the parsed raw text by logging `data.text` inside `parsePdfSchedule()`.

---

## Deploy to Vercel

1. Push the project to a GitHub repo.
2. Import into Vercel at https://vercel.com/new.
3. Add all four environment variables in the Vercel dashboard under **Settings → Environment Variables**.
4. Deploy — Vercel auto-detects Next.js.

```bash
# Or deploy via CLI
npm i -g vercel
vercel
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| PDF Parsing | pdf-parse |
| Styling | Tailwind CSS |
| Hosting | Vercel |
