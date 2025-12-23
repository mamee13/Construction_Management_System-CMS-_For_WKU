

/* eslint-disable */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns"; // Still needed for string-based formats
import {
  ArrowPathIcon,
  ArrowLeftIcon,
  PaperClipIcon,
  DocumentTextIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  XCircleIcon,
  CalendarDaysIcon, // Used for reportedAt
} from "@heroicons/react/24/outline";
import { toast } from 'react-toastify';

import authAPI from "../../../api/auth";
import reportsAPI from "../../../api/reports";

// --- Reusable UI Components (Keep as they are) ---
const LoadingSpinner = ({ message = "Loading..." }) => (
    <div className="flex justify-center items-center h-64">
        <ArrowPathIcon className="h-10 w-10 text-indigo-500 animate-spin" aria-hidden="true" />
        <span className="ml-3 text-lg text-gray-700">{message}</span>
    </div>
);

const ErrorDisplay = ({ error, onRetry, context = "Report" }) => (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
        <div className="flex">
            <div className="flex-shrink-0">
                <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
                <p className="text-sm font-medium text-red-800">Error Loading {context}</p>
                <p className="mt-1 text-sm text-red-700">{error?.response?.data?.message || error?.message || "An unknown error occurred."}</p>
                {onRetry && (
                    <div className="mt-4">
                        <button
                            type="button"
                            onClick={onRetry}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            Try again
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
);

// --- Helper Functions (Combined/Adapted) ---

// UPDATED formatDate Helper using Intl.DateTimeFormat / toLocaleString
const formatDate = (d, options = { year: "numeric", month: "long", day: "numeric" }) => {
  if (!d) return "N/A"; // Handle null/undefined input early

  try {
    const dateObj = new Date(d);

    // Check if the date object is valid after parsing
    if (isNaN(dateObj.getTime())) {
      console.error("Invalid date value provided to formatDate:", d);
      return "Invalid Date";
    }

    // If options is a string, assume it's a date-fns format pattern
    if (typeof options === 'string') {
      // Example: 'MMMM d, yyyy'
      return format(dateObj, options);
    }

    // If options is an object, use the browser's built-in Intl formatting
    if (typeof options === 'object' && options !== null) {
      // Example: { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }
      // 'undefined' uses the user's default locale, or specify like 'en-US'
      return dateObj.toLocaleString(undefined, options);
    }

    // Fallback to a default date-fns format if options type is unexpected
    console.warn("Unexpected options type in formatDate:", options);
    // Using PPpp as a comprehensive default format from date-fns
    return format(dateObj, 'PPpp');

  } catch (e) {
    // Catch any other unexpected errors during formatting
    console.error("Error in formatDate function:", d, e);
    return "Invalid Date";
  }
};


const formatType = (t) => t?.split('_').map(w => w[0].toUpperCase()+w.slice(1)).join(' ') || "Unknown";

const getBadge = (severity) => {
    const colors = { high: "bg-red-100 text-red-800", medium: "bg-yellow-100 text-yellow-800", low: "bg-green-100 text-green-800" };
    return colors[severity?.toLowerCase()] || "bg-gray-100 text-gray-800";
};

const getFileType = (fileName = '') => {
  if (!fileName) return 'other';
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
  if (extension === 'pdf') return 'pdf';
  return 'other';
};

// --- Main Component ---
const CommitteeReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = authAPI.getCurrentUser();
  const [issuesAndRisks, setIssuesAndRisks] = useState([]);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false); // State for download button

  // 1. Authorization Check
  useEffect(() => {
    if (currentUser === undefined) {
        setIsLoadingUser(true);
        return;
    }
    setIsLoadingUser(false);
    if (!authAPI.isAuthenticated()) {
      toast.info("Please log in to view reports.");
      navigate("/login", { replace: true });
      return;
    }
    if (currentUser.role !== "committee") {
      toast.warn("Access denied. Committee role required.");
      navigate("/dashboard", { replace: true });
    }
  }, [currentUser, navigate]);

  // 2. Fetch Report Data
  const { data: reportResponse, isLoading: isLoadingReport, isError, error, refetch } = useQuery({
    queryKey: ["committee-report-detail", id],
    queryFn: () => reportsAPI.getReportById(id),
    enabled: !!id && !!currentUser && currentUser.role === "committee",
    staleTime: 300_000,
    onSuccess: ({ data }) => {
      // Use the report's issuesAndRisks directly if it's already an array
      const risks = (data && Array.isArray(data.issuesAndRisks)) ? data.issuesAndRisks : [];
      setIssuesAndRisks(risks);
    },
    onError: (err) => {
      console.error("Error fetching report:", err);
    }
  });

  const report = reportResponse?.data;

   // --- Function to handle download using Fetch/Blob ---
   const handleDownload = async (fileUrl, fileName) => {
    if (!fileUrl || isDownloading) return;

    // *** Potential Adjustment Point ***
    // If relative URLs like '/uploads/...' don't work, prepend your API base URL:
    // const absoluteUrl = `${process.env.REACT_APP_API_BASE_URL || ''}${fileUrl}`;
    // const urlToFetch = absoluteUrl;
    const urlToFetch = fileUrl; // Using relative URL by default

    setIsDownloading(true);
    toast.info(`Starting download for ${fileName}...`, { autoClose: 2000 });

    try {
      const response = await fetch(urlToFetch); // Use the determined URL

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      toast.success(`${fileName} downloaded successfully!`);

    } catch (downloadError) {
      console.error("Download error:", downloadError);
      toast.error(`Failed to download ${fileName}: ${downloadError.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // --- Render Logic ---
  if (isLoadingUser) {
    return <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto"><LoadingSpinner message="Verifying access..." /></div>;
  }
  if (isLoadingReport) {
     return <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto"><LoadingSpinner message="Loading report details..." /></div>;
  }
  if (isError) {
    return (
      <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <ErrorDisplay error={error} onRetry={refetch} context="Report Details"/>
         <div className="mt-6 text-center">
            <button type="button" onClick={() => navigate("/committee/reports")} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <ArrowLeftIcon className="h-5 w-5 mr-2" /> Back to Reports
            </button>
        </div>
      </div>
    );
  }
  if (!report) {
     return (
        <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg p-10 text-center">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-700">Report Not Found</h3>
              <p className="mt-2 text-sm text-gray-500">The report might not exist or you may not have permission to view it.</p>
               <div className="mt-6">
                 <button type="button" onClick={() => navigate("/committee/reports")} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <ArrowLeftIcon className="h-5 w-5 mr-2" /> Back to Reports
                </button>
            </div>
            </div>
        </div>
     );
  }

  // --- Render Main Content ---
  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* --- Header --- */}
       <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold leading-7 text-gray-900 sm:truncate mb-1">
            {report.title || "Report Detail"}
          </h1>
          <p className="text-sm text-gray-500">
            {formatType(report.type)} Report
            {report.project?.projectName && ` for ${report.project.projectName}`}
             <span className="mx-2">|</span>
             <span className={`px-2 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full ${reportsAPI.getReportStatusColor(report.status)}`}>
                {formatType(report.status || 'submitted')}
            </span>
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-4 flex-shrink-0">
          <button
            type="button"
            onClick={() => navigate("/committee/reports")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            title="Go back to the reports list"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" /> Back to List
          </button>
        </div>
      </div>

      {/* --- Details Card --- */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
           <h3 className="text-lg leading-6 font-medium text-gray-900">Report Information</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {/* Uses string format */}
                Generated on {formatDate(report.generatedAt || report.createdAt, 'MMMM d, yyyy')}
            </p>
        </div>
        <div className="px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            {/* Project */}
             <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Project</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {report.project?.projectName || <span className="text-gray-400 italic">N/A</span>}
                {report.project?.projectLocation && <span className="text-xs text-gray-500 block">({report.project.projectLocation})</span>}
              </dd>
            </div>
            {/* Report Type */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Report Type</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatType(report.type)}
                </dd>
            </div>
            {/* Reporting Period (Conditional) */}
            {(report.periodStartDate || report.periodEndDate) && (
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Reporting Period</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {/* Uses string format */}
                        {formatDate(report.periodStartDate, 'MMMM d, yyyy')}
                        {' to '}
                        {formatDate(report.periodEndDate, 'MMMM d, yyyy')}
                    </dd>
                </div>
            )}
            {/* Generated By */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Generated By</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {report.generatedBy?.firstName ? `${report.generatedBy.firstName} ${report.generatedBy.lastName}` : (report.generatedBy?.username || <span className="text-gray-400 italic">Unknown User</span>)}
                    {report.generatedBy?.role && <span className="text-xs text-gray-500 ml-2">({formatType(report.generatedBy.role)})</span>}
                </dd>
            </div>
            {/* Generated At (Timestamp) - Corrected */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Generated Timestamp</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {/* Uses object options for Intl.DateTimeFormat */}
                    {formatDate(report.generatedAt || report.createdAt, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}
                </dd>
            </div>
             {/* Summary */}
             <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
               <dt className="text-sm font-medium text-gray-500">Summary</dt>
               <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap break-words">
                 {report.summary || <span className="text-gray-400 italic">No summary provided.</span>}
               </dd>
             </div>


             {/* Issues and Risks */}
             <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                 <dt className="text-sm font-medium text-gray-500">Issues and Risks</dt>
                 <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                     {issuesAndRisks && issuesAndRisks.length > 0 ? (
                         <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                             {issuesAndRisks.map((issue, index) => ( // Added index as fallback key
                                <li key={issue._id || index} className="pl-3 pr-4 py-3 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                                    <span className={`mt-0.5 px-2 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full whitespace-nowrap ${getBadge(issue.severity)} capitalize`}>
                                        {issue.severity || 'medium'}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-800">{issue.description || 'No description'}</p>
                                    </div>
                                    {/* Display ReportedAt date if available */}
                                    {issue.reportedAt && (
                                        <div className="flex-shrink-0 flex items-center text-xs text-gray-500 pt-1 sm:pt-0">
                                            <CalendarDaysIcon className="h-4 w-4 mr-1 text-gray-400" aria-hidden="true" />
                                            Reported: {formatDate(issue.reportedAt, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                    )}
                                </li>
                             ))}
                         </ul>
                     ) : (
                         <span className="text-gray-400 italic">No issues or risks reported.</span>
                     )}
                 </dd>
             </div>

            {/* Attachments */}
             <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
               <dt className="text-sm font-medium text-gray-500">Attachments</dt>
               <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {report.attachments && report.attachments.length > 0 ? (
                        <ul role="list" className="border border-gray-200 rounded-md divide-y divide-gray-200">
                           {report.attachments.map((att) => {
                                const fileName = att.fileName || `Attachment_${att._id}`;
                                const fileType = getFileType(fileName);
                                const fileUrl = att.url;

                                return (
                                    <li key={att._id} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm space-x-3">
                                        <div className="w-0 flex-1 flex items-center min-w-0">
                                            {/* Icon */}
                                            {fileType === 'image' && <PhotoIcon className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />}
                                            {fileType === 'pdf' && <DocumentTextIcon className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />}
                                            {fileType === 'other' && <PaperClipIcon className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />}

                                            {/* Filename */}
                                            <span className="ml-2 flex-1 w-0 truncate font-medium text-gray-700" title={fileName}>
                                                {fileName}
                                            </span>
                                        </div>
                                        {/* Download Button */}
                                        <div className="ml-4 flex-shrink-0">
                                            {fileUrl ? (
                                                <button
                                                   type="button"
                                                   onClick={() => handleDownload(fileUrl, fileName)}
                                                   disabled={isDownloading}
                                                   className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                   title={isDownloading ? 'Download in progress...' : `Download ${fileName}`}
                                                >
                                                    {isDownloading ? <ArrowPathIcon className="-ml-0.5 mr-1 h-4 w-4 animate-spin" /> : <ArrowDownTrayIcon className="-ml-0.5 mr-1 h-4 w-4" />}
                                                    {isDownloading ? 'Downloading...' : 'Download'}
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">No Link</span>
                                            )}
                                        </div>
                                    </li>
                                );
                           })}
                        </ul>
                    ) : (
                         <span className="text-gray-400 italic">No attachments provided.</span>
                    )}
               </dd>
             </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default CommitteeReportDetail;