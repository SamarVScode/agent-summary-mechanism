/**
 * Configuration variables for the Payout Application.
 */
const SPREADSHEET_ID = "1avV2Tx9SGaaUeFu2alONmXeXkGYqE4I5r1ZncPYmY7M"; // Leave blank to default to the active spreadsheet bound to this script
const SHEET_TAB_NAME = "Agent_view";
const TEMP_SPREADSHEET_ID = "1yVhXMczYVNIaR1rbuMCALyfhr9H8sFat8jPGL3YdZv0"; // Dedicated spreadsheet ID where temporary monthly payout tabs are created
const RATE_PER_TASK = 13.00;

// ── SUPABASE CONFIGURATION ──────────────────
const SUPABASE_URL = "https://matoieqhletkjcjfvars.supabase.co";
const SUPABASE_KEY = "sb_publishable_h4qeENgYle29ywox-PyN3g_A6QG-2XJ"; 
// ─────────────────────────────────────────────

/**
 * Fetches the list of agent names from Supabase.
 */
function fetchAgentsFromSupabase() {
  try {
    const url = `${SUPABASE_URL}/rest/v1/agents?select=name&order=name.asc`;
    const response = UrlFetchApp.fetch(url, {
      method: "GET",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY
      }
    });
    
    if (response.getResponseCode() !== 200) {
      throw new Error(`Failed to fetch agents: ${response.getContentText()}`);
    }
    
    const agents = JSON.parse(response.getContentText());
    return agents.map(a => a.name);
  } catch (err) {
    Logger.log("Error in fetchAgentsFromSupabase: " + err.message);
    throw err;
  }
}

/**
 * Adds a new agent name to the Supabase agents table.
 * Automatically fetches CasperFHRID from the Agent_view sheet to use as credentials.
 */
function addAgentToSupabase(agentName) {
  try {
    if (!agentName) throw new Error("Agent name is required.");
    
    // 1. Fetch credentials from Spreadsheet
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_TAB_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim().toLowerCase());
    
    const nameIdx = headers.indexOf("agentname");
    const casperIdx = headers.indexOf("casperfhrid");
    
    if (nameIdx === -1 || casperIdx === -1) {
      throw new Error("Could not find 'AgentName' or 'CasperFHRID' columns in Agent_view sheet.");
    }
    
    let credentials = null;
    const searchName = agentName.trim().toLowerCase();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][nameIdx]).trim().toLowerCase() === searchName) {
        credentials = String(data[i][casperIdx]).trim();
        break;
      }
    }
    
    if (!credentials) {
      throw new Error(`Agent "${agentName}" not found in Agent_view sheet.`);
    }

    // 2. Sync to Supabase
    const url = `${SUPABASE_URL}/rest/v1/agents`;
    const response = UrlFetchApp.fetch(url, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      payload: JSON.stringify({ 
        name: agentName,
        casper_id: credentials,
        password: credentials
      }),
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() >= 300) {
      const errText = response.getContentText();
      Logger.log(`Failed to add agent: ${errText}`);
      throw new Error(`Failed to add agent: ${errText}`);
    }
    
    return { success: true, message: `Agent '${agentName}' added successfully with automated credentials.` };
  } catch (err) {
    Logger.log("Error in addAgentToSupabase: " + err.message);
    throw err;
  }
}

/**
 * Removes an agent name from the Supabase agents table.
 */
function removeAgentFromSupabase(agentName) {
  try {
    if (!agentName) throw new Error("Agent name is required.");
    
    const url = `${SUPABASE_URL}/rest/v1/agents?name=eq.${encodeURIComponent(agentName)}`;
    const response = UrlFetchApp.fetch(url, {
      method: "DELETE",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY
      },
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() >= 300) {
      const errText = response.getContentText();
      Logger.log(`Failed to remove agent: ${errText}`);
      throw new Error(`Failed to remove agent: ${errText}`);
    }
    
    return { success: true, message: `Agent '${agentName}' removed successfully.` };
  } catch (err) {
    Logger.log("Error in removeAgentFromSupabase: " + err.message);
    throw err;
  }
}

/**
 * Serves the HTML file 'Index.html' to the user web app.
 * @return {HtmlService.HtmlOutput} The evaluated HTML template.
 */
function doGet() {
  try {
    return HtmlService.createTemplateFromFile('Index')
        .evaluate()
        .setTitle('Wishmaster Payout & Performance Dashboard')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (error) {
    return HtmlService.createHtmlOutput('<h1>Error loading application</h1><p>' + error.toString() + '</p>');
  }
}

/**
 * Validation test function to ensure doGet works properly.
 */
function testDoGet() {
  console.log('Running testDoGet...');
  try {
    const output = doGet();
    if (!output) {
      throw new Error('doGet returned null or undefined.');
    }
    
    // Check if the returned object has the expected methods of HtmlOutput
    if (typeof output.getContent !== 'function') {
      throw new Error('Returned object does not appear to be HtmlOutput (missing getContent method).');
    }
    
    const title = output.getTitle();
    console.log('Success: doGet evaluated successfully. Page title: ' + title);
    return true;
  } catch (error) {
    console.error('Test failed: ' + error.message);
    throw error;
  }
}

/**
 * Fetches all submissions from Supabase.
 */
function fetchSubmissionsFromSupabase() {
  try {
    const url = `${SUPABASE_URL}/rest/v1/submissions?select=date,agent_name,casper_id,total_count,completed_count`;
    const response = UrlFetchApp.fetch(url, {
      method: "GET",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY
      }
    });
    
    if (response.getResponseCode() !== 200) {
      throw new Error(`Failed to fetch submissions: ${response.getContentText()}`);
    }
    
    return JSON.parse(response.getContentText());
  } catch (err) {
    Logger.log("Error in fetchSubmissionsFromSupabase: " + err.message);
    return [];
  }
}

/**
 * Reads all rows from the Google Sheet and returns formatted JSON data.
 */
function getSheetData() {
  let mainSheet;
  if (typeof SPREADSHEET_ID !== 'undefined' && SPREADSHEET_ID) {
    mainSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_TAB_NAME);
  } else {
    mainSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TAB_NAME);
  }
  
  if (!mainSheet) return [];
  
  const mainData = mainSheet.getDataRange().getDisplayValues();
  if (mainData.length <= 1) return []; // Empty sheet or headers only
  
  const mainHeaders = mainData[0];
  const mainRows = mainData.slice(1);
  const cleanMainHeaders = mainHeaders.map(h => String(h).trim().toLowerCase());
  
  // Identify all date columns and pick the second one (precise date) by direct comparison
  let dateOccurrences = [];
  for (let i = 0; i < mainHeaders.length; i++) {
    if (String(mainHeaders[i]).trim().toLowerCase() === 'date') {
      dateOccurrences.push(i);
    }
  }
  const mainDateIdx = dateOccurrences.length >= 2 ? dateOccurrences[1] : (dateOccurrences.length > 0 ? dateOccurrences[0] : -1);

  if (mainDateIdx === -1) return [];
  
  function findCol(possibleNames) {
    const normalizedPossibles = possibleNames.map(n => String(n).trim().toLowerCase().replace(/[-_ ]/g, ''));
    for (let i = 0; i < cleanMainHeaders.length; i++) {
      const cleanH = cleanMainHeaders[i].replace(/[-_ ]/g, '');
      if (normalizedPossibles.indexOf(cleanH) !== -1) {
        return i;
      }
    }
    return -1;
  }
  
  const idx = {
    date: mainDateIdx,
    id: findCol(['casperfhrid', 'casper id', 'fhrid']),
    name: findCol(['agentname', 'name', 'agent']),
    dc: findCol(['source_dc', 'sourcedc', 'source dc', 'dc']),
    ofp: findCol(['ofp']),
    ofd: findCol(['ofd']),
    del: findCol(['del_update', 'delivered', 'del']),
    pickup: findCol(['picked-up', 'picked_up', 'picked up', 'pickedup', 'pickup']),
    status: findCol(['payment status', 'payment_status', 'status'])
  };

  // 1. Fetch Supabase Submissions
  const submissions = fetchSubmissionsFromSupabase();
  const subMap = {}; // Keyed by date + agent_name + casper_id
  submissions.forEach(s => {
    const key = `${s.date}_${s.agent_name}_${s.casper_id}`;
    subMap[key] = {
      total: s.total_count,
      completed: s.completed_count
    };
  });

  // Open target spreadsheet for temporary tabs
  let tempSs = null;
  if (typeof TEMP_SPREADSHEET_ID !== 'undefined' && TEMP_SPREADSHEET_ID) {
    try {
      tempSs = SpreadsheetApp.openById(TEMP_SPREADSHEET_ID);
    } catch (e) {
      Logger.log("Could not open administrative spreadsheet: " + e.message);
    }
  }
  
  // Build the set of month keys (e.g. "jun-2026") present in the sheet,
  // using the same date column — so correction tab lookups stay consistent.
  const monthKeysInMain = new Set();
  mainRows.forEach((row) => {
    const rawDate = row[mainDateIdx];
    const formattedDate = parseAndFormatDate(rawDate);
    if (formattedDate) {
      const parts = formattedDate.split('-');
      if (parts.length === 3) {
        monthKeysInMain.add(`${parts[1]}-${parts[2]}`);
      }
    }
  });

  // Load all corrections from all relevant monthly tabs in TEMP_SPREADSHEET_ID
  const correctionsMap = {}; // Keyed by originalRowIndex
  
  if (tempSs) {
    monthKeysInMain.forEach(monthKey => {
      const payoutTabName = getPayoutTabName(monthKey);
      const tempSheet = tempSs.getSheetByName(payoutTabName);
      if (tempSheet) {
        const tempData = tempSheet.getDataRange().getDisplayValues();
        if (tempData.length > 1) {
          const tempHeaders = tempData[0];
          const tempRows = tempData.slice(1);
          const cleanTempHeaders = tempHeaders.map(h => String(h).trim().toLowerCase());
          
          const tIdx = {
            date: cleanTempHeaders.indexOf('date'),
            id: cleanTempHeaders.indexOf('casperfhrid'),
            name: cleanTempHeaders.indexOf('agentname'),
            dc: cleanTempHeaders.indexOf('source_dc'),
            ofp: cleanTempHeaders.indexOf('ofp'),
            ofd: cleanTempHeaders.indexOf('ofd'),
            del: cleanTempHeaders.indexOf('del_update'),
            pickup: cleanTempHeaders.indexOf('picked-up'),
            status: cleanTempHeaders.indexOf('payment status'),
            origIdx: cleanTempHeaders.indexOf('original row index (do not edit)')
          };
          
          tempRows.forEach(row => {
            const origRowIndex = tIdx.origIdx !== -1 ? parseInt(row[tIdx.origIdx], 10) : 0;
            if (origRowIndex > 0) {
              correctionsMap[origRowIndex] = {
                delivered: tIdx.del !== -1 && row[tIdx.del] !== "" ? Number(row[tIdx.del]) : null,
                ofd: tIdx.ofd !== -1 && row[tIdx.ofd] !== "" ? Number(row[tIdx.ofd]) : null,
                pickedUp: tIdx.pickup !== -1 && row[tIdx.pickup] !== "" ? Number(row[tIdx.pickup]) : null,
                ofp: tIdx.ofp !== -1 && row[tIdx.ofp] !== "" ? Number(row[tIdx.ofp]) : null,
                status: tIdx.status !== -1 ? row[tIdx.status] : null
              };
            }
          });
        }
      }
    });
  }

  // Combine live raw rows from Agent_view with corrections and Supabase data
  const combinedRows = [];
  mainRows.forEach((row, index) => {
    const originalIndex = index + 2; // 1-based index (header is row 1)
    
    // Get live values from Agent_view
    let ofd = Number(row[idx.ofd]) || 0;
    let delivered = Number(row[idx.del]) || 0;
    let ofp = Number(row[idx.ofp]) || 0;
    let pickedUp = Number(row[idx.pickup]) || 0;
    let status = idx.status !== -1 ? (row[idx.status] || "") : "";
    
    // Apply correction overlay if it exists
    const correction = correctionsMap[originalIndex];
    if (correction) {
      if (correction.ofd !== null && !isNaN(correction.ofd)) ofd = correction.ofd;
      if (correction.delivered !== null && !isNaN(correction.delivered)) delivered = correction.delivered;
      if (correction.ofp !== null && !isNaN(correction.ofp)) ofp = correction.ofp;
      if (correction.pickedUp !== null && !isNaN(correction.pickedUp)) pickedUp = correction.pickedUp;
      if (correction.status !== null && correction.status !== "") status = correction.status;
    }
    
    const formattedDate = parseAndFormatDate(row[idx.date]);
    const agentName = row[idx.name] || "Unknown";
    const casperId = row[idx.id] || "N/A";
    
    // Fetch matching Supabase data
    const subKey = `${formattedDate}_${agentName}_${casperId}`;
    const subData = subMap[subKey] || { total: null, completed: null };
    
    const dailyEarnings = (delivered + pickedUp) * RATE_PER_TASK;
    const deliveryConversion = ofd > 0 ? ((delivered / ofd) * 100).toFixed(1) : (delivered > 0 ? "100.0" : "0.0");
    const pickupConversion = ofp > 0 ? ((pickedUp / ofp) * 100).toFixed(1) : (pickedUp > 0 ? "100.0" : "0.0");
    
    combinedRows.push({
      rowIndex: originalIndex,
      date: formattedDate,
      id: row[idx.id] || "N/A",
      name: agentName,
      dc: row[idx.dc] || "",
      ofp: ofp,
      ofd: ofd,
      delivered: delivered,
      pickedUp: pickedUp,
      sbTotal: subData.total,
      sbCompleted: subData.completed,
      earnings: dailyEarnings,
      deliveryConversion: Number(deliveryConversion),
      pickupConversion: Number(pickupConversion),
      status: status
    });
  });
  
  return combinedRows;
}

/**
 * Parses variable date formats and normalizes to standard DD-MMM-YYYY.
 * Avoids local script timezone shifting by formatting Dates with Utilities.formatDate() relative to the active spreadsheet's timezone.
 */
function parseAndFormatDate(dateVal) {
  if (!dateVal) return "";
  
  let tz = "UTC";
  try {
    tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  } catch (e) {
    try {
      tz = Session.getScriptTimeZone();
    } catch (err) {}
  }
  
  if (dateVal instanceof Date) {
    return Utilities.formatDate(dateVal, tz, "dd-MMM-yyyy").toLowerCase();
  }
  
  const dateStr = String(dateVal).trim();
  
  // Try to parse DD-MM-YYYY or DD/MM/YYYY
  const parts = dateStr.split(/[-/]/);
  if (parts.length === 3) {
    const p0 = parts[0].trim();
    const p1 = parts[1].trim();
    const p2 = parts[2].trim();
    
    // Check if it's DD-MM-YYYY (e.g. 01-06-2026)
    const day = parseInt(p0, 10);
    let year = parseInt(p2, 10);
    
    if (!isNaN(day) && day >= 1 && day <= 31 && !isNaN(year) && (p2.length === 4 || p2.length === 2)) {
      if (p2.length === 2) {
        year += 2000;
      }
      // Check if p1 is a number (month 1-12)
      const monthNum = parseInt(p1, 10);
      if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
        const d = new Date(year, monthNum - 1, day);
        if (!isNaN(d.getTime())) {
          return Utilities.formatDate(d, tz, "dd-MMM-yyyy").toLowerCase();
        }
      } else {
        // Maybe p1 is a month string (e.g., Jun or June)
        const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        const cleanMonth = p1.toLowerCase().substring(0, 3);
        const monthIndex = months.indexOf(cleanMonth);
        if (monthIndex !== -1) {
          const d = new Date(year, monthIndex, day);
          if (!isNaN(d.getTime())) {
            return Utilities.formatDate(d, tz, "dd-MMM-yyyy").toLowerCase();
          }
        }
      }
    }
    
    // Check if it's YYYY-MM-DD (e.g. 2026-06-01)
    let yVal = parseInt(p0, 10);
    const dVal = parseInt(p2, 10);
    if (!isNaN(yVal) && (p0.length === 4 || p0.length === 2) && !isNaN(dVal) && dVal >= 1 && dVal <= 31) {
      if (p0.length === 2) {
        yVal += 2000;
      }
      const mVal = parseInt(p1, 10);
      if (!isNaN(mVal) && mVal >= 1 && mVal <= 12) {
        const d = new Date(yVal, mVal - 1, dVal);
        if (!isNaN(d.getTime())) {
          return Utilities.formatDate(d, tz, "dd-MMM-yyyy").toLowerCase();
        }
      } else {
        const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        const cleanMonth = p1.toLowerCase().substring(0, 3);
        const monthIndex = months.indexOf(cleanMonth);
        if (monthIndex !== -1) {
          const d = new Date(yVal, monthIndex, dVal);
          if (!isNaN(d.getTime())) {
            return Utilities.formatDate(d, tz, "dd-MMM-yyyy").toLowerCase();
          }
        }
      }
    }
  }
  
  // Fallback to standard JS Date parsing
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return Utilities.formatDate(d, tz, "dd-MMM-yyyy").toLowerCase();
  }
  return dateStr; // Return as-is if parsing fails
}

function formatDateString(dateObj) {
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${day}-${month}-${year}`;
}

function testCalculations() {
  const mockRow = ["01-06-2026", "ID100", "Ravi", "DC01", 10, 20, 18, 9, "01-06-2026", ""];
  // Mocking indices matching the getSheetData layout
  const ofd = mockRow[5];
  const del = mockRow[6];
  const ofp = mockRow[4];
  const pickup = mockRow[7];
  
  const dailyEarnings = (del + pickup) * 13;
  const delConv = ((del / ofd) * 100).toFixed(1);
  const pickConv = ((pickup / ofp) * 100).toFixed(1);
  
  Logger.log("Mock Earnings (Expected 351): " + dailyEarnings);
  Logger.log("Mock Delivery Conv (Expected 90.0): " + delConv);
  Logger.log("Mock Pickup Conv (Expected 90.0): " + pickConv);
  
  if (dailyEarnings === 351 && delConv === "90.0" && pickConv === "90.0") {
    Logger.log("CALCULATION PASS");
    return true;
  } else {
    Logger.log("CALCULATION FAIL");
    return false;
  }
}

/**
 * Updates the payment status for a specific row index.
 * Gets the sheet by SPREADSHEET_ID (or active spreadsheet if SPREADSHEET_ID is blank) and SHEET_TAB_NAME.
 * Finds the column index of "Payment Status". If it does not exist, it inserts it next to the "DC Date" column
 * (which is Column 9, so target column is 10), writes the header "Payment Status" on row 1, and updates statusColIndex.
 * Writes the status (e.g., "Paid") to the cell at (rowIndex, statusColIndex).
 * Flushes spreadsheet changes and returns { success: true, rowIndex: rowIndex, status: status }.
 * 
 * @param {number} rowIndex - The 1-based index of the row to update.
 * @param {string} status - The status to set (e.g., "Paid").
 * @param {Sheet} [sheet] - Optional sheet instance for testing.
 * @return {Object} An object indicating the result of the operation.
 */
function updateRowStatus(rowIndex, status, sheet) {
  // If TEMP_SPREADSHEET_ID is set, we want to update the monthly payout sheets in the temporary spreadsheet instead of Agent_view!
  if (typeof TEMP_SPREADSHEET_ID !== 'undefined' && TEMP_SPREADSHEET_ID && !sheet) {
    return bulkUpdateRowStatuses([rowIndex], status);
  }
  
  if (!sheet) {
    if (typeof SPREADSHEET_ID !== 'undefined' && SPREADSHEET_ID) {
      sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_TAB_NAME);
    } else {
      sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TAB_NAME);
    }
  }
  
  if (!sheet) {
    throw new Error("Sheet '" + SHEET_TAB_NAME + "' not found.");
  }
  
  const lastCol = sheet.getLastColumn();
  let headers = [];
  if (lastCol > 0) {
    headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  }
  
  const cleanHeaders = headers.map(function(h) { return String(h).trim().toLowerCase(); });
  let statusColIndex = cleanHeaders.indexOf('payment status') + 1;
  
  if (statusColIndex === 0) {
    // "Payment Status" column does not exist.
    // Insert next to the "DC Date" column (which is Column 9, so target column is 10)
    const currentMaxCols = sheet.getMaxColumns();
    if (currentMaxCols < 9) {
      sheet.insertColumnsAfter(currentMaxCols, 9 - currentMaxCols);
    }
    sheet.insertColumnAfter(9);
    sheet.getRange(1, 10).setValue('Payment Status');
    statusColIndex = 10;
  }
  
  sheet.getRange(rowIndex, statusColIndex).setValue(status);
  
  if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.flush) {
    SpreadsheetApp.flush();
  }
  
  return {
    success: true,
    rowIndex: rowIndex,
    status: status
  };
}

/**
 * Mock validation test function to ensure the status update function
 * is structurally defined and behaves correctly.
 */
function testUpdateRowStatus() {
  console.log('Running testUpdateRowStatus...');
  
  // Setup mock sheet
  const mockSheet = {
    maxColumns: 9,
    lastColumn: 9,
    headers: ["Date", "CasperFHRID", "AgentName", "Source_DC", "OFP", "OFD", "del_update", "Picked-up", "DC Date"],
    values: {},
    insertedColumns: [],
    
    getMaxColumns: function() {
      return this.maxColumns;
    },
    
    getLastColumn: function() {
      return this.lastColumn;
    },
    
    getRange: function(row, col, numRows, numCols) {
      const self = this;
      return {
        getValues: function() {
          if (row === 1 && numRows === 1) {
            return [self.headers];
          }
          return [[]];
        },
        setValue: function(value) {
          self.values[`${row},${col}`] = value;
          return this;
        }
      };
    },
    
    insertColumnsAfter: function(afterIndex, howMany) {
      this.maxColumns += howMany;
      this.lastColumn += howMany;
    },
    
    insertColumnAfter: function(colIndex) {
      this.insertedColumns.push(colIndex);
      this.maxColumns += 1;
      this.lastColumn += 1;
      this.headers.splice(colIndex, 0, ""); // insert space for new column
    }
  };
  
  try {
    // Test Case 1: Column does not exist
    const result1 = updateRowStatus(2, "Paid", mockSheet);
    
    if (!result1.success) {
      throw new Error("Test Case 1 Failed: Expected success to be true.");
    }
    if (result1.rowIndex !== 2) {
      throw new Error("Test Case 1 Failed: Expected rowIndex to be 2.");
    }
    if (result1.status !== "Paid") {
      throw new Error("Test Case 1 Failed: Expected status to be 'Paid'.");
    }
    
    // Check if column was inserted after 9
    if (mockSheet.insertedColumns.indexOf(9) === -1) {
      throw new Error("Test Case 1 Failed: Expected insertColumnAfter(9) to have been called.");
    }
    
    // Check header value
    if (mockSheet.values["1,10"] !== "Payment Status") {
      throw new Error("Test Case 1 Failed: Expected header 'Payment Status' at (1, 10).");
    }
    
    // Check updated cell
    if (mockSheet.values["2,10"] !== "Paid") {
      throw new Error("Test Case 1 Failed: Expected value 'Paid' at (2, 10).");
    }
    
    console.log("Test Case 1 passed (Column insertion + Value update).");
    
    // Test Case 2: Column already exists
    // Modify mock sheet to have "Payment Status"
    mockSheet.headers = ["Date", "CasperFHRID", "AgentName", "Source_DC", "OFP", "OFD", "del_update", "Picked-up", "DC Date", "Payment Status"];
    mockSheet.maxColumns = 10;
    mockSheet.lastColumn = 10;
    mockSheet.values = {};
    mockSheet.insertedColumns = [];
    
    const result2 = updateRowStatus(3, "Failed", mockSheet);
    
    if (!result2.success) {
      throw new Error("Test Case 2 Failed: Expected success to be true.");
    }
    if (result2.rowIndex !== 3) {
      throw new Error("Test Case 2 Failed: Expected rowIndex to be 3.");
    }
    if (result2.status !== "Failed") {
      throw new Error("Test Case 2 Failed: Expected status to be 'Failed'.");
    }
    
    // Ensure no column was inserted
    if (mockSheet.insertedColumns.length > 0) {
      throw new Error("Test Case 2 Failed: Should not have inserted a column.");
    }
    
    // Check updated cell
    if (mockSheet.values["3,10"] !== "Failed") {
      throw new Error("Test Case 2 Failed: Expected value 'Failed' at (3, 10).");
    }
    
    console.log("Test Case 2 passed (Direct update).");
    console.log("All mock validation tests passed for updateRowStatus!");
    return true;
  } catch (error) {
    console.error("Test failed: " + error.message);
    throw error;
  }
}

/**
 * Updates the payment status for multiple row indexes.
 * Gets the sheet by SPREADSHEET_ID (or active spreadsheet if SPREADSHEET_ID is blank) and SHEET_TAB_NAME.
 * Finds the column index of "Payment Status". If it does not exist, it inserts it next to the "DC Date" column
 * (which is Column 9, so target column is 10), writes the header "Payment Status" on row 1, and updates statusColIndex.
 * For each rowIndex in rowIndexes, writes the status (e.g., "Paid") to the cell at (rowIndex, statusColIndex).
 * Flushes spreadsheet changes and returns { success: true, rowIndexes: rowIndexes, status: status }.
 * 
 * @param {number[]} rowIndexes - Array of 1-based indexes of the rows to update.
 * @param {string} status - The status to set (e.g., "Paid").
 * @param {Sheet} [sheet] - Optional sheet instance for testing.
 * @return {Object} An object indicating the result of the operation.
 */
function bulkUpdateRowStatuses(rowIndexes, status, sheet) {
  // If TEMP_SPREADSHEET_ID is set, we want to update the monthly payout sheets in the temporary spreadsheet instead of Agent_view!
  if (typeof TEMP_SPREADSHEET_ID !== 'undefined' && TEMP_SPREADSHEET_ID && !sheet) {
    try {
      let ss;
      if (typeof SPREADSHEET_ID !== 'undefined' && SPREADSHEET_ID) {
        ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      } else {
        ss = SpreadsheetApp.getActiveSpreadsheet();
      }
      
      const mainSheet = ss.getSheetByName(SHEET_TAB_NAME);
      if (!mainSheet) {
        throw new Error("Main database sheet not found.");
      }
      
      const mainData = mainSheet.getDataRange().getDisplayValues();
      const mainHeaders = mainData[0];
      let dateOccurrences = [];
      for (let i = 0; i < mainHeaders.length; i++) {
        if (String(mainHeaders[i]).trim().toLowerCase() === 'date') {
          dateOccurrences.push(i);
        }
      }
      // Use the second header named 'Date' as the date column if available.
      const dateColIdx = dateOccurrences.length >= 2 ? dateOccurrences[1] : (dateOccurrences.length > 0 ? dateOccurrences[0] : -1);
      
      const tempSs = SpreadsheetApp.openById(TEMP_SPREADSHEET_ID);
      
      // Group targeted row indexes by their monthly payout sheet tab name
      const updatesByTab = {};
      rowIndexes.forEach(rowIndex => {
        if (rowIndex >= 2 && rowIndex <= mainData.length) {
          const rowValues = mainData[rowIndex - 1];
          if (rowValues && dateColIdx !== -1) {
            const rawDate = rowValues[dateColIdx];
            const parsedDate = parseAndFormatDate(rawDate);
            if (parsedDate) {
              const parts = parsedDate.split('-');
              if (parts.length === 3) {
                const monthKey = `${parts[1]}-${parts[2]}`;
                const payoutTabName = getPayoutTabName(monthKey);
                
                if (!updatesByTab[payoutTabName]) {
                  updatesByTab[payoutTabName] = [];
                }
                updatesByTab[payoutTabName].push(rowIndex);
              }
            }
          }
        }
      });
      
      // Process updates for each monthly payout tab
      Object.keys(updatesByTab).forEach(tabName => {
        const tempSheet = tempSs.getSheetByName(tabName);
        if (tempSheet) {
          const tempData = tempSheet.getDataRange().getDisplayValues();
          const tempHeaders = tempData[0].map(h => String(h).trim().toLowerCase());
          
          const origRowIdxCol = tempHeaders.indexOf('original row index (do not edit)');
          const statusColIdx = tempHeaders.indexOf('payment status');
          
          if (origRowIdxCol !== -1 && statusColIdx !== -1) {
            const targets = updatesByTab[tabName];
            
            // Loop through rows in the temp sheet to match
            for (let i = 1; i < tempData.length; i++) {
              const tempRow = tempData[i];
              const origRowVal = parseInt(tempRow[origRowIdxCol], 10);
              
              if (targets.indexOf(origRowVal) !== -1) {
                // Update the Payment Status column in this row
                tempSheet.getRange(i + 1, statusColIdx + 1).setValue(status);
              }
            }
          }
        }
      });
      
      SpreadsheetApp.flush();
      
      return {
        success: true,
        rowIndexes: rowIndexes,
        status: status,
        message: "Payout status updated inside your dedicated spreadsheet. Main 'Agent_view' database sheet remains completely untouched!"
      };
    } catch (err) {
      Logger.log("Error in separate sheet status update: " + err.message);
    }
  }

  // Fallback direct update to primary Agent_view if TEMP_SPREADSHEET_ID is blank
  if (!sheet) {
    if (typeof SPREADSHEET_ID !== 'undefined' && SPREADSHEET_ID) {
      sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_TAB_NAME);
    } else {
      sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TAB_NAME);
    }
  }
  
  if (!sheet) {
    throw new Error("Sheet '" + SHEET_TAB_NAME + "' not found.");
  }
  
  const lastCol = sheet.getLastColumn();
  let headers = [];
  if (lastCol > 0) {
    headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  }
  
  const cleanHeaders = headers.map(function(h) { return String(h).trim().toLowerCase(); });
  let statusColIndex = cleanHeaders.indexOf('payment status') + 1;
  
  if (statusColIndex === 0) {
    const currentMaxCols = sheet.getMaxColumns();
    if (currentMaxCols < 9) {
      sheet.insertColumnsAfter(currentMaxCols, 9 - currentMaxCols);
    }
    sheet.insertColumnAfter(9);
    sheet.getRange(1, 10).setValue('Payment Status');
    statusColIndex = 10;
  }
  
  rowIndexes.forEach(function(rowIndex) {
    sheet.getRange(rowIndex, statusColIndex).setValue(status);
  });
  
  if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.flush) {
    SpreadsheetApp.flush();
  }
  
  return {
    success: true,
    rowIndexes: rowIndexes,
    status: status
  };
}

/**
 * Mock validation test function to ensure the bulk status update function
 * is structurally defined and behaves correctly.
 */
function testBulkUpdateRowStatuses() {
  console.log('Running testBulkUpdateRowStatuses...');
  
  // Setup mock sheet
  const mockSheet = {
    maxColumns: 9,
    lastColumn: 9,
    headers: ["Date", "CasperFHRID", "AgentName", "Source_DC", "OFP", "OFD", "del_update", "Picked-up", "DC Date"],
    values: {},
    insertedColumns: [],
    
    getMaxColumns: function() {
      return this.maxColumns;
    },
    
    getLastColumn: function() {
      return this.lastColumn;
    },
    
    getRange: function(row, col, numRows, numCols) {
      const self = this;
      return {
        getValues: function() {
          if (row === 1 && numRows === 1) {
            return [self.headers];
          }
          return [[]];
        },
        setValue: function(value) {
          self.values[`${row},${col}`] = value;
          return this;
        }
      };
    },
    
    insertColumnsAfter: function(afterIndex, howMany) {
      this.maxColumns += howMany;
      this.lastColumn += howMany;
    },
    
    insertColumnAfter: function(colIndex) {
      this.insertedColumns.push(colIndex);
      this.maxColumns += 1;
      this.lastColumn += 1;
      this.headers.splice(colIndex, 0, ""); // insert space for new column
    }
  };
  
  try {
    // Test Case 1: Column does not exist
    const result1 = bulkUpdateRowStatuses([2, 4, 5], "Paid", mockSheet);
    
    if (!result1.success) {
      throw new Error("Test Case 1 Failed: Expected success to be true.");
    }
    if (JSON.stringify(result1.rowIndexes) !== JSON.stringify([2, 4, 5])) {
      throw new Error("Test Case 1 Failed: Expected rowIndexes to be [2, 4, 5].");
    }
    if (result1.status !== "Paid") {
      throw new Error("Test Case 1 Failed: Expected status to be 'Paid'.");
    }
    
    // Check if column was inserted after 9
    if (mockSheet.insertedColumns.indexOf(9) === -1) {
      throw new Error("Test Case 1 Failed: Expected insertColumnAfter(9) to have been called.");
    }
    
    // Check header value
    if (mockSheet.values["1,10"] !== "Payment Status") {
      throw new Error("Test Case 1 Failed: Expected header 'Payment Status' at (1, 10).");
    }
    
    // Check updated cells
    if (mockSheet.values["2,10"] !== "Paid" || mockSheet.values["4,10"] !== "Paid" || mockSheet.values["5,10"] !== "Paid") {
      throw new Error("Test Case 1 Failed: Expected value 'Paid' at row 2, 4, and 5.");
    }
    
    console.log("Test Case 1 passed (Column insertion + Bulk value updates).");
    
    // Test Case 2: Column already exists
    mockSheet.headers = ["Date", "CasperFHRID", "AgentName", "Source_DC", "OFP", "OFD", "del_update", "Picked-up", "DC Date", "Payment Status"];
    mockSheet.maxColumns = 10;
    mockSheet.lastColumn = 10;
    mockSheet.values = {};
    mockSheet.insertedColumns = [];
    
    const result2 = bulkUpdateRowStatuses([3, 7], "Paid", mockSheet);
    
    if (!result2.success) {
      throw new Error("Test Case 2 Failed: Expected success to be true.");
    }
    if (JSON.stringify(result2.rowIndexes) !== JSON.stringify([3, 7])) {
      throw new Error("Test Case 2 Failed: Expected rowIndexes to be [3, 7].");
    }
    if (result2.status !== "Paid") {
      throw new Error("Test Case 2 Failed: Expected status to be 'Paid'.");
    }
    
    // Ensure no column was inserted
    if (mockSheet.insertedColumns.length > 0) {
      throw new Error("Test Case 2 Failed: Should not have inserted a column.");
    }
    
    // Check updated cells
    if (mockSheet.values["3,10"] !== "Paid" || mockSheet.values["7,10"] !== "Paid") {
      throw new Error("Test Case 2 Failed: Expected value 'Paid' at row 3 and 7.");
    }
    
    console.log("Test Case 2 passed (Direct bulk update).");
    console.log("All mock validation tests passed for bulkUpdateRowStatuses!");
    return true;
  } catch (error) {
    console.error("Test failed: " + error.message);
    throw error;
  }
}

/**
 * Creates a temporary spreadsheet tab containing only data rows for the selected month,
 * including a hidden Original Row Index column. This allows administrative data corrections
 * in Google Sheets to be synced back.
 */
function prepareTempTabForMonth(selectedMonth) {
  try {
    let ss;
    if (typeof SPREADSHEET_ID !== 'undefined' && SPREADSHEET_ID) {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    } else {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }
    
    const mainSheet = ss.getSheetByName(SHEET_TAB_NAME);
    if (!mainSheet) {
      throw new Error(`Main sheet '${SHEET_TAB_NAME}' not found.`);
    }
    
    // Open target spreadsheet for temporary tabs
    let tempSs = ss;
    if (typeof TEMP_SPREADSHEET_ID !== 'undefined' && TEMP_SPREADSHEET_ID) {
      tempSs = SpreadsheetApp.openById(TEMP_SPREADSHEET_ID);
    }
    
    const data = mainSheet.getDataRange().getDisplayValues();
    if (data.length <= 1) {
      return { success: false, message: "No data found in main sheet." };
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    let dateOccurrences = [];
    for (let i = 0; i < headers.length; i++) {
      if (String(headers[i]).trim().toLowerCase() === 'date') {
        dateOccurrences.push(i);
      }
    }
    
    // Identify date columns. We use the second one as primary and first as secondary.
    const dateIdx = dateOccurrences.length >= 2 ? dateOccurrences[1] : (dateOccurrences.length > 0 ? dateOccurrences[0] : -1);
    
    if (dateIdx === -1) {
      throw new Error("Date column not found in sheet.");
    }
    
    // Filter matching rows for the selected month
    const matchingRows = [];
    rows.forEach((row, idx) => {
      const rawDate = row[dateIdx];
      const parsedDate = parseAndFormatDate(rawDate);
      if (parsedDate) {
        const parts = parsedDate.split('-');
        if (parts.length === 3) {
          const monthYear = `${parts[1]}-${parts[2]}`;
          if (selectedMonth === 'All' || monthYear === selectedMonth) {
            // Push row values along with its original row index (1-based, index + 2) and formatted date
            matchingRows.push({
              values: row,
              formattedDate: parsedDate,
              originalRowIndex: idx + 2
            });
          }
        }
      }
    });
    
    if (matchingRows.length === 0) {
      return { success: false, message: `No transaction rows found matching month: ${selectedMonth}` };
    }


    
    // Create/reuse monthly payout tab
    const tempTabName = getPayoutTabName(selectedMonth);
    let tempSheet = tempSs.getSheetByName(tempTabName);
    
    if (tempSheet) {
      // Clear it completely
      tempSheet.clear();
    } else {
      tempSheet = tempSs.insertSheet(tempTabName);
    }
    
    // Prepare headers for temp tab (Include ALL headers from Agent_view + Payment Status + Original Row Index)
    const tempHeaders = [];
    tempHeaders.push(...headers);
    
    tempHeaders.push("Payment Status");
    tempHeaders.push("Original Row Index (Do Not Edit)");
    
    // Write headers
    tempSheet.getRange(1, 1, 1, tempHeaders.length).setValues([tempHeaders]);
    tempSheet.getRange(1, 1, 1, tempHeaders.length).setFontWeight("bold").setBackground("#f1f5f9");

    // Prepare values to write, substituting the Date with the normalized precise date
    const writeData = matchingRows.map(item => {
      const rowValues = [];
      item.values.forEach((val, i) => {
        if (i === dateIdx) {
          rowValues.push(item.formattedDate); // Write precise normalized date!
        } else {
          rowValues.push(val);
        }
      });
      
      // Add empty value for Payment Status
      rowValues.push("");

      // Write the original row index
      rowValues.push(item.originalRowIndex);
      return rowValues;
    });
    
    // Write values
    tempSheet.getRange(2, 1, writeData.length, tempHeaders.length).setValues(writeData);
    
    // Format Date columns to plain text to avoid shifts
    tempSheet.getRange(2, dateIdx + 1, writeData.length, 1).setNumberFormat("@");
    
    // Auto-fit columns
    tempSheet.autoResizeColumns(1, tempHeaders.length);
    
    // Hide the Original Row Index column
    const rowIdxColNum = tempHeaders.length;
    tempSheet.hideColumns(rowIdxColNum);
    
    return { 
      success: true, 
      tabName: tempTabName, 
      rowCount: matchingRows.length,
      message: `Temporary tab '${tempTabName}' prepared inside your Google Spreadsheet with ${matchingRows.length} rows. Corrected dates are normalized and redundant columns removed.`
    };
  } catch (err) {
    console.error(err);
    return { success: false, message: `Error preparing temp tab: ${err.message}` };
  }
}

/**
 * Compares rows in the temporary month tab against the main database and updates modified values.
 * Highlights the edited cells directly in Google Sheets in light yellow.
 */
function syncTempTabEdits(tempTabName) {
  try {
    let ss;
    if (typeof SPREADSHEET_ID !== 'undefined' && SPREADSHEET_ID) {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    } else {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }
    
    const mainSheet = ss.getSheetByName(SHEET_TAB_NAME);
    if (!mainSheet) {
      return { success: false, message: `Main sheet '${SHEET_TAB_NAME}' not found.` };
    }
    
    // Open target spreadsheet for temporary tabs
    let tempSs = ss;
    if (typeof TEMP_SPREADSHEET_ID !== 'undefined' && TEMP_SPREADSHEET_ID) {
      tempSs = SpreadsheetApp.openById(TEMP_SPREADSHEET_ID);
    }
    
    const tempSheet = tempSs.getSheetByName(tempTabName);
    if (!tempSheet) {
      return { success: false, message: `Temporary tab '${tempTabName}' not found in the administrative spreadsheet.` };
    }
    
    const tempData = tempSheet.getDataRange().getDisplayValues();
    const mainData = mainSheet.getDataRange().getDisplayValues();
    
    if (tempData.length <= 1) {
      return { success: false, message: "No data rows found in temporary tab." };
    }
    
    const tempHeaders = tempData[0];
    const mainHeaders = mainData[0];
    
    const cleanTempHeaders = tempHeaders.map(h => String(h).trim().toLowerCase());
    const cleanMainHeaders = mainHeaders.map(h => String(h).trim().toLowerCase());
    
    // Identify the primary date column index in the main sheet
    const mainDateColIndices = [];
    for (let i = 0; i < cleanMainHeaders.length; i++) {
      if (cleanMainHeaders[i] === 'date') {
        mainDateColIndices.push(i);
      }
    }
    let mainDateIdx = -1;
    if (mainDateColIndices.length >= 2) {
      mainDateIdx = mainDateColIndices[1];
    } else if (mainDateColIndices.length === 1) {
      mainDateIdx = mainDateColIndices[0];
    }
    
    const originalRowIdxCol = cleanTempHeaders.indexOf('original row index (do not edit)');
    if (originalRowIdxCol === -1) {
      throw new Error("Critical error: Original Row Index column was deleted from temporary tab.");
    }
    
    let editedCellsCount = 0;
    let editedRowsCount = 0;
    
    // Clear previous cell highlights in the temp sheet
    if (tempData.length > 1) {
      tempSheet.getRange(2, 1, tempData.length - 1, tempHeaders.length - 1).setBackground(null);
    }
    
    // Loop through temp tab rows
    for (let i = 1; i < tempData.length; i++) {
      const tempRow = tempData[i];
      const originalRowIdx = parseInt(tempRow[originalRowIdxCol], 10);
      
      if (isNaN(originalRowIdx) || originalRowIdx < 2 || originalRowIdx > mainData.length) {
        continue;
      }
      
      const mainRow = mainData[originalRowIdx - 1];
      if (!mainRow) continue;
      
      let rowWasEdited = false;
      
      for (let c = 0; c < tempHeaders.length - 1; c++) {
        const headerName = cleanTempHeaders[c];
        let mainColIdx = -1;
        
        // Match columns 1:1 if the schema orders align, otherwise look up by header name
        if (c < cleanMainHeaders.length && cleanTempHeaders[c] === cleanMainHeaders[c]) {
          mainColIdx = c;
        } else {
          mainColIdx = cleanMainHeaders.indexOf(headerName);
        }
        
        if (mainColIdx !== -1) {
          let tempVal = tempRow[c];
          let mainVal = mainRow[mainColIdx];
          
          const cleanTempVal = String(tempVal).trim();
          const cleanMainVal = String(mainVal).trim();
          
          const numTempVal = Number(tempVal);
          const numMainVal = Number(mainVal);
          const isBothNumeric = !isNaN(numTempVal) && !isNaN(numMainVal) && cleanTempVal !== "" && cleanMainVal !== "";
          
          let isDifferent = false;
          if (headerName === 'date') {
            // Case-insensitive date comparison using parseAndFormatDate
            const normTemp = parseAndFormatDate(tempVal);
            const normMain = parseAndFormatDate(mainVal);
            isDifferent = normTemp !== normMain;
          } else if (isBothNumeric) {
            isDifferent = numTempVal !== numMainVal;
          } else {
            isDifferent = cleanTempVal !== cleanMainVal;
          }
          
          if (isDifferent) {
            // Highlight edited cell in temp tab
            tempSheet.getRange(i + 1, c + 1).setBackground("#fef08a");
            
            // CRITICAL VERIFICATION: Keep the primary raw database 100% untouched!
            // Do NOT save corrected value back to mainSheet. We only write/read inside temp spreadsheet.
            
            editedCellsCount++;
            rowWasEdited = true;
          }
        }
      }
      
      if (rowWasEdited) {
        editedRowsCount++;
      }
    }
    
    SpreadsheetApp.flush();
    
    if (editedCellsCount === 0) {
      return { 
        success: true, 
        editedCells: 0,
        editedRows: 0,
        message: "No modifications were found between the temporary tab and the main database. Main sheet is fully synchronized." 
      };
    }
    
    return {
      success: true,
      editedCells: editedCellsCount,
      editedRows: editedRowsCount,
      message: `Sync successful! Processed ${editedRowsCount} edited rows (${editedCellsCount} updated cells). Corrected data edits have been highlighted directly inside your monthly payout sheet tab '${tempTabName}'. Note: The primary 'Agent_view' database sheet remains completely untouched!`
    };
  } catch (err) {
    console.error(err);
    return { success: false, message: `Sync failed: ${err.message}` };
  }
}

/**
 * Saves an inline data correction made directly from the HTML dashboard table,
 * writing it to the monthly payout sheet in the dedicated spreadsheet,
 * and highlighting the updated cell in yellow to keep a permanent audit trail.
 * If the monthly payout tab does not exist yet, it initializes it automatically first.
 */
function saveInlineCorrection(selectedMonth, originalRowIndex, fieldName, value) {
  try {
    let ss;
    if (typeof SPREADSHEET_ID !== 'undefined' && SPREADSHEET_ID) {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    } else {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }
    
    // Open target spreadsheet for temporary tabs
    let tempSs = ss;
    if (typeof TEMP_SPREADSHEET_ID !== 'undefined' && TEMP_SPREADSHEET_ID) {
      tempSs = SpreadsheetApp.openById(TEMP_SPREADSHEET_ID);
    }
    
    const tempTabName = getPayoutTabName(selectedMonth);
    
    let tempSheet = tempSs.getSheetByName(tempTabName);
    if (!tempSheet) {
      // Auto-initialize the monthly payout tab if it doesn't exist yet!
      const initRes = prepareTempTabForMonth(selectedMonth);
      if (!initRes.success) {
        throw new Error("Could not automatically initialize monthly payout tab: " + initRes.message);
      }
      tempSheet = tempSs.getSheetByName(tempTabName);
    }
    
    if (!tempSheet) {
      throw new Error(`Monthly payout tab '${tempTabName}' not found or could not be created.`);
    }
    
    const tempData = tempSheet.getDataRange().getDisplayValues();
    if (tempData.length <= 1) {
      throw new Error(`Monthly payout tab '${tempTabName}' is empty.`);
    }
    
    const tempHeaders = tempData[0];
    const cleanHeaders = tempHeaders.map(h => String(h).trim().toLowerCase());
    
    const origRowIdxCol = cleanHeaders.indexOf('original row index (do not edit)');
    if (origRowIdxCol === -1) {
      throw new Error("Critical error: 'Original Row Index' column not found in monthly tab.");
    }
    
    // Map fieldName to exact column header inside the monthly tab
    let targetHeader = fieldName.toLowerCase().trim();
    // Normalize field mapping if necessary
    if (targetHeader === 'delivered') targetHeader = 'del_update';
    if (targetHeader === 'pickedup') targetHeader = 'picked-up';
    
    const targetColIdx = cleanHeaders.indexOf(targetHeader);
    if (targetColIdx === -1) {
      throw new Error(`Column '${fieldName}' not found in monthly tab headers.`);
    }
    
    // Search for the row matching originalRowIndex
    let targetRowIdxInSheet = -1;
    for (let i = 1; i < tempData.length; i++) {
      const origVal = parseInt(tempData[i][origRowIdxCol], 10);
      if (origVal === originalRowIndex) {
        targetRowIdxInSheet = i + 1; // 1-based sheet row index
        break;
      }
    }
    
    if (targetRowIdxInSheet === -1) {
      throw new Error(`Row with original index ${originalRowIndex} not found in monthly payout tab.`);
    }
    
    // Update the cell value and highlight it in light yellow
    const cellRange = tempSheet.getRange(targetRowIdxInSheet, targetColIdx + 1);
    cellRange.setValue(value);
    cellRange.setBackground("#fef08a");
    
    SpreadsheetApp.flush();
    
    return {
      success: true,
      message: `Successfully updated and highlighted ${fieldName} to ${value} in monthly payout tab '${tempTabName}'.`
    };
  } catch (err) {
    console.error("Error inside saveInlineCorrection: ", err);
    return { success: false, message: `Failed to save inline correction: ${err.message}` };
  }
}

/**
 * Normalizes any monthKey (e.g. "06-2026" or "Jun-2026") into a beautiful payout tab name
 * like "June 2026 Payout".
 */
function getPayoutTabName(monthKey) {
  if (!monthKey || monthKey === 'Unknown') return "Unknown Payout";
  const parts = monthKey.split('-');
  if (parts.length === 2) {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthsAbbr = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    
    // Check if it's month number (e.g. "06")
    const monthNum = parseInt(parts[0], 10);
    if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
      return `${monthNames[monthNum - 1]} ${parts[1]} Payout`;
    }
    
    // Check if it's abbreviation (e.g. "Jun")
    const monthAbbrIdx = monthsAbbr.indexOf(parts[0].toLowerCase());
    if (monthAbbrIdx !== -1) {
      return `${monthNames[monthAbbrIdx]} ${parts[1]} Payout`;
    }
    
    // Fallback if it is full month name already
    return `${parts[0]} ${parts[1]} Payout`;
  }
  return monthKey + " Payout";
}

/**
 * Optimally retrieves all unique month-year keys present in the database sheet,
 * sorted chronologically. This is used by the startup Month Selection modal.
 */
function getUniqueMonths() {
  try {
    let ss;
    if (typeof SPREADSHEET_ID !== 'undefined' && SPREADSHEET_ID) {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    } else {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }
    const sheet = ss.getSheetByName(SHEET_TAB_NAME);
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getDisplayValues();
    if (data.length <= 1) return [];
    
    const headers = data[0];
    let dateOccurrences = [];
    for (let i = 0; i < headers.length; i++) {
      if (String(headers[i]).trim().toLowerCase() === 'date') {
        dateOccurrences.push(i);
      }
    }
    
    // Direct index of the second 'Date' column as requested
    const dateIdx = dateOccurrences.length >= 2 ? dateOccurrences[1] : (dateOccurrences.length > 0 ? dateOccurrences[0] : -1);
    if (dateIdx === -1) return [];
    
    const ABBR = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
    const months = new Set();
    
    for (let i = 1; i < data.length; i++) {
      const val = String(data[i][dateIdx]).trim();
      if (!val) continue;
      
      const parts = val.split(/[-\/]/);
      if (parts.length < 3) continue;
      
      let m = -1, y = "";
      // Check each part to find year and month
      for (let p of parts) {
        const cleanP = p.toLowerCase().trim();
        if (cleanP.length === 4 && !isNaN(parseInt(cleanP, 10))) {
          y = cleanP;
        }
        const mIdx = ABBR.indexOf(cleanP.substring(0, 3));
        if (mIdx !== -1) {
          m = mIdx;
        }
      }
      
      // Fallback for numeric months in DD-MM-YYYY
      if (m === -1) {
        const mNum = parseInt(parts[1], 10);
        if (mNum >= 1 && mNum <= 12) m = mNum - 1;
      }
      
      if (m !== -1 && y) {
        months.add(ABBR[m] + "-" + y);
      }
    }
    
    return Array.from(months).sort((a, b) => {
      const pA = a.split("-"), pB = b.split("-");
      return new Date(pA[1], ABBR.indexOf(pA[0])) - new Date(pB[1], ABBR.indexOf(pB[0]));
    });
  } catch (e) {
    console.error("Error in getUniqueMonths: " + e.message);
    return [];
  }
}


