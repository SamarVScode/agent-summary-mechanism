# Daily Work Tracker — Complete Implementation Plan

**Goal:** A mobile-first React app where a delivery agent selects their name, uploads their end-of-day Summary screenshot, the app auto-extracts "Total" and "Completed" counts via OCR, shows a confirmation modal, and on confirm saves the row to Google Sheets and the image to Google Drive via a Google Apps Script backend.

**Architecture:** React 18 + Vite (frontend) · Tesseract.js (browser OCR) · Google Apps Script Web App (backend) · SpreadsheetApp (Sheets CRUD) · DriveApp (image storage) · localStorage (agent name persistence)

**Tech Stack:** React 18, Vite, Tesseract.js, Vanilla CSS (mobile-first glassmorphism), Google Apps Script, fetch with text/plain CORS bypass

---

## What the Screenshot Contains (based on demo.jpeg)

```
Summary Screen
──────────────────────────────
   72          0
  Total      Pending

   9          63
 Failed    Completed
──────────────────────────────
```

- **OCR Target 1 — Total OFD+OFP:** The number directly above the label `Total` → `72`
- **OCR Target 2 — Delivered+Pickup:** The number directly above the label `Completed` → `63`

These two values are extracted purely by OCR — the user never types them manually.

---

## Google Sheet Row Structure

| Col | Field               | Value Example         | Source          |
|-----|---------------------|-----------------------|-----------------|
| A   | Timestamp           | 2026-06-02T12:00:00Z  | GAS server time |
| B   | Date                | 02-Jun-2026           | Client (auto)   |
| C   | Agent Name          | Ravi Kumar            | localStorage    |
| D   | Total (OFD+OFP)     | 72                    | OCR from image  |
| E   | Completed (Del+PU)  | 63                    | OCR from image  |
| F   | Image Drive URL     | https://drive.google… | After upload    |

---

## Google Apps Script — Two Tabs Required

| Tab Name      | Purpose                              |
|---------------|--------------------------------------|
| `Tally`       | Work log rows (one per submission)   |
| `Agents`      | Agent names in column A, no header   |

---

## User Flow (Step Machine)

```
┌─────────────────────────────────┐
│  STEP 1 — Agent Name Selection  │  ← Only on first visit
│  Full-screen picker, scrollable │
│  list fetched from GAS doGet    │
│  Name saved to localStorage     │
└──────────────┬──────────────────┘
               │ name confirmed
               ▼
┌─────────────────────────────────┐
│  STEP 2 — Home / Upload Screen  │  ← Shown on every visit
│  Agent name in header + ✏ edit  │
│  Auto-filled date (02-Jun-2026) │
│  Drag-drop / tap upload zone    │
└──────────────┬──────────────────┘
               │ image selected
               ▼
┌─────────────────────────────────┐
│  STEP 3 — OCR Processing        │
│  Tesseract.js runs on image     │
│  Extracts number above "Total"  │
│  Extracts number above          │
│  "Completed"                    │
└──────────────┬──────────────────┘
               │ OCR done
               ▼
┌─────────────────────────────────┐
│  STEP 4 — Confirm Modal         │  ← Bottom sheet on mobile
│  Shows:                         │
│   • Agent name                  │
│   • Date                        │
│   • 📦 Total (OFD+OFP): 72      │
│   • 🚚 Completed (Del+PU): 63   │
│   • Image thumbnail             │
│  [Cancel]        [Confirm ✓]    │
└──────────────┬──────────────────┘
               │ Confirm clicked
               ▼
┌─────────────────────────────────┐
│  STEP 5 — Submit to GAS         │
│  POST JSON as text/plain        │
│  GAS: append row to Sheet       │
│  GAS: upload image to Drive     │
│  GAS: return { success,         │
│                imageUrl }       │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  STEP 6 — Result Screen         │
│  SUCCESS: 🎉 card + Drive link  │
│  ERROR: 🔴 message + retry btn  │
└─────────────────────────────────┘
```

