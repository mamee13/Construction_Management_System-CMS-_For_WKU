"use client"

import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
  CalendarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  UserIcon,
  ClockIcon,
} from "@heroicons/react/24/outline"
import { toast } from "react-toastify"

import projectsAPI from "@/APi/projects"
import usersAPI from "@/APi/users"
import authAPI from "@/APi/auth"

const ProjectDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch project details
  const {
    data: projectData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsAPI.getProjectById(id),
  })

  // Fetch contractor and consultant details
  const { data: contractorData, isLoading: isLoadingContractor } = useQuery({
    queryKey: ["user", projectData?.data?.contractor],
    queryFn: () => usersAPI.getUserById(projectData?.data?.contractor),
    enabled: !!projectData?.data?.contractor,
  })

  const { data: consultantData, isLoading: isLoadingConsultant } = useQuery({
    queryKey: ["user", projectData?.data?.consultant],
    queryFn: () => usersAPI.getUserById(projectData?.data?.consultant),
    enabled: !!projectData?.data?.consultant,
  })

  // Delete project mutation
  const deleteMutation = useMutation({
    mutationFn: projectsAPI.deleteProject,
    onSuccess: () => {
      toast.success("Project deleted successfully")
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      navigate("/admin/projects")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete project")
      setIsDeleting(false)
    },
  })

  // Handle project deletion
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      setIsDeleting(true)
      deleteMutation.mutate(id)
    }
  }

  // Calculate project duration
  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Check if user is admin, redirect if not
  if (!authAPI.isAdmin()) {
    navigate("/dashboard")
    return null
  }

  const project = projectData?.data

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {isLoading ? "Loading Project..." : project?.projectName}
          </h1>
          <p className="text-gray-500 text-sm">View project details, budget, and assignments.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            type="button"
            onClick={() => navigate("/admin/projects")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Projects
          </button>
          <button
            type="button"
            onClick={() => navigate(`/admin/projects/edit/${id}`)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PencilSquareIcon className="h-5 w-5 mr-2" />
            Edit Project
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${isDeleting ? "bg-red-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"} 
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
          >
            {isDeleting ? (
              <>
                <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <TrashIcon className="h-5 w-5 mr-2" />
                Delete Project
              </>
            )}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 bg-white shadow rounded-lg">
          <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
          <p className="mt-2 text-gray-500">Loading project details...</p>
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-white shadow rounded-lg">
          <p className="text-red-500">Failed to load project: {error.message}</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["project", id] })}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Retry
          </button>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Project Information</h3>
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${projectsAPI.getStatusBadgeColor(project.status)}`}
              >
                {projectsAPI.getStatusLabel(project.status)}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">{project.projectDescription}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <MapPinIcon className="h-5 w-5 mr-1 text-gray-400" />
                  Location
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{project.projectLocation}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-1 text-gray-400" />
                  Start Date
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{projectsAPI.formatDate(project.startDate)}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-1 text-gray-400" />
                  End Date
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{projectsAPI.formatDate(project.endDate)}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <ClockIcon className="h-5 w-5 mr-1 text-gray-400" />
                  Duration
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {calculateDuration(project.startDate, project.endDate)} days
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <CurrencyDollarIcon className="h-5 w-5 mr-1 text-gray-400" />
                  Budget
                </dt>
                <dd className="mt-1 text-sm text-gray-900">${project.projectBudget.toLocaleString()}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <UserIcon className="h-5 w-5 mr-1 text-gray-400" />
                  Contractor
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {isLoadingContractor ? (
                    <span className="text-gray-500">Loading...</span>
                  ) : contractorData?.data ? (
                    `${contractorData.data.firstName} ${contractorData.data.lastName}`
                  ) : (
                    <span className="text-red-500">Not found</span>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <UserIcon className="h-5 w-5 mr-1 text-gray-400" />
                  Consultant
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {isLoadingConsultant ? (
                    <span className="text-gray-500">Loading...</span>
                  ) : consultantData?.data ? (
                    `${consultantData.data.firstName} ${consultantData.data.lastName}`
                  ) : (
                    <span className="text-red-500">Not found</span>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900">{projectsAPI.formatDate(project.createdAt)}</dd>
              </div>
            </dl>
          </div>

          {/* Materials, Schedules, and Comments sections would go here */}
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Materials</h3>
            {project.materials && project.materials.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Material Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Quantity
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Material items would be mapped here */}
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" colSpan="3">
                        No materials data available yet.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No materials assigned to this project yet.</p>
            )}
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Schedules</h3>
            {project.schedules && project.schedules.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Task
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Start Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        End Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Schedule items would be mapped here */}
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" colSpan="4">
                        No schedule data available yet.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No schedules assigned to this project yet.</p>
            )}
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Comments</h3>
            {project.comments && project.comments.length > 0 ? (
              <ul className="space-y-4">
                {/* Comments would be mapped here */}
                <li className="text-sm text-gray-500">No comments available yet.</li>
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No comments on this project yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectDetail

