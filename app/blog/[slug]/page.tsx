"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import MainLayout from "@/components/MainLayout"
import "./blog-post.css"
import { getBlogPost } from "@/app/actions/blog-actions"
// Import the CloudinaryImage component
import { cloudinaryLoader } from "@/lib/cloudinary"

interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  category: string
  author: string
  authorTitle?: string
  authorImage?: string
  date: string
  image?: string
  tags: string[]
  featured: boolean
  allowComments: boolean
}

export default function BlogPost() {
  const { slug } = useParams()
  const router = useRouter()
  const [activeImage, setActiveImage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [post, setPost] = useState<BlogPost | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBlogPost = async () => {
      setIsLoading(true)
      try {
        const result = await getBlogPost(slug as string)
        if (result.success) {
          if (result.post) {
            setPost({
              id: result.post.id || "",
              title: result.post.title || "",
              slug: result.post.slug || "",
              content: result.post.content || "",
              excerpt: result.post.excerpt || "",
              category: result.post.category || "",
              author: result.post.author || "",
              authorTitle: result.post.authorTitle ?? undefined,
              authorImage: result.post.authorImage ?? undefined,
              date: new Date(result.post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              image: result.post.image ?? undefined,
              tags: result.post.tags || [],
              featured: result.post.featured || false,
              allowComments: result.post.allowComments || false,
            })
          }

          // Fetch related posts
          const response = await fetch("/api/blog-posts")
          if (response.ok) {
            const allPosts = await response.json()
          const related = allPosts
              .filter((p: any) => p.slug !== slug && result.post && p.category === result.post.category)
              .slice(0, 3)
              .map((p: any) => ({
                ...p,
                date: new Date(p.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }),
              }))
            setRelatedPosts(related)
          }
        } else {
          setError(result.message || "Failed to load blog post")
        }
      } catch (error) {
        console.error("Error loading blog post:", error)
        setError("An error occurred while loading the blog post")
      } finally {
        setIsLoading(false)
      }
    }

    if (slug) {
      fetchBlogPost()
    }
  }, [slug])

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

  if (error || !post) {
    return (
      <MainLayout>
        <div className="container">
          <div className="not-found">
            <h1>Blog Post Not Found</h1>
            <p>{error || "Sorry, we couldn't find the blog post you're looking for."}</p>
            <div className="not-found-actions">
              <Link href="/blog" className="button">
                Browse Blog
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
      <div className="blog-post-page">
        <div className="blog-post-header">
          <div className="container">
            <div className="post-meta-top">
              <span className="post-category">{post.category}</span>
              <span className="post-date">{post.date}</span>
            </div>
            <h1 className="post-title">{post.title}</h1>
            <div className="post-author-brief">
              <div className="author-image">
                <Image
                  src={post.authorImage || "/placeholder.svg"}
                  alt={post.author}
                  width={50}
                  height={50}
                  loader={cloudinaryLoader}
                />
              </div>
              <div className="author-info">
                <span className="author-name">By {post.author}</span>
                <span className="author-title">{post.authorTitle}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="featured-image-container">
          <Image
            src={post.image || "/placeholder.svg?height=600&width=1200"}
            alt={post.title}
            width={1200}
            height={600}
            className="featured-post-image"
            loader={cloudinaryLoader}
          />
        </div>

        <div className="container">
          <div className="blog-post-content">
            <div className="post-content" dangerouslySetInnerHTML={{ __html: post.content }} />

            <div className="post-tags">
              {post.tags &&
                post.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
            </div>

            <div className="author-bio">
              <div className="author-image">
                <Image
                  src={post.authorImage || "/placeholder.svg"}
                  alt={post.author}
                  width={80}
                  height={80}
                  loader={cloudinaryLoader}
                />
              </div>
              <div className="author-details">
                <h3>About {post.author}</h3>
                <p className="author-title">{post.authorTitle}</p>
                <p className="bio-text">
                  Expert in African art and culture with extensive knowledge of traditional craftsmanship and artistic
                  heritage.
                </p>
              </div>
            </div>
          </div>

          {relatedPosts.length > 0 && (
            <div className="related-posts">
              <h2>Related Articles</h2>
              <div className="related-grid">
                {relatedPosts.map((relatedPost) => (
                  <div className="related-card" key={relatedPost.id}>
                    <div className="related-image">
                      <Image
                        src={relatedPost.image || "/placeholder.svg"}
                        alt={relatedPost.title}
                        width={400}
                        height={250}
                        loader={cloudinaryLoader}
                      />
                    </div>
                    <div className="related-content">
                      <h3>{relatedPost.title}</h3>
                      <div className="related-meta">
                        <span className="related-date">{relatedPost.date}</span>
                      </div>
                      <Link href={`/blog/${relatedPost.slug}`} className="read-more">
                        Read Article
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="post-navigation">
            <Link href="/blog" className="back-to-blog">
              ← Back to Blog
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
