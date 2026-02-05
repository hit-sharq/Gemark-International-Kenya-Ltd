"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import Image from "next/image"
import { cloudinaryLoader } from "@/lib/cloudinary"
import { useRouter } from "next/navigation"

interface TeamMember {
  id: string
  name: string
  title: string
  bio: string
  image: string
  order: number
}

interface TeamMemberModalProps {
  isOpen: boolean
  onClose: () => void
  teamMemberId: string
}

export default function TeamMemberModal({ isOpen, onClose, teamMemberId }: TeamMemberModalProps) {
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (isOpen && teamMemberId) {
      setIsLoading(true)
      // Fetch the team member details
      fetch(`/api/team-members/${teamMemberId}`)
        .then((res) => res.json())
        .then((data) => {
          setTeamMember(data)
          setIsLoading(false)
        })
        .catch((error) => {
          console.error("Error fetching team member details:", error)
          setIsLoading(false)
        })
    }
  }, [isOpen, teamMemberId])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        {isLoading ? (
          <div className="modal-loading">
            <div className="loading-spinner"></div>
            <p>Loading team member details...</p>
          </div>
        ) : teamMember ? (
          <>
            <div className="modal-header">
              <h2>{teamMember.name}</h2>
            </div>
            <div className="modal-content team-member-content">
              <div className="team-member-image-container">
                <Image
                  src={teamMember.image || "/placeholder.svg"}
                  alt={teamMember.name}
                  width={300}
                  height={300}
                  className="team-member-image"
                  loader={cloudinaryLoader}
                />
              </div>
              <div className="team-member-details">
                <div className="detail-group">
                  <h3 className="detail-label">Position</h3>
                  <p className="detail-value">{teamMember.title}</p>
                </div>

                <div className="detail-group">
                  <h3 className="detail-label">Bio</h3>
                  <p className="detail-value bio">{teamMember.bio}</p>
                </div>

                <div className="detail-group">
                  <h3 className="detail-label">Display Order</h3>
                  <p className="detail-value">{teamMember.order}</p>
                </div>

                <div className="team-member-actions">
                  <button
                    className="button edit-button"
                    onClick={() => {
                      onClose()
                      router.push(`/dashboard/team/edit/${teamMember.id}`)
                    }}
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="modal-error">
            <p>Team member not found. Please try again.</p>
            <button className="button" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
;<style jsx>{`
  .team-member-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 0 30px 30px;
  }
  
  .team-member-image-container {
    width: 100%;
    display: flex;
    justify-content: center;
  }
  
  .team-member-image {
    border-radius: 8px;
    object-fit: cover;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .team-member-details {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .detail-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .detail-label {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--primary-color);
    margin: 0;
  }
  
  .detail-value {
    font-size: 1rem;
    margin: 0;
    color: var(--text-color);
  }
  
  .detail-value.bio {
    line-height: 1.6;
    white-space: pre-line;
  }
  
  .team-member-actions {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }
  
  .edit-button {
    background-color: var(--primary-color);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .edit-button:hover {
    background-color: var(--accent-color);
    transform: translateY(-2px);
  }
  
  @media (min-width: 768px) {
    .team-member-content {
      flex-direction: row;
      align-items: flex-start;
    }
    
    .team-member-image-container {
      flex: 0 0 300px;
    }
    
    .team-member-details {
      flex: 1;
    }
  }
`}</style>
