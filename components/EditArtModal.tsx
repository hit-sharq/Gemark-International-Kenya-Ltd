"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { updateArtListing } from "@/app/actions/art-actions"

interface ArtListing {
  id: string
  title: string
  description: string
  price: number
  category: {
    id: string
    name: string
    slug: string
  }
  region: string
  size: string
  featured: boolean
}

interface EditArtModalProps {
  isOpen: boolean
  onClose: () => void
  artId: string
  onSuccess: () => void
}

export default function EditArtModal({ isOpen, onClose, artId, onSuccess }: EditArtModalProps) {
  const [art, setArt] = useState<ArtListing | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [categories, setCategories] = useState<Array<{id: string, name: string, slug: string}>>([])

  useEffect(() => {
    if (isOpen && artId) {
      setIsLoading(true)
      setError("")

      // Fetch categories and art details
      Promise.all([
        fetch("/api/categories").then(res => res.json()),
        fetch(`/api/art-listings/${artId}`).then(res => res.json())
      ])
        .then(([categoriesData, artData]) => {
          setCategories(categoriesData)
          setArt(artData)
          setIsLoading(false)
        })
        .catch((error) => {
          console.error("Error fetching data:", error)
          setError("Failed to load art details. Please try again.")
          setIsLoading(false)
        })
    }
  }, [isOpen, artId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (!art) return

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked
      setArt({ ...art, [name]: checked })
    } else if (type === "number") {
      setArt({ ...art, [name]: Number.parseFloat(value) })
    } else {
      setArt({ ...art, [name]: value })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!art) return

    setIsSaving(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("id", art.id)
      formData.append("title", art.title)
      formData.append("description", art.description)
      formData.append("categoryId", art.category.id)
      formData.append("region", art.region)
      formData.append("price", art.price.toString())
      formData.append("size", art.size)
      formData.append("featured", art.featured ? "on" : "off")

      const result = await updateArtListing(formData)

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.message || "Failed to update art listing")
      }
    } catch (error) {
      console.error("Error updating art:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="modal-header">
          <h2>Edit Art Listing</h2>
        </div>

        {isLoading ? (
          <div className="modal-loading">
            <div className="loading-spinner"></div>
            <p>Loading art details...</p>
          </div>
        ) : error && !art ? (
          <div className="modal-error">
            <p>{error}</p>
            <button className="button" onClick={onClose}>
              Close
            </button>
          </div>
        ) : art ? (
          <form className="edit-form" onSubmit={handleSubmit}>
            {error && <div className="form-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="title">Art Title</label>
              <input type="text" id="title" name="title" value={art.title} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                rows={5}
                value={art.description}
                onChange={handleChange}
                required
              ></textarea>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="categoryId">Category</label>
                <select id="categoryId" name="categoryId" value={art.category.id} onChange={handleChange} required>
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="region">Region</label>
                <select id="region" name="region" value={art.region} onChange={handleChange} required>
                  <option value="">Select Region</option>
                  <option value="West Africa">West Africa</option>
                  <option value="East Africa">East Africa</option>
                  <option value="Central Africa">Central Africa</option>
                  <option value="Southern Africa">Southern Africa</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Price ($)</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  min="0"
                  step="0.01"
                  value={art.price}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="size">Size</label>
                <input
                  type="text"
                  id="size"
                  name="size"
                  placeholder='e.g., 12" x 6" x 3"'
                  value={art.size}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="featured"
                name="featured"
                checked={art.featured}
                onChange={(e) => setArt({ ...art, featured: e.target.checked })}
              />
              <label htmlFor="featured">Feature this art piece on the home page</label>
            </div>

            <div className="modal-actions">
              <button type="button" className="button secondary-button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="button primary-button" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  )
}
