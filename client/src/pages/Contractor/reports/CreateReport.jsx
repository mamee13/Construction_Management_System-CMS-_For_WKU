



/* eslint-disable */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import {
  ArrowPathIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  PaperClipIcon,
  XMarkIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CalendarDaysIcon, // Keep if needed elsewhere, maybe remove if only for dates
} from "@heroicons/react/24/outline";
import authAPI from "../../../api/auth";
import reportsAPI from "../../../api/reports";
import projectsAPI from "../../../api/projects";

// --- Constants ---
const REPORT_TYPES = [
  { value: 'progress', label: 'Progress Report' },
  { value: 'monthly_progress', label: 'Monthly Progress Report' },
  { value: 'weekly_progress', label: 'Weekly Progress Report' },
  { value: 'custom', label: 'Custom Report' },
  { value: 'daily_log', label: 'Daily Log' },
  { value: 'material_usage', label: 'Material Usage Report' },
  { value: 'schedule_adherence', label: 'Schedule Adherence Report' },
  { value: 'issue_summary', label: 'Issue Summary' },
];
const TYPES_REQUIRING_DATES = [
  "progress",
  "monthly_progress",
  "weekly_progress",
  "daily_log",
  "schedule_adherence",
];
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

// Project statuses that should NOT appear in the dropdown
const EXCLUDED_PROJECT_STATUSES = ['completed', 'on_hold', 'cancelled'];

// --- Helper Function for Date Formatting ---
const formatDateForDisplay = (date) => {
  if (!date) return 'N/A';
  try {
    // Use 'en-CA' for YYYY-MM-DD format consistent with input type="date"
    return new Date(date).toLocaleDateString('en-CA');
  } catch (e) {
    console.error("Invalid date passed to formatDateForDisplay:", date, e);
    return 'Invalid Date';
  }
};

// --- Validation Schema ---
const getValidationSchema = (availableProjects) => {
  return Yup.object({
    title: Yup.string().required("Title is required").max(150, "Title too long"),
    project: Yup.string().required("Project selection is required"),
    type: Yup.string()
      .required("Report type is required")
      .oneOf(REPORT_TYPES.map(rt => rt.value)),
    summary: Yup.string().required("Summary is required").min(20, "Summary too short"),
    periodStartDate: Yup.date().when("type", {
      is: (type) => TYPES_REQUIRING_DATES.includes(type),
      then: (schema) =>
        schema
          .required("Start date is required")
          .nullable()
          .test(
            "project-timeframe-start",
            "Start date out of project range",
            function (value) {
              const { project: selectedProjectId } = this.parent;
              if (!value || !selectedProjectId) return true; // Don't validate if no date or project selected
              const selectedProject = availableProjects.find(p => p._id === selectedProjectId);
              // If project not found in the (already filtered) list or has no dates, validation passes (handled by project selection)
              if (!selectedProject?.startDate || !selectedProject?.endDate) return true;

              const startDate = new Date(value); startDate.setHours(0,0,0,0);
              const projStart = new Date(selectedProject.startDate); projStart.setHours(0,0,0,0);
              const projEnd = new Date(selectedProject.endDate); projEnd.setHours(0,0,0,0);

              if (startDate < projStart || startDate > projEnd) {
                return this.createError({
                  message: `Start date must be within project range: ${formatDateForDisplay(projStart)} - ${formatDateForDisplay(projEnd)}`,
                });
              }
              return true;
            }
          ),
      otherwise: (schema) => schema.optional().nullable(),
    }),
    periodEndDate: Yup.date().when("type", {
      is: (type) => TYPES_REQUIRING_DATES.includes(type),
      then: (schema) =>
        schema
          .required("End date is required")
          .nullable()
          .min(Yup.ref("periodStartDate"), "End date must be after start date")
          .test(
            "project-timeframe-and-span",
            "End date/span validation failed",
            function (value) {
              const { project: selectedProjectId, periodStartDate: startDateValue, type: reportType } = this.parent;
              if (!value || !startDateValue || !selectedProjectId) return true; // Don't validate incomplete data
              const selectedProject = availableProjects.find(p => p._id === selectedProjectId);
              if (!selectedProject?.startDate || !selectedProject?.endDate) return true; // Project data check

              const endDate = new Date(value); endDate.setHours(0,0,0,0);
              const startDate = new Date(startDateValue); startDate.setHours(0,0,0,0);
              const projStart = new Date(selectedProject.startDate); projStart.setHours(0,0,0,0);
              const projEnd = new Date(selectedProject.endDate); projEnd.setHours(0,0,0,0);

              // Check if end date is within project range
              if (endDate < projStart || endDate > projEnd) {
                return this.createError({
                  message: `End date must be within project range: ${formatDateForDisplay(projStart)} - ${formatDateForDisplay(projEnd)}`,
                });
              }

              // Check date span based on report type
              const diffTime = Math.abs(endDate - startDate);
              // +1 to include both start and end days in the count
              const diffDays = Math.ceil(diffTime / MILLISECONDS_PER_DAY) + 1;

              if (reportType === 'monthly_progress' && (diffDays < 20 || diffDays > 40)) {
                return this.createError({
                  message: `Monthly reports require a 20-40 day span (${diffDays} days selected)`,
                });
              }
              if (reportType === 'weekly_progress' && (diffDays < 5 || diffDays > 10)) {
                return this.createError({
                  message: `Weekly reports require a 5-10 day span (${diffDays} days selected)`,
                });
              }
              // Add check for daily_log if needed (e.g., must be 1 day)
              // if (reportType === 'daily_log' && diffDays !== 1) { ... }

              return true; // All checks passed
            }
          ),
      otherwise: (schema) => schema.optional().nullable(),
    }),
    newIssue: Yup.string(), // Optional field for adding new issue
    newSeverity: Yup.string().when('newIssue', {
      is: (val) => !!val?.trim(), // Require severity only if newIssue has text
      then: (schema) => schema.required('Severity required when adding an issue').oneOf(['low', 'medium', 'high']),
      otherwise: (schema) => schema.notRequired(), // Not required if newIssue is empty
    }),
  });
};

const initialValues = {
  title: "",
  project: "",
  type: "progress", // Default type
  summary: "",
  periodStartDate: "",
  periodEndDate: "",
  issuesAndRisks: [], // Start with empty array
  attachments: [], // Will hold File objects in state, not directly in Formik
  newIssue: "",
  newSeverity: "medium", // Default severity for new issue
};

const CreateReportForContractor = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const currentUser = authAPI.getCurrentUser();
  const [selectedProjectDates, setSelectedProjectDates] = useState({ start: null, end: null });

  // --- Authorization Check ---
  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      navigate("/login", { replace: true });
      toast.info("Please log in.", { autoClose: 3000 });
      return;
    }
    if (!currentUser || currentUser.role !== "contractor") {
      toast.warn("Access Denied. Only contractors can submit reports.", { autoClose: 3000 });
      navigate("/dashboard", { replace: true });
    }
  }, [currentUser, navigate]);

  // --- Fetch Assigned Projects ---
  const {
    data: projects, // Renamed from projectsResponse for clarity
    isLoading: isLoadingProjects,
    isError: isProjectsError,
    error: projectsError,
  } = useQuery({
    queryKey: ["contractor-assigned-projects-filtered", currentUser?._id], // Updated key
    queryFn: () => projectsAPI.getMyAssignedProjects(),
    enabled: !!currentUser?._id && currentUser.role === 'contractor', // Only enable if user exists and is contractor
    staleTime: 15 * 60 * 1000, // 15 minutes
    select: (data) => {
      // Process and filter the projects within the select function
      const activeProjects =
        data?.data?.projects
          ?.map((p) => ({
            ...p,
            // Ensure dates are Date objects for easier handling later
            startDate: p.startDate ? new Date(p.startDate) : null,
            endDate: p.endDate ? new Date(p.endDate) : null,
            // Ensure status is lowercase for consistent comparison
            status: p.status?.toLowerCase(),
          }))
          // Filter 1: Keep only projects with valid start and end dates
          .filter((p) => p.startDate && p.endDate)
          // Filter 2: Keep only projects whose status is NOT in the excluded list
          .filter((p) => p.status && !EXCLUDED_PROJECT_STATUSES.includes(p.status))
          || []; // Default to an empty array if API data is missing or malformed

      return activeProjects; // Return the filtered list
    },
  });
  // Removed the separate projects variable, 'projects' from useQuery is now the filtered list.

  // --- File Handling ---
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (selectedFiles.length + files.length > 5) {
      toast.error("Maximum 5 files allowed.");
      return;
    }
    // Prevent duplicates based on name and size
    const newFiles = files.filter(
      (file) =>
        !selectedFiles.some(
          (sf) => sf.name === file.name && sf.size === file.size
        )
    );
    setSelectedFiles((prevFiles) => [...prevFiles, ...newFiles]);
    // Clear the file input value to allow selecting the same file again if removed
    event.target.value = null;
  };
  const handleRemoveFile = (index) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  // --- Create Report Mutation ---
  const createReportMutation = useMutation({
    mutationFn: (reportData) => reportsAPI.createReport(reportData), // Assumes createReport handles FormData internally
    onSuccess: (data) => {
      toast.success(`Report "${data?.data?.report?.title || "New Report"}" submitted successfully`);
      // Invalidate queries to refetch relevant data
      queryClient.invalidateQueries({ queryKey: ["contractor-reports"] }); // Refetch contractor's reports list
      queryClient.invalidateQueries({ queryKey: ["reports"] }); // Refetch general reports list if needed elsewhere
      navigate("/contractor-reports"); // Navigate back to the list view
    },
    onError: (error) => {
      console.error("Report creation error:", error);
      const message =
        error?.response?.data?.message || // Try to get backend error message
        error?.message || // Fallback to generic error message
        "Failed to submit report due to an unexpected error.";
      toast.error(message);
    },
  });

  // --- Update selected project dates when project changes ---
  const handleProjectChange = (e, setFieldValue, availableProjects) => {
    const projectId = e.target.value;
    setFieldValue("project", projectId); // Update Formik state

    // Find the selected project from the (already filtered) list
    const selectedProj = availableProjects.find((p) => p._id === projectId);
    if (selectedProj) {
        // Update local state to display project dates hint
      setSelectedProjectDates({ start: selectedProj.startDate, end: selectedProj.endDate });
      // Reset date fields if they might be invalid for the new project? (Optional, depends on desired UX)
      // setFieldValue("periodStartDate", "");
      // setFieldValue("periodEndDate", "");
    } else {
      // Reset dates if project is deselected or not found (shouldn't happen with required field)
      setSelectedProjectDates({ start: null, end: null });
      setFieldValue("periodStartDate", "");
      setFieldValue("periodEndDate", "");
    }
  };

  // --- Type Change Handler ---
  const handleTypeChange = (e, setFieldValue, values) => {
    const newType = e.target.value;
    setFieldValue("type", newType);
    // If the new type doesn't require dates, clear the date fields
    if (!TYPES_REQUIRING_DATES.includes(newType)) {
      setFieldValue("periodStartDate", "");
      setFieldValue("periodEndDate", "");
    }
    // If changing TO a type requiring dates, might want to trigger validation or leave fields empty
  };

  // --- Handle Form Submission ---
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setSubmitting(true); // Indicate submission is in progress

    // Build the report data payload
    const reportData = {
      title: values.title.trim(),
      project: values.project, // Project ID
      type: values.type,
      summary: values.summary.trim(),
      // Stringify issues/risks array for backend (if backend expects JSON string)
      // Adjust if backend expects an array of objects directly
      issuesAndRisks: JSON.stringify(values.issuesAndRisks),
      attachments: selectedFiles, // Pass the array of File objects
    };

    // Conditionally add dates in ISO format if required by report type
    if (TYPES_REQUIRING_DATES.includes(values.type)) {
      if (values.periodStartDate) {
        // Ensure date is treated as local date then converted to ISO string
        const startDate = new Date(values.periodStartDate);
        // Adjust for timezone offset to keep the date part correct
        startDate.setMinutes(startDate.getMinutes() - startDate.getTimezoneOffset());
        reportData.periodStartDate = startDate.toISOString();
      }
      if (values.periodEndDate) {
        const endDate = new Date(values.periodEndDate);
        endDate.setMinutes(endDate.getMinutes() - endDate.getTimezoneOffset());
        reportData.periodEndDate = endDate.toISOString();
      }
    }

    // Call the mutation to create the report
    createReportMutation.mutate(reportData, {
      onSettled: () => {
        setSubmitting(false); // Reset submission state regardless of outcome
      },
      // onSuccess and onError are handled by the mutation definition
    });
  };

  // --- Issue Handling Logic ---
  const handleAddIssue = (values, setFieldValue) => {
    const description = values.newIssue.trim();
    const severity = values.newSeverity;

    if (!description) {
      toast.info("Please enter an issue description before adding.");
      return;
    }
    // Severity validation is handled by Yup, but double-check here if needed
    if (!severity) {
      toast.info("Please select a severity for the issue.");
      return;
    }

    // Check for duplicate descriptions (case-insensitive check might be better)
    if (values.issuesAndRisks.some(
        (issue) => issue.description.toLowerCase() === description.toLowerCase()
    )) {
      toast.warn("This issue description has already been added.");
      return;
    }

    // Add the new issue to the Formik array
    setFieldValue("issuesAndRisks", [
      ...values.issuesAndRisks,
      { description, severity },
    ]);

    // Clear the input fields for the next issue
    setFieldValue("newIssue", "");
    setFieldValue("newSeverity", "medium"); // Reset severity to default
  };

  const handleRemoveIssue = (indexToRemove, values, setFieldValue) => {
    setFieldValue(
      "issuesAndRisks",
      values.issuesAndRisks.filter((_, index) => index !== indexToRemove)
    );
  };

  // Initialize validation schema with the potentially empty initial project list
  // It will effectively use the fetched 'projects' once available because Formik re-validates
  const validationSchema = getValidationSchema(projects || []);

  // --- Render Logic ---
  if (!currentUser) {
    // Should be handled by useEffect redirect, but good as a fallback
    return <div className="p-4 text-center">Authorizing...</div>;
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold leading-tight text-gray-900">Submit New Report</h1>
          <p className="mt-1 text-sm text-gray-500">Complete the details below for an active project.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/contractor-reports")}
          className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2 text-gray-500" />
          Back to Reports
        </button>
      </div>

      {/* Projects Loading/Error/Empty States */}
      {isLoadingProjects && (
        <div className="text-center py-6">
          <ArrowPathIcon className="h-6 w-6 text-indigo-500 animate-spin inline-block mr-2" />
          Loading your assigned projects...
        </div>
      )}
      {isProjectsError && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md relative mb-6 shadow-sm"
          role="alert"
        >
          <strong className="font-bold">Error Loading Projects: </strong>
          <span className="block sm:inline">
            {projectsError?.response?.data?.message || projectsError?.message || "Could not fetch assigned projects."}
          </span>
        </div>
      )}
      {/* Check after loading and no error, if the *filtered* projects list is empty */}
      {!isLoadingProjects && !isProjectsError && (!projects || projects.length === 0) && (
        <div
          className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md relative mb-6 shadow-sm"
          role="alert"
        >
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 inline-block mr-2" />
          <strong className="font-bold">No Active Projects Available: </strong>
          <span className="block sm:inline">
            You must be assigned to active projects (not completed, on hold, or cancelled) with defined start/end dates to submit reports. Please contact an administrator if you believe this is incorrect.
          </span>
        </div>
      )}

      {/* Form Section - Only render if projects are loaded successfully */}
      {/* The fieldset disable handles cases where projects is empty after filtering */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          validateOnChange={true} // Validate fields as they change
          validateOnBlur={true}  // Validate fields when they lose focus
          enableReinitialize // Allows Formik to reset if initialValues change (e.g., projects load)
        >
          {({ errors, touched, values, setFieldValue, dirty, isValid, isSubmitting }) => (
            <Form>
              {/* Disable the entire form if submitting, loading, or no valid projects exist */}
              <fieldset
                disabled={isSubmitting || isLoadingProjects || !projects || projects.length === 0}
                className="divide-y divide-gray-200"
              >
                {/* Section 1: Core Details */}
                <div className="px-4 py-5 sm:p-6">
                  <legend className="text-lg font-medium text-gray-900 mb-4">Report Information</legend>
                  <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                    {/* Title */}
                    <div className="sm:col-span-6">
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        Report Title <span className="text-red-500">*</span>
                      </label>
                      <Field
                        name="title"
                        id="title"
                        type="text"
                        placeholder="e.g., Weekly Progress - Phase 1 Concrete Pour"
                        className={`block w-full shadow-sm sm:text-sm rounded-md ${
                          touched.title && errors.title
                            ? "border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500" // Added ring for better visibility
                            : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                        }`}
                        aria-invalid={touched.title && !!errors.title}
                        aria-describedby={touched.title && errors.title ? "title-error" : undefined}
                      />
                      <ErrorMessage name="title" id="title-error" component="p" className="mt-1 text-sm text-red-600" />
                    </div>

                    {/* Project Dropdown */}
                    <div className="sm:col-span-3">
                      <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">
                        Project <span className="text-red-500">*</span>
                      </label>
                      <Field
                        as="select"
                        name="project"
                        id="project"
                        // Pass the filtered projects list to the change handler
                        onChange={(e) => handleProjectChange(e, setFieldValue, projects)}
                        className={`block w-full shadow-sm sm:text-sm rounded-md py-2 pl-3 pr-10 ${
                          touched.project && errors.project
                            ? "border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                        } ${isLoadingProjects || !projects || projects.length === 0 ? "bg-gray-100 cursor-not-allowed" : ""}`}
                        aria-invalid={touched.project && !!errors.project}
                        aria-describedby={touched.project && errors.project ? "project-error" : undefined}
                      >
                        <option value="" disabled={isLoadingProjects || !projects || projects.length === 0}>
                          {isLoadingProjects ? "Loading Projects..." : (!projects || projects.length === 0) ? "No Active Projects Found" : "-- Select Project --"}
                        </option>
                        {/* Map over the filtered projects list */}
                        {projects && projects.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.projectName} {/* Assuming project object has projectName */}
                          </option>
                        ))}
                      </Field>
                      <ErrorMessage name="project" id="project-error" component="p" className="mt-1 text-sm text-red-600" />
                      {/* Display project date range hint */}
                      {selectedProjectDates.start && selectedProjectDates.end && (
                        <p className="mt-1 text-xs text-gray-500 flex items-center">
                          <InformationCircleIcon className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0" />
                          <span>Project runs: {formatDateForDisplay(selectedProjectDates.start)} to {formatDateForDisplay(selectedProjectDates.end)}</span>
                        </p>
                      )}
                    </div>

                    {/* Report Type Dropdown */}
                    <div className="sm:col-span-3">
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                        Report Type <span className="text-red-500">*</span>
                      </label>
                      <Field
                        as="select"
                        name="type"
                        id="type"
                        onChange={(e) => handleTypeChange(e, setFieldValue, values)}
                        className={`block w-full shadow-sm sm:text-sm rounded-md py-2 pl-3 pr-10 ${
                          touched.type && errors.type
                            ? "border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                        }`}
                        aria-invalid={touched.type && !!errors.type}
                        aria-describedby={touched.type && errors.type ? "type-error" : undefined}
                      >
                        {REPORT_TYPES.map((rt) => (
                          <option key={rt.value} value={rt.value}>
                            {rt.label}
                          </option>
                        ))}
                      </Field>
                      <ErrorMessage name="type" id="type-error" component="p" className="mt-1 text-sm text-red-600" />
                    </div>

                    {/* Conditional Period Dates - Render based on selected type */}
                    {TYPES_REQUIRING_DATES.includes(values.type) && (
                      <>
                        {/* Start Date */}
                        <div className="sm:col-span-3">
                          <label htmlFor="periodStartDate" className="block text-sm font-medium text-gray-700 mb-1">
                            Period Start Date <span className="text-red-500">*</span>
                          </label>
                          <Field
                            name="periodStartDate"
                            id="periodStartDate"
                            type="date"
                            // Disable if no project is selected
                            disabled={!values.project}
                            className={`block w-full shadow-sm sm:text-sm rounded-md ${
                              touched.periodStartDate && errors.periodStartDate
                                ? "border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500"
                                : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                            } ${!values.project ? "bg-gray-100 cursor-not-allowed" : ""}`}
                            aria-invalid={touched.periodStartDate && !!errors.periodStartDate}
                            aria-describedby={touched.periodStartDate && errors.periodStartDate ? "periodStartDate-error" : (selectedProjectDates.start ? "periodStartDate-hint" : undefined)}
                            // Set min/max based on selected project dates if available
                            min={selectedProjectDates.start ? formatDateForDisplay(selectedProjectDates.start) : undefined}
                            max={selectedProjectDates.end ? formatDateForDisplay(selectedProjectDates.end) : undefined}
                          />
                          <ErrorMessage name="periodStartDate" id="periodStartDate-error" component="p" className="mt-1 text-sm text-red-600" />
                          {/* Hint about project start date */}
                          {/* {!errors.periodStartDate && selectedProjectDates.start && (
                             <p id="periodStartDate-hint" className="mt-1 text-xs text-gray-500">
                               Min: {formatDateForDisplay(selectedProjectDates.start)}.
                             </p>
                          )} */}
                        </div>

                        {/* End Date */}
                        <div className="sm:col-span-3">
                          <label htmlFor="periodEndDate" className="block text-sm font-medium text-gray-700 mb-1">
                            Period End Date <span className="text-red-500">*</span>
                          </label>
                          <Field
                            name="periodEndDate"
                            id="periodEndDate"
                            type="date"
                            // Disable if start date or project not selected
                            disabled={!values.periodStartDate || !values.project}
                            className={`block w-full shadow-sm sm:text-sm rounded-md ${
                              touched.periodEndDate && errors.periodEndDate
                                ? "border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500"
                                : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                            } ${!values.periodStartDate || !values.project ? "bg-gray-100 cursor-not-allowed" : ""}`}
                            aria-invalid={touched.periodEndDate && !!errors.periodEndDate}
                            aria-describedby={touched.periodEndDate && errors.periodEndDate ? "periodEndDate-error" : (selectedProjectDates.end ? "periodEndDate-hint" : undefined)}
                            // Dynamic min based on start date, max based on project end date
                            min={values.periodStartDate || (selectedProjectDates.start ? formatDateForDisplay(selectedProjectDates.start) : undefined)}
                            max={selectedProjectDates.end ? formatDateForDisplay(selectedProjectDates.end) : undefined}
                          />
                          <ErrorMessage name="periodEndDate" id="periodEndDate-error" component="p" className="mt-1 text-sm text-red-600" />
                           {/* Hint about date span requirements */}
                          {!errors.periodEndDate && (values.type === 'monthly_progress' || values.type === 'weekly_progress') && (
                              <p id="periodEndDate-hint" className="mt-1 text-xs text-gray-500">
                                  {values.type === 'monthly_progress' && 'Requires 20-40 day span. '}
                                  {values.type === 'weekly_progress' && 'Requires 5-10 day span. '}
                                  {/* {selectedProjectDates.end && `Max: ${formatDateForDisplay(selectedProjectDates.end)}.`} */}
                              </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Section 2: Summary */}
                <div className="px-4 py-5 sm:p-6">
                  <label htmlFor="summary" className="block text-lg font-medium text-gray-900 mb-2">
                    Summary / Details <span className="text-red-500">*</span>
                  </label>
                  <Field
                    as="textarea"
                    name="summary"
                    id="summary"
                    rows={6}
                    placeholder="Provide a detailed summary of activities, progress, observations, milestones achieved, resources used, etc."
                    className={`block w-full shadow-sm sm:text-sm rounded-md ${
                      touched.summary && errors.summary
                        ? "border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    }`}
                    aria-invalid={touched.summary && !!errors.summary}
                    aria-describedby={touched.summary && errors.summary ? "summary-error" : "summary-description"}
                  />
                  <ErrorMessage name="summary" id="summary-error" component="p" className="mt-1 text-sm text-red-600" />
                  <p id="summary-description" className="mt-2 text-sm text-gray-500">
                    Minimum 20 characters. Be specific and informative.
                  </p>
                </div>

                {/* Section 3: Issues and Risks */}
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Identified Issues and Risks (Optional)</h3>
                  {/* Input group for adding new issues */}
                  <div className="space-y-3 sm:flex sm:items-end sm:space-y-0 sm:gap-x-3 mb-4">
                    <div className="flex-grow">
                      <label htmlFor="newIssue" className="block text-sm font-medium text-gray-700 sr-only">
                        Add Issue/Risk Description
                      </label>
                      <Field
                        name="newIssue"
                        id="newIssue"
                        type="text"
                        placeholder="Describe a new issue or potential risk..."
                        className={`block w-full shadow-sm sm:text-sm rounded-md ${
                          touched.newIssue && errors.newIssue // Error styling only applies if field is touched
                            ? "border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                        }`}
                        aria-describedby="newIssue-error"
                      />
                      <ErrorMessage name="newIssue" id="newIssue-error" component="p" className="text-sm text-red-600 mt-1" />
                    </div>
                    <div className="w-full sm:w-36 flex-shrink-0">
                      <label htmlFor="newSeverity" className="block text-sm font-medium text-gray-700 sr-only">
                        Severity
                      </label>
                      <Field
                        as="select"
                        name="newSeverity"
                        id="newSeverity"
                        // Disable severity if no issue text entered
                        disabled={!values.newIssue.trim()}
                        className={`block w-full shadow-sm sm:text-sm rounded-md py-2 pl-3 pr-10 ${
                          // Error styling only if touched AND there's an error AND there is text in newIssue
                          touched.newSeverity && errors.newSeverity && values.newIssue.trim()
                            ? "border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                        } ${!values.newIssue.trim() ? "bg-gray-100 cursor-not-allowed" : ""}`}
                         aria-describedby="newSeverity-error"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </Field>
                       {/* Show severity error only if there's text in the issue field */}
                       {values.newIssue.trim() && <ErrorMessage name="newSeverity" id="newSeverity-error" component="p" className="text-sm text-red-600 mt-1" />}
                    </div>
                    <div className="flex-shrink-0 pt-1 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => handleAddIssue(values, setFieldValue)}
                        className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                        // Disable if issue text is empty OR if there's a severity error (meaning text exists but severity is invalid)
                        disabled={!values.newIssue.trim() || (!!errors.newSeverity && values.newIssue.trim())}
                      >
                        <PlusIcon className="h-5 w-5 mr-1" /> Add Issue
                      </button>
                    </div>
                  </div>

                  {/* List of added issues */}
                  {values.issuesAndRisks.length > 0 ? (
                    <div className="mt-4 border border-gray-200 rounded-md shadow-sm">
                      <ul role="list" className="divide-y divide-gray-200">
                        {values.issuesAndRisks.map((issue, index) => (
                          <li key={index} className="flex items-center justify-between py-3 pl-4 pr-3 text-sm hover:bg-gray-50 transition-colors">
                            <div className="flex-1 flex items-center min-w-0">
                              {/* Severity Badge */}
                              <span
                                className={`flex-shrink-0 px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full mr-3 capitalize ${
                                  issue.severity === "high"
                                    ? "bg-red-100 text-red-800 border border-red-200"
                                    : issue.severity === "medium"
                                    ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                    : "bg-green-100 text-green-800 border border-green-200" // Low severity
                                }`}
                              >
                                {issue.severity}
                              </span>
                              {/* Issue Description */}
                              <span className="flex-1 w-0 truncate" title={issue.description}>
                                {issue.description}
                              </span>
                            </div>
                            {/* Remove Button */}
                            <div className="ml-4 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => handleRemoveIssue(index, values, setFieldValue)}
                                className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                                title={`Remove issue: ${issue.description}`}
                              >
                                <span className="sr-only">Remove issue</span>
                                <XMarkIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-2 italic">
                      No issues or risks have been added to this report yet.
                    </p>
                  )}
                </div>

                {/* Section 4: Attachments */}
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Attachments (Optional)</h3>
                  <div>
                    <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 sr-only">
                      Attach Files
                    </label>
                    {/* Dropzone Area */}
                    <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${isSubmitting ? "bg-gray-100 border-gray-200" : "border-gray-300 hover:border-indigo-400"}`}>
                      <div className="space-y-1 text-center">
                        <PaperClipIcon className="mx-auto h-10 w-10 text-gray-400" />
                        <div className="flex text-sm text-gray-600 justify-center">
                          <label
                            htmlFor="file-upload"
                            className={`relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <span>Upload files</span>
                            <input
                              id="file-upload"
                              name="attachments" // Ensure name matches if needed by backend directly
                              type="file"
                              className="sr-only"
                              multiple // Allow multiple file selection
                              onChange={handleFileChange}
                              disabled={isSubmitting || selectedFiles.length >= 5} // Disable if max files reached
                              // Consider adding 'accept' attribute for specific file types
                              // accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.txt"
                            />
                          </label>
                          <p className="pl-1 hidden sm:inline">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          Up to 5 files. Max size per file: 10MB (example).
                          {/* Add specific allowed types if known: PDF, PNG, JPG, DOCX, XLSX etc. */}
                        </p>
                      </div>
                    </div>
                    {/* List of selected files */}
                    {selectedFiles.length > 0 && (
                      <div className="mt-4 border border-gray-200 rounded-md shadow-sm">
                        <h4 className="sr-only">Files selected for upload</h4>
                        <ul role="list" className="divide-y divide-gray-200">
                          {selectedFiles.map((file, index) => (
                            <li key={`${file.name}-${file.lastModified}`} className="flex items-center justify-between py-3 pl-4 pr-3 text-sm hover:bg-gray-50 transition-colors">
                              <div className="flex-1 flex items-center min-w-0">
                                <PaperClipIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" aria-hidden="true" />
                                <span className="flex-1 w-0 truncate font-medium" title={file.name}>
                                  {file.name}
                                </span>
                                <span className="text-gray-500 ml-2 flex-shrink-0">
                                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                              </div>
                              <div className="ml-4 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(index)}
                                  className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                                  title={`Remove file: ${file.name}`}
                                  disabled={isSubmitting} // Disable remove button during submission
                                >
                                   <span className="sr-only">Remove file</span>
                                  <XMarkIcon className="h-5 w-5" />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                         {selectedFiles.length >= 5 && (
                           <p className="text-xs text-center text-yellow-700 bg-yellow-50 py-1 border-t border-gray-200">Maximum 5 files reached.</p>
                         )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Actions Footer */}
                <div className="px-4 py-4 sm:px-6 flex justify-end items-center space-x-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
                  {/* Cancel Button */}
                  <button
                    type="button"
                    onClick={() => navigate("/contractor-reports")}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    disabled={isSubmitting} // Disable cancel during submission
                  >
                    Cancel
                  </button>
                  {/* Submit Button */}
                  <button
                    type="submit"
                    // Disable if submitting, form is pristine (no changes), form is invalid, projects are loading, or no projects available
                    disabled={isSubmitting || !dirty || !isValid || isLoadingProjects || !projects || projects.length === 0}
                    className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" aria-hidden="true" />
                        Submitting Report...
                      </>
                    ) : (
                      <>
                        <DocumentTextIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                        Submit Report
                      </>
                    )}
                  </button>
                </div>
              </fieldset>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default CreateReportForContractor;