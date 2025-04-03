


// import { useState, useEffect } from "react"
// import { useNavigate } from "react-router-dom"
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
// import { toast } from "react-toastify"
// import {
//   PlusIcon,
//   PencilIcon,
//   TrashIcon,
//   ArrowPathIcon,
//   ClipboardDocumentListIcon,
//   XCircleIcon,
//   BuildingOfficeIcon,
//   UserIcon,
//   EyeIcon
// } from "@heroicons/react/24/outline"
// import tasksAPI from "../../../api/tasks"
// import projectsAPI from "../../../api/projects"
// import authAPI from "../../../api/auth"

// const TasksList = () => {
//   console.log("TasksList component loaded")
//   const navigate = useNavigate()
//   const queryClient = useQueryClient()
//   const [isDeleting, setIsDeleting] = useState(false)
//   const [taskToDelete, setTaskToDelete] = useState(null)
//   const [selectedProject, setSelectedProject] = useState("")
//   const [isAdmin, setIsAdmin] = useState(false)

//   useEffect(() => {
//     setIsAdmin(authAPI.isAdmin())
//   }, [])

//   // Fetch projects for filter dropdown
//   const {
//     data: projectsData,
//     isLoading: isLoadingProjects,
//   } = useQuery({
//     queryKey: ["projects"],
//     queryFn: projectsAPI.getAllProjects,
//   })

//   // Fetch tasks for the selected project using the new filtering approach
//   const {
//     data: tasksData,
//     isLoading: isLoadingTasks,
//     error: tasksError,
//     refetch: refetchTasks,
//   } = useQuery({
//     queryKey: ["tasks", selectedProject],
//     queryFn: () =>
//       selectedProject ? tasksAPI.getTasksForProject(selectedProject) : [],
//     enabled: !!selectedProject,
//   })

//   // Delete task mutation
//   const deleteTaskMutation = useMutation({
//     mutationFn: tasksAPI.deleteTask,
//     onSuccess: () => {
//       toast.success("Task deleted successfully")
//       queryClient.invalidateQueries({ queryKey: ["tasks"] })
//       queryClient.invalidateQueries({ queryKey: ["projects"] })
//       setIsDeleting(false)
//       setTaskToDelete(null)
//     },
//     onError: (error) => {
//       toast.error(error.message || "Failed to delete task")
//       setIsDeleting(false)
//     },
//   })

//   // Handle create task navigation
//   const handleCreateTask = () => {
//     if (!selectedProject) {
//       toast.warning("Please select a project first")
//       return
//     }
//     console.log("Navigating to create task page")
//     navigate(`/admin/tasks/create?projectId=${selectedProject}`)
//   }

//   // Handle project filter change
//   const handleProjectChange = (e) => {
//     setSelectedProject(e.target.value)
//   }

//   // Handle delete confirmation
//   const confirmDelete = (taskId) => {
//     setTaskToDelete(taskId)
//   }

//   // Handle delete task
//   const handleDelete = () => {
//     setIsDeleting(true)
//     deleteTaskMutation.mutate(taskToDelete)
//   }

//   // Cancel delete
//   const cancelDelete = () => {
//     setTaskToDelete(null)
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
//       <div className="sm:flex sm:items-center sm:justify-between mb-8">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900 mb-1">Tasks</h1>
//           <p className="text-gray-500 text-sm">
//             Manage project tasks and assignments.
//           </p>
//         </div>
//         <div className="mt-4 sm:mt-0 flex space-x-3">
//           <button
//             type="button"
//             onClick={handleCreateTask}
//             className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//           >
//             <PlusIcon className="h-5 w-5 mr-2" />
//             Create Task
//           </button>
//         </div>
//       </div>

//       {/* Project Filter */}
//       <div className="mb-6">
//         <label
//           htmlFor="project-filter"
//           className="block text-sm font-medium text-gray-700 mb-1"
//         >
//           Select Project
//         </label>
//         <div className="flex">
//           <select
//             id="project-filter"
//             value={selectedProject}
//             onChange={handleProjectChange}
//             className="block w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
//           >
//             <option value="">Select a project</option>
//             {projectsData?.data?.map((project) => (
//               <option key={project._id} value={project._id}>
//                 {project.projectName}
//               </option>
//             ))}
//           </select>
//         </div>
//       </div>

//       {/* Delete Confirmation Modal */}
//       {taskToDelete && (
//         <div className="fixed inset-0 flex z-40">
//           <div
//             className="fixed inset-0 bg-gray-600 bg-opacity-75"
//             onClick={() => cancelDelete()}
//           ></div>
//           <div className="relative flex-1 flex flex-col max-w-md m-auto p-6 bg-white rounded-lg shadow-xl">
//             <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
//               <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
//             </div>
//             <div className="mt-3 text-center">
//               <h3 className="text-lg font-medium text-gray-900">Delete Task</h3>
//               <div className="mt-2">
//                 <p className="text-sm text-gray-500">
//                   Are you sure you want to delete this task? This action cannot
//                   be undone.
//                 </p>
//               </div>
//             </div>
//             <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
//               <button
//                 type="button"
//                 className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
//                 onClick={handleDelete}
//                 disabled={isDeleting}
//               >
//                 {isDeleting ? (
//                   <>
//                     <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
//                     Deleting...
//                   </>
//                 ) : (
//                   "Delete"
//                 )}
//               </button>
//               <button
//                 type="button"
//                 className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
//                 onClick={cancelDelete}
//                 disabled={isDeleting}
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Tasks List */}
//       <div className="bg-white shadow overflow-hidden sm:rounded-md">
//         {!selectedProject ? (
//           <div className="py-20 text-center">
//             <BuildingOfficeIcon className="h-10 w-10 mx-auto text-gray-400" />
//             <p className="mt-2 text-gray-500">
//               Please select a project to view its tasks
//             </p>
//           </div>
//         ) : isLoadingTasks || isLoadingProjects ? (
//           <div className="py-20 text-center">
//             <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
//             <p className="mt-2 text-gray-500">Loading tasks...</p>
//           </div>
//         ) : tasksError ? (
//           <div className="py-20 text-center">
//             <XCircleIcon className="h-10 w-10 mx-auto text-red-500" />
//             <p className="mt-2 text-gray-700">Error loading tasks</p>
//             <p className="text-sm text-red-500">{tasksError.message}</p>
//             <button
//               onClick={() => refetchTasks()}
//               className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//             >
//               <ArrowPathIcon className="h-5 w-5 mr-2" />
//               Retry
//             </button>
//           </div>
//         ) : !tasksData || tasksData.length === 0 ? (
//           <div className="py-20 text-center">
//             <ClipboardDocumentListIcon className="h-10 w-10 mx-auto text-gray-400" />
//             <p className="mt-2 text-gray-500">No tasks found for this project</p>
//             <button
//               onClick={handleCreateTask}
//               className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//             >
//               <PlusIcon className="h-5 w-5 mr-2" />
//               Create Task
//             </button>
//           </div>
//         ) : (
//           <ul className="divide-y divide-gray-200">
//             {tasksData.map((task) => (
//               <li key={task._id}>
//                 <div className="px-4 py-4 sm:px-6">
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center">
//                       <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
//                         <ClipboardDocumentListIcon className="h-6 w-6 text-indigo-600" />
//                       </div>
//                       <div className="ml-4">
//                         <p className="text-sm font-medium text-indigo-600 truncate">
//                           {task.taskName}
//                         </p>
//                         <div className="flex items-center mt-1">
//                           <UserIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
//                           <p className="text-sm text-gray-500 truncate">
//                           {task.assignedTo && task.assignedTo.length > 0
//                             ? task.assignedTo
//                                 .map((user) => `${user.firstName} ${user.lastName}`)
//                                 .join(", ")
//                             : "Unassigned"}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                     <div className="ml-2 flex-shrink-0 flex space-x-2">
//                       {getStatusBadge(task.status)}
//                       {getPriorityBadge(task.priority)}
//                     </div>
//                   </div>
//                   <div className="mt-2 sm:flex sm:justify-between">
//                     <div className="sm:flex">
//                       <p className="flex items-center text-sm text-gray-500">
//                         <span className="truncate">
//                           {task.taskDescription.length > 100
//                             ? `${task.taskDescription.substring(0, 100)}...`
//                             : task.taskDescription}
//                         </span>
//                       </p>
//                     </div>
//                     <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
//                       <div className="flex space-x-2">
//                         <p>
//                           <span className="font-medium text-gray-900">
//                             Start:
//                           </span>{" "}
//                           {formatDate(task.startDate)}
//                         </p>
//                         <p>|</p>
//                         <p>
//                           <span className="font-medium text-gray-900">
//                             End:
//                           </span>{" "}
//                           {formatDate(task.endDate)}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                   <div className="mt-2 flex justify-end space-x-2">
//                   <button
//                     onClick={() => navigate(`/admin/tasks/${task._id}`)}
//                     className="inline-flex items-center px-2.5 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
//                   >
//                     <EyeIcon className="h-4 w-4 mr-1" />
//                     View
//                   </button>
//                     <button
//                       onClick={() =>
//                         navigate(`/admin/tasks/edit/${task._id}`)
//                       }
//                       className="inline-flex items-center px-2.5 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//                     >
//                       <PencilIcon className="h-4 w-4 mr-1" />
//                       Edit
//                     </button>
//                     {isAdmin && (
//                       <button
//                         onClick={() => confirmDelete(task._id)}
//                         className="inline-flex items-center px-2.5 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
//                       >
//                         <TrashIcon className="h-4 w-4 mr-1" />
//                         Delete
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>
//     </div>
//   )
// }

// export default TasksList


import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  XCircleIcon,
  BuildingOfficeIcon,
  UserIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import tasksAPI from "../../../api/tasks";
import projectsAPI from "../../../api/projects";
import authAPI from "../../../api/auth";

const TasksList = () => {
  console.log("TasksList component loaded");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [selectedProject, setSelectedProject] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(authAPI.isAdmin());
  }, []);

  // Fetch projects for filter dropdown
  const {
    data: projectsResponse, // Renamed to avoid conflict, API returns { data: [...] }
    isLoading: isLoadingProjects,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsAPI.getAllProjects,
  });

  // Extract projects array from the response
  const projectsData = projectsResponse?.data;

  // Fetch tasks for the selected project using the getTasks function with filters
  const {
    data: tasksDataResponse, // Renamed to clarify it's the response object
    isLoading: isLoadingTasks,
    error: tasksError,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: ["tasks", { project: selectedProject }], // Updated queryKey
    queryFn: () => {
      // Use the getTasks function, passing the project ID in the filters object
      return tasksAPI.getTasks({ project: selectedProject });
    },
    // Only run the query if a project ID is selected
    enabled: !!selectedProject,
    // Optional: Keep previous data while refetching for a smoother experience
    // keepPreviousData: true,
  });

  // Extract the actual tasks array from the response object
  // Your getTasks API returns an object like { success: boolean, data: Array<object>, ... }
  const tasksData = tasksDataResponse?.data; // <-- Extract the array here

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: tasksAPI.deleteTask,
    onSuccess: () => {
      toast.success("Task deleted successfully");
      // Invalidate queries related to the specific project's tasks
      queryClient.invalidateQueries({ queryKey: ["tasks", { project: selectedProject }] });
      // Optionally invalidate general tasks if needed elsewhere, but specific is better
      // queryClient.invalidateQueries({ queryKey: ["tasks"] });
      // You might not need to invalidate projects unless deleting a task affects project stats shown elsewhere
      // queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsDeleting(false);
      setTaskToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete task");
      setIsDeleting(false);
    },
  });

  // Handle create task navigation
  const handleCreateTask = () => {
    if (!selectedProject) {
      toast.warning("Please select a project first");
      return;
    }
    console.log("Navigating to create task page");
    navigate(`/admin/tasks/create?projectId=${selectedProject}`);
  };

  // Handle project filter change
  const handleProjectChange = (e) => {
    setSelectedProject(e.target.value);
  };

  // Handle delete confirmation
  const confirmDelete = (taskId) => {
    setTaskToDelete(taskId);
  };

  // Handle delete task
  const handleDelete = () => {
    setIsDeleting(true);
    deleteTaskMutation.mutate(taskToDelete);
  };

  // Cancel delete
  const cancelDelete = () => {
    setTaskToDelete(null);
  };

  // Format date - using the one from tasksAPI for consistency if needed, or keep local
   const formatDate = (dateString) => {
     if (!dateString) return "N/A";
     const options = { year: "numeric", month: "long", day: "numeric" };
     try {
        return new Date(dateString).toLocaleDateString(undefined, options);
     } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return "Invalid Date";
     }
   };

  // Get status badge
  const getStatusBadge = (status) => {
    // Using taskAPI utility function for consistency (optional)
    // const badgeClass = tasksAPI.getStatusBadgeClass(status);
    // const formattedStatus = tasksAPI.formatStatus(status);
    // return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>{formattedStatus}</span>;

    // Or keep the original implementation if preferred:
    switch (status) {
      case "not_started":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Not Started
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
      case "on_hold":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            On Hold
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status ? status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ") : 'Unknown'}
          </span>
        );
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority) => {
     // Using taskAPI utility function for consistency (optional)
    // const badgeClass = tasksAPI.getPriorityBadgeClass(priority);
    // const formattedPriority = tasksAPI.formatPriority(priority);
    // return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>{formattedPriority}</span>;

    // Or keep the original implementation:
    switch (priority) {
      case "low":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Low
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Medium
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            High
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'Unknown'}
          </span>
        );
    }
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Tasks</h1>
          <p className="text-gray-500 text-sm">
            Manage project tasks and assignments.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            type="button"
            onClick={handleCreateTask}
            disabled={!selectedProject} // Optionally disable if no project selected
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${!selectedProject ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Task
          </button>
        </div>
      </div>

      {/* Project Filter */}
      <div className="mb-6">
        <label
          htmlFor="project-filter"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Select Project
        </label>
        <div className="flex">
          <select
            id="project-filter"
            value={selectedProject}
            onChange={handleProjectChange}
            disabled={isLoadingProjects} // Disable while projects are loading
            className="block w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">{isLoadingProjects ? "Loading projects..." : "Select a project"}</option>
            {/* Use the extracted projectsData array */}
            {projectsData?.map((project) => (
              <option key={project._id} value={project._id}>
                {project.projectName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
              onClick={cancelDelete} // Allow clicking overlay to cancel
              aria-hidden="true"
            ></div>

            {/* Modal Panel */}
            <div className="relative bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full sm:p-6">
                <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                            Delete Task
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">
                                Are you sure you want to delete this task? This action cannot be undone.
                            </p>
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
                        {isDeleting ? (
                            <>
                                <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            'Delete'
                        )}
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

      {/* Tasks List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {!selectedProject ? (
          <div className="py-20 text-center">
            <BuildingOfficeIcon className="h-12 w-12 mx-auto text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              Please select a project to view its tasks.
            </p>
          </div>
        ) : isLoadingTasks ? ( // Check isLoadingTasks directly
          <div className="py-20 text-center">
            <ArrowPathIcon className="h-10 w-10 mx-auto text-indigo-600 animate-spin" />
            <p className="mt-2 text-sm text-gray-500">Loading tasks...</p>
          </div>
        ) : tasksError ? (
          <div className="py-20 text-center px-4">
            <XCircleIcon className="h-10 w-10 mx-auto text-red-500" />
            <p className="mt-2 text-base font-medium text-gray-700">Error loading tasks</p>
            <p className="text-sm text-red-600 mt-1">{tasksError.message || "An unknown error occurred."}</p>
            <button
              onClick={() => refetchTasks()}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Retry
            </button>
          </div>
        // Use the extracted tasksData array for the checks and mapping
        ) : !tasksData || tasksData.length === 0 ? (
          <div className="py-20 text-center">
            <ClipboardDocumentListIcon className="h-12 w-12 mx-auto text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No tasks found for this project.</p>
            <button
              onClick={handleCreateTask}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create First Task
            </button>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200">
            {/* Map over the extracted tasksData array */}
            {tasksData.map((task) => (
              <li key={task._id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50"> {/* Added hover effect */}
                  <div className="flex items-center justify-between flex-wrap gap-y-2"> {/* Allow wrapping */}
                    <div className="flex items-center min-w-0 flex-1"> {/* Ensure text truncates */}
                      <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <ClipboardDocumentListIcon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                      </div>
                      <div className="ml-4 min-w-0 flex-1"> {/* Ensure text truncates */}
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {task.taskName}
                        </p>
                        <div className="flex items-center mt-1">
                          <UserIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" aria-hidden="true" />
                          <p className="text-sm text-gray-500 truncate">
                          {task.assignedTo && task.assignedTo.length > 0
                            ? task.assignedTo
                                .map((user) => user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown User') // Safer mapping
                                .filter(name => name) // Remove empty names
                                .join(", ") || "Unassigned" // Handle case where all users are invalid
                            : "Unassigned"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex space-x-2 items-center"> {/* Align badges */}
                      {getPriorityBadge(task.priority)}
                      {getStatusBadge(task.status)}
                    </div>
                  </div>
                  <div className="mt-3 sm:flex sm:justify-between sm:items-end"> {/* Align bottom row */}
                    <div className="sm:flex-1 min-w-0 pr-4"> {/* Limit description width */}
                      <p className="text-sm text-gray-600"> {/* Slightly darker text */}
                        {task.taskDescription ? (
                            task.taskDescription.length > 150 // Increased length slightly
                            ? `${task.taskDescription.substring(0, 150)}...`
                            : task.taskDescription
                        ) : (
                            <span className="italic text-gray-400">No description provided.</span>
                        )}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500"> {/* Smaller date text */}
                          <p>
                            <span className="font-medium text-gray-700">
                              Start:
                            </span>{" "}
                            {formatDate(task.startDate)}
                          </p>
                          <p>
                            <span className="font-medium text-gray-700">
                              Due: {/* Changed End to Due */}
                            </span>{" "}
                            {formatDate(task.endDate)}
                          </p>
                       </div>
                    </div>
                    <div className="mt-3 sm:mt-0 flex-shrink-0 flex items-center justify-end space-x-2"> {/* Actions */}
                      <button
                        onClick={() => navigate(`/admin/tasks/${task._id}`)}
                        title="View Task Details" // Added title for accessibility
                        className="inline-flex items-center px-2.5 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <EyeIcon className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">View</span> {/* Screen reader text */}
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/admin/tasks/edit/${task._id}`)
                        }
                        title="Edit Task" // Added title
                        className="inline-flex items-center px-2.5 py-1 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <PencilIcon className="h-4 w-4" aria-hidden="true" />
                         <span className="sr-only">Edit</span> {/* Screen reader text */}
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => confirmDelete(task._id)}
                          title="Delete Task" // Added title
                          className="inline-flex items-center px-2.5 py-1 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <TrashIcon className="h-4 w-4" aria-hidden="true" />
                           <span className="sr-only">Delete</span> {/* Screen reader text */}
                        </button>
                      )}
                    </div>
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

export default TasksList;