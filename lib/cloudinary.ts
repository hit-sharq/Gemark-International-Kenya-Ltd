// Create a new file that will contain our Cloudinary configuration and helpers

export const cloudinaryConfig = {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo",
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "arts_afrik",
  }
  
  // Custom loader for next/image component to use with Cloudinary
  export function cloudinaryLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
    // If the src is an absolute URL (external) or data URL, return it as-is
    if (src.startsWith("http") || src.startsWith("data:")) {
      return src
    }
  
    // If this is already a Cloudinary URL, return it as-is
    if (src.includes("res.cloudinary.com")) {
      return src
    }
  
    // For placeholder.svg URLs, return as-is
    if (src.includes("placeholder.svg")) {
      return src
    }
  
    // Remove leading slash if present
    const imagePath = src.startsWith("/") ? src.slice(1) : src
  
    // Build the Cloudinary URL with transformations
    const params = [
      "f_auto", // automatic format selection
      "c_limit", // limit to specified width
      `w_${width}`, // set width
      `q_${quality || "auto"}`, // set quality (auto if not specified)
    ]
  
    return `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/${params.join(",")}/${imagePath}`
  }
  
  // Helper to get a Cloudinary URL with custom transformations
  export function getCloudinaryUrl(src: string, transformations: string[] = []) {
    // If the src is not a Cloudinary URL and doesn't start with http, prepend the Cloudinary prefix
    if (!src.includes("res.cloudinary.com") && !src.startsWith("http") && !src.includes("placeholder.svg")) {
      const imagePath = src.startsWith("/") ? src.slice(1) : src
      return `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/${transformations.join(
        ",",
      )}/${imagePath}`
    }
  
    // If it's already a Cloudinary URL, return it (possibly with modified transformations)
    if (src.includes("res.cloudinary.com")) {
      const urlParts = src.split("/upload/")
      if (urlParts.length === 2) {
        return `${urlParts[0]}/upload/${transformations.join(",")}/${urlParts[1].split("/").slice(1).join("/")}`
      }
    }
  
    // For placeholder and other URLs, return as-is
    return src
  }
  