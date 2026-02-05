"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import "./settings.css"

interface ArtisanSettings {
  id: string
  email: string
  fullName: string
  phone: string | null
  specialty: string
  region: string
  location: string | null
  yearsExperience: number | null
  status: string
  createdAt: string
}

const SPECIALTIES = [
  "Beadwork",
  "Woodcarving",
  "Textiles",
  "Jewelry",
  "Paintings",
  "Ceramics",
  "Pottery",
  "Leatherwork",
  "Metalwork",
  "Basket Weaving",
  "Sculpture",
  "Other",
]

const REGIONS = [
  "Central Kenya",
  "Coastal Region",
  "Eastern Kenya",
  "Nairobi",
  "North Eastern Kenya",
  "Nyanza",
  "Rift Valley",
  "Western Kenya",
]

export default function SettingsManagementPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<ArtisanSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    specialty: "",
    region: "",
    location: "",
    yearsExperience: "",
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/artisans/me/settings")
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/artisan/login")
          return
        }
        throw new Error("Failed to fetch settings")
      }
      const data = await response.json()
      setSettings(data)
      setFormData({
        fullName: data.fullName || "",
        phone: data.phone || "",
        specialty: data.specialty || "",
        region: data.region || "",
        location: data.location || "",
        yearsExperience: data.yearsExperience?.toString() || "",
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
      const response = await fetch("/api/artisans/me/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update settings")
      }

      setSuccess("Settings updated successfully!")
      fetchSettings()

      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="settings-management">
        <aside className="dashboard-sidebar">
          <div className="sidebar-header">
            <h2>Artisan Dashboard</h2>
          </div>
          <nav className="sidebar-nav">
            <Link href="/artisan/dashboard" className="nav-item">
              <span className="nav-icon">📊</span>
              Overview
            </Link>
            <Link href="/artisan/dashboard/shop" className="nav-item">
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
            <Link href="/artisan/dashboard/settings" className="nav-item active">
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
          <p style={{ textAlign: "center", color: "#6c757d" }}>Loading settings...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="settings-management">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2>Artisan Dashboard</h2>
        </div>
        <nav className="sidebar-nav">
          <Link href="/artisan/dashboard" className="nav-item">
            <span className="nav-icon">📊</span>
            Overview
          </Link>
          <Link href="/artisan/dashboard/shop" className="nav-item">
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
          <Link href="/artisan/dashboard/settings" className="nav-item active">
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
          <h1>Settings</h1>
          <p className="header-subtitle">
            Manage your profile and account settings
          </p>
        </header>

        <div className="settings-container">
          {success && (
            <div className="success-message">
              <span>✅</span>
              {success}
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          {/* Account Info */}
          {settings && (
            <div className="account-info">
              <h3>📋 Account Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-icon">📧</span>
                  <div className="info-content">
                    <span>Email</span>
                    <strong>{settings.email}</strong>
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-icon">🔐</span>
                  <div className="info-content">
                    <span>Status</span>
                    <strong>{settings.status}</strong>
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-icon">📅</span>
                  <div className="info-content">
                    <span>Member Since</span>
                    <strong>{formatDate(settings.createdAt)}</strong>
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-icon">🆔</span>
                  <div className="info-content">
                    <span>Artisan ID</span>
                    <strong>{settings.id.slice(-8)}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Profile Information */}
            <div className="form-section">
              <h2 className="section-title">Profile Information</h2>

              <div className="form-group">
                <label className="form-label" htmlFor="fullName">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  className="form-input"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="form-input"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g., +254 712 345 678"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="yearsExperience">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    id="yearsExperience"
                    name="yearsExperience"
                    className="form-input"
                    value={formData.yearsExperience}
                    onChange={handleChange}
                    placeholder="e.g., 5"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="specialty">
                    Specialty *
                  </label>
                  <select
                    id="specialty"
                    name="specialty"
                    className="form-select"
                    value={formData.specialty}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select specialty</option>
                    {SPECIALTIES.map((specialty) => (
                      <option key={specialty} value={specialty}>
                        {specialty}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="region">
                    Region *
                  </label>
                  <select
                    id="region"
                    name="region"
                    className="form-select"
                    value={formData.region}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select region</option>
                    {REGIONS.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="location">
                  Specific Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  className="form-input"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Kitengela, Kajiado County"
                />
                <p className="form-hint">
                  More specific location within your region (village, town, etc.)
                </p>
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

          {/* Danger Zone */}
          <div className="danger-zone">
            <h3>⚠️ Danger Zone</h3>
            <p>
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button type="button" className="btn-danger">
              Delete Account
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

