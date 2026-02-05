"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { useTheme } from "next-themes"
import { isAdmin } from "@/lib/auth"
import { useCart } from "@/contexts/CartContext"
import { ShoppingCart, Heart } from "lucide-react"
import { useWishlist } from "@/contexts/WishlistContext"
import NotificationBell from "./NotificationBell"
import "./Header.css"

interface ArtisanData {
  id: string
  shopName: string | null
  shopSlug: string | null
  status: string
}

const Header = () => {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isUserAdmin, setIsUserAdmin] = useState(false)
  const [isArtisan, setIsArtisan] = useState(false)
  const [artisanData, setArtisanData] = useState<ArtisanData | null>(null)
  const { theme, setTheme } = useTheme()
  const { itemCount, openCart } = useCart()
  const { itemCount: wishlistCount, openWishlist } = useWishlist()

  const isActive = (path: string) => {
    return pathname === path ? "active" : ""
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch("/api/check-admin")
        const data = await response.json()
        setIsUserAdmin(data.isAdmin)
      } catch (error) {
        console.error("Error checking admin status:", error)
        setIsUserAdmin(false)
      }
    }

    const checkArtisanStatus = async () => {
      try {
        const response = await fetch("/api/artisans/me")
        if (response.ok) {
          const data = await response.json()
          setIsArtisan(true)
          setArtisanData({
            id: data.id,
            shopName: data.shopName,
            shopSlug: data.shopSlug,
            status: data.status,
          })
        } else if (response.status === 404) {
          // User is not registered as an artisan - this is expected for most users
          setIsArtisan(false)
          setArtisanData(null)
        }
        // For 403 (pending/rejected), user is not an approved artisan
      } catch (error) {
        // Silently fail - user is not an artisan or network error
        setIsArtisan(false)
        setArtisanData(null)
      }
    }

    checkAdminStatus()
    checkArtisanStatus()
  }, [])

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <Link href="/">
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2c3e50' }}>Gemark International</h1>
              <h2 style={{ fontStyle: 'italic', fontSize: '0.85em', margin: '5px 0 0 0', color: '#8B4513' }}>Fine Woodwork & African Art</h2>
            </Link>
          </div>

          <button className="mobile-menu-button" onClick={toggleMobileMenu}>
            {mobileMenuOpen ? "✕" : "☰"}
          </button>

          <nav className={`nav ${mobileMenuOpen ? "open" : ""}`}>
            <ul className="nav-list">
              <li className={isActive("/")}>
                <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                  Home
                </Link>
              </li>
              <li className={isActive("/shop")}>
                <Link href="/shop" onClick={() => setMobileMenuOpen(false)}>
                  Shops
                </Link>
              </li>
              <li className={isActive("/gallery")}>
                <Link href="/gallery" onClick={() => setMobileMenuOpen(false)}>
                  Gallery
                </Link>
              </li>
              <SignedIn>
                <li className={isActive("/user-dashboard")}>
                  <Link href="/user-dashboard" onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                  </Link>
                </li>
              </SignedIn>
              <SignedOut>
                <li className={isActive("/contact")}>
                  <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
                    Contact Us
                  </Link>
                </li>
              </SignedOut>
            </ul>

            <div className="auth-buttons">
              {/* Cart Button - Always visible */}
              <button className="cart-button" onClick={openCart} aria-label="Open cart">
                <ShoppingCart size={20} />
                {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
              </button>

              {/* Wishlist Button - Always visible */}
              <button className="wishlist-button" onClick={openWishlist} aria-label="Open wishlist">
                <Heart size={20} />
                {wishlistCount > 0 && <span className="wishlist-count">{wishlistCount}</span>}
              </button>

              <SignedIn>
                <div className="user-section">
                  {/* Admin Dashboard - Highest priority */}
                  {isUserAdmin && (
                    <Link
                      href="/dashboard"
                      className={`dashboard-link admin-link ${isActive("/dashboard")}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}

                  {/* Artisan Links - For approved artisans */}
                  {isArtisan && artisanData?.status === "APPROVED" && (
                    <Link
                      href="/artisan/dashboard"
                      className={`dashboard-link artisan-dashboard-link ${isActive("/artisan/dashboard")}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      🏪 Shop
                    </Link>
                  )}

                  {/* User Account Button */}
                  <UserButton afterSignOutUrl="/" />
                  
                  {/* Notification Bell - For signed in users */}
                  <NotificationBell />
                </div>
              </SignedIn>

              <SignedOut>
                <Link href="/sign-in" className="sign-in-button" onClick={() => setMobileMenuOpen(false)}>
                  Sign In
                </Link>
                <Link href="/sign-up" className="sign-up-button" onClick={() => setMobileMenuOpen(false)}>
                  Sign Up
                </Link>
              </SignedOut>

              {/* Theme Toggle - Always visible */}
              <button className="theme-toggle-button" onClick={toggleTheme} aria-label="Toggle Dark Mode">
                {theme === "dark" ? "🌞" : "🌙"}
              </button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header

