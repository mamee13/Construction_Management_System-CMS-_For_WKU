 /*eslint-disable */


import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; // Import useMutation/Client for delete
import {
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon, // For error icon
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import schedulesAPI from "../../../api/schedules"; // For CRUD operations
import authAPI from "../../../api/auth";         // For user info
import tasksAPI from "../../../api/tasks";       // *** IMPORT FOR UTILITIES ***

const ConsultantScheduleDetail = () => {
  const { id } = useParams(); // Get schedule ID from URL
  const navigate = useNavigate();
  const queryClient = useQueryClient(); // Get query client for cache invalidation on delete
  const currentUser = authAPI.getCurrentUser();
 console.log(id);
  // Fetch schedule details
  const {
    data: schedule, // The fetched schedule data
    isLoading,
    error,
    refetch, // Add refetch function for retry button
  } = useQuery({
    queryKey: ["schedule", id], // Query key includes the ID
    queryFn: () => schedulesAPI.getScheduleById(id), // API function to call
    enabled: !!id, // Only run the query if the ID exists
    staleTime: 1000 * 60, // Consider data stale after 1 minute
  });
 
  // Delete schedule mutation setup
  const deleteMutation = useMutation({
      mutationFn: schedulesAPI.deleteSchedule,
      onSuccess: (data) => {
          toast.success(data?.message || "Schedule deleted successfully");
          queryClient.invalidateQueries({ queryKey: ["schedules"] }); // Invalidate the list view cache
          navigate("/consultant/schedules"); // Navigate back to the list
      },
      onError: (error) => {
          toast.error(error.message || "Failed to delete schedule");
      },
  });

   // Handle the delete button click using the mutation
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this schedule? This action cannot be undone.")) {
      deleteMutation.mutate(id); // Trigger the mutation with the schedule ID
    }
  };


  // Check if user can edit/delete this schedule
  // *** Requires backend to POPULATE 'createdBy' field with at least _id ***
  const canModifySchedule = () => {
    if (!currentUser || !schedule || !schedule.createdBy) {
        // console.warn("canModify check failed: Missing user, schedule, or populated schedule.createdBy");
        return false;
    }
    if (currentUser.role === "admin") return true;
    // Use String() for safe comparison
    if (currentUser.role === "consultant" && String(schedule.createdBy._id) === String(currentUser._id)) return true;
    return false;
  };

  // Role/Auth Check Effect (Keep as is)
  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      navigate("/login");
      return;
    }
    if (currentUser && currentUser.role !== "consultant" && currentUser.role !== "admin") {
      navigate("/dashboard");
    }
  }, [currentUser, navigate]);


  // --- RENDER LOGIC ---
  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto"> {/* Adjusted max-width */}
      {/* Header Section */}
      <div className="sm:flex sm:items-start sm:justify-between mb-8"> {/* Use items-start for alignment */}
        <div className="flex-grow mb-4 sm:mb-0"> {/* Allow title to take space */}
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight text-gray-900 mb-1 truncate" title={schedule?.scheduleName}>
            {isLoading ? "Loading Schedule..." : schedule?.scheduleName || "Schedule Details"}
          </h1>
          <p className="text-sm text-gray-500">View schedule details, dates, and assignments.</p>
        </div>
        <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0"> {/* Actions */}
          <button
            type="button"
            onClick={() => navigate("/consultant/schedules")}
            className="w-full sm:w-auto inline-flex justify-center items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Back to List
          </button>
          {/* Show modify buttons only if loading is done, no error, schedule exists, and user has permission */}
          {!isLoading && !error && schedule && canModifySchedule() && (
            <>
              <button
                type="button"
                onClick={() => navigate(`/schedules/edit/${id}`)}
                className="w-full sm:w-auto inline-flex justify-center items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <PencilSquareIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Edit
              </button>
              <button
                type="button"
                onClick={handleDelete} // Use the mutation handler
                disabled={deleteMutation.isLoading} // Disable while deleting
                className={`w-full sm:w-auto inline-flex justify-center items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    deleteMutation.isLoading
                    ? 'bg-red-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                }`}
              >
                {deleteMutation.isLoading ? (
                    <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                ) : (
                    <TrashIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                )}
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        // Loading State
        <div className="text-center py-20 bg-white shadow rounded-lg">
          <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
          <p className="mt-2 text-gray-500">Loading schedule details...</p>
        </div>
      ) : error ? (
        // Error State
        <div className="text-center py-20 px-6 bg-white shadow rounded-lg border border-red-200">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-lg font-semibold text-red-800">Failed to load schedule</h3>
            <p className="mt-1 text-sm text-red-600 mb-4">{error.message || "An unknown error occurred."}</p>
            <button
                onClick={() => refetch()} // Use refetch from useQuery
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
                <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Retry
            </button>
        </div>
      ) : !schedule ? ( // *** ADDED CHECK: Handle case where API succeeds but returns no data ***
         <div className="text-center py-20 px-6 bg-white shadow rounded-lg border border-yellow-300">
             <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-400" />
             <h3 className="mt-2 text-lg font-semibold text-yellow-800">Schedule Not Found</h3>
             <p className="mt-1 text-sm text-yellow-600 mb-4">The requested schedule could not be found or may have been deleted.</p>
             <button
                 onClick={() => navigate("/consultant/schedules")}
                 className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
             >
                 Back to Schedules List
             </button>
         </div>
      ) : (
        // Success State - Display Schedule Details
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {/* Header with Status/Priority Badges */}
          <div className="px-4 py-4 sm:px-6 border-b border-gray-200">
            <div className="-ml-4 -mt-2 flex items-center justify-between flex-wrap sm:flex-nowrap">
                <div className="ml-4 mt-2">
                     <h3 className="text-lg leading-6 font-medium text-gray-900">Schedule Information</h3>
                </div>
                 <div className="ml-4 mt-2 flex-shrink-0 flex space-x-2">
                 {/* *** USE tasksAPI FOR UTILITIES *** */}
                   <span title={`Status: ${tasksAPI.formatStatus(schedule.status)}`} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tasksAPI.getStatusBadgeClass(schedule.status)}`}>
                     {tasksAPI.formatStatus(schedule.status)}
                   </span>
                   <span title={`Priority: ${tasksAPI.formatPriority(schedule.priority)}`} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tasksAPI.getPriorityBadgeClass(schedule.priority)}`}>
                      <span className="sr-only">Priority:</span> {tasksAPI.formatPriority(schedule.priority)}
                   </span>
                 </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Description */}
              <div className="sm:col-span-3"> {/* Span full width */}
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{schedule.scheduleDescription || <span className="text-gray-400 italic">No description provided.</span>}</dd>
              </div>

              {/* Project */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <BuildingOfficeIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                  Project
                </dt>
                 {/* Use Optional Chaining */}
                <dd className="mt-1 text-sm text-gray-900">{schedule.project?.projectName || <span className="text-gray-400 italic">Unknown Project</span>}</dd>
              </div>

              {/* Task */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <ClipboardDocumentListIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                  Task
                </dt>
                 {/* Use Optional Chaining */}
                <dd className="mt-1 text-sm text-gray-900">{schedule.task?.taskName || <span className="text-gray-400 italic">Unknown Task</span>}</dd>
              </div>

               {/* Assigned To */}
               <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <UserIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                  Assigned To
                </dt>
                {/* Use Optional Chaining and check names */}
                <dd className="mt-1 text-sm text-gray-900">
                  {schedule.assignedTo
                    ? `${schedule.assignedTo.firstName || ""} ${schedule.assignedTo.lastName || ""}`.trim() || <span className="text-gray-400 italic">Name not available</span>
                    : <span className="text-gray-400 italic">Not assigned</span>}
                </dd>
              </div>


              {/* Start Date */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                  Start Date
                </dt>
                 {/* *** USE tasksAPI FOR UTILITIES *** */}
                <dd className="mt-1 text-sm text-gray-900">{tasksAPI.formatDate(schedule.startDate)}</dd>
              </div>

              {/* End Date */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                  End Date
                </dt>
                {/* *** USE tasksAPI FOR UTILITIES *** */}
                <dd className="mt-1 text-sm text-gray-900">{tasksAPI.formatDate(schedule.endDate)}</dd>
              </div>

              {/* Duration */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <ClockIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                  Duration
                </dt>
                {/* Use Optional Chaining and calculate if needed */}
                <dd className="mt-1 text-sm text-gray-900">
                    {schedule.duration ?? tasksAPI.getTaskDuration(schedule.startDate, schedule.endDate) ?? "N/A"} days
                </dd>
              </div>

              {/* Created By */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <UserIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                  Created By
                </dt>
                 {/* Use Optional Chaining and check names */}
                <dd className="mt-1 text-sm text-gray-900">
                  {schedule.createdBy ? `${schedule.createdBy.firstName || ""} ${schedule.createdBy.lastName || ""}`.trim() || <span className="text-gray-400 italic">Unknown</span> : <span className="text-gray-400 italic">Unknown</span>}
                  {/* Check IDs carefully */}
                  {schedule.createdBy?._id && currentUser?._id && String(schedule.createdBy._id) === String(currentUser._id) ? " (You)" : ""}
                  {/* Add note if creator info is missing */}
                   {!schedule.createdBy && <span className="text-red-500 text-xs italic ml-1">(Missing Creator Info)</span>}
                </dd>
              </div>

              {/* Created At */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                 {/* *** USE tasksAPI FOR UTILITIES *** */}
                <dd className="mt-1 text-sm text-gray-900">{tasksAPI.formatDate(schedule.createdAt)}</dd>
              </div>

                {/* Last Updated At */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                 {/* *** USE tasksAPI FOR UTILITIES *** */}
                <dd className="mt-1 text-sm text-gray-900">{tasksAPI.formatDate(schedule.updatedAt)}</dd>
              </div>

            </dl>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultantScheduleDetail;