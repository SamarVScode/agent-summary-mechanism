import { useState, useCallback } from "react";
import { calculateFileHash } from "../utils/hashUtils";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config";

export function useImageUpload(extractOcr, resetOcr) {
  const [imageState, setImageState] = useState(null);
  const [phase, setPhase] = useState("upload");
  const [toast, setToast] = useState("");

  const handleImageSelected = useCallback(
    async ({ file, base64, previewUrl, imageName }) => {
      // Revoke previous object URL to free memory
      if (imageState?.previewUrl) URL.revokeObjectURL(imageState.previewUrl);

      setPhase("ocr");
      setToast("");
      resetOcr();

      try {
        // 1. Calculate the file hash
        const fileHash = await calculateFileHash(file);

        setImageState({ file, base64, previewUrl, imageName, fileHash });

        // 2. Check for duplicates in Supabase
        if (SUPABASE_URL && !SUPABASE_URL.includes("PASTE_YOUR")) {
           const checkUrl = `${SUPABASE_URL}/rest/v1/submissions?file_hash=eq.${fileHash}&select=id`;
           const res = await fetch(checkUrl, {
             headers: {
               "apikey": SUPABASE_ANON_KEY,
               "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
             }
           });

           if (res.ok) {
             const data = await res.json();
             if (data && data.length > 0) {
               // Duplicate found!
               setPhase("upload");
               setToast("This screenshot has already been submitted.");
               setTimeout(() => setToast(""), 5000);
               return; // Stop processing
             }
           }
        }

        // 3. Proceed with OCR
        const ocrRes = await extractOcr(file);
        if (ocrRes && ocrRes.success) {
          setPhase("confirm");
        } else {
          setPhase("upload");
          setToast("Could not read screenshot. Please use a clear, well-lit image.");
          setTimeout(() => setToast(""), 5000);
        }
      } catch (err) {
        console.error("Error processing image:", err);
        setPhase("upload");
        setToast("An error occurred while processing the image.");
        setTimeout(() => setToast(""), 5000);
      }
    },
    [imageState, extractOcr, resetOcr]
  );

  return {
    imageState,
    setImageState,
    phase,
    setPhase,
    toast,
    setToast,
    handleImageSelected
  };
}
