"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import MainLayout from "@/components/MainLayout"
import { createTeamMember } from "@/app/actions/team-actions"
import { isAdmin } from "@/lib/auth"
import "../team-form.css"
import { ArrowLeft, Save, Upload } from "lucide-react"

export default function NewTeamMember() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    bio: "",
    order: 0,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Check if user is admin
  useEffect(() => {
    async function checkAdmin() {
      const adminStatus = await isAdmin()
      setIsAuthorized(adminStatus)
      if (!adminStatus) {
        router.push("/dashboard")
      }
    }
    checkAdmin()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")
    setSuccess("")

    try {
      const formDataObj = new FormData()
      formDataObj.append("name", formData.name)
      formDataObj.append("title", formData.title)
      formDataObj.append("bio", formData.bio)
      formDataObj.append("order", formData.order.toString())

      // Add image if one was selected
      const fileInput = document.getElementById("image") as HTMLInputElement
      if (fileInput.files && fileInput.files[0]) {
        formDataObj.append("image", fileInput.files[0])
      } else {
        setError("Please select a profile image")
        setIsSubmitting(false)
        return
      }

      const result = await createTeamMember(formDataObj)

      if (result.success) {
        setSuccess("Team member created successfully!")
        // Redirect after a short delay
        setTimeout(() => {
          // Use window.location for more reliable navigation
          window.location.href = "/dashboard?tab=team"
        }, 2000)
      } else {
        setError(result.message || "Failed to create team member")
      }
    } catch (error) {
      console.error("Error creating team member:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthorized) {
    return (
      <MainLayout>
        <div className="container">
          <div className="loading-container">
            <p>Checking authorization...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="team-form-page">
        <div className="container">
          <div className="team-form-container">
            <div className="form-header">
              <div className="header-content">
                <h1>Add New Team Member</h1>
                <Link href="/dashboard?tab=team" className="back-link">
                  <ArrowLeft size={18} />
                  <span>Back to Team</span>
                </Link>
              </div>
              <p>Fill in the details below to add a new team member.</p>
            </div>

            {success && (
              <div className="success-message">
                <i className="fas fa-check-circle"></i>
                <p>{success}</p>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <form className="team-form" onSubmit={handleSubmit}>
              <div className="form-layout">
                <div className="form-column">
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter team member's name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="title">Title/Position</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g., Founder & Curator, Cultural Specialist"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="order">Display Order</label>
                    <input
                      type="number"
                      id="order"
                      name="order"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: Number.parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                    <small>Lower numbers appear first</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="bio">Bio</label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Write a short bio for this team member"
                      required
                    ></textarea>
                  </div>
                </div>

                <div className="form-column">
                  <div className="form-group">
                    <label htmlFor="image">Profile Image</label>
                    <div className="image-upload-container">
                      {imagePreview && (
                        <div className="image-preview">
                          <Image
                            src={imagePreview || "/placeholder.svg"}
                            alt="Profile image preview"
                            width={300}
                            height={300}
                            style={{ objectFit: "cover" }}
                          />
                        </div>
                      )}
                      <div className="upload-button-container">
                        <label htmlFor="image" className="upload-button">
                          <Upload size={18} />
                          <span>Choose Image</span>
                          <input
                            type="file"
                            id="image"
                            name="image"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden-input"
                            required
                          />
                        </label>
                        <small>Please upload a profile image (required)</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <Link href="/dashboard?tab=team" className="button cancel-button">
                  Cancel
                </Link>
                <button type="submit" className="button submit-button" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="loading-spinner-small"></span>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      <span>Add Team Member</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        .form-header {
          margin-bottom: 30px;
        }
        
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .back-link {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--primary-color);
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .back-link:hover {
          color: var(--accent-color);
          transform: translateX(-3px);
        }
        
        .form-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }
        
        .image-upload-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .image-preview {
          width: 100%;
          max-width: 300px;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .upload-button-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .upload-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #f5f5f5;
          border: 1px dashed #ccc;
          border-radius: 6px;
          padding: 12px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          width: fit-content;
        }
        
        .upload-button:hover {
          background-color: #e9e9e9;
          border-color: #aaa;
        }
        
        .hidden-input {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
        
        .loading-spinner-small {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s linear infinite;
          margin-right: 8px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .submit-button {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        @media (max-width: 768px) {
          .form-layout {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          
          .header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
        }
      `}</style>
    </MainLayout>
  )
}
