# Setup Instructions: Wishmaster Earnings & Performance Dashboard

Follow these steps to deploy and run your premium, high-fidelity dashboard:

### 1. Spreadsheet Setup
1. In your **Google Sheets**, verify that your first sheet tab is formatted with these exact headers in Row 1:
   `Date`, `CasperFHRID`, `AgentName`, `Source_DC`, `OFP`, `OFD`, `del_update`, `Picked-up`, `DC Date`
2. Enter your Wishmaster transaction logs in subsequent rows. Dates should be in format `DD-MM-YYYY` (e.g. `01-06-2026`) or standard string formats like `01-jun-2026`.
3. Copy your **Spreadsheet ID** from your sheet's browser URL bar.
4. Note your sheet **Tab Name** (e.g. `Payouts`).

### 2. Apps Script Integration
1. In your sheet, click **Extensions > Apps Script**.
2. Delete any boilerplate code inside the editor.
3. Copy the entire contents of [Code.js](file:///C:/Users/User/Desktop/payout app/Code.js) and paste it into the script editor window. Save it as `Code.gs`.
4. Update variables on lines 4 and 5 of `Code.gs`:
   * Set `SPREADSHEET_ID` to your copied sheet ID (or leave as `""` if the script is container-bound to that active sheet).
   * Set `SHEET_TAB_NAME` to your tab name (e.g., `"Payouts"`).
5. In the script editor, click the **+** icon next to Files, select **HTML**, and name the file exactly `Index` (do not add the `.html` extension; GAS adds it automatically).
6. Copy the entire contents of [Index.html](file:///C:/Users/User/Desktop/payout app/Index.html) and paste it inside your `Index.html` editor, replacing all default boilerplate.
7. Click **Save Project** (the floppy disk icon).

### 3. Deploy as a Web App
1. Click **Deploy > New deployment** in the top right.
2. Click the gear icon (**Select type**) next to Configuration and select **Web app**.
3. Configure the settings:
   * **Description:** Wishmaster Dashboard v1.2
   * **Execute as:** Me (your email address)
   * **Who has access:** Anyone (necessary so that the frontend can load correctly; security is fully backed by Google's native authorization framework).
4. Click **Deploy**.
5. Copy the generated **Web app URL** and open it in any web browser to view your high-end payout dashboard!

### 4. Interactive Local Sandbox
If you double-click or open the local [Index.html](file:///C:/Users/User/Desktop/payout app/Index.html) file directly in a web browser (outside Google Apps Script), it detects the local environment automatically and launches in **Mock Sandbox** mode. All features work perfectly (interactive filters, sorting, real-time Chart.js updates, mock payment confirmation modal, success toasts, and printable agent payslip) using pre-packaged mock records!
