# Supabase Database Setup

To enable the new login system and automated credential synchronization, please run the following SQL script in your **Supabase SQL Editor**.

## 1. Schema Update Script

```sql
-- Step 1: Add columns for authentication (if they don't already exist)
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS casper_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS password TEXT;

-- Step 2: Initialize existing agents with default credentials
-- This uses their name (lowercase, spaces replaced with dots) as a fallback
UPDATE agents 
SET casper_id = LOWER(REPLACE(name, ' ', '.')), 
    password = LOWER(REPLACE(name, ' ', '.'))
WHERE casper_id IS NULL;

-- Step 3: Enforce NOT NULL constraints
-- This ensures all future agents must have these fields
ALTER TABLE agents ALTER COLUMN casper_id SET NOT NULL;
ALTER TABLE agents ALTER COLUMN password SET NOT NULL;

-- Step 4: Add casper_id to submissions table
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS casper_id TEXT;
```

## 2. Instructions

1.  Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Select your project.
3.  Click on the **SQL Editor** icon in the left-hand navigation menu (looks like `>_`).
4.  Click **New query**.
5.  Paste the SQL code above into the editor.
6.  Click the **Run** button at the top right of the editor.

Once finished, your database will be fully compatible with the updated GAS management dashboard and the Work Tracker login page.
