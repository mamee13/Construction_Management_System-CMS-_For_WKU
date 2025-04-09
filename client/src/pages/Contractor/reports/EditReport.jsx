import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ArrowLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import authAPI from '../../../api/auth';
import reportsAPI from '../../../api/reports';

const EditReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = authAPI.getCurrentUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch the report to edit
  const {
    data: reportData,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ['report', id],
    queryFn: () => reportsAPI.getReportById(id),
    onSuccess: (data) => {
      // Check if the report is not pending, navigate back if so
      if (data?.data?.status !== 'pending') {
        toast.error('Only pending reports can be edited');
        navigate('/contractor-reports');
      }
      
      // Populate form with existing report data
      if (data?.data) {
        formik.setValues({
          title: data.data.title || '',
          project: data.data.project?._id || data.data.project || '',
          reportType: data.data.reportType || 'progress',
          content: data.data.content || '',
          progressPercentage: data.data.progressPercentage || '',
          budget: data.data.budget || '',
        });
      }
    },
    onError: () => {
      toast.error('Failed to load report details');
      navigate('/contractor-reports');
    },
  });

  const report = reportData?.data;

  // Update report mutation
  const updateReportMutation = useMutation({
    mutationFn: (reportData) => reportsAPI.updateReport(id, reportData),
    onSuccess: () => {
      toast.success('Report updated successfully');
      navigate(`/contractor-reports/${id}`);
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast.error(error.message || 'Failed to update report');
    },
  });

  // Check if user is authorized to edit this report
  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (currentUser?.role !== 'contractor') {
      navigate('/dashboard');
      return;
    }

    // If we have report data, check if this contractor created this report
    if (report && currentUser) {
      if (report.user?._id !== currentUser._id) {
        toast.error('You can only edit your own reports');
        navigate('/contractor-reports');
      }
    }
  }, [currentUser, navigate, report]);

  // Validation schema
  const validationSchema = Yup.object({
    title: Yup.string()
      .required('Title is required')
      .max(100, 'Title cannot exceed 100 characters'),
    reportType: Yup.string()
      .required('Report type is required'),
    content: Yup.string()
      .required('Content is required')
      .min(10, 'Content must be at least 10 characters'),
    progressPercentage: Yup.number()
      .when('reportType', {
        is: 'progress',
        then: () => Yup.number()
          .required('Progress percentage is required')
          .min(0, 'Progress cannot be negative')
          .max(100, 'Progress cannot exceed 100%'),
        otherwise: () => Yup.number().notRequired(),
      }),
    budget: Yup.number()
      .when('reportType', {
        is: 'financial',
        then: () => Yup.number()
          .required('Budget amount is required')
          .min(0, 'Budget cannot be negative'),
        otherwise: () => Yup.number().notRequired(),
      }),
  });

  // Formik setup
  const formik = useFormik({
    initialValues: {
      title: '',
      project: '',
      reportType: 'progress',
      content: '',
      progressPercentage: '',
      budget: '',
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      setIsSubmitting(true);
      const reportData = {
        title: values.title,
        reportType: values.reportType,
        content: values.content,
      };

      // Add conditional fields based on report type
      if (values.reportType === 'progress') {
        reportData.progressPercentage = values.progressPercentage;
      } else if (values.reportType === 'financial') {
        reportData.budget = values.budget;
      }

      updateReportMutation.mutate(reportData);
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-500">Loading report details...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (fetchError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{fetchError.message || 'Failed to load report details'}</span>
          <div className="mt-4">
            <button
              onClick={() => navigate('/contractor-reports')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Reports
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/contractor-reports/${id}`)}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
          Back to Report
        </button>
      </div>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit Report</h1>
        <p className="mt-1 text-sm text-gray-500">
          Make changes to your report. Note that you can only edit reports that are still in the pending state.
        </p>
      </div>

      {/* Report form */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={formik.handleSubmit}>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Title */}
              <div className="sm:col-span-6">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Report Title *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formik.values.title}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                      formik.touched.title && formik.errors.title ? 'border-red-300' : ''
                    }`}
                    placeholder="e.g., Monthly Progress Report - March 2023"
                  />
                  {formik.touched.title && formik.errors.title && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.title}</p>
                  )}
                </div>
              </div>

              {/* Project (disabled, cannot change project) */}
              <div className="sm:col-span-6">
                <label htmlFor="project" className="block text-sm font-medium text-gray-700">
                  Project
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="project"
                    value={report?.project?.projectName || 'No project assigned'}
                    disabled
                    className="shadow-sm bg-gray-50 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    The project cannot be changed after report creation.
                  </p>
                </div>
              </div>

              {/* Report Type */}
              <div className="sm:col-span-3">
                <label htmlFor="reportType" className="block text-sm font-medium text-gray-700">
                  Report Type *
                </label>
                <div className="mt-1">
                  <select
                    id="reportType"
                    name="reportType"
                    value={formik.values.reportType}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                      formik.touched.reportType && formik.errors.reportType ? 'border-red-300' : ''
                    }`}
                  >
                    <option value="progress">Progress Report</option>
                    <option value="financial">Financial Report</option>
                    <option value="incident">Incident Report</option>
                    <option value="general">General Report</option>
                  </select>
                  {formik.touched.reportType && formik.errors.reportType && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.reportType}</p>
                  )}
                </div>
              </div>

              {/* Progress Percentage - Only show for progress reports */}
              {formik.values.reportType === 'progress' && (
                <div className="sm:col-span-3">
                  <label htmlFor="progressPercentage" className="block text-sm font-medium text-gray-700">
                    Progress Percentage (%) *
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      id="progressPercentage"
                      name="progressPercentage"
                      value={formik.values.progressPercentage}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                        formik.touched.progressPercentage && formik.errors.progressPercentage ? 'border-red-300' : ''
                      }`}
                      placeholder="e.g., 75"
                      min="0"
                      max="100"
                    />
                    {formik.touched.progressPercentage && formik.errors.progressPercentage && (
                      <p className="mt-1 text-sm text-red-600">{formik.errors.progressPercentage}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Budget - Only show for financial reports */}
              {formik.values.reportType === 'financial' && (
                <div className="sm:col-span-3">
                  <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                    Budget Amount ($) *
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      id="budget"
                      name="budget"
                      value={formik.values.budget}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                        formik.touched.budget && formik.errors.budget ? 'border-red-300' : ''
                      }`}
                      placeholder="e.g., 50000"
                      min="0"
                    />
                    {formik.touched.budget && formik.errors.budget && (
                      <p className="mt-1 text-sm text-red-600">{formik.errors.budget}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="sm:col-span-6">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  Report Content *
                </label>
                <div className="mt-1">
                  <textarea
                    id="content"
                    name="content"
                    rows="8"
                    value={formik.values.content}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                      formik.touched.content && formik.errors.content ? 'border-red-300' : ''
                    }`}
                    placeholder="Provide detailed information about the project status, challenges, achievements, etc."
                  />
                  {formik.touched.content && formik.errors.content && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.content}</p>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Provide clear and detailed information. Include key points, challenges, and recommendations.
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => navigate(`/contractor-reports/${id}`)}
                className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formik.isValid}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditReport; 