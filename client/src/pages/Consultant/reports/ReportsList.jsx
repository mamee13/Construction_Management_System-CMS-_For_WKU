"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  DocumentTextIcon,
  ArrowPathIcon,
  XCircleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline"
import authAPI from "../../../api/auth"
import reportsAPI from "../../../api/reports"
import projectsAPI from "../../../api/projects"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const ReportsList = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isConsultant, setIsConsultant] = useState(false)
  const currentUser = authAPI.getCurrentUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [projectFilter, setProjectFilter] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [reportToDelete, setReportToDelete] = useState(null)
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  })

  useEffect(() => {
    // Check if user is a consultant
    const checkConsultant = () => {
      const userRole = currentUser?.role
      setIsConsultant(userRole === "consultant")

      if (userRole !== "consultant") {
        navigate("/dashboard")
      }
    }

    checkConsultant()
  }, [currentUser, navigate])

  // Fetch consultant's projects for the filter dropdown
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["consultant-projects"],
    queryFn: () => projectsAPI.getProjectsByConsultant(currentUser?._id),
    enabled: !!currentUser?._id && isConsultant,
  })

  // Fetch reports with filters
  const {
    data: reportsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["consultant-reports", projectFilter, typeFilter, statusFilter, dateRange],
    queryFn: () => {
      const params = {
        userId: currentUser?._id,
      }

      if (projectFilter) params.projectId = projectFilter
      if (typeFilter) params.type = typeFilter
      if (statusFilter) params.status = statusFilter
      if (dateRange.startDate) params.startDate = dateRange.startDate
      if (dateRange.endDate) params.endDate = dateRange.endDate

      return reportsAPI.getReports(params)
    },
    enabled: !!currentUser?._id && isConsultant,
  })

  // Delete report mutation
  const deleteReportMutation = useMutation({
    mutationFn: (reportId) => reportsAPI.deleteReport(reportId),
    onSuccess: () => {
      toast.success("Report deleted successfully")
      queryClient.invalidateQueries({ queryKey: ["consultant-reports"] })
      setIsDeleting(false)
      setReportToDelete(null)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete report")
      setIsDeleting(false)
    },
  })

  // Filter reports based on search term
  const filteredReports = reportsData?.data
    ? reportsData.data.filter(
        (report) =>
          searchTerm === "" ||
          report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.project?.projectName?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : []

  // Handle date range change
  const handleDateRangeChange = (e) => {
    const { name, value } = e.target
    setDateRange((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("")
    setStatusFilter("")
    setTypeFilter("")
    setProjectFilter("")
    setDateRange({ startDate: "", endDate: "" })
  }

  // Handle delete confirmation
  const confirmDelete = (reportId) => {
    setReportToDelete(reportId)
  }

  // Handle delete report
  const handleDelete = () => {
    setIsDeleting(true)
    deleteReportMutation.mutate(reportToDelete)
  }

  // Cancel delete
  const cancelDelete = () => {
    setReportToDelete(null)
  }

  if (!isConsultant) {
    return null
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Reports</h1>
          <p className="mt-1 text-sm text-gray-500">View and manage all reports you've submitted as a consultant.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => navigate("/reports/create")}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create New Report
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {reportToDelete && (
        <div className="fixed inset-0 flex z-40">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => cancelDelete()}></div>
          <div className="relative flex-1 flex flex-col max-w-md m-auto p-6 bg-white rounded-lg shadow-xl">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Delete Report</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this report? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                onClick={cancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Search and Filter */}
      <div className="bg-white shadow rounded-lg mb-6 overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Search & Filter Reports</h3>
          <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
            {/* Search Term */}
            <div className="sm:col-span-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Search by report title or project name..."
                />
              </div>
            </div>

            {/* Project Filter */}
            <div className="sm:col-span-2">
              <label htmlFor="project-filter" className="block text-sm font-medium text-gray-700">
                Project
              </label>
              <select
                id="project-filter"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                disabled={isLoadingProjects}
              >
                <option value="">All Projects</option>
                {projectsData?.data?.projects?.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.projectName}
                  </option>
                ))}
              </select>
            </div>

            {/* Report Type Filter */}
            <div className="sm:col-span-2">
              <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700">
                Report Type
              </label>
              <select
                id="type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">All Types</option>
                <option value="progress">Progress Report</option>
                <option value="monthly_progress">Monthly Progress</option>
                <option value="weekly_progress">Weekly Progress</option>
                <option value="inspection">Inspection Report</option>
                <option value="quality">Quality Assessment</option>
                <option value="issue">Issue Report</option>
                <option value="final">Final Report</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="sm:col-span-2">
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="pending">Pending</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="sm:col-span-3">
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
                From Date
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="date"
                  name="startDate"
                  id="start-date"
                  value={dateRange.startDate}
                  onChange={handleDateRangeChange}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">
                To Date
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="date"
                  name="endDate"
                  id="end-date"
                  value={dateRange.endDate}
                  onChange={handleDateRangeChange}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {isLoading ? (
          <div className="py-20 text-center">
            <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
            <p className="mt-2 text-gray-500">Loading reports...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <XCircleIcon className="h-10 w-10 mx-auto text-red-500" />
            <p className="mt-2 text-gray-700">Error loading reports</p>
            <p className="text-sm text-red-500">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Retry
            </button>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="py-20 text-center">
            <ClipboardDocumentListIcon className="h-10 w-10 mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">
              {searchTerm || statusFilter || typeFilter || projectFilter || dateRange.startDate || dateRange.endDate
                ? "No reports match your search criteria."
                : "No reports submitted yet."}
            </p>
            {(searchTerm ||
              statusFilter ||
              typeFilter ||
              projectFilter ||
              dateRange.startDate ||
              dateRange.endDate) && (
              <button
                onClick={resetFilters}
                className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Clear filters
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
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Report
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Project
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date Submitted
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{report.title}</div>
                          <div className="text-sm text-gray-500">
                            {report.periodStartDate && report.periodEndDate && (
                              <>
                                {reportsAPI.formatDate(report.periodStartDate, { month: "short", day: "numeric" })} -{" "}
                                {reportsAPI.formatDate(report.periodEndDate, { month: "short", day: "numeric" })}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{report.project?.projectName || "Unknown Project"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{reportsAPI.getReportTypeLabel(report.type)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${reportsAPI.getReportStatusColor(report.status)}`}
                      >
                        {reportsAPI.getReportStatusLabel(report.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reportsAPI.formatDate(report.generatedAt || report.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/reports/${report._id}`)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View
                        </button>
                        {(report.status === "draft" || report.status === "pending") && (
                          <>
                            <button
                              onClick={() => navigate(`/reports/edit/${report._id}`)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => confirmDelete(report._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination - if API supports it */}
        {reportsData?.pagination && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => {
                  // Handle previous page
                }}
                disabled={reportsData.pagination.page <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => {
                  // Handle next page
                }}
                disabled={reportsData.pagination.page >= reportsData.pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">
                    {(reportsData.pagination.page - 1) * reportsData.pagination.limit + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(reportsData.pagination.page * reportsData.pagination.limit, reportsData.total)}
                  </span>{" "}
                  of <span className="font-medium">{reportsData.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => {
                      // Handle previous page
                    }}
                    disabled={reportsData.pagination.page <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">Previous</span>
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {/* Page numbers would go here */}
                  {Array.from({ length: Math.min(5, reportsData.pagination.totalPages) }).map((_, i) => {
                    const pageNum = i + 1
                    return (
                      <button
                        key={pageNum}
                        onClick={() => {
                          // Handle page change
                        }}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === reportsData.pagination.page
                            ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}

                  <button
                    onClick={() => {
                      // Handle next page
                    }}
                    disabled={reportsData.pagination.page >= reportsData.pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">Next</span>
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReportsList

