"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import axios from 'axios';
import {
  ArrowPathIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  CubeIcon,
  ChevronLeftIcon,
  ChatBubbleLeftEllipsisIcon, // Added this import
  ClockIcon,                  // Also adding ClockIcon since it's used in comments section
  ExclamationTriangleIcon,    // Also adding this for error states
} from "@heroicons/react/24/outline"
import { toast } from "react-toastify"
import projectsAPI from "../../APi/projects"
import authAPI from "../../APi/auth"

const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  } catch (e) {
    console.error("Error formatting date:", e);
    return "Invalid Date";
  }
};


const ProjectManagerProjectDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentUser = authAPI.getCurrentUser()
  const [activeTab, setActiveTab] = useState("overview")
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [commentError, setCommentError] = useState(null);


  // Fetch project details
  const {
    data: projectData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsAPI.getProjectById(id),
  })

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

  // Check if user is assigned to this project
  useEffect(() => {
    if (projectData && currentUser) {
      const isAssigned = projectData.data.projectManager?._id === currentUser._id
      if (!isAssigned) {
        toast.error("You are not assigned to this project")
        navigate("/project-manager/projects")
      }
    }
  }, [projectData, currentUser, navigate])
  useEffect(() => {
    const fetchComments = async () => {
      if (!id) return;
      
      try {
        setIsLoadingComments(true);
        const token = localStorage.getItem('wku_cms_token');
        const response = await axios.get(`/api/comments/project/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setComments(response.data.data);
        setCommentError(null);
      } catch (error) {
        console.error('Error fetching comments:', error);
        setCommentError(error.message || 'Failed to load comments');
      } finally {
        setIsLoadingComments(false);
      }
    };

    fetchComments();
  }, [id]);


  const project = projectData?.data

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Project Description</h3>
              <p className="text-gray-700">{project.projectDescription}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Project Details</h3>
                <dl className="space-y-3">
                  <div className="flex items-center">
                    <dt className="text-sm font-medium text-gray-500 w-32">Location:</dt>
                    <dd className="text-sm text-gray-900">{project.projectLocation}</dd>
                  </div>
                  <div className="flex items-center">
                    <dt className="text-sm font-medium text-gray-500 w-32">Start Date:</dt>
                    <dd className="text-sm text-gray-900">{projectsAPI.formatDate(project.startDate)}</dd>
                  </div>
                  <div className="flex items-center">
                    <dt className="text-sm font-medium text-gray-500 w-32">End Date:</dt>
                    <dd className="text-sm text-gray-900">{projectsAPI.formatDate(project.endDate)}</dd>
                  </div>
                  <div className="flex items-center">
                    <dt className="text-sm font-medium text-gray-500 w-32">Duration:</dt>
                    <dd className="text-sm text-gray-900">
                      {project.duration ||
                        Math.ceil(
                          Math.abs(new Date(project.endDate) - new Date(project.startDate)) / (1000 * 60 * 60 * 24),
                        )}{" "}
                      days
                    </dd>
                  </div>
                  <div className="flex items-center">
                    <dt className="text-sm font-medium text-gray-500 w-32">Budget:</dt>
                    <dd className="text-sm text-gray-900">${project.projectBudget?.toLocaleString()}</dd>
                  </div>
                  <div className="flex items-center">
                    <dt className="text-sm font-medium text-gray-500 w-32">Status:</dt>
                    <dd className="text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${projectsAPI.getStatusBadgeColor(
                          project.status,
                        )}`}
                      >
                        {projectsAPI.getStatusLabel(project.status)}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Team Members</h3>
                <dl className="space-y-3">
                  <div className="flex items-center">
                    <dt className="text-sm font-medium text-gray-500 w-32">Project Manager:</dt>
                    <dd className="text-sm text-gray-900 flex items-center">
                      <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                        <UserIcon className="h-3 w-3 text-indigo-600" />
                      </div>
                      {project.projectManager?.firstName} {project.projectManager?.lastName}
                      {project.projectManager?._id === currentUser?._id && " (You)"}
                      {!project.projectManager?.isActive && (
                        <span className="ml-2 text-xs text-red-500">(Inactive)</span>
                      )}
                    </dd>
                  </div>
                  <div className="flex items-center">
                    <dt className="text-sm font-medium text-gray-500 w-32">Contractor:</dt>
                    <dd className="text-sm text-gray-900 flex items-center">
                      <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-2">
                        <UserIcon className="h-3 w-3 text-green-600" />
                      </div>
                      {project.contractor?.firstName} {project.contractor?.lastName}
                      {!project.contractor?.isActive && <span className="ml-2 text-xs text-red-500">(Inactive)</span>}
                    </dd>
                  </div>
                  <div className="flex items-center">
                    <dt className="text-sm font-medium text-gray-500 w-32">Consultant:</dt>
                    <dd className="text-sm text-gray-900 flex items-center">
                      <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                        <UserIcon className="h-3 w-3 text-blue-600" />
                      </div>
                      {project.consultant?.firstName} {project.consultant?.lastName}
                      {!project.consultant?.isActive && <span className="ml-2 text-xs text-red-500">(Inactive)</span>}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )
      case "materials":
        return (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Project Materials</h3>
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
                        Type
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
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {project.materials.map((material) => (
                      <tr key={material._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {material.materialName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.materialType}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {material.quantity} {material.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${material.costPerUnit?.toLocaleString()} per {material.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              material.status === "delivered"
                                ? "bg-green-100 text-green-800"
                                : material.status === "ordered"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : material.status === "in_use"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-red-100 text-red-800"
                            }`}
                          >
                            {material.status?.charAt(0).toUpperCase() + material.status?.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 italic">No materials have been added to this project yet.</p>
            )}
          </div>
        )
      case "schedules":
        return (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Project Schedules</h3>
            {project.schedules && project.schedules.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Schedule Name
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
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Assigned To
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {project.schedules.map((schedule) => (
                      <tr key={schedule._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {schedule.scheduleName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {projectsAPI.formatDate(schedule.startDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {projectsAPI.formatDate(schedule.endDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              schedule.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : schedule.status === "in_progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : schedule.status === "planned"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                            }`}
                          >
                            {schedule.status?.charAt(0).toUpperCase() + schedule.status?.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {schedule.assignedTo?.firstName} {schedule.assignedTo?.lastName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 italic">No schedules have been added to this project yet.</p>
            )}
          </div>
        )
      case "tasks":
        return (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Project Tasks</h3>
            {project.tasks && project.tasks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Task Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Description
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Due Date
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
                        Assigned To
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {project.tasks.map((task) => (
                      <tr key={task._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {task.taskName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{task.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {projectsAPI.formatDate(task.dueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              task.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : task.status === "in_progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : task.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                            }`}
                          >
                            {task.status?.charAt(0).toUpperCase() + task.status?.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {task.assignedTo?.firstName} {task.assignedTo?.lastName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 italic">No tasks have been added to this project yet.</p>
            )}
          </div>
        )
      case "comments":
        return (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <ChatBubbleLeftEllipsisIcon className="h-5 w-5 mr-2 text-gray-500"/> Comments
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {isLoadingComments ? (
              <div className="text-center py-4">
                <ArrowPathIcon className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Loading comments...</p>
              </div>
            ) : commentError ? (
              <div className="text-center py-4 text-red-600">
                <ExclamationTriangleIcon className="h-6 w-6 mx-auto text-red-500" />
                <p className="mt-2 text-sm">{commentError}</p>
              </div>
            ) : comments.length > 0 ? (
              <ul className="space-y-4">
                {comments.map((comment) => (
                  <li key={comment._id} className="border p-4 rounded-md bg-gray-50 shadow-sm">
                    <p className="text-sm text-gray-800 mb-2" style={{ whiteSpace: 'pre-wrap' }}>
                      {comment.content}
                    </p>
                    <div className="text-xs text-gray-500 flex items-center justify-between flex-wrap gap-2">
                      <span className="flex items-center">
                        <UserIcon className="h-3 w-3 mr-1 text-gray-400"/>
                        {comment.userId ? `${comment.userId.firstName} ${comment.userId.lastName}` : 'Unknown User'}
                      </span>
                      <span className="flex items-center">
                        <ClockIcon className="h-3 w-3 mr-1 text-gray-400"/>
                        {formatDateTime(comment.createdAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                <ChatBubbleLeftEllipsisIcon className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500 italic">No comments yet.</p>
              </div>
            )}
          </div>
        </div>
        )
      default:
        return <div>Select a tab to view project information</div>
    }
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/project-manager/projects")}
          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          <ChevronLeftIcon className="h-5 w-5 mr-1" />
          Back to Projects
        </button>
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
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Retry
          </button>
        </div>
      ) : project ? (
        <>
          {/* Project header */}
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="px-4 py-5 sm:px-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-gray-900 sm:truncate">{project.projectName}</h1>
                  <div className="mt-1 flex items-center">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${projectsAPI.getStatusBadgeColor(
                        project.status,
                      )}`}
                    >
                      {projectsAPI.getStatusLabel(project.status)}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      Created on {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0 flex flex-col sm:flex-row sm:space-x-3">
                  <button
                    onClick={() => navigate("/chats")}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-gray-500" />
                    Project Chat
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Project tabs */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px overflow-x-auto">
                <button
                  className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === "overview"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => setActiveTab("overview")}
                >
                  <BuildingOfficeIcon className="h-5 w-5 inline-block mr-2" />
                  Overview
                </button>
                <button
                  className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === "materials"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => setActiveTab("materials")}
                >
                  <CubeIcon className="h-5 w-5 inline-block mr-2" />
                  Materials
                  {project.materials?.length > 0 && (
                    <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                      {project.materials.length}
                    </span>
                  )}
                </button>
                <button
                  className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === "schedules"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => setActiveTab("schedules")}
                >
                  <CalendarIcon className="h-5 w-5 inline-block mr-2" />
                  Schedules
                  {project.schedules?.length > 0 && (
                    <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                      {project.schedules.length}
                    </span>
                  )}
                </button>
                <button
                  className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === "tasks"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => setActiveTab("tasks")}
                >
                  <ClipboardDocumentListIcon className="h-5 w-5 inline-block mr-2" />
                  Tasks
                  {project.tasks?.length > 0 && (
                    <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                      {project.tasks.length}
                    </span>
                  )}
                </button>
                <button
                  className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === "comments"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => setActiveTab("comments")}
                >
                  <DocumentTextIcon className="h-5 w-5 inline-block mr-2" />
                  Comments
                  {project.comments?.length > 0 && (
                    <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                      {project.comments.length}
                    </span>
                  )}
                </button>
              </nav>
            </div>

            {/* Tab content */}
            <div className="p-6">{renderTabContent()}</div>
          </div>
        </>
      ) : (
        <div className="text-center py-20 bg-white shadow rounded-lg">
          <p className="text-gray-500">Project not found</p>
        </div>
      )}
    </div>
  )
}

export default ProjectManagerProjectDetail
