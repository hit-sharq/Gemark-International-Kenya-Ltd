"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import MainLayout from "@/components/MainLayout"
import { createBlogPost } from "@/app/actions/blog-actions"
import { isAdmin } from "@/lib/auth"
import "../blog-form.css"
import ImageUpload from "@/components/ImageUpload" // Adjust the path based on your project structure

const CATEGORIES = [
  "Art History",
  "Sustainability",
  "Art Appreciation",
  "Market Trends",
  "Care Guide",
  "Craftsmanship",
  "Cultural Insights",
  "Artist Spotlight",
]

export default function NewBlogPost() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "",
    author: "",
    authorTitle: "",
    tags: [] as string[],
    image: "",
    featured: false,
    allowComments: true,
    status: "draft",
    publishDate: new Date().toISOString().split("T")[0],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [tagsInput, setTagsInput] = useState("")

  // Check if user is admin
  useEffect(() => {
    async function checkAdmin() {
      try {
        const response = await fetch("/api/check-admin")
        const data = await response.json()
        if (data.isAdmin) {
          setIsAuthorized(true)
        } else {
          setIsAuthorized(false)
          router.push("/dashboard")
        }
      } catch (error) {
        console.error("Failed to check admin status:", error)
        setIsAuthorized(false)
        router.push("/dashboard")
      }
    }
    checkAdmin()
  }, [router])
  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked
      setFormData({ ...formData, [name]: checked })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagsInput(e.target.value)
    const tagsArray = e.target.value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
    setFormData({ ...formData, tags: tagsArray })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")
    setSuccess("")

    try {
      const formDataObj = new FormData()
      formDataObj.append("title", formData.title)
      formDataObj.append("excerpt", formData.excerpt || formData.title.substring(0, 150) + "...")
      formDataObj.append("content", formData.content)
      formDataObj.append("category", formData.category)
      formDataObj.append("author", formData.author)
      if (formData.authorTitle) {
        formDataObj.append("authorTitle", formData.authorTitle)
      }
      formDataObj.append("tags", formData.tags.join(","))
      if (formData.image) {
        formDataObj.append("image", formData.image)
      }
      formDataObj.append("featured", formData.featured ? "on" : "off")
      formDataObj.append("allowComments", formData.allowComments ? "on" : "off")
      formDataObj.append("status", formData.status)
      formDataObj.append("publishDate", new Date(formData.publishDate).toISOString())

      const result = await createBlogPost(formDataObj)

      if (result.success) {
        setSuccess("Blog post created successfully!")
        // Redirect after a short delay
        setTimeout(() => {
          router.push("/dashboard?tab=blog")
        }, 2000)
      } else {
        setError(result.message || "Failed to create blog post")
      }
    } catch (error) {
      console.error("Error creating blog post:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthorized) {
    return (
      <MainLayout>
        <div className="container">
          <div className="loading-container">
            <p>Checking authorization...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="blog-form-page">
        <div className="container">
          <div className="blog-form-container">
            <div className="form-header">
              <h1>Create New Blog Post</h1>
              <p>Fill in the details below to create a new blog post.</p>
            </div>

            {success && (
              <div className="success-message">
                <i className="fas fa-check-circle"></i>
                <p>{success}</p>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <form className="blog-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">Blog Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter your blog title"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="excerpt">Excerpt</label>
                <textarea
                  id="excerpt"
                  name="excerpt"
                  rows={3}
                  value={formData.excerpt}
                  onChange={handleChange}
                  placeholder="A brief summary of your blog post (shown in listings)"
                ></textarea>
                <small>If left empty, an excerpt will be generated from your content</small>
              </div>

              <div className="form-group">
                <label htmlFor="content">Content</label>
                <textarea
                  id="content"
                  name="content"
                  rows={10}
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="Write your blog post content here..."
                  required
                ></textarea>
                <small>HTML formatting is supported</small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <select id="category" name="category" value={formData.category} onChange={handleChange} required>
                    <option value="">Select category</option>
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="author">Author</label>
                  <input
                    type="text"
                    id="author"
                    name="author"
                    value={formData.author}
                    onChange={handleChange}
                    placeholder="Author name"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="authorTitle">Author Title</label>
                  <input
                    type="text"
                    id="authorTitle"
                    name="authorTitle"
                    value={formData.authorTitle}
                    onChange={handleChange}
                    placeholder="e.g., Cultural Specialist, Founder"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="tags">Tags</label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={tagsInput}
                    onChange={handleTagsChange}
                    placeholder="Enter tags separated by commas"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <ImageUpload
                    label="Upload Featured Image"
                    value={formData.image}
                    onChange={(url: string) => setFormData({ ...formData, image: url })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="publishDate">Publish Date</label>
                  <input
                    type="date"
                    id="publishDate"
                    name="publishDate"
                    value={formData.publishDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select id="status" name="status" value={formData.status} onChange={handleChange} required>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>

                <div className="form-group" style={{ display: "flex", gap: "20px" }}>
                  <div className="form-group checkbox-group">
                    <input
                      type="checkbox"
                      id="featured"
                      name="featured"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    />
                    <label htmlFor="featured">Set as featured post</label>
                  </div>

                  <div className="form-group checkbox-group">
                    <input
                      type="checkbox"
                      id="allowComments"
                      name="allowComments"
                      checked={formData.allowComments}
                      onChange={(e) => setFormData({ ...formData, allowComments: e.target.checked })}
                    />
                    <label htmlFor="allowComments">Allow comments</label>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <Link href="/dashboard?tab=blog" className="button cancel-button">
                  Cancel
                </Link>
                <button type="submit" className="button submit-button" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Publish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
