# Universal App Development & CI/CD Golden Rules

This document outlines the mandatory development, architecture, security, and CI/CD rules that **must be strictly followed** for any application built in this repository. These rules prevent recurring pitfalls such as broken CI pipelines, update installation rejections, battery drain, and offline data loss.

---

## 1. CI/CD & Build Pipeline Rules (Zero-Flake Builds)

### ❌ What Broke Previously:
Third-party GitHub Actions (such as `android-actions/setup-android@v3`) broke because they fetched tools from hardcoded external URLs that Google deprecated/moved (HTTP 404), halting the pipeline before compilation began.

### 🛡️ Golden Rules:
1. **Never use third-party wrapper actions for pre-installed tools**:
   - GitHub-hosted `ubuntu-latest` runners **already include** the Android SDK, Build Tools, Platform Tools, and `$ANDROID_HOME` (`/usr/local/lib/android/sdk`).
   - Relying on community wrapper actions creates unnecessary failure points. Use the pre-installed SDK directly.
2. **Only use official/verified actions**:
   - Limit workflow actions to first-party or official maintainers:
     - `actions/checkout@v4`
     - `actions/setup-java@v4` (with `cache: gradle`)
     - `softprops/action-gh-release@v2`
3. **Always automate release notes**:
   - Supply `body_path: RELEASE_CHANGELOG.md` in the release action so every GitHub release includes formatted changelog notes. The in-app updater relies on this field to display "What's New" to users.
4. **Clean line endings on Linux runners**:
   - Always run `sed -i 's/\r$//' ./gradlew && chmod +x ./gradlew` before executing Gradle on Linux to prevent CRLF line-ending errors from Windows environments.

---

## 2. App Signing & Auto-Update Rules (Zero-Reinstall Updates)

### ❌ What Broke Previously:
Changing keystores or using separate debug keys caused Android to reject in-place updates with `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, forcing users to uninstall and lose cached data.

### 🛡️ Golden Rules:
1. **Permanent Keystore Preservation**:
   - Never delete, regenerate, or replace the production keystore (`agentflow-release.jks`).
   - Use the same keystore for both `release` and `debug` build types during active testing so test builds can be upgraded in-place.
2. **Strict Version Bumping**:
   - Every release must increment `versionCode` (integer, e.g., `4` ➔ `5`).
   - `versionName` must follow SemVer (e.g., `1.0.3` ➔ `1.0.4`).
3. **ProGuard / R8 Reflection Safeguards**:
   - Any class instantiated via reflection (e.g., WorkManager `ListenableWorker`, serialization models) must have explicit `-keep` rules in `proguard-rules.pro`. Never assume consumer rules are sufficient:
     ```proguard
     -keep class * extends androidx.work.ListenableWorker {
         public <init>(android.content.Context, androidx.work.WorkerParameters);
     }
     -keep class com.agentflow.tracker.domain.sync.** { *; }
     -keep class com.agentflow.tracker.data.local.** { *; }
     ```

---

## 3. Offline-First Architecture Rules (Network Independence)

### ❌ What Broke Previously:
Submitting work while offline threw unhandled `UnknownHostException` errors, cleared user forms without saving, and the dashboard failed to display previously logged data.

### 🛡️ Golden Rules:
1. **Local Database as Single Source of Truth (SSOT)**:
   - The UI must **never** read directly from the network. It must observe the local database (`LocalSubmissionsDbHelper`).
   - On submission, write immediately to local SQLite with `syncStatus = "PENDING"` and transition the UI to **Success** instantly. The user must never wait for network round-trips.
2. **Background Sync via WorkManager**:
   - Always delegate background network uploads to `androidx.work.WorkManager` with a `NetworkType.CONNECTED` constraint.
   - Never run raw background coroutines or long-running threads for syncing; Android's Doze Mode and battery optimizer will kill them.
3. **Eliminate Continuous Timer Polling**:
   - Continuous timer loops (e.g. polling every 5 seconds) drain device batteries and consume cellular data.
   - UI updates must be **reactive**: observe local database changes via `StateFlow` and only sync over network on app launch, data changes, or manual swipe-to-refresh.
4. **Graceful Offline Prompts**:
   - Any manual network action (e.g. "Check for Updates", swipe-to-refresh) must check `NetworkUtils.isOnline(context)` first.
   - If offline, display a friendly prompt (e.g. *"Please connect to the internet to check for updates"* or a Toast *"No internet connection"*), never a raw DNS/socket error.

---

## 4. Media & Metadata Validation Rules (Anti-Tampering)

### ❌ What Broke Previously:
Relying on file names or system picker dates allowed submissions of old/tampered screenshots, or failed when messaging apps renamed images.

### 🛡️ Golden Rules:
1. **Never Trust File Names**:
   - File names are easily altered, stripped, or randomized.
   - Extract real capture dates strictly from system `MediaStore.Images.Media.DATE_TAKEN` and binary `ExifInterface` headers (`TAG_DATETIME_ORIGINAL`).
2. **Strict Validation Blocking**:
   - If `metadataDate != selectedDate`, strictly block the submission with an explicit error. Never silently rewrite dates.
3. **Client-Side Deduplication Before Upload**:
   - Calculate SHA-256 file hashes before uploading. Check hashes against local SQLite first, then remote Supabase to prevent redundant storage usage and duplicate records.
4. **Local Compression & Memory Protection**:
   - Always downsample and compress high-resolution images (`Bitmap.compress(JPEG, 85)`) to app internal storage (`filesDir/pending_uploads/`) before storage upload to avoid `OutOfMemoryError` (OOM) and heavy payload sizes.

---

## 5. Coding & Modification Standards

1. **Simplicity Over Overengineering**:
   - Prefer standard Android framework components (`SQLiteOpenHelper`, `WorkManager`, `OkHttp`) over heavy third-party abstractions or multi-layer dependencies.
2. **Surgical Changes**:
   - Touch only the lines required to satisfy the requirement. Do not reformat adjacent unrelated code or introduce speculative features.
3. **Keep Documentation Updated**:
   - Whenever architecture, dependencies, or version numbers change, update [`PROJECT_REFERENCE.md`](file:///C:/Users/User/Desktop/payout%20app/PROJECT_REFERENCE.md) and [`RELEASE_CHANGELOG.md`](file:///C:/Users/User/Desktop/payout%20app/RELEASE_CHANGELOG.md) before publishing.
