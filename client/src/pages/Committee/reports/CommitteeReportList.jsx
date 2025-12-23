
"use client";
/* eslint-disable */
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  DocumentTextIcon,
  EyeIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  XMarkIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";

// Assume these API wrappers exist and work correctly
import reportsAPI from "../../../api/reports";
import projectsAPI from "../../../api/projects";
import authAPI from "../../../api/auth";
// Pagination component is no longer needed
// import Pagination from "../../../components/common/Pagination";

// How many items the API call attempts to fetch (for the first page)
const ITEMS_PER_PAGE = 10; // Or adjust if needed, though pagination is hidden

// --- Helper Functions ---
// (Ensure these match the actual formatting desired and data structure)
const formatReportType = (type) => {
    if (!type) return "Unknown Type";
    return type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};
const formatUserRole = (role) => {
    if (!role) return "Unknown";
    return role.charAt(0).toUpperCase() + role.slice(1);
};
const getReportTypeBadgeClass = (type) => {
    const typeColors = {
      progress: "bg-blue-100 text-blue-800",
      monthly_progress: "bg-purple-100 text-purple-800",
      weekly_progress: "bg-indigo-100 text-indigo-800",
      daily_log: "bg-green-100 text-green-800",
      material_usage: "bg-yellow-100 text-yellow-800",
      schedule_adherence: "bg-orange-100 text-orange-800",
      issue_summary: "bg-red-100 text-red-800",
      financial: "bg-emerald-100 text-emerald-800",
      custom: "bg-gray-100 text-gray-800",
    };
    return typeColors[type] || "bg-gray-100 text-gray-800"; // Default fallback
};
const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
        return format(new Date(dateString), "MMM d, yyyy, h:mm a");
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return "Invalid Date";
    }
};
// --- End Helper Functions ---


