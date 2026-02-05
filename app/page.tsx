"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import MainLayout from "../components/MainLayout"
import AddToCartButton from "../components/AddToCartButton"
import { ArtListingType } from "../types"
import "./home.css"
import { cloudinaryLoader } from "../lib/cloudinary"

interface Artwork {
  id: string
  title: string
  description: string
  price: number
  category: {
    id: string
    name: string
    slug: string
  }
  material?: string
  region: string
  size: string
  images: string[]
}

interface Artisan {
  id: string
  shopName: string | null
  shopSlug: string | null
  shopLogo: string | null
  fullName: string
  specialty: string
  shopBio: string | null
  status: string
}

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  order: number
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([])
  const [featuredArtworks, setFeaturedArtworks] = useState<Artwork[]>([])
  const [featuredArtisans, setFeaturedArtisans] = useState<Artisan[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        // Fetch categories
        const categoriesRes = await fetch("/api/categories")
        if (!categoriesRes.ok) {
          throw new Error("Failed to fetch categories")
        }
        const categoriesData = await categoriesRes.json()
        console.log("Fetched categories:", categoriesData.length, categoriesData)
        setCategories(categoriesData)

        // Try to fetch featured artworks first
        let featuredData: Artwork[] = []
        try {
          const featuredRes = await fetch("/api/featured-artworks")
          if (featuredRes.ok) {
            featuredData = await featuredRes.json()
            console.log("Fetched featured artworks:", featuredData.length)
          }
        } catch (featError) {
          console.log("Could not fetch featured artworks, trying general listings:", featError)
        }

        // If no featured artworks, fetch from general listings as fallback
        if (!featuredData || featuredData.length === 0) {
          console.log("No featured artworks, fetching from general listings...")
          try {
            const listingsRes = await fetch("/api/art-listings?limit=8")
            if (listingsRes.ok) {
              const listingsData = await listingsRes.json()
              console.log("Fetched artworks from listings:", listingsData.length, listingsData)
              featuredData = listingsData
            }
          } catch (listError) {
            console.log("Could not fetch listings either:", listError)
          }
        }

        setFeaturedArtworks(featuredData || [])

        // Fetch featured artisans (approved only)
        try {
          const artisansRes = await fetch("/api/artisans?status=APPROVED")
          if (artisansRes.ok) {
            const artisansData = await artisansRes.json()
            console.log("Fetched artisans:", artisansData.length)
            // Select up to 4 featured artisans
            const selectedArtisans = artisansData.slice(0, 4)
            setFeaturedArtisans(selectedArtisans)
          }
        } catch (artisanError) {
          console.log("Could not fetch artisans:", artisanError)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
        setCategories([])
        setFeaturedArtworks([])
        setFeaturedArtisans([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Get category icon/symbol based on category name
  const getCategoryIcon = (name: string) => {
    const icons: Record<string, string> = {
      ebony: "🪵",
      rosewood: "🌳",
      masks: "👺",
      antiques: "🏺",
      gemstones: "💎",
      jewellery: "💍",
      woodcarving: "🪓",
      carvings: "🎨",
    }
    const key = name.toLowerCase()
    return icons[key] || "🎁"
  }

  return (
    <MainLayout>
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Discover Exquisite African Woodwork & Art</h1>
            <p className="slogan">"Timeless Craftsmanship from the Heart of Kenya"</p>
            <p className="hero-description">
              Gemark International brings you the finest handcrafted ebony carvings, rose wood masterpieces,
              traditional masks, authentic antiques, stunning gemstones, and African jewellery. Each piece
              tells a story of centuries-old African artistry and craftsmanship.
            </p>
            <div className="hero-buttons">
              <Link href="/gallery" className="button primary-button">
                Browse Collection
              </Link>
              <Link href="/contact" className="button secondary-button">
                Visit Us
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <Image
              src="/images/Abstract%20Portrait%20Colorful%20Painting%20%23AP013.jpeg"
              alt="Exquisite African Wood Carving"
              width={500}
              height={600}
              priority
              style={{ objectFit: "cover", borderRadius: "16px" }}
            />
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories section">
        <div className="container">
          <h2 className="section-title">Explore Our Collections</h2>
          <p className="section-subtitle">
            Discover our curated selection of authentic African art and woodwork, from hand-carved ebony sculptures
            and rosewood masterpieces to traditional masks, rare antiques, gemstones, and handcrafted African jewellery.
          </p>

          <div className="categories-grid">
            {isLoading ? (
              Array(6)
                .fill(0)
                .map((_, i) => (
                  <div className="category-card skeleton" key={i}>
                    <div className="category-image skeleton-image"></div>
                    <div className="skeleton-text"></div>
                    <div className="skeleton-text short"></div>
                  </div>
                ))
            ) : categories.length === 0 ? (
              <p>No categories available</p>
            ) : (
              categories.map((category) => (
                <Link 
                  href={`/gallery?category=${category.slug}`} 
                  key={category.id} 
                  className="category-card"
                >
                  <div className="category-image">
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        style={{ objectFit: "cover" }}
                        loader={cloudinaryLoader}
                      />
                    ) : (
                      <div className="category-icon-placeholder">
                        <span className="category-icon">{getCategoryIcon(category.name)}</span>
                      </div>
                    )}
                  </div>
                  <h3>{category.name}</h3>
                  {category.description && (
                    <p>{category.description}</p>
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Featured Artworks Section */}
      <section className="featured section">
        <div className="container">
          <h2 className="section-title">Featured Pieces</h2>
          <p className="section-subtitle">
            Unique handpicked artworks showcasing the rich diversity of African craftsmanship - from ebony wood carvings
            and rosewood sculptures to traditional masks, antique pieces, gemstones, and African jewellery.
          </p>

          <div className="featured-grid">
            {isLoading ? (
              Array(4)
                .fill(0)
                .map((_, i) => (
                  <div className="art-card skeleton" key={i}>
                    <div className="art-image skeleton-image"></div>
                    <div className="art-info">
                      <div className="skeleton-text"></div>
                      <div className="skeleton-text short"></div>
                      <div className="skeleton-text short"></div>
                      <div className="skeleton-button"></div>
                    </div>
                  </div>
                ))
            ) : featuredArtworks.length === 0 ? (
              <p className="empty-message">No featured pieces at the moment. Check back soon!</p>
            ) : (
              featuredArtworks.map((art) => (
                <div className="art-card" key={art.id}>
                  <div className="art-image">
                    <Image
                      src={art.images?.[0] || "/placeholder.svg"}
                      alt={art.title}
                      fill
                      style={{ objectFit: "cover" }}
                      loader={cloudinaryLoader}
                    />
                    {art.category && (
                      <span className="art-category-badge">{art.category.name}</span>
                    )}
                  </div>
                  <div className="art-info">
                    <Link href={`/gallery/${art.id}`}>
                      <h3>{art.title}</h3>
                    </Link>
                    <p className="art-origin">{art.region}</p>
                    <p className="art-price">${art.price?.toFixed(2) || "0.00"}</p>
                    <div className="art-actions">
                      <AddToCartButton artwork={art as unknown as ArtListingType} variant="default" />
                      <Link href={`/gallery/${art.id}`} className="button view-button">
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="view-all">
            <Link href="/gallery" className="button secondary-button">
              View All Pieces →
            </Link>
          </div>
        </div>
      </section>

      <section className="about-preview section">
        <div className="container">
          <div className="about-preview-content">
            <div className="about-preview-text">
              <h2 className="section-title">About Gemark International</h2>
              <p>
                Gemark International is your premier destination for authentic African woodwork and art in Nairobi, Kenya.
                We specialize in exquisite black wood ebony carvings, rosewood masterpieces, traditional masks, rare antiques,
                stunning gemstones, and handcrafted African jewellery.
              </p>
              <p>
                Each piece in our collection represents the rich cultural heritage and artistic traditions of Kenya and
                East Africa. Our artisans pour their skill, passion, and cultural knowledge into every creation, ensuring
                that each artwork is not just a product, but a piece of history and culture.
              </p>

              <Link href="/about" className="button primary-button">
                Learn More About Us
              </Link>
            </div>
            <div className="about-preview-image">
              <Image
                src="/images/about art artafriks.jpg"
                alt="African Artisan at Work"
                width={600}
                height={400}
                loader={cloudinaryLoader}
              />
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}

