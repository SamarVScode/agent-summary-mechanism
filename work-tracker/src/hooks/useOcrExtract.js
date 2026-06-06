import { useState, useRef } from "react";

/**
 * parseCountsFromOcr — finds the number above "Total" and above "Completed"
 * in the OCR text from the Summary screen.
 *
 * Screenshot layout:
 *   72          0
 *  Total      Pending
 *
 *   9          63
 *  Failed   Completed
 *
 * Strategy:
 *  1. Split OCR text into trimmed, non-empty lines.
 *  2. Find the line containing "total" (not "completed") → look one line above.
 *     The FIRST number on that line is totalCount.
 *  3. Find the line containing "completed" → look one line above.
 *     The LAST number on that line is completedCount.
 *  4. Fallback: scan entire text for "72 total" or "63 completed" patterns.
 */
function parseCountsFromOcr(rawText) {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let totalCount     = null;
  let completedCount = null;

  const getTokensAbove = (index) => {
    const prevLine = index > 0 ? lines[index - 1] : lines[index];
    return prevLine.match(/\d+/g) || [];
  };

  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();

    // ── Find "Total" label ──────────────────────────────────────────
    if (lower.includes("total") && !lower.includes("completed")) {
      const tokens = getTokensAbove(i);
      if (tokens.length > 0) {
        totalCount = parseInt(tokens[0], 10); // left-most number = Total
      }
    }

    // ── Find "Completed" label ──────────────────────────────────────
    if (lower.includes("completed")) {
      const tokens = getTokensAbove(i);
      if (tokens.length > 0) {
        completedCount = parseInt(tokens[tokens.length - 1], 10); // right-most = Completed
      }
    }
  }

  // ── Fallback: regex on whole text ──────────────────────────────────
  if (totalCount === null) {
    const m = rawText.match(/(\d+)\s*\n?\s*total/i);
    if (m) totalCount = parseInt(m[1], 10);
  }
  if (completedCount === null) {
    const m = rawText.match(/(\d+)\s*\n?\s*completed/i);
    if (m) completedCount = parseInt(m[1], 10);
  }

  return { totalCount, completedCount };
}

/**
 * useOcrExtract — runs Tesseract.js OCR on the uploaded file and
 * parses out totalCount and completedCount.
 *
 * Returns { extract, status, result }
 *   status : "idle" | "extracting" | "done" | "error"
 *   result : { totalCount, completedCount, rawText } | null
 */
export function useOcrExtract() {
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const workerRef = useRef(null);

  async function extract(file) {
    setStatus("extracting");
    setResult(null);

    try {
      // Lazy-initialise the Tesseract worker (reused across calls)
      if (!workerRef.current) {
        const { createWorker } = await import("tesseract.js");
        workerRef.current = await createWorker("eng");
      }

      const {
        data: { text: rawText },
      } = await workerRef.current.recognize(file);

      const { totalCount, completedCount } = parseCountsFromOcr(rawText);

      if (totalCount === null || completedCount === null) {
        setStatus("error");
        setResult({ totalCount, completedCount, rawText });
        return { success: false, totalCount, completedCount, rawText };
      } else {
        setStatus("done");
        setResult({ totalCount, completedCount, rawText });
        return { success: true, totalCount, completedCount, rawText };
      }
    } catch (err) {
      setStatus("error");
      setResult({ totalCount: null, completedCount: null, rawText: "", error: err.message });
      return { success: false, error: err.message };
    }
  }

  // Provide a reset so the user can re-upload
  function reset() {
    setStatus("idle");
    setResult(null);
  }

  return { extract, reset, status, result };
}
