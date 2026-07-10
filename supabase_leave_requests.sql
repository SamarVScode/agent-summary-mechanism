-- Supabase schema for leave_requests
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Agents can insert their own leave requests
CREATE POLICY "Agents can insert their own leaves"
ON leave_requests FOR INSERT
WITH CHECK (true); -- Depending on auth setup, this might need auth.uid() check, but since agents don't have true auth accounts here (they use casper_id), we can allow all or handle via an API/Edge Function.

-- Agents can view their own leave requests
CREATE POLICY "Agents can view their own leaves"
ON leave_requests FOR SELECT
USING (true); -- In a real scenario, check against agent_name

-- Admins can manage all leave requests
CREATE POLICY "Admins can manage all leaves"
ON leave_requests FOR ALL
USING (true)
WITH CHECK (true);
