 /* eslint-disable */


"use client"

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon, // Consistent status icon base
  XCircleIcon,
  BuildingOffice2Icon, // Consistent project icon
  UserCircleIcon, // Consistent user icon
  MagnifyingGlassIcon,
  CalendarDaysIcon, // Consistent calendar icon
  ExclamationTriangleIcon, // Consistent error/warning icon
  AdjustmentsHorizontalIcon,
  ArrowUpIcon, // Sort Icons
  ArrowDownIcon,
} from "@heroicons/react/24/outline";
import tasksAPI from "../../../api/tasks"; // Use refined API
import projectsAPI from "../../../api/projects";
import authAPI from "../../../api/auth";

const ConsultantTasksList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser, isLoading: isLoadingAuth } = useAuth(); // Use custom hook

  // Filters & Sorting State
  const [selectedProject, setSelectedProject] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // 'all', 'today', 'upcoming', 'overdue'
  const [sortBy, setSortBy] = useState("endDate"); // 'endDate', 'priority', 'status', 'taskName'
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc', 'desc'
  const [showFilters, setShowFilters] = useState(false);

  // Modal State
  const [taskToDelete, setTaskToDelete] = useState(null); // Store { id, name } for modal

  // Derived State
  const isConsultant = currentUser?.role === 'consultant';

  // --- Authorization Effect ---
  useEffect(() => {
    // Redirect if auth loaded and user is not a consultant
    if (!isLoadingAuth && !isConsultant) {
        toast.error("Access Denied: Consultant role required.");
        navigate("/dashboard");
    }
  }, [isLoadingAuth, isConsultant, navigate]);


  // --- Fetch Projects for Filter Dropdown ---
  const {
    data: projectsQueryData, // { success, data: { projects: [] } }
    isLoading: isLoadingProjects,
    isError: isProjectsError,
    error: projectsError,
  } = useQuery({
    queryKey: ["consultant-projects", currentUser?._id],
    queryFn: () => projectsAPI.getProjectsByConsultant(currentUser?._id),
    enabled: !isLoadingAuth && isConsultant, // Enable when auth ready & is consultant
  });
  const consultantProjects = projectsQueryData?.data?.projects || [];

  // --- Fetch Tasks based on Selected Project ---
  // Uses the main getTasks endpoint with a project filter
  const {
    data: tasksQueryData, // API response { success, count, totalCount, pagination, data: [] }
    isLoading: isLoadingTasks,
    error: tasksError,
    isError: isTasksError,
    refetch: refetchTasks,
  } = useQuery({
    // Key includes project, potentially other filters if sent to backend
    queryKey: ["tasks", { project: selectedProject }],
    // Pass filter object to getTasks
    queryFn: () => tasksAPI.getTasks({ project: selectedProject, limit: 1000 }), // Fetch all for selected project for client-side filtering
    // Enable only when project is selected AND user is consultant
    enabled: !!selectedProject && isConsultant,
    placeholderData: { data: [], count: 0 }, // Provide initial structure
  });
   // Extract the actual tasks array
  const tasksList = tasksQueryData?.data || [];

  // --- Delete Task Mutation ---
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => tasksAPI.deleteTask(taskId),
    onSuccess: (_, deletedTaskId) => { // Pass taskId to onSuccess if needed
      toast.success(`Task "${taskToDelete?.name || 'Task'}" deleted successfully`);
      setTaskToDelete(null); // Close modal
      // Invalidate queries to refetch tasks
       queryClient.invalidateQueries({ queryKey: ["tasks", { project: selectedProject }] });
       queryClient.invalidateQueries({ queryKey: ["tasks"] }); // General invalidation if used elsewhere
       queryClient.invalidateQueries({ queryKey: ["project", selectedProject] }); // Invalidate project details if task count changes
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message || "Please try again."}`);
      // Keep modal open on error? Or close: setTaskToDelete(null);
    },
  });

  // --- Client-Side Filtering and Sorting ---
  const filteredAndSortedTasks = useMemo(() => {
    if (!Array.isArray(tasksList)) return [];

    let filtered = tasksList;

    // Apply Search Filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((task) =>
        (task.taskName?.toLowerCase() || "").includes(searchLower) ||
        (task.taskDescription?.toLowerCase() || "").includes(searchLower)
      );
    }

    // Apply Status Filter
    if (statusFilter) {
      filtered = filtered.filter((task) => task.status === statusFilter);
    }

    // Apply Priority Filter
    if (priorityFilter) {
      filtered = filtered.filter((task) => task.priority === priorityFilter);
    }

    // Apply Date Filter
    if (dateFilter !== "all") {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today

        filtered = filtered.filter(task => {
            if (!task.endDate || !task.status) return false; // Skip tasks without end date or status for date filtering

            const taskEndDate = new Date(task.endDate);
            taskEndDate.setHours(0, 0, 0, 0); // Normalize task end date

            const isOverdue = tasksAPI.isTaskOverdue(task.endDate, task.status);

            if (dateFilter === "upcoming") {
                return !isOverdue && task.status !== "completed" && taskEndDate.getTime() >= today.getTime();
            } else if (dateFilter === "overdue") {
                return isOverdue;
            } else if (dateFilter === "today") {
                return taskEndDate.getTime() === today.getTime();
            }
            return true; // Should not be reached if dateFilter is valid
        });
    }

    // Apply Sorting
    const sorted = filtered.slice().sort((a, b) => {
        let comparison = 0;
        try {
            if (sortBy === "endDate") {
                const dateA = a.endDate ? new Date(a.endDate).getTime() : (sortOrder === 'asc' ? Infinity : -Infinity);
                const dateB = b.endDate ? new Date(b.endDate).getTime() : (sortOrder === 'asc' ? Infinity : -Infinity);
                comparison = dateA - dateB;
            } else if (sortBy === "priority") {
                const priorityOrder = { low: 1, medium: 2, high: 3 };
                comparison = (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
            } else if (sortBy === "status") {
                const statusOrder = { not_started: 1, in_progress: 2, on_hold: 3, completed: 4 };
                 comparison = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
            } else if (sortBy === "taskName") {
                comparison = (a.taskName || "").localeCompare(b.taskName || "");
            }
        } catch (sortError) {
             console.error("Error during sorting:", sortError, "Task A:", a, "Task B:", b);
             return 0;
        }

        return sortOrder === "asc" ? comparison : comparison * -1;
    });

    return sorted;

  }, [tasksList, searchTerm, statusFilter, priorityFilter, dateFilter, sortBy, sortOrder]);


  // --- Event Handlers ---
  const handleCreateTask = () => {
    if (!selectedProject) {
      toast.warning("Please select a project first.");
      return;
    }
    navigate(`/tasks/create?projectId=${selectedProject}`);
  };

  const handleProjectChange = (e) => {
    setSelectedProject(e.target.value);
    // Reset filters when project changes? (Optional)
    // resetFilters();
  };

  const confirmDelete = (taskId, taskName) => {
    setTaskToDelete({ id: taskId, name: taskName });
  };

  const handleDeleteConfirm = () => {
    if (!taskToDelete) return;
    // Check if user created the task BEFORE deleting
     const task = tasksList.find(t => t._id === taskToDelete.id);
     if (task && task.createdBy?._id !== currentUser?.id) {
         toast.error("Permission Denied: You can only delete tasks you created.");
         setTaskToDelete(null);
         return;
     }
    deleteTaskMutation.mutate(taskToDelete.id);
  };

  const cancelDelete = () => {
    setTaskToDelete(null);
  };

  const toggleSortOrder = (column) => {
      if (sortBy === column) {
          setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
      } else {
          setSortBy(column);
          setSortOrder('asc'); // Default to ascending when changing column
      }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setPriorityFilter("");
    setDateFilter("all");
    setSortBy("endDate");
    setSortOrder("asc");
    setShowFilters(false); // Optionally hide filters on reset
  };

  // --- Badge & Util Functions ---
  const getStatusBadge = (status) => {
     const className = tasksAPI.getStatusBadgeClass(status);
     const text = tasksAPI.formatStatus(status);
     return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>{text}</span>;
  }
  const getPriorityBadge = (priority) => {
    const className = tasksAPI.getPriorityBadgeClass(priority);
    const text = tasksAPI.formatPriority(priority);
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>{text}</span>;
  }
  const getDaysRemainingBadge = (endDate, status) => {
    const days = tasksAPI.calculateDaysRemaining(endDate);
    const isOverdue = tasksAPI.isTaskOverdue(endDate, status);
    const text = tasksAPI.formatDate(endDate); // Base text is the formatted date

    if (status === 'completed') {
        return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${tasksAPI.getStatusBadgeClass('completed')}`}>Completed</span>;
    }
    if (!endDate) {
        return <span className="text-xs text-gray-400 italic">No end date</span>;
    }
    if (isOverdue) {
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Overdue ({Math.abs(days)}d)</span>;
    }
    if (days === 0) {
         return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Due Today</span>;
    }
    // Use a different color for upcoming maybe?
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">{days}d left</span>;
  }

  // --- Render Logic ---

  // 1. Initial Auth Loading
   if (isLoadingAuth) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <ArrowPathIcon className="h-8 w-8 text-gray-500 animate-spin mr-3" />
        <span className="text-gray-600">Loading user data...</span>
      </div>
    );
  }
   // Should not be reached if useEffect redirect works, but safety check
   if (!isConsultant) {
       return null;
   }


   // Function to render sort indicator icons
   const SortIcon = ({ column }) => {
       if (sortBy !== column) return null;
       return sortOrder === 'asc' ? <ArrowUpIcon className="w-3 h-3 ml-1 inline-block text-gray-600" /> : <ArrowDownIcon className="w-3 h-3 ml-1 inline-block text-gray-600" />;
   };


   // 2. Main Content Area
  let tasksContent;
   if (!selectedProject) {
      tasksContent = (
         <div className="py-20 text-center border-t border-gray-200">
             <BuildingOffice2Icon className="h-12 w-12 mx-auto text-gray-300" />
             <h3 className="mt-2 text-sm font-medium text-gray-900">Select a Project</h3>
             <p className="mt-1 text-sm text-gray-500">Choose a project from the dropdown above to see its tasks.</p>
         </div>
      );
  } else if (isLoadingTasks) {
      tasksContent = (
        <div className="py-20 text-center border-t border-gray-200">
          <ArrowPathIcon className="h-8 w-8 mx-auto text-gray-400 animate-spin" />
          <p className="mt-2 text-sm text-gray-500">Loading tasks...</p>
        </div>
      );
  } else if (isTasksError) {
      tasksContent = (
         <div className="py-20 text-center border-t border-gray-200">
             <XCircleIcon className="h-10 w-10 mx-auto text-red-400" />
             <h3 className="mt-2 text-sm font-medium text-red-800">Error Loading Tasks</h3>
             <p className="mt-1 text-sm text-red-600">{tasksError.message}</p>
             <button onClick={() => refetchTasks()} className="mt-4 ...">Retry</button>
         </div>
      );
  } else if (filteredAndSortedTasks.length === 0) {
      const hasActiveFilters = searchTerm || statusFilter || priorityFilter || dateFilter !== "all";
      tasksContent = (
         <div className="py-20 text-center border-t border-gray-200">
             <ClipboardDocumentListIcon className="h-12 w-12 mx-auto text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {hasActiveFilters ? "No tasks match filters" : "No tasks found"}
              </h3>
             <p className="mt-1 text-sm text-gray-500">
                {hasActiveFilters
                    ? "Try adjusting your search or filter criteria."
                    : "Get started by creating the first task for this project."}
             </p>
             <div className="mt-6">
                 {hasActiveFilters && (
                     <button type="button" onClick={resetFilters} className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Clear Filters
                    </button>
                 )}
                  <button type="button" onClick={handleCreateTask} className={`ml-3 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}>
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Create New Task
                 </button>
             </div>
         </div>
      );
  } else {
      // --- Render Task Table ---
      tasksContent = (
           <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                   {/* Add onClick for sorting */}
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => toggleSortOrder('taskName')}>Task <SortIcon column="taskName" /></th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => toggleSortOrder('status')}>Status <SortIcon column="status" /></th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => toggleSortOrder('priority')}>Priority <SortIcon column="priority" /></th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => toggleSortOrder('endDate')}>Timeline <SortIcon column="endDate" /></th>
                   <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                 </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedTasks.map((task) => {
                    // Determine if current user can delete THIS specific task
                    const canDelete = task.createdBy?._id === currentUser?.id;
                    return (
                      <tr key={task._id} className="hover:bg-gray-50">
                        {/* Task Name & Desc */}
                         <td className="px-6 py-4 max-w-sm">
                           <div className="text-sm font-medium text-gray-900 truncate" title={task.taskName}>
                             {task.taskName || "N/A"}
                           </div>
                           <div className="text-sm text-gray-500 truncate" title={task.taskDescription}>
                             {task.taskDescription || <span className="italic">No description</span>}
                           </div>
                         </td>
                         {/* Assigned To */}
                         <td className="px-6 py-4 whitespace-nowrap">
                             {Array.isArray(task.assignedTo) && task.assignedTo.length > 0 ? (
                                 <div className="flex -space-x-1 overflow-hidden">
                                     {task.assignedTo.slice(0, 3).map(user => ( // Show max 3 avatars
                                         <UserCircleIcon key={user._id} className="inline-block h-6 w-6 rounded-full ring-2 ring-white text-gray-400" title={`${user.firstName} ${user.lastName}`} />
                                     ))}
                                     {task.assignedTo.length > 3 && (
                                         <span className="flex items-center justify-center h-6 w-6 rounded-full ring-2 ring-white bg-gray-200 text-xs font-medium text-gray-600">+{task.assignedTo.length - 3}</span>
                                     )}
                                 </div>
                             ) : (
                                 <span className="text-xs text-gray-500 italic">Unassigned</span>
                             )}
                         </td>
                         {/* Status Badge */}
                         <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(task.status)}</td>
                         {/* Priority Badge */}
                         <td className="px-6 py-4 whitespace-nowrap">{getPriorityBadge(task.priority)}</td>
                         {/* Timeline */}
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {getDaysRemainingBadge(task.endDate, task.status)}
                         </td>
                         {/* Actions */}
                         <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                             <button onClick={() => navigate(`/tasks/${task._id}`)} className="text-indigo-600 hover:text-indigo-800" title="View Details">View</button>
                             {/* Only allow edit if user created task */}
                             <button onClick={() => navigate(`/tasks/edit/${task._id}`)} className={`${canDelete ? 'text-blue-600 hover:text-blue-800' : 'text-gray-400 cursor-not-allowed'}`} disabled={!canDelete} title={canDelete ? "Edit Task" : "Only creator can edit"}>Edit</button>
                             {/* Only allow delete if user created task */}
                             <button onClick={() => confirmDelete(task._id, task.taskName)} className={`${canDelete ? 'text-red-600 hover:text-red-800' : 'text-gray-400 cursor-not-allowed'}`} disabled={!canDelete} title={canDelete ? "Delete Task" : "Only creator can delete"}>Delete</button>
                         </td>
                       </tr>
                   );
                 })}
               </tbody>
             </table>
           </div>
      );
  }


  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8"> {/* Removed max-w-7xl for full width */}
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        {/* ... Header content ... */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Tasks</h1>
          <p className="mt-1 text-sm text-gray-500">View and manage tasks for your projects.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
           {/* Project Selector */}
           <div className="flex-1 sm:flex-none sm:w-64">
               <label htmlFor="project-filter-header" className="sr-only">Select Project</label>
               <select id="project-filter-header" value={selectedProject} onChange={handleProjectChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" disabled={isLoadingProjects}>
                <option value="">{isLoadingProjects ? "Loading..." : "-- Select Project --"}</option>
                 {consultantProjects.map((project) => (
                    <option key={project._id} value={project._id}>{project.projectName}</option>
                 ))}
               </select>
               {isProjectsError && <p className="text-xs text-red-500 mt-1">Error loading projects</p>}
           </div>
          <button type="button" onClick={() => setShowFilters(!showFilters)} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-500" /> <span className="ml-2 hidden sm:inline">Filters</span>
          </button>
          <button type="button" onClick={handleCreateTask} disabled={!selectedProject} className={`inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${!selectedProject ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <PlusIcon className="h-5 w-5 mr-1" /> Task
          </button>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
           <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 items-end">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-xs font-medium text-gray-700">Search</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MagnifyingGlassIcon className="h-4 w-4 text-gray-400"/></div>
                <input type="text" id="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md sm:text-sm" placeholder="Name/description..."/>
              </div>
            </div>
            {/* Status Filter */}
            <div>
              <label htmlFor="status-filter" className="block text-xs font-medium text-gray-700">Status</label>
              <select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm">
                 <option value="">All</option>
                 <option value="not_started">Not Started</option>
                 <option value="in_progress">In Progress</option>
                 <option value="completed">Completed</option>
                 <option value="on_hold">On Hold</option>
               </select>
            </div>
            {/* Priority Filter */}
            <div>
              <label htmlFor="priority-filter" className="block text-xs font-medium text-gray-700">Priority</label>
              <select id="priority-filter" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm">
                 <option value="">All</option>
                 <option value="low">Low</option>
                 <option value="medium">Medium</option>
                 <option value="high">High</option>
               </select>
            </div>
            {/* Date Filter */}
            <div>
              <label htmlFor="date-filter" className="block text-xs font-medium text-gray-700">Due Date</label>
              <select id="date-filter" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm">
                 <option value="all">Any</option>
                 <option value="today">Today</option>
                 <option value="upcoming">Upcoming</option>
                 <option value="overdue">Overdue</option>
               </select>
            </div>
             {/* Sort/Reset Buttons */}
             <div className="flex items-end space-x-2">
                {/* Sort controls can be integrated here or kept simple */}
                <button onClick={resetFilters} className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500">
                  Reset
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Table/Placeholder */}
      <div className="mt-4 bg-white shadow sm:rounded-lg overflow-hidden">
        {tasksContent}
      </div>


       {/* Delete Confirmation Modal */}
       {taskToDelete && (
         <div className="fixed inset-0 z-50 ..."> {/* Modal Structure */}
            {/* ... Modal Content ... */}
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
               <button type="button" onClick={handleDeleteConfirm} disabled={deleteTaskMutation.isPending} className={`... ${deleteTaskMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}>
                 {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete'}
               </button>
               <button type="button" onClick={cancelDelete} disabled={deleteTaskMutation.isPending} className="...">
                 Cancel
               </button>
             </div>
            {/* ... End Modal Content ... */}
         </div>
       )}

    </div>
  );
};

// Placeholder for auth hook if not defined elsewhere
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


export default ConsultantTasksList;