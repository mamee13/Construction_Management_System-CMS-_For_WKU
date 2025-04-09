

/* eslint-disable */
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  ArrowPathIcon, // Used for Loading/Refreshing
  ClipboardDocumentListIcon, // Used for Empty State
  ExclamationTriangleIcon, // Used for Error State
  EyeIcon, // For View action
  PencilIcon, // For Edit action (if applicable)
  TrashIcon, // For Delete action (if applicable)
  ChevronDownIcon, // For filter dropdowns
  PlusIcon // For Create button
} from "@heroicons/react/24/outline";

import authAPI from "../../../api/auth"; // Assuming path is correct
import reportsAPI from "../../../api/reports"; // Assuming path is correct
import { formatDate } from "../../../utils/dateUtils"; // Assuming you have created this utility

// *** UPDATED Constants for Filters (Matching Backend Data) ***
const CONTRACTOR_REPORT_TYPES = [
    { value: "daily", label: "Daily Log" }, // Keep standard types
    { value: "weekly_progress", label: "Weekly Progress" }, // Added from backend log
    { value: "monthly_progress", label: "Monthly Progress" }, // Added from backend log
    { value: "incident", label: "Incident Report" },
    { value: "progress", label: "Generic Progress" },
    { value: "safety", label: "Safety Inspection" },
    { value: "material", label: "Material Usage" },
    { value: "equipment", label: "Equipment Log" },
    // Add any other specific 'type' values your backend might send
];

const CONTRACTOR_REPORT_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

// Helper function to get status badge styles
const getStatusBadgeClass = (status) => {
  switch (status) {
    case "draft": return "bg-gray-100 text-gray-800";
    case "submitted": return "bg-blue-100 text-blue-800";
    case "under_review": return "bg-yellow-100 text-yellow-800";
    case "approved": return "bg-green-100 text-green-800";
    case "rejected": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

// Helper function to get formatted status label
const getStatusLabel = (status) => {
    const found = CONTRACTOR_REPORT_STATUSES.find(s => s.value === status);
    return found ? found.label : status; // Return label or raw status if not found
};

// *** UPDATED Helper function to get formatted type label (more robust fallback) ***
const getTypeLabel = (typeValue) => {
    const found = CONTRACTOR_REPORT_TYPES.find(t => t.value === typeValue);
    // Format the raw value nicely if no specific label is found
    return found ? found.label : (typeValue ? typeValue.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown Type');
};

// --- Component Start ---
const ReportsListForContractor = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = authAPI.getCurrentUser();

  // --- State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [showFilters, setShowFilters] = useState(false);

  // --- Authorization Check ---
  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      console.log("Not authenticated, redirecting to login.");
      navigate("/login", { replace: true });
      return;
    }
    const userRole = authAPI.hasRole ? null : currentUser?.role;
    const isContractor = authAPI.hasRole ? authAPI.hasRole('contractor') : userRole === 'contractor';
    if (!isContractor) {
      console.warn("Access denied: User is not a contractor. Redirecting to dashboard.");
      navigate("/dashboard", { replace: true });
    }
  }, [currentUser, navigate]);

  // --- Fetch Contractor's Reports ---
  const {
    data: reportsResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["contractorReports", currentUser?._id],
    queryFn: async () => {
        console.log("useQuery: Calling reportsAPI.getMyReports()");
        const response = await reportsAPI.getMyReports();
        console.log("useQuery raw API response:", response);
        if (!response || typeof response !== 'object' || typeof response.data !== 'object' || !Array.isArray(response.data.reports)) {
             console.error("Unexpected API response structure:", response);
             throw new Error("Received invalid data structure from API.");
        }
        return response;
    },
    enabled: !!currentUser?._id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    onError: (err) => {
      console.error("React Query Error fetching contractor reports:", err);
    },
    onSuccess: (data) => {
       console.log("React Query Success. Raw Data:", data);
       console.log("Reports array from successful fetch:", data?.data?.reports);
    }
  });

  // --- Safely Extract Reports Array ---
  const reports = reportsResponse?.data?.reports || [];
  console.log("Extracted 'reports' array for rendering/filtering:", reports);

  // --- Client-side Filtering (Using Correct Field Names) ---
  const filteredReports = reports.filter((report) => {
    if (!report || typeof report !== 'object') return false;
    const lowerSearchTerm = searchTerm.toLowerCase();

    // Search Term Filter
    const titleMatch = report.title?.toLowerCase().includes(lowerSearchTerm) ?? false;
    const projectMatch = report.project?.projectName?.toLowerCase().includes(lowerSearchTerm) ?? false;
    const searchMatch = searchTerm === "" || titleMatch || projectMatch;

    // Status Filter
    const statusMatch = statusFilter === "" || report.status === statusFilter;

    // *** FIX: Type Filter - Use report.type ***
    const typeMatch = typeFilter === "" || report.type === typeFilter;

    // *** FIX: Date Range Filter - Use report.generatedAt or report.createdAt ***
    const reportDate = report.generatedAt || report.createdAt; // Prioritize generatedAt
    let dateMatch = true;
    if (dateRange.startDate && reportDate) {
        try {
            dateMatch = dateMatch && new Date(reportDate) >= new Date(dateRange.startDate);
        } catch (e) { console.error("Error parsing start date:", e); dateMatch = false; }
    }
    if (dateRange.endDate && reportDate) {
         try {
            const endOfDay = new Date(dateRange.endDate);
            endOfDay.setDate(endOfDay.getDate() + 1);
            dateMatch = dateMatch && new Date(reportDate) < endOfDay;
        } catch (e) { console.error("Error parsing end date:", e); dateMatch = false; }
    }

    return searchMatch && statusMatch && typeMatch && dateMatch;
  });
  // console.log("Filtered 'filteredReports' array:", filteredReports); // Keep if needed

  // --- Event Handlers ---
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    if (name === "statusFilter") setStatusFilter(value);
    if (name === "typeFilter") setTypeFilter(value);
    if (name === "searchTerm") setSearchTerm(value);
  };

  const handleDateRangeChange = (event) => {
    const { name, value } = event.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setStatusFilter("");
    setTypeFilter("");
    setDateRange({ startDate: "", endDate: "" });
    setShowFilters(false);
  }, []);

   const handleRefresh = () => {
      console.log("Manual refresh triggered");
      refetch();
   };

  const isAnyFilterActive = statusFilter || typeFilter || dateRange.startDate || dateRange.endDate;

  // --- Render Logic ---
  if (!currentUser || (authAPI.hasRole && !authAPI.hasRole('contractor') && !currentUser?.role === 'contractor')) {
    return (
      <div className="flex justify-center items-center h-screen">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Verifying access...</span>
      </div>
    );
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">My Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            View, manage, and submit your project reports.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-4 flex space-x-3">
           <button
            type="button"
            onClick={handleRefresh}
            disabled={isFetching}
            className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isFetching ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </button>
          <Link
            to="/contractor-reports/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Report
          </Link>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white shadow sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {/* Search Input */}
                  <div className="md:col-span-1 lg:col-span-1">
                      <label htmlFor="searchTerm" className="sr-only">Search Reports</label>
                      <div className="relative rounded-md shadow-sm">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </div>
                          <input
                              type="search"
                              name="searchTerm"
                              id="searchTerm"
                              className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              placeholder="Search title or project..."
                              value={searchTerm}
                              onChange={handleFilterChange}
                          />
                      </div>
                  </div>

                  {/* Status Filter */}
                   <div className="md:col-span-1 lg:col-span-1">
                      <label htmlFor="statusFilter" className="sr-only">Filter by Status</label>
                      <select
                          id="statusFilter"
                          name="statusFilter"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={statusFilter}
                          onChange={handleFilterChange}
                      >
                          <option value="">All Statuses</option>
                          {CONTRACTOR_REPORT_STATUSES.map(status => (
                              <option key={status.value} value={status.value}>{status.label}</option>
                          ))}
                      </select>
                  </div>

                  {/* Type Filter */}
                  <div className="md:col-span-1 lg:col-span-1">
                      <label htmlFor="typeFilter" className="sr-only">Filter by Type</label>
                       <select
                          id="typeFilter"
                          name="typeFilter"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={typeFilter}
                          onChange={handleFilterChange}
                      >
                          <option value="">All Types</option>
                          {/* Ensure options match backend data */}
                          {CONTRACTOR_REPORT_TYPES.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                      </select>
                  </div>

                  {/* Filter Toggle/Clear Button */}
                  <div className="flex items-end justify-end md:col-span-3 lg:col-span-1">
                      {(searchTerm || isAnyFilterActive) && (
                          <button
                              type="button"
                              onClick={clearFilters}
                              className="ml-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                              <XMarkIcon className="h-4 w-4 mr-1" />
                              Clear All
                          </button>
                      )}
                  </div>
              </div>
          </div>
      </div>

      {/* Report Table Section */}
      <div className="mt-8 flow-root">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg bg-white">
              {/* --- Conditional Rendering Logic --- */}
              {isLoading ? ( // 1. Initial Loading State
                <div className="text-center py-20">
                  <ArrowPathIcon className="h-8 w-8 mx-auto text-gray-400 animate-spin" />
                  <p className="mt-2 text-sm text-gray-500">Loading your reports...</p>
                </div>
              ) : isError ? ( // 2. Error State
                 <div className="text-center py-20 px-6 bg-red-50 rounded-md m-4 border border-red-200">
                   <ExclamationTriangleIcon className="h-10 w-10 mx-auto text-red-400" />
                   <p className="mt-3 text-base font-medium text-red-800">Error Loading Reports</p>
                   <p className="mt-1 text-sm text-red-700">{error?.message || "An unexpected error occurred while fetching your reports."}</p>
                   <button
                     onClick={handleRefresh}
                     disabled={isFetching}
                     className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                     <ArrowPathIcon className={`h-5 w-5 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                     Try Again
                   </button>
                 </div>
              ) : reports.length === 0 ? ( // 3. No Reports Ever State (check raw reports array)
                <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-lg m-4">
                  <ClipboardDocumentListIcon className="h-12 w-12 mx-auto text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No Reports Found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You haven't created any reports yet. Get started by creating your first one.
                  </p>
                  <Link
                      to="/contractor-reports/create"
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Create First Report
                    </Link>
                </div>
               ) : filteredReports.length === 0 ? ( // 4. No Reports Match Filters State (check filtered array)
                 <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-lg m-4">
                  <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-gray-400" />
                   <h3 className="mt-2 text-sm font-medium text-gray-900">No Reports Match Your Search/Filters</h3>
                   <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your search terms or clearing the filters.
                  </p>
                   {(searchTerm || isAnyFilterActive) && (
                     <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <XMarkIcon className="h-5 w-5 mr-2" />
                        Clear Filters/Search
                      </button>
                   )}
                 </div>
              ) : ( // 5. Data Available - Render Table
                <table className="min-w-full divide-y divide-gray-300">
                   <thead className="bg-gray-50">
                     <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Report Title</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden md:table-cell">Project</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell">Type</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden lg:table-cell">Submitted</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                    </tr>
                   </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {/* *** UPDATED: Map uses correct field names *** */}
                    {filteredReports.map((report) => {
                      return (
                        <tr key={report._id} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                           {/* Report Title */}
                           <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                             {report.title || 'Untitled Report'}
                           </td>
                           {/* Project Name */}
                           <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 hidden md:table-cell">
                             {report.project?.projectName || <span className="italic text-gray-400">N/A</span>}
                           </td>
                            {/* Report Type (using report.type) */}
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 hidden sm:table-cell">
                              {getTypeLabel(report.type)}
                            </td>
                           {/* Status Badge */}
                           <td className="whitespace-nowrap px-3 py-4 text-sm">
                             <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(report.status)}`}>
                               {getStatusLabel(report.status)}
                             </span>
                           </td>
                           {/* Submission Date (using generatedAt or createdAt) */}
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 hidden lg:table-cell">
                                {formatDate(report.generatedAt || report.createdAt)}
                            </td>
                           {/* Actions Column */}
                           <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                             <Link
                               to={`/contractor-reports/${report._id}`}
                               className="text-indigo-600 hover:text-indigo-900 hover:underline"
                               title="View Report Details"
                             >
                               View<span className="sr-only">, {report.title}</span>
                             </Link>
                             {/* Add Edit/Delete buttons here if needed */}
                           </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
               )}
              {/* --- End Conditional Rendering --- */}
            </div>
          </div>
        </div>
      </div> {/* End Table Section */}
    </div> // End Container Div
  );
};

export default ReportsListForContractor;