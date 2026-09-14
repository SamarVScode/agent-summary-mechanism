# AgentFlow Android — Performance Optimization & Smoothness Roadmap

This roadmap documents every identified source of latency, frame drops (jank), memory pressure, and APK size bloat in the AgentFlow Android application, along with the precise architectural solution for each. Use this checklist for future optimization sprints.

---

## 📊 Expected Impact Summary
| Metric | Current State (Debug) | Target State (Optimized Release) |
|---|---|---|
| **Frame Rate** | 30–45 FPS (visible stutters) | **Solid 60–120 FPS** (fluid animations) |
| **App RAM Usage** | 120MB – 190MB (GC spikes) | **45MB – 70MB** |
| **Garbage Collection Pauses** | ~80ms pauses (5–6 dropped frames) | **< 5ms** (imperceptible) |
| **Cold Startup Time** | ~1.5s – 2.2s | **< 600ms** |
| **APK File Size** | ~20.4 MB | **~12.0 MB – 14.0 MB** |

---

## 🚀 Phase 1: High Impact & Quick Wins (Highest ROI)

### [ ] 1. Switch to Signed Release Build with R8 Minification
* **Root Cause**: The current APK is running in **Debug Mode**. In Jetpack Compose, debug builds inject live-literals hooks, disable method inlining, and include extensive runtime inspection code that makes the UI 3×–5× slower.
* **Action**:
  - Configure `isMinifyEnabled = true` and `isShrinkResources = true` in `app/build.gradle.kts`.
  - Add Proguard/R8 rules to keep Supabase data models and serialization.
  - Build via `./gradlew assembleRelease`.
* **Expected Gain**: Instant ~3x increase in frame rate and ~40% reduction in APK download size.

---

### [ ] 2. Provide Unique Keys to `LazyColumn` Items
* **Affected Files**:
  - `agentflow-android/app/src/main/java/com/agentflow/tracker/ui/screens/dashboard/DashboardScreen.kt`
  - `agentflow-android/app/src/main/java/com/agentflow/tracker/ui/screens/leave/LeaveScreen.kt`
* **Root Cause**:
  ```kotlin
  // Current:
  items(uiState.filteredSubmissions) { sub -> ... }
  items(uiState.userLeaves) { leave -> ... }
  ```
  Without explicit item keys, any change to the list or filter forces Compose to discard and re-render every visible item card from scratch.
* **Action**:
  ```kotlin
  // Target:
  items(uiState.filteredSubmissions, key = { it.date }) { sub -> ... }
  items(uiState.userLeaves, key = { it.id }) { leave -> ... }
  ```
* **Expected Gain**: Eliminates list hitching and stutter during scrolling or cycle filter switching.

---

### [ ] 3. Offload Data Grouping & Date Sorting to Background Threads
* **Affected File**: `agentflow-android/app/src/main/java/com/agentflow/tracker/ui/screens/dashboard/DashboardViewModel.kt`
* **Root Cause**: `processSubmissions()` performs grouping, date parsing (`DateUtils.parseDate`), and sorting on `Dispatchers.Main` (the UI Thread). When 30–60 submissions exist, this freezes the UI thread for 20–50ms.
* **Action**:
  Wrap data transformation in `withContext(Dispatchers.Default) { ... }` so sorting runs on background CPU cores without touching the UI thread.
* **Expected Gain**: Zero UI freeze when switching months or filtering cycles.

---

### [ ] 4. Downscale Screenshots Before Image Decoding
* **Affected File**: `agentflow-android/app/src/main/java/com/agentflow/tracker/ui/screens/tracker/TrackerViewModel.kt`
* **Root Cause**: Uploading or previewing full-resolution phone screenshots (e.g. 1080×2400 or 4K) decompresses into 15–25MB of raw bitmap RAM, causing an ~80ms Garbage Collection pause (`GC total 80.884ms` in logcat).
* **Action**:
  - Sample down bitmaps to max 1080px dimension before holding them in state or decoding via Coil.
  - Recycle intermediate bitmaps immediately after uploading.
* **Expected Gain**: Prevents 80ms GC pauses; eliminates frame drops during review sheet transitions.

---

## 🎨 Phase 2: GPU & Graphics Pipeline (Smooth Scrolling)

### [ ] 5. Replace Dynamic Elevation Shadows with Outlines on Lists
* **Affected Files**: `DashboardScreen.kt`, `LeaveScreen.kt`
* **Root Cause**:
  `Card(elevation = CardDefaults.cardElevation(defaultElevation = 2.dp))` forces Android's Skia renderer to perform multi-pass offscreen shadow lighting calculations on every frame. This heavily strains MediaTek and budget GPU architectures during fast scrolling.
