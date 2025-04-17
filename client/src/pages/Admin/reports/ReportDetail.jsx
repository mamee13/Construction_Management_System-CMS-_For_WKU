
/* eslint-disable */
import { useState, useEffect } from "react"; // Removed useRef
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
// Import @react-pdf/renderer component
import { PDFDownloadLink } from '@react-pdf/renderer';
import {
  ArrowPathIcon,
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PaperClipIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  PhotoIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import authAPI from "../../../api/auth";
import reportsAPI from "../../../api/reports";
// Import the separate PDF document structure component
import ReportPdfDocument from '../../../utils/ReportPdfDocument'; // Adjust path if needed

// --- Reusable UI Components (Keep as they were) ---

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
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
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
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">{title}</h3>
                                <div className="mt-2"><p className="text-sm text-gray-500">{children}</p></div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white ${isDanger ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'} focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm`}
                            onClick={onConfirm}
                        >{confirmText}</button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={onClose}
                        >Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Helper Function for Attachments (for web display) ---
const getFileType = (fileName = '') => {
  if (!fileName) return 'other';
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
  if (extension === 'pdf') return 'pdf';
  return 'other';
};

// --- Main Component ---
const ReportDetailAdmin = () => {
  const { id: reportId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const currentUser = authAPI.getCurrentUser();

  // 1. Check User Role
  useEffect(() => {
    if (currentUser) {
        setIsLoadingUser(false);
        const isUserAdmin = currentUser.role === "admin";
        setIsAdmin(isUserAdmin);
        if (!isUserAdmin) {
            toast.error("Access Denied. Administrator privileges required.");
            navigate("/dashboard");
        }
    } else {
        setIsLoadingUser(false);
        toast.error("Authentication required. Please log in as an admin.");
        navigate("/login");
    }
  }, [currentUser, navigate]);

  // 2. Fetch Report Data
  const {
    data: reportQueryData,
    isLoading: isLoadingReport,
    error: reportError,
    refetch,
  } = useQuery({
    queryKey: ["report", reportId],
    queryFn: () => reportsAPI.getReportById(reportId),
    enabled: !!reportId && isAdmin && !isLoadingUser,
    staleTime: 1 * 60 * 1000,
    onSuccess: (data) => {
        setFeedbackText(data?.data?.feedback || '');
        setSelectedStatus(data?.data?.status || '');
    }
  });

  // 3. Mutations for Admin Actions
  const updateMutation = useMutation({
    mutationFn: (updateData) => reportsAPI.updateReport(reportId, updateData),
    onSuccess: () => {
        toast.success("Report updated successfully!");
        queryClient.invalidateQueries({ queryKey: ["report", reportId] });
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
        queryClient.invalidateQueries({ queryKey: ["reports"] });
        navigate("/admin/reports");
    },
    onError: (error) => {
        console.error("Error deleting report:", error);
        toast.error(`Failed to delete report: ${error.message || 'Server error'}`);
        setShowDeleteConfirm(false);
    },
  });

  // --- Event Handlers ---
  const handleDeleteClick = () => setShowDeleteConfirm(true);
  const handleConfirmDelete = () => deleteMutation.mutate();
  const handleUpdateReport = () => {
    if (!reportId) return;
    updateMutation.mutate({ status: selectedStatus, feedback: feedbackText });
  };

  // --- Render Logic ---

  if (isLoadingUser) {
    return <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto"><LoadingSpinner message="Verifying admin access..." /></div>;
  }
  if (!isAdmin) return null; // Should have navigated away

  if (isLoadingReport) {
     return <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto"><LoadingSpinner message="Loading report data..." /></div>;
  }

  if (reportError) {
    const errorDetails = reportError.response?.data?.message || reportError.message;
    return (
      <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <ErrorDisplay error={{ message: errorDetails }} onRetry={refetch} context="Report Data"/>
         <div className="mt-6 text-center">
            <button type="button" onClick={() => navigate("/admin/reports")} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <ArrowLeftIcon className="h-5 w-5 mr-2" /> Back to Reports
            </button>
        </div>
      </div>
    );
  }

  const report = reportQueryData?.data;
  if (!report) {
     return (
        <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
            <ErrorDisplay error={{ message: "Report data could not be loaded or is missing." }} context="Report Data" />
             <div className="mt-6 text-center">
                 <button type="button" onClick={() => navigate("/admin/reports")} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <ArrowLeftIcon className="h-5 w-5 mr-2" /> Back to Reports
                </button>
            </div>
        </div>
     );
  }

   // Generate filename for PDF download
   const getPdfFilename = () => {
      const reportTitle = report?.title || 'report';
      const safeTitle = reportTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      return `${safeTitle}_${reportId}_${new Date().toISOString().slice(0, 10)}.pdf`;
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
             {/* Check status color class for oklch if issues persist with PDF generation */}
             <span className={`px-2 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full ${reportsAPI.getReportStatusColor(report.status)}`}>
                {reportsAPI.getReportStatusLabel(report.status)}
            </span>
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-4 flex-shrink-0 flex flex-wrap gap-2 justify-end">

          {/* --- PDF Download Button (using @react-pdf/renderer) --- */}
          <PDFDownloadLink
              document={<ReportPdfDocument report={report} />} // Pass the report data
              fileName={getPdfFilename()} // Set the download filename
          >
            {/* This function renders the actual button and handles loading/error states */}
            {({ blob, url, loading, error }) => (
              <button
                type="button"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
                title={error ? `Error generating PDF: ${error}`: (loading ? 'Generating PDF...' : 'Export report details to PDF')}
              >
                {loading ? (
                  <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                )}
                {loading ? 'Generating...' : 'Export PDF'}
              </button>
            )}
          </PDFDownloadLink>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => navigate(`/admin/reports/edit/${report._id}`)}
            // Check colors for oklch if issues persist with PDF generation
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            title="Edit this report"
          >
            <PencilIcon className="h-5 w-5 mr-2" /> Edit
          </button>

           {/* Delete Button */}
           <button
            type="button"
            onClick={handleDeleteClick}
            disabled={deleteMutation.isLoading}
            // Check colors for oklch if issues persist with PDF generation
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            title="Delete this report"
          >
            {deleteMutation.isLoading ? <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" /> : <TrashIcon className="h-5 w-5 mr-2" />} Delete
           </button>

          {/* Back Button */}
          <button
            type="button"
            onClick={() => navigate("/admin/reports")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            title="Go back to the reports list"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" /> Back to List
          </button>
        </div>
      </div>

      {/* --- Details Card (HTML Web Display) --- */}
      {/* This section remains unchanged and renders the report details on the webpage */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
           <h3 className="text-lg leading-6 font-medium text-gray-900">Report Information</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Generated on {reportsAPI.formatDate(report.generatedAt || report.createdAt)}
            </p>
        </div>
        <div className="px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            {/* Project */}
             <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Project</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {report.project?.projectName || <span className="text-gray-400 italic">Unknown Project</span>}
                {report.project?.projectLocation && <span className="text-xs text-gray-500 block">({report.project.projectLocation})</span>}
              </dd>
            </div>
            {/* Report Type */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Report Type</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {reportsAPI.getReportTypeLabel(report.type)}
                </dd>
            </div>
            {/* Reporting Period */}
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
            {/* Generated By */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Generated By</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {report.generatedBy?.firstName ? `${report.generatedBy.firstName} ${report.generatedBy.lastName}` : (report.generatedBy?.username || <span className="text-gray-400 italic">Unknown User</span>)}
                    {report.generatedBy?.role && <span className="text-xs text-gray-500 ml-2">({reportsAPI.getReportStatusLabel(report.generatedBy.role)})</span>}
                </dd>
            </div>
            {/* Last Updated */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {reportsAPI.formatDate(report.updatedAt, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}
                </dd>
            </div>
            {/* Key Metrics */}
            {report.keyMetrics && Object.keys(report.keyMetrics).length > 0 && (
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
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
                                            {typeof value === 'number' && key.toLowerCase().includes('percentage') ? `${value.toFixed(1)}%` : value.toString()}
                                        </p>
                                    </div>
                            ))}
                        </div>
                    </dd>
                </div>
            )}
             {/* Summary */}
             <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
               <dt className="text-sm font-medium text-gray-500">Summary</dt>
               <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap break-words">
                 {report.summary || <span className="text-gray-400 italic">No summary provided.</span>}
               </dd>
             </div>
             {/* Issues and Risks */}
            {report.issuesAndRisks && report.issuesAndRisks.length > 0 && (
                 <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                     <dt className="text-sm font-medium text-gray-500">Issues and Risks</dt>
                     <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                         <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                             {report.issuesAndRisks.map((issue, index) => (
                                 <li key={index} className="px-4 py-3 flex items-start space-x-3">
                                     {/* Check badge colors for oklch */}
                                     <span className={`mt-0.5 px-2 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full whitespace-nowrap ${issue.severity === 'high' ? 'bg-red-100 text-red-800' : issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : issue.severity === 'low' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                         {reportsAPI.getReportStatusLabel(issue.severity || 'medium')}
                                     </span>
                                     <div className="flex-1 min-w-0">
                                         <p className="text-sm text-gray-800">{issue.description}</p>
                                         {issue.reportedAt && <p className="text-xs text-gray-500">Reported: {reportsAPI.formatDate(issue.reportedAt, { month: 'short', day: 'numeric' })}</p>}
                                     </div>
                                 </li>
                             ))}
                         </ul>
                     </dd>
                 </div>
            )}
            {/* Attachments */}
             {report.attachments && report.attachments.length > 0 && (
                 <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                   <dt className="text-sm font-medium text-gray-500">Attachments</dt>
                   <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <ul role="list" className="border border-gray-200 rounded-md divide-y divide-gray-200">
                           {report.attachments.map((file, index) => {
                                const fileType = getFileType(file.fileName);
                                return (
                                    <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm space-x-3">
                                        <div className="w-0 flex-1 flex items-center min-w-0">
                                            {/* Icon */}
                                            {fileType === 'image' && <PhotoIcon className="flex-shrink-0 h-5 w-5 text-gray-400" />}
                                            {fileType === 'pdf' && <DocumentTextIcon className="flex-shrink-0 h-5 w-5 text-gray-400" />}
                                            {fileType === 'other' && <PaperClipIcon className="flex-shrink-0 h-5 w-5 text-gray-400" />}
                                            {/* Filename / Link Info */}
                                            {/* Image Preview Link */}
                                            {fileType === 'image' && file.url && (
                                                <a href={file.url} target="_blank" rel="noopener noreferrer" className="ml-2 group flex items-center space-x-2 min-w-0" title={`View ${file.fileName || 'image'}`}>
                                                    <img src={file.url} alt={`Preview of ${file.fileName || 'attachment'}`} className="h-8 w-8 object-cover rounded flex-shrink-0 bg-gray-100 border group-hover:opacity-75"/>
                                                    <span className="font-medium text-indigo-600 group-hover:text-indigo-500 group-hover:underline truncate flex-1">{file.fileName || 'Image File'}</span>
                                                </a>
                                            )}
                                            {/* Text Link for Non-Images */}
                                            {fileType !== 'image' && (
                                                 <a href={file.url || '#'} target={file.url ? "_blank" : undefined} rel={file.url ? "noopener noreferrer" : undefined} className={`ml-2 flex-1 w-0 truncate font-medium ${file.url ? 'text-indigo-600 hover:text-indigo-500 hover:underline' : 'text-gray-500 cursor-not-allowed'}`} title={file.url ? `Open ${file.fileName || 'file'}` : 'No link available'} onClick={(e) => !file.url && e.preventDefault()}>
                                                    {file.fileName || (fileType === 'pdf' ? 'PDF Document' : 'Attached File')}
                                                </a>
                                            )}
                                            {!file.url && fileType !== 'image' && ( <span className="ml-2 flex-1 w-0 truncate font-medium text-gray-700">{file.fileName || (fileType === 'pdf' ? 'PDF Document (No Link)' : 'Attached File (No Link)')}</span> )}
                                        </div>
                                        {/* Download Button (Web Display) */}
                                        <div className="ml-4 flex-shrink-0">
                                            {file.url ? (
                                                <a href={file.url} download={file.fileName || true} className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" title={`Download ${file.fileName || 'file'}`} target="_blank" rel="noopener noreferrer">
                                                    <ArrowDownTrayIcon className="-ml-0.5 mr-1 h-4 w-4" /> Download
                                                </a>
                                            ) : ( <span className="text-xs text-gray-400 italic">No Link</span> )}
                                        </div>
                                    </li>
                                );
                           })}
                        </ul>
                   </dd>
                 </div>
             )}
          </dl>
        </div>
      </div>

      {/* --- Admin Actions Card (HTML Web Display) --- */}
      {/* This section remains unchanged and renders the interactive controls on the webpage */}
      <div className="bg-white shadow sm:rounded-lg mb-8">
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
                 <label htmlFor="reportStatus" className="block text-sm font-medium text-gray-700 mb-1">Change Status</label>
                 <select
                    id="reportStatus"
                    name="reportStatus"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                 >
                     <option value="submitted">Submitted</option>
                     <option value="approved">Approved</option>
                     <option value="rejected">Rejected</option>
                     <option value="pending_review">Pending Review</option>
                     <option value="draft">Draft</option>
                     <option value="archived">Archived</option>
                 </select>
              </div>
               {/* Feedback Input */}
               <div>
                  <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">Feedback (Optional)</label>
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
                       // Check colors for oklch if issues persist with PDF generation
                       className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                   >
                      {updateMutation.isLoading ? <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" /> : <CheckCircleIcon className="h-5 w-5 mr-2" />}
                      Save Status & Feedback
                   </button>
               </div>
          </div>
      </div>

      {/* --- Delete Confirmation Modal --- */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Report"
        confirmText={deleteMutation.isLoading ? "Deleting..." : "Delete"}
        isDanger={true}
      >
        Are you sure you want to delete this report titled "{report?.title || 'this report'}"? This action cannot be undone.
      </ConfirmationModal>

    </div>
  );
}

export default ReportDetailAdmin;