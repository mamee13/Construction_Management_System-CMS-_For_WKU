


/* eslint-disable */ // Consider addressing ESLint warnings instead of disabling
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
  InformationCircleIcon, // Added for hints
} from "@heroicons/react/24/outline";
import authAPI from "../../../api/auth"; // Assuming correct path
import reportsAPI from "../../../api/reports"; // Assuming correct path
import projectsAPI from "../../../api/projects"; // Assuming correct path

// --- Constants ---
const REPORT_TYPES = [
    { value: 'progress', label: 'Progress Report' },
    { value: 'monthly_progress', label: 'Monthly Progress Report' },
    { value: 'weekly_progress', label: 'Weekly Progress Report' },
    { value: 'daily_log', label: 'Daily Log' },
    { value: 'material_usage', label: 'Material Usage Report' },
    { value: 'schedule_adherence', label: 'Schedule Adherence Report' },
    { value: 'issue_summary', label: 'Issue Summary' },
    { value: 'financial', label: 'Financial Report' },
    { value: 'custom', label: 'Custom Report' },
];
const TYPES_REQUIRING_DATES = [
  "progress",
  "monthly_progress",
  "weekly_progress",
  "daily_log",
  "schedule_adherence",
];
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
// Define disallowed statuses (case-insensitive comparison recommended)
const DISALLOWED_PROJECT_STATUSES = ['on_hold', 'cancelled']; // ADDED

// --- Helper Function for Date Formatting ---
const formatDateForDisplay = (date) => {
  if (!date) return 'N/A';
  try {
    // Ensure it's a Date object before formatting
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid Date'; // Check if the date is valid
    return dateObj.toLocaleDateString('en-CA'); // YYYY-MM-DD format
  } catch (e) {
    console.error("Error formatting date:", e);
    return 'Invalid Date';
  }
};


