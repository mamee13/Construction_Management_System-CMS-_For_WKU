
/*eslint-disable */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  ArrowPathIcon,
  PencilSquareIcon, // Consistent Edit Icon
  TrashIcon,
  ArrowLeftIcon,
  UserCircleIcon, // Consistent User Icon
  BuildingOffice2Icon, // Consistent Project Icon
  CalendarDaysIcon, // Consistent Calendar Icon
  CheckBadgeIcon, // Consistent Check Icon
  ClockIcon,
  ExclamationTriangleIcon, // Consistent Warning/Error Icon
  ClipboardDocumentListIcon, // Consistent Status Icon
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline"; // Use outline consistently
import tasksAPI from "../../../api/tasks"; // Use refined API
import authAPI from "../../../api/auth"; // Assuming correct implementation

// --- Auth Hook (Keep or replace) ---
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);
  return { user, isLoading: loading };
};
// ---

const ConsultantTaskDetail = () => {
  const { id: taskId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser, isLoading: isLoadingAuth } = useAuth();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // Combined loading/auth state
  const [pageStatus, setPageStatus] = useState('loading'); // 'loading', 'authorized', 'unauthorized', 'error'

  // --- Fetch Task Details ---
  // Backend's getTaskById should handle view authorization (consultant in project)
  const {
    data: taskQueryData, // API returns { success, data }
    isLoading: isLoadingTask,
    error: taskError,
    isError: isTaskError,
    isSuccess: isTaskSuccess,
    refetch,
  } = useQuery({
    queryKey: ["task", taskId], // Use specific key for single task
    queryFn: () => tasksAPI.getTaskById(taskId),
    enabled: !!taskId && !isLoadingAuth && !!currentUser && currentUser.role === 'consultant', // Enable only when auth is ready and user is consultant
    staleTime: 1 * 60 * 1000, // Cache for 1 min
    retry: (failureCount, error) => {
       // Don't retry on authorization errors (401, 403)
       if (error?.response?.status === 401 || error?.response?.status === 403) {
           return false;
       }
       // Otherwise, retry standard times (e.g., 3 times)
       return failureCount < 3;
    },
  });

  // Determine Page Status based on Auth and Query states
  useEffect(() => {
    if (isLoadingAuth || (isLoadingTask && !isTaskError)) {
      setPageStatus('loading');
    } else if (!currentUser || currentUser.role !== 'consultant') {
      setPageStatus('unauthorized');
      toast.error("Access Denied: Consultant role required.");
      navigate("/dashboard"); // Or appropriate redirect
    } else if (isTaskError) {
      setPageStatus('error');
      // Specific error handling based on status code
      if (taskError?.response?.status === 403) {
          toast.error("Access Denied: You don't have permission to view this task.");
          // Optionally navigate away sooner
          // navigate("/consultant/tasks");
      } else if (taskError?.response?.status === 404) {
          toast.error("Task not found.");
          // Optionally navigate away sooner
          // navigate("/consultant/tasks");
      } else {
          toast.error(`Error loading task: ${taskError.message || 'Unknown error'}`);
      }
    } else if (isTaskSuccess && taskQueryData?.data) {
      setPageStatus('authorized');
    } else if (isTaskSuccess && !taskQueryData?.data) {
       // Success but no data (could be a 404 handled gracefully by API)
       setPageStatus('error');
       toast.error("Task not found.");
    }
    // Add handling for other unexpected states if necessary
  }, [
      isLoadingAuth, currentUser,
      isLoadingTask, isTaskError, taskError, isTaskSuccess, taskQueryData,
      navigate
  ]);


  const task = taskQueryData?.data; // The actual task object

  // Determine if the current consultant can edit/delete this task
  const canEditDelete = pageStatus === 'authorized' && task?.createdBy?._id === currentUser?.id;

  // --- Delete Task Mutation ---
  const deleteTaskMutation = useMutation({
    mutationFn: () => tasksAPI.deleteTask(taskId), // Pass ID here
    onSuccess: (response) => {
      toast.success(response?.message || "Task deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["tasks"] }); // Invalidate general tasks list
       queryClient.invalidateQueries({ queryKey: ["consultant-tasks"] }); // Invalidate consultant specific list if exists
       queryClient.invalidateQueries({ queryKey: ["project-tasks", task?.project?._id] }); // Invalidate tasks for the project
      navigate("/consultant/tasks");
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message || "Please try again."}`);
      // No need to manage isDeleting state, use mutation.isPending
      setShowDeleteModal(false);
    },
  });

  // Handle confirm delete
  const handleDeleteConfirm = () => {
    if (!canEditDelete) {
        toast.error("You do not have permission to delete this task.");
        setShowDeleteModal(false);
        return;
    }
    deleteTaskMutation.mutate(); // Trigger mutation
  };

  // --- Render Logic ---

  // 1. Loading State
  if (pageStatus === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <ArrowPathIcon className="h-8 w-8 text-gray-500 animate-spin mr-3" />
        <span className="text-gray-600">Loading task details...</span>
      </div>
    );
  }

  // 2. Error or Unauthorized State
  if (pageStatus === 'error' || pageStatus === 'unauthorized') {
    // Specific error toasts are handled in useEffect
    return (
      <div className="py-10 px-4 text-center max-w-lg mx-auto bg-white shadow rounded-lg">
        <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-red-400" />
        <h2 className="mt-2 text-xl font-semibold text-red-700">
          {pageStatus === 'unauthorized' ? 'Access Denied' : 'Error Loading Task'}
        </h2>
        <p className="mt-1 text-sm text-gray-600 mb-4">
          {pageStatus === 'unauthorized'
            ? "You do not have the necessary permissions or role."
            : `Could not load task details. ${taskError?.message ? `(${taskError.message})` : ''}`
          }
        </p>
         <div className="flex justify-center space-x-3">
          {pageStatus === 'error' && (
            <button
                onClick={() => refetch()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isLoadingTask} // Disable if already retrying
              >
                <ArrowPathIcon className={`h-5 w-5 mr-2 ${isLoadingTask ? 'animate-spin': ''}`} />
                Retry
            </button>
          )}
           <button
              onClick={() => navigate("/consultant/tasks")}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Tasks
            </button>
        </div>
      </div>
    );
  }


  // 3. Success State (task is available)
  if (pageStatus === 'authorized' && task) {
      // Get formatted status/priority etc. using API utils
      const formattedStatus = tasksAPI.formatStatus(task.status);
      const formattedPriority = tasksAPI.formatPriority(task.priority);
      const statusBadgeClass = tasksAPI.getStatusBadgeClass(task.status);
      const priorityBadgeClass = tasksAPI.getPriorityBadgeClass(task.priority);
      const daysRemaining = tasksAPI.calculateDaysRemaining(task.endDate);
      const isOverdue = tasksAPI.isTaskOverdue(task.endDate, task.status);
      const taskDuration = tasksAPI.getTaskDuration(task.startDate, task.endDate);

      const renderDaysRemaining = () => {
            if (task.status === "completed") {
                return <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${tasksAPI.getStatusBadgeClass('completed')}`}>Completed</span>;
            }
            if (isOverdue) {
                return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Overdue ({Math.abs(daysRemaining)} days)</span>;
            }
            if (daysRemaining === 0) {
                 return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Due Today</span>;
            }
            if (daysRemaining > 0) {
                 return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{daysRemaining} days left</span>;
            }
            return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">N/A</span>; // No end date?
      };

    return (
      <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        {/* Header & Actions */}
        <div className="sm:flex sm:items-center sm:justify-between mb-6 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 leading-tight">{task.taskName}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Project:{" "}
              <span className="font-medium text-gray-700">
                {task.project?.projectName || "N/A"}
              </span>
            </p>
          </div>
          <div className="mt-3 sm:mt-0 flex flex-shrink-0 space-x-2">
             {/* Edit Button - Conditionally Enabled */}
             <button
                onClick={() => navigate(`/consultant/tasks/edit/${taskId}`)}
                disabled={!canEditDelete}
                className={`inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  canEditDelete
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
                title={canEditDelete ? "Edit this task" : "Only the task creator can edit"}
              >
                <PencilSquareIcon className="h-4 w-4 mr-1.5" />
                Edit
              </button>
            {/* Delete Button - Conditionally Enabled */}
             <button
                onClick={() => setShowDeleteModal(true)}
                disabled={!canEditDelete}
                className={`inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                  canEditDelete
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
                 title={canEditDelete ? "Delete this task" : "Only the task creator can delete"}
              >
                <TrashIcon className="h-4 w-4 mr-1.5" />
                Delete
              </button>
             <button
                onClick={() => navigate("/consultant/tasks")}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
             >
                <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
                Back
             </button>
          </div>
        </div>

        {/* Task Details Card */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
             <h3 className="text-lg leading-6 font-medium text-gray-900">Task Overview</h3>
             <p className="mt-1 max-w-2xl text-sm text-gray-500">Key details and status.</p>
          </div>

          {/* Status/Priority/Timeline Summary */}
          <div className="border-b border-gray-200 px-4 py-5 sm:px-6 bg-gray-50/50">
            <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-3">
               <div>
                   <dt className="text-sm font-medium text-gray-500">Status</dt>
                   <dd className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass}`}>
                     {formattedStatus}
                   </dd>
               </div>
               <div>
                   <dt className="text-sm font-medium text-gray-500">Priority</dt>
                   <dd className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityBadgeClass}`}>
                     {formattedPriority}
                   </dd>
               </div>
               <div>
                   <dt className="text-sm font-medium text-gray-500">Deadline</dt>
                   <dd className="mt-1 text-sm text-gray-900">{renderDaysRemaining()}</dd>
               </div>
                <div>
                   <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                   <dd className="mt-1 text-sm text-gray-900">{tasksAPI.formatDate(task.startDate)}</dd>
               </div>
                <div>
                   <dt className="text-sm font-medium text-gray-500">End Date</dt>
                   <dd className="mt-1 text-sm text-gray-900">{tasksAPI.formatDate(task.endDate)}</dd>
               </div>
                <div>
                   <dt className="text-sm font-medium text-gray-500">Duration</dt>
                   <dd className="mt-1 text-sm text-gray-900">{taskDuration !== null ? `${taskDuration} day(s)` : 'N/A'}</dd>
               </div>
            </div>
          </div>

          {/* Detailed List */}
          <div className="border-t border-gray-200">
            <dl>
              {/* Description */}
              <div className="px-4 py-5 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-3 whitespace-pre-wrap">
                  {task.taskDescription || <span className="text-gray-400 italic">No description provided.</span>}
                </dd>
              </div>

              {/* Assigned To */}
              <div className="bg-gray-50/50 px-4 py-5 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-3">
                  {Array.isArray(task.assignedTo) && task.assignedTo.length > 0 ? (
                    <ul className="space-y-2">
                      {task.assignedTo.map((user) => (
                        <li key={user._id} className="flex items-center">
                           <UserCircleIcon className="h-6 w-6 text-gray-400 mr-2 flex-shrink-0" />
                          <span className="font-medium">{user.firstName} {user.lastName}</span>
                           <span className="ml-2 text-xs text-gray-500">({user.role || 'User'})</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-500 italic">Not assigned.</span>
                  )}
                </dd>
              </div>

               {/* Created By */}
              <div className="px-4 py-5 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Created By</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-3">
                  {task.createdBy ? (
                      <div className="flex items-center">
                         <UserCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
                         <span>{task.createdBy.firstName} {task.createdBy.lastName}</span>
                          {task.createdBy._id === currentUser?.id && <span className="ml-2 text-xs text-indigo-600">(You)</span>}
                      </div>
                  ) : (
                     <span className="text-gray-500 italic">Unknown</span>
                  )}
                 </dd>
              </div>

              {/* Timestamps */}
              <div className="bg-gray-50/50 px-4 py-5 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-3">{tasksAPI.formatDate(task.createdAt)}</dd>
              </div>
              <div className="px-4 py-5 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-3">{tasksAPI.formatDate(task.updatedAt)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
             <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowDeleteModal(false)}></div>
                {/* Modal panel */}
                 <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">​</span>
                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                  <div>
                     <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                     </div>
                    <div className="mt-3 text-center sm:mt-5">
                       <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Task</h3>
                      <div className="mt-2">
                         <p className="text-sm text-gray-500">
                            Are you sure you want to delete the task "{task.taskName}"? This action cannot be undone.
                         </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                     <button
                        type="button"
                        className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:col-start-2 sm:text-sm ${
                           deleteTaskMutation.isPending ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                        }`}
                        onClick={handleDeleteConfirm}
                        disabled={deleteTaskMutation.isPending}
                      >
                       {deleteTaskMutation.isPending ? (
                         <><ArrowPathIcon className="h-5 w-5 mr-2 animate-spin"/> Deleting...</>
                       ) : (
                         "Delete Task"
                       )}
                     </button>
                     <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                        onClick={() => setShowDeleteModal(false)}
                         disabled={deleteTaskMutation.isPending}
                      >
                       Cancel
                     </button>
                  </div>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback if status is unexpected
  return <div className="p-6 text-center">Loading or error state...</div>;
};

export default ConsultantTaskDetail;