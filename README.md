# Wishmaster Ecosystem: Performance & Payout Management

A dual-application system designed to streamline the workflow for delivery agents and administrators. The ecosystem consists of a mobile-first **Work Tracker** for agents and a premium **Payout Dashboard** for administrators.

---

## 🏗️ System Architecture

The ecosystem operates on a **Unified Data Flow** model:
1.  **Agents** submit work logs via the **React Work Tracker**.
2.  **Submissions** are stored in **Supabase** (Real-time database).
3.  **Administrators** monitor, verify, and process payouts via the **GAS Dashboard**, which merges Supabase data with official Google Sheet ledgers.

---

## 📱 1. Agent Work Tracker (React + Vite)
*Located in the `/work-tracker` directory.*

A mobile-responsive web application used by agents to log their daily performance.

### ✨ Key Features
-   **OCR Integration**: Automatically extracts delivery and pickup counts from screenshots using Tesseract.js.
-   **Real-time History**: Agents can view their previous submissions stored in Supabase.
-   **GAS Bridge**: Automatically syncs submissions to a Google Sheet ("Tally" tab) for redundancy.
-   **Authentication**: Secure login using Casper ID as the unique identifier.

### 🛠️ Setup & Development
1.  Navigate to the directory: `cd work-tracker`
2.  Install dependencies: `npm install`
3.  Start development server: `npm run dev`
4.  Build for production: `npm run build`

---

## 📊 2. Admin Payout Dashboard (Google Apps Script)
*Located in the root directory (`Code.js`, `Index.html`).*

A high-end administrative panel for verification, discrepancy analysis, and payment processing.

### ✨ Key Features
-   **Mismatch Highlighting**: Automatically flags rows where raw Sheet data differs from Supabase records.
-   **Monthly Payout Isolation**: Generates dedicated monthly tabs in an administrative spreadsheet for secure corrections.
-   **Real-time Sync**: Explicit button to pull the latest Supabase records into the dashboard.
-   **Advanced Exports**: Generate professional PDF payslips and CSV logs for accounting.
-   **Agent Management**: CRUD interface for managing the agent database in Supabase.

### 🛠️ Setup & Deployment
1.  Open your primary Google Sheet.
2.  Go to `Extensions` > `Apps Script`.
3.  Copy `Code.js` and `Index.html` from the root directory into the project.
4.  Deploy as a **Web App** (Execute as: Me, Access: Anyone).

---

## ⚙️ Shared Configuration

### Supabase Tables
The system requires the following tables in Supabase:
-   **`agents`**: `name`, `casper_id`, `password`
-   **`submissions`**: `date`, `agent_name`, `casper_id`, `total_count`, `completed_count`, `image_url`, `processed`

### Constants
-   **Primary Spreadsheet ID**: `1avV2Tx9SGaaUeFu2alONmXeXkGYqE4I5r1ZncPYmY7M` (Agent_view)
-   **Tally Spreadsheet ID**: `1ntacTkjZ6CZV3qHrNaxPYe_lch7ySDTeLuSNS_q_ATQ` (Syncing Tally)
-   **Rate per Task**: ₹13.00

---

## 🤝 Relationship Overview

| Feature | Agent Work Tracker | Admin Payout Dashboard |
| :--- | :--- | :--- |
| **Primary Goal** | Data Entry & OCR | Verification & Payout |
| **Tech Stack** | React, Vite, Tesseract | Alpine.js, GAS, Tailwind |
| **Source of Truth** | Supabase | Supabase + Google Sheets |
| **Sync Interval** | On Submission | On Refresh / Manual Sync |

---
*Created and Maintained by Gemini CLI Agent*
