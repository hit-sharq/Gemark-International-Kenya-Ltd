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

import { createArtListing, toggleFeatured, deleteArtListing } from "../actions/art-actions"
import { deleteBlogPost } from "../actions/blog-actions"
import { deleteTeamMember } from "../actions/team-actions"
import { updateExchangeRate } from "../actions/admin-actions"
import { cloudinaryLoader } from "@/lib/cloudinary"

type ActiveTabType = "orders" | "art" | "upload" | "blog" | "team" | "categories" | "exchange-rate"

interface ArtListing {
  id: string
  title: string
  category: { id: string; name: string; slug: string }
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

interface FileWithPreview extends File {
  preview?: string
}

export default function Dashboard() {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tabParam = searchParams.get("tab") as ActiveTabType | null
  const [activeTab, setActiveTab] = useState<ActiveTabType>(tabParam || "orders")
  const [orders, setOrders] = useState<Order[]>([])
  const [artListings, setArtListings] = useState<ArtListing[]>([])
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([])
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedArtId, setSelectedArtId] = useState("")
  const [isTeamMemberModalOpen, setIsTeamMemberModalOpen] = useState(false)
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState("")
  const [exchangeRate, setExchangeRate] = useState<{ rate: number; source: string; lastUpdated: string | null }>({
    rate: 130.00,
    source: 'default',
    lastUpdated: null,
  })
  const [exchangeRateLoading, setExchangeRateLoading] = useState(false)

  useEffect(() => {
    if (activeTab && window.location.pathname === "/dashboard") {
      router.push(`/dashboard?tab=${activeTab}`, { scroll: false })
    }
  }, [activeTab, router])

  useEffect(() => {
    async function checkAdminStatus() {
      if (isLoaded && isSignedIn) {
        try {
          const response = await fetch("/api/check-admin")
          const data = await response.json()
          setIsAdmin(data.isAdmin)
          if (!data.isAdmin) {
            router.push("/user-dashboard")
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

  useEffect(() => {
    if (!isLoading && isAdmin) {
      if (activeTab === "orders") fetchOrders()
      else if (activeTab === "art") fetchArtListings()
      else if (activeTab === "blog") fetchBlogPosts()
      else if (activeTab === "team") fetchTeamMembers()
      else if (activeTab === "categories" || activeTab === "upload") fetchCategories()
      else if (activeTab === "exchange-rate") fetchExchangeRate()
    }
  }, [activeTab, isAdmin, isLoading])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/order-requests")
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      } else setOrders([])
    } catch (error) {
      console.error("Error fetching orders:", error)
      setOrders([])
    }
  }

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
      } else setArtListings([])
    } catch (error) {
      console.error("Error fetching art listings:", error)
      setArtListings([])
    }
  }

