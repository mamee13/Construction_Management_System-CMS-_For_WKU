

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  EyeIcon,
  FunnelIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon, // For error display
  InformationCircleIcon, // For empty state info
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import schedulesAPI from "../../../api/schedules"; // API calls for schedules CRUD
import projectsAPI from "../../../api/projects";   // API calls for projects (for filter)
import authAPI from "../../../api/auth";         // Auth utilities
import tasksAPI from "../../../api/tasks";       // Utility functions (formatDate, etc.)

const ConsultantSchedulesDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [viewMode, setViewMode] = useState("all"); // "all", "mine", "others"
  const currentUser = authAPI.getCurrentUser(); // Fetch current user info

  // Fetch all schedules
  const {
    data: schedulesResponse, // Raw API response, expected: { schedules: [...] }
    isLoading: isLoadingSchedules,
    error: schedulesError,
    refetch: refetchSchedules, // Function to manually refetch schedules
  } = useQuery({
    queryKey: ["schedules"], // React Query key for caching
    queryFn: schedulesAPI.getAllSchedules, // API function to call
    staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
    cacheTime: 1000 * 60 * 15, // Keep data in cache for 15 minutes
  });

  // *** CORRECTED DATA EXTRACTION ***
  // Extract schedules array directly from the 'schedules' key based on backend controller
  const schedulesList = schedulesResponse?.schedules || [];
  // *** END CORRECTION ***

  // Fetch projects for the filter dropdown
  const { data: projectsResponse, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects", "filter", currentUser?.role], // Unique key for project filter data
    queryFn: () => {
      if (currentUser?.role === "consultant") {
        return projectsAPI.getMyAssignedProjects(); // Fetch assigned projects for consultant
      }
      return projectsAPI.getAllProjects(); // Fetch all projects for admin
    },
    enabled: !!currentUser, // Only fetch if user info is available
    select: (data) => { // Select and normalize the project list from the response
        if (!data?.success) return [];
        return Array.isArray(data.data) ? data.data : data.data?.projects || [];
    }
  });
  // Use the selected data directly
  const projectsListForFilter = projectsResponse || [];


  // Delete schedule mutation setup
  const deleteMutation = useMutation({
    mutationFn: schedulesAPI.deleteSchedule, // API function for deleting
    onSuccess: (data) => {
      // When deletion succeeds, invalidate the schedules query cache to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success(data?.message || "Schedule deleted successfully");
    },
    onError: (error) => {
      // Show error toast on failure
      toast.error(error.message || "Failed to delete schedule");
    },
  });

  // Handle the delete button click
  const handleDelete = (scheduleId) => {
    if (window.confirm("Are you sure you want to delete this schedule? This action cannot be undone.")) {
      deleteMutation.mutate(scheduleId); // Trigger the mutation
    }
  };

  // Determine if the current user can modify (edit/delete) a schedule
  // Requires the backend 'GET /schedules' to populate the 'createdBy' field
  const canModifySchedule = (schedule) => {
    if (!currentUser || !schedule || !schedule.createdBy) {
        console.warn("canModifySchedule check failed: Missing currentUser, schedule, or populated schedule.createdBy", { currentUser, schedule });
        return false; // Cannot determine permission if data is missing
    }
    if (currentUser.role === "admin") {
        return true; // Admins can modify anything
    }
    // Consultants can modify only if their ID matches the schedule's creator ID
    // Use String() comparison for safety with potential ObjectId objects
    if (currentUser.role === "consultant" && String(schedule.createdBy._id) === String(currentUser._id)) {
        return true;
    }
    return false; // Otherwise, cannot modify
  };

  // Filter the extracted schedulesList based on current filter states
  const filteredSchedules =
    schedulesList?.filter((schedule) => {
      // Text search: Check scheduleName and scheduleDescription
      const nameMatch = schedule.scheduleName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
      const descMatch = schedule.scheduleDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
      const matchesSearch = nameMatch || descMatch;

      // Status filter: Check exact match or pass if no filter selected
      const matchesStatus = statusFilter ? schedule.status === statusFilter : true;

      // Priority filter: Check exact match or pass if no filter selected
      const matchesPriority = priorityFilter ? schedule.priority === priorityFilter : true;

      // Project filter: Check if schedule's project ID matches filter (requires project to be populated with _id)
      const matchesProject = projectFilter ? String(schedule.project?._id) === projectFilter : true;

      // View mode filter: Check creator ID against current user ID
      // *** Requires 'createdBy' field to be POPULATED with _id by the backend ***
      let matchesViewMode = true;
      if (currentUser && schedule.createdBy && viewMode === "mine") {
        matchesViewMode = String(schedule.createdBy._id) === String(currentUser._id);
      } else if (currentUser && schedule.createdBy && viewMode === "others") {
        matchesViewMode = String(schedule.createdBy._id) !== String(currentUser._id);
      } else if (!schedule.createdBy && (viewMode === 'mine' || viewMode === 'others')) {
        // If createdBy isn't populated, it cannot match 'mine' or 'others' filters
        matchesViewMode = false;
      }

      // Return true only if ALL filter conditions match
      return matchesSearch && matchesStatus && matchesPriority && matchesProject && matchesViewMode;
    }) || []; // Default to an empty array if schedulesList is initially null/undefined


  // Effect to handle authentication and authorization on component mount/update
  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      toast.error("Please login to continue.");
      navigate("/login");
      return;
    }
    // Redirect if user role is not consultant or admin
    if (currentUser && currentUser.role !== "consultant" && currentUser.role !== "admin") {
      toast.warn("Access denied for this page.");
      navigate("/dashboard"); // Or another appropriate page
    }
  }, [currentUser, navigate]);

  // --- JSX RENDERING ---
  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">Schedules Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            {currentUser?.role === "consultant"
              ? "View and manage schedules related to your projects."
              : "Manage all construction schedules."}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-4">
            <button
            type="button"
            onClick={() => navigate("/schedules/create")} // Adjust route as needed
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Create New Schedule
            </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white shadow-sm rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
            {/* Search Input */}
            <div className="sm:col-span-6 lg:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search Schedules
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M9 5a4 4 0 100 8 4 4 0 000-8zM1 9a8 8 0 1114.53 5.03l4.7 4.7a1 1 0 01-1.41 1.41l-4.7-4.7A8 8 0 011 9z" clipRule="evenodd" /></svg>
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Name or description..."
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Project Filter Dropdown */}
            <div className="sm:col-span-3 lg:col-span-1">
                <label htmlFor="project-filter" className="block text-sm font-medium text-gray-700">Project</label>
                <div className="mt-1">
                    <select id="project-filter" name="project-filter" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} disabled={isLoadingProjects}>
                        <option value="">All Projects</option>
                        {isLoadingProjects ? (
                             <option disabled>Loading...</option>
                        ): (
                             projectsListForFilter.map((project) => (
                                <option key={project._id} value={project._id}>
                                    {project.projectName}
                                </option>
                            ))
                        )}
                    </select>
                </div>
            </div>

            {/* Status Filter Dropdown */}
             <div className="sm:col-span-3 lg:col-span-1">
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">Status</label>
              <div className="mt-1">
                <select id="status-filter" name="status-filter" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="delayed">Delayed</option>
                </select>
              </div>
            </div>

            {/* Priority Filter Dropdown */}
             <div className="sm:col-span-3 lg:col-span-1">
              <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700">Priority</label>
              <div className="mt-1">
                <select id="priority-filter" name="priority-filter" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* View Mode Filter Dropdown */}
             <div className="sm:col-span-3 lg:col-span-1">
                <label htmlFor="view-mode-filter" className="block text-sm font-medium text-gray-700">View</label>
                <div className="mt-1">
                    <select id="view-mode-filter" name="view-mode-filter" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" value={viewMode} onChange={(e) => setViewMode(e.target.value)} disabled={!currentUser} >
                    <option value="all">All Schedules</option>
                    <option value="mine">Created by Me</option>
                    <option value="others">Created by Others</option>
                    </select>
                </div>
            </div>

          </div>

          {/* Filter Actions */}
          <div className="mt-5 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => { setSearchTerm(""); setStatusFilter(""); setPriorityFilter(""); setProjectFilter(""); setViewMode("all"); }}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Clear Filters
            </button>
            <button
              type="button"
              onClick={() => refetchSchedules()}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              disabled={isLoadingSchedules}
            >
              <ArrowPathIcon className={`-ml-1 mr-2 h-5 w-5 ${isLoadingSchedules ? 'animate-spin' : ''}`} aria-hidden="true" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Schedules Table / List Display */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {isLoadingSchedules ? (
          // Loading State
          <div className="flex justify-center items-center py-20 text-gray-500">
            <ArrowPathIcon className="h-8 w-8 animate-spin mr-3" aria-hidden="true" />
            <span>Loading schedules...</span>
          </div>
        ) : schedulesError ? (
          // Error State
          <div className="px-6 py-12 text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-lg font-semibold text-red-800">Failed to load schedules</h3>
            <p className="mt-1 text-sm text-red-600 mb-4">{schedulesError.message || "An unknown error occurred."}</p>
            <button
              onClick={() => refetchSchedules()}
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Retry
            </button>
          </div>
        ) : filteredSchedules.length === 0 ? (
          // Empty State
           <div className="px-6 py-12 text-center">
             <InformationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
             <h3 className="mt-2 text-lg font-semibold text-gray-900">No Schedules Found</h3>
             <p className="mt-1 text-sm text-gray-500">
                 {searchTerm || statusFilter || priorityFilter || projectFilter || viewMode !== "all"
                 ? "No schedules match your current filters. Try adjusting or clearing them."
                 : "There are no schedules to display. Get started by creating one."}
             </p>
              <div className="mt-6">
                {(searchTerm || statusFilter || priorityFilter || projectFilter || viewMode !== "all") ? (
                   <button onClick={() => { setSearchTerm(""); setStatusFilter(""); setPriorityFilter(""); setProjectFilter(""); setViewMode("all"); }} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Clear Filters</button>
                ) : (
                 <button type="button" onClick={() => navigate("/schedules/create")} className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                   <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" /> Create Schedule
                 </button>
                )}
               </div>
           </div>
        ) : (
          // Table Display
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project / Task</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status & Priority</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSchedules.map((schedule) => (
                  <tr key={schedule._id} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                    {/* Schedule Name & Desc */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{schedule.scheduleName || <span className="text-gray-400 italic">No Name</span>}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs" title={schedule.scheduleDescription}>{schedule.scheduleDescription || "-"}</div>
                    </td>
                    {/* Project / Task */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{schedule.project?.projectName || <span className="text-gray-400 italic">No Project</span>}</div>
                      <div className="text-sm text-gray-500">{schedule.task?.taskName || <span className="text-gray-400 italic">No Task</span>}</div>
                    </td>
                    {/* Dates */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-700" title="Start Date">
                        <CalendarIcon className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" />
                        {tasksAPI.formatDate(schedule.startDate)}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1" title="End Date">
                        <CalendarIcon className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" />
                        {tasksAPI.formatDate(schedule.endDate)}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1" title="Duration">
                         <ClockIcon className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" />
                         {schedule.duration ?? tasksAPI.getTaskDuration(schedule.startDate, schedule.endDate) ?? "N/A"} days
                       </div>
                    </td>
                    {/* Status & Priority */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tasksAPI.getStatusBadgeClass(schedule.status)}`}>
                        {tasksAPI.formatStatus(schedule.status)}
                      </span>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tasksAPI.getPriorityBadgeClass(schedule.priority)}`}>
                          {tasksAPI.formatPriority(schedule.priority)}
                        </span>
                      </div>
                    </td>
                    {/* Created By - Requires population */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {schedule.createdBy ? `${schedule.createdBy.firstName || ""} ${schedule.createdBy.lastName || ""}`.trim() : <span className="text-gray-400 italic">Unknown</span>}
                      </div>
                      <div className="text-xs text-gray-500">
                        {currentUser && schedule.createdBy?._id === currentUser._id ? "(You)" : ""}
                         {/* Add a note if creator info is missing */}
                         {!schedule.createdBy && <span className="text-red-500 text-xs italic ml-1">(Missing Creator Info)</span>}
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                       <div className="flex justify-end items-center space-x-3">
                           <button onClick={() => navigate(`/schedules/${schedule._id}`)} className="text-blue-600 hover:text-blue-800 transition-colors duration-150 ease-in-out" title="View Schedule Details">
                           <EyeIcon className="h-5 w-5" /> <span className="sr-only">View</span>
                           </button>
                           {/* Conditionally render Edit/Delete based on permissions */}
                           {canModifySchedule(schedule) ? (
                             <>
                               <button onClick={() => navigate(`/schedules/edit/${schedule._id}`)} className="text-indigo-600 hover:text-indigo-800 transition-colors duration-150 ease-in-out" title="Edit Schedule">
                                 <PencilSquareIcon className="h-5 w-5" /> <span className="sr-only">Edit</span>
                               </button>
                               <button onClick={() => handleDelete(schedule._id)} className="text-red-600 hover:text-red-800 transition-colors duration-150 ease-in-out" title="Delete Schedule" disabled={deleteMutation.isLoading && deleteMutation.variables === schedule._id}>
                                 {deleteMutation.isLoading && deleteMutation.variables === schedule._id ? <ArrowPathIcon className="h-5 w-5 animate-spin"/> : <TrashIcon className="h-5 w-5" />}
                                 <span className="sr-only">Delete</span>
                               </button>
                             </>
                           ) : (
                             // Optionally show disabled buttons or nothing if user cannot modify
                             <span title="You do not have permission to modify this schedule">
                                 <button className="text-gray-400 cursor-not-allowed" disabled title="Edit Schedule">
                                     <PencilSquareIcon className="h-5 w-5" /> <span className="sr-only">Edit (disabled)</span>
                                 </button>
                                 <button className="text-gray-400 cursor-not-allowed ml-3" disabled title="Delete Schedule">
                                     <TrashIcon className="h-5 w-5" /> <span className="sr-only">Delete (disabled)</span>
                                 </button>
                             </span>
                           )}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultantSchedulesDashboard;