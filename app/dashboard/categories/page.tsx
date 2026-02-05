"use client"

import { useState, useEffect } from "react"
import MainLayout from "../../../components/MainLayout"
import "./categories.css"

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  order: number
}

export default function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : "/api/categories"
      const method = editingCategory ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchCategories()
        setIsModalOpen(false)
        setEditingCategory(null)
        setFormData({ name: "", slug: "", description: "" })
      } else {
        const error = await response.json()
        alert(error.error || "Failed to save category")
      }
    } catch (error) {
      console.error("Error saving category:", error)
      alert("Failed to save category")
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchCategories()
      } else {
        alert("Failed to delete category")
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      alert("Failed to delete category")
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData(prev => ({
      ...prev,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    }))
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading categories...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="categories-management">
        <div className="container">
          <div className="header">
            <h1>Categories Management</h1>
            <button
              className="button primary-button"
              onClick={() => {
                setEditingCategory(null)
                setFormData({ name: "", slug: "", description: "" })
                setIsModalOpen(true)
              }}
            >
              Add New Category
            </button>
          </div>

          <div className="categories-grid">
            {categories.map((category) => (
              <div key={category.id} className="category-card">
                <div className="category-header">
                  <h3>{category.name}</h3>
                  <span className="category-order">Order: {category.order}</span>
                </div>
                <p className="category-slug">Slug: {category.slug}</p>
                {category.description && (
                  <p className="category-description">{category.description}</p>
                )}
                <div className="category-actions">
                  <button
                    className="button secondary-button"
                    onClick={() => handleEdit(category)}
                  >
                    Edit
                  </button>
                  <button
                    className="button danger-button"
                    onClick={() => handleDelete(category.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="empty-state">
              <p>No categories found. Create your first category!</p>
            </div>
          )}
        </div>

        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>{editingCategory ? "Edit Category" : "Add New Category"}</h2>
                <button
                  className="close-button"
                  onClick={() => setIsModalOpen(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Category Name</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={handleNameChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="slug">Slug</label>
                  <input
                    type="text"
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    required
                  />
                  <small>The slug is used in URLs and should be unique.</small>
                </div>
                <div className="form-group">
                  <label htmlFor="description">Description (Optional)</label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="button secondary-button"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="button primary-button">
                    {editingCategory ? "Update Category" : "Create Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
