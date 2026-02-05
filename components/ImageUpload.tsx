"use client";

import React, { useState, ChangeEvent } from "react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "arts_afrik"); // Adjust if needed

      // Upload to Cloudinary unsigned upload endpoint
      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await res.json();
      if (data.secure_url) {
        onChange(data.secure_url);
      } else {
        throw new Error("No secure_url returned");
      }
    } catch (err: any) {
      setError(err.message || "Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-upload">
      {label && <label className="block mb-1">{label}</label>}
      <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
      {uploading && <p>Uploading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {value && (
        <div className="image-preview mt-2">
          <img src={value} alt="Uploaded" className="preview-image" />
        </div>
      )}
    </div>
  );
}
