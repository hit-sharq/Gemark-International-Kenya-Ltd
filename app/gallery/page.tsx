"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import MainLayout from "../../components/MainLayout"
import QuickViewModal from "../../components/QuickViewModal"
import AddToCartButton from "../../components/AddToCartButton"
import { ArtListingType } from "@/types"
import "./gallery.css"

// Import the cloudinaryLoader
import { cloudinaryLoader } from "@/lib/cloudinary"

interface Artisan {
  id: string
  shopName: string | null
  shopSlug: string | null
  fullName: string
  specialty: string
}

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
  image?: string
  images?: string[]
  artisanId: string | null
  artisan: Artisan | null
}

export default function Gallery() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get("category") || ""
  const initialRegion = searchParams.get("region") || ""
  const initialArtisan = searchParams.get("artisan") || ""

  const [filters, setFilters] = useState({
    category: initialCategory,
    region: initialRegion,
    artisan: initialArtisan,
    priceRange: "",
    sortBy: "newest",
  })

  const [artListings, setArtListings] = useState<ArtListing[]>([])
  const [filteredArt, setFilteredArt] = useState<ArtListing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [artisans, setArtisans] = useState<Artisan[]>([])

  // Quick view modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedArtId, setSelectedArtId] = useState("")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  const [categories, setCategories] = useState<Array<{id: string, name: string, slug: string}>>([])
  const regions = ["All", "West Africa", "East Africa", "Central Africa", "Southern Africa"]
  const priceRanges = ["All", "Under $100", "$100 - $150", "Over $150"]
  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "priceAsc", label: "Price: Low to High" },
    { value: "priceDesc", label: "Price: High to Low" },
    { value: "nameAsc", label: "Name: A to Z" },
    { value: "nameDesc", label: "Name: Z to A" },
  ]

  useEffect(() => {
    // Fetch categories, artisans and art listings from the database
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch categories
        const categoriesResponse = await fetch("/api/categories")
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          setCategories(categoriesData)
        }

        // Fetch approved artisans
        const artisansResponse = await fetch("/api/artisans?status=APPROVED")
        if (artisansResponse.ok) {
          const artisansData = await artisansResponse.json()
          setArtisans(artisansData)
        }

        // Fetch art listings
        const response = await fetch("/api/art-listings")
        if (!response.ok) {
          throw new Error("Failed to fetch art listings")
        }
        const data = await response.json()

        // Transform data to match expected format if needed
        const formattedData = data.map((item: ArtListing) => ({
          ...item,
          image: item.images?.[0] || "/placeholder.svg?height=400&width=300",
        }))

        setArtListings(formattedData)
      } catch (error) {
        console.error("Error fetching data:", error)
        // Fallback to empty array
        setArtListings([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    // Apply filters and sorting
    let result = [...artListings]

    // Filter by category
    if (filters.category && filters.category !== "All") {
      result = result.filter((art) => art.category.name === filters.category)
    }

    // Filter by region
    if (filters.region && filters.region !== "All") {
      result = result.filter((art) => art.region === filters.region)
    }

    // Filter by artisan
    if (filters.artisan) {
      result = result.filter((art) => art.artisanId === filters.artisan)
    }

    // Filter by price range
    if (filters.priceRange) {
      if (filters.priceRange === "Under $100") {
        result = result.filter((art) => art.price < 100)
      } else if (filters.priceRange === "$100 - $150") {
        result = result.filter((art) => art.price >= 100 && art.price <= 150)
      } else if (filters.priceRange === "Over $150") {
        result = result.filter((art) => art.price > 150)
      }
    }

    // Apply sorting
    if (filters.sortBy === "newest") {
      // In a real app with createdAt dates, you would sort by date
      // Here we just keep the original order
    } else if (filters.sortBy === "oldest") {
      result = [...result].reverse()
    } else if (filters.sortBy === "priceAsc") {
      result = [...result].sort((a, b) => a.price - b.price)
    } else if (filters.sortBy === "priceDesc") {
      result = [...result].sort((a, b) => b.price - a.price)
    } else if (filters.sortBy === "nameAsc") {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title))
    } else if (filters.sortBy === "nameDesc") {
      result = [...result].sort((a, b) => b.title.localeCompare(a.title))
    }

    setFilteredArt(result)
    setCurrentPage(1) // Reset to first page on filter change
  }, [artListings, filters])

  // Calculate paginated items
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredArt.slice(indexOfFirstItem, indexOfLastItem)

  // Pagination controls handlers
  const handleNextPage = () => {
    if (currentPage < Math.ceil(filteredArt.length / itemsPerPage)) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const clearFilters = () => {
    setFilters({
      category: "",
      region: "",
      artisan: "",
      priceRange: "",
      sortBy: "newest",
    })
  }

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "grid" ? "list" : "grid"))
  }

  // Quick view handlers
  const openQuickView = (artId: string, e: React.MouseEvent) => {
    e.preventDefault()
    setSelectedArtId(artId)
    setIsModalOpen(true)
  }

  const closeQuickView = () => {
    setIsModalOpen(false)
  }

  // Get artisan name for display
  const getArtisanName = (art: ArtListing) => {
    if (art.artisan?.shopName) {
      return art.artisan.shopName
    }
    if (art.artisan?.fullName) {
      return art.artisan.fullName
    }
    return null
  }

  // Get featured artisans (those with products in gallery)
  const featuredArtisans = Array.isArray(artisans) 
    ? artisans.filter((artisan) => 
        artListings.some((art) => art.artisanId === artisan.id)
      ).slice(0, 4)
    : []

  return (
    <MainLayout>
      <div className="gallery-page">
        <div className="container">
          <div className="gallery-header">
            <h1 className="page-title">Art Gallery</h1>
            <p className="gallery-description">
              Explore our collection of authentic African art pieces, each handcrafted with cultural significance and
              artistic excellence.
            </p>
          </div>

          {/* Featured Artisans Section */}
          {featuredArtisans.length > 0 && (
            <div className="featured-artisans-section">
              <h2>Shop by Artisan</h2>
              <div className="featured-artisans-grid">
                {featuredArtisans.map((artisan) => (
                  <Link 
                    key={artisan.id} 
                    href={`/shop/${artisan.shopSlug}`}
                    className="featured-artisan-card"
                    target="_blank"
                  >
                    <div className="artisan-avatar">
                      {artisan.shopName?.charAt(0) || artisan.fullName.charAt(0)}
                    </div>
                    <div className="artisan-info">
                      <h3>{artisan.shopName || artisan.fullName}</h3>
                      <p>{artisan.specialty}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="gallery-controls">
            <div className="filters-container">
              <div className="filters">
                <div className="filter-group">
                  <label htmlFor="category">Category</label>
                  <select id="category" name="category" value={filters.category} onChange={handleFilterChange}>
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="region">Region</label>
                  <select id="region" name="region" value={filters.region} onChange={handleFilterChange}>
                    <option value="">All Regions</option>
                    {regions
                      .filter((region) => region !== "All")
                      .map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="artisan">Artisan</label>
                  <select id="artisan" name="artisan" value={filters.artisan} onChange={handleFilterChange}>
                    <option value="">All Artisans</option>
                    {Array.isArray(artisans) && artisans.map((artisan) => (
                      <option key={artisan.id} value={artisan.id}>
                        {artisan.shopName || artisan.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="priceRange">Price Range</label>
                  <select id="priceRange" name="priceRange" value={filters.priceRange} onChange={handleFilterChange}>
                    <option value="">All Prices</option>
                    {priceRanges
                      .filter((range) => range !== "All")
                      .map((range) => (
                        <option key={range} value={range}>
                          {range}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="sortBy">Sort By</label>
                  <select id="sortBy" name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="filter-actions">
                <button className="clear-filters" onClick={clearFilters}>
                  Clear Filters
                </button>
                <button className="view-toggle" onClick={toggleViewMode}>
                  {viewMode === "grid" ? "List View" : "Grid View"}
                </button>
              </div>
            </div>

            <div className="results-info">
              Showing {filteredArt.length} {filteredArt.length === 1 ? "result" : "results"}
            </div>
          </div>

          {isLoading ? (
            <div className={`gallery-${viewMode}`}>
              {Array(8)
                .fill(0)
                .map((_, i) => (
                  <div className={`art-card skeleton ${viewMode === "list" ? "list-view" : ""}`} key={i}>
                    <div className="art-image skeleton-image"></div>
                    <div className="art-info">
                      <div className="skeleton-text"></div>
                      <div className="skeleton-text short"></div>
                      <div className="skeleton-text short"></div>
                      <div className="skeleton-button"></div>
                    </div>
                  </div>
                ))}
            </div>
          ) : filteredArt.length > 0 ? (
            <div className={`gallery-${viewMode}`}>
              {currentItems.map((art) => {
                const artisanName = getArtisanName(art)
                return (
                  <div className={`art-card ${viewMode === "list" ? "list-view" : ""}`} key={art.id}>
                    <div className="art-image">
                      <Image
                        src={art.image || art.images?.[0] || "/placeholder.svg"}
                        alt={art.title}
                        fill
                        style={{ objectFit: "cover" }}
                        loader={cloudinaryLoader}
                      />
                      {art.category && (
                        <span className="art-category-badge">{art.category.name}</span>
                      )}
                      <div className="art-overlay">
                        <a href="#" className="quick-view" onClick={(e) => openQuickView(art.id, e)}>
                          Quick View
                        </a>
                      </div>
                    </div>
                    <div className="art-info">
                      <h3>{art.title}</h3>
                      <p className="art-details">
                        {art.category.name} • {art.region}
                      </p>
                      {artisanName && art.artisan?.shopSlug && (
                        <p className="art-artisan">
                          <Link href={`/shop/${art.artisan.shopSlug}`} target="_blank">
                            🏪 {artisanName}
                          </Link>
                        </p>
                      )}
                      <p className="art-price">${art.price.toFixed(2)}</p>
                      <div className="art-actions">
                        <AddToCartButton artwork={art as unknown as ArtListingType} variant="default" />
                        <Link href={`/gallery/${art.id}`} className="button view-button">
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="no-results">
              <p>No artworks match your selected filters. Please try different criteria.</p>
              <button className="button" onClick={clearFilters}>
                Clear All Filters
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredArt.length > itemsPerPage && (
            <div className="pagination">
              <button
                className="pagination-button"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                Previous
              </button>
              <div className="pagination-pages">
                {Array.from({ length: Math.min(5, Math.ceil(filteredArt.length / itemsPerPage)) }, (_, i) => {
                  const pageNumber = i + 1
                  return (
                    <button
                      key={i}
                      className={`pagination-button ${pageNumber === currentPage ? "active" : ""}`}
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  )
                })}
                {Math.ceil(filteredArt.length / itemsPerPage) > 5 && <span className="pagination-ellipsis">...</span>}
              </div>
              <button
                className="pagination-button"
                onClick={handleNextPage}
                disabled={currentPage === Math.ceil(filteredArt.length / itemsPerPage)}
                aria-label="Next page"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal isOpen={isModalOpen} onClose={closeQuickView} artId={selectedArtId} />
    </MainLayout>
  )
}

