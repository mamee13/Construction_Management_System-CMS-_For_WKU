


/* eslint-disable */
import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
// Import @react-pdf/renderer component
import { PDFDownloadLink } from '@react-pdf/renderer';
import {
  ArrowPathIcon,
  ArrowLeftIcon,
  PencilSquareIcon,
  PaperClipIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  PhotoIcon, // Keep if used by getFileType
} from "@heroicons/react/24/outline";
import authAPI from "../../../api/auth";
import reportsAPI from "../../../api/reports";
// Import the separate PDF document structure component
// Ensure this path is correct and the component exists!
import ReportPdfDocument from '../../../utils/ReportPdfDocument';

// --- Reusable Components ---

const LoadingSpinner = ({ message = "Loading..." }) => (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <ArrowPathIcon className="h-10 w-10 text-indigo-500 animate-spin" aria-hidden="true" />
        <span className="ml-3 text-lg text-gray-700">{message}</span>
    </div>
);

const ErrorDisplay = ({ error, onRetry, context = "Report" }) => (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md shadow-md">
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
                            <ArrowPathIcon className="h-4 w-4 mr-1.5"/>
                            Try again
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
);

// --- Helper Function for Attachments ---
const getFileType = (fileName = '') => {
  if (!fileName) return 'other';
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(extension)) {
    return 'image';
  }
  if (extension === 'pdf') {
    return 'pdf';
  }
  return 'other';
};


// --- Main Component ---