const CommitteeReportList = () => {
  const navigate = useNavigate();
  // No need for currentPage state
  const [filters, setFilters] = useState({
    projectId: "",
    type: "",
    startDate: "",
    endDate: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // --- Authorization Check ---
  const currentUser = authAPI.getCurrentUser();
  useEffect(() => {
    if (currentUser === undefined) return;
    if (!authAPI.isAuthenticated()) { navigate("/login", { replace: true }); return; }
    if (currentUser?.role !== "committee") { navigate("/dashboard", { replace: true }); }
  }, [currentUser, navigate]);
  // --- End Authorization Check ---

  const queryEnabled = !!currentUser && currentUser.role === "committee";

  // --- Fetch reports (only the first page) ---
  const {
    data: reportsResponse, // Raw response from the API
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["committee-view-accessible-reports", { limit: ITEMS_PER_PAGE, ...filters }],
    queryFn: () =>
      reportsAPI.getReports({
        page: 1,
        limit: ITEMS_PER_PAGE,
        ...filters
      }),
    enabled: queryEnabled,
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to fetch reports");
    },
  });

  // Fetch projects for filtering
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects", "all"],
    queryFn: () => projectsAPI.getAllProjects(),
    enabled: queryEnabled,
    onError: (err) => { console.error("Failed to load projects:", err); },
  });

  // --- Data Extraction and CLIENT-SIDE FILTERING ---
  const allFetchedReports = reportsResponse?.data || [];
  const reportsToDisplay = allFetchedReports.filter(report => report.generatedBy?.role === 'admin');
  // --- End Client-Side Filtering ---

  // --- Event Handlers ---
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };
  const clearFilters = () => {
    setFilters({ projectId: "", type: "", startDate: "", endDate: "" });
  };

  // --- Render Logic ---
  if (currentUser === undefined) {
    return <div className="p-10 text-center">Loading user data...</div>;
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6 pb-4 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Admin Generated Reports
            </h2>
            <p className="mt-1 text-sm text-gray-500">View reports created by system administrators.</p>
          </div>
          <div className="mt-4 flex flex-shrink-0 space-x-2 sm:mt-0 sm:ml-4">
            <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                title={showFilters ? "Hide Filters" : "Show Filters"}
            >
                <FunnelIcon className={`h-5 w-5 ${showFilters ? "text-indigo-600" : "text-gray-400"}`} aria-hidden="true" />
                <span className="ml-2 hidden sm:inline">{showFilters ? "Hide Filters" : "Filters"}</span>
            </button>
          </div>
      </div>

      {/* Filter Section */}
      {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6 shadow-sm border border-gray-200 animate-fade-in">
             {/* Filter Grid */}
             <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2 lg:grid-cols-4">
                 {/* Project Filter */}
                  <div>
                    <label htmlFor="projectId" className="block text-sm font-medium leading-6 text-gray-900">Project</label>
                    <select id="projectId" name="projectId" value={filters.projectId} onChange={handleFilterChange} disabled={isLoadingProjects} className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:bg-gray-100">
                      <option value="">All Projects</option>
                      {projectsData?.data?.map((project) => (<option key={project._id} value={project._id}>{project.projectName}</option>))}
                    </select>
                  </div>
                  {/* Report Type Filter */}
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium leading-6 text-gray-900">Report Type</label>
                    <select id="type" name="type" value={filters.type} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
                      <option value="">All Types</option>
                      <option value="progress">Progress Report</option>
                      <option value="monthly_progress">Monthly Progress Report</option>
                      {/* Add other relevant types */}
                    </select>
                  </div>
                 {/* Date Filters */}
                 <div>
                    <label htmlFor="startDate" className="block text-sm font-medium leading-6 text-gray-900">Generated After</label>
                    <input type="date" id="startDate" name="startDate" value={filters.startDate} onChange={handleFilterChange} max={filters.endDate || undefined} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                 </div>
                 <div>
                    <label htmlFor="endDate" className="block text-sm font-medium leading-6 text-gray-900">Generated Before</label>
                    <input type="date" id="endDate" name="endDate" value={filters.endDate} onChange={handleFilterChange} min={filters.startDate || undefined} className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                 </div>
             </div>
             {/* Clear Filters Button */}
             <div className="mt-4 flex justify-end">
                 <button type="button" onClick={clearFilters} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                     <XMarkIcon className="h-5 w-5 mr-1 text-gray-400" /> Clear Filters
                 </button>
             </div>
          </div>
      )}

      {/* Report Table Area */}
      <div className="mt-6 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <div className="min-w-full overflow-x-auto">
          {/* Loading State */}
          {isLoading ? (
            <div className="text-center py-20"><ArrowPathIcon className="h-8 w-8 mx-auto text-gray-400 animate-spin" /><p className="mt-2 text-sm text-gray-500">Loading reports...</p></div>
          // Error State
          ) : isError ? (
            <div className="text-center py-20 px-4 bg-red-50"><ExclamationTriangleIcon className="h-8 w-8 mx-auto text-red-400" /><p className="mt-2 text-sm font-medium text-red-700">Error Loading Reports</p><p className="text-sm text-red-600">{error?.response?.data?.message || error?.message || 'An unknown error occurred.'}</p></div>
          // No Reports Found State (checks the FILTERED list)
          ) : reportsToDisplay.length === 0 ? (
            <div className="text-center py-20"><DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400" /><h3 className="mt-2 text-sm font-medium text-gray-900">No Admin Reports Found</h3><p className="mt-1 text-sm text-gray-500">No reports created by administrators match the current filters.</p></div>
          // Reports Found - Display Table
          ) : (
            <table className="min-w-full divide-y divide-gray-300">
              {/* Table Header */}
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Title</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell">Project</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden lg:table-cell">
                      <div className="flex items-center"><UserCircleIcon className="h-4 w-4 mr-1 text-gray-400" />Generated By</div>
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Generated At</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">View</span></th>
                </tr>
              </thead>
              {/* Table Body - maps over the FILTERED list */}
              <tbody className="divide-y divide-gray-200 bg-white">
                {reportsToDisplay.map((report) => {
                    console.log(report); // Log the report data for debugging
                    // *** DEBUGGING LOG ADDED HERE ***
                    console.log(`[CommitteeReportList] Rendering link for Report ID: ${report._id}`, 'Report Data:', report);
                    // *** END DEBUGGING LOG ***
                    return (
                        <tr key={report._id} className="hover:bg-gray-50">
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-indigo-600 hover:text-indigo-800 sm:pl-6">
                                {/* Ensure Link 'to' prop uses a valid ID */}
                                <Link to={`/committee-reports/${report._id}`} title={`View ${report.title || 'report'}`}>
                                    {report.title || <span className="italic text-gray-500">Untitled</span>}
                                </Link>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 hidden sm:table-cell">{report.project?.projectName || 'N/A'}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getReportTypeBadgeClass(report.type)}`}>{formatReportType(report.type)}</span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 hidden lg:table-cell">
                                {report.generatedBy ? `${report.generatedBy.firstName || ''} ${report.generatedBy.lastName || ''}` : <span className="italic">Unknown</span>}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{formatDate(report.generatedAt || report.createdAt)}</td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                <Link to={`/committee-reports/${report._id}`} className="text-indigo-600 hover:text-indigo-800" title="View Details"><EyeIcon className="h-5 w-5" /></Link>
                            </td>
                        </tr>
                    );
                })}
              </tbody>
            </table>
          )}
        </div>
        {/* PAGINATION IS INTENTIONALLY REMOVED */}
      </div>
    </div>
  );
};

export default CommitteeReportList;