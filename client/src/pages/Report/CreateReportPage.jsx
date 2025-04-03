// src/pages/reports/CreateReportPage.jsx (or similar path)

import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeftIcon,
  DocumentPlusIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

import reportsAPI from '../../api/reports'; // Adjust path
import projectsAPI from '../../api/projects'; // Adjust path
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


const CreateReportPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const currentUser = authAPI.getCurrentUser();
  const isAdmin = authAPI.hasRole('admin');

  // Pre-fill project ID if passed in URL query params (e.g., from project detail page)
  const initialProjectId = searchParams.get('projectId') || '';

  const [formData, setFormData] = useState({
    title: '',
    type: REPORT_TYPES[0].value, // Default to first type
    project: initialProjectId, // Project ID
    summary: '',
    periodStartDate: '',
    periodEndDate: '',
    // issuesAndRisks: [], // Simplified: Add complexity later if needed via UI
  });
  const [formErrors, setFormErrors] = useState({});

   // Fetch projects for the dropdown (only assigned ones for non-admins)
   const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projectsForCreateReport', isAdmin ? 'all' : currentUser?._id],
    queryFn: isAdmin ? projectsAPI.getAllProjects : projectsAPI.getMyAssignedProjects,
    enabled: !!currentUser,
  });
   const projectOptions = useMemo(() => {
    return projectsData?.data?.projects?.map(p => ({ value: p._id, label: p.projectName })) || [];
  }, [projectsData]);


  // Mutation for creating the report
  const mutation = useMutation({
    mutationFn: reportsAPI.createReport,
    onSuccess: (data) => {
      toast.success('Report created successfully!');
      queryClient.invalidateQueries(['reports']); // Invalidate report list cache
      // Optionally redirect to the new report's detail page or the list
      navigate(`/reports/${data.data._id}`); // Redirect to detail view
      // navigate('/reports'); // Or redirect back to the list
    },
    onError: (error) => {
      const errorMsg = error?.message || 'Failed to create report. Please check the details and try again.';
      toast.error(errorMsg);
      // You could potentially parse specific field errors from the backend response here
      // and set them using setFormErrors
      setFormErrors({ submit: errorMsg });
    },
  });

  // --- Event Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear related error on change
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
     if (formErrors.submit) {
       setFormErrors(prev => ({ ...prev, submit: null }));
     }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Report title is required.';
    if (!formData.type) errors.type = 'Please select a report type.';
    if (!formData.project) errors.project = 'Please select the project this report is for.';
    if (!formData.summary.trim()) errors.summary = 'Report summary is required.';
    // Add date validation if needed (e.g., end date after start date)
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.warn('Please fix the errors in the form.');
      return;
    }
    // Optional: Clean up data before sending
    const submissionData = { ...formData };
    if (!submissionData.periodStartDate) delete submissionData.periodStartDate;
    if (!submissionData.periodEndDate) delete submissionData.periodEndDate;

    console.log("Submitting report data:", submissionData);
    mutation.mutate(submissionData);
  };

  // --- Render Form ---
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
            <button
            onClick={() => navigate(-1)} // Go back
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-800"
            >
            <ArrowLeftIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            Back
            </button>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6 inline-flex items-center">
            <DocumentPlusIcon className="h-7 w-7 mr-3 text-indigo-600" />
            Create New Project Report
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 shadow sm:rounded-lg">
            {/* Project Selection */}
            <div>
                <label htmlFor="project" className="block text-sm font-medium text-gray-700">
                    Project <span className="text-red-500">*</span>
                </label>
                <select
                    id="project"
                    name="project"
                    value={formData.project}
                    onChange={handleChange}
                    disabled={isLoadingProjects || mutation.isLoading}
                    required
                    className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border ${formErrors.project ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:bg-gray-100`}
                >
                    <option value="" disabled>-- Select a Project --</option>
                    {projectOptions.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {isLoadingProjects && <span className="text-xs text-gray-500">Loading projects...</span>}
                {formErrors.project && <p className="mt-1 text-xs text-red-600">{formErrors.project}</p>}
            </div>

            {/* Report Title */}
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Report Title <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    disabled={mutation.isLoading}
                    required
                    className={`mt-1 block w-full shadow-sm sm:text-sm ${formErrors.title ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-indigo-500 focus:border-indigo-500`}
                    maxLength={150}
                />
                 {formErrors.title && <p className="mt-1 text-xs text-red-600">{formErrors.title}</p>}
            </div>

            {/* Report Type */}
            <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Report Type <span className="text-red-500">*</span>
                </label>
                <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    disabled={mutation.isLoading}
                    required
                    className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border ${formErrors.type ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md`}
                >
                    {REPORT_TYPES.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {formErrors.type && <p className="mt-1 text-xs text-red-600">{formErrors.type}</p>}
            </div>

             {/* Optional: Report Period */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="periodStartDate" className="block text-sm font-medium text-gray-700">
                        Period Start Date (Optional)
                    </label>
                    <input
                        type="date"
                        id="periodStartDate"
                        name="periodStartDate"
                        value={formData.periodStartDate}
                        onChange={handleChange}
                        disabled={mutation.isLoading}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div>
                     <label htmlFor="periodEndDate" className="block text-sm font-medium text-gray-700">
                        Period End Date (Optional)
                    </label>
                    <input
                        type="date"
                        id="periodEndDate"
                        name="periodEndDate"
                        value={formData.periodEndDate}
                        onChange={handleChange}
                        disabled={mutation.isLoading}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
            </div>


            {/* Summary */}
            <div>
                <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
                    Summary / Description <span className="text-red-500">*</span>
                </label>
                <textarea
                    id="summary"
                    name="summary"
                    rows={5}
                    value={formData.summary}
                    onChange={handleChange}
                    disabled={mutation.isLoading}
                    required
                    className={`mt-1 block w-full shadow-sm sm:text-sm ${formErrors.summary ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-indigo-500 focus:border-indigo-500`}
                />
                {formErrors.summary && <p className="mt-1 text-xs text-red-600">{formErrors.summary}</p>}
            </div>

            {/* Placeholder for Issues/Risks & Attachments - Add UI later */}
            {/* <div>... UI for adding issues ...</div> */}
            {/* <div>... UI for uploading attachments ...</div> */}

            {/* Submission Error */}
             {formErrors.submit && (
                <div className="rounded-md bg-red-50 p-3">
                    <div className="flex">
                        <div className="flex-shrink-0">
                        <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Submission Error</h3>
                        <div className="mt-1 text-sm text-red-700">
                            <p>{formErrors.submit}</p>
                        </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 border-t pt-5">
                <Link
                    to="/reports" // Link back to the list
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Cancel
                </Link>
                <button
                    type="submit"
                    disabled={mutation.isLoading || isLoadingProjects}
                    className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {mutation.isLoading ? (
                        <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                    ) : (
                       <DocumentPlusIcon className="h-5 w-5 mr-2" />
                    )}
                    {mutation.isLoading ? 'Submitting...' : 'Create Report'}
                </button>
            </div>
        </form>
    </div>
  );
};

export default CreateReportPage;