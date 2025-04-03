

// import { useState, useEffect } from "react"
// import { useParams, useNavigate } from "react-router-dom"
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
// import { toast } from "react-toastify"
// import {
//   ArrowPathIcon,
//   PencilIcon,
//   TrashIcon,
//   XCircleIcon,
//   ArrowLeftIcon,
//   UserIcon,
//   FolderIcon,
//   CalendarIcon,
// } from "@heroicons/react/24/outline"
// import tasksAPI from "../../../api/tasks"
// import authAPI from "../../../api/auth"

// const TaskDetail = () => {
//   const { id } = useParams()
//   const navigate = useNavigate()
//   const queryClient = useQueryClient()
//   const [isDeleting, setIsDeleting] = useState(false)
//   const [isAdmin, setIsAdmin] = useState(false)

//   useEffect(() => {
//     // Check if user is admin
//     const checkAdmin = async () => {
//       try {
//         const adminStatus = await authAPI.isAdmin()
//         setIsAdmin(adminStatus)
//       } catch (error) {
//         console.error("Error checking admin status:", error)
//       }
//     }
//     checkAdmin()
//   }, [])

//   // Fetch task details
//   const { data: taskData, isLoading, error, refetch } = useQuery({
//     queryKey: ["tasks", id],
//     queryFn: () => tasksAPI.getTaskById(id),
//   })

//   // Log the fetched data for debugging
//   console.log("Fetched taskData:", taskData)

//   // If your API returns the task directly, use:
//   const task = taskData // instead of taskData?.task

//   // Delete task mutation
//   const deleteTaskMutation = useMutation({
//     mutationFn: tasksAPI.deleteTask,
//     onSuccess: () => {
//       toast.success("Task deleted successfully")
//       queryClient.invalidateQueries({ queryKey: ["tasks"] })
//       queryClient.invalidateQueries({ queryKey: ["projects"] })
//       navigate("/admin/tasks")
//     },
//     onError: (error) => {
//       toast.error(error.message || "Failed to delete task")
//       setIsDeleting(false)
//     },
//   })

//   // Handle delete task
//   const handleDelete = () => {
//     if (
//       window.confirm(
//         "Are you sure you want to delete this task? This action cannot be undone."
//       )
//     ) {
//       setIsDeleting(true)
//       deleteTaskMutation.mutate(id)
//     }
//   }

//   // Format date
//   const formatDate = (dateString) => {
//     const options = { year: "numeric", month: "long", day: "numeric" }
//     return new Date(dateString).toLocaleDateString(undefined, options)
//   }

//   // Get status badge
//   const getStatusBadge = (status) => {
//     switch (status) {
//       case "not_started":
//         return (
//           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
//             Not Started
//           </span>
//         )
//       case "in_progress":
//         return (
//           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
//             In Progress
//           </span>
//         )
//       case "completed":
//         return (
//           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
//             Completed
//           </span>
//         )
//       case "on_hold":
//         return (
//           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
//             On Hold
//           </span>
//         )
//       default:
//         return (
//           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
//             {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
//           </span>
//         )
//     }
//   }

//   // Get priority badge
//   const getPriorityBadge = (priority) => {
//     switch (priority) {
//       case "low":
//         return (
//           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
//             Low
//           </span>
//         )
//       case "medium":
//         return (
//           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
//             Medium
//           </span>
//         )
//       case "high":
//         return (
//           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
//             High
//           </span>
//         )
//       default:
//         return (
//           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
//             {priority.charAt(0).toUpperCase() + priority.slice(1)}
//           </span>
//         )
//     }
//   }

//   return (
//     <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
//       <div className="mb-8">
//         <button
//           onClick={() => navigate("/admin/tasks")}
//           className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//         >
//           <ArrowLeftIcon className="h-5 w-5 mr-2" />
//           Back to Tasks
//         </button>
//       </div>

