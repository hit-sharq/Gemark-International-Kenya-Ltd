"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import MainLayout from "@/components/MainLayout"
import { updateBlogPost } from "@/app/actions/blog-actions"
import { isAdmin } from "@/lib/auth"
import "../blog-form.css"

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  author: string
  authorTitle?: string
  tags: string[]
  image?: string
  featured: boolean
  allowComments: boolean
  status: string
  date: string
}

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

export default function EditBlogPost() {
  const { id } = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)

  // Check if user is admin
  useEffect(() => {
    async function checkAdmin() {
      const adminStatus = await isAdmin()
      setIsAuthorized(adminStatus)
      if (!adminStatus) {
        router.push("/dashboard")
      }
    }
    checkAdmin()
  }, [router])

  // Fetch blog post data
  useEffect(() => {
    async function fetchBlogPost() {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/blog-posts/${id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch blog post")
        }
        const data = await response.json()
        setBlogPost({
          ...data,
          date: new Date(data.date).toISOString().split("T")[0],
        })
      } catch (error) {
        console.error("Error fetching blog post:", error)
        setError("Failed to load blog post. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchBlogPost()
    }
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (!blogPost) return

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked
      setBlogPost({ ...blogPost, [name]: checked })
    } else {
      setBlogPost({ ...blogPost, [name]: value })
    }
  }

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!blogPost) return
    const tagsString = e.target.value
    const tagsArray = tagsString.split(",").map((tag) => tag.trim())
    setBlogPost({ ...blogPost, tags: tagsArray })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!blogPost) return

    setIsSubmitting(true)
    setError("")
    setSuccess("")

    try {
      const formData = new FormData()
      formData.append("id", blogPost.id)
      formData.append("title", blogPost.title)
      formData.append("excerpt", blogPost.excerpt)
      formData.append("content", blogPost.content)
      formData.append("category", blogPost.category)
      formData.append("author", blogPost.author)
      if (blogPost.authorTitle) {
        formData.append("authorTitle", blogPost.authorTitle)
      }
      formData.append("tags", blogPost.tags.join(","))
      if (blogPost.image) {
        formData.append("image", blogPost.image)
      }
      formData.append("featured", blogPost.featured ? "on" : "off")
      formData.append("allowComments", blogPost.allowComments ? "on" : "off")
      formData.append("status", blogPost.status)
      formData.append("publishDate", new Date(blogPost.date).toISOString())

      const result = await updateBlogPost(formData)

      if (result.success) {
        setSuccess("Blog post updated successfully!")
        // Redirect after a short delay
        setTimeout(() => {
          router.push("/dashboard?tab=blog")
        }, 2000)
      } else {
        setError(result.message || "Failed to update blog post")
      }
    } catch (error) {
      console.error("Error updating blog post:", error)
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

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading blog post...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!blogPost) {
    return (
      <MainLayout>
        <div className="container">
          <div className="not-found">
            <h1>Blog Post Not Found</h1>
            <p>The blog post you are trying to edit does not exist.</p>
            <Link href="/dashboard?tab=blog" className="button">
              Return to Dashboard
            </Link>
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
              <h1>Edit Blog Post</h1>
              <p>Update your blog post details below.</p>
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
                <input type="text" id="title" name="title" value={blogPost.title} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="excerpt">Excerpt</label>
                <textarea
                  id="excerpt"
                  name="excerpt"
                  rows={3}
                  value={blogPost.excerpt}
                  onChange={handleChange}
                  required
                ></textarea>
                <small>A brief summary of your blog post (shown in listings)</small>
              </div>

              <div className="form-group">
                <label htmlFor="content">Content</label>
                <textarea
                  id="content"
                  name="content"
                  rows={10}
                  value={blogPost.content}
                  onChange={handleChange}
                  required
                ></textarea>
                <small>HTML formatting is supported</small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <select id="category" name="category" value={blogPost.category} onChange={handleChange} required>
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
                    value={blogPost.author}
                    onChange={handleChange}
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
                    value={blogPost.authorTitle || ""}
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
                    value={blogPost.tags.join(", ")}
                    onChange={handleTagsChange}
                    placeholder="Enter tags separated by commas"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="image">Featured Image URL</label>
                  <input
                    type="text"
                    id="image"
                    name="image"
                    value={blogPost.image || ""}
                    onChange={handleChange}
                    placeholder="Enter image URL"
                  />
                  {blogPost.image && (
                    <div className="image-preview">
                      <Image
                        src={blogPost.image || "/placeholder.svg"}
                        alt="Featured image preview"
                        width={300}
                        height={200}
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="date">Publish Date</label>
                  <input type="date" id="date" name="date" value={blogPost.date} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select id="status" name="status" value={blogPost.status} onChange={handleChange} required>
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
                      checked={blogPost.featured}
                      onChange={(e) => setBlogPost({ ...blogPost, featured: e.target.checked })}
                    />
                    <label htmlFor="featured">Set as featured post</label>
                  </div>

                  <div className="form-group checkbox-group">
                    <input
                      type="checkbox"
                      id="allowComments"
                      name="allowComments"
                      checked={blogPost.allowComments}
                      onChange={(e) => setBlogPost({ ...blogPost, allowComments: e.target.checked })}
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
                  {isSubmitting ? "Updating..." : "Update Blog Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
