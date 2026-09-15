### What's New in AgentFlow v1.0.4

* **Offline-First SQLite Caching**:
  * Submit daily runsheets and view past work logs seamlessly without requiring an active internet connection.
  * Local caching ensures instant screen loads and reliable data access anywhere.

* **Background Sync via WorkManager**:
  * Pending offline runsheets and screenshots are automatically synced to Supabase when network connectivity returns.
  * Automatic retry handling and cleanup of temporary local image files upon successful sync.

* **Strict Metadata Date Validation**:
  * Screenshot capture dates are strictly validated directly from system `MediaStore` and binary `ExifInterface` headers (eliminating unreliable filename guessing).
  * Enforces date matching: only same-day screenshots can be submitted for the selected date.

* **Network-Aware UI & Real-Time Sync Indicators**:
  * Prominent pending sync banner on Dashboard: *"X runsheet(s) waiting to sync — Connect to internet to sync"*.
  * Distinct "Waiting to sync" status badges on pending submission cards.
  * Pull-to-refresh displays an instant *"No internet connection"* Toast when offline.
  * Clear, user-friendly *"Please connect to the internet to check for updates"* prompt instead of raw DNS/host errors.

* **Battery & Data Optimization**:
  * Replaced continuous timer-based network polling with reactive local database triggers and smart on-demand refreshes.
