"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import MainLayout from "@/components/MainLayout"
import "./order-form.css"

// Update image loading in the order page
// Import the cloudinaryLoader
import { cloudinaryLoader } from "@/lib/cloudinary"

interface ArtListing {
  id: string
  title: string
  category: {
    id: string
    name: string
    slug: string
  }
  material?: string
  region: string
  price: number
  image: string
  images: string[]
}

export default function OrderRequest() {
  const { id } = useParams()
  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    location: "",
    message: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [art, setArt] = useState<ArtListing | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchArt = async () => {
      try {
        const response = await fetch(`/api/art-listings/${id}`)
        if (response.ok) {
          const artData = await response.json()
          setArt(artData)
        } else {
          console.error("Failed to fetch art listing")
        }
      } catch (error) {
        console.error("Error fetching art:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchArt()
    }
  }, [id])

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading art piece...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!art) {
    return (
      <MainLayout>
        <div className="container">
          <div className="not-found">
            <h1>Art Piece Not Found</h1>
            <p>Sorry, we couldn't find the art piece you're looking for.</p>
            <Link href="/gallery" className="button">
              Return to Gallery
            </Link>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Redirect to sign in if user is not authenticated
  if (isLoaded && !isSignedIn) {
    return (
      <MainLayout>
        <div className="container">
          <div className="auth-required">
            <h1>Authentication Required</h1>
            <p>You need to sign in to request this art piece.</p>
            <Link href={`/sign-in?redirect=/order/${id}`} className="button">
              Sign In
            </Link>
          </div>
        </div>
      </MainLayout>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }

    if (!formData.location.trim()) {
      newErrors.location = "Delivery location is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // In a real app, this would be an API call to submit the order
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setSubmitSuccess(true)

      // Redirect to a thank you page or show success message
      setTimeout(() => {
        router.push("/order/success")
      }, 2000)
    } catch (error) {
      console.error("Error submitting order:", error)
      setErrors({
        submit: "There was an error submitting your order. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MainLayout>
      <div className="order-request">
        <div className="container">
          <h1 className="page-title">Request This Art Piece</h1>

          <div className="order-content">
            <div className="art-preview">
              <div className="art-image">
                <Image
                  src={art.image || "/placeholder.svg"}
                  alt={art.title}
                  width={300}
                  height={400}
                  loader={cloudinaryLoader}
                />
              </div>
              <div className="art-details">
                <h2>{art.title}</h2>
                <p>
                  <strong>Category:</strong> {art.category.name}
                </p>
                {art.material && (
                  <p>
                    <strong>Material:</strong> {art.material}
                  </p>
                )}
                <p>
                  <strong>Origin:</strong> {art.region}
                </p>
                <p>
                  <strong>Price:</strong> ${art.price.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="order-form-container">
              {submitSuccess ? (
                <div className="success-message">
                  <h2>Order Request Submitted!</h2>
                  <p>
                    Thank you for your interest in this art piece. We will contact you shortly to discuss your order.
                  </p>
                </div>
              ) : (
                <form className="order-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                    {errors.name && <p className="error">{errors.name}</p>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                    {errors.email && <p className="error">{errors.email}</p>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="location">Delivery Location</label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                    {errors.location && <p className="error">{errors.location}</p>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">Custom Requests or Questions</label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    ></textarea>
                  </div>

                  {errors.submit && <p className="error submit-error">{errors.submit}</p>}

                  <button type="submit" className="button submit-button" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Order Request"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