  const fetchBlogPosts = async () => {
    try {
      const response = await fetch("/api/blog-posts")
      if (response.ok) {
        const data = await response.json()
        setBlogPosts(
          data.map((post: any) => ({
            ...post,
            date: new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
          }))
        )
      } else setBlogPosts([])
    } catch (error) {
      console.error("Error fetching blog posts:", error)
      setBlogPosts([])
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch("/api/team-members")
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data)
      } else setTeamMembers([])
    } catch (error) {
      console.error("Error fetching team members:", error)
      setTeamMembers([])
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      } else setCategories([])
    } catch (error) {
      console.error("Error fetching categories:", error)
      setCategories([])
    }
  }

  const fetchExchangeRate = async () => {
    setExchangeRateLoading(true)
    try {
      const response = await fetch("/api/settings/exchange-rate")
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setExchangeRate({
            rate: data.data.rate || 130.00,
            source: data.data.source || 'default',
            lastUpdated: data.data.lastUpdated ? new Date(data.data.lastUpdated).toLocaleString() : null,
          })
        }
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error)
    } finally {
      setExchangeRateLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files) as FileWithPreview[]
      newFiles.forEach((file) => {
        file.preview = URL.createObjectURL(file)
      })
      setUploadedFiles(newFiles)
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => {
      const newFiles = [...prev]
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!)
      }
      newFiles.splice(index, 1)
      return newFiles
    })
  }

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (response.ok) {
        setOrders((prevOrders) =>
          prevOrders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
        )
      }
    } catch (error) {
      console.error("Error updating order status:", error)
    }
  }

  const handleToggleFeatured = async (artId: string) => {
    try {
      const result = await toggleFeatured(artId)
      if (result.success) {
        setArtListings((prevListings) =>
          prevListings.map((art) => (art.id === artId ? { ...art, featured: !art.featured } : art))
        )
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
          setArtListings((prevListings) => prevListings.filter((art) => art.id !== artId))
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
          setBlogPosts((prevPosts) => prevPosts.filter((post) => post.id !== id))
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
          setTeamMembers((prevMembers) => prevMembers.filter((member) => member.id !== id))
        }
      } catch (error) {
        console.error("Error deleting team member:", error)
      }
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      try {
        const response = await fetch(`/api/categories/${id}`, { method: "DELETE" })
        if (response.ok) {
          setCategories((prevCategories) => prevCategories.filter((category) => category.id !== id))
        }
      } catch (error) {
        console.error("Error deleting category:", error)
      }
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
    fetchArtListings()
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUploading(true)
    setMessage(null)

    try {
      const formData = new FormData(e.currentTarget)
      formData.delete("images")
      uploadedFiles.forEach((file) => {
        formData.append("images", file)
      })

      const result = await createArtListing(formData)

      if (result.success) {
        setMessage({ type: "success", text: result.message })
        if (e.currentTarget) e.currentTarget.reset()
        setUploadedFiles([])
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

  return (
    <MainLayout>
      <div className="dashboard-page">
        <div className="container">
          <h1 className="page-title">Admin Dashboard</h1>

          <div className="dashboard-tabs">
            <button className={`tab-button ${activeTab === "orders" ? "active" : ""}`} onClick={() => setActiveTab("orders")}>
              Order Requests
            </button>
            <button className={`tab-button ${activeTab === "art" ? "active" : ""}`} onClick={() => setActiveTab("art")}>
              Art Listings
            </button>
            <button className={`tab-button ${activeTab === "upload" ? "active" : ""}`} onClick={() => setActiveTab("upload")}>
              Upload New Art
            </button>
            <button className={`tab-button ${activeTab === "blog" ? "active" : ""}`} onClick={() => setActiveTab("blog")}>
              Blog Management
            </button>
            <button className={`tab-button ${activeTab === "team" ? "active" : ""}`} onClick={() => setActiveTab("team")}>
              Team Management
            </button>
            <button className={`tab-button ${activeTab === "categories" ? "active" : ""}`} onClick={() => setActiveTab("categories")}>
              Categories
            </button>
            <button className={`tab-button ${activeTab === "exchange-rate" ? "active" : ""}`} onClick={() => setActiveTab("exchange-rate")}>
              Exchange Rate
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
                                <button className="action-button edit" onClick={() => router.push(`/dashboard/categories/edit/${category.id}`)}>
                                  Edit
                                </button>
                                <button className="action-button delete" onClick={() => handleDeleteCategory(category.id)}>
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
                            <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)} className="status-select">
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
                              <Image src={art.image || "/placeholder.svg"} alt={art.title} width={50} height={50} loader={cloudinaryLoader} />
                            </div>
                          </td>
                          <td>{art.title}</td>
                          <td>{art.category.name}</td>
                          <td>{art.region}</td>
                          <td>${art.price.toFixed(2)}</td>
                          <td>
                            <span className={`featured-badge ${art.featured ? "yes" : "no"}`}>{art.featured ? "Yes" : "No"}</span>
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

            {activeTab === "upload" && (
              <div className="upload-tab">
                <h2>Upload New Art</h2>
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
                    <input type="text" id="title" name="title" required placeholder="Enter a descriptive title for your art piece" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea id="description" name="description" rows={5} required placeholder="Describe your art piece..."></textarea>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="categoryId">Category</label>
                      <select id="categoryId" name="categoryId" required>
                        <option value="">Select Category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="region">Region</label>
                      <select id="region" name="region" required>
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
                      <input type="number" id="price" name="price" min="0" step="0.01" required placeholder="0.00" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="size">Size</label>
                      <input type="text" id="size" name="size" placeholder='e.g., 12" x 6" x 3"' required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="images">Upload Images</label>
                    <input type="file" id="images" name="images" multiple accept="image/*" onChange={handleFileChange} ref={fileInputRef} />
                    <p className="help-text">You can upload multiple images. First image will be the main display image.</p>
                    {uploadedFiles.length > 0 && (
                      <div className="image-previews">
                        <h4>Selected Images:</h4>
                        <div className="preview-grid">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="preview-item">
                              <div className="preview-image">
                                <Image src={file.preview || "/placeholder.svg"} alt={`Preview ${index + 1}`} width={100} height={100} />
                              </div>
                              <button type="button" className="remove-image" onClick={() => removeFile(index)}>✕</button>
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
            )}

            {activeTab === "blog" && (
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
                              <span className={`featured-badge ${post.featured ? "yes" : "no"}`}>{post.featured ? "Yes" : "No"}</span>
                            </td>
                            <td>
                              <div className="art-actions">
                                <button className="action-button edit" onClick={() => router.push(`/dashboard/blog/edit/${post.id}`)}>
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
            )}

            {activeTab === "team" && (
              <div className="team-tab">
                <h2>Team Members</h2>
                <div className="team-actions" style={{ marginBottom: "20px" }}>
                  <button className="button" onClick={() => (window.location.href = "/dashboard/team-members/new")}>
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
                                <Image src={member.image || "/placeholder.svg"} alt={member.name} width={50} height={50} loader={cloudinaryLoader} />
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
                                <button className="action-button feature" onClick={() => router.push(`/dashboard/team/edit/${member.id}`)}>
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
          </div>

          {/* Exchange Rate Management Tab */}
          {activeTab === "exchange-rate" && (
            <div className="exchange-rate-tab">
              <h2>Exchange Rate Management</h2>
              <p className="tab-description">
                Update the USD to KES exchange rate used for M-Pesa payments. 
                This rate is applied automatically to all checkout calculations.
              </p>
              
              <div className="exchange-rate-card">
                <div className="current-rate-display">
                  <h3>Current Exchange Rate</h3>
                  <div className="rate-value">
                    <span className="rate-currency">1 USD = </span>
                    <span className="rate-number">{exchangeRate.rate.toFixed(2)} KES</span>
                  </div>
                  {exchangeRate.lastUpdated && (
                    <p className="last-updated">
                      Last updated: {exchangeRate.lastUpdated}
                    </p>
                  )}
                  <p className="rate-source">
                    Source: <span className="source-badge">{exchangeRate.source}</span>
                  </p>
                </div>

                <div className="update-rate-form">
                  <h4>Update Exchange Rate</h4>
                  {message && (
                    <div className={`message ${message.type}`}>
                      <span>{message.type === "success" ? "✓ " : "⚠ "}</span>
                      <span style={{ flex: 1, whiteSpace: "pre-line" }}>{message.text}</span>
                      <button className="message-close" onClick={() => setMessage(null)}>×</button>
                    </div>
                  )}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault()
                      const formData = new FormData(e.currentTarget)
                      const newRate = parseFloat(formData.get('rate') as string)
                      const source = formData.get('source') as string

                      if (newRate && newRate > 0) {
                        setExchangeRateLoading(true)
                        setMessage(null)
                        try {
                          const result = await updateExchangeRate(newRate, source)
                          if (result.success) {
                            setExchangeRate({
                              rate: newRate,
                              source: source,
                              lastUpdated: new Date().toLocaleString(),
                            })
                            setMessage({ 
                              type: "success", 
                              text: `✓ Exchange rate updated successfully! 1 USD = ${newRate.toFixed(2)} KES` 
                            })
                          } else {
                            setMessage({ 
                              type: "error", 
                              text: `✗ Failed to update: ${result.message || "Unknown error occurred. Please try again."}` 
                            })
                          }
                        } catch (error) {
                          console.error("Error updating exchange rate:", error)
                          setMessage({ 
                            type: "error", 
                            text: "✗ Connection error. Please check your internet connection and try again." 
                          })
                        } finally {
                          setExchangeRateLoading(false)
                        }
                      } else {
                        setMessage({ 
                          type: "error", 
                          text: "✗ Invalid rate. Please enter a number greater than 0 (e.g., 130.00)" 
                        })
                      }
                    }}
                  >
                    <div className="form-group">
                      <label htmlFor="rate">Exchange Rate (USD to KES)</label>
                      <input
                        type="number"
                        id="rate"
                        name="rate"
                        step="0.01"
                        min="0.01"
                        defaultValue={exchangeRate.rate}
                        required
                        placeholder="e.g., 130.00"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="source">Rate Source</label>
                      <select id="source" name="source" defaultValue={exchangeRate.source}>
                        <option value="manual">Manual Entry</option>
                        <option value="bank">Bank Rate</option>
                        <option value="central_bank">Central Bank Rate</option>
                        <option value="api">API Rate</option>
                      </select>
                    </div>
                    <button type="submit" className="button" disabled={exchangeRateLoading}>
                      {exchangeRateLoading ? "Updating..." : "Update Exchange Rate"}
                    </button>
                  </form>
                </div>
              </div>

              <div className="exchange-rate-info">
                <h4>Important Notes</h4>
                <ul>
                  <li>The exchange rate affects the KES amount displayed during M-Pesa checkout</li>
                  <li>Changes take effect immediately after updating</li>
                  <li>For accuracy, update rates daily or when significant changes occur</li>
                  <li>Consider using Central Bank rates for official transactions</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      <EditArtModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} artId={selectedArtId} onSuccess={handleEditSuccess} />
      <TeamMemberModal isOpen={isTeamMemberModalOpen} onClose={() => setIsTeamMemberModalOpen(false)} teamMemberId={selectedTeamMemberId} />
    </MainLayout>
  )
}

