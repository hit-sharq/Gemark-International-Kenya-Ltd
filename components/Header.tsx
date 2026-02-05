"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { useTheme } from "next-themes"
import { useCart } from "@/contexts/CartContext"
import { ShoppingCart, Heart } from "lucide-react"
import { useWishlist } from "@/contexts/WishlistContext"
import NotificationBell from "./NotificationBell"
import "./Header.css"

const Header = () => {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isUserAdmin, setIsUserAdmin] = useState(false)
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

    checkAdminStatus()
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
                  {/* Admin Dashboard */}
                  {isUserAdmin && (
                    <Link
                      href="/dashboard"
                      className={`dashboard-link admin-link ${isActive("/dashboard")}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin
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

