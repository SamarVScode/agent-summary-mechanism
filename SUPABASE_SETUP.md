# Supabase Database Setup

To enable the new login system, automated credential synchronization, and precise side-by-side reconciliation, please run the following SQL script in your **Supabase SQL Editor**. This script will create the necessary tables if they don't exist and add the required columns.

## 1. Full Schema Script

```sql
-- 1. Create or Update 'agents' table
CREATE TABLE IF NOT EXISTS agents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  casper_id text UNIQUE,
  password text,
  rate_amount numeric DEFAULT 13.00,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure columns exist if table was already there
ALTER TABLE agents ADD COLUMN IF NOT EXISTS casper_id TEXT UNIQUE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS rate_amount NUMERIC DEFAULT 13.00;

-- Initialize existing agents with default credentials
UPDATE agents 
SET casper_id = LOWER(REPLACE(name, ' ', '.')), 
    password = LOWER(REPLACE(name, ' ', '.')),
    rate_amount = 13.00
WHERE casper_id IS NULL OR rate_amount IS NULL;

-- Enforce constraints
ALTER TABLE agents ALTER COLUMN casper_id SET NOT NULL;
ALTER TABLE agents ALTER COLUMN password SET NOT NULL;


-- 2. Create or Update 'submissions' table
CREATE TABLE IF NOT EXISTS submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date text NOT NULL, -- e.g., "03-jun-2026"
  agent_name text NOT NULL,
  casper_id text,
  total_count integer,
  completed_count integer,
  image_url text NOT NULL,
  file_hash text UNIQUE, 
  processed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure casper_id exists if table was already there
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS casper_id TEXT;

-- 3. Create Optimized Indices
CREATE INDEX IF NOT EXISTS idx_submissions_agent_name ON submissions(agent_name);
CREATE INDEX IF NOT EXISTS idx_submissions_file_hash ON submissions(file_hash);
CREATE INDEX IF NOT EXISTS idx_submissions_matching ON submissions(date, agent_name, casper_id);
```

## 2. Instructions

1.  Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Select your project.
3.  Click on the **SQL Editor** icon in the left-hand navigation menu (looks like `>_`).
4.  Click **New query**.
5.  Paste the SQL code above into the editor.
6.  Click the **Run** button at the top right of the editor.

Once finished, your database will be fully compatible with:
*   The updated **GAS Management Dashboard** (Automated Sync & Reconciliation).
*   The updated **Work Tracker App** (Secure Login & Tracking).
*   The **GAS Sync Script** (Populating the Tally sheet).
