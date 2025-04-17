"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowPathIcon,
  EyeIcon,
  FunnelIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon,
} from "@heroicons/react/24/outline"
import projectsAPI from "../../api/projects"
import authAPI from "../../api/auth"

const ProjectsListForProjectManager = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const currentUser = authAPI.getCurrentUser()

  // Fetch projects assigned to the current user (project manager)
  const {
    data: projectsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["myProjects"],
    queryFn: projectsAPI.getMyAssignedProjects,
  })

  // Filter projects based on search term and status
  const filteredProjects =
    projectsData?.data?.projects?.filter((project) => {
      const matchesSearch =
        project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.projectDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.projectLocation?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter ? project.status === statusFilter : true

      return matchesSearch && matchesStatus
    }) || []

  // Check if user is project manager, redirect if not
  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      navigate("/login")
      return
    }

    if (currentUser?.role !== "project_manager") {
      navigate("/dashboard")
    }
  }, [currentUser, navigate])

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">My Projects</h1>
          <p className="text-gray-500 text-sm">Manage and monitor all construction projects assigned to you.</p>
        </div>
      </div>

      {/* Search and filter */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Search */}
            <div className="md:col-span-2">
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
          </div>

          {/* Clear filters */}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("")
              }}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Clear Filters
            </button>
            <button
              type="button"
              onClick={() => refetch()}
              className="ml-3 inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Refresh
            </button>
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
              onClick={() => refetch()}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Retry
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 p-6">
            {filteredProjects.map((project) => (
              <div
                key={project._id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
              >
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">{project.projectName}</h3>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${projectsAPI.getStatusBadgeColor(
                        project.status,
                      )}`}
                    >
                      {projectsAPI.getStatusLabel(project.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{project.projectDescription}</p>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-1.5" />
                      <span className="text-gray-600">{project.projectLocation}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CalendarIcon className="h-4 w-4 text-gray-400 mr-1.5" />
                      <span className="text-gray-600">
                        {projectsAPI.formatDate(project.startDate)} - {projectsAPI.formatDate(project.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <ClockIcon className="h-4 w-4 text-gray-400 mr-1.5" />
                      <span className="text-gray-600">
                        {project.duration ||
                          Math.ceil(
                            Math.abs(new Date(project.endDate) - new Date(project.startDate)) / (1000 * 60 * 60 * 24),
                          )}{" "}
                        days
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-1.5" />
                      <span className="text-gray-600">${project.projectBudget?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
                  <button
                    onClick={() => navigate(`/projectmanager-projects/${project._id}`)}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectsListForProjectManager
