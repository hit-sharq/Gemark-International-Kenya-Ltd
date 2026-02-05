"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getTeamMembers, deleteTeamMember } from "@/app/actions/team-actions"

type TeamMember = {
  id: string
  name: string
  title: string
  bio: string
  image: string
  order: number
}

export default function TeamManagementSection() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function fetchTeamMembers() {
      try {
        const result = await getTeamMembers()
        if (result.success) {
          setTeamMembers(result.teamMembers || [])
        } else {
          setError(result.message || "Failed to fetch team members")
        }
      } catch (err) {
        console.error("Error fetching team members:", err)
        setError("An unexpected error occurred. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchTeamMembers()
  }, [])

  const handleAddNew = () => {
    console.log("Navigating to team member creation page")
    window.location.href = "/dashboard/team-members/new"
  }

  const handleEdit = (id: string) => {
    window.location.href = `/dashboard/team-members/edit/${id}`
  }

  const confirmDelete = (id: string) => {
    setDeleteId(id)
  }

  const cancelDelete = () => {
    setDeleteId(null)
  }

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    try {
      const result = await deleteTeamMember(id)
      if (result.success) {
        setTeamMembers(teamMembers.filter((member) => member.id !== id))
      } else {
        setError(result.message || "Failed to delete team member")
      }
    } catch (err) {
      console.error("Error deleting team member:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  if (loading) {
    return <div className="p-4">Loading team members...</div>
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
        <button onClick={() => window.location.reload()} className="btn btn-primary">
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Team Members</h2>
        <button onClick={handleAddNew} className="btn btn-primary">
          Add New Team Member
        </button>
      </div>

      {teamMembers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No team members found.</p>
          <button onClick={handleAddNew} className="btn btn-primary mt-4">
            Add Your First Team Member
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Title</th>
                <th>Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className="avatar">
                      <div className="w-12 h-12 rounded-full overflow-hidden">
                        <img
                          src={member.image || "/placeholder.svg?height=48&width=48"}
                          alt={member.name}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    </div>
                  </td>
                  <td>{member.name}</td>
                  <td>{member.title}</td>
                  <td>{member.order}</td>
                  <td>
                    {deleteId === member.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDelete(member.id)}
                          disabled={isDeleting}
                          className="btn btn-error btn-sm"
                        >
                          {isDeleting ? "Deleting..." : "Confirm"}
                        </button>
                        <button onClick={cancelDelete} disabled={isDeleting} className="btn btn-ghost btn-sm">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <button onClick={() => handleEdit(member.id)} className="btn btn-primary btn-sm">
                          Edit
                        </button>
                        <button onClick={() => confirmDelete(member.id)} className="btn btn-ghost btn-sm">
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
