

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import schedulesAPI from "../../../api/schedules";

const SchedulesList = () => {
  console.log("SchedulesList component loaded");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);

  // Fetch schedules using getAllSchedules endpoint.
  const {
    data: schedulesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["schedules"],
    queryFn: schedulesAPI.getAllSchedules,
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: schedulesAPI.deleteSchedule,
    onSuccess: () => {
      toast.success("Schedule deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      setIsDeleting(false);
      setScheduleToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete schedule");
      setIsDeleting(false);
    },
  });

  // Handle delete confirmation
  const confirmDelete = (scheduleId) => {
    setScheduleToDelete(scheduleId);
  };

  // Handle delete schedule
  const handleDelete = () => {
    setIsDeleting(true);
    deleteScheduleMutation.mutate(scheduleToDelete);
  };

  // Cancel delete
  const cancelDelete = () => {
    setScheduleToDelete(null);
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            In Progress
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Completed
          </span>
        );
      case "delayed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Delayed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
          </span>
        );
    }
  };

  // Debug: Log fetched data structure
  console.log("Fetched schedulesData:", schedulesData);

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Schedules</h1>
          <p className="text-gray-500 text-sm">
            Manage construction project schedules and timelines.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            type="button"
            onClick={() => navigate("/admin/schedules/create")}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Schedule
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {scheduleToDelete && (
        <div className="fixed inset-0 flex z-40">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => cancelDelete()}
          ></div>
          <div className="relative flex-1 flex flex-col max-w-md m-auto p-6 bg-white rounded-lg shadow-xl">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Delete Schedule</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this schedule? This action cannot be undone.
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

      {/* Schedules List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {isLoading ? (
          <div className="py-20 text-center">
            <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
            <p className="mt-2 text-gray-500">Loading schedules...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <XCircleIcon className="h-10 w-10 mx-auto text-red-500" />
            <p className="mt-2 text-gray-700">Error loading schedules</p>
            <p className="text-sm text-red-500">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Retry
            </button>
          </div>
        ) : schedulesData?.schedules?.length === 0 ? (
          <div className="py-20 text-center">
            <ClipboardDocumentListIcon className="h-10 w-10 mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">No schedules found</p>
            <button
              onClick={() => navigate("/admin/schedules/create")}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Schedule
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {schedulesData.schedules.map((schedule) => (
              <li key={schedule._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <CalendarIcon className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {schedule.scheduleName}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {schedule.project ? schedule.project.projectName : "No project assigned"}
                        </p>
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      {getStatusBadge(schedule.status)}
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        <span className="truncate">
                          {schedule.scheduleDescription.length > 100
                            ? `${schedule.scheduleDescription.substring(0, 100)}...`
                            : schedule.scheduleDescription}
                        </span>
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <div className="flex space-x-2">
                        <p>
                          <span className="font-medium text-gray-900">Start:</span>{" "}
                          {formatDate(schedule.startDate)}
                        </p>
                        <p>|</p>
                        <p>
                          <span className="font-medium text-gray-900">End:</span>{" "}
                          {formatDate(schedule.endDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end space-x-2">
                    <button
                       onClick={() => {
                        // Use _id if available, otherwise try id
                        const scheduleId = schedule._id || schedule.id;
                        console.log("Schedule ID:", scheduleId);
                        if (!scheduleId) {
                          console.error("No valid schedule id found", schedule);
                          return;
                        }
                        navigate(`/admin/schedules/${scheduleId}`);
                      }}
                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      View Details
                    </button>
                    <button
                      // onClick={() => navigate(`/admin/schedules/edit/${schedule._id || schedule.id}`)}
                      onClick={() => {
                        // Use _id if available, otherwise try id
                        const scheduleId = schedule._id || schedule.id;
                        console.log("Schedule ID for the edit is this :", scheduleId);
                        if (!scheduleId) {
                          console.error("No valid schedule id found", schedule);
                          return;
                        }
                        navigate(`/admin/schedules/edit/${scheduleId}`);
                      }}
                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => confirmDelete(schedule._id)}
                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SchedulesList;
