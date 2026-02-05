"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createTeamMember } from "@/app/actions/team-actions"

export default function NewTeamMemberPage() {
  const [name, setName] = useState("")
  const [title, setTitle] = useState("")
  const [bio, setBio] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [order, setOrder] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleImageChange = (file: File | null) => {
    setImage(file)

    // Create preview URL for the selected image
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreview("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Create FormData object
      const formData = new FormData()
      formData.append("name", name)
      formData.append("title", title)
      formData.append("bio", bio)
      formData.append("order", order.toString())

      // Only append image if one was selected
      if (image) {
        formData.append("image", image)
      }

      // Use the server action to create the team member
      const result = await createTeamMember(formData)

      if (result.success) {
        // Redirect to the team management page
        setTimeout(() => {
          window.location.href = "/dashboard?tab=team"
        }, 500)
      } else {
        setError(result.message || "Failed to create team member")
      }
    } catch (err) {
      console.error("Error creating team member:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Add New Team Member</h1>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="input input-bordered w-full"
          />
        </div>
        <div>
          <label className="block mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="input input-bordered w-full"
          />
        </div>
        <div>
          <label className="block mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            required
            className="textarea textarea-bordered w-full"
            rows={4}
          />
        </div>
        <div>
          <label className="block mb-1">Team Member Image</label>
          <div className="flex flex-col items-center space-y-2">
            {imagePreview && (
              <div className="w-32 h-32 overflow-hidden rounded-full mb-2">
                <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
              className="file-input file-input-bordered w-full"
            />
          </div>
        </div>
        <div>
          <label className="block mb-1">Display Order</label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="input input-bordered w-full"
          />
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  )
}