* **Action**:
  Use flat card containers with subtle outline borders:
  ```kotlin
  border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.25f))
  ```
* **Expected Gain**: Butter-smooth list scrolling at 60/120 FPS on all Android hardware.

---

### [ ] 6. Eliminate GPU Overdraw from Nested Background Layers
* **Affected Files**: `DashboardScreen.kt`, `AgentFlowTopBar.kt`, `LeaveScreen.kt`
* **Root Cause**: Windows have background, parent `Column` has `.background()`, and child `Card`s have background. Pixels are being drawn up to 4 times per frame.
* **Action**:
  Remove redundant parent `.background(MaterialTheme.colorScheme.background)` modifiers where the underlying Window/Scaffold already draws that exact color.
* **Expected Gain**: Reduced GPU fill-rate strain and lower battery consumption.

---

### [ ] 7. Use `.drawBehind` for Badges Instead of Nested `Box` Elements
* **Root Cause**: Wrapping text in multiple `Box` elements just for rounded pill backgrounds creates separate `LayoutNode` measure/layout passes.
* **Action**:
  Use `Modifier.drawBehind { drawRoundRect(...) }` for simple pill and status badge backgrounds.
* **Expected Gain**: Significantly shallower Compose layout tree.

---

## 🧠 Phase 3: Memory & Garbage Collection Optimization

### [ ] 8. Configure Dedicated Coil Memory & Disk Cache
* **Affected File**: `agentflow-android/app/src/main/java/com/agentflow/tracker/AgentFlowApplication.kt`
* **Root Cause**: Coil currently operates on default parameters with no tuned in-memory bitmap cache or persistent disk cache.
* **Action**:
  Initialize an explicit `ImageLoader`:
  ```kotlin
  val imageLoader = ImageLoader.Builder(this)
      .memoryCache { MemoryCache.Builder(this).maxSizePercent(0.25).build() }
      .diskCache { DiskCache.Builder().directory(cacheDir.resolve("image_cache")).maxSizeBytes(50L * 1024 * 1024).build() }
      .crossfade(true)
      .build()
  Coil.setImageLoader(imageLoader)
  ```
* **Expected Gain**: Previously viewed screenshot records load instantaneously with zero network or decoding lag.

---

### [ ] 9. Cache Date & Calendar Math with `remember`
* **Affected File**: `agentflow-android/app/src/main/java/com/agentflow/tracker/ui/screens/leave/LeaveCalendarView.kt`
* **Root Cause**: Building the 35–42 date cell matrix and checking team overlaps currently executes on every recomposition pass.
* **Action**:
  Wrap calendar day calculations in `remember(month, userLeaves, teamLeaves) { ... }`.
* **Expected Gain**: Prevents CPU churn during touch interactions or dialog popups.

---

### [ ] 10. Modernize Date Formatting with `java.time` / Caching
* **Root Cause**: Frequent calls to `SimpleDateFormat("yyyy-MM-dd")` allocate new `Date`, `Calendar`, and string buffer objects on the heap.
* **Action**:
  Use Android 8.0+ `java.time.LocalDate` and `DateTimeFormatter.ISO_LOCAL_DATE`, or cache parsed dates in models.
* **Expected Gain**: Eliminates thousands of short-lived temporary heap allocations.

---

## ⚡ Phase 4: Network & Compose Compiler Architecture

### [ ] 11. Mark Data Models as `@Immutable` or Use `ImmutableList`
* **Root Cause**: Kotlin's standard `List<T>` is considered unstable by the Compose Compiler. Composables accepting lists are marked "unskippable".
* **Action**:
  - Annotate UI models (`Submission`, `LeaveRequest`, `GroupedDailySubmission`) with `@Immutable`.
  - Or use `kotlinx.collections.immutable.ImmutableList`.
* **Expected Gain**: Enables Compose compiler to skip 80%+ of recomposition passes when data hasn't changed.

---

### [ ] 12. Run Network Requests in Parallel (`async` / `awaitAll`)
* **Affected File**: `agentflow-android/app/src/main/java/com/agentflow/tracker/ui/screens/leave/LeaveViewModel.kt`
* **Root Cause**:
  ```kotlin
  val agentRes = supabaseService.fetchAgentLeaves(agentName)
  val teamRes = supabaseService.fetchApprovedTeamLeaves()
  ```
  Calls run sequentially. If each takes 300ms, total wait time is 600ms.
* **Action**:
  ```kotlin
  val agentDeferred = async { supabaseService.fetchAgentLeaves(agentName) }
  val teamDeferred = async { supabaseService.fetchApprovedTeamLeaves() }
  val (agentRes, teamRes) = awaitAll(agentDeferred, teamDeferred)
  ```
* **Expected Gain**: Cuts network wait time in half (from ~600ms to ~300ms).

---

### [ ] 13. Pre-warm Google ML Kit OCR Engine
* **Affected File**: `agentflow-android/app/src/main/java/com/agentflow/tracker/domain/ocr/MlKitOcrExtractor.kt`
* **Root Cause**: The first time an image is processed, ML Kit loads its machine learning model weights into RAM, creating a 500ms–1000ms delay.
* **Action**:
  Instantiate `TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)` in a background thread when the app initializes or when the Tracker tab opens.
* **Expected Gain**: First OCR extraction runs instantaneously without initial model-loading lag.

---

### [ ] 14. Add Jetpack Compose Baseline Profile
* **Root Cause**: Without Baseline Profiles, Android's ART runtime must JIT (Just-In-Time) compile Compose composable functions on the fly while the user interacts with the app.
* **Action**:
  Generate an Android Baseline Profile module (`androidx.benchmark.macro`) to include with the Release build.
* **Expected Gain**: 30% faster app startup and 0 first-time frame drops on initial tab switches.

---

---

## 🔄 Phase 5: Seamless In-App Auto-Updates (Zero-Reinstall Architecture)

### [ ] 15. Persistent Cryptographic Keystore Configuration (Prerequisite)
* **Root Cause**: In Android's package security architecture, updating an existing app without uninstalling strictly requires that both APKs share the **exact same cryptographic signing key**. Currently, GitHub Actions creates an ephemeral debug keystore on every run, leading to `INSTALL_FAILED_UPDATE_INCOMPATIBLE`.
* **Action**:
  - Generate a permanent `agentflow-release.keystore`.
  - Base64-encode the keystore and store it securely in GitHub Actions Secrets (`RELEASE_KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`).
  - Configure `app/build.gradle.kts` to sign both release and continuous delivery builds with this persistent key.
* **Expected Gain**: Enables seamless in-place updates without ever losing user data, login sessions, or requiring an uninstall.

---

### [ ] 16. Remote Version Check Endpoint (Supabase or GitHub Releases)
* **Root Cause**: The app needs a reliable, lightweight mechanism to detect when a newer version has been published.
* **Action**:
  - Store version metadata in a Supabase table (`app_versions`) or query `https://api.github.com/repos/SamarVScode/agent-summary-mechanism/releases/latest`.
  - Data structure:
    ```json
    {
      "versionCode": 3,
      "versionName": "1.0.2",
      "apkUrl": "https://github.com/.../releases/download/v1.0.2/AgentFlow-v1.0.2.apk",
      "changelog": "• Fixed OCR screenshot reading\n• 5-day leave limit\n• Smooth 60 FPS scrolling",
      "isMandatory": false
    }
    ```
  - App compares `remoteVersionCode > BuildConfig.VERSION_CODE`.
* **Expected Gain**: Instant notification of new builds on app launch or manual "Check for Updates" tap.

---

### [ ] 17. Android `FileProvider` & `REQUEST_INSTALL_PACKAGES` Setup
* **Affected Files**: `AndroidManifest.xml`, `app/src/main/res/xml/file_paths.xml`
* **Root Cause**: Android 8.0+ (API 26+) blocks direct file system paths (`file://`) and requires `content://` URIs granted via `FileProvider` to pass APKs to the system installer.
* **Action**:
  - Add `<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />`.
  - Define `FileProvider` with `<cache-path name="apk_updates" path="updates/" />`.
* **Expected Gain**: Safe, system-compliant handoff of the downloaded APK to Android Package Installer.

---

### [ ] 18. `AppUpdateManager` Background Downloader Engine
* **New File**: `agentflow-android/app/src/main/java/com/agentflow/tracker/domain/update/AppUpdateManager.kt`
* **Action**:
  - Manage state transitions: `Idle` ➔ `UpdateAvailable` ➔ `Downloading(progress%)` ➔ `ReadyToInstall(uri)` ➔ `Error`.
  - Stream the APK bytes into the app cache directory while updating a Compose `StateFlow<Float>` progress percentage.
  - Construct and fire the `ACTION_VIEW` intent with `application/vnd.android.package-archive` and `FLAG_GRANT_READ_URI_PERMISSION`.
