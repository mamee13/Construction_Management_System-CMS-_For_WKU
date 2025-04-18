

/*eslint-disable */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  DocumentTextIcon,
  EyeIcon,
  TrashIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  XMarkIcon,
  PlusIcon, // Import PlusIcon for the create button
} from "@heroicons/react/24/outline";

import reportsAPI from "../../../api/reports";
import projectsAPI from "../../../api/projects";
import authAPI from "../../../api/auth";
import Pagination from "../../../components/common/Pagination";

// Number of items per page for pagination
const ITEMS_PER_PAGE = 10;

// Helper function to get report type label (assuming it exists in reportsAPI or define it here)
const getReportTypeLabel = (type) => {
    const typeMap = {
      progress: 'Progress',
      monthly_progress: 'Monthly Progress',
      weekly_progress: 'Weekly Progress',
      daily_log: 'Daily Log',
      material_usage: 'Material Usage',
      schedule_adherence: 'Schedule Adherence',
      issue_summary: 'Issue Summary',
      financial: 'Financial',
      custom: 'Custom',
      // Add committee types if reportsAPI.getReportTypeLabel doesn't handle them
      committee_summary: 'Committee Summary',
      milestone_update: 'Milestone Update',
      financial_overview: 'Financial Overview',
      risk_assessment: 'Risk Assessment',
      strategic_alignment: 'Strategic Alignment',
      custom_committee: 'Custom Committee'
    };
    return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Fallback formatting
  };


const ReportList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    projectId: "",
    type: "",
    startDate: "",
    endDate: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Check for admin access before rendering the page
  if (!authAPI.isAdmin()) {
    // Redirect immediately if not admin
    useEffect(() => {
        navigate("/dashboard");
    }, [navigate]);
    return null; // Render nothing while redirecting
  }

  // Fetch reports using the updated API method getReports
  const {
    data: reportsData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["reports", { page: currentPage, limit: ITEMS_PER_PAGE, ...filters }],
    queryFn: () =>
      reportsAPI.getReports({ page: currentPage, limit: ITEMS_PER_PAGE, ...filters }),
    keepPreviousData: true,
    onError: (err) => {
      toast.error(err.message || "Failed to fetch reports");
    },
  });

  // Fetch projects for filtering options
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects", "all"],
    queryFn: () => projectsAPI.getAllProjects(),
    onError: (err) => {
      console.error("Failed to load projects for filter:", err);
    },
  });

  // Mutation for deleting a report
  const deleteMutation = useMutation({
    mutationFn: reportsAPI.deleteReport,
    onSuccess: (data) => {
      toast.success(data.message || "Report deleted successfully");
      // Invalidate queries to refetch the list
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      // Check if we need to go back a page after deletion
      if (reportsData?.data?.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete report");
    },
  });

  const handleDelete = (reportId) => {
    if (window.confirm("Are you sure you want to delete this report? This action cannot be undone.")) {
      deleteMutation.mutate(reportId);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({ projectId: "", type: "", startDate: "", endDate: "" });
    setCurrentPage(1);
  };

  // Use the helper methods from reportsAPI or define locally
   const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', { // Example formatting
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {
            console.error("Error formatting date:", dateString, e);
            return "Invalid Date";
        }
    };


  const reports = reportsData?.data || [];
  const pagination = reportsData?.pagination;
  const totalReports = reportsData?.total || 0;

  // --- ADDED: Handler for navigating to create page ---
  const handleCreateReport = () => {
    // Navigate to the appropriate create page for admins
    // Adjust the route if your create pages are different
    navigate("/admin/reports/create"); // Or potentially prompt which type (general/committee)?
    // For simplicity, this goes to a single admin create page first.
    // If you have separate components/routes like CreateAdminReport and CreateAdminCommitteeReport,
    // you might need two buttons or a dropdown here.
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6 pb-4 border-b border-gray-200"> {/* Added border */}
        <div className="flex-1 min-w-0"> {/* Added min-w-0 for proper truncation */}
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Report Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">View, manage, filter, and create reports.</p>
        </div>
        <div className="mt-4 flex flex-shrink-0 space-x-2 sm:mt-0 sm:ml-4"> {/* Added flex-shrink-0 */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            title={showFilters ? "Hide Filters" : "Show Filters"}
          >
            <FunnelIcon className={`h-5 w-5 ${showFilters ? "text-indigo-600" : "text-gray-400"}`} aria-hidden="true" />
            <span className="ml-2 hidden sm:inline">
              {showFilters ? "Hide Filters" : "Filters"}
            </span>
          </button>

          {/* --- ADDED: Create Report Button --- */}
          <button
            type="button"
            onClick={handleCreateReport} // Use the new handler
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Create Report
          </button>
          {/* ---------------------------------- */}

        </div>
      </div>

      {/* Filter Section (remains the same) */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Project Filter */}
            <div>
              <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">Project</label>
              <select
                id="projectId"
                name="projectId"
                value={filters.projectId}
                onChange={handleFilterChange}
                disabled={isLoadingProjects}
                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">All Projects</option>
                {projectsData?.data?.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.projectName}
                  </option>
                ))}
              </select>
            </div>
            {/* Report Type Filter - Include ALL types */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">Report Type</label>
              <select
                id="type"
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">All Types</option>
                {[ // Combine all possible report types from your models/enums
                  'progress', 'monthly_progress', 'weekly_progress', 'daily_log',
                  'material_usage', 'schedule_adherence', 'issue_summary', 'financial',
                  'custom', 'committee_summary', 'milestone_update', 'financial_overview',
                  'risk_assessment', 'strategic_alignment', 'custom_committee'
                ].sort().map((type) => ( // Sort alphabetically for better UX
                  <option key={type} value={type}>
                    {getReportTypeLabel(type)} {/* Use helper function */}
                  </option>
                ))}
              </select>
            </div>
            {/* Start Date Filter */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Generated After
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            {/* End Date Filter */}
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                Generated Before
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <XMarkIcon className="h-5 w-5 mr-1 text-gray-400" />
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Report Table (structure remains the same) */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <div className="min-w-full overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-20"><ArrowPathIcon className="h-8 w-8 mx-auto text-gray-400 animate-spin" /><p className="mt-2 text-sm text-gray-500">Loading reports...</p></div>
          ) : isError ? (
            <div className="text-center py-20 px-4 bg-red-50 rounded-md"><ExclamationTriangleIcon className="h-8 w-8 mx-auto text-red-400" /><p className="mt-2 text-sm font-medium text-red-700">Error loading reports</p><p className="text-sm text-red-600">{error.message}</p></div>
          ) : reports.length === 0 ? (
            <div className="text-center py-20"><DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400" /><h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3><p className="mt-1 text-sm text-gray-500">No reports match the current filters. Try adjusting filters or create a new report.</p></div>
          ) : (
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Title</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Project</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Generated By</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Generated At</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {reports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{report.title}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{report.project?.projectName || <span className="italic text-gray-400">N/A</span>}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getReportTypeCellStyle(report.type)}`}> {/* Optional cell styling */}
                        {getReportTypeLabel(report.type)} {/* Use helper function */}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{report.generatedBy ? `${report.generatedBy.firstName} ${report.generatedBy.lastName}` : <span className="italic text-gray-400">Unknown</span>}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{formatDate(report.generatedAt)}</td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <div className="flex items-center justify-end space-x-4"> {/* Increased space */}
                        <Link to={`/admin/reports/${report._id}`} className="text-indigo-600 hover:text-indigo-800 transition-colors duration-150" title="View Details"><EyeIcon className="h-5 w-5" /></Link>
                        <button onClick={() => handleDelete(report._id)} disabled={deleteMutation.isLoading && deleteMutation.variables === report._id} className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-150" title="Delete Report">
                          {deleteMutation.isLoading && deleteMutation.variables === report._id ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <TrashIcon className="h-5 w-5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {/* Pagination (remains the same) */}
        {!isLoading && !isError && reports.length > 0 && pagination && pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
             <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalReports}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>
        )}
      </div>
    </div>
  );
};


// Optional helper function for styling report type cell
const getReportTypeCellStyle = (type) => {
    if (type?.includes('committee')) {
        return 'bg-blue-100 text-blue-800';
    }
    if (type?.includes('progress')) {
        return 'bg-green-100 text-green-800';
    }
    if (type === 'financial' || type === 'financial_overview') {
        return 'bg-yellow-100 text-yellow-800';
    }
     if (type === 'issue_summary' || type === 'risk_assessment') {
        return 'bg-red-100 text-red-800';
    }
    // Add more specific styles or return a default
    return 'bg-gray-100 text-gray-800';
};


export default ReportList;