
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import "./artisans.css"

interface Artisan {
  id: string
  email: string
  fullName: string
  phone: string | null
  specialty: string
  region: string
  location: string | null
  yearsExperience: number | null
  shopBio: string | null
  status: "PENDING" | "APPROVED" | "REJECTED"
  rejectionReason: string | null
  createdAt: string
  _count: {
    artListings: number
  }
}

export default function AdminArtisansPage() {
  const [artisans, setArtisans] = useState<Artisan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("PENDING")
  const [selectedArtisan, setSelectedArtisan] = useState<Artisan | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  useEffect(() => {
    fetchArtisans()
  }, [filter])

  const fetchArtisans = async () => {
    try {
      const response = await fetch(`/api/artisans?status=${filter}`)
      if (!response.ok) {
        throw new Error("Failed to fetch artisans")
      }
      const data = await response.json()
      setArtisans(data.artisans)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/artisans/${id}/approval`, {
        method: "POST",
      })
      if (!response.ok) {
        throw new Error("Failed to approve artisan")
      }
      fetchArtisans()
      setSelectedArtisan(null)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleReject = async (id: string) => {
    try {
      const response = await fetch(`/api/artisans/${id}/approval`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      })
      if (!response.ok) {
        throw new Error("Failed to reject artisan")
      }
      fetchArtisans()
      setSelectedArtisan(null)
      setRejectReason("")
    } catch (err: any) {
      alert(err.message)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="admin-artisans-page">
      <header className="page-header">
        <div className="header-content">
          <Link href="/dashboard" className="back-link">
            ← Back to Dashboard
          </Link>
          <h1>Artisan Management</h1>
          <p>Review and manage artisan registration requests</p>
        </div>
      </header>

      <div className="filters">
        <button
          className={`filter-button ${filter === "PENDING" ? "active" : ""}`}
          onClick={() => setFilter("PENDING")}
        >
          Pending ({artisans.filter((a) => a.status === "PENDING").length})
        </button>
        <button
          className={`filter-button ${filter === "APPROVED" ? "active" : ""}`}
          onClick={() => setFilter("APPROVED")}
        >
          Approved
        </button>
        <button
          className={`filter-button ${filter === "REJECTED" ? "active" : ""}`}
          onClick={() => setFilter("REJECTED")}
        >
          Rejected
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading artisans...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : artisans.length === 0 ? (
        <div className="empty-state">
          <p>No {filter.toLowerCase()} artisan registrations</p>
        </div>
      ) : (
        <div className="artisans-grid">
          {artisans.map((artisan) => (
            <div key={artisan.id} className="artisan-card">
              <div className="artisan-header">
                <div className="artisan-avatar">
                  {artisan.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="artisan-info">
                  <h3>{artisan.fullName}</h3>
                  <span className={`status-badge ${artisan.status.toLowerCase()}`}>
                    {artisan.status}
                  </span>
                </div>
              </div>

              <div className="artisan-details">
                <div className="detail-row">
                  <span className="label">Email:</span>
                  <span className="value">{artisan.email}</span>
                </div>
                {artisan.phone && (
                  <div className="detail-row">
                    <span className="label">Phone:</span>
                    <span className="value">{artisan.phone}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="label">Specialty:</span>
                  <span className="value">{artisan.specialty}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Region:</span>
                  <span className="value">{artisan.region}</span>
                </div>
                {artisan.location && (
                  <div className="detail-row">
                    <span className="label">Location:</span>
                    <span className="value">{artisan.location}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="label">Experience:</span>
                  <span className="value">
                    {artisan.yearsExperience
                      ? `${artisan.yearsExperience} years`
                      : "Not specified"}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Applied:</span>
                  <span className="value">{formatDate(artisan.createdAt)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Products:</span>
                  <span className="value">{artisan._count.artListings}</span>
                </div>
              </div>

              {artisan.shopBio && (
                <div className="artisan-bio">
                  <h4>About:</h4>
                  <p>{artisan.shopBio}</p>
                </div>
              )}

              {artisan.status === "PENDING" && (
                <div className="artisan-actions">
                  <button
                    className="button approve-button"
                    onClick={() => handleApprove(artisan.id)}
                  >
                    Approve
                  </button>
                  <button
                    className="button reject-button"
                    onClick={() => setSelectedArtisan(artisan)}
                  >
                    Reject
                  </button>
                </div>
              )}

              {artisan.status === "REJECTED" && artisan.rejectionReason && (
                <div className="rejection-reason">
                  <h4>Rejection Reason:</h4>
                  <p>{artisan.rejectionReason}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {selectedArtisan && (
        <div className="modal-overlay" onClick={() => setSelectedArtisan(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Reject Artisan Registration</h2>
            <p>
              You are about to reject {selectedArtisan.fullName}. Please provide a
              reason (this will be sent to the artisan).
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
            />
            <div className="modal-actions">
              <button
                className="button cancel-button"
                onClick={() => setSelectedArtisan(null)}
              >
                Cancel
              </button>
              <button
                className="button confirm-reject-button"
                onClick={() => handleReject(selectedArtisan.id)}
                disabled={!rejectReason.trim()}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

