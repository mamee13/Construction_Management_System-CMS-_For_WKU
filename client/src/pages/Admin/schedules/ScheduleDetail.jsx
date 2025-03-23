"use client"

import { Link, useParams, useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { toast } from "react-toastify"
import {
  CalendarIcon,
  ClockIcon,
  BuildingOfficeIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
// import schedulesAPI from "../../../api/schedules"
import schedulesAPI from "@/APi/schedules"

const ScheduleDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch schedule detail using React Query
  const { data: schedule, isLoading, error } = useQuery(
    ["schedule", id],
    () => schedulesAPI.getScheduleById(id),
    {
      onError: () => toast.error("Failed to load schedule details"),
    }
  )

  // Mutation for deleting schedule
  const deleteMutation = useMutation(schedulesAPI.deleteSchedule, {
    onSuccess: () => {
      toast.success("Schedule deleted successfully")
      queryClient.invalidateQueries(["schedules"])
      navigate("/admin/schedules")
    },
    onError: () => toast.error("Failed to delete schedule"),
  })

  // Mutation for updating task status
  const updateTaskMutation = useMutation(
    ({ taskId, newStatus }) => schedulesAPI.updateTaskStatus(id, taskId, newStatus),
    {
      onSuccess: (_, { taskId, newStatus }) => {
        // Update local schedule state after task status update
        queryClient.setQueryData(["schedule", id], (oldData) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            tasks: oldData.tasks.map((task) =>
              task.id === taskId ? { ...task, status: newStatus } : task
            ),
          }
        })
        toast.success("Task status updated")
      },
      onError: () => toast.error("Failed to update task status"),
    }
  )

  const handleDeleteSchedule = () => {
    if (window.confirm("Are you sure you want to delete this schedule?")) {
      deleteMutation.mutate(id)
    }
  }

  const handleUpdateTaskStatus = (taskId, newStatus) => {
    updateTaskMutation.mutate({ taskId, newStatus })
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "in-progress":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-gray-100 text-gray-800"
      case "blocked":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (error || !schedule) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">Schedule not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The schedule you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <div className="mt-6">
            <Link
              to="/admin/schedules"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Back to Schedules
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <Link to="/admin/schedules" className="mr-4 text-indigo-600 hover:text-indigo-900">
              <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
            </Link>
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {schedule.title}
            </h1>
          </div>
          <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <BuildingOfficeIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
              {schedule.projectName}
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
              {format(new Date(schedule.startDate), "MMM d, yyyy")} - {format(new Date(schedule.endDate), "MMM d, yyyy")}
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(schedule.status)}`}>
                {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <Link
            to={`/admin/schedules/edit/${id}`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PencilIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
            Edit
          </Link>
          <button
            onClick={handleDeleteSchedule}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <TrashIcon className="-ml-1 mr-2 h-5 w-5" />
            Delete
          </button>
        </div>
      </div>

      {schedule.description && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Description</h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <p className="text-sm text-gray-500 whitespace-pre-line">{schedule.description}</p>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Team Members</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">People assigned to this schedule</p>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {schedule.assignedUsers && schedule.assignedUsers.length > 0 ? (
              schedule.assignedUsers.map((user) => (
                <li key={user.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-800 font-medium">
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1).replace("_", " ")}
                      </div>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-4 sm:px-6 text-sm text-gray-500">
                No team members assigned to this schedule.
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Tasks</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Schedule tasks and their status</p>
        </div>
        <div className="border-t border-gray-200">
          {schedule.tasks && schedule.tasks.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {schedule.tasks.map((task) => (
                <li key={task.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-gray-500 mt-1">{task.description}</div>
                      )}
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <ClockIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                        {format(new Date(task.startDate), "MMM d, yyyy")} - {format(new Date(task.endDate), "MMM d, yyyy")}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(task.status)}`}
                      >
                        {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                      </span>
                      <div className="ml-4 flex space-x-2">
                        {task.status !== "completed" && (
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, "completed")}
                            className="text-green-600 hover:text-green-900"
                            title="Mark as completed"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </button>
                        )}
                        {task.status !== "blocked" && task.status !== "completed" && (
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, "blocked")}
                            className="text-orange-600 hover:text-orange-900"
                            title="Mark as blocked"
                          >
                            <XCircleIcon className="h-5 w-5" />
                          </button>
                        )}
                        {task.status !== "in-progress" && task.status !== "completed" && (
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, "in-progress")}
                            className="text-blue-600 hover:text-blue-900"
                            title="Mark as in progress"
                          >
                            <ClockIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-4 sm:px-6 text-sm text-gray-500">No tasks added to this schedule.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ScheduleDetail
