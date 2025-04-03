// src/pages/reports/ReportListPage.jsx (or similar path)

import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  DocumentTextIcon,
  PlusIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

// import reportsAPI from '../../api/reportsAPI'; // Adjust path
import reportsAPI from "../../APi/reports";
import projectsAPI from '../../APi/projects'; // Adjust path
import authAPI from '../../api/auth'; // Adjust path

const REPORT_TYPES = [ // Match your schema enums
    { value: 'progress', label: 'Progress' },
    { value: 'monthly_progress', label: 'Monthly Progress' },
    { value: 'weekly_progress', label: 'Weekly Progress' },
    { value: 'daily_log', label: 'Daily Log' },
    { value: 'material_usage', label: 'Material Usage' },
    { value: 'schedule_adherence', label: 'Schedule Adherence' },
    { value: 'issue_summary', label: 'Issue Summary' },
    { value: 'financial', label: 'Financial' },
    { value: 'custom', label: 'Custom' },
];

const ReportListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = authAPI.getCurrentUser();
  const isAdmin = authAPI.hasRole('admin'); // Check if user is admin

  // --- State for Filters ---
  const [filters, setFilters] = useState({
    projectId: searchParams.get('projectId') || '',
    type: searchParams.get('type') || '',
    // Add userId filter if needed: userId: searchParams.get('userId') || '',
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: 10, // Or make configurable
  });

  // Update URL when filters change
  useEffect(() => {
    const newSearchParams = new URLSearchParams();
    if (filters.projectId) newSearchParams.set('projectId', filters.projectId);
    if (filters.type) newSearchParams.set('type', filters.type);
    // if (filters.userId) newSearchParams.set('userId', filters.userId);
    if (filters.page > 1) newSearchParams.set('page', filters.page.toString());
    // Limit doesn't usually go in URL unless user can change it

    setSearchParams(newSearchParams, { replace: true });
  }, [filters, setSearchParams]);


  // --- Data Fetching ---

  // Fetch projects for the filter dropdown
  // Admins get all projects, others get their assigned ones
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projectsForFilter', isAdmin ? 'all' : currentUser?._id],
    queryFn: isAdmin ? projectsAPI.getAllProjects : projectsAPI.getMyAssignedProjects,
    enabled: !!currentUser, // Only fetch when user is known
  });
  const projectOptions = useMemo(() => {
    return projectsData?.data?.projects?.map(p => ({ value: p._id, label: p.projectName })) || [];
  }, [projectsData]);


  // Fetch reports based on current filters
  const {
    data: reportsResponse,
    isLoading: isLoadingReports,
    isError: isErrorReports,
    error: errorReports,
    refetch: refetchReports,
    isFetching: isFetchingReports, // For refresh indicator
  } = useQuery({
    queryKey: ['reports', filters], // Query key includes filters object
    queryFn: () => reportsAPI.getReports(filters),
    keepPreviousData: true, // Smoother experience during pagination
    enabled: !!currentUser, // Only fetch when user is known
  });

  const reports = reportsResponse?.data || [];
  const pagination = reportsResponse?.pagination || { page: 1, totalPages: 1 };

  // --- Event Handlers ---
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1, // Reset to page 1 on filter change
    }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  // Determine if the user can create reports (most roles can)
  const canCreateReport = currentUser && ['admin', 'consultant', 'contractor', 'project_manager'].includes(currentUser.role);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-full mx-auto">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6 md:mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 inline-flex items-center">
            <DocumentTextIcon className="h-7 w-7 mr-3 text-indigo-600" />
            Project Reports
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage project reports. {isAdmin ? "You can see all reports." : "Showing reports for projects you are assigned to."}
          </p>
        </div>
         {canCreateReport && (
             <div className="mt-4 sm:mt-0 sm:ml-4">
                <Link
                    to="/reports/create" // Link to the create page
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Create New Report
                </Link>
            </div>
         )}
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end bg-gray-50 p-4 rounded-lg border">
         {/* Project Filter */}
         <div>
            <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-1">
                Project
            </label>
            <select
                id="projectId"
                name="projectId"
                value={filters.projectId}
                onChange={handleFilterChange}
                disabled={isLoadingProjects}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:bg-gray-100"
            >
                <option value="">{isAdmin ? 'All Projects' : 'My Projects'}</option>
                {projectOptions.map(option => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
                ))}
            </select>
            {isLoadingProjects && <span className="text-xs text-gray-500">Loading projects...</span>}
         </div>

         {/* Report Type Filter */}
         <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Report Type
            </label>
            <select
                id="type"
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
                <option value="">All Types</option>
                {REPORT_TYPES.map(option => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
                ))}
            </select>
         </div>

         {/* Add Date or User filters here if needed */}

          {/* Refresh Button */}
          <div className="flex items-center justify-end md:col-start-3 lg:col-start-4">
              <button
                onClick={() => refetchReports()}
                disabled={isFetchingReports}
                title="Refresh List"
                className={`p-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition duration-150 ease-in-out ${isFetchingReports ? 'animate-pulse cursor-not-allowed' : ''}`}
              >
                <ArrowPathIcon className={`h-5 w-5 ${isFetchingReports ? 'animate-spin' : ''}`} />
              </button>
          </div>
      </div>

      {/* Reports Table / List */}
      <div className="bg-white shadow-md overflow-hidden sm:rounded-lg">
        {isLoadingReports ? (
          <div className="py-20 text-center">
            <ArrowPathIcon className="h-8 w-8 mx-auto text-indigo-600 animate-spin" />
            <p className="mt-2 text-sm text-gray-500">Loading reports...</p>
          </div>
        ) : isErrorReports ? (
          <div className="py-16 px-6 text-center bg-red-50 rounded-lg border border-red-200">
             <ExclamationTriangleIcon className="h-10 w-10 mx-auto text-red-500" />
             <p className="mt-3 text-sm font-semibold text-red-800">Failed to load reports</p>
             <p className="mt-1 text-sm text-red-600">{errorReports?.message || "An unexpected error occurred."}</p>
             <button onClick={() => refetchReports()} className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700">Retry</button>
          </div>
        ) : reports.length === 0 ? (
           <div className="py-16 px-6 text-center bg-gray-50 rounded-lg border border-gray-200">
             <InformationCircleIcon className="h-10 w-10 mx-auto text-gray-400" />
             <p className="mt-3 text-sm font-semibold text-gray-700">No reports found</p>
             <p className="mt-1 text-sm text-gray-500">No reports match the current filters.</p>
           </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report Title / Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Project</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generated</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Author</th>
                     <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{report.title}</div>
                        <div className="text-sm text-gray-500">{reportsAPI.getReportTypeLabel(report.type)}</div>
                        {/* Show project on small screens */}
                        <div className="text-sm text-gray-500 md:hidden mt-1">Proj: {report.project?.projectName || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 hidden md:table-cell">
                        {report.project?.projectName || 'N/A'}
                      </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {reportsAPI.formatDate(report.generatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                        {report.generatedBy?.firstName || ''} {report.generatedBy?.lastName || 'Unknown'}
                        <span className="block text-xs text-gray-400">{report.generatedBy?.role ? authAPI.formatRole(report.generatedBy.role) : ''}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${reportsAPI.getReportStatusColor(report.status)}`}>
                            {reportsAPI.getReportStatusLabel(report.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/reports/${report._id}`} className="text-indigo-600 hover:text-indigo-900">
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"> Previous </button>
                        <button onClick={() => handlePageChange(filters.page + 1)} disabled={filters.page === pagination.totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"> Next </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing <span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span> to <span className="font-medium">{Math.min(filters.page * filters.limit, reportsResponse?.total || 0)}</span> of{' '}
                                <span className="font-medium">{reportsResponse?.total || 0}</span> results
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                                    <span className="sr-only">Previous</span>
                                    <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                                </button>
                                {/* Consider adding page numbers here if needed */}
                                <button onClick={() => handlePageChange(filters.page + 1)} disabled={filters.page === pagination.totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                                    <span className="sr-only">Next</span>
                                    <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReportListPage;