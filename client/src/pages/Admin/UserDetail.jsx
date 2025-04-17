"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowPathIcon, UserIcon } from "@heroicons/react/24/outline"
import api from "@/APi"
import authAPI from "@/APi/auth"

const UserDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await api.get(`/users/${id}`)
        setUser(response.data.data)
      } catch (err) {
        console.error("Error fetching user:", err)
        setError(err.message || "Failed to load user")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [id])

  if (!authAPI.isAdmin()) {
    navigate("/dashboard")
    return null
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">User Details</h1>
          <p className="text-gray-500 text-sm">View detailed information about a specific user.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/users")}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Back to Users
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="text-center py-20">
            <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
            <p className="mt-2 text-gray-500">Loading user details...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500">Failed to load user: {error}</p>
          </div>
        ) : user ? (
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-6">
              <div className="flex-shrink-0 h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-indigo-800" />
              </div>
              <div className="ml-5">
                <h3 className="text-lg font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-sm text-gray-500">Role: {user.role}</p>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.phone || "N/A"}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.isActive ? "Active" : "Inactive"}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Associated Projects</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.associatedProjects && user.associatedProjects.length > 0 ? (
                    <ul>
                      {user.associatedProjects.map((project) => (
                        <li key={project._id}>{project.projectName}</li>
                      ))}
                    </ul>
                  ) : (
                    "None"
                  )}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500">User not found.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserDetail
