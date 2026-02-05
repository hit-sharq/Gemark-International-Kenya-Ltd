"use client"

import type React from "react"

import { useState, useEffect, useRef, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import MainLayout from "../../components/MainLayout"
import { sendContactForm } from "../actions/contact-actions"
import { verifyRecaptcha } from "../../lib/recaptcha"
import "./contact.css"

// Import the cloudinaryLoader
import { cloudinaryLoader } from "@/lib/cloudinary"

// Inquiry types
const INQUIRY_TYPES = [
  { value: "general", label: "General Inquiry" },
  { value: "product", label: "Product Inquiry" },
  { value: "wholesale", label: "Wholesale Information" },
  { value: "partnership", label: "Partnership Opportunity" },
  { value: "other", label: "Other" },
]

export default function Contact() {
  const searchParams = useSearchParams()
  const initialInquiryType = searchParams.get("type") || "general"
  const pieceTitle = searchParams.get("pieceTitle") || ""
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    subject: pieceTitle ? `Inquiry about: ${pieceTitle}` : "",
    message: pieceTitle
      ? `Hello,\n\nI am interested in the art piece titled "${pieceTitle}". Please provide more details.\n\nThank you.`
      : "",
    inquiryType: initialInquiryType,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()
  const [recaptchaToken, setRecaptchaToken] = useState("")

  // Load form draft from localStorage on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem("contactFormDraft")
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft)
        setHasDraft(true)

        // Don't auto-load the draft, just indicate that it exists
      } catch (error) {
        console.error("Error parsing saved draft:", error)
      }
    }

    // Simulate loading a recaptcha token
    setTimeout(() => {
      setRecaptchaToken("simulated-recaptcha-token")
    }, 1000)
  }, [])

  // Auto-save form draft to localStorage as the user types
  useEffect(() => {
    const debouncedSaveDraft = setTimeout(() => {
      // Only save if at least one field has a value
      if (Object.values(formState).some((value) => value)) {
        localStorage.setItem(
          "contactFormDraft",
          JSON.stringify({
            ...formState,
            lastUpdated: new Date().toISOString(),
          }),
        )
        setHasDraft(true)
      }
    }, 1000)

    return () => clearTimeout(debouncedSaveDraft)
  }, [formState])

  const loadDraft = () => {
    const savedDraft = localStorage.getItem("contactFormDraft")
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft)
        setFormState((prev) => ({
          ...prev,
          name: parsedDraft.name || "",
          email: parsedDraft.email || "",
          phone: parsedDraft.phone || "",
          subject: parsedDraft.subject || "",
          message: parsedDraft.message || "",
          inquiryType: parsedDraft.inquiryType || "general",
        }))
      } catch (error) {
        console.error("Error parsing saved draft:", error)
      }
    }
  }

  const clearDraft = () => {
    localStorage.removeItem("contactFormDraft")
    setHasDraft(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormState((prev) => ({
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

    if (!formState.name.trim()) {
      newErrors.name = "Name is required"
    } else if (formState.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters"
    }

    if (!formState.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formState.email)) {
      newErrors.email = "Email is invalid"
    }

    if (!formState.subject.trim()) {
      newErrors.subject = "Subject is required"
    } else if (formState.subject.trim().length < 5) {
      newErrors.subject = "Subject must be at least 5 characters"
    }

    if (!formState.message.trim()) {
      newErrors.message = "Message is required"
    } else if (formState.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Verify reCAPTCHA
    const isRecaptchaValid = await verifyRecaptcha(recaptchaToken)

    if (!isRecaptchaValid) {
      setErrors((prev) => ({
        ...prev,
        recaptcha: "Please verify that you are not a robot",
      }))
      return
    }

    startTransition(async () => {
      try {
        const result = await sendContactForm({
          name: formState.name,
          email: formState.email,
          phone: formState.phone,
          subject: formState.subject,
          message: formState.message,
          inquiryType: formState.inquiryType as any,
        })

        if (result.success) {
          setSubmitSuccess(true)
          // Clear the draft from localStorage
          localStorage.removeItem("contactFormDraft")
          setHasDraft(false)

          // Reset form
          setFormState({
            name: "",
            email: "",
            phone: "",
            subject: "",
            message: "",
            inquiryType: "general",
          })

          // Scroll to the top of the form
          formRef.current?.scrollIntoView({ behavior: "smooth" })
        } else {
          if (result.errors) {
            setErrors(result.errors)
          } else {
            setErrors({
              submit: result.message || "There was an error submitting your message. Please try again.",
            })
          }
        }
      } catch (error) {
        console.error("Error submitting contact form:", error)
        setErrors({
          submit: "There was an error submitting your message. Please try again.",
        })
      }
    })
  }

  const toggleMap = () => {
    setShowMap(!showMap)
  }

  return (
    <MainLayout>
      <div className="contact-page">
        <div className="container">
          <motion.h1
            className="page-title"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Contact Us
          </motion.h1>

          <div className="contact-content">
            <motion.div
              className="contact-info"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="social-links">
                <h2>Connect With Us</h2>
                <p>
                  The fastest way to reach us is through WhatsApp or social media. We typically respond within 24
                  hours.
                </p>

                <div className="social-buttons">
                  <a
                    href="https://instagram.com/gemark_kenya"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-button instagram"
                    aria-label="Visit our Instagram page"
                  >
                    <span className="social-icon">
                      <i className="fab fa-instagram"></i>
                    </span>
                    <span className="social-name">Instagram</span>
                  </a>

                  <a
                    href="https://wa.me/+254727205718"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-button whatsapp"
                    aria-label="Contact us on WhatsApp"
                  >
                    <span className="social-icon">
                      <i className="fab fa-whatsapp"></i>
                    </span>
                    <span className="social-name">WhatsApp</span>
                  </a>

                  <a
                    href="https://facebook.com/gemarkkenya"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-button facebook"
                    aria-label="Visit our Facebook page"
                  >
                    <span className="social-icon">
                      <i className="fab fa-facebook-f"></i>
                    </span>
                    <span className="social-name">Facebook</span>
                  </a>
                </div>
              </div>

              <div className="contact-details">
                <h2>Our Information</h2>
                <div className="detail-item">
                  <strong>Email:</strong>
                  <p>
                    <a href="mailto:info@gemark.co.ke">info@gemark.co.ke</a>
                  </p>
                </div>
                <div className="detail-item">
                  <strong>Phone:</strong>
                  <p>
                    <a href="tel:+254727205718">+254 727 205 718</a>
                  </p>
                </div>
                <div className="detail-item">
                  <strong>Hours:</strong>
                  <p>Monday - Saturday: 10am - 8pm</p>
                  <p>Sunday: 11am - 6pm</p>
                </div>
                <div className="detail-item">
                  <strong>Location:</strong>
                  <p>Two Rivers Mall, Limuru Road</p>
                  <p>Nairobi, Kenya</p>
                  <button
                    onClick={toggleMap}
                    className="map-toggle-button"
                    aria-expanded={showMap}
                    aria-controls="location-map"
                  >
                    {showMap ? "Hide Map" : "Show Map"} <i className={`fas fa-chevron-${showMap ? "up" : "down"}`}></i>
                  </button>

                  <AnimatePresence>
                    {showMap && (
                      <motion.div
                        id="location-map"
                        className="location-map"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 250 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="map-placeholder">
                          <Image
                            src="/placeholder.svg?height=250&width=100%"
                            alt="Gemark International at Two Rivers Mall"
                            width={400}
                            height={250}
                            style={{ objectFit: "cover" }}
                            loader={cloudinaryLoader}
                          />
                          <div className="map-overlay">
                            <span className="map-pin">
                              <i className="fas fa-map-marker-alt"></i>
                            </span>
                            <span>Gemark International - Two Rivers Mall</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="contact-form-container"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2>Send Us a Message</h2>

              {hasDraft && (
                <div className="draft-notification">
                  <p>You have an unsaved draft message.</p>
                  <div className="draft-actions">
                    <button className="draft-action load" onClick={loadDraft}>
                      <i className="fas fa-download"></i> Load Draft
                    </button>
                    <button className="draft-action discard" onClick={clearDraft}>
                      <i className="fas fa-trash-alt"></i> Discard
                    </button>
                  </div>
                </div>
              )}

              {submitSuccess ? (
                <motion.div
                  className="success-message"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <h3>Message Sent!</h3>
                  <div className="success-icon">
                    <i className="fas fa-check-circle"></i>
                  </div>
                  <p>Thank you for contacting us. We will get back to you as soon as possible.</p>
                  <p className="email-confirmation">A confirmation email has been sent to your email address.</p>
                  <button
                    className="send-another-button"
                    onClick={() => {
                      setSubmitSuccess(false)
                    }}
                  >
                    Send Another Message
                  </button>
                </motion.div>
              ) : (
                <form className="contact-form" onSubmit={handleSubmit} noValidate ref={formRef}>
                  <div className="form-header">
                    <div className="form-group">
                      <label htmlFor="inquiryType">
                        Inquiry Type <span className="required">*</span>
                      </label>
                      <select
                        id="inquiryType"
                        name="inquiryType"
                        value={formState.inquiryType}
                        onChange={handleChange}
                        disabled={isPending}
                      >
                        {INQUIRY_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">
                        Your Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formState.name}
                        onChange={handleChange}
                        disabled={isPending}
                        aria-required="true"
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? "name-error" : undefined}
                      />
                      {errors.name && (
                        <p className="error" id="name-error">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">
                        Email Address <span className="required">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formState.email}
                        onChange={handleChange}
                        disabled={isPending}
                        aria-required="true"
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? "email-error" : undefined}
                      />
                      {errors.email && (
                        <p className="error" id="email-error">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">
                      Phone Number <span className="optional">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formState.phone}
                      onChange={handleChange}
                      disabled={isPending}
                      placeholder="e.g., +1 (234) 567-8901"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="subject">
                      Subject <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formState.subject}
                      onChange={handleChange}
                      disabled={isPending}
                      aria-required="true"
                      aria-invalid={!!errors.subject}
                      aria-describedby={errors.subject ? "subject-error" : undefined}
                    />
                    {errors.subject && (
                      <p className="error" id="subject-error">
                        {errors.subject}
                      </p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">
                      Your Message <span className="required">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={formState.message}
                      onChange={handleChange}
                      disabled={isPending}
                      aria-required="true"
                      aria-invalid={!!errors.message}
                      aria-describedby={errors.message ? "message-error" : undefined}
                    ></textarea>
                    {errors.message && (
                      <p className="error" id="message-error">
                        {errors.message}
                      </p>
                    )}
                    <div className="character-count">{formState.message.length} characters</div>
                  </div>

                  <div className="recaptcha-container">
                    <div className="recaptcha-placeholder">
                      {/* Real implementation would use Google reCAPTCHA here */}
                      <div className="recaptcha-placeholder">
                        <p>reCAPTCHA verification required</p>
                      </div>
                    </div>
                    {errors.recaptcha && <p className="error">{errors.recaptcha}</p>}
                  </div>

                  {errors.submit && <p className="error submit-error">{errors.submit}</p>}

                  <button type="submit" className="button submit-button" disabled={isPending}>
                    {isPending ? (
                      <span className="button-content">
                        <span className="loading-spinner"></span>
                        Sending...
                      </span>
                    ) : (
                      <span className="button-content">
                        <i className="fas fa-paper-plane"></i>
                        Send Message
                      </span>
                    )}
                  </button>

                  <p className="privacy-notice">
                    By submitting this form, you agree to our <a href="/privacy-policy">privacy policy</a>.
                  </p>
                </form>
              )}
            </motion.div>
          </div>

          <motion.div
            className="faq-section"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h2>Frequently Asked Questions</h2>
            <div className="faq-grid">
              <div className="faq-item">
                <h3>How can I purchase artwork?</h3>
                <p>
                  You can browse our gallery and submit a purchase request through the "Request This Piece" button on
                  the product page. Our team will contact you to discuss payment and shipping options.
                </p>
              </div>
              <div className="faq-item">
                <h3>Do you ship internationally?</h3>
                <p>
                  Yes, we ship worldwide. Shipping costs and delivery times vary depending on your location. Please
                  contact us for specific shipping information.
                </p>
              </div>
              <div className="faq-item">
                <h3>What payment methods do you accept?</h3>
                <p>
                  We accept major credit cards, PayPal, bank transfers, and mobile payment options. All payment details
                  will be provided after your order request is approved.
                </p>
              </div>
              <div className="faq-item">
                <h3>Can I commission a custom piece?</h3>
                <p>
                  Yes, we work with artisans to create custom pieces. Please contact us with your requirements, and
                  we'll discuss possibilities, pricing, and timeframes.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  )
}
