# AgentFlow Android — Architecture & Developer Reference

This document serves as the permanent reference for **AgentFlow**, documenting key architectural decisions, signing keystore configurations, the in-app auto-update pipeline, and codebase conventions for future feature development.

---

## 1. Project Overview

- **Application Name**: AgentFlow
- **Package ID**: `com.agentflow.tracker`
- **Current Version**: `1.0.2` (versionCode: `3`)
- **Tech Stack**: Kotlin 2.0.20, Jetpack Compose, Material 3, Coroutines/Flow, Supabase (PostgreSQL + Auth + Storage), Google ML Kit (on-device OCR), Coil (image loading), OkHttp3.
- **GitHub Repository**: [`SamarVScode/agent-summary-mechanism`](https://github.com/SamarVScode/agent-summary-mechanism) (branch: `main`).

---

## 2. Permanent Cryptographic Signing (Do Not Delete)

To guarantee that all future updates can be installed **in-place without reinstalling or losing data**, both `release` and `debug` build types use the same persistent keystore:

- **Keystore File**: [`agentflow-android/app/agentflow-release.jks`](file:///C:/Users/User/Desktop/payout%20app/agentflow-android/app/agentflow-release.jks)
- **Key Alias**: `agentflow`
- **Store Password**: `agentflow123`
- **Key Password**: `agentflow123`
- **Algorithm**: RSA 2048-bit, 25-year validity (expires 2051)
- **Gradle Config**: Configured in [`build.gradle.kts`](file:///C:/Users/User/Desktop/payout%20app/agentflow-android/app/build.gradle.kts) under `android.signingConfigs.release`.

> [!IMPORTANT]
> Never delete or re-generate `agentflow-release.jks`. If the keystore changes, Android will reject updates with `INSTALL_FAILED_UPDATE_INCOMPATIBLE`.

---

## 3. In-App Auto-Update Pipeline (Zero-Reinstall Flow)

When a new update is released, users do not need to download APKs through mobile browsers or uninstall previous versions.

### How the Flow Operates:
1. **GitHub Release Check**: On app launch (or manual tap in Settings), [`AppUpdateManager.kt`](file:///C:/Users/User/Desktop/payout%20app/agentflow-android/app/src/main/java/com/agentflow/tracker/domain/update/AppUpdateManager.kt) queries:
   `https://api.github.com/repos/SamarVScode/agent-summary-mechanism/releases/latest`
2. **Version Comparison**: Compares the remote tag (e.g. `1.0.3`) against `BuildConfig.VERSION_NAME`.
3. **In-App Modal**: If newer, [`AppUpdateDialog.kt`](file:///C:/Users/User/Desktop/payout%20app/agentflow-android/app/src/main/java/com/agentflow/tracker/ui/components/AppUpdateDialog.kt) displays release notes, download size, and an animated linear progress bar.
4. **Direct Package Install**: APK is streamed into `cacheDir/updates/AgentFlow-update.apk` and launched via `androidx.core.content.FileProvider` (`Intent.ACTION_VIEW`).

### How to Publish a Future Release:
1. In [`agentflow-android/app/build.gradle.kts`](file:///C:/Users/User/Desktop/payout%20app/agentflow-android/app/build.gradle.kts), increment:
   - `versionCode` (e.g., `4`)
   - `versionName` (e.g., `"1.0.3"`)
2. Commit and push changes to `main`:
   ```bash
   git add .
   git commit -m "feat: description of new features"
   git push origin main
   ```
3. GitHub Actions CI automatically builds and minifies `app-release.apk` with R8.
4. Create a GitHub Release with tag `v1.0.3` and attach the compiled `app-release.apk`.
5. Existing users' apps will immediately detect and prompt for the update!

---

## 4. Theme & Design System

- **Primary Color**: Modern flat blue (`#2563EB`)
  - Hover: `#1D4ED8`
  - Light Container: `#1A2563EB`
  - Dark Container: `#252563EB`
- **Brand Gradient**: Subtle linear dual-blue (`#2563EB` ➔ `#3B82F6`) defined in [`Color.kt`](file:///C:/Users/User/Desktop/payout%20app/agentflow-android/app/src/main/java/com/agentflow/tracker/ui/theme/Color.kt).
- **Theme Modes**: Supports `System`, `Light`, and `Dark`. Configured in [`Theme.kt`](file:///C:/Users/User/Desktop/payout%20app/agentflow-android/app/src/main/java/com/agentflow/tracker/ui/theme/Theme.kt) and controlled via [`SettingsBottomSheet.kt`](file:///C:/Users/User/Desktop/payout%20app/agentflow-android/app/src/main/java/com/agentflow/tracker/ui/screens/profile/SettingsBottomSheet.kt).

---

## 5. Adaptive App Icon (Android SOP)

The icon follows Android's Adaptive Icon specification (108dp canvas with 72dp safe zone) and supports Android 13+ Material You dynamic theming:

- **Background**: [`res/drawable/ic_launcher_background.xml`](file:///C:/Users/User/Desktop/payout%20app/agentflow-android/app/src/main/res/drawable/ic_launcher_background.xml) (Midnight slate `#0D1321`).
- **Foreground**: `res/drawable/ic_launcher_foreground.png` (432×432 flat blue & white "Apex A" glyph with alpha transparency).
- **Monochrome (Themed Icons)**: `res/drawable/ic_launcher_monochrome.png` (Pure `#FFFFFF` silhouette; Android dynamically tints this to match the user's wallpaper palette when "Themed Icons" is enabled).
- **Adaptive Definition**: [`ic_launcher.xml`](file:///C:/Users/User/Desktop/payout%20app/agentflow-android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml) and [`ic_launcher_round.xml`](file:///C:/Users/User/Desktop/payout%20app/agentflow-android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml).
- **Play Store Graphic**: [`agentflow-android/app/src/main/ic_launcher-playstore.png`](file:///C:/Users/User/Desktop/payout%20app/agentflow-android/app/src/main/ic_launcher-playstore.png) (512×512 32-bit PNG, flat square, sRGB).

---

## 6. Navigation Architecture

Handled in [`NavGraph.kt`](file:///C:/Users/User/Desktop/payout%20app/agentflow-android/app/src/main/java/com/agentflow/tracker/ui/navigation/NavGraph.kt) via a single unified `NavHost`:

| Route | Screen | Description |
|---|---|---|
| `login` | `LoginScreen` | Authentication by Agent Name + Casper ID |
| `tracker` | `TrackerScreen` | Log daily work (Camera/Picker + ML Kit OCR) |
| `dashboard` | `DashboardScreen` | Work history logs, cycle earnings, detail view |
| `leave` | `LeaveScreen` | Monthly calendar, leave booking, team overlap check |
| `profile` | `ProfileScreen` | Performance stats, payout rates, settings gear sheet |

### Key Navigation Behaviors:
- **TopBar & BottomBar**: Automatically hidden on `Screen.Login.route` and rendered only on authenticated tabs.
- **Logout Flow**: Calls `userPreferences.clearAgentInfo()` and navigates to `Screen.Login.route` with `popUpTo(0) { inclusive = true }`, cleanly taking the user to login without closing or crashing the app.
- **Hardware Back Press**: `BackHandler` in [`DetailHistoryView.kt`](file:///C:/Users/User/Desktop/payout%20app/agentflow-android/app/src/main/java/com/agentflow/tracker/ui/screens/dashboard/DetailHistoryView.kt) intercepts back gestures to close the detail view and return to the history list.

---

## 7. Supabase Database & Backend

- **API Client**: [`SupabaseService.kt`](file:///C:/Users/User/Desktop/payout%20app/agentflow-android/app/src/main/java/com/agentflow/tracker/data/api/SupabaseService.kt)
- **Tables**:
  - `work_submissions`: Stores daily records (`agent_name`, `date`, `total_count`, `completed_count`, `screenshot_url`, etc.).
  - `leave_requests`: Stores leave dates, duration, status (`pending`, `approved`, `rejected`), and agent name.
- **Storage Bucket**: `screenshots` (public read bucket for OCR verification images).
- **Deletion Support**: `deleteSubmissionsByDate(agentName, date)` removes submission records and cleans up storage.

---

## 8. Connected Device Quick Commands

- **Check device**:
  ```powershell
  & "$env:LOCALAPPDATA\Android\platform-tools\adb.exe" devices -l
  ```
- **Install APK directly**:
  ```powershell
  & "$env:LOCALAPPDATA\Android\platform-tools\adb.exe" install -r "<path-to-apk>"
  ```
- **Launch MainActivity**:
  ```powershell
  & "$env:LOCALAPPDATA\Android\platform-tools\adb.exe" shell am start -n com.agentflow.tracker/.MainActivity
  ```
