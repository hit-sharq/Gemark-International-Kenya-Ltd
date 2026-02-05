"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import "./orders.css"

interface Order {
  id: string
  name: string
  email: string
  location: string
  message: string | null
  status: string
  userId: string | null
  artListingId: string
  createdAt: string
  artListing: {
    title: string
    price: number
    images: string[]
    artisan: {
      shopName: string | null
      shopSlug: string | null
    } | null
  }
}

export default function OrdersManagementPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/artisans/me/orders")
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/artisan/login")
          return
        }
        if (response.status === 403) {
          setError("Your account is pending approval.")
          setIsLoading(false)
          return
        }
        throw new Error("Failed to fetch orders")
      }
      const data = await response.json()
      setOrders(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/artisans/me/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update order")
      }

      setSuccess("Order status updated successfully!")
      fetchOrders()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { class: string; label: string }> = {
      pending: { class: "status-pending", label: "⏳ Pending" },
      approved: { class: "status-approved", label: "✅ Approved" },
      shipped: { class: "status-shipped", label: "🚚 Shipped" },
      delivered: { class: "status-delivered", label: "📦 Delivered" },
      cancelled: { class: "status-cancelled", label: "❌ Cancelled" },
    }

    const config = statusConfig[status] || { class: "status-pending", label: status }
    return <span className={`status-badge ${config.class}`}>{config.label}</span>
  }

  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((order) => order.status === statusFilter)

  const pendingCount = orders.filter((o) => o.status === "pending").length
  const approvedCount = orders.filter((o) => o.status === "approved").length
  const shippedCount = orders.filter((o) => o.status === "shipped").length
  const deliveredCount = orders.filter((o) => o.status === "delivered").length

  if (isLoading) {
    return (
      <div className="orders-management">
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
            <Link href="/artisan/dashboard/orders" className="nav-item active">
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
          <p style={{ textAlign: "center", color: "#6c757d" }}>Loading orders...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="orders-management">
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
          <Link href="/artisan/dashboard/orders" className="nav-item active">
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
          <h1>Orders</h1>
        </header>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <h3>{pendingCount}</h3>
              <p>Pending</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>{approvedCount}</h3>
              <p>Approved</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🚚</div>
            <div className="stat-info">
              <h3>{shippedCount}</h3>
              <p>Shipped</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-info">
              <h3>{deliveredCount}</h3>
              <p>Delivered</p>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="orders-section">
          <div className="section-header">
            <h2 className="section-title">All Orders</h2>
            <div className="filter-tabs">
              <button
                className={`filter-tab ${statusFilter === "all" ? "active" : ""}`}
                onClick={() => setStatusFilter("all")}
              >
                All ({orders.length})
              </button>
              <button
                className={`filter-tab ${statusFilter === "pending" ? "active" : ""}`}
                onClick={() => setStatusFilter("pending")}
              >
                Pending ({pendingCount})
              </button>
              <button
                className={`filter-tab ${statusFilter === "approved" ? "active" : ""}`}
                onClick={() => setStatusFilter("approved")}
              >
                Approved ({approvedCount})
              </button>
              <button
                className={`filter-tab ${statusFilter === "shipped" ? "active" : ""}`}
                onClick={() => setStatusFilter("shipped")}
              >
                Shipped ({shippedCount})
              </button>
              <button
                className={`filter-tab ${statusFilter === "delivered" ? "active" : ""}`}
                onClick={() => setStatusFilter("delivered")}
              >
                Delivered ({deliveredCount})
              </button>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>{orders.length === 0 ? "No orders yet" : "No orders in this category"}</h3>
              <p>
                {orders.length === 0
                  ? "Orders will appear here when customers request your products"
                  : "Try a different filter"}
              </p>
            </div>
          ) : (
            <div className="orders-grid">
              {filteredOrders.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <span className="order-id">Order #{order.id.slice(-8)}</span>
                    <span className="order-date">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="order-body">
                    <div className="order-product">
                      {order.artListing.images && order.artListing.images.length > 0 ? (
                        <Image
                          src={order.artListing.images[0]}
                          alt={order.artListing.title}
                          width={80}
                          height={80}
                          className="product-image"
                        />
                      ) : (
                        <div
                          className="product-image"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "2rem",
                          }}
                        >
                          🎨
                        </div>
                      )}
                      <div className="product-details">
                        <h4 className="product-title">{order.artListing.title}</h4>
                        <p className="product-price">${order.artListing.price.toFixed(2)}</p>
                        <p className="product-meta">
                          {order.artListing.artisan?.shopName || "Artisan Shop"}
                        </p>
                      </div>
                    </div>

                    <div className="customer-info">
                      <div className="info-item">
                        <span className="info-icon">👤</span>
                        <div>
                          <div className="info-label">Customer</div>
                          <div className="info-value">{order.name}</div>
                        </div>
                      </div>
                      <div className="info-item">
                        <span className="info-icon">📧</span>
                        <div>
                          <div className="info-label">Email</div>
                          <div className="info-value">{order.email}</div>
                        </div>
                      </div>
                      <div className="info-item">
                        <span className="info-icon">📍</span>
                        <div>
                          <div className="info-label">Location</div>
                          <div className="info-value">{order.location}</div>
                        </div>
                      </div>
                    </div>

                    {order.message && (
                      <div style={{ marginBottom: "16px" }}>
                        <div className="info-label" style={{ marginBottom: "4px" }}>
                          Message
                        </div>
                        <div
                          style={{
                            background: "#f8f9fa",
                            padding: "12px",
                            borderRadius: "8px",
                            fontSize: "0.9rem",
                            color: "#495057",
                          }}
                        >
                          {order.message}
                        </div>
                      </div>
                    )}

                    <div className="order-footer">
                      {getStatusBadge(order.status)}
                      <div className="order-actions">
                        <select
                          className="status-select"
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