* **Expected Gain**: Complete background download handling with live percentage feedback.

---

### [ ] 19. Material 3 In-App Update Dialog / Bottom Sheet
* **New File**: `agentflow-android/app/src/main/java/com/agentflow/tracker/ui/components/AppUpdateDialog.kt`
* **Action**:
  - Present release notes and version badge.
  - Live animated linear progress indicator during download.
  - "Update Now" and "Install" actions.
  - One-tap redirect to Settings toggle if `"Install Unknown Apps"` permission is needed.
* **Expected Gain**: High-polish user experience with zero friction.

---

---

## 🗑️ Phase 6: Work Log Deletion from Detail View

### [ ] 20. Delete Button on Detail View Header
* **Affected File**: `agentflow-android/app/src/main/java/com/agentflow/tracker/ui/screens/dashboard/DetailHistoryView.kt`
* **Feature**:
  - In the top navigation row (opposite the Back button and Date title), add a `Delete` icon button (`Icons.Outlined.DeleteOutline`) with `tint = ErrorRed`.
  - Tapping opens a confirmation dialog.

---

### [ ] 21. Deletion Confirmation Dialog
* **Affected File**: `agentflow-android/app/src/main/java/com/agentflow/tracker/ui/screens/dashboard/DetailHistoryView.kt`
* **Feature**:
  - Displays: *"Delete this work log for [Date]?"*
  - Explanation: *"This will permanently remove your recorded tally and screenshot from Supabase. This action cannot be undone."*
  - Actions: **Cancel** (dismisses) and **Delete** (triggers deletion with a loading spinner).

---

### [ ] 22. Supabase Delete API & Dashboard State Sync
* **Affected Files**:
  - `agentflow-android/app/src/main/java/com/agentflow/tracker/data/api/SupabaseService.kt`
  - `agentflow-android/app/src/main/java/com/agentflow/tracker/ui/screens/dashboard/DashboardViewModel.kt`
* **Feature**:
  - `deleteSubmissionsByDate(agentName: String, date: String)`: executes `DELETE FROM submissions WHERE agent_name = $agentName AND date = $date`.
  - On success: closes the detail view, removes the deleted date from `rawSubmissions`, recalculates Cycle 1 & 2 tallies, and updates the list instantly.

---

## ⚙️ Phase 7: Profile Settings Button & Menu

### [ ] 23. Profile Header Settings Button
* **Affected File**: `agentflow-android/app/src/main/java/com/agentflow/tracker/ui/screens/profile/ProfileScreen.kt`
* **Feature**:
  - Adds a gear icon button (`Icons.Default.Settings`) to the top-right header of the Profile screen.
  - Tapping opens the modular Settings Bottom Sheet.

---

### [ ] 24. Modular Settings Bottom Sheet
* **New File**: `agentflow-android/app/src/main/java/com/agentflow/tracker/ui/screens/profile/SettingsBottomSheet.kt`
* **Feature**:
  - **In-App Update Checker**: shows current version and manual "Check for Updates" button.
  - **Theme Mode**: houses the Light / Dark / System segmented selector.
  - **Cache Manager**: displays cached screenshot storage size with a "Clear Cache" button.
  - **Account & Logout**: clean logout confirmation prompt.

---

## 📌 Implementation Order Recommendation
1. **Sprint 1 (Fastest, High Impact & New Controls)**:
   - Items #1 (Release Build + R8), #2 (List Keys), #3 (Background Threading), #4 (Screenshot Downsampling).
   - Item #15 (Persistent Cryptographic Keystore).
   - Items #20, #21, #22 (History Entry Deletion & Confirmation Modal).
   - Items #23, #24 (Profile Settings Button & Sheet).
2. **Sprint 2 (In-App Auto-Updates & Parallel Network)**:
   - Items #16, #17, #18, #19 (Complete In-App Auto-Update System).
   - Items #12 (Parallel Network Calls), #9 (Calendar Math Caching).
3. **Sprint 3 (Rendering & GPU Smoothness)**:
   - Items #5 (Flat Outline Shadows), #8 (Coil Cache), #7 (`.drawBehind` Badges).
4. **Sprint 4 (Deep Architecture & AOT)**:
   - Items #6 (Overdraw), #10 (Date Allocations), #11 (`@Immutable` stability), #13 (OCR Pre-warming), #14 (Baseline Profiles).


