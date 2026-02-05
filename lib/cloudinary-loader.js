// Custom loader implementation for Next.js
export default function cloudinaryLoader({ src, width, quality }) {
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
  
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo"}/image/upload/${params.join(
      ",",
    )}/${imagePath}`
  }
  