---

## OCR Extraction Strategy

The screenshot has a consistent layout:

```
[NUMBER]     [NUMBER]
 Total       Pending

[NUMBER]     [NUMBER]
 Failed    Completed
```

**Parsing algorithm (in `useOcrValidation.js`):**

1. Run `Tesseract.worker.recognize(file)` → get raw text string
2. Split into lines
3. Find the line containing the word `"Total"` (case-insensitive)
4. The number is on the **line directly above** it
5. Extract the **left-side number** (first numeric token on that line) → `totalCount`
6. Find the line containing the word `"Completed"` (case-insensitive)
7. The number is on the **line directly above** it
8. Extract the **right-side number** (last numeric token on that line) → `completedCount`
9. Return `{ totalCount, completedCount }`

**Fallback:** If the above positional parse fails (e.g., OCR merges lines), fall back to scanning all numeric tokens adjacent to the keywords "Total" and "Completed" in the raw text.

---

## File Tree

```
C:\Users\User\Desktop\payout app\
├── Code.js                        (existing — unchanged)
├── Index.html                     (existing — unchanged)
├── README.md                      (existing — unchanged)
├── demo.jpeg                      (existing — reference screenshot)
├── WORK_TRACKER_PLAN.md           (this file)
│
└── work-tracker\                  ← NEW React Vite project
    ├── gas\
    │   ├── Code.gs                ← GAS backend (paste into Apps Script)
    │   └── README_deploy.md       ← deployment checklist
    ├── public\
    │   └── vite.svg
    ├── src\
    │   ├── components\
    │   │   ├── AgentPicker.jsx    ← full-screen name selector
    │   │   ├── ConfirmModal.jsx   ← bottom-sheet confirm modal
    │   │   ├── Header.jsx         ← name badge + date + edit button
    │   │   ├── ScreenshotUploader.jsx  ← drag-drop upload zone
    │   │   ├── SubmissionResult.jsx    ← success / error card
    │   │   ├── TrackerPage.jsx    ← main page (steps 2–6)
    │   │   └── OcrLoader.jsx      ← OCR progress spinner overlay
    │   ├── hooks\
    │   │   ├── useAgentName.js    ← localStorage read/write
    │   │   ├── useAgentList.js    ← fetch names from GAS doGet
    │   │   ├── useOcrExtract.js   ← Tesseract OCR + parse Total/Completed
    │   │   └── useGasSubmit.js    ← POST to GAS doPost
    │   ├── utils\
    │   │   ├── dateUtils.js       ← formatDate() → "02-Jun-2026"
    │   │   └── imageUtils.js      ← fileToBase64(), fileToPreviewUrl()
    │   ├── App.jsx                ← root: AgentPicker OR TrackerPage
    │   ├── config.js              ← GAS_ENDPOINT constant
    │   └── index.css              ← full mobile-first design system
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## Component Details

### `App.jsx`
```jsx
import { useAgentName } from './hooks/useAgentName'
import AgentPicker from './components/AgentPicker'
import TrackerPage from './components/TrackerPage'

export default function App() {
  const { agentName, setAgentName, clearAgentName } = useAgentName()
  if (!agentName) return <AgentPicker onSelect={setAgentName} />
  return <TrackerPage agentName={agentName} onChangeName={clearAgentName} />
}
```

---

### `src/config.js`
```js
// Paste your deployed GAS Web App URL here after deployment
export const GAS_ENDPOINT = "PASTE_YOUR_GAS_WEB_APP_URL_HERE";
```

---

### `src/utils/dateUtils.js`
```js
export function formatDate(date = new Date()) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun',
                  'Jul','Aug','Sep','Oct','Nov','Dec']
  const dd = String(date.getDate()).padStart(2, '0')
  const mmm = months[date.getMonth()]
  const yyyy = date.getFullYear()
  return `${dd}-${mmm}-${yyyy}`  // → "02-Jun-2026"
}
```

---

### `src/utils/imageUtils.js`
```js
// Returns base64 string WITHOUT the data: prefix
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result        // "data:image/jpeg;base64,/9j/..."
      const base64 = result.split(',')[1] // strips the prefix
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Returns object URL for <img> preview (revoke after use)
export function fileToPreviewUrl(file) {
  return URL.createObjectURL(file)
}
```

---

### `src/hooks/useAgentName.js`
```js
import { useState } from 'react'
const KEY = 'wt_agent_name'

export function useAgentName() {
  const [agentName, setAgentNameState] = useState(() => localStorage.getItem(KEY) || '')

  function setAgentName(name) {
    localStorage.setItem(KEY, name)
    setAgentNameState(name)
  }

  function clearAgentName() {
    localStorage.removeItem(KEY)
    setAgentNameState('')
  }

  return { agentName, setAgentName, clearAgentName }
}
```

---

### `src/hooks/useAgentList.js`
```js
import { useState, useEffect } from 'react'
import { GAS_ENDPOINT } from '../config'

export function useAgentList() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${GAS_ENDPOINT}?action=getAgents`, { redirect: 'follow' })
      .then(r => r.json())
      .then(data => setAgents(data.agents || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return { agents, loading, error }
}
```

---

### `src/hooks/useOcrExtract.js`
```js
import { useState, useRef } from 'react'
import Tesseract from 'tesseract.js'

// Parses the OCR text to find the number above "Total" and "Completed"
function parseCountsFromText(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean)

  let totalCount = null
  let completedCount = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase()

    // Find line containing "total" — the number is on the line above
    if (line.includes('total') && !line.includes('completed')) {
      const prevLine = lines[i - 1] || ''
      const tokens = prevLine.match(/\d+/g)
      if (tokens) totalCount = parseInt(tokens[0], 10)  // left-side number
    }

    // Find line containing "completed" — the number is on the line above
    if (line.includes('completed')) {
      const prevLine = lines[i - 1] || ''
      const tokens = prevLine.match(/\d+/g)
      if (tokens) completedCount = parseInt(tokens[tokens.length - 1], 10) // right-side number
    }
  }

  return { totalCount, completedCount }
}

export function useOcrExtract() {
  const [status, setStatus] = useState('idle') // idle | extracting | done | error
  const [result, setResult] = useState(null)   // { totalCount, completedCount, rawText }
  const workerRef = useRef(null)

  async function extract(file) {
    setStatus('extracting')
    setResult(null)
    try {
      if (!workerRef.current) {
        workerRef.current = await Tesseract.createWorker('eng')
      }
      const { data: { text } } = await workerRef.current.recognize(file)
      const { totalCount, completedCount } = parseCountsFromText(text)

      if (totalCount === null || completedCount === null) {
        setStatus('error')
        setResult({ rawText: text, totalCount, completedCount })
      } else {
        setStatus('done')
        setResult({ totalCount, completedCount, rawText: text })
      }
    } catch (err) {
      setStatus('error')
      setResult({ rawText: '', error: err.message })
    }
  }

  return { extract, status, result }
}
```

---

### `src/hooks/useGasSubmit.js`
```js
import { useState } from 'react'
import { GAS_ENDPOINT } from '../config'

export function useGasSubmit() {
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null) // { success, imageUrl } | { success: false, error }

  async function submit({ date, agentName, totalCount, completedCount, imageBase64, imageName }) {
    setSubmitting(true)
    setResult(null)
    try {
      const payload = JSON.stringify({
        date, agentName, totalCount, completedCount, imageBase64, imageName
      })
      const res = await fetch(GAS_ENDPOINT, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: payload
      })
      const data = await res.json()
      setResult(data.success
        ? { success: true, imageUrl: data.imageUrl }
        : { success: false, error: data.error || 'Unknown error' }
      )
    } catch (err) {
      setResult({ success: false, error: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return { submit, submitting, result }
}
```

---

### `src/components/AgentPicker.jsx`
```jsx
// Props: { onSelect: (name: string) => void }
// - Calls useAgentList() to fetch names from GAS
// - Shows a full-screen overlay with a search input + scrollable name list
// - Each name is a large tappable row (min 56px height for mobile)
// - Loading state: skeleton shimmer rows
// - Error state: retry button
// - On tap: calls onSelect(name)
```

---

### `src/components/Header.jsx`
```jsx
// Props: { agentName: string, date: string, onChangeName: () => void }
// - Shows app title "Work Tracker"
// - Shows agent name badge (avatar initial + name)
// - Shows auto-filled date e.g. "02 Jun 2026"
// - Small ✏️ edit icon → calls onChangeName() which clears localStorage
//   and triggers agent picker again
```

---

### `src/components/ScreenshotUploader.jsx`
```jsx
// Props: { onImageSelected: ({ file, base64, previewUrl }) => void, disabled: bool }
// - Dashed border drag-drop zone, large tap target (min 200px height)
// - Click / tap → opens file picker (accept="image/*")
// - On drag-over: border glows with accent colour, scale animation
// - On file selected: reads file → fileToBase64 + fileToPreviewUrl → calls onImageSelected
// - After upload: shows image thumbnail preview inside the zone with a
//   "Change screenshot" overlay on hover/tap
```

---

### `src/components/OcrLoader.jsx`
```jsx
// Props: { visible: bool }
// - Full-screen semi-transparent overlay shown during OCR processing
// - Animated spinner + "Reading screenshot…" text
// - Prevents any interaction while OCR is running
```

---

### `src/components/ConfirmModal.jsx`
```jsx
// Props: {
//   visible: bool,
//   agentName: string,
//   date: string,
//   totalCount: number,
//   completedCount: number,
//   previewUrl: string,
//   onCancel: () => void,
//   onConfirm: () => void,
//   submitting: bool
// }
// Layout (mobile bottom sheet, desktop centered):
// ┌─────────────────────────────┐
// │ 📋 Confirm Submission       │ ← modal header
// │─────────────────────────────│
// │ [thumbnail]  Agent: Ravi    │
// │              Date: 02-Jun   │
// │              📦 Total: 72   │
// │              🚚 Completed:63│
// │─────────────────────────────│
// │ [Cancel]     [Confirm ✓]    │
// └─────────────────────────────┘
// - Confirm button shows spinner + "Saving…" while submitting
// - Slides up from bottom on mobile (CSS transform + transition)
// - Backdrop click → cancel
```

---

### `src/components/SubmissionResult.jsx`
```jsx
// Props: { result: { success, imageUrl, error } | null, onReset: () => void }
// SUCCESS:
//   Green glass card, large ✅ icon
//   "Submitted Successfully!"
//   "02 Jun 2026 · Ravi Kumar · 72 Total · 63 Completed"
//   [View in Drive] button (opens imageUrl)
//   [Submit Another] button → calls onReset()
// ERROR:
//   Red glass card, ❌ icon
//   Error message
//   [Try Again] button → calls onReset()
```

---

### `src/components/TrackerPage.jsx`
```jsx
// State machine: 'upload' | 'ocr' | 'confirm' | 'submitting' | 'result'
// Manages:
//   - imageState: { file, base64, previewUrl } | null
//   - ocrResult: { totalCount, completedCount, rawText } | null
//   - submissionResult: { success, imageUrl, error } | null
//   - modalVisible: bool
//
// Renders:
//   <Header agentName date onChangeName />
//   <ScreenshotUploader onImageSelected disabled={state !== 'upload'} />
//   <OcrLoader visible={state === 'ocr'} />
//   <ConfirmModal visible={modalVisible} ... />
//   <SubmissionResult result={submissionResult} onReset={reset} />
//
// Flow:
//   onImageSelected → setState('ocr') → useOcrExtract.extract(file)
//     → on success: ocrResult set, modalVisible=true, setState('confirm')
//     → on error: show toast "Could not read screenshot, try a clearer image"
//                 setState('upload'), allow re-upload
//   onConfirm (modal) → setState('submitting') → useGasSubmit.submit(...)
//     → setState('result'), submissionResult set
//   onReset → clear all state → setState('upload')
```

---

## GAS Backend — `gas/Code.gs`

```js
// ─── CONFIGURATION ─────────────────────────────────────────────────────────
const SPREADSHEET_ID       = "YOUR_SPREADSHEET_ID_HERE";
const SHEET_TAB_NAME       = "Tally";    // work log tab
const AGENTS_SHEET_TAB_NAME = "Agents"; // agent names in col A, no header row
const DRIVE_FOLDER_ID      = "YOUR_DRIVE_FOLDER_ID_HERE";

// ─── doGet ─────────────────────────────────────────────────────────────────
// Usage: GET GAS_URL?action=getAgents
// Returns: { "agents": ["Alice", "Bob", ...] }
function doGet(e) {
  try {
    const action = e.parameter.action;
    if (action === 'getAgents') {
      const ss     = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheet  = ss.getSheetByName(AGENTS_SHEET_TAB_NAME);
      const values = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
      const agents = values
        .map(row => row[0].toString().trim())
        .filter(name => name.length > 0);
      return jsonResponse({ agents });
    }
    return jsonResponse({ error: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

// ─── doPost ────────────────────────────────────────────────────────────────
// Body (text/plain): JSON string with keys:
//   date, agentName, totalCount, completedCount, imageBase64, imageName
// Returns: { success: true, imageUrl, rowIndex }
//       or { success: false, error: "..." }
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const imageUrl = uploadImageToDrive(data.imageBase64, data.imageName);
    const rowIndex = appendRowToSheet(data, imageUrl);
    return jsonResponse({ success: true, imageUrl, rowIndex });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// ─── appendRowToSheet ──────────────────────────────────────────────────────
// Appends one row: [timestamp, date, agentName, totalCount, completedCount, imageUrl]
function appendRowToSheet(data, imageUrl) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_TAB_NAME);
  const timestamp = new Date().toISOString();
  sheet.appendRow([
    timestamp,
    data.date,
    data.agentName,
    data.totalCount,
    data.completedCount,
    imageUrl
  ]);
  return sheet.getLastRow();
}

// ─── uploadImageToDrive ────────────────────────────────────────────────────
// Decodes base64, creates a JPEG blob, saves to the Drive folder
// Returns the shareable file URL
function uploadImageToDrive(base64String, fileName) {
  // Determine mime type from fileName extension
  const ext      = fileName.split('.').pop().toLowerCase();
  const mimeMap  = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  const mimeType = mimeMap[ext] || 'image/jpeg';

  const decoded  = Utilities.base64Decode(base64String);
  const blob     = Utilities.newBlob(decoded, mimeType, fileName);
  const folder   = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const file     = folder.createFile(blob);

  // Make file viewable by anyone with the link
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

// ─── helper ────────────────────────────────────────────────────────────────
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

---

## GAS Deployment Checklist — `gas/README_deploy.md`

```
1. Open Google Sheets → create two tabs: "Tally" and "Agents"
   - Tally: add headers in Row 1:
     Timestamp | Date | Agent Name | Total (OFD+OFP) | Completed (Del+PU) | Image Drive URL
   - Agents: add agent names in Column A from Row 1 (no header)

2. Create a Google Drive folder for screenshots
   - Copy the folder ID from its URL:
     https://drive.google.com/drive/folders/FOLDER_ID_IS_HERE

3. In Google Sheets → Extensions → Apps Script
   - Delete all boilerplate code
   - Paste the full contents of gas/Code.gs
   - Update lines at the top:
       SPREADSHEET_ID        → your sheet ID from browser URL
       SHEET_TAB_NAME        → "Tally"
       AGENTS_SHEET_TAB_NAME → "Agents"
       DRIVE_FOLDER_ID       → your Drive folder ID
   - Save (Ctrl+S)

4. Deploy → New Deployment
   - Type: Web App
   - Execute as: Me
   - Who has access: Anyone
   - Click Deploy → authorize → copy the Web App URL

5. Paste the URL into work-tracker/src/config.js:
       export const GAS_ENDPOINT = "https://script.google.com/macros/s/YOUR_ID/exec";

6. Test connectivity:
   - Visit: GAS_URL?action=getAgents → should return {"agents":[...]}
```

---

## CSS Design System Summary (`index.css`)

```
Mobile-first: base at 375px, breakpoint at 768px

Colors:
  --bg:          #0d0d1a      (deep dark background)
  --surface:     rgba(255,255,255,0.06)  (glass cards)
  --border:      rgba(255,255,255,0.10)  (card borders)
  --primary:     #6C63FF      (electric indigo — buttons, accents)
  --primary-glow:rgba(108,99,255,0.35)   (button shadow)
  --success:     #00D4AA      (teal — success state)
  --error:       #FF6584      (rose — error state)
  --text:        #FFFFFF
  --text-muted:  rgba(255,255,255,0.55)

Typography:
  Font: Inter (Google Fonts)
  Base: 16px / 1.5 line-height
  Headings: 600–700 weight

Components:
  .card          glass card: backdrop-filter blur(20px), border-radius 20px
  .btn-primary   gradient indigo button, active:scale(0.97) tap feedback
  .btn-ghost     transparent outlined button
  .input-field   dark frosted input, focus:ring primary
  .upload-zone   dashed border, drag-over glow animation
  .modal-overlay full-screen backdrop, modal slides up from bottom
  .shimmer       skeleton loading animation for agent list
  .spinner       rotating CSS border animation

Mobile specifics:
  All tap targets ≥ 48px height
  Modal = bottom sheet (slides up, full-width, rounded top corners)
  Safe area insets respected (env(safe-area-inset-*))
  No horizontal scroll
```

---

## Packages to Install

```bash
# Create Vite React project
npm create vite@latest work-tracker -- --template react

# Install dependencies
cd work-tracker
npm install
npm install tesseract.js
```

---

## Verification Steps

### 1. GAS Backend
- [ ] Visit `GAS_URL?action=getAgents` in browser → `{"agents":["Name1","Name2",...]}`
- [ ] Submit test POST (curl):
  ```bash
  curl -L -X POST "GAS_URL" \
    -H "Content-Type: text/plain" \
    -d '{"date":"02-Jun-2026","agentName":"Test","totalCount":72,"completedCount":63,"imageBase64":"","imageName":"test.jpg"}'
  ```
  → Response: `{"success":true,"imageUrl":"...","rowIndex":2}`
- [ ] Check Google Sheet "Tally" tab → row appeared
- [ ] Check Drive folder → file appeared

### 2. React App
- [ ] `npm run dev` → opens at `http://localhost:5173`
- [ ] First visit → agent picker appears, names load from GAS
- [ ] Select name → stored in localStorage, picker gone
- [ ] Refresh → name in header, no picker
- [ ] Edit (✏️) → clears localStorage, picker appears again
- [ ] Upload `demo.jpeg` → OCR runs → modal appears with `Total: 72, Completed: 63`
- [ ] Confirm → data submitted → success card shown
- [ ] Upload a blurry/unrecognisable image → OCR error toast shown, re-upload allowed
- [ ] Test on mobile viewport (Chrome DevTools 375px)
```

---

*Plan authored: 02-Jun-2026*
*Location: C:\Users\User\Desktop\payout app\WORK_TRACKER_PLAN.md*
