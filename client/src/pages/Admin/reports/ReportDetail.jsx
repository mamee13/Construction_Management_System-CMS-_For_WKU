/* eslint-disable */
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-toastify";
import {
  ArrowPathIcon,
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon, // For delete
  PaperClipIcon,
  ExclamationTriangleIcon,
  XCircleIcon, // For error/cancel
  CheckCircleIcon, // For approve
  InformationCircleIcon, // For feedback section
} from "@heroicons/react/24/outline"
import authAPI from "../../../api/auth" // Assuming this exists and works
import reportsAPI from "../../../api/reports" // Your reports API client

// --- Reusable UI Components ---

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
                <p className="mt-1 text-sm text-red-700">{error?.message || "An unknown error occurred."}</p>
                {error?.details && <pre className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto">{JSON.stringify(error.details, null, 2)}</pre>}
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

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children, confirmText = "Confirm", isDanger = false }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

                {/* Modal panel */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">​</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            {isDanger && (
                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                                </div>
                            )}
                            <div className={`mt-3 text-center sm:mt-0 ${isDanger ? 'sm:ml-4' : ''} sm:text-left w-full`}>
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                    {title}
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        {children}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white ${isDanger ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'} focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm`}
                            onClick={onConfirm}
                        >
                            {confirmText}
                        </button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

const ReportDetailAdmin = () => {
  const { id: reportId } = useParams(); // Renamed to avoid conflict
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const currentUser = authAPI.getCurrentUser(); // Assuming sync fetch or cached

  // 1. Check User Role
  useEffect(() => {
    if (currentUser) {
        setIsLoadingUser(false);
        const userRole = currentUser.role;
        const isUserAdmin = userRole === "admin";
        setIsAdmin(isUserAdmin);

        if (!isUserAdmin) {
            toast.error("Access Denied. Administrator privileges required.");
            navigate("/dashboard"); // Or a forbidden page
        }
    } else {
        // Handle case where user is definitely not logged in
        setIsLoadingUser(false);
        toast.error("Authentication required. Please log in as an admin.");
        navigate("/login");
    }
  }, [currentUser, navigate]);

  // 2. Fetch Report Data (if user is admin and ID exists)
  const {
    data: reportQueryData,
    isLoading: isLoadingReport,
    error: reportError,
    refetch,
  } = useQuery({
    queryKey: ["report", reportId],
    queryFn: () => reportsAPI.getReportById(reportId),
    enabled: !!reportId && isAdmin && !isLoadingUser, // Only fetch if admin and ID is valid
    staleTime: 1 * 60 * 1000, // Keep data fresh for 1 minute
    onSuccess: (data) => {
        // Pre-fill feedback and status fields when data loads
        setFeedbackText(data?.data?.feedback || '');
        setSelectedStatus(data?.data?.status || '');
    }
  });

  // 3. Mutations for Admin Actions
  const updateMutation = useMutation({
    mutationFn: (updateData) => reportsAPI.updateReport(reportId, updateData),
    onSuccess: (data) => {
        toast.success("Report updated successfully!");
        queryClient.invalidateQueries({ queryKey: ["report", reportId] }); // Refetch specific report
        // queryClient.invalidateQueries({ queryKey: ["reports"] }); // Optionally refetch list
    },
    onError: (error) => {
        console.error("Error updating report:", error);
        toast.error(`Failed to update report: ${error.message || 'Server error'}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => reportsAPI.deleteReport(reportId),
    onSuccess: () => {
        toast.success("Report deleted successfully!");
        queryClient.invalidateQueries({ queryKey: ["reports"] }); // Invalidate list after delete
        navigate("/admin/reports"); // Navigate back to the reports list (adjust path)
    },
    onError: (error) => {
        console.error("Error deleting report:", error);
        toast.error(`Failed to delete report: ${error.message || 'Server error'}`);
        setShowDeleteConfirm(false); // Close modal on error
    },
  });

  // --- Event Handlers ---
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate();
  };

  const handleUpdateReport = () => {
    if (!reportId) return;
    const updateData = {
        status: selectedStatus,
        feedback: feedbackText,
        // Add other fields admins can update if necessary
    };
    updateMutation.mutate(updateData);
  };

  // --- Render Logic ---

  if (isLoadingUser) {
    return <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto"><LoadingSpinner message="Verifying admin access..." /></div>;
  }

  // Should have been navigated away, but safety check
  if (!isAdmin) {
    return null;
  }

  if (isLoadingReport) {
     return <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto"><LoadingSpinner message="Loading report data..." /></div>;
  }

  if (reportError) {
    // Extract backend error details if available
    const errorDetails = reportError.response?.data?.message || reportError.message;
    return (
      <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <ErrorDisplay error={{ message: errorDetails }} onRetry={refetch} context="Report Data"/>
         <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate("/admin/reports")} // Adjust path
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" aria-hidden="true" />
              Back to Reports
            </button>
        </div>
      </div>
    );
  }

  // Data validation after loading and no error
  const report = reportQueryData?.data;
  if (!report) {
     return (
        <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
            <ErrorDisplay error={{ message: "Report data could not be loaded or is missing." }} context="Report Data" />
             <div className="mt-6 text-center">
                <button
                type="button"
                onClick={() => navigate("/admin/reports")} // Adjust path
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                <ArrowLeftIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                Back to Reports
                </button>
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
            {reportsAPI.getReportTypeLabel(report.type)} Report
            {report.project?.projectName && ` for ${report.project.projectName}`}
             <span className="mx-2">|</span>
             <span className={`px-2 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full ${reportsAPI.getReportStatusColor(report.status)}`}>
                {reportsAPI.getReportStatusLabel(report.status)}
            </span>
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-4 flex-shrink-0 flex space-x-3">
          {/* Edit Button (for Admin) */}
          <button
            type="button"
            onClick={() => navigate(`/admin/reports/edit/${report._id}`)} // Adjust path if needed
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            title="Edit this report"
          >
            <PencilIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            Edit
          </button>

           {/* Delete Button (for Admin) */}
           <button
            type="button"
            onClick={handleDeleteClick}
            disabled={deleteMutation.isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            title="Delete this report"
          >
            {deleteMutation.isLoading ? (
                <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
            ) : (
                <TrashIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            )}
            Delete
          </button>

          {/* Back Button */}
          <button
            type="button"
            onClick={() => navigate("/admin/reports")} // Adjust path
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            Back to List
          </button>
        </div>
      </div>

      {/* --- Details Card --- */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
           <h3 className="text-lg leading-6 font-medium text-gray-900">Report Information</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Generated on {reportsAPI.formatDate(report.generatedAt || report.createdAt)}
            </p>
        </div>
        <div className="px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            {/* Project, Type, Period, Generated By, Dates - Same as previous example, ensure fields exist */}
            {/* --- Basic Info --- */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Project</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {report.project?.projectName ? (
                     <span className="hover:text-indigo-600">{report.project.projectName}</span>
                ) : (
                    <span className="text-gray-400 italic">Unknown Project</span>
                )}
                 {/* Optional: Add Project Location */}
                 {report.project?.projectLocation && <span className="text-xs text-gray-500 block">({report.project.projectLocation})</span>}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Report Type</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {reportsAPI.getReportTypeLabel(report.type)}
              </dd>
            </div>
            {(report.periodStartDate || report.periodEndDate) && (
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
                {/* Display user's full name and role */}
                {report.generatedBy?.firstName ? `${report.generatedBy.firstName} ${report.generatedBy.lastName}` : (report.generatedBy?.username || <span className="text-gray-400 italic">Unknown User</span>)}
                {report.generatedBy?.role && <span className="text-xs text-gray-500 ml-2">({reportsAPI.getReportStatusLabel(report.generatedBy.role)})</span>}
              </dd>
            </div>
             <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {reportsAPI.formatDate(report.updatedAt, {
                  year: "numeric", month: "short", day: "numeric",
                  hour: "2-digit", minute: "2-digit", hour12: true
                })}
              </dd>
            </div>

            {/* Key Metrics - Assuming structure is the same */}
            {report.keyMetrics && Object.keys(report.keyMetrics).length > 0 && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  {/* ... (Key metrics rendering - same as consultant version) ... */}
                   <dt className="text-sm font-medium text-gray-500">Key Metrics</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {Object.entries(report.keyMetrics)
                            .filter(([_, value]) => value !== null && value !== undefined)
                            .map(([key, value]) => (
                                <div key={key} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="text-sm font-medium text-gray-600 truncate capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                                    </p>
                                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                                        {typeof value === 'number' && key.toLowerCase().includes('percentage')
                                        ? `${value.toFixed(1)}%`
                                        : value.toString()}
                                    </p>
                                </div>
                        ))}
                      </div>
                    </dd>
              </div>
            )}

            {/* Summary - Assuming structure is the same */}
             <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
               <dt className="text-sm font-medium text-gray-500">Summary</dt>
               <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap break-words">
                 {report.summary || <span className="text-gray-400 italic">No summary provided.</span>}
               </dd>
             </div>


            {/* Issues and Risks - Assuming structure is the same */}
            {report.issuesAndRisks && report.issuesAndRisks.length > 0 && (
                 <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Issues and Risks</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                        {report.issuesAndRisks.map((issue, index) => (
                        <li key={index} className="px-4 py-3 flex items-start space-x-3">
                            {/* Severity Badge */}
                             <span className={`mt-0.5 px-2 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full whitespace-nowrap ${
                                issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                                issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                issue.severity === 'low' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                             }`}>
                                {reportsAPI.getReportStatusLabel(issue.severity || 'medium')}
                             </span>
                            <div className="flex-1 min-w-0">
                            {/* Description */}
                            <p className="text-sm text-gray-800">{issue.description}</p>
                            {/* Reported Date */}
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

            {/* Attachments - Assuming structure is the same */}
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
                                            {file.url ? (
                                                <a href={file.url} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline" title={`Open ${file.fileName || 'attachment'}`}>
                                                   {file.fileName || 'Attached File'}
                                                </a>
                                            ) : (
                                                <span className="font-medium text-gray-700">{file.fileName || 'Attached File (No Link)'}</span>
                                            )}
                                        </span>
                                   </div>
                               </li>
                           ))}
                        </ul>
                   </dd>
                 </div>
             )}
          </dl>
        </div>
      </div>

      {/* --- Admin Actions Card --- */}
      <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900 inline-flex items-center">
                 <InformationCircleIcon className="h-5 w-5 mr-2 text-indigo-500" />
                 Admin Actions
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Update report status and provide feedback.</p>
          </div>
          <div className="px-4 py-5 sm:p-6 space-y-6">
              {/* Status Update */}
              <div>
                 <label htmlFor="reportStatus" className="block text-sm font-medium text-gray-700 mb-1">
                    Change Status
                 </label>
                 <select
                    id="reportStatus"
                    name="reportStatus"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                 >
                     {/* Populate with status options from your backend/enum */}
                     <option value="submitted">Submitted</option>
                     <option value="approved">Approved</option>
                     <option value="rejected">Rejected</option>
                     <option value="pending_review">Pending Review</option>
                     <option value="draft">Draft</option>
                     <option value="archived">Archived</option>
                     {/* Add other relevant statuses */}
                 </select>
              </div>

               {/* Feedback Input */}
               <div>
                  <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
                    Feedback (Optional)
                  </label>
                  <textarea
                    id="feedback"
                    name="feedback"
                    rows={4}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                    placeholder="Provide feedback for the consultant/contractor..."
                  />
               </div>

               {/* Save Button */}
               <div className="flex justify-end">
                   <button
                       type="button"
                       onClick={handleUpdateReport}
                       disabled={updateMutation.isLoading}
                       className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                   >
                      {updateMutation.isLoading ? (
                            <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                        ) : (
                            <CheckCircleIcon className="h-5 w-5 mr-2" />
                        )}
                        Save Status & Feedback
                   </button>
               </div>
          </div>
      </div>


      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Report"
        confirmText={deleteMutation.isLoading ? "Deleting..." : "Delete"}
        isDanger={true}
      >
        Are you sure you want to delete this report titled "{report.title}"? This action cannot be undone.
      </ConfirmationModal>

    </div>
  );
}

export default ReportDetailAdmin;