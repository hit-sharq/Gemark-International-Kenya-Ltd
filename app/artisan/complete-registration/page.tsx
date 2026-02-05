"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import "./complete-registration.css"

export default function CompleteRegistrationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const { isSignedIn, user, isLoaded: isClerkLoaded } = useUser()

  const [isLoading, setIsLoading] = useState(true)
  const [isVerifying, setIsVerifying] = useState(false)
  const [artisanData, setArtisanData] = useState<any>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (token) {
      verifyToken(token)
    } else {
      setError("Invalid or expired registration link")
      setIsLoading(false)
    }
  }, [token])

  const verifyToken = async (verificationToken: string) => {
    try {
      const response = await fetch("/api/artisans/verify-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Invalid or expired registration link")
      } else {
        setArtisanData(data.artisan)
      }
    } catch (err) {
      setError("Failed to verify registration")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLinkAccount = async () => {
    if (!isSignedIn) {
      router.push(`/sign-up?redirect=/artisan/complete-registration?token=${token}`)
      return
    }

    if (!user || !user.id) {
      setError("Unable to get user information. Please try signing in again.")
      return
    }

    setIsVerifying(true)
    setError("")

    try {
      const response = await fetch("/api/artisans/link-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          token,
          clerkUserId: user.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to link account")
        return
      }

      setSuccess(true)
      
      setTimeout(() => {
        router.push("/artisan/dashboard")
      }, 2000)
    } catch (err) {
      setError("Failed to link account. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  if (isLoading) {
    return (
      <div className="complete-registration-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Verifying your registration...</p>
        </div>
      </div>
    )
  }

  if (error && !artisanData) {
    return (
      <div className="complete-registration-container">
        <div className="error-state">
          <div className="error-icon">X</div>
          <h1>Verification Failed</h1>
          <p>{error}</p>
          <Link href="/" className="button primary-button">
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="complete-registration-container">
      <div className="registration-content">
        <header className="registration-header">
          <h1>Complete Your Artisan Registration</h1>
          <p>Link your account to start selling on ArtAfrik</p>
        </header>

        {success ? (
          <div className="success-state">
            <div className="success-icon">✓</div>
            <h2>Account Linked Successfully!</h2>
            <p>Redirecting you to your artisan dashboard...</p>
          </div>
        ) : artisanData ? (
          <>
            <div className="artisan-info-card">
              <h2>Registration Details</h2>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="label">Full Name:</span>
                  <span className="value">{artisanData.fullName}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Email:</span>
                  <span className="value">{artisanData.email}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Specialty:</span>
                  <span className="value">{artisanData.specialty}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Region:</span>
                  <span className="value">{artisanData.region}</span>
                </div>
                {artisanData.shopName && (
                  <div className="detail-item">
                    <span className="label">Shop Name:</span>
                    <span className="value">{artisanData.shopName}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="link-account-section">
              <h2>Link Your Account</h2>
              <p>
                To access your artisan dashboard and start selling, you need to link this
                registration to your ArtAfrik account.
              </p>

              {isClerkLoaded && isSignedIn && user ? (
                <div className="signed-in-status">
                  <div className="status-icon">✓</div>
                  <div className="status-info">
                    <p className="status-title">Signed in as {user.primaryEmailAddress?.emailAddress}</p>
                    <p className="status-desc">Click below to link your accounts</p>
                  </div>
                  <button
                    className="button primary-button"
                    onClick={handleLinkAccount}
                    disabled={isVerifying}
                  >
                    {isVerifying ? "Linking..." : "Link Account & Continue"}
                  </button>
                </div>
              ) : (
                <div className="not-signed-in-status">
                  <div className="status-icon">🔐</div>
                  <div className="status-info">
                    <p className="status-title">Not Signed In</p>
                    <p className="status-desc">Sign up or sign in to link your accounts</p>
                  </div>
                  <div className="auth-buttons">
                    <Link
                      href={`/sign-up?redirect=/artisan/complete-registration?token=${token}`}
                      className="button primary-button"
                    >
                      Create Account
                    </Link>
                    <Link
                      href={`/sign-in?redirect=/artisan/complete-registration?token=${token}`}
                      className="button secondary-button"
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠</span>
                {error}
              </div>
            )}

            <div className="help-section">
              <h3>Need Help?</h3>
              <p>
                If you are having trouble completing your registration, please contact our
                support team.
              </p>
              <Link href="/contact" className="contact-link">
                Contact Support
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

