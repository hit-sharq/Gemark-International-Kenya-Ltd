"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { cloudinaryLoader } from "@/lib/cloudinary"
import MainLayout from "@/components/MainLayout"
import { useAuth } from "@clerk/nextjs"
import "./register.css"

const SPECIALTIES = [
  "Beadwork",
  "Woodcarving",
  "Textiles",
  "Jewelry",
  "Paintings",
  "Pottery",
  "Sculpture",
  "Ceramics",
  "Leatherwork",
  "Basket Weaving",
  "Metalwork",
  "Other",
]

const REGIONS = [
  "Central Kenya",
  "Coastal Kenya",
  "Eastern Kenya",
  "Nairobi",
  "Nyanza",
  "Rift Valley",
  "Western Kenya",
  "Other African Region",
]

export default function ArtisanRegisterPage() {
  const router = useRouter()
  const { isSignedIn, isLoaded: authLoaded } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    specialty: "",
    region: "",
    location: "",
    yearsExperience: "",
    bio: "",
    agreeTerms: false,
  })

  // Check authentication and artisan status on load
  useEffect(() => {
    if (!authLoaded) return

    if (!isSignedIn) {
      router.push("/sign-in?redirect=/artisan/register")
      return
    }

    // Check if user is already an approved artisan
    checkArtisanStatus()
  }, [authLoaded, isSignedIn, router])

  const checkArtisanStatus = async () => {
    try {
      const response = await fetch("/api/artisans/me")
      
      if (response.ok) {
        // User is an approved artisan - redirect to dashboard
        router.push("/artisan/dashboard")
        return
      }
      
      if (response.status === 403) {
        const data = await response.json()
        setError(data.error)
        return
      }
      
      // 404 means not registered yet, show the form
      setIsLoading(false)
    } catch (err) {
      console.error("Error checking artisan status:", err)
      setIsLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/artisans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      router.push("/artisan/register/success")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while checking auth and artisan status
  if (isLoading) {
    return (
      <MainLayout>
        <div className="artisan-register-page">
          <div className="register-container">
            <div className="register-header">
              <h1>Become an Artisan</h1>
              <p>Loading...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Show error state if artisan is pending or rejected
  if (error) {
    return (
      <MainLayout>
        <div className="artisan-register-page">
          <div className="register-container">
            <div className="register-header">
              <h1>Become an Artisan</h1>
              <div className="error-message">{error}</div>
              <Link href="/" className="back-button">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="artisan-register-page">
        <div className="register-container">
          <div className="register-header">
            <Link href="/" className="back-button">
              ← Back to Home
            </Link>
            <Link href="/" className="logo-link">
              <Image
                src="/placeholder-logo.svg"
                alt="ArtAfrik"
                width={150}
                height={50}
                loader={cloudinaryLoader}
              />
            </Link>
            <h1>Become an Artisan</h1>
            <p>Join our marketplace and sell your authentic African handcrafts to customers worldwide</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-section">
              <h2>Personal Information</h2>

              <div className="form-group">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your@email.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+254 XXX XXX XXX"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2>Artisan Details</h2>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="specialty">Specialty/Craft *</label>
                  <select
                    id="specialty"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select your specialty</option>
                    {SPECIALTIES.map((specialty) => (
                      <option key={specialty} value={specialty}>
                        {specialty}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="region">Region *</label>
                  <select
                    id="region"
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select your region</option>
                    {REGIONS.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="location">Specific Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Kitengela, Kajiado County"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="yearsExperience">Years of Experience</label>
                  <input
                    type="number"
                    id="yearsExperience"
                    name="yearsExperience"
                    value={formData.yearsExperience}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    placeholder="e.g., 5"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="bio">About You & Your Craft</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Tell us about yourself, your crafting journey, your traditions, and what makes your work unique..."
                />
              </div>
            </div>

            <div className="form-section">
              <div className="terms-checkbox">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="agreeTerms">
                  I agree to the{" "}
                  <Link href="/terms" target="_blank">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" target="_blank">
                    Privacy Policy
                  </Link>
                  , and confirm that I am the creator of the handcrafts I intend to sell.
                </label>
              </div>
            </div>

            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? (
                <span className="loading-spinner"></span>
              ) : (
                "Submit Application"
              )}
            </button>
          </form>

          <div className="register-footer">
            <p>
              Already have an account?{" "}
              <Link href="/artisan/login">Sign in here</Link>
            </p>
            <p>
              Want to browse artworks?{" "}
              <Link href="/gallery">Visit the gallery</Link>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

