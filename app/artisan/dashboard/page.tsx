"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import "./dashboard.css"

interface Artisan {
  id: string
  email: string
  fullName: string
  specialty: string
  region: string
  shopName: string | null
  shopSlug: string | null
  shopBio: string | null
  shopLogo: string | null
  status: string
  _count: {
    artListings: number
  }
}

export default function ArtisanDashboardPage() {
  const router = useRouter()
  const [artisan, setArtisan] = useState<Artisan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchArtisanData()
  }, [])

  const fetchArtisanData = async () => {
    try {
      const response = await fetch("/api/artisans/me")
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/artisan/login")
          return
        }
        if (response.status === 403) {
          setError("Your account is pending approval. Please wait for admin review.")
          return
        }
        if (response.status === 404) {
          // User is not registered as an artisan - redirect to registration
          router.push("/artisan/register")
          return
        }
        throw new Error("Failed to fetch artisan data")
      }
      const data = await response.json()
      setArtisan(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="artisan-dashboard">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="artisan-dashboard">
        <div className="dashboard-error">
          <h1>Artisan Dashboard</h1>
          <div className="error-message">{error}</div>
          <Link href="/" className="button">Return Home</Link>
        </div>
      </div>
    )
  }

  if (!artisan) {
    return (
      <div className="artisan-dashboard">
        <div className="dashboard-error">
          <h1>Artisan Dashboard</h1>
          <div className="error-message">Artisan not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="artisan-dashboard">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2>Artisan Dashboard</h2>
        </div>
        <nav className="sidebar-nav">
          <Link href="/artisan/dashboard" className="nav-item active">
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
          <div className="header-content">
            <h1>Welcome, {artisan.fullName}!</h1>
            <p className="header-subtitle">
              Manage your shop and products from this dashboard
            </p>
          </div>
          <div className="header-actions">
            <Link href="/artisan/dashboard/shop" className="button primary-button">
              Edit Shop Profile
            </Link>
            <Link href="/artisan/dashboard/products" className="button secondary-button">
              Add New Product
            </Link>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🎨</div>
              <div className="stat-info">
                <span className="stat-value">{artisan._count.artListings}</span>
                <span className="stat-label">Products</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏪</div>
              <div className="stat-info">
                <span className="stat-value">{artisan.shopName || "Not Set"}</span>
                <span className="stat-label">Shop Name</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <span className="stat-value">{artisan.status}</span>
                <span className="stat-label">Account Status</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🌍</div>
              <div className="stat-info">
                <span className="stat-value">{artisan.region}</span>
                <span className="stat-label">Region</span>
              </div>
            </div>
          </div>

          <div className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="actions-grid">
              <Link href="/artisan/dashboard/shop" className="action-card">
                <span className="action-icon">🏪</span>
                <h3>Setup Shop</h3>
                <p>Customize your shop name, logo, and bio</p>
              </Link>
              <Link href="/artisan/dashboard/products" className="action-card">
                <span className="action-icon">➕</span>
                <h3>Add Product</h3>
                <p>List a new artwork or handcraft</p>
              </Link>
              <Link href="/artisan/dashboard/orders" className="action-card">
                <span className="action-icon">📦</span>
                <h3>View Orders</h3>
                <p>Track and manage customer orders</p>
              </Link>
              <Link href={`/shop/${artisan.shopSlug}`} className="action-card" target="_blank">
                <span className="action-icon">👁️</span>
                <h3>View Shop</h3>
                <p>See how your shop looks to customers</p>
              </Link>
            </div>
          </div>

          {artisan.status === "PENDING" && (
            <div className="pending-notice">
              <div className="notice-icon">⏳</div>
              <div className="notice-content">
                <h3>Your application is pending review</h3>
                <p>Our team is reviewing your artisan registration. You will receive an email once approved. In the meantime, you can prepare your shop details.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

