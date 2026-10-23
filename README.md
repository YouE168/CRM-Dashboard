# Rural Community Partners CRM

A custom CRM built from scratch for Rural Community Partners (RCP), a nonprofit that supports small businesses and entrepreneurs in rural communities. It brings program management, mentoring, document sharing, and impact reporting into one place.

Built as a summer internship project.

## Features

- **Admin dashboard:** manage businesses, contacts, members, programs, and case notes; analytics and reports.
- **Role-based portals:** separate experiences for admins, mentors, mentees, entrepreneurs, coalition leaders, and partner organizations.
- **Mentoring:** mentor matching, session logging, goals, notes, ratings, and session documents.
- **Meeting time log:** filterable log with CSV export, for admins and for each user.
- **Shared documents:** admins publish documents to individuals, businesses, or groups.
- **Referral and outcome tracking:** report by date range, county, and program with CSV export. Mentor-entered entries go through an admin review/approval step before they count.
- **Notifications and reminders:** in-app notification bell, direct messages, and email reminders.
- **Signup and invites:** registration form, branded invite emails, and admin approval of access.

## Tech stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Row Level Security)
- **Deployment:** Vercel

## Database

The schema is managed with SQL migration files in the repo root (for example `add_referrals_outcomes.sql` and `referrals_outcomes_review.sql`). They define tables, row-level security policies so each role only sees its own data, and `SECURITY DEFINER` functions for things like account linking and time logs. Run them in the Supabase SQL editor.

## Getting started

```bash
npm install
cp .env.example .env.local   # add your Supabase URL and keys
npm run dev
```

Open http://localhost:3000.

Environment variables (set in `.env.local`, never commit them):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `NEXT_PUBLIC_APP_URL`, `EMAIL_FROM`, `EMAIL_SERVICE_API_KEY`, `CRON_SECRET` (email and scheduled reminders)
