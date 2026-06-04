import { useState } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config";

/**
 * useGasSubmit — uploads screenshots to Supabase Storage and records counts in 'submissions' table.
 *
 * Returns { submit, submitting, result, resetResult }
 */
export function useGasSubmit() {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState(null);

  async function submit({ date, agentName, totalCount, completedCount, imageBase64, imageName, file, fileHash }) {
    setSubmitting(true);
    setResult(null);

    try {
      if (!SUPABASE_URL || SUPABASE_URL.includes("PASTE_YOUR")) {
        throw new Error("Supabase is not configured in config.js");
      }

      // 1. Determine binary payload to upload
      let fileData = file;
      if (!fileData && imageBase64) {
        fileData = base64ToBlob(imageBase64);
      }
      if (!fileData) {
        throw new Error("No image file provided for upload.");
      }

      const mimeType = fileData.type || "image/jpeg";
      const bucketName = "screenshots";
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucketName}/${imageName}`;

      // 2. Upload file to Supabase Storage
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": mimeType
        },
        body: fileData
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Screenshot upload failed: ${errorText || uploadResponse.statusText}`);
      }

      // 3. Generate public URL for the image
      const publicImageUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucketName}/${imageName}`;

      // 4. Insert row in Supabase database 'submissions' table
      const dbUrl = `${SUPABASE_URL}/rest/v1/submissions`;
      const dbResponse = await fetch(dbUrl, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          date: date,
          agent_name: agentName,
          total_count: totalCount,
          completed_count: completedCount,
          image_url: publicImageUrl,
          file_hash: fileHash, // Save the unique hash
          processed: false
        })
      });

      if (!dbResponse.ok) {
        const errorText = await dbResponse.text();
        throw new Error(`Database record creation failed: ${errorText || dbResponse.statusText}`);
      }

      setResult({ success: true, imageUrl: publicImageUrl });
    } catch (err) {
      setResult({ success: false, error: err.message || "Network error" });
    } finally {
      setSubmitting(false);
    }
  }

  function resetResult() {
    setResult(null);
  }

  return { submit, submitting, result, resetResult };
}

// Convert base64 to Blob (for fallback)
function base64ToBlob(base64, type = "image/jpeg") {
  const binStr = window.atob(base64);
  const len = binStr.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    arr[i] = binStr.charCodeAt(i);
  }
  return new Blob([arr], { type });
}
