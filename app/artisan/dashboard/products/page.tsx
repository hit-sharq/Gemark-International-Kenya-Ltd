"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import "./products.css"

interface Product {
  id: string
  title: string
  description: string
  price: number
  categoryId: string
  category: { name: string }
  material: string | null
  region: string
  size: string
  images: string[]
  featured: boolean
  createdAt: string
  _count: { orderRequests: number }
}

interface Category {
  id: string
  name: string
}

export default function ProductsManagementPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    categoryId: "",
    material: "",
    region: "",
    size: "",
    images: [] as string[],
  })

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/artisans/me/products")
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/artisan/login")
          return
        }
        if (response.status === 403) {
          setError("Your account is pending approval.")
          setIsLoading(false)
          return
        }
        throw new Error("Failed to fetch products")
      }
      const data = await response.json()
      setProducts(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        title: product.title,
        description: product.description,
        price: product.price.toString(),
        categoryId: product.categoryId,
        material: product.material || "",
        region: product.region,
        size: product.size,
        images: product.images || [],
      })
    } else {
      setEditingProduct(null)
      setFormData({
        title: "",
        description: "",
        price: "",
        categoryId: "",
        material: "",
        region: "",
        size: "",
        images: [],
      })
    }
    setShowModal(true)
    setError("")
    setSuccess("")
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingProduct(null)
    setFormData({
      title: "",
      description: "",
      price: "",
      categoryId: "",
      material: "",
      region: "",
      size: "",
      images: [],
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError("")
    setSuccess("")

    try {
      const url = editingProduct
        ? `/api/artisans/me/products/${editingProduct.id}`
        : "/api/artisans/me/products"

      const response = await fetch(url, {
        method: editingProduct ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save product")
      }

      setSuccess(editingProduct ? "Product updated successfully!" : "Product created successfully!")
      handleCloseModal()
      fetchProducts()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/artisans/me/products/${productId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete product")
      }

      setSuccess("Product deleted successfully!")
      fetchProducts()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalProducts = products.length
  const featuredProducts = products.filter((p) => p.featured).length

  if (isLoading) {
    return (
      <div className="products-management">
        <aside className="dashboard-sidebar">
          <div className="sidebar-header">
            <h2>Artisan Dashboard</h2>
          </div>
          <nav className="sidebar-nav">
            <Link href="/artisan/dashboard" className="nav-item">
              <span className="nav-icon">📊</span>
              Overview
            </Link>
            <Link href="/artisan/dashboard/shop" className="nav-item">
              <span className="nav-icon">🏪</span>
              My Shop
            </Link>
            <Link href="/artisan/dashboard/products" className="nav-item active">
              <span className="nav-icon">🎨</span>
              My Products
            </Link>
            <Link href="/artisan/dashboard/orders" className="nav-item">
              <span className="nav-icon">📦</span>
              Orders
            </Link>
            <Link href="/artisan/dashboard/settings" className="nav-item">
              <span className="nav-icon">⚙️</span>
              Settings
            </Link>
          </nav>
          <div className="sidebar-footer">
            <Link href="/" className="nav-item">
              <span className="nav-icon">🏠</span>
              Back to Site
            </Link>
          </div>
        </aside>

        <main className="dashboard-main">
          <div className="loading-spinner"></div>
          <p style={{ textAlign: "center", color: "#6c757d" }}>Loading products...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="products-management">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2>Artisan Dashboard</h2>
        </div>
        <nav className="sidebar-nav">
          <Link href="/artisan/dashboard" className="nav-item">
            <span className="nav-icon">📊</span>
            Overview
          </Link>
          <Link href="/artisan/dashboard/shop" className="nav-item">
            <span className="nav-icon">🏪</span>
            My Shop
          </Link>
          <Link href="/artisan/dashboard/products" className="nav-item active">
            <span className="nav-icon">🎨</span>
            My Products
          </Link>
          <Link href="/artisan/dashboard/orders" className="nav-item">
            <span className="nav-icon">📦</span>
            Orders
          </Link>
          <Link href="/artisan/dashboard/settings" className="nav-item">
            <span className="nav-icon">⚙️</span>
            Settings
          </Link>
        </nav>
        <div className="sidebar-footer">
          <Link href="/" className="nav-item">
            <span className="nav-icon">🏠</span>
            Back to Site
          </Link>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>My Products</h1>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              <span>➕</span>
              Add New Product
            </button>
          </div>
        </header>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon">🎨</div>
            <div className="stat-info">
              <h3>{totalProducts}</h3>
              <p>Total Products</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-info">
              <h3>{featuredProducts}</h3>
              <p>Featured</p>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="products-section">
          <div className="section-header">
            <h2 className="section-title">All Products</h2>
            <div className="search-box">
              <input
                type="text"
                className="search-input"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎨</div>
              <h3>{products.length === 0 ? "No products yet" : "No matching products"}</h3>
              <p>
                {products.length === 0
                  ? "Start by adding your first product to sell"
                  : "Try a different search term"}
              </p>
              {products.length === 0 && (
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                  <span>➕</span>
                  Add Your First Product
                </button>
              )}
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <div key={product.id} className="product-card">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={product.title}
                      width={300}
                      height={180}
                      className="product-image"
                    />
                  ) : (
                    <div
                      className="product-image"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "3rem",
                        background: "#f8f9fa",
                      }}
                    >
                      🎨
                    </div>
                  )}
                  <div className="product-info">
                    <div className="product-category">{product.category.name}</div>
                    <h3 className="product-title">{product.title}</h3>
                    <div className="product-price">${product.price.toFixed(2)}</div>
                    <div className="product-meta">
                      <span>📏 {product.size}</span>
                      <span>📍 {product.region}</span>
                      {product.material && <span>🎯 {product.material}</span>}
                    </div>
                    <div className="product-actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenModal(product)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(product.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingProduct ? "Edit Product" : "Add New Product"}</h2>
                <button className="modal-close" onClick={handleCloseModal}>
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && <div className="error-message">{error}</div>}

                  <div className="form-group">
                    <label className="form-label" htmlFor="title">
                      Product Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      className="form-input"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Enter product title"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="description">
                      Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      className="form-textarea"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe your product..."
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="price">
                        Price (USD) *
                      </label>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        className="form-input"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="categoryId">
                        Category *
                      </label>
                      <select
                        id="categoryId"
                        name="categoryId"
                        className="form-select"
                        value={formData.categoryId}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="region">
                        Region *
                      </label>
                      <input
                        type="text"
                        id="region"
                        name="region"
                        className="form-input"
                        value={formData.region}
                        onChange={handleChange}
                        placeholder="e.g., Nairobi, Coastal"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="size">
                        Size *
                      </label>
                      <input
                        type="text"
                        id="size"
                        name="size"
                        className="form-input"
                        value={formData.size}
                        onChange={handleChange}
                        placeholder="e.g., 50cm x 70cm"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="material">
                      Material
                    </label>
                    <input
                      type="text"
                      id="material"
                      name="material"
                      className="form-input"
                      value={formData.material}
                      onChange={handleChange}
                      placeholder="e.g., Acrylic on canvas, Hand-carved wood"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Product Images</label>
                    <div className="image-upload-area">
                      <div className="image-upload-icon">📷</div>
                      <p className="image-upload-text">
                        Click to upload or drag and drop
                      </p>
                      <p className="image-upload-hint">
                        PNG, JPG up to 5MB each
                      </p>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    {isSaving
                      ? "Saving..."
                      : editingProduct
                      ? "Update Product"
                      : "Create Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

