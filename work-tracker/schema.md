# Supabase Database Schema Setup

To completely start fresh and support all features of the Work Tracker dashboard (including the duplicate screenshot detection via file hash), please run the following SQL commands in your Supabase SQL Editor.

## 1. Create `agents` table
This table holds the list of available agents.

```sql
CREATE TABLE agents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert demo data
INSERT INTO agents (name) VALUES
('Demo Agent A'),
('Demo Agent B'),
('Demo Agent C');
```

## 2. Create `submissions` table
This table records every completed task summary. It now includes the `file_hash` column to prevent users from uploading the exact same screenshot twice.

```sql
CREATE TABLE submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date text NOT NULL, -- e.g., "03-Jun-2026"
  agent_name text NOT NULL,
  total_count integer,
  completed_count integer,
  image_url text NOT NULL,
  file_hash text UNIQUE, -- NEW: Prevents duplicate images
  processed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster agent queries on the dashboard
CREATE INDEX idx_submissions_agent_name ON submissions(agent_name);

-- Index for fast duplicate hash checking
CREATE INDEX idx_submissions_file_hash ON submissions(file_hash);
```

## 3. Storage Setup (If not already done)
Ensure you have a public bucket named `screenshots` created in your Supabase Storage.
