"use client"; // Keep if using Next.js App Router

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Import useLocation
import { useQuery } from "@tanstack/react-query";
import {
  BuildingOfficeIcon,
  ArrowPathIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ExclamationTriangleIcon, // For errors
  InformationCircleIcon, // For info/empty states
} from "@heroicons/react/24/outline";
import authAPI from "../../api/auth"; // Adjust path if needed
import projectsAPI from "../../api/projects"; // Adjust path if needed

const ConsultantProjects = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get location object
  const currentUser = authAPI.getCurrentUser();
  const [searchTerm, setSearchTerm] = useState("");

  // Read initial filter from URL query params
  const searchParams = new URLSearchParams(location.search);
  const initialFilter = searchParams.get("filter") || "";
  const [statusFilter, setStatusFilter] = useState(initialFilter);

  // Role check - simplified as rendering is conditional anyway
  const isConsultant = currentUser?.role === "consultant";

  useEffect(() => {
    if (!isConsultant && currentUser) { // Only redirect if user data is loaded and they aren't a consultant
      console.warn("User is not a consultant, redirecting.");
      navigate("/dashboard"); // Or /unauthorized
    }
  }, [isConsultant, currentUser, navigate]);

   // Update URL when filter changes - optional but good UX
   useEffect(() => {
     const params = new URLSearchParams(location.search);
     if (statusFilter) {
       params.set('filter', statusFilter);
     } else {
       params.delete('filter');
     }
     // Replace history state to avoid multiple back button entries for filters
     navigate(`${location.pathname}?${params.toString()}`, { replace: true });
   }, [statusFilter, navigate, location.pathname, location.search]);


  // Fetch assigned projects using the new API method
  const {
    data: projectsResponse, // Rename to avoid confusion with derived 'projects'
    isLoading,
    error,
    refetch,
    isFetching, // Use isFetching for subtle loading states like refetching
  } = useQuery({
    // Include user ID in query key for cache invalidation on user change
    queryKey: ["consultant-projects", currentUser?._id],
    // Call the specific API function
    queryFn: () => projectsAPI.getProjectsByConsultant(currentUser?._id),
    // Only run the query if we have a consultant user ID
    enabled: !!currentUser?._id && isConsultant,
    // Optional: Add staleTime or cacheTime if needed
    // staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Extract projects, ensuring correct data structure access
  const projects = projectsResponse?.data?.projects || [];

  // Filter projects based on search term and status
  const filteredProjects = projects.filter(
    (project) =>
      (searchTerm === "" ||
        project.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.projectLocation?.toLowerCase().includes(searchTerm.toLowerCase())) && // Use projectLocation
      (statusFilter === "" || project.status === statusFilter)
  );

  // Return null or a placeholder if the user isn't a consultant or data isn't loaded yet
  // This prevents rendering the main structure for non-consultants
  if (!isConsultant && currentUser) {
      return <div className="p-6 text-center text-gray-500">Access Denied. Redirecting...</div>; // Or a dedicated unauthorized component
  }
   if (!currentUser) {
     // Could show a loading state while currentUser is being determined
     return <div className="p-6 text-center text-gray-500">Loading user data...</div>;
   }


  // --- Define available status options for the filter ---
  // Match these with your actual project statuses that are relevant for consultants
  const statusOptions = [
    { value: "planned", label: "Planned" },
    { value: "in_progress", label: "In Progress" },
    { value: "review_needed", label: "Review Needed" }, // Assuming this exists
    { value: "completed", label: "Completed" },
    { value: "on_hold", label: "On Hold" },
    { value: "cancelled", label: "Cancelled" },
    // Add other relevant statuses here
  ];

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-full mx-auto"> {/* Use max-w-full if table needs width */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Assigned Projects</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of construction projects where you are the assigned consultant.
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative flex-grow md:max-w-xs lg:max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
            placeholder="Search by name or location..."
          />
        </div>
        <div className="flex items-center gap-4">
            {/* Status Filter Dropdown */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FunnelIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full appearance-none pl-10 pr-8 py-2 text-base border border-gray-300 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md transition duration-150 ease-in-out"
                aria-label="Filter by project status"
                >
                <option value="">All Statuses</option>
                {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
                </select>
                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
            </div>
            {/* Optional: Refresh Button */}
            <button
                onClick={() => refetch()}
                disabled={isFetching}
                className={`p-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out ${isFetching ? 'animate-pulse cursor-not-allowed' : ''}`}
                aria-label="Refresh projects list"
            >
                <ArrowPathIcon className={`h-5 w-5 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
        </div>
      </div>

      {/* Projects List Section */}
      <div className="bg-white shadow-md overflow-hidden sm:rounded-lg">
        {isLoading ? (
          <div className="py-20 text-center">
            <ArrowPathIcon className="h-10 w-10 mx-auto text-indigo-600 animate-spin" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-gray-600">Loading your projects...</p>
          </div>
        ) : error ? (
          <div className="py-16 px-6 text-center bg-red-50 rounded-lg border border-red-200">
            <XCircleIcon className="h-10 w-10 mx-auto text-red-500" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-red-800">Failed to load projects</p>
            <p className="mt-1 text-sm text-red-600">{error.message || "An unexpected error occurred."}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out"
            >
              <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Retry
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-16 px-6 text-center bg-gray-50 rounded-lg border border-gray-200">
            <InformationCircleIcon className="h-10 w-10 mx-auto text-gray-400" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-gray-700">
              {searchTerm || statusFilter
                ? "No projects match your current filters."
                : "You are not currently assigned to any projects."}
            </p>
            {(searchTerm || statusFilter) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                }}
                className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          // Table for displaying projects
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project & Manager</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Location</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Timeline</th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProjects.map((project) => (
                  <tr key={project._id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                    {/* Project Name & PM */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {/* Optional Icon
                         <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                          <BuildingOfficeIcon className="h-6 w-6 text-indigo-600" />
                        </div> */}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{project.projectName || 'N/A'}</div>
                          <div className="text-sm text-gray-500">
                            PM: {project.projectManager?.firstName || ''} {project.projectManager?.lastName || 'Unassigned'}
                          </div>
                           {/* Show location here on small screens */}
                           <div className="text-sm text-gray-500 md:hidden mt-1">Loc: {project.projectLocation || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    {/* Location (Hidden on small screens) */}
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-700">{project.projectLocation || 'N/A'}</div>
                    </td>
                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${projectsAPI.getStatusBadgeColor(project.status)}`}
                      >
                        {projectsAPI.getStatusLabel(project.status)}
                      </span>
                    </td>
                    {/* Timeline (Hidden on medium/small screens) */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                      <div>Start: {projectsAPI.formatDate(project.startDate)}</div>
                      <div>End: {projectsAPI.formatDate(project.endDate)}</div>
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/projects/${project._id}`)}
                        className="text-indigo-600 hover:text-indigo-800 focus:outline-none focus:underline transition duration-150 ease-in-out"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
       {/* Optional: Pagination could be added here if the list becomes very long */}
    </div>
  );
};

export default ConsultantProjects;