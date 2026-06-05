// ═══════════════════════════════════════════════════════════════════
//  DAILY WORK TRACKER — Google Apps Script Backend (Supabase Bridge)
//  Set up these functions to run on triggers:
//    - processSupabaseSubmissions  --> Time-driven trigger (every 5 mins)
// ═══════════════════════════════════════════════════════════════════

// ── CONFIGURATION ── Fill these in before running ──────────────────
const SPREADSHEET_ID        = "1ntacTkjZ6CZV3qHrNaxPYe_lch7ySDTeLuSNS_q_ATQ";
const SHEET_TAB_NAME        = "Tally";          // work log sheet tab
const DRIVE_FOLDER_ID       = "17x6oxFZi-jxLyEOND5YtLWNT3ejuxlQv";

const SUPABASE_URL          = "https://matoieqhletkjcjfvars.supabase.co";
const SUPABASE_KEY          = "sb_publishable_h4qeENgYle29ywox-PyN3g_A6QG-2XJ"; // Public key (RLS must be disabled on Supabase)
// ───────────────────────────────────────────────────────────────────

/**
 * processSupabaseSubmissions — pulls unprocessed submissions from Supabase,
 * uploads images to Drive, appends rows to Google Sheet, and marks them processed.
 */
function processSupabaseSubmissions() {
  try {
    if (SUPABASE_URL.includes("YOUR_SUPABASE")) {
      Logger.log("Supabase is not configured yet.");
      return;
    }

    // 1. Fetch unprocessed submissions
    const url = `${SUPABASE_URL}/rest/v1/submissions?processed=eq.false&select=*`;
    const response = UrlFetchApp.fetch(url, {
      method: "GET",
      headers: {
        "apikey": SUPABASE_KEY
      }
    });

    if (response.getResponseCode() !== 200) {
      throw new Error(`Failed to fetch submissions: ${response.getContentText()}`);
    }

    const submissions = JSON.parse(response.getContentText());
    if (submissions.length === 0) {
      Logger.log("No pending submissions to process.");
      return;
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_TAB_NAME);
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);

    Logger.log(`Found ${submissions.length} pending submissions to process.`);

    for (let i = 0; i < submissions.length; i++) {
      const item = submissions[i];
      Logger.log(`Syncing submission for: ${item.agent_name}`);

      let driveUrl = "";
      if (item.image_url) {
        try {
          // Download the screenshot image bytes from Supabase
          const imgResponse = UrlFetchApp.fetch(item.image_url);
          const imgBlob = imgResponse.getBlob();

          // Extract filename from the URL path
          const fileName = item.image_url.split("/").pop() || `screenshot-${Date.now()}.jpeg`;
          imgBlob.setName(fileName);

          // Save the file to Google Drive folder
          const file = folder.createFile(imgBlob);
          try {
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          } catch (e) {
            // Sharing settings might be blocked by organization policies; skip silently
            Logger.log(`Skipping public sharing settings: ${e.message}`);
          }
          driveUrl = file.getUrl();
        } catch (imgErr) {
          Logger.log(`Failed to save image for ${item.agent_name}: ${imgErr.message}`);
          driveUrl = `Image Sync Failed: ${imgErr.message}`;
        }
      }

      // Append row to sheet: Timestamp | Date | Agent Name | Casper ID | Total (OFD+OFP) | Completed (Del+PU) | Image URL
      const timestamp = item.created_at || new Date().toISOString();
      sheet.appendRow([
        timestamp,
        item.date || "",
        item.agent_name || "",
        item.casper_id || "",
        item.total_count || 0,
        item.completed_count || 0,
        driveUrl
      ]);

      // Mark processed in Supabase database
      const patchUrl = `${SUPABASE_URL}/rest/v1/submissions?id=eq.${item.id}`;
      const patchResponse = UrlFetchApp.fetch(patchUrl, {
        method: "PATCH",
        headers: {
          "apikey": SUPABASE_KEY,
          "Content-Type": "application/json"
        },
        payload: JSON.stringify({ processed: true })
      });

      if (patchResponse.getResponseCode() >= 300) {
        Logger.log(`Failed to mark processed for ID ${item.id}: ${patchResponse.getContentText()}`);
      } else {
        Logger.log(`Submission ID ${item.id} successfully synced.`);
      }
    }

  } catch (err) {
    Logger.log(`Error running processSupabaseSubmissions: ${err.message}`);
  }
}