// --- Enhanced Validation Schema ---
// The validation schema remains the same as it uses the filtered 'availableProjects'
const getValidationSchema = (availableProjects) => {
  return Yup.object({
    title: Yup.string()
      .required("Title is required")
      .max(150, "Title cannot exceed 150 characters"),
    project: Yup.string()
      .required("Project selection is required"), // Validation will pass if project is selected from the filtered list
    type: Yup.string()
      .required("Report type is required")
      .oneOf(REPORT_TYPES.map(rt => rt.value), "Invalid report type"),
    summary: Yup.string()
      .required("Report summary is required")
      .min(10, "Summary should be at least 10 characters"),
    periodStartDate: Yup.date().when("type", {
      is: (type) => TYPES_REQUIRING_DATES.includes(type),
      then: (schema) =>
        schema
          .required("Start date is required for this report type")
          .nullable()
          .test(
            "project-timeframe-start",
            "Start date out of project range",
            function (value) {
              const { project: selectedProjectId } = this.parent;
              if (!value || !selectedProjectId) return true;
              // availableProjects is already filtered, so we just need to find the selected one
              const selectedProject = availableProjects.find(p => p._id === selectedProjectId);
              if (!selectedProject?.startDate || !selectedProject?.endDate) return true; // Should not happen if project selected

              const startDate = new Date(value); startDate.setHours(0,0,0,0);
              const projStart = new Date(selectedProject.startDate); projStart.setHours(0,0,0,0);
              const projEnd = new Date(selectedProject.endDate); projEnd.setHours(0,0,0,0);

              if (startDate < projStart || startDate > projEnd) {
                return this.createError({
                  message: `Start date must be between ${formatDateForDisplay(projStart)} and ${formatDateForDisplay(projEnd)}`,
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
          .required("End date is required for this report type")
          .nullable()
          .min(Yup.ref("periodStartDate"), "End date must be on or after start date")
          .test(
            "project-timeframe-and-span",
            "End date/span validation failed",
            function (value) {
              const { project: selectedProjectId, periodStartDate: startDateValue, type: reportType } = this.parent;
              if (!value || !startDateValue || !selectedProjectId) return true;
              const selectedProject = availableProjects.find(p => p._id === selectedProjectId);
               if (!selectedProject?.startDate || !selectedProject?.endDate) return true; // Should not happen if project selected

              const endDate = new Date(value); endDate.setHours(0,0,0,0);
              const startDate = new Date(startDateValue); startDate.setHours(0,0,0,0);
              const projStart = new Date(selectedProject.startDate); projStart.setHours(0,0,0,0);
              const projEnd = new Date(selectedProject.endDate); projEnd.setHours(0,0,0,0);

              if (endDate < projStart || endDate > projEnd) {
                return this.createError({
                  message: `End date must be between ${formatDateForDisplay(projStart)} and ${formatDateForDisplay(projEnd)}`,
                });
              }

              const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
               // Calculate difference in days. Add 1 unless start and end are the same day.
              const diffDays = startDate.getTime() === endDate.getTime()
                               ? 1
                               : Math.ceil(diffTime / MILLISECONDS_PER_DAY) + 1;


              if (reportType === 'monthly_progress' && (diffDays < 20 || diffDays > 40)) {
                return this.createError({
                  message: `Monthly reports should span 20-40 days (${diffDays} days selected)`,
                });
              }
              if (reportType === 'weekly_progress' && (diffDays < 5 || diffDays > 10)) {
                 return this.createError({
                  message: `Weekly reports should span 5-10 days (${diffDays} days selected)`,
                });
              }
              return true;
            }
          ),
      otherwise: (schema) => schema.optional().nullable(),
    }),
    newIssue: Yup.string(),
    newSeverity: Yup.string().when("newIssue", {
      is: (val) => val && val.trim().length > 0,
      then: (schema) => schema.required("Severity is required when adding an issue").oneOf(["low", "medium", "high"]),
      otherwise: (schema) => schema.notRequired(),
    }),
  });
};

const initialValues = {
  title: "",
  summary: "",
  project: "",
  type: "progress",
  periodStartDate: "",
  periodEndDate: "",
  issuesAndRisks: [],
  newIssue: "",
  newSeverity: "medium",
};

const CreateReport = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const currentUser = authAPI.getCurrentUser();
  const [selectedProjectDates, setSelectedProjectDates] = useState({ start: null, end: null });

  // --- Authorization Check (remains the same) ---
  useEffect(() => {
    const checkUserRole = () => {
      if (!authAPI.isAuthenticated()) {
        toast.info("Please log in to create reports.");
        navigate("/login", { replace: true });
        return;
      }
      const userRole = currentUser?.role;
      if (userRole !== "consultant") {
        toast.warn("Access denied. Only consultants can create reports.");
        navigate("/dashboard", { replace: true });
      }
    };
    if (currentUser !== undefined) {
      checkUserRole();
    }
  }, [currentUser, navigate]);

  // --- Fetch Assigned Projects for Consultant (with status filtering) ---
  const {
    data: projectsData, // Raw selected data after select function runs
    isLoading: isLoadingProjects,
    isError: isProjectsError,
    error: projectsError,
  } = useQuery({
    // Updated query key to reflect status filtering
    queryKey: ["consultant-assigned-active-projects-with-dates", currentUser?._id],
    queryFn: () => projectsAPI.getProjectsByConsultant(currentUser?._id),
    enabled: !!currentUser?._id && currentUser?.role === "consultant",
    staleTime: 10 * 60 * 1000,
    select: (data) => {
      // Process projects: map dates and filter by date validity AND project status
      const validProjectsForReporting =
        data?.data?.projects
          ?.map((p) => ({
            ...p,
            startDate: p.startDate ? new Date(p.startDate) : null,
            endDate: p.endDate ? new Date(p.endDate) : null,
            // Ensure status is carried over (assuming it exists on the project object 'p')
          }))
          // Filter based on date validity AND active status
          .filter(p => {
            const hasValidDates = p.startDate && p.endDate && !isNaN(p.startDate) && !isNaN(p.endDate);

            // Check if status exists and is NOT in the disallowed list (case-insensitive)
            const isActiveStatus = p.status &&
                                   !DISALLOWED_PROJECT_STATUSES.includes(p.status.toLowerCase());

            return hasValidDates && isActiveStatus;
          })
           || []; // Default to empty array if any part fails
      return validProjectsForReporting; // Return the filtered and processed list
    },
  });

  // Use the processed projects from the query's select function
  // 'availableProjects' now contains only projects with valid dates and allowed statuses
  const availableProjects = projectsData || [];

  // --- File Handling (remains the same) ---
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (selectedFiles.length + files.length > 5) {
      toast.error("You can upload a maximum of 5 files.");
      return;
    }
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
        toast.error(`File(s) exceed 10MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
        return;
    }
    const newFiles = files.filter(
      (file) => !selectedFiles.some((sf) => sf.name === file.name && sf.size === file.size)
    );
    if (newFiles.length !== files.length) {
        toast.info("Duplicate files were ignored.");
    }
    setSelectedFiles((prevFiles) => [...prevFiles, ...newFiles]);
    event.target.value = null;
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  // --- Dynamic Validation Schema ---
  // Pass the already filtered projects to the validation schema factory
  const validationSchema = getValidationSchema(availableProjects);

  // --- Create Report Mutation (update invalidated query key) ---
  const createReportMutation = useMutation({
    mutationFn: (reportData) => reportsAPI.createReport(reportData),
    onSuccess: (data) => {
      toast.success(`Report "${data?.data?.title || "New Report"}" created successfully`);
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["consultant-reports"] });
      // Invalidate the filtered project query
      queryClient.invalidateQueries({ queryKey: ["consultant-assigned-active-projects-with-dates", currentUser?._id]}); // UPDATED
      navigate("/reports");
    },
    onError: (error) => {
      console.error("Report creation error:", error);
      const message = error?.response?.data?.message || error?.message || "Failed to create report. Please check details and try again.";
      toast.error(message);
    },
  });

  // --- Form Submission Handler (remains the same) ---
  const handleSubmit = async (values, { setSubmitting }) => {
    const reportDataToSend = {
      title: values.title.trim(),
      project: values.project,
      type: values.type,
      summary: values.summary.trim(),
      issuesAndRisks: JSON.stringify(values.issuesAndRisks),
      attachments: selectedFiles,
    };

    if (TYPES_REQUIRING_DATES.includes(values.type)) {
        if (values.periodStartDate) {
            try { reportDataToSend.periodStartDate = new Date(values.periodStartDate).toISOString(); }
            catch (e) { console.error("Error converting start date:", e) }
        }
         if (values.periodEndDate) {
            try { reportDataToSend.periodEndDate = new Date(values.periodEndDate).toISOString(); }
            catch (e) { console.error("Error converting end date:", e) }
        }
    }

    console.log("Submitting Report Data:", reportDataToSend);
    createReportMutation.mutate(reportDataToSend, {
      onSettled: () => {
        setSubmitting(false);
      },
    });
  };

  // --- Issue Handling Logic (TYPO FIXED) ---
   const handleAddIssue = (values, setFieldValue) => {
    const description = values.newIssue.trim();
    const severity = values.newSeverity;

    if (!description) {
      toast.info("Please enter an issue description.");
      return;
    }
    const isDuplicate = values.issuesAndRisks.some((issue) => issue.description.toLowerCase() === description.toLowerCase());
    if (isDuplicate) {
      toast.warn("This issue seems to have already been added.");
      return;
    }
    // Add the new issue - TYPO FIXED HERE
    setFieldValue("issuesAndRisks", [...values.issuesAndRisks, { description, severity }]);

    // Reset the input fields
    setFieldValue("newIssue", "");
    setFieldValue("newSeverity", "medium");
  };

  const handleRemoveIssue = (index, values, setFieldValue) => {
    const updatedIssues = values.issuesAndRisks.filter((_, i) => i !== index);
    setFieldValue("issuesAndRisks", updatedIssues);
  };

  // --- Form Field Change Handlers (update handleProjectChange) ---
  const handleTypeChange = (e, setFieldValue, values) => {
    const newType = e.target.value;
    setFieldValue("type", newType);
    const nowRequiresDates = TYPES_REQUIRING_DATES.includes(newType);
    if (!nowRequiresDates) {
      if (values.periodStartDate) setFieldValue("periodStartDate", "");
      if (values.periodEndDate) setFieldValue("periodEndDate", "");
    }
  };

   // Update selected project dates when project changes
  const handleProjectChange = (e, setFieldValue, availableProjects, currentValues) => { // ADDED currentValues
    const projectId = e.target.value;
    setFieldValue("project", projectId);

    const selectedProj = availableProjects.find((p) => p._id === projectId);
    if (selectedProj && selectedProj.startDate && selectedProj.endDate) {
      setSelectedProjectDates({ start: selectedProj.startDate, end: selectedProj.endDate });
    } else {
      setSelectedProjectDates({ start: null, end: null });
    }
     // Manually trigger validation for date fields after project change
     setTimeout(() => {
        // Use currentValues passed from render props
        setFieldValue('periodStartDate', currentValues.periodStartDate, true); // ADDED validation trigger
        setFieldValue('periodEndDate', currentValues.periodEndDate, true);   // ADDED validation trigger
     }, 0);
  };

  // --- Render Logic ---
  // Initial loading state
  if (currentUser === undefined) {
    return <div className="p-4 text-center">Loading user data...</div>;
  }
  // If user is loaded but not allowed (already handled by useEffect)
  if (!currentUser || currentUser.role !== "consultant") {
    return <div className="p-4 text-center">Checking authorization...</div>;
  }

  // --- No Active/Valid Projects Message --- ADDED
  // Specific message if projects loaded but none are suitable for reporting
  const noSuitableProjects = !isLoadingProjects && !isProjectsError && availableProjects.length === 0 && projectsData !== undefined;


  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header (remains the same) */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Create New Report</h1>
          <p className="text-gray-500 text-sm">
             Submit a new report for a project you're consulting on.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/reports")} // Consultant reports list
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Reports
        </button>
      </div>

       {/* Loading/Error/No Projects State */}
      {isLoadingProjects && (
        <div className="text-center py-6">
          <ArrowPathIcon className="h-6 w-6 text-indigo-500 animate-spin inline-block mr-2" />
          Loading projects...
        </div>
      )}
      {isProjectsError && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md relative mb-6 shadow-sm"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">
            {projectsError?.message || "Could not fetch assigned projects."}
          </span>
        </div>
      )}
      {/* Updated message for no suitable projects */}
      {noSuitableProjects && ( // UPDATED condition
         <div
          className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md relative mb-6 shadow-sm"
          role="alert"
        >
          <strong className="font-bold">No Projects Available for Reporting: </strong> {/* UPDATED message */}
          <span className="block sm:inline">
            Cannot create reports. Ensure you are assigned to active projects with valid start/end dates that are not 'On Hold' or 'Cancelled'.
          </span>
        </div>
      )}

      {/* Form Section - Disable if loading or no suitable projects */}
      <div className={`bg-white shadow rounded-lg overflow-hidden ${isLoadingProjects || noSuitableProjects ? 'opacity-50 pointer-events-none' : ''}`}> {/* UPDATED condition */}
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          validateOnChange={true}
          validateOnBlur={true}
        >
          {({ errors, touched, values, setFieldValue, dirty, isValid, isSubmitting }) => (
            <Form>
               {/* Disable fieldset during submission or if no suitable projects */}
               <fieldset disabled={isSubmitting || isLoadingProjects || noSuitableProjects} className="divide-y divide-gray-200"> {/* UPDATED condition */}
                {/* Section 1: Report Details */}
                <div className="px-4 py-5 sm:p-6">
                   <legend className="text-lg font-medium text-gray-900 mb-4">Report Details</legend>
                   <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      {/* Title */}
                      <div className="sm:col-span-6">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                          Report Title <span className="text-red-500">*</span>
                        </label>
                        <Field
                          type="text"
                          name="title"
                          id="title"
                          placeholder="e.g., Weekly Progress - Phase 1 Foundation"
                          className={`block w-full shadow-sm sm:text-sm rounded-md ${
                            touched.title && errors.title
                              ? "border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500"
                              : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                          }`}
                           aria-invalid={touched.title && errors.title ? "true" : "false"}
                           aria-describedby={touched.title && errors.title ? "title-error" : undefined}
                        />
                        <ErrorMessage name="title" id="title-error" component="p" className="mt-1 text-sm text-red-600" />
                      </div>

                      {/* Project */}
                      <div className="sm:col-span-3">
                        <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">
                          Project <span className="text-red-500">*</span>
                        </label>
                        <Field
                          as="select"
                          name="project"
                          id="project"
                          // Pass current form values to the change handler
                          onChange={(e) => handleProjectChange(e, setFieldValue, availableProjects, values)} // UPDATED to pass values
                          className={`block w-full shadow-sm sm:text-sm rounded-md py-2 pl-3 pr-10 ${
                            touched.project && errors.project
                              ? "border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500"
                              : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                          } ${isLoadingProjects || noSuitableProjects ? "bg-gray-100 cursor-not-allowed" : ""}`} // UPDATED condition
                           aria-invalid={touched.project && errors.project ? "true" : "false"}
                           aria-describedby={touched.project && errors.project ? "project-error" : "project-hint"}
                        >
                          <option value="">
                            {/* UPDATED placeholder logic */}
                            {isLoadingProjects ? "Loading..." : noSuitableProjects ? "No Suitable Projects" : "-- Select Project --"}
                          </option>
                          {/* availableProjects is already filtered */}
                          {availableProjects.map((project) => (
                            <option key={project._id} value={project._id}>
                              {project.projectName} ({project.projectCode || "No Code"})
                            </option>
                          ))}
                        </Field>
                        <ErrorMessage name="project" id="project-error" component="p" className="mt-1 text-sm text-red-600" />
                        {/* Hint for project dates */}
                        {selectedProjectDates.start && selectedProjectDates.end && (
                          <p id="project-hint" className="mt-1 text-xs text-gray-500 flex items-center">
                            <InformationCircleIcon className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0" />
                            Project runs: {formatDateForDisplay(selectedProjectDates.start)} to {formatDateForDisplay(selectedProjectDates.end)}
                          </p>
                        )}
                      </div>

                      {/* Report Type */}
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
                           aria-invalid={touched.type && errors.type ? "true" : "false"}
                           aria-describedby={touched.type && errors.type ? "type-error" : undefined}
                        >
                          {REPORT_TYPES.map(rt => (
                              <option key={rt.value} value={rt.value}>{rt.label}</option>
                          ))}
                        </Field>
                        <ErrorMessage name="type" id="type-error" component="p" className="mt-1 text-sm text-red-600" />
                      </div>

                      {/* Conditional Period Dates */}
                      {TYPES_REQUIRING_DATES.includes(values.type) && (
                        <>
                          {/* Period Start Date */}
                          <div className="sm:col-span-3">
                            <label htmlFor="periodStartDate" className="block text-sm font-medium text-gray-700 mb-1">
                              Period Start Date <span className="text-red-500">*</span>
                            </label>
                            <Field
                              type="date"
                              name="periodStartDate"
                              id="periodStartDate"
                               className={`block w-full shadow-sm sm:text-sm rounded-md ${
                                touched.periodStartDate && errors.periodStartDate
                                  ? "border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500"
                                  : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                              }`}
                               aria-invalid={touched.periodStartDate && errors.periodStartDate ? "true" : "false"}
                               aria-describedby={touched.periodStartDate && errors.periodStartDate ? "periodStartDate-error" : "periodStartDate-hint"}
                              // Set max date based on end date if selected OR project end date
                              max={values.periodEndDate || (selectedProjectDates.end ? formatDateForDisplay(selectedProjectDates.end) : undefined)} // UPDATED min/max logic
                              // Set min date based on project start date
                              min={selectedProjectDates.start ? formatDateForDisplay(selectedProjectDates.start) : undefined} // UPDATED min/max logic
                            />
                            <ErrorMessage name="periodStartDate" id="periodStartDate-error" component="p" className="mt-1 text-sm text-red-600" />
                             {!errors.periodStartDate && selectedProjectDates.start && (
                                <p id="periodStartDate-hint" className="mt-1 text-xs text-gray-500">
                                  Must be on or after {formatDateForDisplay(selectedProjectDates.start)}.
                                </p>
                             )}
                          </div>

                          {/* Period End Date */}
                          <div className="sm:col-span-3">
                            <label htmlFor="periodEndDate" className="block text-sm font-medium text-gray-700 mb-1">
                              Period End Date <span className="text-red-500">*</span>
                            </label>
                            <Field
                              type="date"
                              name="periodEndDate"
                              id="periodEndDate"
                               className={`block w-full shadow-sm sm:text-sm rounded-md ${
                                touched.periodEndDate && errors.periodEndDate
                                  ? "border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500"
                                  : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                              }`}
                               aria-invalid={touched.periodEndDate && errors.periodEndDate ? "true" : "false"}
                               aria-describedby={touched.periodEndDate && errors.periodEndDate ? "periodEndDate-error" : "periodEndDate-hint"}
                              // Set min date based on start date OR project start date
                              min={values.periodStartDate || (selectedProjectDates.start ? formatDateForDisplay(selectedProjectDates.start) : undefined)} // UPDATED min/max logic
                              // Set max date based on project end date
                              max={selectedProjectDates.end ? formatDateForDisplay(selectedProjectDates.end) : undefined} // UPDATED min/max logic
                            />
                            <ErrorMessage name="periodEndDate" id="periodEndDate-error" component="p" className="mt-1 text-sm text-red-600" />
                             {!errors.periodEndDate && selectedProjectDates.end && (
                                <p id="periodEndDate-hint" className="mt-1 text-xs text-gray-500">
                                  Must be on or before {formatDateForDisplay(selectedProjectDates.end)}.
                                  {values.type === 'monthly_progress' && ' (20-40 day span)'}
                                  {values.type === 'weekly_progress' && ' (5-10 day span)'}
                                </p>
                             )}
                          </div>
                        </>
                      )}
                   </div>
                </div>

                {/* Section 2: Summary & Content (remains the same) */}
                 <div className="px-4 py-5 sm:p-6">
                   <label htmlFor="summary" className="block text-lg font-medium text-gray-900 mb-2">
                     Summary / Details <span className="text-red-500">*</span>
                   </label>
                   <Field
                     as="textarea"
                     name="summary"
                     id="summary"
                     rows={8}
                     placeholder="Provide a detailed summary of activities, progress, observations, or findings for the reporting period..."
                     className={`block w-full shadow-sm sm:text-sm rounded-md ${
                       touched.summary && errors.summary
                         ? "border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500"
                         : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                     }`}
                     aria-invalid={touched.summary && errors.summary ? "true" : "false"}
                     aria-describedby={touched.summary && errors.summary ? "summary-error" : undefined}
                   />
                   <ErrorMessage name="summary" id="summary-error" component="p" className="mt-1 text-sm text-red-600" />
                   <p className="mt-2 text-sm text-gray-500">
                     Describe key updates, milestones achieved, challenges faced, and next steps.
                   </p>
                 </div>

                {/* Section 3: Issues and Risks (remains the same) */}
                <div className="px-4 py-5 sm:p-6">
                   <h3 className="text-lg font-medium text-gray-900 mb-4">Issues and Risks</h3>
                   {/* Input fields for adding new issue */}
                   <div className="space-y-3 sm:flex sm:items-end sm:space-y-0 sm:gap-x-3 mb-4">
                     <div className="flex-grow">
                       <label htmlFor="newIssue" className="block text-sm font-medium text-gray-700 sr-only">
                         Add Issue/Risk Description
                       </label>
                       <Field
                         type="text"
                         name="newIssue"
                         id="newIssue"
                         placeholder="Describe an issue or potential risk..."
                         className={`block w-full shadow-sm sm:text-sm rounded-md ${
                           touched.newIssue && errors.newIssue
                             ? "border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500"
                             : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                         }`}
                         aria-describedby="newIssue-error"
                       />
                     </div>
                     <div className="w-full sm:w-36 flex-shrink-0">
                       <label htmlFor="newSeverity" className="block text-sm font-medium text-gray-700 sr-only">
                         Severity
                       </label>
                       <Field
                         as="select"
                         name="newSeverity"
                         id="newSeverity"
                         className={`block w-full shadow-sm sm:text-sm rounded-md py-2 pl-3 pr-10 ${
                           touched.newSeverity && errors.newSeverity && values.newIssue
                             ? "border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500"
                             : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                         }`}
                          aria-describedby="newSeverity-error"
                       >
                         <option value="low">Low</option>
                         <option value="medium">Medium</option>
                         <option value="high">High</option>
                       </Field>
                     </div>
                     <div className="flex-shrink-0 pt-1 sm:pt-0">
                       <button
                         type="button"
                         onClick={() => handleAddIssue(values, setFieldValue)}
                         className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                         disabled={!values.newIssue.trim() || !!errors.newSeverity}
                       >
                         <PlusIcon className="h-5 w-5 mr-1" /> Add
                       </button>
                     </div>
                   </div>
                    <ErrorMessage name="newSeverity" id="newSeverity-error" component="p" className="text-sm text-red-600 mb-3" />

                   {/* List of added issues */}
                   {values.issuesAndRisks.length > 0 ? (
                     <div className="mt-4 border border-gray-200 rounded-md shadow-sm">
                       <ul role="list" className="divide-y divide-gray-200">
                         {values.issuesAndRisks.map((issue, index) => (
                           <li key={index} className="flex items-center justify-between py-3 pl-4 pr-3 text-sm hover:bg-gray-50 transition-colors">
                             <div className="flex-1 flex items-center min-w-0">
                               <span
                                 className={`flex-shrink-0 px-2 inline-flex text-xs leading-5 font-semibold rounded-full mr-3 capitalize ${
                                   issue.severity === "high"
                                     ? "bg-red-100 text-red-800"
                                     : issue.severity === "medium"
                                     ? "bg-yellow-100 text-yellow-800"
                                     : "bg-green-100 text-green-800"
                                 }`}
                               >
                                 {issue.severity}
                               </span>
                               <span className="flex-1 w-0 truncate" title={issue.description}>
                                 {issue.description}
                               </span>
                             </div>
                             <div className="ml-4 flex-shrink-0">
                               <button
                                 type="button"
                                 onClick={() => handleRemoveIssue(index, values, setFieldValue)}
                                 className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                                 title="Remove issue"
                               >
                                 <XMarkIcon className="h-5 w-5" />
                               </button>
                             </div>
                           </li>
                         ))}
                       </ul>
                     </div>
                   ) : (
                     <p className="text-sm text-gray-500 mt-2 italic">
                       No issues or risks added yet.
                     </p>
                   )}
                 </div>

                {/* Section 4: Attachments (remains the same) */}
                <div className="px-4 py-5 sm:p-6">
                   <h3 className="text-lg font-medium text-gray-900 mb-4">Attachments</h3>
                   <div>
                     <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 sr-only">
                       Attach Files (Max 5 files, 10MB each)
                     </label>
                     <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${isSubmitting ? "bg-gray-100 cursor-not-allowed" : "border-gray-300 hover:border-indigo-400"}`}>
                       <div className="space-y-1 text-center">
                         <PaperClipIcon className="mx-auto h-10 w-10 text-gray-400" />
                         <div className="flex text-sm text-gray-600 justify-center">
                           <label
                             htmlFor="file-upload"
                             className={`relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 ${isSubmitting || selectedFiles.length >= 5 ? "opacity-50 cursor-not-allowed" : ""}`}
                           >
                             <span>Upload files</span>
                             <input
                               id="file-upload"
                               name="file-upload"
                               type="file"
                               className="sr-only"
                               multiple
                               onChange={handleFileChange}
                               disabled={isSubmitting || selectedFiles.length >= 5}
                               accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt"
                             />
                           </label>
                           <p className="pl-1">or drag and drop</p>
                         </div>
                         <p className="text-xs text-gray-500">
                            Max 5 files. PDF, DOCX, XLSX, PNG, JPG etc. up to 10MB each.
                         </p>
                       </div>
                     </div>
                     {selectedFiles.length > 0 && (
                       <div className="mt-4 border border-gray-200 rounded-md shadow-sm">
                         <h4 className="sr-only">Files to upload</h4>
                         <ul role="list" className="divide-y divide-gray-200">
                           {selectedFiles.map((file, index) => (
                             <li key={index} className="flex items-center justify-between py-3 pl-4 pr-3 text-sm hover:bg-gray-50 transition-colors">
                               <div className="flex-1 flex items-center min-w-0">
                                 <PaperClipIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" aria-hidden="true" />
                                 <span className="flex-1 w-0 truncate font-medium" title={file.name}>
                                   {file.name}
                                 </span>
                                 <span className="text-gray-500 ml-2 flex-shrink-0">
                                   {(file.size / 1024 / 1024).toFixed(2)} MB
                                 </span>
                               </div>
                               <div className="ml-4 flex-shrink-0">
                                 <button
                                   type="button"
                                   onClick={() => handleRemoveFile(index)}
                                   className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                                   title="Remove file"
                                   disabled={isSubmitting}
                                 >
                                   <XMarkIcon className="h-5 w-5" />
                                 </button>
                               </div>
                             </li>
                           ))}
                         </ul>
                       </div>
                     )}
                   </div>
                </div>

                {/* Form Actions Footer (update disabled condition) */}
                 <div className="px-4 py-4 sm:px-6 flex justify-end items-center space-x-3 bg-gray-50 rounded-b-lg">
                   <button
                     type="button"
                     onClick={() => navigate("/reports")} // Consultant reports list
                     className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                     disabled={isSubmitting}
                   >
                     Cancel
                   </button>
                   <button
                     type="submit"
                     // UPDATED disabled condition
                     disabled={isSubmitting || !isValid || !dirty || isLoadingProjects || noSuitableProjects}
                     className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                   >
                     {isSubmitting ? (
                       <>
                         <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" /> Submitting...
                       </>
                     ) : (
                       <>
                         <DocumentTextIcon className="h-5 w-5 mr-2" /> Submit Report
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

export default CreateReport;