"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@clerk/nextjs"
import MainLayout from "../../components/MainLayout"
import EditArtModal from "../../components/EditArtModal"
import TeamMemberModal from "../../components/TeamMemberModal"
import "./dashboard.css"

// Add this near the top of the file with other imports
import { createArtListing, toggleFeatured, deleteArtListing } from "../actions/art-actions"
import { deleteBlogPost } from "../actions/blog-actions"
import { deleteTeamMember } from "../actions/team-actions"
import { cloudinaryLoader } from "@/lib/cloudinary"

// Define a type for the active tab to ensure type safety
type ActiveTabType = "orders" | "art" | "upload" | "blog" | "team" | "categories" | "artisans"

interface Artisan {
  id: string
  email: string
  fullName: string
  phone: string | null
  specialty: string
  region: string
  location: string | null
  yearsExperience: number | null
  shopBio: string | null
  status: "PENDING" | "APPROVED" | "REJECTED"
  rejectionReason: string | null
  createdAt: string
  approvedAt: string | null
  _count: {
    artListings: number
  }
}

interface ArtListing {
  id: string
  title: string
  category: {
    id: string
    name: string
    slug: string
  }
  material?: string
  region: string
  price: number
  featured: boolean
  image?: string
  images?: string[]
}

interface Order {
  id: string
  name: string
  email: string
  location: string
  artTitle: string
  status: string
  date: string
}

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  category: string
  author: string
  date: string
  status: string
  featured: boolean
}

interface TeamMember {
  id: string
  name: string
  title: string
  bio: string
  image: string
  order: number
}

// Define a new interface for the file uploads with preview
interface FileWithPreview extends File {
  preview?: string
}

export default function Dashboard() {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get the tab from URL query parameters
  const tabParam = searchParams.get("tab") as ActiveTabType | null

  // Use the defined type for activeTab
  const [activeTab, setActiveTab] = useState<ActiveTabType>(tabParam || "orders")
  const [orders, setOrders] = useState<Order[]>([])
  const [artListings, setArtListings] = useState<ArtListing[]>([])
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [artisans, setArtisans] = useState<Artisan[]>([])
  const [artisanFilter, setArtisanFilter] = useState<string>("PENDING")
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([])
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedArtId, setSelectedArtId] = useState("")

  // Team member modal state
  const [isTeamMemberModalOpen, setIsTeamMemberModalOpen] = useState(false)
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState("")

  useEffect(() => {
    // Only update the URL when tab changes if we're on the dashboard page
    // This prevents overriding navigation to other pages
    if (activeTab && window.location.pathname === "/dashboard") {
      router.push(`/dashboard?tab=${activeTab}`, { scroll: false })
    }
  }, [activeTab, router])

  // Modify the useEffect that checks admin status to only check once on initial load
  // Replace the existing useEffect for checking admin status with this:

  useEffect(() => {
    async function checkAdminStatus() {
      if (isLoaded && isSignedIn) {
        try {
          console.log("Checking admin status for signed-in user")
          const response = await fetch("/api/check-admin")
          const data = await response.json()
          console.log("Admin check response:", data)
          console.log("User ID from response:", data.userId)

          setIsAdmin(data.isAdmin)

          if (!data.isAdmin) {
            console.log("User is not an admin, redirecting to user dashboard")
            router.push("/user-dashboard")
          } else {
            console.log("User is an admin, staying on admin dashboard")
          }
        } catch (error) {
          console.error("Error checking admin status:", error)
          setIsAdmin(false)
          router.push("/user-dashboard")
        } finally {
          setIsLoading(false)
        }
      } else if (isLoaded) {
        setIsLoading(false)
      }
    }

    checkAdminStatus()
  }, [isLoaded, isSignedIn, router])

  // Remove the admin check from the useEffect that fetches data when tab changes
  // Replace the existing useEffect for fetching data with this:

  useEffect(() => {
    if (!isLoading && isAdmin) {
      if (activeTab === "orders") {
        fetchOrders()
      } else if (activeTab === "art") {
        fetchArtListings()
      } else if (activeTab === "blog") {
        fetchBlogPosts()
      } else if (activeTab === "team") {
        fetchTeamMembers()
      } else if (activeTab === "categories") {
        fetchCategories()
      } else if (activeTab === "upload") {
        fetchCategories()
      } else if (activeTab === "artisans") {
        fetchArtisans()
      }
    }
  }, [activeTab, isAdmin, isLoading])

  // Fetch orders
  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/order-requests")
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      } else {
        console.error("Failed to fetch orders")
        // No fallback mock data - rely on database
        setOrders([])
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      // No fallback mock data - rely on database
      setOrders([])
    }
  }

  // Fetch art listings
  const fetchArtListings = async () => {
    try {
      const response = await fetch("/api/art-listings")
      if (response.ok) {
        const data = await response.json()
        const formattedData = data.map((item: ArtListing) => ({
          ...item,
          image: item.images?.[0] || "/placeholder.svg?height=100&width=100",
        }))
        setArtListings(formattedData)
      } else {
        console.error("Failed to fetch art listings")
        // No fallback mock data - rely on database
        setArtListings([])
      }
    } catch (error) {
      console.error("Error fetching art listings:", error)
      // No fallback mock data - rely on database
      setArtListings([])
    }
  }

  // Fetch blog posts
  const fetchBlogPosts = async () => {
    try {
      const response = await fetch("/api/blog-posts")
      if (response.ok) {
        const data = await response.json()
        setBlogPosts(
          data.map((post: any) => ({
            ...post,
            date: new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          })),
        )
      } else {
        console.error("Failed to fetch blog posts")
        setBlogPosts([])
      }
    } catch (error) {
      console.error("Error fetching blog posts:", error)
      setBlogPosts([])
    }
  }

  // Fetch team members
  const fetchTeamMembers = async () => {
    try {
      const response = await fetch("/api/team-members")
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data)
      } else {
        console.error("Failed to fetch team members")
        setTeamMembers([])
      }
    } catch (error) {
      console.error("Error fetching team members:", error)
      setTeamMembers([])
    }
  }

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      } else {
        console.error("Failed to fetch categories")
        setCategories([])
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
      setCategories([])
    }
  }

  // Fetch artisans
  const fetchArtisans = async (status?: string) => {
    try {
      const url = status ? `/api/artisans?status=${status}` : "/api/artisans"
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setArtisans(data.artisans || [])
      } else {
        console.error("Failed to fetch artisans")
        setArtisans([])
      }
    } catch (error) {
      console.error("Error fetching artisans:", error)
      setArtisans([])
    }
  }

  // Redirect if not signed in or not an admin
  // Remove or comment out the second useEffect that redirects to sign-in
  // This avoids conflicting redirects
  /*
  useEffect(() => {
    if (!isLoading && (!isSignedIn || !isAdmin)) {
      router.push("/sign-in?redirect=/dashboard")
    }
  }, [isLoading, isSignedIn, isAdmin, router])
  */

  // Add the file upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files) as FileWithPreview[]

      // Create preview URLs for display
      newFiles.forEach((file) => {
        file.preview = URL.createObjectURL(file)
      })

      setUploadedFiles(newFiles)
    }
  }

  // Add a function to remove a file from the upload list
  const removeFile = (index: number) => {
    setUploadedFiles((prev) => {
      const newFiles = [...prev]
      // Revoke the object URL to avoid memory leaks
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!)
      }
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      uploadedFiles.forEach((file) => {
        if (file.preview) URL.revokeObjectURL(file.preview)
      })
    }
  }, [uploadedFiles])

  if (isLoading || !isSignedIn || !isAdmin) {
    return (
      <MainLayout>
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/order-requests/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        // Update the local state
        setOrders((prevOrders) =>
          prevOrders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)),
        )
      } else {
        console.error("Failed to update order status")
      }
    } catch (error) {
      console.error("Error updating order status:", error)
    }
  }

  const handleToggleFeatured = async (artId: string) => {
    try {
      const result = await toggleFeatured(artId)

      if (result.success) {
        // Update the local state
        setArtListings((prevListings) =>
          prevListings.map((art) => (art.id === artId ? { ...art, featured: !art.featured } : art)),
        )
      } else {
        console.error("Failed to toggle featured status:", result.message)
      }
    } catch (error) {
      console.error("Error toggling featured status:", error)
    }
  }

  const handleDeleteArt = async (artId: string) => {
    if (window.confirm("Are you sure you want to delete this art listing? This action cannot be undone.")) {
      try {
        const result = await deleteArtListing(artId)

        if (result.success) {
          // Remove from local state
          setArtListings((prevListings) => prevListings.filter((art) => art.id !== artId))
        } else {
          console.error("Failed to delete art listing:", result.message)
        }
      } catch (error) {
        console.error("Error deleting art listing:", error)
      }
    }
  }

  const handleDeleteBlogPost = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this blog post? This action cannot be undone.")) {
      try {
        const result = await deleteBlogPost(id)

        if (result.success) {
          // Remove from local state
          setBlogPosts((prevPosts) => prevPosts.filter((post) => post.id !== id))
        } else {
          console.error("Failed to delete blog post:", result.message)
        }
      } catch (error) {
        console.error("Error deleting blog post:", error)
      }
    }
  }

  const handleDeleteTeamMember = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this team member? This action cannot be undone.")) {
      try {
        const result = await deleteTeamMember(id)

        if (result.success) {
          // Remove from local state
          setTeamMembers((prevMembers) => prevMembers.filter((member) => member.id !== id))
        } else {
          console.error("Failed to delete team member:", result.message)
        }
      } catch (error) {
        console.error("Error deleting team member:", error)
      }
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      try {
        const response = await fetch(`/api/categories/${id}`, {
          method: "DELETE",
        })

        if (response.ok) {
          // Remove from local state
          setCategories((prevCategories) => prevCategories.filter((category) => category.id !== id))
        } else {
          console.error("Failed to delete category")
        }
      } catch (error) {
        console.error("Error deleting category:", error)
      }
    }
  }

  // Artisan management functions
  const handleApproveArtisan = async (id: string) => {
    try {
      const response = await fetch(`/api/artisans/${id}/approval`, {
        method: "POST",
      })
      if (!response.ok) {
        throw new Error("Failed to approve artisan")
      }
      // Refresh the artisans list
      fetchArtisans()
    } catch (error) {
      console.error("Error approving artisan:", error)
      alert("Failed to approve artisan")
    }
  }

  const handleRejectArtisan = async (id: string, reason: string) => {
    try {
      const response = await fetch(`/api/artisans/${id}/approval`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      })
      if (!response.ok) {
        throw new Error("Failed to reject artisan")
      }
      // Refresh the artisans list
      fetchArtisans()
    } catch (error) {
      console.error("Error rejecting artisan:", error)
      alert("Failed to reject artisan")
    }
  }

  const handleEditArt = (artId: string) => {
    setSelectedArtId(artId)
    setIsEditModalOpen(true)
  }

  const handleViewTeamMember = (teamMemberId: string) => {
    setSelectedTeamMemberId(teamMemberId)
    setIsTeamMemberModalOpen(true)
  }

  const handleEditSuccess = () => {
    // Refresh the art listings
    fetchArtListings()
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUploading(true)
    setMessage(null)

    try {
      const formData = new FormData(e.currentTarget)

      // Always clear and re-add images from the uploadedFiles state
      formData.delete("images")

      // Add each file to the form data
      uploadedFiles.forEach((file) => {
        formData.append("images", file)
      })

      const result = await createArtListing(formData)

      if (result.success) {
        setMessage({ type: "success", text: result.message })
        // Clear the form
        if (e.currentTarget) {
          e.currentTarget.reset()
        }
        setUploadedFiles([])
        // Switch to the art tab to show the new listing
        setActiveTab("art")
        fetchArtListings()
      } else {
        setMessage({ type: "error", text: result.message })
      }
    } catch (error) {
      console.error("Error uploading art:", error)
      setMessage({ type: "error", text: "An unexpected error occurred. Please try again." })
    } finally {
      setUploading(false)
    }
  }

  if (activeTab === "upload") {
    return (
      <MainLayout>
        <div className="dashboard-page">
          <div className="container">
            <h1 className="page-title">Admin Dashboard</h1>

            <div className="dashboard-tabs">
              <button
                className={`tab-button ${activeTab === ("orders" as ActiveTabType) ? "active" : ""}`}
                onClick={() => setActiveTab("orders")}
              >
                Order Requests
              </button>
              <button
                className={`tab-button ${activeTab === ("art" as ActiveTabType) ? "active" : ""}`}
                onClick={() => setActiveTab("art")}
              >
                Art Listings
              </button>
              <button
                className={`tab-button ${activeTab === ("upload" as ActiveTabType) ? "active" : ""}`}
                onClick={() => setActiveTab("upload")}
              >
                Upload New Art
              </button>
              <button
                className={`tab-button ${activeTab === ("blog" as ActiveTabType) ? "active" : ""}`}
                onClick={() => setActiveTab("blog")}
              >
                Blog Management
              </button>
              <button
                className={`tab-button ${activeTab === ("team" as ActiveTabType) ? "active" : ""}`}
                onClick={() => setActiveTab("team")}
              >
                Team Management
              </button>
            </div>

            <div className="dashboard-content">
              <div className="upload-tab">
                <h2>Upload New Art</h2>

                {/* Message display */}
                {message && (
                  <div className={`message ${message.type}`}>
                    <span>{message.type === "success" ? "✓ " : "⚠ "}</span>
                    <span style={{ flex: 1, whiteSpace: "pre-line" }}>{message.text}</span>
                    <button className="message-close" onClick={() => setMessage(null)}>×</button>
                  </div>
                )}

                <form className="upload-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="title">Art Title</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      required
                      onChange={() => setMessage(null)}
                      placeholder="Enter a descriptive title for your art piece"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      rows={5}
                      required
                      onChange={() => setMessage(null)}
                      placeholder="Describe your art piece, including inspiration, technique, and cultural significance..."
                    ></textarea>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="categoryId">Category</label>
                      <select
                        id="categoryId"
                        name="categoryId"
                        required
                        onChange={() => setMessage(null)}
                      >
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
                      <select
                        id="region"
                        name="region"
                        required
                        onChange={() => setMessage(null)}
                      >
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
                        required
                        onChange={() => setMessage(null)}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="size">Size</label>
                      <input
                        type="text"
                        id="size"
                        name="size"
                        placeholder='e.g., 12" x 6" x 3"'
                        required
                        onChange={() => setMessage(null)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="images">Upload Images</label>
                    <input
                      type="file"
                      id="images"
                      name="images"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                    />
                    <p className="help-text">
                      You can upload multiple images. First image will be the main display image.
                    </p>

                    {/* Preview uploaded images */}
                    {uploadedFiles.length > 0 && (
                      <div className="image-previews">
                        <h4>Selected Images:</h4>
                        <div className="preview-grid">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="preview-item">
                              <div className="preview-image">
                                <Image
                                  src={file.preview || "/placeholder.svg"}
                                  alt={`Preview ${index + 1}`}
                                  width={100}
                                  height={100}
                                />
                              </div>
                              <button type="button" className="remove-image" onClick={() => removeFile(index)}>
                                ✕
                              </button>
                              <p className="image-name">{file.name}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group checkbox-group">
                    <input type="checkbox" id="featured" name="featured" />
                    <label htmlFor="featured">Feature this art piece on the home page</label>
                  </div>

                  <button type="submit" className="button submit-button" disabled={uploading}>
                    {uploading ? "Uploading..." : "Upload Art Listing"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (activeTab === "blog") {
    return (
      <MainLayout>
        <div className="dashboard-page">
          <div className="container">
            <h1 className="page-title">Admin Dashboard</h1>

            <div className="dashboard-tabs">
              <button
                className={`tab-button ${activeTab === ("orders" as ActiveTabType) ? "active" : ""}`}
                onClick={() => setActiveTab("orders")}
              >
                Order Requests
              </button>
              <button
                className={`tab-button ${activeTab === ("art" as ActiveTabType) ? "active" : ""}`}
                onClick={() => setActiveTab("art")}
              >
                Art Listings
              </button>
              <button
                className={`tab-button ${activeTab === ("upload" as ActiveTabType) ? "active" : ""}`}
                onClick={() => setActiveTab("upload")}
              >
                Upload New Art
              </button>
              <button
                className={`tab-button ${activeTab === ("blog" as ActiveTabType) ? "active" : ""}`}
                onClick={() => setActiveTab("blog")}
              >
                Blog Management
              </button>
              <button
                className={`tab-button ${activeTab === ("team" as ActiveTabType) ? "active" : ""}`}
                onClick={() => setActiveTab("team")}
              >
                Team Management
              </button>
            </div>

            <div className="dashboard-content">
              <div className="blog-tab">
                <h2>Blog Posts</h2>

                <div className="blog-actions">
                  <button className="button" onClick={() => router.push("/dashboard/blog/new")}>
                    Create New Blog Post
                  </button>
                </div>

                <div className="blog-table-container">
                  <table className="blog-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Excerpt</th>
                        <th>Category</th>
                        <th>Author</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Featured</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blogPosts.length > 0 ? (
                        blogPosts.map((post) => (
                          <tr key={post.id}>
                            <td className="blog-title">{post.title}</td>
                            <td className="blog-excerpt">{post.excerpt}</td>
                            <td className="blog-category">{post.category}</td>
                            <td>{post.author}</td>
                            <td className="blog-date">{post.date}</td>
                            <td>
                              <span className={`status-badge ${post.status}`}>
                                {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                              </span>
                            </td>
                            <td>
                              <span className={`featured-badge ${post.featured ? "yes" : "no"}`}>
                                {post.featured ? "Yes" : "No"}
                              </span>
                            </td>
                            <td>
                              <div className="art-actions">
                                <button
                                  className="action-button edit"
                                  onClick={() => router.push(`/dashboard/blog/edit/${post.id}`)}
                                >
                                  Edit
                                </button>
                                <button className="action-button delete" onClick={() => handleDeleteBlogPost(post.id)}>
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} style={{ textAlign: "center", padding: "20px" }}>
                            No blog posts found. Create your first blog post!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Replace the team tab rendering in the return statement with this:
  // Find the section that starts with {activeTab === "team" && ( and replace it with:

  return (
    <MainLayout>
      <div className="dashboard-page">
        <div className="container">
          <h1 className="page-title">Admin Dashboard</h1>

            <div className="dashboard-tabs">
              <button
                className={`tab-button ${activeTab === "orders" ? "active" : ""}`}
                onClick={() => setActiveTab("orders")}
              >
                Order Requests
              </button>
              <button className={`tab-button ${activeTab === "art" ? "active" : ""}`} onClick={() => setActiveTab("art")}>
                Art Listings
              </button>
              <button
                className={`tab-button ${activeTab === ("upload" as ActiveTabType) ? "active" : ""}`}
                onClick={() => setActiveTab("upload")}
              >
                Upload New Art
              </button>
              <button
                className={`tab-button ${activeTab === ("blog" as ActiveTabType) ? "active" : ""}`}
                onClick={() => setActiveTab("blog")}
              >
                Blog Management
              </button>
              <button
                className={`tab-button ${activeTab === ("team" as ActiveTabType) ? "active" : ""}`}
                onClick={() => setActiveTab("team")}
              >
                Team Management
              </button>
              <button
                className={`tab-button ${activeTab === ("categories" as ActiveTabType) ? "active" : ""}`}
                onClick={() => setActiveTab("categories")}
              >
                Categories
              </button>
              <button
                className={`tab-button ${activeTab === ("artisans" as ActiveTabType) ? "active" : ""}`}
                onClick={() => setActiveTab("artisans")}
              >
                Artisans
              </button>
            </div>

          <div className="dashboard-content">
            {activeTab === "categories" && (
              <div className="categories-tab">
                <h2>Categories</h2>

                <div className="categories-actions">
                  <button className="button" onClick={() => router.push("/dashboard/categories/new")}>
                    Create New Category
                  </button>
                </div>

                <div className="categories-table-container">
                  <table className="categories-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Slug</th>
                        <th>Description</th>
                        <th>Order</th>
                        <th>Active</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.length > 0 ? (
                        categories.map((category) => (
                          <tr key={category.id}>
                            <td>{category.name}</td>
                            <td>{category.slug}</td>
                            <td>{category.description}</td>
                            <td>{category.order}</td>
                            <td>
                              <span className={`status-badge ${category.isActive ? "active" : "inactive"}`}>
                                {category.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td>
                              <div className="category-actions">
                                <button
                                  className="action-button edit"
                                  onClick={() => router.push(`/dashboard/categories/edit/${category.id}`)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="action-button delete"
                                  onClick={() => handleDeleteCategory(category.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "20px" }}>
                            No categories found. Create your first category!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="orders-tab">
                <h2>Order Requests</h2>

                <div className="orders-table-container">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Art Piece</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td>{new Date(order.date).toLocaleDateString()}</td>
                          <td>
                            <div className="customer-info">
                              <span className="customer-name">{order.name}</span>
                              <span className="customer-email">{order.email}</span>
                            </div>
                          </td>
                          <td>{order.artTitle}</td>
                          <td>{order.location}</td>
                          <td>
                            <span className={`status-badge ${order.status}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </td>
                          <td>
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className="status-select"
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "art" && (
              <div className="art-tab">
                <h2>Art Listings</h2>

                <div className="art-table-container">
                  <table className="art-table">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Region</th>
                        <th>Price</th>
                        <th>Featured</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {artListings.map((art) => (
                        <tr key={art.id}>
                          <td>
                            <div className="art-thumbnail">
                              <Image
                                src={art.image || "/placeholder.svg"}
                                alt={art.title}
                                width={50}
                                height={50}
                                loader={cloudinaryLoader}
                              />
                            </div>
                          </td>
                          <td>{art.title}</td>
                          <td>{art.category.name}</td>
                          <td>{art.region}</td>
                          <td>${art.price.toFixed(2)}</td>
                          <td>
                            <span className={`featured-badge ${art.featured ? "yes" : "no"}`}>
                              {art.featured ? "Yes" : "No"}
                            </span>
                          </td>
                          <td>
                            <div className="art-actions">
                              <button className="action-button edit" onClick={() => handleEditArt(art.id)}>
                                Edit
                              </button>
                              <button className="action-button feature" onClick={() => handleToggleFeatured(art.id)}>
                                {art.featured ? "Unfeature" : "Feature"}
                              </button>
                              <button className="action-button delete" onClick={() => handleDeleteArt(art.id)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeTab === "team" && (
        <div className="team-tab">
          <h2>Team Members</h2>

          <div className="team-actions" style={{ marginBottom: "20px" }}>
            <button
              className="button"
              onClick={() => {
                console.log("Navigating to new team member page")
                // The correct path is /dashboard/team-members/new, not /dashboard/team/new
                window.location.href = "/dashboard/team-members/new"
              }}
            >
              Add New Team Member
            </button>
          </div>

          <div className="team-table-container">
            <table className="art-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Title</th>
                  <th>Display Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.length > 0 ? (
                  teamMembers.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div className="art-thumbnail">
                          <Image
                            src={member.image || "/placeholder.svg"}
                            alt={member.name}
                            width={50}
                            height={50}
                            loader={cloudinaryLoader}
                          />
                        </div>
                      </td>
                      <td>{member.name}</td>
                      <td>{member.title}</td>
                      <td>{member.order}</td>
                      <td>
                        <div className="art-actions">
                          <button className="action-button edit" onClick={() => handleViewTeamMember(member.id)}>
                            View
                          </button>
                          <button
                            className="action-button feature"
                            onClick={() => router.push(`/dashboard/team/edit/${member.id}`)}
                          >
                            Edit
                          </button>
                          <button className="action-button delete" onClick={() => handleDeleteTeamMember(member.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>
                      No team members found. Add your first team member!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Artisans Tab */}
      {activeTab === "artisans" && (
        <div className="artisans-tab">
          <h2>Artisan Registrations</h2>

          <div className="artisan-filter-tabs" style={{ marginBottom: "20px" }}>
            <button
              className={`filter-btn ${artisanFilter === "PENDING" ? "active" : ""}`}
              onClick={() => {
                setArtisanFilter("PENDING")
                fetchArtisans("PENDING")
              }}
            >
              Pending ({artisans.filter((a) => a.status === "PENDING").length})
            </button>
            <button
              className={`filter-btn ${artisanFilter === "APPROVED" ? "active" : ""}`}
              onClick={() => {
                setArtisanFilter("APPROVED")
                fetchArtisans("APPROVED")
              }}
            >
              Approved
            </button>
            <button
              className={`filter-btn ${artisanFilter === "REJECTED" ? "active" : ""}`}
              onClick={() => {
                setArtisanFilter("REJECTED")
                fetchArtisans("REJECTED")
              }}
            >
              Rejected
            </button>
          </div>

          <div className="artisans-grid">
            {artisans.length > 0 ? (
              artisans.map((artisan) => (
                <div key={artisan.id} className="artisan-card">
                  <div className="artisan-card-header">
                    <div className="artisan-avatar">
                      {artisan.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="artisan-info">
                      <h3>{artisan.fullName}</h3>
                      <span className={`status-badge ${artisan.status.toLowerCase()}`}>
                        {artisan.status}
                      </span>
                    </div>
                  </div>

                  <div className="artisan-details">
                    <div className="detail-row">
                      <span className="label">Email:</span>
                      <span className="value">{artisan.email}</span>
                    </div>
                    {artisan.phone && (
                      <div className="detail-row">
                        <span className="label">Phone:</span>
                        <span className="value">{artisan.phone}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="label">Specialty:</span>
                      <span className="value">{artisan.specialty}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Region:</span>
                      <span className="value">{artisan.region}</span>
                    </div>
                    {artisan.location && (
                      <div className="detail-row">
                        <span className="label">Location:</span>
                        <span className="value">{artisan.location}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="label">Experience:</span>
                      <span className="value">
                        {artisan.yearsExperience ? `${artisan.yearsExperience} years` : "Not specified"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Applied:</span>
                      <span className="value">
                        {new Date(artisan.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Products:</span>
                      <span className="value">{artisan._count.artListings}</span>
                    </div>
                    {artisan.approvedAt && (
                      <div className="detail-row">
                        <span className="label">Approved:</span>
                        <span className="value">
                          {new Date(artisan.approvedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {artisan.shopBio && (
                    <div className="artisan-bio">
                      <h4>About:</h4>
                      <p>{artisan.shopBio}</p>
                    </div>
                  )}

                  {artisan.status === "PENDING" && (
                    <div className="artisan-actions">
                      <button
                        className="button approve-button"
                        onClick={() => handleApproveArtisan(artisan.id)}
                      >
                        Approve
                      </button>
                      <button
                        className="button reject-button"
                        onClick={() => {
                          const reason = prompt("Enter rejection reason (optional):")
                          if (reason !== null) {
                            handleRejectArtisan(artisan.id, reason || "Your registration was not approved.")
                          }
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {artisan.status === "REJECTED" && artisan.rejectionReason && (
                    <div className="rejection-reason">
                      <h4>Rejection Reason:</h4>
                      <p>{artisan.rejectionReason}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px" }}>
                <p>No {artisanFilter.toLowerCase()} artisan registrations</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Art Modal */}
      <EditArtModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        artId={selectedArtId}
        onSuccess={handleEditSuccess}
      />

      {/* Team Member Modal */}
      <TeamMemberModal
        isOpen={isTeamMemberModalOpen}
        onClose={() => setIsTeamMemberModalOpen(false)}
        teamMemberId={selectedTeamMemberId}
      />
    </MainLayout>
  )
}
