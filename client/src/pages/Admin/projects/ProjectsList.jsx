"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  EyeIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
} from "@heroicons/react/24/outline"
import { toast } from "react-toastify"
import projectsAPI from "@/APi/projects"
import authAPI from "@/APi/auth"

const ProjectsList = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [sortField, setSortField] = useState("projectName")
  const [sortDirection, setSortDirection] = useState("asc")

  // Fetch projects
  const { data, isLoading, error } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsAPI.getAllProjects,
  })

  // Delete project mutation
  const deleteMutation = useMutation({
    mutationFn: projectsAPI.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast.success("Project deleted successfully")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete project")
    },
  })

  // Handle project deletion
  const handleDelete = (projectId) => {
    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      deleteMutation.mutate(projectId)
    }
  }

  // Sort function
  const sortProjects = (a, b) => {
    let aValue = a[sortField]
    let bValue = b[sortField]

    // Handle dates
    if (sortField === "startDate" || sortField === "endDate") {
      aValue = new Date(aValue)
      bValue = new Date(bValue)
    }

    // Handle budget as number
    if (sortField === "projectBudget") {
      aValue = Number(aValue)
      bValue = Number(bValue)
    }

    if (aValue < bValue) {
      return sortDirection === "asc" ? -1 : 1
    }
    if (aValue > bValue) {
      return sortDirection === "asc" ? 1 : -1
    }
    return 0
  }

  // Handle sort change
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Filter and sort projects
  const filteredProjects =
    data?.data?.filter((project) => {
      const matchesSearch =
        project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.projectDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.projectLocation.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter ? project.status === statusFilter : true

      return matchesSearch && matchesStatus
    }) || []

  const sortedProjects = [...filteredProjects].sort(sortProjects)

  // Check if user is admin, redirect if not
  if (!authAPI.isAdmin()) {
    navigate("/dashboard")
    return null
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Projects</h1>
          <p className="text-gray-500 text-sm">Manage construction projects, budgets, and assignments.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/projects/create")}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create New Project
        </button>
      </div>

      {/* Search and filter */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Search */}
            <div>
              <label htmlFor="search" className="sr-only">
                Search Projects
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full bg-white py-2 pl-10 pr-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Search by name, description, or location"
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Status filter */}
            <div>
              <label htmlFor="status-filter" className="sr-only">
                Filter by Status
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <FunnelIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="status-filter"
                  name="status-filter"
                  className="block w-full bg-white py-2 pl-10 pr-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>
            </div>

            {/* Clear filters */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("")
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Projects list */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="text-center py-20">
            <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
            <p className="mt-2 text-gray-500">Loading projects...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500">Failed to load projects: {error.message}</p>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["projects"] })}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Retry
            </button>
          </div>
        ) : sortedProjects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">
              {searchTerm || statusFilter ? "No projects match your search criteria." : "No projects found."}
            </p>
            {(searchTerm || statusFilter) && (
              <button
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("")
                }}
                className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("projectName")}
                  >
                    <div className="flex items-center">
                      Project Name
                      {sortField === "projectName" && <ArrowsUpDownIcon className="ml-1 h-4 w-4" />}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("projectLocation")}
                  >
                    <div className="flex items-center">
                      Location
                      {sortField === "projectLocation" && <ArrowsUpDownIcon className="ml-1 h-4 w-4" />}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("startDate")}
                  >
                    <div className="flex items-center">
                      Start Date
                      {sortField === "startDate" && <ArrowsUpDownIcon className="ml-1 h-4 w-4" />}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("endDate")}
                  >
                    <div className="flex items-center">
                      End Date
                      {sortField === "endDate" && <ArrowsUpDownIcon className="ml-1 h-4 w-4" />}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("projectBudget")}
                  >
                    <div className="flex items-center">
                      Budget
                      {sortField === "projectBudget" && <ArrowsUpDownIcon className="ml-1 h-4 w-4" />}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center">
                      Status
                      {sortField === "status" && <ArrowsUpDownIcon className="ml-1 h-4 w-4" />}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedProjects.map((project) => (
                  <tr key={project._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{project.projectName}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{project.projectDescription}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{project.projectLocation}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{projectsAPI.formatDate(project.startDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{projectsAPI.formatDate(project.endDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${project.projectBudget.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${projectsAPI.getStatusBadgeColor(project.status)}`}
                      >
                        {projectsAPI.getStatusLabel(project.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/admin/projects/${project._id}`)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                        title="View Project"
                      >
                        <EyeIcon className="h-5 w-5" />
                        <span className="sr-only">View</span>
                      </button>
                      <button
                        onClick={() => navigate(`/admin/projects/edit/${project._id}`)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                        title="Edit Project"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                        <span className="sr-only">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(project._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Project"
                      >
                        <TrashIcon className="h-5 w-5" />
                        <span className="sr-only">Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectsList

