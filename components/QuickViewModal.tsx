"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { X } from "lucide-react"
import { cloudinaryLoader } from "@/lib/cloudinary"

interface ArtListing {
  id: string
  title: string
  description: string
  price: number
  category: {
    id: string
    name: string
    slug: string
  }
  region: string
  size: string
  images: string[]
}

interface QuickViewModalProps {
  isOpen: boolean
  onClose: () => void
  artId: string
}

export default function QuickViewModal({ isOpen, onClose, artId }: QuickViewModalProps) {
  const [art, setArt] = useState<ArtListing | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isOpen && artId) {
      setIsLoading(true)
      // Fetch the art details
      fetch(`/api/art-listings/${artId}`)
        .then((res) => res.json())
        .then((data) => {
          setArt(data)
          setIsLoading(false)
        })
        .catch((error) => {
          console.error("Error fetching art details:", error)
          setIsLoading(false)
        })
    }
  }, [isOpen, artId])

  if (!isOpen) return null

  return (
    <div className="quick-view-modal-overlay" onClick={onClose}>
      <div className="quick-view-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal" onClick={onClose}>
          <X size={24} />
        </button>

        {isLoading ? (
          <div className="modal-loading">
            <div className="loading-spinner"></div>
            <p>Loading art details...</p>
          </div>
        ) : art ? (
          <div className="modal-content">
            <div className="modal-image">
              <Image
                src={art.images[0] || "/placeholder.svg"}
                alt={art.title}
                width={300}
                height={400}
                style={{ objectFit: "contain" }}
                loader={cloudinaryLoader}
              />
            </div>
            <div className="modal-details">
              <h2>{art.title}</h2>
              <p className="art-type">
                {art.category.name} • {art.region}
              </p>
              <p className="art-size">Size: {art.size}</p>
              <p className="art-price">${art.price.toFixed(2)}</p>
              <p className="art-description">{art.description.substring(0, 150)}...</p>
              <div className="modal-actions">
                <Link href={`/gallery/${art.id}`} className="button view-full-details">
                  View Full Details
                </Link>
                <Link href={`/order/${art.id}`} className="button request-button">
                  Request This Piece
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="modal-error">
            <p>Art piece not found. Please try again.</p>
            <button className="button" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
