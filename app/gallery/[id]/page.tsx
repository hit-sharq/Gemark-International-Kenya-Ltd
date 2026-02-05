"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import MainLayout from "../../../components/MainLayout"
import "./product-detail.css"
// Import the CloudinaryImage component
import { cloudinaryLoader, getCloudinaryUrl } from "../../../lib/cloudinary"

interface ArtListing {
  id: string
  title: string
  description: string
  category: {
    id: string
    name: string
    slug: string
  }
  material?: string
  region: string
  size: string
  price: number
  images: string[]
}

export default function ProductDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [activeImage, setActiveImage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [art, setArt] = useState<ArtListing | null>(null)
  const [relatedArt, setRelatedArt] = useState<ArtListing[]>([])
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const [isZoomed, setIsZoomed] = useState(false)

  useEffect(() => {
    const fetchArtDetails = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/art-listings/${id}`)
        if (!response.ok) {
          throw new Error("Art listing not found")
        }
        const artPiece = await response.json()
        setArt(artPiece)

        // Fetch related art based on category or region
        const relatedResponse = await fetch("/api/art-listings")
        if (relatedResponse.ok) {
          const allArt = await relatedResponse.json()
          const related = allArt
            .filter(
              (item: ArtListing) =>
                item.id !== id && (item.category.id === artPiece.category.id || item.region === artPiece.region),
            )
            .slice(0, 3)
          setRelatedArt(related)
        } else {
          setRelatedArt([])
        }
      } catch (error) {
        console.error("Error fetching art details:", error)
        setArt(null)
        setRelatedArt([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchArtDetails()
  }, [id])

  const handleImageHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return

    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100

    setZoomPosition({ x, y })
  }

  const handleGoBack = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="product-detail">
          <div className="container">
            <div className="product-content skeleton">
              <div className="product-gallery">
                <div className="main-image skeleton-image"></div>
                <div className="thumbnail-gallery">
                  {[1, 2, 3].map((_, index) => (
                    <div key={index} className="thumbnail skeleton-image"></div>
                  ))}
                </div>
              </div>
              <div className="product-info">
                <div className="skeleton-text"></div>
                <div className="product-meta skeleton">
                  {[1, 2, 3, 4].map((_, index) => (
                    <div key={index} className="skeleton-text"></div>
                  ))}
                </div>
                <div className="product-description skeleton">
                  <div className="skeleton-text"></div>
                  <div className="skeleton-text"></div>
                  <div className="skeleton-text"></div>
                </div>
                <div className="skeleton-button"></div>
              </div>
            </div>
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
            <div className="not-found-actions">
              <Link href="/gallery" className="button">
                Browse Gallery
              </Link>
              <button onClick={handleGoBack} className="button secondary-button">
                Go Back
              </button>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="product-detail">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link> / <Link href="/gallery">Gallery</Link> / <span>{art.title}</span>
          </div>

          <div className="product-content">
            <div className="product-gallery">
              <div
                className={`main-image ${isZoomed ? "zoomed" : ""}`}
                onMouseMove={handleImageHover}
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                style={
                  isZoomed
                    ? {
                        backgroundImage: `url(${getCloudinaryUrl(art.images[activeImage], ["c_fill", "g_auto", "w_1200", "h_800"])})`,
                        backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      }
                    : undefined
                }
              >
                {!isZoomed && (
                  <Image
                    src={art.images[activeImage] || "/placeholder.svg"}
                    alt={art.title}
                    fill
                    style={{ objectFit: "contain" }}
                    priority
                    loader={cloudinaryLoader}
                  />
                )}
                <div className="zoom-hint">
                  <span>Hover to zoom</span>
                </div>
              </div>
              <div className="thumbnail-gallery">
                {art.images.map((image, index) => (
                  <div
                    key={index}
                    className={`thumbnail ${activeImage === index ? "active" : ""}`}
                    onClick={() => setActiveImage(index)}
                  >
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`${art.title} - View ${index + 1}`}
                      fill
                      style={{ objectFit: "cover" }}
                      loader={cloudinaryLoader}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="product-info">
              <button className="back-button" onClick={handleGoBack}>
                ← Back
              </button>
              <h1>{art.title}</h1>

              <div className="product-meta">
                <div className="meta-item">
                  <span className="meta-label">Category:</span>
                  <span className="meta-value">{art.category.name}</span>
                </div>
                {art.material && (
                  <div className="meta-item">
                    <span className="meta-label">Material:</span>
                    <span className="meta-value">{art.material}</span>
                  </div>
                )}
                <div className="meta-item">
                  <span className="meta-label">Origin:</span>
                  <span className="meta-value">{art.region}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Size:</span>
                  <span className="meta-value">{art.size}</span>
                </div>
                <div className="meta-item price">
                  <span className="meta-label">Price:</span>
                  <span className="meta-value">${art.price.toFixed(2)}</span>
                </div>
              </div>

              <div className="product-description">
                <h2>Description</h2>
                <p>{art.description}</p>
              </div>

              <div className="product-actions">
                <Link
                  href={{
                    pathname: "/contact",
                    query: {
                      pieceId: art.id,
                      pieceTitle: art.title,
                    },
                  }}
                  className="button request-button"
                >
                  Request This Piece
                </Link>

                <div className="social-share">
                  <span>Share:</span>
                  <div className="share-buttons">
                    <button className="share-button facebook">
                      <i className="fab fa-facebook-f"></i>
                    </button>
                    <button className="share-button twitter">
                      <i className="fab fa-twitter"></i>
                    </button>
                    <button className="share-button pinterest">
                      <i className="fab fa-pinterest-p"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="related-products">
            <h2>You May Also Like</h2>
            <div className="related-grid">
              {relatedArt.length > 0 ? (
                relatedArt.map((item) => (
                  <div className="art-card" key={item.id}>
                    <div className="art-image">
                      <Image
                        src={item.images[0] || "/placeholder.svg"}
                        alt={item.title}
                        fill
                        style={{ objectFit: "cover" }}
                        loader={cloudinaryLoader}
                      />
                      <div className="art-overlay">
                        <Link href={`/gallery/${item.id}`} className="quick-view">
                          Quick View
                        </Link>
                      </div>
                    </div>
                    <div className="art-info">
                      <h3>{item.title}</h3>
                      <p className="art-details">
                        {item.category.name} • {item.region}
                      </p>
                      <p className="art-price">${item.price.toFixed(2)}</p>
                      <Link href={`/gallery/${item.id}`} className="button view-button">
                        View Details
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-related">No related products found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
