# Supabase + Google Apps Script Setup Guide

To bypass corporate Google Workspace CORS/login restrictions, we route the React app's inputs and screenshots to a free, public **Supabase** backend. An internal **Google Apps Script** runs automatically in your organization's environment to pull submissions and sync agent lists.

---

## Step 1 — Set Up Supabase

1. Go to [Supabase](https://supabase.com) and sign up for a free account.
2. Create a new project (e.g. `work-tracker`). Choose a database password and save it.
3. Once the project is ready, go to the **SQL Editor** (left navigation bar) and click **New Query**.
4. Paste the following SQL script to create your tables and policies, then click **Run**:

```sql
-- 1. Create the agents table
create table agents (
  id bigint primary key generated always as identity,
  name text not null
);

-- 2. Create the submissions table
create table submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  date text not null,
  agent_name text not null,
  total_count bigint not null,
  completed_count bigint not null,
  image_url text not null,
  processed boolean default false
);

-- 3. Enable RLS (Row Level Security)
alter table agents enable row level security;
alter table submissions enable row level security;

-- 4. Enable public read for agents (React app can read agent names)
create policy "Allow public select on agents" on agents
  for select using (true);

-- 5. Enable public insert for submissions (React app can submit logs)
create policy "Allow public insert on submissions" on submissions
  for insert with check (true);
```

5. Go to **Storage** (left navigation bar) and click **New Bucket**:
   - Name the bucket: `screenshots`
   - **Important**: Toggle **"Public bucket"** to **Enabled**.
   - Click **Save**.
6. Set bucket permissions so users can upload files:
   - Click on the `screenshots` bucket.
   - Click **Policies** (or **Configuration** → **Policies**).
   - Under **Storage Policies**, click **New Policy** under the `screenshots` bucket block.
   - Select **"Allow uploads to everyone"** (or create a custom policy with only `Insert` checked for anonymous users).
   - Click **Save**.

---

## Step 2 — Configure React App

1. Go to **Project Settings** (gear icon ⚙ at the bottom left) → **API**.
2. Copy the **Project URL** and the **anon key** (`service_role` is private, copy **`anon` `public`** key).
3. Open [config.js](file:///C:/Users/User/Desktop/payout app/work-tracker/src/config.js) in your React project and paste them:
   ```javascript
   export const SUPABASE_URL = "https://your-project-id.supabase.co";
   export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5...";
   ```

---

## Step 3 — Set Up Google Sheets & Drive

1. Open Google Sheets and create a **new spreadsheet** (or use an existing one) inside your organization.
2. Create **two tabs**:
   - `Tally` — your work log
   - `Agents` — list of agent names in Column A (no header)
3. In the **Tally** tab, add these headers in **Row 1**:
   `Timestamp | Date | Agent Name | Total (OFD+OFP) | Completed (Del+PU) | Image Drive URL`
4. Copy your **Spreadsheet ID** from the browser URL:
   `https://docs.google.com/spreadsheets/d/  ←YOUR_ID_HERE→  /edit`
5. Go to [Google Drive](https://drive.google.com), create a folder for screenshots, and copy its **Folder ID** from the URL:
   `https://drive.google.com/drive/folders/  ←YOUR_FOLDER_ID_HERE→`

---

## Step 4 — Configure Apps Script

1. In your Google Sheet, click **Extensions → Apps Script**.
2. Delete all default boilerplate code in the editor.
3. Copy the **entire contents** of [Code.gs](file:///C:/Users/User/Desktop/payout app/work-tracker/gas/Code.gs) and paste it into the editor.
4. Update the constants at the top with your Sheets, Drive, and Supabase credentials:
   ```javascript
   const SPREADSHEET_ID        = "PASTE_YOUR_SPREADSHEET_ID_HERE";
   const SHEET_TAB_NAME        = "Tally";
   const AGENTS_SHEET_TAB_NAME = "Agents";
   const DRIVE_FOLDER_ID       = "PASTE_YOUR_DRIVE_FOLDER_ID_HERE";
   
   const SUPABASE_URL          = "PASTE_YOUR_SUPABASE_URL_HERE";
   const SUPABASE_ANON_KEY     = "PASTE_YOUR_SUPABASE_ANON_KEY_HERE";
   ```
5. Click **Save** (Ctrl+S / Cmd+S). Name the project `WorkTrackerSync`.

---

## Step 5 — Run Initial Sync & Triggers

1. **Initial Agent Sync**:
   - In the Apps Script Editor, select **`syncAgentsToSupabase`** in the function dropdown at the top.
   - Click **Run**. 
   - Authorize permissions when prompted (it will ask for Sheets, Drive, and External Connection permissions).
   - Go to your Supabase Dashboard → Table Editor → `agents` table. You should see your Sheet's agent list fully synced!

2. **Automate Submissions Sync**:
   - In the left sidebar of the Apps Script Editor, click **Triggers (alarm clock icon ⏰)**.
   - Click **Add Trigger** (bottom right).
   - Configure the trigger:
     - **Choose which function to run**: `processSupabaseSubmissions`
     - **Choose which deployment to run**: `Head`
     - **Select event source**: `Time-driven`
     - **Select type of time based trigger**: `Minutes timer`
     - **Select minute interval**: `Every 5 minutes` (or `Every minute` for faster syncing)
   - Click **Save**.

3. **Automate Agent List Updates** (Optional):
   - You can also add another trigger to automatically sync agents whenever the Google Sheet is edited:
     - **Choose which function to run**: `syncAgentsToSupabase`
     - **Select event source**: `From spreadsheet`
     - **Select event type**: `On edit` (or `On change`)
     - Click **Save**.

---

## Done! 
Your setup is complete. You can now build and deploy the React app to Vercel. Whenever an agent submits their work log, it is saved immediately to Supabase and pulled automatically into Google Sheets and Drive.
