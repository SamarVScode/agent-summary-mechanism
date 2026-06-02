/**
 * fileToBase64 — reads a File and returns its raw base64 string
 * (strips the "data:image/...;base64," prefix so GAS can decode it directly)
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;            // "data:image/jpeg;base64,/9j/..."
      const base64 = result.split(",")[1];     // strip prefix
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * fileToPreviewUrl — creates an object URL for <img> preview
 * Remember to call URL.revokeObjectURL(url) when done to free memory
 */
export function fileToPreviewUrl(file) {
  return URL.createObjectURL(file);
}
