# AgentFlow Android (Native Kotlin & Jetpack Compose)

A 1:1 native Android implementation of the **AgentFlow Work Tracker** application.

---

## Features

1. **Authentication:** Casper ID & Password login authenticated against Supabase `agents` table, with session persistence via Jetpack DataStore.
2. **Work Logging (Tracker):**
   - Date picker (`DD-MMM-YYYY`).
   - Image picker with SHA-256 duplicate detection against existing submissions.
   - **Google ML Kit Text Recognition** for instant, on-device offline OCR parsing (`Total` and `Completed` counts).
   - Review bottom sheet modal with editable counts.
   - Supabase Storage image upload (`screenshots` bucket) + Database record insertion.
   - Submission result screen with celebration checkmark and earnings preview.
3. **History & Work Logs (Dashboard):**
   - Month dropdown filter.
   - 2-Cycle filter tabs: **All Month**, **Cycle 1 (1–15)**, and **Cycle 2 (16–End)** with badge counters.
   - Grouped daily summaries summing counts across multiple screenshots taken on the same day.
   - Daily detail view with screenshot timeline, timestamps, individual earnings, and full-screen zoomable image viewer.
4. **Leave Management:**
   - Visual month calendar view with previous/next navigation.
   - Approved user leaves highlighted in green; team member leaves indicated.
   - Duration bottom sheet picker (1 to 14 days) with automatic end-date calculation.
   - Automated team overlap check before submission.
   - Leave history list with status chips (`Pending`, `Approved`, `Rejected`), edit, and cancel actions.
   - Real-time unread leave notification red badge on bottom navigation tab.
5. **Profile & Payouts:**
   - Agent avatar, name, and Casper ID badge.
   - Payout rate per task and all-time completed tasks counter.
   - Interactive 2-cycle payout calculator by month and cycle.
   - Light and Dark theme toggle.
   - Account logout.

---

## How to Build the APK

### Method 1: Android Studio (Recommended)
1. Open **Android Studio**.
2. Select **Open** and select the directory: `C:\Users\User\Desktop\payout app\agentflow-android`.
3. Allow Gradle to sync dependencies.
4. Click **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
5. The generated APK will be located at:
   `app/build/outputs/apk/debug/app-debug.apk`.

### Method 2: Command Line (Gradle)
```bash
# In the agentflow-android folder:
./gradlew assembleDebug

# Output APK:
app/build/outputs/apk/debug/app-debug.apk
```

### Method 3: GitHub Actions (No local Android SDK needed)
Push the repo to GitHub. The included workflow `.github/workflows/build-apk.yml` will automatically build the APK on Ubuntu runners and make it available as a downloadable artifact in the Actions tab.
