
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  ArrowPathIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline"
import authAPI from "../../api/auth"
import projectsAPI from "../../api/projects"

const ConsultantDashboard = () => {
  const navigate = useNavigate()
  const [isConsultant, setIsConsultant] = useState(false)
  const currentUser = authAPI.getCurrentUser()

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

  // Fetch assigned projects
  const {
    data: projectsData,
    isLoading: isLoadingProjects,
    error: projectsError,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: ["consultant-projects"],
    queryFn: () => projectsAPI.getProjectsByConsultant(currentUser?._id),
    enabled: !!currentUser?._id && isConsultant,
  })

  // Fetch recent reports
  const {
    data: reportsData,
    isLoading: isLoadingReports,
    error: reportsError,
  } = useQuery({
    queryKey: ["consultant-reports"],
    queryFn: () => projectsAPI.getReportsByConsultant(currentUser?._id),
    enabled: !!currentUser?._id && isConsultant,
  })

  if (!isConsultant) {
    return null
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Consultant Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {currentUser?.firstName} {currentUser?.lastName}. Here's an overview of your projects and
          reports.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* Active Projects */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingOfficeIcon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Projects</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {isLoadingProjects ? (
                        <ArrowPathIcon className="h-5 w-5 text-gray-400 animate-spin" />
                      ) : projectsError ? (
                        <XCircleIcon className="h-5 w-5 text-red-500" />
                      ) : (
                        projectsData?.data?.projects?.filter((p) => p.status !== "completed").length || 0
                      )}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <button
                onClick={() => navigate("/projects")}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                View all projects
              </button>
            </div>
          </div>
        </div>

        {/* Submitted Reports */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Submitted Reports</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {isLoadingReports ? (
                        <ArrowPathIcon className="h-5 w-5 text-gray-400 animate-spin" />
                      ) : reportsError ? (
                        <XCircleIcon className="h-5 w-5 text-red-500" />
                      ) : (
                        reportsData?.data?.reports?.length || 0
                      )}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <button
                onClick={() => navigate("/reports")}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                View all reports
              </button>
            </div>
          </div>
        </div>

        {/* Pending Reviews */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClipboardDocumentListIcon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Reviews</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {isLoadingProjects ? (
                        <ArrowPathIcon className="h-5 w-5 text-gray-400 animate-spin" />
                      ) : projectsError ? (
                        <XCircleIcon className="h-5 w-5 text-red-500" />
                      ) : (
                        projectsData?.data?.projects?.filter((p) => p.status === "review_needed").length || 0
                      )}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <button
                onClick={() => navigate("/projects?filter=review_needed")}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                View pending reviews
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h2 className="text-lg leading-6 font-medium text-gray-900">Recent Projects</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Your most recent assigned projects.</p>
          </div>
          <button
            onClick={() => navigate("/projects")}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            View all
          </button>
        </div>
        <div className="border-t border-gray-200">
          {isLoadingProjects ? (
            <div className="py-10 text-center">
              <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
              <p className="mt-2 text-gray-500">Loading projects...</p>
            </div>
          ) : projectsError ? (
            <div className="py-10 text-center">
              <XCircleIcon className="h-10 w-10 mx-auto text-red-500" />
              <p className="mt-2 text-gray-700">Error loading projects</p>
              <p className="text-sm text-red-500">{projectsError.message}</p>
              <button
                onClick={() => refetchProjects()}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Retry
              </button>
            </div>
          ) : !projectsData?.data?.projects || projectsData.data.projects.length === 0 ? (
            <div className="py-10 text-center">
              <BuildingOfficeIcon className="h-10 w-10 mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">No projects assigned yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {projectsData.data.projects.slice(0, 5).map((project) => (
                <li key={project._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <BuildingOfficeIcon className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-indigo-600 truncate">{project.projectName}</p>
                        <p className="text-sm text-gray-500 truncate">{project.location}</p>
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${
                          project.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : project.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : project.status === "review_needed"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {project.status.replace("_", " ").charAt(0).toUpperCase() +
                          project.status.replace("_", " ").slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        <span className="truncate">
                          {project.description.length > 100
                            ? `${project.description.substring(0, 100)}...`
                            : project.description}
                        </span>
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <button
                        onClick={() => navigate(`/projects/${project._id}`)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h2 className="text-lg leading-6 font-medium text-gray-900">Recent Reports</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Your most recent submitted reports.</p>
          </div>
          <button
            onClick={() => navigate("/reports")}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            View all
          </button>
        </div>
        <div className="border-t border-gray-200">
          {isLoadingReports ? (
            <div className="py-10 text-center">
              <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
              <p className="mt-2 text-gray-500">Loading reports...</p>
            </div>
          ) : reportsError ? (
            <div className="py-10 text-center">
              <XCircleIcon className="h-10 w-10 mx-auto text-red-500" />
              <p className="mt-2 text-gray-700">Error loading reports</p>
              <p className="text-sm text-red-500">{reportsError.message}</p>
            </div>
          ) : !reportsData?.data?.reports || reportsData.data.reports.length === 0 ? (
            <div className="py-10 text-center">
              <DocumentTextIcon className="h-10 w-10 mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">No reports submitted yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {reportsData.data.reports.slice(0, 5).map((report) => (
                <li key={report._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-indigo-600 truncate">{report.title}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {report.project?.projectName || "Unknown Project"}
                        </p>
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${
                          report.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : report.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : report.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        <span className="truncate">
                          {new Date(report.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <button
                        onClick={() => navigate(`/reports/${report._id}`)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        View Report
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConsultantDashboard

