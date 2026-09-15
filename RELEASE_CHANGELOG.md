### What's New in AgentFlow v1.0.5

* **Cross-Device Metadata Date Normalization**:
  * Normalized screenshot capture timestamps across all OEM camera formats (`yyyy:MM:dd`, `yyyy-MM-dd`, `dd-MM-yyyy`, ISO-8601, and epoch seconds/milliseconds).
  * Capture dates are mapped to the canonical `dd-MMM-yyyy` format (e.g., `15-Sep-2026`) ensuring flawless matching with the app's date picker.

* **Offline Profile Earnings Calculation**:
  * Profile cycle and all-time earnings now calculate directly from the local SQLite database (`submissions_cache`).
  * Total earnings accurately reflect all completed work when offline (no longer displays ₹0).
  * Automatically reacts to new runsheet submissions and background sync updates.

* **Instant, Spinner-Free Menu Switching**:
  * Scoped ViewModels at the graph level to eliminate re-initialization delays when navigating between bottom tabs.
  * Silenced background network sync so pull-to-refresh indicators only appear when physically swiping down.
  * Smooth, instantaneous transitions between History, Log Work, Leave, and Profile.
