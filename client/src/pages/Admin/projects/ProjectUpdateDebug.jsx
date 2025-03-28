"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { ArrowPathIcon } from "@heroicons/react/24/outline"
import api from "../../../api/index"
import authAPI from "../../../api/auth"

const ProjectUpdateDebug = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updateMethod, setUpdateMethod] = useState("put")
  const [updating, setUpdating] = useState(false)
  const [updateResponse, setUpdateResponse] = useState(null)
  const [updateError, setUpdateError] = useState(null)
  const [requestTimeout, setRequestTimeout] = useState(30000)

  // Check if user is admin
  useEffect(() => {
    if (!authAPI.isAdmin()) {
      navigate("/dashboard")
    }
  }, [navigate])

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true)
        const response = await api.get(`/projects/${id}`)
        setProject(response.data.data)
        setError(null)
      } catch (err) {
        console.error("Error fetching project:", err)
        setError(err.message || "Failed to load project")
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [id])

  // Handle update attempt
  const handleUpdate = async () => {
    try {
      setUpdating(true)
      setUpdateResponse(null)
      setUpdateError(null)

      // Make a copy of the project data for updating
      const projectData = { ...project }

      // Remove any fields that might cause issues
      delete projectData._id
      delete projectData.__v
      delete projectData.createdAt
      delete projectData.updatedAt

      // Format dates
      if (projectData.startDate) {
        projectData.startDate = new Date(projectData.startDate).toISOString()
      }
      if (projectData.endDate) {
        projectData.endDate = new Date(projectData.endDate).toISOString()
      }

      let response

      // Try different update methods based on selection
      switch (updateMethod) {
        case "put":
          response = await api.put(`/projects/${id}`, projectData, {
            timeout: requestTimeout,
            headers: {
              "Content-Type": "application/json",
            },
          })
          break
        case "post":
          response = await api.post(`/projects/update/${id}`, projectData, {
            timeout: requestTimeout,
            headers: {
              "Content-Type": "application/json",
            },
          })
          break
        case "patch":
          response = await api.patch(`/projects/${id}`, projectData, {
            timeout: requestTimeout,
            headers: {
              "Content-Type": "application/json",
            },
          })
          break
        case "alternative":
          // Delete and recreate approach
          await api.delete(`/projects/${id}`)
          response = await api.post("/projects", projectData, {
            timeout: requestTimeout,
          })
          break
        default:
          throw new Error("Invalid update method")
      }

      setUpdateResponse(response.data)
      toast.success("Update successful!")
    } catch (err) {
      console.error("Update error:", err)
      setUpdateError(err.response?.data || err.message || "Update failed")
      toast.error("Update failed. See details below.")
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Project Update Debug Tool</h1>
        <p className="text-gray-500">This tool helps diagnose and fix issues with project updates.</p>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Project Information</h2>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <ArrowPathIcon className="h-8 w-8 text-indigo-500 animate-spin" />
              <span className="ml-2 text-gray-600">Loading project data...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">Error loading project: {error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 text-sm font-medium text-red-700 hover:text-red-600"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          ) : project ? (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Project Name</h3>
                  <p className="mt-1 text-sm text-gray-900">{project.projectName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <p className="mt-1 text-sm text-gray-900">{project.status}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">ID</h3>
                  <p className="mt-1 text-sm text-gray-900">{project._id}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Update Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center">
                    <input
                      id="put-method"
                      name="update-method"
                      type="radio"
                      checked={updateMethod === "put"}
                      onChange={() => setUpdateMethod("put")}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <label htmlFor="put-method" className="ml-2 block text-sm text-gray-700">
                      PUT /projects/:id
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="post-method"
                      name="update-method"
                      type="radio"
                      checked={updateMethod === "post"}
                      onChange={() => setUpdateMethod("post")}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <label htmlFor="post-method" className="ml-2 block text-sm text-gray-700">
                      POST /projects/update/:id
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="patch-method"
                      name="update-method"
                      type="radio"
                      checked={updateMethod === "patch"}
                      onChange={() => setUpdateMethod("patch")}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <label htmlFor="patch-method" className="ml-2 block text-sm text-gray-700">
                      PATCH /projects/:id
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="alternative-method"
                      name="update-method"
                      type="radio"
                      checked={updateMethod === "alternative"}
                      onChange={() => setUpdateMethod("alternative")}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <label htmlFor="alternative-method" className="ml-2 block text-sm text-gray-700">
                      Delete & Recreate
                    </label>
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="timeout" className="block text-sm font-medium text-gray-700">
                    Request Timeout (ms)
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="number"
                      name="timeout"
                      id="timeout"
                      className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-md sm:text-sm border-gray-300"
                      value={requestTimeout}
                      onChange={(e) => setRequestTimeout(Number(e.target.value))}
                      min="5000"
                      step="5000"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Increase this value if you're experiencing timeout errors (default: 30000ms)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={updating}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    updating ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  {updating ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Try Update"
                  )}
                </button>
              </div>

              {updateResponse && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                  <h3 className="text-sm font-medium text-green-800 mb-2">Update Successful</h3>
                  <pre className="text-xs text-green-700 overflow-auto max-h-60">
                    {JSON.stringify(updateResponse, null, 2)}
                  </pre>
                </div>
              )}

              {updateError && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                  <h3 className="text-sm font-medium text-red-800 mb-2">Update Failed</h3>
                  <pre className="text-xs text-red-700 overflow-auto max-h-60">
                    {typeof updateError === "object" ? JSON.stringify(updateError, null, 2) : updateError}
                  </pre>
                </div>
              )}

              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Project Data</h3>
                <pre className="text-xs text-gray-600 overflow-auto max-h-60">{JSON.stringify(project, null, 2)}</pre>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No project data available</p>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => navigate(`/admin/projects/${id}`)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Back to Project
        </button>
        <button
          type="button"
          onClick={() => navigate("/admin/projects")}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Back to Projects List
        </button>
      </div>
    </div>
  )
}

export default ProjectUpdateDebug

