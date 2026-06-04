# Dashboard Upgrade Guide: Agent Management & Side-by-Side Reconciliation

Follow these steps to update your Google Apps Script (GAS) project and Supabase database to support the new features.

---

## 1. Supabase SQL Setup (Permissions)
Run these commands in your **Supabase SQL Editor** to allow your apps to communicate with the database.

```sql
-- UNLOCK AGENTS TABLE
ALTER TABLE public.agents DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.agents TO anon;
GRANT ALL ON TABLE public.agents TO authenticated;
GRANT ALL ON TABLE public.agents TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- UNLOCK SUBMISSIONS TABLE
ALTER TABLE public.submissions DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.submissions TO anon;
GRANT ALL ON TABLE public.submissions TO authenticated;
GRANT ALL ON TABLE public.submissions TO service_role;

-- UNLOCK STORAGE (For Screenshots)
CREATE POLICY "Public Access" 
ON storage.objects 
FOR ALL 
TO public 
USING (bucket_id = 'screenshots') 
WITH CHECK (bucket_id = 'screenshots');
```

---

## 2. Google Apps Script Backend (`Code.gs` / `Code.js`)
Ensure your backend script contains these key sections:

### Configuration
```javascript
const SPREADSHEET_ID = "..."; 
const SHEET_TAB_NAME = "Agent_view";
const TEMP_SPREADSHEET_ID = "...";

// ── SUPABASE CONFIGURATION ──
const SUPABASE_URL = "https://matoieqhletkjcjfvars.supabase.co";
const SUPABASE_KEY = "sb_publishable_h4qeENgYle29ywox-PyN3g_A6QG-2XJ"; 
```

### New Backend Functions
*   `fetchAgentsFromSupabase()`: Retrieves names from the `agents` table.
*   `addAgentToSupabase(name)`: Inserts a name into the `agents` table.
*   `removeAgentFromSupabase(name)`: Deletes a name from the `agents` table.
*   `prepareTempTabForMonth(selectedMonth)`: Updated to include the **Reconciliation Logic** that compares `Agent_view` and `Tally` side-by-side.

---

## 3. Frontend Dashboard (`Index.html`)
The dashboard now includes:

1.  **Manage Agents Tab:** A new navigation button to access the agent list.
2.  **Agent Management View:** A UI to add and remove agents with real-time toast notifications.
3.  **Side-by-Side Reconciliation:** When you select a month, the dashboard generates a sheet with these headers:
    *   `Agent Details (from Agent_view)`
    *   `Supabase Total (OFD+OFP)`
    *   `Supabase Completed (Del+PU)`
    *   `Reconciliation Status` (✅ Matched / ⚠️ Discrepancy / ❌ No Record)
    *   `Supabase Image Link`

---

## 4. Pending: Header Customization
I am waiting for your preferred header names to finalize the visual layout of the reconciliation table. 

**Example Suggestion:**
- `Local OFD | Local OFP | Local Delivered | Local PickedUp | Supabase Total | Supabase Completed | Status`

**Please let me know if you want to change these labels!**
