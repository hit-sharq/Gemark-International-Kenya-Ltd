"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import "./shop.css"

interface ShopData {
  shopName: string | null
  shopSlug: string | null
  shopBio: string | null
  shopLogo: string | null
  shopBanner: string | null
  website: string | null
  instagram: string | null
  facebook: string | null
  whatsapp: string | null
  status: string
  fullName: string
}

export default function ShopManagementPage() {
  const router = useRouter()
  const [shopData, setShopData] = useState<ShopData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    shopName: "",
    shopBio: "",
    shopLogo: "",
    shopBanner: "",
    website: "",
    instagram: "",
    facebook: "",
    whatsapp: "",
  })

  useEffect(() => {
    fetchShopData()
  }, [])

  const fetchShopData = async () => {
    try {
      const response = await fetch("/api/artisans/me/shop")
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/artisan/login")
          return
        }
        if (response.status === 403) {
          setError("Your account is pending approval. You cannot edit your shop yet.")
          setIsLoading(false)
          return
        }
        if (response.status === 404) {
          setError("Artisan profile not found")
          setIsLoading(false)
          return
        }
        throw new Error("Failed to fetch shop data")
      }
      const data = await response.json()
      setShopData(data)
      setFormData({
        shopName: data.shopName || "",
        shopBio: data.shopBio || "",
        shopLogo: data.shopLogo || "",
        shopBanner: data.shopBanner || "",
        website: data.website || "",
        instagram: data.instagram || "",
        facebook: data.facebook || "",
        whatsapp: data.whatsapp || "",
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/artisans/me/shop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update shop")
      }

      setSuccess("Shop updated successfully!")
      setShopData((prev) => prev ? { ...prev, ...formData } : null)

      // Refresh data
      fetchShopData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="shop-management">
        <aside className="dashboard-sidebar">
          <div className="sidebar-header">
            <h2>Artisan Dashboard</h2>
          </div>
          <nav className="sidebar-nav">
            <Link href="/artisan/dashboard" className="nav-item">
              <span className="nav-icon">📊</span>
              Overview
            </Link>
            <Link href="/artisan/dashboard/shop" className="nav-item active">
              <span className="nav-icon">🏪</span>
              My Shop
            </Link>
            <Link href="/artisan/dashboard/products" className="nav-item">
              <span className="nav-icon">🎨</span>
              My Products
            </Link>
            <Link href="/artisan/dashboard/orders" className="nav-item">
              <span className="nav-icon">📦</span>
              Orders
            </Link>
            <Link href="/artisan/dashboard/settings" className="nav-item">
              <span className="nav-icon">⚙️</span>
              Settings
            </Link>
          </nav>
          <div className="sidebar-footer">
            <Link href="/" className="nav-item">
              <span className="nav-icon">🏠</span>
              Back to Site
            </Link>
          </div>
        </aside>

        <main className="dashboard-main">
          <div className="loading-spinner"></div>
          <p style={{ textAlign: "center", color: "#6c757d" }}>Loading shop data...</p>
        </main>
      </div>
    )
  }

  if (error && !shopData) {
    return (
      <div className="shop-management">
        <aside className="dashboard-sidebar">
          <div className="sidebar-header">
            <h2>Artisan Dashboard</h2>
          </div>
          <nav className="sidebar-nav">
            <Link href="/artisan/dashboard" className="nav-item">
              <span className="nav-icon">📊</span>
              Overview
            </Link>
            <Link href="/artisan/dashboard/shop" className="nav-item active">
              <span className="nav-icon">🏪</span>
              My Shop
            </Link>
            <Link href="/artisan/dashboard/products" className="nav-item">
              <span className="nav-icon">🎨</span>
              My Products
            </Link>
            <Link href="/artisan/dashboard/orders" className="nav-item">
              <span className="nav-icon">📦</span>
              Orders
            </Link>
            <Link href="/artisan/dashboard/settings" className="nav-item">
              <span className="nav-icon">⚙️</span>
              Settings
            </Link>
          </nav>
          <div className="sidebar-footer">
            <Link href="/" className="nav-item">
              <span className="nav-icon">🏠</span>
              Back to Site
            </Link>
          </div>
        </aside>

        <main className="dashboard-main">
          <div className="dashboard-header">
            <h1>Shop Management</h1>
          </div>
          <div className="shop-not-approved">
            <div className="icon">⏳</div>
            <h2>Pending Approval</h2>
            <p>{error}</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="shop-management">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2>Artisan Dashboard</h2>
        </div>
        <nav className="sidebar-nav">
          <Link href="/artisan/dashboard" className="nav-item">
            <span className="nav-icon">📊</span>
            Overview
          </Link>
          <Link href="/artisan/dashboard/shop" className="nav-item active">
            <span className="nav-icon">🏪</span>
            My Shop
          </Link>
          <Link href="/artisan/dashboard/products" className="nav-item">
            <span className="nav-icon">🎨</span>
            My Products
          </Link>
          <Link href="/artisan/dashboard/orders" className="nav-item">
            <span className="nav-icon">📦</span>
            Orders
          </Link>
          <Link href="/artisan/dashboard/settings" className="nav-item">
            <span className="nav-icon">⚙️</span>
            Settings
          </Link>
        </nav>
        <div className="sidebar-footer">
          <Link href="/" className="nav-item">
            <span className="nav-icon">🏠</span>
            Back to Site
          </Link>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>Shop Management</h1>
          <p className="header-subtitle">
            Customize your shop's appearance and information
          </p>
        </header>

        <div className="shop-form-container">
          {success && (
            <div className="success-message">
              <span>✅</span>
              {success}
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="form-section">
              <h2 className="section-title">Basic Information</h2>

              <div className="form-group">
                <label className="form-label" htmlFor="shopName">
                  Shop Name *
                </label>
                <input
                  type="text"
                  id="shopName"
                  name="shopName"
                  className="form-input"
                  value={formData.shopName}
                  onChange={handleChange}
                  placeholder="Enter your shop name"
                  required
                />
                <p className="form-hint">
                  This will be displayed on your public shop page
                </p>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="shopBio">
                  Shop Bio *
                </label>
                <textarea
                  id="shopBio"
                  name="shopBio"
                  className="form-textarea"
                  value={formData.shopBio}
                  onChange={handleChange}
                  placeholder="Tell customers about your shop, your story, and what makes your products special..."
                  required
                />
                <p className="form-hint">
                  Maximum 500 characters. This appears on your shop page.
                </p>
              </div>
            </div>

            {/* Shop Images */}
            <div className="form-section">
              <h2 className="section-title">Shop Images</h2>

              <div className="form-group">
                <label className="form-label">Shop Logo</label>
                <div className="logo-preview-container">
                  {formData.shopLogo ? (
                    <Image
                      src={formData.shopLogo}
                      alt="Shop Logo"
                      width={100}
                      height={100}
                      className="logo-preview"
                    />
                  ) : (
                    <div className="logo-preview" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>
                      🏪
                    </div>
                  )}
                  <button type="button" className="upload-btn">
                    Upload Logo
                  </button>
                </div>
                <p className="form-hint">
                  Recommended: 400x400px square image. PNG or JPG.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Shop Banner</label>
                {formData.shopBanner ? (
                  <div className="banner-preview-container">
                    <Image
                      src={formData.shopBanner}
                      alt="Shop Banner"
                      width={800}
                      height={200}
                      className="banner-preview"
                    />
                  </div>
                ) : (
                  <div
                    className="banner-preview"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "white",
                      fontSize: "1.5rem",
                    }}
                  >
                    🎨 Upload Your Banner
                  </div>
                )}
                <button type="button" className="upload-btn" style={{ marginTop: "12px" }}>
                  Upload Banner
                </button>
                <p className="form-hint">
                  Recommended: 1200x400px. This appears at the top of your shop page.
                </p>
              </div>
            </div>

            {/* Social Links */}
            <div className="form-section">
              <h2 className="section-title">Social Links</h2>
              <p className="form-hint" style={{ marginBottom: "20px" }}>
                Connect your social media accounts to help customers find you
              </p>

              <div className="social-links-grid">
                <div className="social-input-group">
                  <span className="social-icon">🌐</span>
                  <input
                    type="url"
                    name="website"
                    className="social-input"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="Your website URL"
                  />
                </div>

                <div className="social-input-group">
                  <span className="social-icon">📷</span>
                  <input
                    type="text"
                    name="instagram"
                    className="social-input"
                    value={formData.instagram}
                    onChange={handleChange}
                    placeholder="Instagram username"
                  />
                </div>

                <div className="social-input-group">
                  <span className="social-icon">📘</span>
                  <input
                    type="text"
                    name="facebook"
                    className="social-input"
                    value={formData.facebook}
                    onChange={handleChange}
                    placeholder="Facebook page URL or username"
                  />
                </div>

                <div className="social-input-group">
                  <span className="social-icon">💬</span>
                  <input
                    type="text"
                    name="whatsapp"
                    className="social-input"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    placeholder="WhatsApp number (e.g., +254712345678)"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="preview-section">
              <h3 className="preview-title">Shop Preview</h3>
              {formData.shopBanner && (
                <Image
                  src={formData.shopBanner}
                  alt="Banner Preview"
                  width={800}
                  height={150}
                  className="preview-banner"
                />
              )}
              <div className="preview-header">
                {formData.shopLogo ? (
                  <Image
                    src={formData.shopLogo}
                    alt="Logo Preview"
                    width={60}
                    height={60}
                    className="preview-logo"
                  />
                ) : (
                  <div className="preview-logo" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
                    🏪
                  </div>
                )}
                <div className="preview-info">
                  <h3>{formData.shopName || "Your Shop Name"}</h3>
                  <p>{formData.shopBio || "Your shop bio will appear here..."}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="form-actions">
              <button type="button" className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

