"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import Image from "next/image"
import Link from "next/link"
import MainLayout from "components/MainLayout"
import "./user-dashboard.css"
import { cloudinaryLoader } from "lib/cloudinary"

type ActiveTabType = "orders" | "profile" | "wishlist" | "messages"

interface Order {
  id: string
  artTitle: string
  artImage: string
  price: number
  status: string
  date: string
}

interface Message {
  id: string
  subject: string
  message: string
  date: string
  replied: boolean
}

export default function UserDashboard() {
  const { isSignedIn, isLoaded, userId } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ActiveTabType>("orders")
  const [orders, setOrders] = useState<Order[]>([])
  const [wishlist, setWishlist] = useState<any[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userProfile, setUserProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  })

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in?redirect=/user-dashboard")
    } else if (isLoaded && isSignedIn) {
      fetchUserData()
    }
  }, [isLoaded, isSignedIn, router])

  const fetchUserData = async () => {
    setIsLoading(true)
    try {
      // No mock data - rely on database
      setOrders([])
      setWishlist([])
      setMessages([])
      setUserProfile({
        name: "",
        email: "",
        phone: "",
        address: "",
      })
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !isSignedIn) {
    return (
      <MainLayout>
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your dashboard...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="user-dashboard-page">
        <div className="container">
          <h1 className="page-title">My Dashboard</h1>

          <div className="dashboard-tabs">
            <button
              className={`tab-button ${activeTab === "orders" ? "active" : ""}`}
              onClick={() => setActiveTab("orders")}
            >
              My Orders
            </button>
            <button
              className={`tab-button ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              Profile
            </button>
            <button
              className={`tab-button ${activeTab === "wishlist" ? "active" : ""}`}
              onClick={() => setActiveTab("wishlist")}
            >
              Wishlist
            </button>
            <button
              className={`tab-button ${activeTab === "messages" ? "active" : ""}`}
              onClick={() => setActiveTab("messages")}
            >
              Messages
            </button>
          </div>

          <div className="dashboard-content">
            {activeTab === "orders" && (
              <div className="orders-tab">
                <h2>My Orders</h2>
                {orders.length > 0 ? (
                  <div className="orders-list">
                    {orders.map((order) => (
                      <div className="order-card" key={order.id}>
                        <div className="order-image">
                          <Image
                            src={order.artImage || "/placeholder.svg"}
                            alt={order.artTitle}
                            width={100}
                            height={100}
                            loader={cloudinaryLoader}
                          />
                        </div>
                        <div className="order-details">
                          <h3>{order.artTitle}</h3>
                          <p className="order-price">${order.price.toFixed(2)}</p>
                          <p className="order-date">Ordered on: {new Date(order.date).toLocaleDateString()}</p>
                          <span className={`status-badge ${order.status}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                        <div className="order-actions">
                          <button className="button">View Details</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>You haven't placed any orders yet.</p>
                    <Link href="/gallery" className="button">
                      Browse Gallery
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === "profile" && (
              <div className="profile-tab">
                <h2>My Profile</h2>
                <div className="profile-form">
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      value={userProfile.name}
                      onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      value={userProfile.email}
                      onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      value={userProfile.phone}
                      onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="address">Shipping Address</label>
                    <textarea
                      id="address"
                      value={userProfile.address}
                      onChange={(e) => setUserProfile({ ...userProfile, address: e.target.value })}
                      rows={3}
                    ></textarea>
                  </div>
                  <button className="button save-button">Save Changes</button>
                </div>
              </div>
            )}

            {activeTab === "wishlist" && (
              <div className="wishlist-tab">
                <h2>My Wishlist</h2>
                {wishlist.length > 0 ? (
                  <div className="wishlist-grid">
                    {wishlist.map((item) => (
                      <div className="wishlist-card" key={item.id}>
                        <div className="wishlist-image">
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.title}
                            width={200}
                            height={200}
                            loader={cloudinaryLoader}
                          />
                        </div>
                        <div className="wishlist-details">
                          <h3>{item.title}</h3>
                          <p className="wishlist-price">${item.price.toFixed(2)}</p>
                        </div>
                        <div className="wishlist-actions">
                          <Link href={`/gallery/${item.id}`} className="button view-button">
                            View Details
                          </Link>
                          <button className="button remove-button">Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>Your wishlist is empty.</p>
                    <Link href="/gallery" className="button">
                      Browse Gallery
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === "messages" && (
              <div className="messages-tab">
                <h2>My Messages</h2>
                {messages.length > 0 ? (
                  <div className="messages-list">
                    {messages.map((message) => (
                      <div className="message-card" key={message.id}>
                        <div className="message-header">
                          <h3>{message.subject}</h3>
                          <span className="message-date">{new Date(message.date).toLocaleDateString()}</span>
                        </div>
                        <p className="message-content">{message.message}</p>
                        <div className="message-footer">
                          <span className={`reply-status ${message.replied ? "replied" : "pending"}`}>
                            {message.replied ? "Replied" : "Awaiting Reply"}
                          </span>
                          <button className="button">View Conversation</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>You don't have any messages yet.</p>
                    <Link href="/contact" className="button">
                      Contact Us
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
