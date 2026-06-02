# Quick Setup Guide — Supabase + Google Sheets Bridge

Follow these steps to set up your Daily Work Tracker backend.

---

## Step 1 — Initialize Supabase Database
1. Go to [Supabase](https://supabase.com) and create a new project.
2. Find your **Project URL** (looks like `https://your-id.supabase.co`) and your **Publishable API key** (starts with `sb_publishable_`).
3. Go to the **SQL Editor** in the left sidebar, click **New Query**, paste the code below (replace the agent names at the bottom with your actual list), and click **Run**:

```sql
-- 1. Create tables
create table if not exists agents (
  id bigint primary key generated always as identity,
  name text not null
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  date text not null,
  agent_name text not null,
  total_count bigint not null,
  completed_count bigint not null,
  image_url text not null,
  processed boolean default false
);

-- 2. Disable RLS (Row Level Security) so the public key can write and sync
alter table agents disable row level security;
alter table submissions disable row level security;

-- 3. Populate agent names list
truncate table agents;
insert into agents (name) values
  ('Ravi Kumar'),
  ('Anjali Singh'),
  ('Samar Verma'),
  ('Vikram Malhotra'),
  ('Priya Sharma');
```

4. Go to **Storage** in the left sidebar, click **New Bucket**:
   - Name the bucket: `screenshots`
   - Toggle **"Public bucket"** to **Enabled**.
   - Click **Save**.
5. Set upload permissions for the bucket:
   - Click on the `screenshots` bucket.
   - Click **Policies** ➔ **New Policy** under the `screenshots` block.
   - Select **"Allow uploads to everyone"** (anonymous insert) and click **Save**.

---

## Step 2 — Configure React Frontend
Open `work-tracker/src/config.js` and paste your project URL and publishable key:
```javascript
export const SUPABASE_URL = "https://your-project-id.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_your_key_here";
```

---

## Step 3 — Set Up Google Sheets Apps Script
1. Open Google Sheets ➔ create a tab named `Tally`. Add headers in Row 1:
   `Timestamp | Date | Agent Name | Total (OFD+OFP) | Completed (Del+PU) | Image Drive URL`
2. Go to **Extensions ➔ Apps Script**.
3. Paste the contents of `gas/Code.gs` into the editor.
4. Set the constants at the top of the file:
   - `SPREADSHEET_ID` = your sheet ID from the browser URL
   - `DRIVE_FOLDER_ID` = your Drive folder ID from the folder URL
   - `SUPABASE_URL` = your Supabase URL
   - `SUPABASE_KEY` = your **Publishable API key** (the one starting with `sb_publishable_`)
5. Click **Save** (Ctrl+S).
6. Click the **Triggers (clock ⏰ icon)** on the left menu ➔ click **Add Trigger** (bottom right):
   - **Function to run**: `processSupabaseSubmissions`
   - **Event source**: `Time-driven`
   - **Type of trigger**: `Minutes timer`
   - **Interval**: `Every 5 minutes` (or `Every minute` for faster syncing)
   - Click **Save**.

---

## Step 4 — Run Local / Build
- Install dependencies: `npm install`
- Run local dev server: `npm run dev`
- Build for Vercel: `npm run build`