//       {isLoading ? (
//         <div className="py-20 text-center">
//           <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
//           <p className="mt-2 text-gray-500">Loading task details...</p>
//         </div>
//       ) : error ? (
//         <div className="py-20 text-center">
//           <XCircleIcon className="h-10 w-10 mx-auto text-red-500" />
//           <p className="mt-2 text-gray-700">Error loading task details</p>
//           <p className="text-sm text-red-500">{error.message}</p>
//           <button
//             onClick={() => refetch()}
//             className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//           >
//             <ArrowPathIcon className="h-5 w-5 mr-2" />
//             Retry
//           </button>
//         </div>
//       ) : (
//         <div className="bg-white shadow overflow-hidden sm:rounded-lg">
//           <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
//             <div>
//               <h3 className="text-lg leading-6 font-medium text-gray-900">
//                 Task Details
//               </h3>
//               <p className="mt-1 max-w-2xl text-sm text-gray-500">
//                 Detailed information about the selected task.
//               </p>
//             </div>
//             <div className="flex space-x-2">
//               <button
//                 onClick={() => navigate(`/admin/tasks/edit/${id}`)}
//                 className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//               >
//                 <PencilIcon className="h-4 w-4 mr-2" />
//                 Edit Task
//               </button>
//               {isAdmin && (
//                 <button
//                   onClick={handleDelete}
//                   disabled={isDeleting}
//                   className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
//                 >
//                   {isDeleting ? (
//                     <>
//                       <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
//                       Deleting...
//                     </>
//                   ) : (
//                     <>
//                       <TrashIcon className="h-4 w-4 mr-2" />
//                       Delete Task
//                     </>
//                   )}
//                 </button>
//               )}
//             </div>
//           </div>
//           <div className="border-t border-gray-200">
//             <dl>
//               <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
//                 <dt className="text-sm font-medium text-gray-500">Task Name</dt>
//                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
//                   {task?.taskName}
//                 </dd>
//               </div>
//               <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
//                 <dt className="text-sm font-medium text-gray-500">Description</dt>
//                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
//                   {task?.taskDescription}
//                 </dd>
//               </div>
//               <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
//                 <dt className="text-sm font-medium text-gray-500">Project</dt>
//                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
//                   <FolderIcon className="h-5 w-5 text-gray-400 mr-2" />
//                   {task?.project?.projectName || "No project assigned"}
//                 </dd>
//               </div>
//               <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
//                 <dt className="text-sm font-medium text-gray-500">Status</dt>
//                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
//                   {task?.status && getStatusBadge(task.status)}
//                 </dd>
//               </div>
//               <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
//                 <dt className="text-sm font-medium text-gray-500">Priority</dt>
//                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
//                   {task?.priority && getPriorityBadge(task.priority)}
//                 </dd>
//               </div>
//               <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
//                 <dt className="text-sm font-medium text-gray-500">Start Date</dt>
//                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
//                   <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
//                   {task?.startDate && formatDate(task.startDate)}
//                 </dd>
//               </div>
//               <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
//                 <dt className="text-sm font-medium text-gray-500">End Date</dt>
//                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
//                   <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
//                   {task?.endDate && formatDate(task.endDate)}
//                 </dd>
//               </div>
//               <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
//                 <dt className="text-sm font-medium text-gray-500">Duration</dt>
//                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
//                   {task?.duration ? `${task.duration} days` : "N/A"}
//                 </dd>
//               </div>
//               <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
//                 <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
//                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
//                   <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
//                   {task?.assignedTo && task.assignedTo.length > 0 ? (
//                     <span>
//                       {task.assignedTo
//                         .map(
//                           (user) =>
//                             `${user.firstName} ${user.lastName} (${user.role})`
//                         )
//                         .join(", ")}
//                     </span>
//                   ) : (
//                     <span className="text-gray-500">Not assigned</span>
//                   )}
//                 </dd>
//               </div>
//               <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
//                 <dt className="text-sm font-medium text-gray-500">Created At</dt>
//                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
//                   {task?.createdAt && formatDate(task.createdAt)}
//                 </dd>
//               </div>
//               <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
//                 <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
//                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
//                   {task?.updatedAt && formatDate(task.updatedAt)}
//                 </dd>
//               </div>
//             </dl>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// export default TaskDetail
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  ArrowPathIcon,
  PencilIcon,
  TrashIcon,
  XCircleIcon,
  ArrowLeftIcon,
  UserIcon,
  FolderIcon,
  CalendarIcon,
  ClockIcon, // Added for Duration/Time
  InformationCircleIcon // Added for 'Not Assigned' / 'No Project'
} from "@heroicons/react/24/outline";
import tasksAPI from "../../../api/tasks";
import authAPI from "../../../api/auth"; // Assuming authAPI.isAdmin() is synchronous

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // For modal confirmation
  const [isAdmin, setIsAdmin] = useState(false);

  // Assume authAPI.isAdmin() is synchronous like in TasksList for consistency
  useEffect(() => {
     setIsAdmin(authAPI.isAdmin());
  }, []);

  // Fetch task details
  const {
    data: taskResponse, // Rename to avoid confusion, this is the API response object
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tasks", id], // Specific query key for this task
    queryFn: () => tasksAPI.getTaskById(id),
    enabled: !!id, // Ensure query only runs if id exists
  });

  // *** THE KEY FIX IS HERE ***
  // Extract the actual task object from the 'data' property of the response
  const task = taskResponse?.data;

  // Log the extracted task object for debugging (optional)
  console.log("Extracted task object:", task);

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: tasksAPI.deleteTask,
    onSuccess: () => {
      toast.success("Task deleted successfully");
      // Invalidate the specific task query
      queryClient.invalidateQueries({ queryKey: ["tasks", id] });
      // Invalidate general tasks list query if user navigates back
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      // Invalidate the project's task list if project id is available
      if (task?.project?._id) {
        queryClient.invalidateQueries({ queryKey: ["tasks", { project: task.project._id }] });
      }
      // You might not need to invalidate projects unless delete affects project stats
      // queryClient.invalidateQueries({ queryKey: ["projects"] });
      setShowDeleteConfirm(false); // Close modal
      setIsDeleting(false);
      navigate("/admin/tasks"); // Navigate back to list
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete task");
      setShowDeleteConfirm(false); // Close modal on error too
      setIsDeleting(false);
    },
  });

  // Handle delete confirmation modal
  const confirmDelete = () => {
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // Handle actual delete action
  const handleDelete = () => {
    setIsDeleting(true);
    deleteTaskMutation.mutate(id);
  };

  // Format date - Using the utility from tasksAPI for consistency
  const formatDate = tasksAPI.formatDate;

  // Get status badge - Using the utility from tasksAPI for consistency
  const getStatusBadge = (status) => {
     if (!status) return null;
     const badgeClass = tasksAPI.getStatusBadgeClass(status);
     const formattedStatus = tasksAPI.formatStatus(status);
     return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>{formattedStatus}</span>;
  }

  // Get priority badge - Using the utility from tasksAPI for consistency
  const getPriorityBadge = (priority) => {
    if (!priority) return null;
    const badgeClass = tasksAPI.getPriorityBadgeClass(priority);
    const formattedPriority = tasksAPI.formatPriority(priority);
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>{formattedPriority}</span>;
  }

  // Calculate duration if needed (example, might be better on backend)
  const displayDuration = () => {
    if (task?.duration) { // If backend provides duration
        return `${task.duration} days`;
    }
    // Otherwise, calculate using utility function if available
    const durationDays = tasksAPI.getTaskDuration(task?.startDate, task?.endDate);
    return durationDays !== null ? `${durationDays} day${durationDays === 1 ? '' : 's'}` : "N/A";
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto"> {/* Centered content */}
      <div className="mb-6"> {/* Reduced margin */}
        <button
          onClick={() => navigate("/admin/tasks")} // Consider navigate(-1) for more dynamic back
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" aria-hidden="true" />
          Back to Tasks
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-20">
          <ArrowPathIcon className="h-8 w-8 mx-auto text-indigo-600 animate-spin" aria-hidden="true" />
          <p className="mt-2 text-sm text-gray-500">Loading task details...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md my-6">
            <div className="flex">
                <div className="flex-shrink-0">
                    <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">Error loading task details</p>
                    <p className="mt-1 text-sm text-red-700">{error.message || "An unknown error occurred."}</p>
                    <button
                        onClick={() => refetch()}
                        className="mt-2 inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        <ArrowPathIcon className="h-4 w-4 mr-1.5" aria-hidden="true"/>
                        Retry
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" onClick={cancelDelete} aria-hidden="true"></div>
            <div className="relative bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full sm:p-6">
               <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                     <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                     <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Task</h3>
                     <div className="mt-2">
                        <p className="text-sm text-gray-500">Are you sure you want to delete this task? This action cannot be undone.</p>
                     </div>
                  </div>
               </div>
               <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                     type="button"
                     className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                     onClick={handleDelete}
                     disabled={isDeleting}
                  >
                     {isDeleting ? (<><ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />Deleting...</>) : 'Delete'}
                  </button>
                  <button
                     type="button"
                     className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
                     onClick={cancelDelete}
                     disabled={isDeleting}
                  >
                     Cancel
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Task Details Display (only if not loading and no error) */}
      {!isLoading && !error && task && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {/* Header with Title and Actions */}
          <div className="px-4 py-4 sm:px-6 border-b border-gray-200">
            <div className="flex items-center justify-between flex-wrap sm:flex-nowrap gap-3">
              <div>
                <h3 className="text-xl leading-6 font-semibold text-gray-900">
                  {task.taskName || "Task Details"}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Detailed information and status.
                </p>
              </div>
              <div className="flex-shrink-0 flex items-center space-x-2">
                <button
                  onClick={() => navigate(`/admin/tasks/edit/${id}`)}
                  title="Edit Task"
                  className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PencilIcon className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  Edit
                </button>
                {isAdmin && (
                  <button
                    onClick={confirmDelete} // Use modal confirmation
                    disabled={isDeleting}
                    title="Delete Task"
                    className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    <TrashIcon className="h-4 w-4 mr-1.5" aria-hidden="true" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Definition List for Details */}
          <div className="px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              {/* Description */}
               <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap"> {/* Preserve whitespace/newlines */}
                  {task.taskDescription || <span className="italic text-gray-400">No description provided.</span>}
                </dd>
              </div>

              {/* Project */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Project</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  {task.project ? (
                    <>
                       <FolderIcon className="h-5 w-5 text-gray-400 mr-1.5 flex-shrink-0" aria-hidden="true" />
                       {/* Link to project detail page if available */}
                       {/* <Link to={`/admin/projects/${task.project._id}`} className="hover:underline text-indigo-600">{task.project.projectName}</Link> */}
                       <span>{task.project.projectName}</span>
                    </>
                  ) : (
                     <>
                       <InformationCircleIcon className="h-5 w-5 text-gray-400 mr-1.5 flex-shrink-0" aria-hidden="true"/>
                       <span className="italic text-gray-500">No project assigned</span>
                    </>
                  )}
                </dd>
              </div>

              {/* Status */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {getStatusBadge(task.status)}
                </dd>
              </div>

              {/* Priority */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Priority</dt>
                <dd className="mt-1 text-sm text-gray-900">
                   {getPriorityBadge(task.priority)}
                </dd>
              </div>

               {/* Assigned To */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-start"> {/* Use items-start */}
                   <UserIcon className="h-5 w-5 text-gray-400 mr-1.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                   {task.assignedTo && task.assignedTo.length > 0 ? (
                       <div className="flex flex-col space-y-0.5"> {/* Stack names if multiple */}
                           {task.assignedTo.map(user => user ? ( // Check if user object exists
                               <span key={user._id}>
                                   {`${user.firstName || ''} ${user.lastName || ''}`.trim()}
                                   {user.role && <span className="text-xs text-gray-500 ml-1">({user.role})</span>}
                               </span>
                           ) : <span key={`unknown-${Math.random()}`} className="italic text-gray-500">Unknown User</span>)}
                       </div>
                   ) : (
                       <span className="italic text-gray-500">Not assigned</span>
                   )}
                </dd>
              </div>

              {/* Start Date */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-1.5 flex-shrink-0" aria-hidden="true" />
                  {formatDate(task.startDate)}
                </dd>
              </div>

               {/* End Date */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Due Date</dt> {/* Changed label */}
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                   <CalendarIcon className="h-5 w-5 text-gray-400 mr-1.5 flex-shrink-0" aria-hidden="true" />
                   {formatDate(task.endDate)}
                </dd>
              </div>

              {/* Duration */}
               <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Estimated Duration</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                   <ClockIcon className="h-5 w-5 text-gray-400 mr-1.5 flex-shrink-0" aria-hidden="true"/>
                   {displayDuration()}
                </dd>
              </div>

              {/* Created At */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(task.createdAt)}
                </dd>
              </div>

              {/* Last Updated */}
               <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">
                   {formatDate(task.updatedAt)}
                </dd>
              </div>

            </dl>
          </div>
        </div>
      )}

       {/* Fallback if task is not found after loading and no error */}
       {!isLoading && !error && !task && (
           <div className="text-center py-20">
                <InformationCircleIcon className="h-12 w-12 mx-auto text-gray-400" aria-hidden="true" />
                <p className="mt-2 text-base font-medium text-gray-700">Task Not Found</p>
                <p className="mt-1 text-sm text-gray-500">The task you are looking for might have been deleted or does not exist.</p>
            </div>
       )}
    </div>
  );
};

export default TaskDetail;