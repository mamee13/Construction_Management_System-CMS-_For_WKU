

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
  CalendarDaysIcon,
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

// --- Helper Function for Date Formatting ---
const formatDateForDisplay = (date) => {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleDateString('en-CA');
  } catch (e) {
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
              if (!value || !selectedProjectId) return true;
              const selectedProject = availableProjects.find(p => p._id === selectedProjectId);
              if (!selectedProject?.startDate || !selectedProject?.endDate) return true;
              const startDate = new Date(value); startDate.setHours(0,0,0,0);
              const projStart = new Date(selectedProject.startDate); projStart.setHours(0,0,0,0);
              const projEnd = new Date(selectedProject.endDate); projEnd.setHours(0,0,0,0);
              if (startDate < projStart || startDate > projEnd) {
                return this.createError({
                  message: `Start date must be ${formatDateForDisplay(projStart)} - ${formatDateForDisplay(projEnd)}`,
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
              if (!value || !startDateValue || !selectedProjectId) return true;
              const selectedProject = availableProjects.find(p => p._id === selectedProjectId);
              if (!selectedProject?.startDate || !selectedProject?.endDate) return true;
              const endDate = new Date(value); endDate.setHours(0,0,0,0);
              const startDate = new Date(startDateValue); startDate.setHours(0,0,0,0);
              const projStart = new Date(selectedProject.startDate); projStart.setHours(0,0,0,0);
              const projEnd = new Date(selectedProject.endDate); projEnd.setHours(0,0,0,0);
              if (endDate < projStart || endDate > projEnd) {
                return this.createError({
                  message: `End date must be ${formatDateForDisplay(projStart)} - ${formatDateForDisplay(projEnd)}`,
                });
              }
              const diffTime = Math.abs(endDate - startDate);
              const diffDays = Math.ceil(diffTime / MILLISECONDS_PER_DAY) + 1;
              if (reportType === 'monthly_progress' && (diffDays < 20 || diffDays > 40)) {
                return this.createError({
                  message: `Monthly: 20-40 days required (${diffDays} days selected)`,
                });
              }
              if (reportType === 'weekly_progress' && (diffDays < 5 || diffDays > 10)) {
                return this.createError({
                  message: `Weekly: 5-10 days required (${diffDays} days selected)`,
                });
              }
              return true;
            }
          ),
      otherwise: (schema) => schema.optional().nullable(),
    }),
    newIssue: Yup.string(),
    newSeverity: Yup.string().when('newIssue', {
      is: (val) => !!val?.trim(),
      then: (schema) => schema.required('Severity required').oneOf(['low', 'medium', 'high']),
      otherwise: (schema) => schema.notRequired(),
    }),
  });
};

const initialValues = {
  title: "",
  project: "",
  type: "progress",
  summary: "",
  periodStartDate: "",
  periodEndDate: "",
  issuesAndRisks: [],
  attachments: [],
  newIssue: "",
  newSeverity: "medium",
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
      return;
    }
    if (!currentUser || currentUser.role !== "contractor") {
      toast.warn("Access Denied.", { autoClose: 3000 });
      navigate("/dashboard", { replace: true });
    }
  }, [currentUser, navigate]);

  // --- Fetch Assigned Projects ---
  const {
    data: projectsResponse,
    isLoading: isLoadingProjects,
    isError: isProjectsError,
    error: projectsError,
  } = useQuery({
    queryKey: ["contractor-assigned-projects-with-dates", currentUser?._id],
    queryFn: () => projectsAPI.getMyAssignedProjects(),
    enabled: !!currentUser?._id,
    staleTime: 15 * 60 * 1000,
    select: (data) => {
      const projectsWithDates =
        data?.data?.projects
          ?.map((p) => ({
            ...p,
            startDate: p.startDate ? new Date(p.startDate) : null,
            endDate: p.endDate ? new Date(p.endDate) : null,
          }))
          .filter((p) => p.startDate && p.endDate) || [];
      return projectsWithDates;
    },
  });
  const projects = projectsResponse || [];

  // --- File Handling ---
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (selectedFiles.length + files.length > 5) {
      toast.error("Maximum 5 files allowed.");
      return;
    }
    const newFiles = files.filter(
      (file) =>
        !selectedFiles.some(
          (sf) => sf.name === file.name && sf.size === file.size
        )
    );
    setSelectedFiles((prevFiles) => [...prevFiles, ...newFiles]);
    event.target.value = null;
  };
  const handleRemoveFile = (index) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  // --- Create Report Mutation ---
  const createReportMutation = useMutation({
    mutationFn: (reportData) => reportsAPI.createReport(reportData),
    onSuccess: (data) => {
      toast.success(`Report "${data?.data?.title || ""}" submitted successfully`);
      queryClient.invalidateQueries({ queryKey: ["contractor-reports"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      navigate("/contractor-reports");
    },
    onError: (error) => {
      console.error("Report creation error:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to submit report.";
      toast.error(message);
    },
  });

  // --- Update selected project dates when project changes ---
  const handleProjectChange = (e, setFieldValue, availableProjects) => {
    const projectId = e.target.value;
    setFieldValue("project", projectId);
    const selectedProj = availableProjects.find((p) => p._id === projectId);
    if (selectedProj) {
      setSelectedProjectDates({ start: selectedProj.startDate, end: selectedProj.endDate });
    } else {
      setSelectedProjectDates({ start: null, end: null });
    }
  };

  // --- Type Change Handler ---
  const handleTypeChange = (e, setFieldValue, values) => {
    const newType = e.target.value;
    setFieldValue("type", newType);
    if (!TYPES_REQUIRING_DATES.includes(newType)) {
      setFieldValue("periodStartDate", "");
      setFieldValue("periodEndDate", "");
    }
  };

  // --- Handle Form Submission using real file uploading ---
  const handleSubmit = async (values, { setSubmitting }) => {
    setSubmitting(true);
    // Build report data – trim text fields and add dates as ISO strings if needed.
    const reportData = {
      title: values.title.trim(),
      project: values.project,
      type: values.type,
      summary: values.summary.trim(),
      issuesAndRisks: JSON.stringify(values.issuesAndRisks),
      attachments: selectedFiles, // Pass actual File objects
    };
    if (TYPES_REQUIRING_DATES.includes(values.type)) {
      if (values.periodStartDate)
        reportData.periodStartDate = new Date(values.periodStartDate).toISOString();
      if (values.periodEndDate)
        reportData.periodEndDate = new Date(values.periodEndDate).toISOString();
    }
    // Call the real API – reportsAPI.createReport will convert the object into FormData
    createReportMutation.mutate(reportData, {
      onSettled: () => setSubmitting(false),
    });
  };

  // --- Issue Handling Logic ---
  const handleAddIssue = (values, setFieldValue) => {
    const description = values.newIssue.trim();
    const severity = values.newSeverity;
    if (!description) {
      toast.info("Enter issue description.");
      return;
    }
    if (!severity) {
      toast.info("Select severity.");
      return;
    }
    if (values.issuesAndRisks.some((issue) => issue.description === description)) {
      toast.warn("Issue already added.");
      return;
    }
    setFieldValue("issuesAndRisks", [
      ...values.issuesAndRisks,
      { description, severity },
    ]);
    setFieldValue("newIssue", "");
    setFieldValue("newSeverity", "medium");
  };
  const handleRemoveIssue = (index, values, setFieldValue) => {
    setFieldValue("issuesAndRisks", values.issuesAndRisks.filter((_, i) => i !== index));
  };

  const validationSchema = getValidationSchema(projects);

  // --- Render ---
  if (!currentUser)
    return <div className="p-4 text-center">Authorizing...</div>;

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold leading-tight text-gray-900">Submit New Report</h1>
          <p className="mt-1 text-sm text-gray-500">Complete the details below.</p>
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

      {/* Projects Loading/Error States */}
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
      {!isLoadingProjects && !isProjectsError && projects.length === 0 && (
        <div
          className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md relative mb-6 shadow-sm"
          role="alert"
        >
          <strong className="font-bold">No Valid Projects: </strong>
          <span className="block sm:inline">
            You must be assigned to projects with defined start/end dates to submit reports.
          </span>
        </div>
      )}

      {/* Form Section */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          validateOnChange={true}
          validateOnBlur={true}
        >
          {({ errors, touched, values, setFieldValue, dirty, isValid, isSubmitting }) => (
            <Form>
              <fieldset disabled={isSubmitting || isLoadingProjects || projects.length === 0} className="divide-y divide-gray-200">
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
                        placeholder="e.g., Weekly Progress - Phase 1 Concrete"
                        className={`block w-full shadow-sm sm:text-sm rounded-md ${
                          touched.title && errors.title
                            ? "border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500"
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
                        onChange={(e) => handleProjectChange(e, setFieldValue, projects)}
                        className={`block w-full shadow-sm sm:text-sm rounded-md py-2 pl-3 pr-10 ${
                          touched.project && errors.project
                            ? "border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                        } ${isLoadingProjects || projects.length === 0 ? "bg-gray-100 cursor-not-allowed" : ""}`}
                        aria-invalid={touched.project && errors.project ? "true" : "false"}
                        aria-describedby={touched.project && errors.project ? "project-error" : undefined}
                      >
                        <option value="">
                          {isLoadingProjects ? "Loading..." : projects.length === 0 ? "No Valid Projects" : "-- Select Project --"}
                        </option>
                        {projects.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.projectName}
                          </option>
                        ))}
                      </Field>
                      <ErrorMessage name="project" id="project-error" component="p" className="mt-1 text-sm text-red-600" />
                      {selectedProjectDates.start && selectedProjectDates.end && (
                        <p className="mt-1 text-xs text-gray-500 flex items-center">
                          <InformationCircleIcon className="h-4 w-4 mr-1 text-gray-400" />
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
                            ? "border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                        }`}
                        aria-invalid={touched.type && errors.type ? "true" : "false"}
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

                    {/* Conditional Period Dates */}
                    {TYPES_REQUIRING_DATES.includes(values.type) && (
                      <>
                        <div className="sm:col-span-3">
                          <label htmlFor="periodStartDate" className="block text-sm font-medium text-gray-700 mb-1">
                            Period Start Date <span className="text-red-500">*</span>
                          </label>
                          <Field
                            name="periodStartDate"
                            id="periodStartDate"
                            type="date"
                            className={`block w-full shadow-sm sm:text-sm rounded-md ${
                              touched.periodStartDate && errors.periodStartDate
                                ? "border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500"
                                : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                            }`}
                            aria-invalid={touched.periodStartDate && errors.periodStartDate ? "true" : "false"}
                            aria-describedby={touched.periodStartDate && errors.periodStartDate ? "periodStartDate-error" : "periodStartDate-hint"}
                          />
                          <ErrorMessage name="periodStartDate" id="periodStartDate-error" component="p" className="mt-1 text-sm text-red-600" />
                          {!errors.periodStartDate && selectedProjectDates.start && (
                            <p id="periodStartDate-hint" className="mt-1 text-xs text-gray-500">
                              Project starts {formatDateForDisplay(selectedProjectDates.start)}.
                            </p>
                          )}
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="periodEndDate" className="block text-sm font-medium text-gray-700 mb-1">
                            Period End Date <span className="text-red-500">*</span>
                          </label>
                          <Field
                            name="periodEndDate"
                            id="periodEndDate"
                            type="date"
                            className={`block w-full shadow-sm sm:text-sm rounded-md ${
                              touched.periodEndDate && errors.periodEndDate
                                ? "border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500"
                                : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                            }`}
                            aria-invalid={touched.periodEndDate && errors.periodEndDate ? "true" : "false"}
                            aria-describedby={touched.periodEndDate && errors.periodEndDate ? "periodEndDate-error" : "periodEndDate-hint"}
                            min={values.periodStartDate || undefined}
                          />
                          <ErrorMessage name="periodEndDate" id="periodEndDate-error" component="p" className="mt-1 text-sm text-red-600" />
                          {!errors.periodEndDate && selectedProjectDates.end && (
                            <p id="periodEndDate-hint" className="mt-1 text-xs text-gray-500">
                              Project ends {formatDateForDisplay(selectedProjectDates.end)}.
                              {values.type === 'monthly_progress' && ' (20-40 day span)'}
                              {values.type === 'weekly_progress' && ' (5-10 day span)'}
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
                    placeholder="Provide a detailed summary..."
                    className={`block w-full shadow-sm sm:text-sm rounded-md ${
                      touched.summary && errors.summary
                        ? "border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    }`}
                    aria-invalid={touched.summary && errors.summary ? "true" : "false"}
                    aria-describedby={touched.summary && errors.summary ? "summary-error" : undefined}
                  />
                  <ErrorMessage name="summary" id="summary-error" component="p" className="mt-1 text-sm text-red-600" />
                  <p className="mt-2 text-sm text-gray-500">
                    Describe activities, progress, observations, etc.
                  </p>
                </div>

                {/* Section 3: Issues and Risks */}
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Issues and Risks</h3>
                  <div className="space-y-3 sm:flex sm:items-end sm:space-y-0 sm:gap-x-3 mb-4">
                    <div className="flex-grow">
                      <label htmlFor="newIssue" className="block text-sm font-medium text-gray-700 sr-only">
                        Add Issue/Risk Description
                      </label>
                      <Field
                        name="newIssue"
                        id="newIssue"
                        type="text"
                        placeholder="Describe an issue or potential risk..."
                        className={`block w-full shadow-sm sm:text-sm rounded-md ${
                          touched.newIssue && errors.newIssue
                            ? "border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                        }`}
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
                            ? "border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                        }`}
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
                  <ErrorMessage name="newIssue" component="p" className="text-sm text-red-600" />
                  {values.newIssue && <ErrorMessage name="newSeverity" component="p" className="text-sm text-red-600" />}
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

                {/* Section 4: Attachments */}
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Attachments</h3>
                  <div>
                    <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 sr-only">
                      Attach Files
                    </label>
                    <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${isSubmitting ? "bg-gray-100" : "border-gray-300 hover:border-indigo-400"}`}>
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
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              multiple
                              onChange={handleFileChange}
                              disabled={isSubmitting}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          Max 5 files. PDF, PNG, JPG, DOCX, XLSX etc.
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

                {/* Form Actions Footer */}
                <div className="px-4 py-4 sm:px-6 flex justify-end items-center space-x-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => navigate("/contractor-reports")}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !dirty || !isValid || isLoadingProjects || projects.length === 0}
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

export default CreateReportForContractor;

