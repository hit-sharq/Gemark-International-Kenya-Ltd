"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import MainLayout from "../../components/MainLayout"
import "./blog.css"

// Import the cloudinaryLoader
import { cloudinaryLoader } from "@/lib/cloudinary"

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  category: string
  author: string
  date: string
  image?: string
  featured: boolean
}

export default function Blog() {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get("category") || "All"

  const [selectedCategory, setSelectedCategory] = useState(categoryParam)
  const [searchQuery, setSearchQuery] = useState("")
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([])

  // Fetch blog posts
  useEffect(() => {
    async function fetchBlogPosts() {
      setIsLoading(true)
      try {
        const response = await fetch("/api/blog-posts")
        if (response.ok) {
          const data = await response.json()
          // Convert dates to user-friendly format
          const formattedPosts = data.map((post: any) => ({
            ...post,
            date: new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          }))
          setBlogPosts(formattedPosts)

          // Extract unique categories
          const uniqueCategories = ["All", ...Array.from(new Set(data.map((post: any) => post.category as string)))] as string[]
          setCategories(uniqueCategories)
        } else {
          console.error("Failed to fetch blog posts")
          setBlogPosts([])
        }
      } catch (error) {
        console.error("Error fetching blog posts:", error)
        setBlogPosts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchBlogPosts()
  }, [])

  // Filter posts based on selected category and search query
  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Get featured post
  const featuredPost = blogPosts.find((post) => post.featured)

  return (
    <MainLayout>
      <div className="blog-page">
        <div className="container">
          <h1 className="page-title">Arts Afrik Blog</h1>
          <p className="blog-intro">
            Discover the stories, traditions, and craftsmanship behind African art. Our blog features insights from
            experts, care tips, and the cultural significance of traditional pieces.
          </p>

          {featuredPost && (
            <div className="featured-post">
              <div className="featured-image">
                <Image
                  src={featuredPost.image || "/placeholder.svg"}
                  alt={featuredPost.title}
                  width={800}
                  height={500}
                  className="featured-img"
                  loader={cloudinaryLoader}
                />
                <div className="featured-badge">Featured</div>
              </div>
              <div className="featured-content">
                <div className="post-meta">
                  <span className="post-category">{featuredPost.category}</span>
                  <span className="post-date">{featuredPost.date}</span>
                </div>
                <h2 className="featured-title">{featuredPost.title}</h2>
                <p className="featured-excerpt">{featuredPost.excerpt}</p>
                <div className="post-footer">
                  <span className="post-author">By {featuredPost.author}</span>
                  <Link href={`/blog/${featuredPost.slug}`} className="read-more">
                    Read Full Article
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="blog-controls">
            <div className="category-filter">
              <label htmlFor="category">Filter by Category:</label>
              <select id="category" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="blog-grid">
            {isLoading ? (
              // Loading skeleton
              Array(6)
                .fill(0)
                .map((_, i) => (
                  <div className="blog-card skeleton" key={i}>
                    <div className="blog-image skeleton-image"></div>
                    <div className="blog-content">
                      <div className="skeleton-text"></div>
                      <div className="skeleton-text short"></div>
                      <div className="skeleton-text"></div>
                    </div>
                  </div>
                ))
            ) : filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <div className="blog-card" key={post.id}>
                  <div className="blog-image">
                    <Image
                      src={post.image || "/placeholder.svg"}
                      alt={post.title}
                      width={400}
                      height={250}
                      loader={cloudinaryLoader}
                    />
                  </div>
                  <div className="blog-content">
                    <div className="post-meta">
                      <span className="post-category">{post.category}</span>
                      <span className="post-date">{post.date}</span>
                    </div>
                    <h3 className="blog-title">{post.title}</h3>
                    <p className="blog-excerpt">{post.excerpt}</p>
                    <div className="post-footer">
                      <span className="post-author">By {post.author}</span>
                      <Link href={`/blog/${post.slug}`} className="read-more">
                        Read More
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                <p>No blog posts match your search criteria. Please try a different search or category.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