const ReportDetailForContractor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isContractor, setIsContractor] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const currentUser = authAPI.getCurrentUser();

  // --- Effect for Role Check ---
  useEffect(() => {
    if (currentUser) {
        setIsLoadingUser(false);
        const userRole = currentUser.role;
        const isUserContractor = userRole === "contractor";
        setIsContractor(isUserContractor);

        if (!isUserContractor) {
            toast.warn("Access denied. This page is for contractors only.", { autoClose: 3000 });
            navigate("/dashboard");
        }
    } else {
        setIsLoadingUser(false);
        toast.error("Authentication required.");
        navigate("/login");
    }
  }, [currentUser, navigate]);

  // --- Fetch Report Data ---
  const {
    data: reportQueryData,
    isLoading: isLoadingReport,
    error: reportError,
    isError: isReportError,
    refetch,
  } = useQuery({
    queryKey: ["report", id, "contractor"],
    queryFn: () => reportsAPI.getReportById(id),
    enabled: !!id && !isLoadingUser && isContractor,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // --- Loading States ---
  if (isLoadingUser) {
      return <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto"><LoadingSpinner message="Verifying user access..." /></div>;
  }
  if (!isContractor) return null;
  if (isLoadingReport) {
    return <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto"><LoadingSpinner message="Loading report details..." /></div>;
  }

  // --- Error State ---
  if (isReportError) {
    return (
      <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <ErrorDisplay error={reportError} onRetry={refetch} context="Report Details"/>
        <div className="mt-6 text-center">
            <button type="button" onClick={() => navigate("/contractor-reports")} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <ArrowLeftIcon className="h-5 w-5 mr-2" /> Back to My Reports
            </button>
        </div>
      </div>
    );
  }

  // --- Data Validation and Extraction ---
  const report = reportQueryData?.data;
  if (!report) {
    return (
        <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
            <ErrorDisplay error={{ message: "Report data could not be found or is invalid." }} context="Report Data" />
             <div className="mt-6 text-center">
                <button type="button" onClick={() => navigate("/contractor-reports")} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <ArrowLeftIcon className="h-5 w-5 mr-2" /> Back to My Reports
                </button>
            </div>
        </div>
    );
  }

  // --- Derived Data & Checks ---
  const reportUser = report.generatedBy;
  const projectInfo = report.project;
  const isOwnReport = reportUser?._id === currentUser?._id;
  const canEdit = isOwnReport && ['pending', 'draft', 'rejected'].includes(report.status);
  const showFeedback = Boolean(report.feedback);

  // --- PDF Filename Generation ---
  const getPdfFilename = () => {
    const reportTitle = report?.title || 'report';
    const safeTitle = reportTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return `${safeTitle}_${id}_${new Date().toISOString().slice(0, 10)}.pdf`;
  }

  // --- Render Report Details ---
  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* --- Header --- */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold leading-7 text-gray-900 sm:truncate mb-1">
            {report?.title ?? "Report Detail"}
          </h1>
          <p className="text-sm text-gray-500">
            {reportsAPI.getReportTypeLabel(report.type)} Report
            {projectInfo?.projectName && ` for ${projectInfo.projectName}`}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-4 flex-shrink-0 flex flex-wrap gap-2 justify-end">

          {/* --- PDF Download Button --- */}
          {/* Ensure 'report' is valid before rendering the link */}
          {report && (
            <PDFDownloadLink
                document={<ReportPdfDocument report={report} />}
                fileName={getPdfFilename()}
            >
              {({ loading, error }) => (
                <button
                  type="button"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
                  title={error ? `Error generating PDF: ${error}`: (loading ? 'Generating PDF...' : 'Download report as PDF')}
                  onClick={() => { // Add onClick handler for debugging errors
                      if (error) {
                          console.error("PDF Generation Error (from link):", error);
                          toast.error("Failed to generate PDF. Check console for details.");
                      }
                  }}
                >
                  {loading ? <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" /> : <ArrowDownTrayIcon className="h-5 w-5 mr-2" />}
                  {loading ? 'Generating...' : 'Download PDF'}
                </button>
              )}
            </PDFDownloadLink>
          )}


          {/* --- Edit Button (Conditional) --- */}
          {canEdit && (
            <Link
              to={`/contractor-reports/edit/${report._id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              title="Edit this report"
            >
              <PencilSquareIcon className="h-5 w-5 mr-2" /> Edit
            </Link>
          )}

          {/* --- Back Button --- */}
          <button
            type="button"
            onClick={() => navigate("/contractor-reports")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" /> Back to My Reports
          </button>
        </div>
      </div>

      {/* --- Details Card (HTML Web Display - Renders the report on the page) --- */}
      <div className="bg-white shadow-lg border border-gray-200 overflow-hidden sm:rounded-lg">
          {/* ... Rest of the HTML rendering code remains the same ... */}
          {/* Card Header */}
           <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Report Information</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">Submitted on {reportsAPI.formatDate(report.createdAt)}</p>
                    </div>
                    {report.status && (<span className={`ml-3 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${reportsAPI.getReportStatusColor(report.status)}`}>{reportsAPI.getReportStatusLabel(report.status)}</span>)}
                </div>
           </div>
           {/* Card Body with dl/dt/dd */}
           <div className="px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-200">
                     {/* Basic Info */}
                    <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"><dt className="text-sm font-medium text-gray-500 flex items-center"><BuildingOfficeIcon className="h-4 w-4 mr-1.5 text-gray-400"/>Project</dt><dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{projectInfo?.projectName || <span className="text-gray-400 italic">No project details</span>}</dd></div>
                    <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"><dt className="text-sm font-medium text-gray-500">Report Type</dt><dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{reportsAPI.getReportTypeLabel(report.type)}</dd></div>
                    {(report.periodStartDate || report.periodEndDate) && (<div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"><dt className="text-sm font-medium text-gray-500">Reporting Period</dt><dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{report.periodStartDate ? reportsAPI.formatDate(report.periodStartDate) : "N/A"} - {report.periodEndDate ? reportsAPI.formatDate(report.periodEndDate) : "N/A"}</dd></div>)}
                    <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"><dt className="text-sm font-medium text-gray-500 flex items-center"><UserIcon className="h-4 w-4 mr-1.5 text-gray-400"/>Submitted By</dt><dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{isOwnReport ? "You" : (reportUser?.firstName ? `${reportUser.firstName} ${reportUser.lastName}` : <span className="text-gray-400 italic">Unknown User</span>)}</dd></div>
                    <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"><dt className="text-sm font-medium text-gray-500 flex items-center"><CalendarIcon className="h-4 w-4 mr-1.5 text-gray-400"/>Last Updated</dt><dd className="mt-1 text-sm text-gray-500 sm:mt-0 sm:col-span-2">{reportsAPI.formatDate(report.updatedAt, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</dd></div>
                     {/* Key Metrics */}
                    {report.keyMetrics && Object.keys(report.keyMetrics).length > 0 && (<div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"><dt className="text-sm font-medium text-gray-500">Key Metrics</dt><dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2"><div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{Object.entries(report.keyMetrics).filter(([_, value]) => value !== null && value !== undefined).map(([key, value]) => (<div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-200"><p className="text-xs font-medium text-gray-600 truncate capitalize">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</p><p className="mt-1 text-xl font-semibold text-gray-900">{typeof value === 'number' && key.toLowerCase().includes('percentage') ? `${value.toFixed(1)}%` : value.toString()}</p></div>))}</div></dd></div>)}
                     {/* Summary */}
                    <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"><dt className="text-sm font-medium text-gray-500 flex items-center"><DocumentTextIcon className="h-4 w-4 mr-1.5 text-gray-400"/>Summary</dt><dd className="mt-1 text-sm text-gray-700 sm:mt-0 sm:col-span-2 whitespace-pre-wrap break-words">{report.summary || <span className="text-gray-400 italic">No summary provided.</span>}</dd></div>
                     {/* Issues and Risks */}
                    {report.issuesAndRisks && report.issuesAndRisks.length > 0 && (<div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"><dt className="text-sm font-medium text-gray-500 flex items-center"><ExclamationTriangleIcon className="h-4 w-4 mr-1.5 text-yellow-500"/>Issues & Risks</dt><dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2"><ul className="border border-gray-200 rounded-md divide-y divide-gray-200">{report.issuesAndRisks.map((issue, index) => (<li key={index} className="px-3 py-2 flex items-start space-x-3"><span className={`mt-0.5 px-2 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full whitespace-nowrap ${issue.severity === 'high' ? 'bg-red-100 text-red-800' : issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : issue.severity === 'low' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{reportsAPI.getReportStatusLabel(issue.severity || 'medium')}</span><div className="flex-1 min-w-0"><p className="text-sm text-gray-800">{issue.description}</p>{issue.reportedAt && <p className="text-xs text-gray-500">Reported: {reportsAPI.formatDate(issue.reportedAt, { month: 'short', day: 'numeric' })}</p>}</div></li>))}</ul></dd></div>)}
                     {/* Attachments */}
                    {report.attachments && report.attachments.length > 0 && (
                        <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500 flex items-center"><PaperClipIcon className="h-4 w-4 mr-1.5 text-gray-400"/>Attachments</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                <ul role="list" className="border border-gray-200 rounded-md divide-y divide-gray-200">
                                    {report.attachments.map((file, index) => {
                                        const fileType = getFileType(file.fileName);
                                        return ( <li key={index} className="pl-3 pr-4 py-2 flex items-center justify-between text-sm space-x-3"> <div className="w-0 flex-1 flex items-center min-w-0"> {fileType === 'image' && <PhotoIcon className="flex-shrink-0 h-5 w-5 text-gray-400" />} {fileType === 'pdf' && <DocumentTextIcon className="flex-shrink-0 h-5 w-5 text-gray-400" />} {fileType === 'other' && <PaperClipIcon className="flex-shrink-0 h-5 w-5 text-gray-400" />} <span className="ml-2 flex-1 w-0 truncate font-medium"> {file.url ? ( <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500 hover:underline"> {file.fileName || 'Attached File'} </a> ) : ( <span className="text-gray-700">{file.fileName || 'Attached File (No Link)'}</span> )} </span> </div> <div className="ml-4 flex-shrink-0"> {file.url ? ( <a href={file.url} download={file.fileName || true} className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500" title={`Download ${file.fileName || 'file'}`} target="_blank" rel="noopener noreferrer"> <ArrowDownTrayIcon className="-ml-0.5 mr-0.5 h-3.5 w-3.5" /> Download </a> ) : ( <span className="text-xs text-gray-400 italic">No Link</span> )} </div> </li> );
                                    })}
                                </ul>
                            </dd>
                        </div>
                    )}
                     {/* Admin Feedback */}
                    {showFeedback && (<div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-red-50/50"><dt className="text-sm font-medium text-red-600 flex items-center"><ExclamationTriangleIcon className="h-4 w-4 mr-1.5 text-red-400"/>Admin Feedback</dt><dd className="mt-1 text-sm text-gray-800 sm:mt-0 sm:col-span-2"><div className="border border-red-200 p-3 rounded-md whitespace-pre-wrap break-words bg-white shadow-sm">{report.feedback}</div></dd></div>)}
                </dl>
           </div>
      </div>
    </div>
  );
};

export default ReportDetailForContractor;