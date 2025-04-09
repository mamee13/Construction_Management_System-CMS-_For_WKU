
// export default ProjectsListForContractor; 
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  EyeIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon, // Use Heroicons search icon
  FunnelIcon,          // Use Heroicons filter icon
  ArrowPathIcon       // Use Heroicons refresh icon
} from '@heroicons/react/24/outline';
import authAPI from '../../../api/auth'; // Assuming path is correct
import projectsAPI from '../../../api/projects'; // Assuming path is correct

const ProjectsListForContractor = () => {
  const navigate = useNavigate();
  const currentUser = authAPI.getCurrentUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  console.log('Current User:', currentUser);
  // --- Authorization Check ---
  useEffect(() => {
    console.log('--- ProjectsListForContractor useEffect Running ---');
    if (!authAPI.isAuthenticated()) {
      console.log('User not authenticated, redirecting to login.');
      navigate('/login');
      return; // Stop further execution in this render cycle
    }

    // Ensure currentUser is loaded before checking role
    if (currentUser && currentUser.role !== 'contractor') {
      console.log(`User role is "${currentUser.role}", redirecting to dashboard.`);
      navigate('/dashboard');
    }
    // Add currentUser to dependency array if its loading might cause rerenders
  }, [currentUser, navigate]);


  // --- Fetch Assigned Projects ---
  const {
    data: projectsData, // Holds the full API response: { success: bool, data: { projects: [] } }
    isLoading,
    error,
    refetch, // Function to manually trigger a refetch
  } = useQuery({
    // Unique query key for contractor's projects
    queryKey: ['contractor-projects', currentUser?._id], // Include user ID if relevant
    // The function that fetches the data
    queryFn: projectsAPI.getMyAssignedProjects,
    // Only run the query if the user is authenticated and is a contractor
    enabled: !!currentUser && currentUser.role === 'contractor',
    // Optional: Configure caching behavior
    // staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
    // cacheTime: 10 * 60 * 1000, // Data stays in cache for 10 minutes after unmount
  });


  // --- Filter Projects ---
  // Access the projects array safely from the fetched data
  const availableProjects = projectsData?.data?.projects || [];

  const filteredProjects = availableProjects.filter((project) => {
    // Ensure properties exist before calling methods like .toLowerCase()
    const projectName = project.projectName || '';
    const projectLocation = project.projectLocation || '';
    const searchTermLower = searchTerm.toLowerCase();

    const matchesSearch =
      projectName.toLowerCase().includes(searchTermLower) ||
      projectLocation.toLowerCase().includes(searchTermLower);

    const matchesStatus = statusFilter ? project.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  // --- Render Logic ---
  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8 pb-5 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-gray-900">My Assigned Projects</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage construction projects assigned to you as a contractor.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-4">
            <button
            type="button"
            onClick={() => refetch()} // Manually trigger data refresh
            disabled={isLoading} // Disable while loading
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
            </button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Search Input */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Projects
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Search by name or location..."
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter Dropdown */}
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Status
              </label>
              <div className="relative rounded-md shadow-sm">
                 <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                    <FunnelIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                 </div>
                <select
                  id="status-filter"
                  name="status-filter"
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm appearance-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                  {/* Add other statuses if needed */}
                  {/* <option value="cancelled">Cancelled</option> */}
                </select>
                {/* Custom dropdown arrow */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Content Area: Loading, Error, Empty, Grid --- */}
      <div>
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p className="mt-3 text-sm font-medium text-gray-600">Loading your projects...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8 rounded-md shadow-sm" role="alert">
              <div className="flex">
                  <div className="flex-shrink-0">
                      {/* Heroicon: x-circle */}
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                  </div>
                  <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">
                          Error loading projects: {error.message || 'An unknown error occurred.'}
                      </p>
                       <div className="mt-2 text-sm text-red-700">
                           <button onClick={() => refetch()} className="font-medium underline hover:text-red-600">
                               Try reloading
                           </button>
                       </div>
                  </div>
              </div>
          </div>
        )}

        {/* Empty State (No projects match filter OR no projects assigned) */}
        {!isLoading && !error && filteredProjects.length === 0 && (
          <div className="text-center py-12 bg-white shadow sm:rounded-lg border border-gray-200">
            <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No Projects Found</h3>
            <p className="mt-1 text-sm text-gray-500 px-4">
              {searchTerm || statusFilter
                ? 'No projects match your current search or filter criteria.'
                : 'You have not been assigned to any projects yet, or there was an issue loading them.'}
            </p>
             {!(searchTerm || statusFilter) && availableProjects.length === 0 && ( // Only show refetch if truly no projects initially
                <div className="mt-6">
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Reload Projects
                    </button>
                </div>
             )}
          </div>
        )}

        {/* Projects Grid */}
        {!isLoading && !error && filteredProjects.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <div
                key={project._id}
                className="col-span-1 bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300 flex flex-col" // Added flex flex-col
              >
                <div className="p-5 sm:p-6 flex-grow"> {/* Added flex-grow */}
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`flex-shrink-0 p-2 rounded-full ${projectsAPI.getStatusBadgeColor(project.status)?.split(' ')[0] || 'bg-gray-100'}`}>
                        <BuildingOfficeIcon className={`h-6 w-6 ${projectsAPI.getStatusBadgeColor(project.status)?.split(' ')[1] || 'text-gray-800'}`} aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate" title={project.projectName}>
                          {project.projectName || 'Unnamed Project'}
                        </h3>
                        <p className="text-sm text-gray-500 truncate" title={project.projectLocation}>
                          {project.projectLocation || 'No Location'}
                        </p>
                      </div>
                    </div>
                    {/* Status Badge */}
                    <span className={`ml-2 flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${projectsAPI.getStatusBadgeColor(project.status)}`}>
                      {projectsAPI.getStatusLabel(project.status)}
                    </span>
                  </div>

                  {/* Dates */}
                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                      <span className="font-medium mr-1">Start:</span>
                      <span>{project.startDate ? projectsAPI.formatDate(project.startDate) : 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                       <span className="font-medium mr-1">End:</span>
                      <span>{project.endDate ? projectsAPI.formatDate(project.endDate) : 'N/A'}</span>
                    </div>
                  </div>

                  {/* Budget */}
                  <div className="mt-3 flex items-center text-sm text-gray-600">
                    <CurrencyDollarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                     <span className="font-medium mr-1">Budget:</span>
                    <span>
                      {project.projectBudget != null
                        ? `$${project.projectBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : 'N/A'}
                    </span>
                  </div>

                  {/* Description */}
                  {project.projectDescription && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-500 line-clamp-2" title={project.projectDescription}>
                        {project.projectDescription}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Action Button */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                  <button
                    type="button"
                    onClick={() => navigate(`/contractor-projects/${project._id}`)} // Make sure this route is defined in your React Router
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition ease-in-out duration-150"
                  >
                    <EyeIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div> {/* End Content Area */}
    </div> // End Outermost Container
  );
};

export default ProjectsListForContractor;