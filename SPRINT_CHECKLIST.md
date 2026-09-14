# Sprint Execution Checklist: Production Release, Auto-Update & Features

- [x] **Task 1: Keystore & Release Signing Setup**
  - [x] 1.1 Generate permanent RSA 2048-bit release keystore (`agentflow-release.jks`)
  - [x] 1.2 Configure `build.gradle.kts` for `release` buildType with `isMinifyEnabled = true`, `isShrinkResources = true`
  - [x] 1.3 Add Proguard rules in `proguard-rules.pro` for Supabase, Kotlinx Serialization, Compose, Coil, and ML Kit

- [x] **Task 2: Performance & Smoothness Optimizations**
  - [x] 2.1 Add `key = { it.date }` in `DashboardScreen.kt` and `key = { it.id }` in `LeaveScreen.kt`
  - [x] 2.2 Offload `processSubmissions()` in `DashboardViewModel.kt` to `withContext(Dispatchers.Default)`
  - [x] 2.3 Optimize screenshot bitmap downsampling in `TrackerViewModel.kt` to prevent GC pauses
  - [x] 2.4 Cache calendar matrix & overlap math with `remember(...)` in `LeaveCalendarView.kt`
  - [x] 2.5 Configure Coil `ImageLoader` in `AgentFlowApplication.kt` with memory & disk cache

- [x] **Task 3: History Work Log Deletion Feature**
  - [x] 3.1 Add `deleteSubmissionsByDate(agentName, date)` to `SupabaseService.kt`
  - [x] 3.2 Add `deleteDailySubmission(date)` to `DashboardViewModel.kt`
  - [x] 3.3 Add delete icon button & confirmation `AlertDialog` to `DetailHistoryView.kt`

- [x] **Task 4: In-App Auto-Update System**
  - [x] 4.1 Add `REQUEST_INSTALL_PACKAGES` & `FileProvider` to `AndroidManifest.xml` and `res/xml/file_paths.xml`
  - [x] 4.2 Create `AppUpdateManager.kt` (GitHub release check, download with % progress, package installer intent)
  - [x] 4.3 Create `AppUpdateDialog.kt` (Material 3 UI with progress bar and changelog)
  - [x] 4.4 Wire auto-check into `MainActivity.kt` / `AgentFlowNavGraph.kt`

- [x] **Task 5: Profile Settings Button & Menu**
  - [x] 5.1 Add gear icon button in `ProfileScreen.kt` header
  - [x] 5.2 Create `SettingsBottomSheet.kt` with version info, manual "Check for Updates" trigger, theme selector, cache clearer, and logout

- [x] **Task 6: CI/CD Pipeline, Build & Device Installation**
  - [x] 6.1 Update `.github/workflows/build-apk.yml` for release builds with signing
  - [x] 6.2 Commit and push changes to `main`
  - [x] 6.3 Monitor GitHub Actions build run (Run `34810758480` - Success)
  - [x] 6.4 Download signed Release APK artifact and publish to GitHub Release v1.0.1
  - [x] 6.5 Verify live runtime stability, smooth scrolling, deletion flow, and update checker
