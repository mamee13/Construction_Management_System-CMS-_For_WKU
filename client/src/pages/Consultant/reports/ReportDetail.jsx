

/* eslint-disable */
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify";
import {
  ArrowPathIcon,
  ArrowLeftIcon,
  PencilIcon,
  PaperClipIcon, // Import for attachments
  ExclamationTriangleIcon, // Better icon for issues
  XCircleIcon // Icon for error state
} from "@heroicons/react/24/outline" // Using outline for consistency
import authAPI from "../../../api/auth"
import reportsAPI from "../../../api/reports"

// A simple reusable loading component
const LoadingSpinner = ({ message = "Loading..." }) => (
    <div className="flex justify-center items-center h-64">
        <ArrowPathIcon className="h-10 w-10 text-indigo-500 animate-spin" aria-hidden="true" />
        <span className="ml-3 text-lg text-gray-700">{message}</span>
    </div>
);

// A simple reusable error component
const ErrorDisplay = ({ error, onRetry }) => (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
        <div className="flex">
            <div className="flex-shrink-0">
                <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
                <p className="text-sm font-medium text-red-800">Error Loading Report</p>
                <p className="mt-1 text-sm text-red-700">{error?.message || "An unknown error occurred."}</p>
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


const ReportDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isConsultant, setIsConsultant] = useState(false)
  const [isLoadingUser, setIsLoadingUser] = useState(true); // Track user loading
  const currentUser = authAPI.getCurrentUser()

  // Effect to check user role ONCE user data is available
  useEffect(() => {
    if (currentUser) {
        setIsLoadingUser(false); // User data loaded
        const userRole = currentUser.role;
        const isUserConsultant = userRole === "consultant";
        setIsConsultant(isUserConsultant);

        if (!isUserConsultant) {
            toast.warn("Access denied. Only consultants can view this page.");
            navigate("/dashboard"); // Or appropriate page
        }
    } else {
        // Handle case where user is definitely not logged in after initial check
        // This depends on how authAPI.getCurrentUser behaves (sync/async)
        // If it's sync and returns null when not logged in:
        setIsLoadingUser(false);
        toast.error("Authentication required.");
        navigate("/login"); // Redirect to login
    }
  }, [currentUser, navigate]);

  // Fetch report data - enabled only if we have an ID and the user IS a consultant
  const {
    data: reportQueryData, // Rename to avoid conflict with 'report' variable later
    isLoading: isLoadingReport,
    error: reportError,
    refetch,
  } = useQuery({
    queryKey: ["report", id],
    queryFn: () => reportsAPI.getReportById(id),
    enabled: !!id && isConsultant && !isLoadingUser, // Ensure user is loaded and is a consultant
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
  });

  // --- Loading States ---
  if (isLoadingUser) {
      return (
          <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
              <LoadingSpinner message="Checking user permissions..." />
          </div>
      );
  }

   // Render nothing if not consultant (should have been navigated away, but safety net)
   if (!isConsultant) {
    return null;
  }

  if (isLoadingReport) {
    return (
      <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <LoadingSpinner message="Loading report data..." />
      </div>
    )
  }

  // --- Error State ---
  if (reportError) {
    return (
      <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <ErrorDisplay error={reportError} onRetry={refetch} />
        <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate("/reports")}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" aria-hidden="true" />
              Back to Reports
            </button>
        </div>
      </div>
    )
  }

  // --- Data Validation ---
  // Ensure data structure is as expected after loading and no error
  const report = reportQueryData?.data;
  if (!report) {
    return (
        <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
            <ErrorDisplay error={{ message: "Report data not found or is in an unexpected format." }} />
             <div className="mt-6 text-center">
                <button
                type="button"
                onClick={() => navigate("/reports")}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                <ArrowLeftIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                Back to Reports
                </button>
            </div>
        </div>
    );
  }

  // Determine if the current user generated this report (handle populated vs. ID)
  const isOwnReport = report.generatedBy?._id === currentUser?._id || // If populated
                      report.generatedBy === currentUser?._id;        // If just ID string

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* --- Header --- */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold leading-7 text-gray-900 sm:truncate mb-1">
            {report.title || "Report Detail"}
          </h1>
          <p className="text-sm text-gray-500">
            {reportsAPI.getReportTypeLabel(report.type)} Report
            {report.project?.projectName && ` for ${report.project.projectName}`}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-4 flex-shrink-0 flex space-x-3">
          {isOwnReport && (report.status === "draft" || report.status === "submitted" || report.status === "pending") && ( // Allow editing submitted/pending? Adjust as needed
            <button
              type="button"
              onClick={() => navigate(`/reports/edit/${report._id}`)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              title="Edit this report"
            >
              <PencilIcon className="h-5 w-5 mr-2" aria-hidden="true" />
              Edit
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate("/reports")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            Back to Reports
          </button>
        </div>
      </div>

      {/* --- Details Card --- */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Report Details</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Generated on {reportsAPI.formatDate(report.generatedAt || report.createdAt)}
              </p>
            </div>
            {report.status && (
                <span
                className={`ml-3 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${reportsAPI.getReportStatusColor(report.status)}`}
                >
                {reportsAPI.getReportStatusLabel(report.status)}
                </span>
            )}
          </div>
        </div>
        <div className="px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            {/* --- Basic Info --- */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Project</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {/* Link to project detail page if possible */}
                {report.project?.projectName ? (
                     <span className="hover:text-indigo-600">{report.project.projectName}</span> // Add Link component if routes exist
                ) : (
                    <span className="text-gray-400 italic">Unknown Project</span>
                )}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Report Type</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {reportsAPI.getReportTypeLabel(report.type)}
              </dd>
            </div>
            {(report.periodStartDate || report.periodEndDate) && ( // Show if either exists
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Reporting Period</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {report.periodStartDate ? reportsAPI.formatDate(report.periodStartDate) : "N/A"}
                  {' to '}
                  {report.periodEndDate ? reportsAPI.formatDate(report.periodEndDate) : "N/A"}
                </dd>
              </div>
            )}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Generated By</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isOwnReport
                  ? "You"
                  : (report.generatedBy?.firstName ? `${report.generatedBy.firstName} ${report.generatedBy.lastName}` : (report.generatedBy?.username || report.generatedBy || <span className="text-gray-400 italic">Unknown Consultant</span>))}
              </dd>
            </div>
             <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {reportsAPI.formatDate(report.updatedAt, {
                  year: "numeric", month: "short", day: "numeric",
                  hour: "2-digit", minute: "2-digit", hour12: true // Example more detailed format
                })}
              </dd>
            </div>

            {/* --- Key Metrics --- */}
            {report.keyMetrics && Object.keys(report.keyMetrics).length > 0 && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Key Metrics</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {Object.entries(report.keyMetrics)
                        // Filter out any potential null/undefined values if needed
                        .filter(([_, value]) => value !== null && value !== undefined)
                        .map(([key, value]) => (
                            <div key={key} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <p className="text-sm font-medium text-gray-600 truncate capitalize">
                                    {/* Simple key formatting */}
                                    {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                                </p>
                                <p className="mt-1 text-2xl font-semibold text-gray-900">
                                    {typeof value === 'number' && key.toLowerCase().includes('percentage')
                                    ? `${value.toFixed(1)}%` // Format percentage
                                    : value.toString()} {/* Ensure value is string */}
                                </p>
                            </div>
                    ))}
                  </div>
                </dd>
              </div>
            )}

            {/* --- Summary --- */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Summary</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap break-words">
                {report.summary || <span className="text-gray-400 italic">No summary provided.</span>}
              </dd>
            </div>

            {/* --- Issues and Risks (Updated) --- */}
            {report.issuesAndRisks && report.issuesAndRisks.length > 0 && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Issues and Risks</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                    {report.issuesAndRisks.map((issue, index) => (
                      <li key={index} className="px-4 py-3 flex items-start space-x-3">
                         <span className={`mt-0.5 px-2 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full whitespace-nowrap ${
                             issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                             issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                             issue.severity === 'low' ? 'bg-green-100 text-green-800' :
                             'bg-gray-100 text-gray-800' // Default/fallback
                         }`}>
                             {reportsAPI.getReportStatusLabel(issue.severity || 'medium')}
                         </span>
                        <div className="flex-1 min-w-0">
                           <p className="text-sm text-gray-800">{issue.description}</p>
                           {issue.reportedAt && (
                               <p className="text-xs text-gray-500">
                                    Reported: {reportsAPI.formatDate(issue.reportedAt, { month: 'short', day: 'numeric' })}
                               </p>
                           )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}

            {/* --- Attachments (New) --- */}
            {report.attachments && report.attachments.length > 0 && (
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Attachments</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <ul role="list" className="border border-gray-200 rounded-md divide-y divide-gray-200">
                            {report.attachments.map((file, index) => (
                                <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                                    <div className="w-0 flex-1 flex items-center">
                                        <PaperClipIcon className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />
                                        <span className="ml-2 flex-1 w-0 truncate">
                                            {/* Ensure URL exists before creating link */}
                                            {file.url ? (
                                                <a
                                                    href={file.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                                                    title={`Open ${file.fileName || 'attachment'}`}
                                                >
                                                    {file.fileName || 'Attached File'}
                                                </a>
                                            ) : (
                                                <span className="font-medium text-gray-700">
                                                    {file.fileName || 'Attached File (No Link)'}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    {/* Optional: Add download button or info if needed */}
                                    {/* <div className="ml-4 flex-shrink-0">
                                        <a href={file.url} download={file.fileName} className="font-medium text-indigo-600 hover:text-indigo-500">Download</a>
                                    </div> */}
                                </li>
                            ))}
                        </ul>
                    </dd>
                </div>
            )}


            {/* --- Feedback --- */}
            {report.feedback && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Admin Feedback</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md whitespace-pre-wrap break-words">
                     {report.feedback}
                  </div>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  )
}

export default ReportDetail