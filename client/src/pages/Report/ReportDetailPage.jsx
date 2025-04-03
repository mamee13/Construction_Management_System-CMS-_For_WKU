// src/pages/reports/ReportDetailPage.jsx (or similar path)

import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  TagIcon, // For Type
  ListBulletIcon, // For Summary/Issues
  PaperClipIcon, // For Attachments
  ChartBarIcon, // For Metrics
  ExclamationTriangleIcon,
  ArrowPathIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

import reportsAPI from '../../api/reports'; // Adjust path
import authAPI from '../../api/auth'; // Adjust path (for formatting roles)

const ReportDetailPage = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();

  const {
    data: reportResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['report', reportId],
    queryFn: () => reportsAPI.getReportById(reportId),
    enabled: !!reportId,
    // Add retry logic if desired
    // retry: 1,
  });

  const report = reportResponse?.data; // Access the report object inside 'data'

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-gray-600">Loading report details...</span>
      </div>
    );
  }

  // --- Error State ---
  // This catches errors from the API call, including 403 Forbidden or 404 Not Found from the backend
  if (isError) {
    const errorStatus = error?.response?.status;
    let title = 'Error Loading Report';
    let message = error?.message || 'Could not fetch details for this report. Please try again later.';

    if (errorStatus === 404) {
        title = 'Report Not Found';
        message = 'The report you are looking for does not exist.';
    } else if (errorStatus === 403) {
        title = 'Access Denied';
        message = 'You do not have permission to view this report.';
    }

    return (
       <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center">
         <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-red-500" />
         <h2 className="mt-4 text-xl font-semibold text-red-800">{title}</h2>
         <p className="mt-2 text-sm text-red-600">{message}</p>
         <div className="mt-6 flex items-center justify-center gap-x-4">
             <button
                onClick={() => refetch()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
                <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5" />
                Retry
            </button>
            <button
                onClick={() => navigate('/reports')} // Go back to list
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                Back to Reports
            </button>
         </div>
       </div>
    );
  }

   // --- Report Found State ---
   if (!report) {
     // Should ideally be caught by isError if API returns 404, but as a fallback
     return (
        <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center">
            <InformationCircleIcon className="h-12 w-12 mx-auto text-gray-400" />
            <h2 className="mt-4 text-xl font-semibold text-gray-700">Report Not Found</h2>
            <p className="mt-2 text-sm text-gray-500">The report data could not be loaded.</p>
             <button
                onClick={() => navigate('/reports')} // Go back to list
                className="mt-6 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                Back to Reports
            </button>
        </div>
     );
   }

  // --- Render Report Details ---
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
       {/* Back Button */}
       <div className="mb-6">
        <button
          onClick={() => navigate(-1)} // Go back to previous page (likely the list)
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-800"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" aria-hidden="true" />
          Back
        </button>
      </div>

      {/* Header */}
      <div className="md:flex md:items-center md:justify-between pb-4 border-b border-gray-200 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate inline-flex items-center">
             <DocumentTextIcon className="h-7 w-7 mr-3 text-indigo-500 flex-shrink-0" />
            {report.title}
          </h1>
           <p className="mt-1 text-sm text-gray-500">
            Report Type: {reportsAPI.getReportTypeLabel(report.type)}
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
           <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${reportsAPI.getReportStatusColor(report.status)}`}>
            {reportsAPI.getReportStatusLabel(report.status)}
          </span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

         {/* Left Column (Core Content) */}
        <div className="lg:col-span-2 space-y-6">

            {/* Summary Card */}
            <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900 inline-flex items-center">
                        <ListBulletIcon className="h-5 w-5 mr-2 text-gray-400" /> Summary
                    </h2>
                </div>
                <div className="px-4 py-5 sm:p-6">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {report.summary || 'No summary provided.'}
                    </p>
                </div>
            </div>

            {/* Key Metrics Card */}
            {report.keyMetrics && Object.keys(report.keyMetrics).length > 0 && (
                <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900 inline-flex items-center">
                           <ChartBarIcon className="h-5 w-5 mr-2 text-gray-400" /> Key Metrics / Snapshot
                        </h2>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                            {report.keyMetrics.overallProgressPercentage !== undefined && (
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Overall Progress</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{report.keyMetrics.overallProgressPercentage}%</dd>
                                </div>
                            )}
                             {report.keyMetrics.tasksCompleted !== undefined && (
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Tasks Completed</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{report.keyMetrics.tasksCompleted}</dd>
                                </div>
                            )}
                             {report.keyMetrics.tasksInProgress !== undefined && (
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Tasks In Progress</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{report.keyMetrics.tasksInProgress}</dd>
                                </div>
                            )}
                             {report.keyMetrics.tasksPending !== undefined && (
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Tasks Pending</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{report.keyMetrics.tasksPending}</dd>
                                </div>
                            )}
                             {report.keyMetrics.budgetSpentToDate !== undefined && (
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Budget Spent (at time)</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {report.keyMetrics.budgetSpentToDate?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) ?? 'N/A'}
                                    </dd>
                                </div>
                            )}
                           {/* Add other keyMetrics here */}
                        </dl>
                    </div>
                </div>
            )}

            {/* Issues and Risks Card */}
            {report.issuesAndRisks && report.issuesAndRisks.length > 0 && (
                 <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900 inline-flex items-center">
                            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-500" /> Issues & Risks Reported
                        </h2>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                       <ul role="list" className="divide-y divide-gray-200">
                         {report.issuesAndRisks.map((issue, index) => (
                           <li key={index} className="py-3">
                             <p className="text-sm text-gray-800">{issue.description}</p>
                             <div className="flex items-center justify-between mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                                    issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    Severity: {issue.severity || 'N/A'}
                                </span>
                                <span className="text-xs text-gray-500">
                                    Reported: {reportsAPI.formatDate(issue.reportedAt, { dateStyle: 'short', timeStyle: 'short' })}
                                </span>
                             </div>
                           </li>
                         ))}
                       </ul>
                    </div>
                </div>
            )}

            {/* Attachments Card */}
            {report.attachments && report.attachments.length > 0 && (
                 <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900 inline-flex items-center">
                            <PaperClipIcon className="h-5 w-5 mr-2 text-gray-400" /> Attachments
                        </h2>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                        <ul role="list" className="divide-y divide-gray-200 border border-gray-200 rounded-md">
                             {report.attachments.map((file, index) => (
                                <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm hover:bg-gray-50">
                                    <div className="w-0 flex-1 flex items-center">
                                        <PaperClipIcon className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />
                                        <span className="ml-2 flex-1 w-0 truncate">{file.fileName || 'Attached File'}</span>
                                    </div>
                                    <div className="ml-4 flex-shrink-0">
                                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 hover:text-indigo-500">
                                            Download
                                        </a>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

        </div>

         {/* Right Column (Metadata) */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Report Information</h2>
                </div>
                <div className="px-4 py-5 sm:p-6">
                     <dl className="space-y-4">
                         <div>
                            <dt className="text-sm font-medium text-gray-500 inline-flex items-center">
                                <InformationCircleIcon className='h-5 w-5 mr-2 text-gray-400'/> Project
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {report.project?.projectName ? (
                                    <Link to={`/projects/${report.project._id}`} className="text-indigo-600 hover:underline">
                                         {report.project.projectName}
                                    </Link>
                                ) : (
                                    'N/A'
                                )}
                            </dd>
                         </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500 inline-flex items-center">
                               <UserCircleIcon className='h-5 w-5 mr-2 text-gray-400'/> Generated By
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {report.generatedBy?.firstName || ''} {report.generatedBy?.lastName || 'Unknown User'}
                                <span className="block text-xs text-gray-500">{authAPI.formatRole(report.generatedBy?.role)}</span>
                            </dd>
                         </div>
                         <div>
                            <dt className="text-sm font-medium text-gray-500 inline-flex items-center">
                               <CalendarDaysIcon className='h-5 w-5 mr-2 text-gray-400'/> Generated At
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {reportsAPI.formatDate(report.generatedAt, { dateStyle: 'medium', timeStyle: 'short' })}
                            </dd>
                         </div>
                         {/* Optional: Report Period */}
                          {(report.periodStartDate || report.periodEndDate) && (
                             <div>
                                <dt className="text-sm font-medium text-gray-500 inline-flex items-center">
                                <CalendarDaysIcon className='h-5 w-5 mr-2 text-gray-400'/> Report Period
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {report.periodStartDate ? reportsAPI.formatDate(report.periodStartDate) : 'N/A'}
                                    {' - '}
                                     {report.periodEndDate ? reportsAPI.formatDate(report.periodEndDate) : 'N/A'}
                                </dd>
                            </div>
                         )}
                          <div>
                            <dt className="text-sm font-medium text-gray-500 inline-flex items-center">
                               <TagIcon className='h-5 w-5 mr-2 text-gray-400'/> Report Type
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {reportsAPI.getReportTypeLabel(report.type)}
                            </dd>
                         </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500 inline-flex items-center">
                               <InformationCircleIcon className='h-5 w-5 mr-2 text-gray-400'/> Current Status
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                 <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${reportsAPI.getReportStatusColor(report.status)}`}>
                                    {reportsAPI.getReportStatusLabel(report.status)}
                                </span>
                            </dd>
                         </div>

                     </dl>
                </div>
           </div>
            {/* Optional: Actions Card (Edit/Delete) - Add later based on permissions */}
            {/* <div className="bg-white shadow sm:rounded-lg p-4"> ... Actions ... </div> */}
        </div>

      </div>
    </div>
  );
};

export default ReportDetailPage;