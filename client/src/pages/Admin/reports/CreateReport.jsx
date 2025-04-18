

/* eslint-disable */
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { toast } from "react-toastify"
import {
  ArrowPathIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  PaperClipIcon,
  XMarkIcon,
  PlusIcon,
  InformationCircleIcon,
  UsersIcon, // Example icon for Committee
} from "@heroicons/react/24/outline"
import authAPI from "@/APi/auth"
import reportsAPI from "@/APi/reports"
import projectsAPI from "@/APi/projects"

// --- Constants for Committee Reports ---
const COMMITTEE_REPORT_TYPES = [
  { value: "committee_summary", label: "Executive Summary" },
  { value: "milestone_update", label: "Milestone Progress Update" },
  { value: "financial_overview", label: "Financial Overview" },
  { value: "risk_assessment", label: "Risk Assessment Summary" },
  { value: "strategic_alignment", label: "Strategic Alignment Checkpoint" },
  // Add other types relevant for your committee
  { value: "custom_committee", label: "Custom Committee Report" },
]
// Define which committee report types require date ranges
const COMMITTEE_TYPES_REQUIRING_DATES = [
    "milestone_update",
    "financial_overview", // Example: maybe financial reports cover a specific period
    // Add others if needed
]
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24

// --- Helper Function for Date Formatting (remains the same) ---
const formatDateForDisplay = (date) => {
    if (!date) return "N/A";
    try {
        const dateObj = date instanceof Date ? date : new Date(date);
        if (isNaN(dateObj.getTime())) return "Invalid Date";
        return dateObj.toLocaleDateString("en-CA"); // YYYY-MM-DD format
    } catch (e) {
        console.error("Error formatting date:", e);
        return "Invalid Date";
    }
}

// --- Modified Validation Schema Factory ---
// Now accepts reportTypes and typesRequiringDates as arguments
const getValidationSchema = (availableProjects, reportTypes, typesRequiringDates) => {
  return Yup.object({
    title: Yup.string().required("Title is required").max(150, "Title cannot exceed 150 characters"),
    project: Yup.string().required("Project selection is required"),
    type: Yup.string()
      .required("Report type is required")
      .oneOf(
        // Use the passed reportTypes array
        reportTypes.map((rt) => rt.value),
        "Invalid report type",
      ),
    summary: Yup.string().required("Report summary/content is required").min(20, "Summary should be at least 20 characters"), // Increased min length slightly
    // Use the passed typesRequiringDates array in .when conditions
    periodStartDate: Yup.date().when("type", {
      is: (type) => typesRequiringDates.includes(type), // Use passed array
      then: (schema) =>
        schema
          .required("Start date is required for this report type")
          .nullable()
          .test("project-timeframe-start", "Start date out of project range", function (value) {
            const { project: selectedProjectId } = this.parent
            if (!value || !selectedProjectId) return true
            const selectedProject = availableProjects.find((p) => p._id === selectedProjectId)
            if (!selectedProject?.startDate || !selectedProject?.endDate) return true

            const startDate = new Date(value); startDate.setHours(0, 0, 0, 0)
            const projStart = new Date(selectedProject.startDate); projStart.setHours(0, 0, 0, 0)
            const projEnd = new Date(selectedProject.endDate); projEnd.setHours(0, 0, 0, 0)

            if (startDate < projStart || startDate > projEnd) {
              return this.createError({
                message: `Start date must be between ${formatDateForDisplay(projStart)} and ${formatDateForDisplay(projEnd)}`,
              })
            }
            return true
          }),
      otherwise: (schema) => schema.optional().nullable(),
    }),
    periodEndDate: Yup.date().when("type", {
      is: (type) => typesRequiringDates.includes(type), // Use passed array
      then: (schema) =>
        schema
          .required("End date is required for this report type")
          .nullable()
          .min(Yup.ref("periodStartDate"), "End date must be on or after start date")
          .test("project-timeframe-and-span", "End date/span validation failed", function (value) {
            const { project: selectedProjectId, periodStartDate: startDateValue, type: reportType } = this.parent
            if (!value || !startDateValue || !selectedProjectId) return true
            const selectedProject = availableProjects.find((p) => p._id === selectedProjectId)
            if (!selectedProject?.startDate || !selectedProject?.endDate) return true

            const endDate = new Date(value); endDate.setHours(0, 0, 0, 0)
            const startDate = new Date(startDateValue); startDate.setHours(0, 0, 0, 0)
            const projStart = new Date(selectedProject.startDate); projStart.setHours(0, 0, 0, 0)
            const projEnd = new Date(selectedProject.endDate); projEnd.setHours(0, 0, 0, 0)

            if (endDate < projStart || endDate > projEnd) {
              return this.createError({
                message: `End date must be between ${formatDateForDisplay(projStart)} and ${formatDateForDisplay(projEnd)}`,
              })
            }

            // Optional: Add specific span checks for committee report types if needed
            // const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            // const diffDays = startDate.getTime() === endDate.getTime() ? 1 : Math.ceil(diffTime / MILLISECONDS_PER_DAY) + 1;
            // if (reportType === 'some_committee_type' && ...) { ... }

            return true
          }),
      otherwise: (schema) => schema.optional().nullable(),
    }),
    newIssue: Yup.string(), // Keep issue tracking if relevant for committee
    newSeverity: Yup.string().when("newIssue", {
      is: (val) => val && val.trim().length > 0,
      then: (schema) => schema.required("Severity is required when adding an issue").oneOf(["low", "medium", "high"]),
      otherwise: (schema) => schema.notRequired(),
    }),
  })
}

// Update initial values for committee context
const initialValues = {
  title: "",
  summary: "",
  project: "",
  type: "committee_summary", // Default to a common committee type
  periodStartDate: "",
  periodEndDate: "",
  issuesAndRisks: [],
  newIssue: "",
  newSeverity: "medium",
}

// --- Component Renamed ---
const CreateAdminReport = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedFiles, setSelectedFiles] = useState([])
  const currentUser = authAPI.getCurrentUser()
  const [selectedProjectDates, setSelectedProjectDates] = useState({ start: null, end: null })

  // --- Authorization Check (Admin Only - remains the same) ---
   useEffect(() => {
    const checkUserRole = () => {
      if (!authAPI.isAuthenticated()) {
        toast.info("Please log in.")
        navigate("/login", { replace: true })
        return
      }
      if (currentUser?.role !== "admin") {
        toast.warn("Access Denied. Administrator privileges required.")
        navigate("/dashboard", { replace: true })
      }
    }
    if (currentUser !== undefined) { checkUserRole() }
  }, [currentUser, navigate])

  // --- Fetch ALL Projects for Admin (remains the same logic) ---
  const {
    data: projectsData,
    isLoading: isLoadingProjects,
    isError: isProjectsError,
    error: projectsError,
  } = useQuery({
    queryKey: ["admin-all-projects-with-dates-for-committee"], // Slightly different key for clarity
    queryFn: () => projectsAPI.getAllProjects(),
    enabled: !!currentUser?._id && currentUser?.role === "admin",
    staleTime: 5 * 60 * 1000,
    select: (data) => {
      const projectsWithValidDates =
        data?.data
          ?.map((p) => ({
            ...p,
            startDate: p.startDate ? new Date(p.startDate) : null,
            endDate: p.endDate ? new Date(p.endDate) : null,
          }))
          .filter((p) => {
            const hasValidDates = p.startDate && p.endDate && !isNaN(p.startDate.getTime()) && !isNaN(p.endDate.getTime())
            return hasValidDates
          }) || []
      return projectsWithValidDates
    },
  })

  const availableProjects = projectsData || []

  // --- File Handling (remains the same) ---
   const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (selectedFiles.length + files.length > 5) {
      toast.error("Maximum 5 files allowed."); return;
    }
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024); // 10MB limit
    if (oversizedFiles.length > 0) {
      toast.error(`File(s) exceed 10MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`); return;
    }
    const newFiles = files.filter(file => !selectedFiles.some(sf => sf.name === file.name && sf.size === file.size));
    if(newFiles.length !== files.length) { toast.info("Duplicate files were ignored."); }
    setSelectedFiles(prevFiles => [...prevFiles, ...newFiles]);
    event.target.value = null; // Allow re-selecting the same file
  };
  const handleRemoveFile = (index) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  // --- Dynamic Validation Schema ---
  // Pass the committee-specific types to the factory function
  const validationSchema = getValidationSchema(
      availableProjects,
      COMMITTEE_REPORT_TYPES,         // Pass committee types
      COMMITTEE_TYPES_REQUIRING_DATES // Pass committee date requirements
  );


  // --- Create Report Mutation (Adjust query invalidation if needed) ---
  const createReportMutation = useMutation({
    mutationFn: (reportData) => reportsAPI.createReport(reportData),
    onSuccess: (data) => {
      toast.success(`Committee report "${data?.data?.report?.title || "New Report"}" created successfully`);
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["admin-committee-reports"] }); // Specific key for these reports?
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] }); // General admin reports list
      queryClient.invalidateQueries({ queryKey: ["reports"] }); // Overall reports list
      queryClient.invalidateQueries({ queryKey: ["admin-all-projects-with-dates-for-committee"] }); // Refetch project list
      // Navigate to a specific list for committee reports? Or back to main admin list?
      navigate("/admin/reports"); // Defaulting to main admin list
    },
    onError: (error) => {
      console.error("Committee report creation error:", error);
      const message = error?.response?.data?.message || error?.message || "Failed to create committee report.";
      toast.error(message);
    },
  });

  // --- Form Submission Handler (remains the same logic) ---
  const handleSubmit = async (values, { setSubmitting }) => {
    const reportDataToSend = {
      title: values.title.trim(),
      project: values.project,
      type: values.type, // This will be the committee-specific type
      summary: values.summary.trim(),
      issuesAndRisks: JSON.stringify(values.issuesAndRisks),
      attachments: selectedFiles,
      // Optionally add a flag if backend needs to distinguish committee reports
      // isCommitteeReport: true,
    };

    // Add dates if required by the specific committee report type
    if (COMMITTEE_TYPES_REQUIRING_DATES.includes(values.type)) {
      if (values.periodStartDate) {
        try { reportDataToSend.periodStartDate = new Date(values.periodStartDate).toISOString(); }
        catch (e) { console.error("Error converting start date:", e); }
      }
      if (values.periodEndDate) {
        try { reportDataToSend.periodEndDate = new Date(values.periodEndDate).toISOString(); }
        catch (e) { console.error("Error converting end date:", e); }
      }
    }

    createReportMutation.mutate(reportDataToSend, {
      onSettled: () => { setSubmitting(false); },
    });
  };

  // --- Issue Handling Logic (remains the same) ---
  const handleAddIssue = (values, setFieldValue) => {
    const description = values.newIssue.trim();
    const severity = values.newSeverity;
    if (!description) { toast.info("Please enter an issue description."); return; }
    const isDuplicate = values.issuesAndRisks.some(issue => issue.description.toLowerCase() === description.toLowerCase());
    if (isDuplicate) { toast.warn("This issue description has already been added."); return; }
    setFieldValue("issuesAndRisks", [...values.issuesAndRisks, { description, severity }]);
    setFieldValue("newIssue", "");
    setFieldValue("newSeverity", "medium");
  };
  const handleRemoveIssue = (index, values, setFieldValue) => {
    const updatedIssues = values.issuesAndRisks.filter((_, i) => i !== index);
    setFieldValue("issuesAndRisks", updatedIssues);
  };

  // --- Form Field Change Handlers (Update type change logic) ---
  const handleTypeChange = (e, setFieldValue, values) => {
    const newType = e.target.value;
    setFieldValue("type", newType);
    // Use COMMITTEE_TYPES_REQUIRING_DATES for logic
    if (!COMMITTEE_TYPES_REQUIRING_DATES.includes(newType)) {
      setFieldValue("periodStartDate", "");
      setFieldValue("periodEndDate", "");
    } else {
         setTimeout(() => { // Ensure state updates before validation
            setFieldValue("periodStartDate", values.periodStartDate, true);
            setFieldValue("periodEndDate", values.periodEndDate, true);
        }, 0);
    }
  };

  // Project change handler remains the same
  const handleProjectChange = (e, setFieldValue, availableProjects, currentValues) => {
    const projectId = e.target.value;
    setFieldValue("project", projectId);
    const selectedProj = availableProjects.find(p => p._id === projectId);
    if (selectedProj?.startDate && selectedProj?.endDate) {
      setSelectedProjectDates({ start: selectedProj.startDate, end: selectedProj.endDate });
    } else {
      setSelectedProjectDates({ start: null, end: null });
      setFieldValue("periodStartDate", "");
      setFieldValue("periodEndDate", "");
    }
    setTimeout(() => {
      setFieldValue("periodStartDate", currentValues.periodStartDate, true);
      setFieldValue("periodEndDate", currentValues.periodEndDate, true);
    }, 0);
  };

  // --- Render Logic ---
  if (currentUser === undefined) { return <div className="p-4 text-center text-gray-600">Loading user data...</div>; }
  if (!currentUser || currentUser.role !== "admin") { return <div className="p-4 text-center text-gray-600">Checking authorization...</div>; }

  const noSuitableProjects = !isLoadingProjects && !isProjectsError && availableProjects.length === 0 && projectsData !== undefined;

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header (Updated for Committee Context + Visual Cue) */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8 pb-4 border-b border-blue-200 bg-blue-50 p-4 rounded-t-lg -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8"> {/* Added bg/border */}
        <div className="flex items-center">
          <UsersIcon className="h-8 w-8 text-blue-600 mr-3 hidden sm:block"/> {/* Committee Icon */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Create Committee Report (Admin)</h1>
            <p className="text-gray-600 text-sm">Prepare and submit a report for committee review.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/reports")} // Or "/admin/committee-reports"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2 text-gray-500" />
          Back to Reports
        </button>
      </div>

      {/* Loading/Error/No Projects State (remains the same) */}
      {isLoadingProjects && ( <div className="text-center py-6 text-gray-600"><ArrowPathIcon className="h-6 w-6 text-indigo-500 animate-spin inline-block mr-2" /> Loading projects...</div> )}
      {isProjectsError && ( <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md relative mb-6 shadow-sm" role="alert"><strong className="font-bold">Error Loading Projects: </strong><span className="block sm:inline">{projectsError?.message || "Could not fetch project list."}</span></div> )}
      {noSuitableProjects && ( <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md relative mb-6 shadow-sm" role="alert"><strong className="font-bold">No Projects Available for Reporting: </strong><span className="block sm:inline">Could not find projects with defined start/end dates required for reporting.</span></div> )}

      {/* Form Section */}
      <div className={`bg-white shadow-md rounded-lg overflow-hidden mt-6 ${isLoadingProjects || noSuitableProjects ? "opacity-60 pointer-events-none" : ""}`}>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          validateOnChange={true}
          validateOnBlur={true}
          enableReinitialize
        >
          {({ errors, touched, values, setFieldValue, dirty, isValid, isSubmitting }) => (
            <Form>
              <fieldset disabled={isSubmitting || isLoadingProjects || noSuitableProjects} className="divide-y divide-gray-200">
                {/* Section 1: Report Details */}
                <div className="px-4 py-5 sm:p-6">
                  <legend className="text-lg font-medium text-gray-900 mb-4">Committee Report Details</legend>
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    {/* Title */}
                    <div className="sm:col-span-6">
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Report Title <span className="text-red-500">*</span></label>
                      <Field type="text" name="title" id="title" placeholder="e.g., Q2 Financial Overview for Committee" className={`block w-full shadow-sm sm:text-sm rounded-md ${touched.title && errors.title ? 'border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`} aria-invalid={touched.title && errors.title ? "true" : "false"} aria-describedby={touched.title && errors.title ? "title-error" : undefined} />
                      <ErrorMessage name="title" id="title-error" component="p" className="mt-1 text-sm text-red-600" />
                    </div>

                    {/* Project */}
                    <div className="sm:col-span-3">
                       <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">Related Project <span className="text-red-500">*</span></label>
                       <Field as="select" name="project" id="project" onChange={(e) => handleProjectChange(e, setFieldValue, availableProjects, values)} className={`block w-full shadow-sm sm:text-sm rounded-md py-2 pl-3 pr-10 ${touched.project && errors.project ? 'border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'} ${isLoadingProjects || noSuitableProjects ? 'bg-gray-100 cursor-not-allowed' : ''}`} aria-invalid={touched.project && errors.project ? "true" : "false"} aria-describedby={touched.project && errors.project ? "project-error" : "project-hint"}>
                          <option value="">{ isLoadingProjects ? "Loading..." : noSuitableProjects ? "No Suitable Projects" : "-- Select Project --"}</option>
                          {availableProjects.map((project) => ( <option key={project._id} value={project._id}>{project.projectName} ({project.projectCode || "No Code"})</option> ))}
                       </Field>
                       <ErrorMessage name="project" id="project-error" component="p" className="mt-1 text-sm text-red-600" />
                       {selectedProjectDates.start && selectedProjectDates.end && ( <p id="project-hint" className="mt-1 text-xs text-gray-500 flex items-center"><InformationCircleIcon className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0" /> Project runs: {formatDateForDisplay(selectedProjectDates.start)} to {formatDateForDisplay(selectedProjectDates.end)}</p> )}
                    </div>

                    {/* Report Type (Uses COMMITTEE_REPORT_TYPES) */}
                    <div className="sm:col-span-3">
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Report Type <span className="text-red-500">*</span></label>
                      <Field as="select" name="type" id="type" onChange={(e) => handleTypeChange(e, setFieldValue, values)} className={`block w-full shadow-sm sm:text-sm rounded-md py-2 pl-3 pr-10 ${touched.type && errors.type ? 'border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`} aria-invalid={touched.type && errors.type ? "true" : "false"} aria-describedby={touched.type && errors.type ? "type-error" : undefined}>
                        {/* Iterate over COMMITTEE_REPORT_TYPES */}
                        {COMMITTEE_REPORT_TYPES.map((rt) => (
                          <option key={rt.value} value={rt.value}>
                            {rt.label}
                          </option>
                        ))}
                      </Field>
                      <ErrorMessage name="type" id="type-error" component="p" className="mt-1 text-sm text-red-600" />
                    </div>

                    {/* Conditional Period Dates (Uses COMMITTEE_TYPES_REQUIRING_DATES) */}
                    {COMMITTEE_TYPES_REQUIRING_DATES.includes(values.type) && (
                      <>
                        {/* Period Start Date */}
                        <div className="sm:col-span-3">
                            <label htmlFor="periodStartDate" className="block text-sm font-medium text-gray-700 mb-1">Period Start Date <span className="text-red-500">*</span></label>
                            <Field type="date" name="periodStartDate" id="periodStartDate" className={`block w-full shadow-sm sm:text-sm rounded-md ${touched.periodStartDate && errors.periodStartDate ? 'border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`} aria-invalid={touched.periodStartDate && errors.periodStartDate ? "true" : "false"} aria-describedby={touched.periodStartDate && errors.periodStartDate ? "periodStartDate-error" : "periodStartDate-hint"} max={ values.periodEndDate || (selectedProjectDates.end ? formatDateForDisplay(selectedProjectDates.end) : undefined) } min={ selectedProjectDates.start ? formatDateForDisplay(selectedProjectDates.start) : undefined } />
                            <ErrorMessage name="periodStartDate" id="periodStartDate-error" component="p" className="mt-1 text-sm text-red-600" />
                            {!errors.periodStartDate && selectedProjectDates.start && ( <p id="periodStartDate-hint" className="mt-1 text-xs text-gray-500">Must be on or after {formatDateForDisplay(selectedProjectDates.start)}.</p> )}
                        </div>

                        {/* Period End Date */}
                        <div className="sm:col-span-3">
                            <label htmlFor="periodEndDate" className="block text-sm font-medium text-gray-700 mb-1">Period End Date <span className="text-red-500">*</span></label>
                            <Field type="date" name="periodEndDate" id="periodEndDate" className={`block w-full shadow-sm sm:text-sm rounded-md ${touched.periodEndDate && errors.periodEndDate ? 'border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`} aria-invalid={touched.periodEndDate && errors.periodEndDate ? "true" : "false"} aria-describedby={touched.periodEndDate && errors.periodEndDate ? "periodEndDate-error" : "periodEndDate-hint"} min={ values.periodStartDate || (selectedProjectDates.start ? formatDateForDisplay(selectedProjectDates.start) : undefined) } max={ selectedProjectDates.end ? formatDateForDisplay(selectedProjectDates.end) : undefined } />
                            <ErrorMessage name="periodEndDate" id="periodEndDate-error" component="p" className="mt-1 text-sm text-red-600" />
                            {!errors.periodEndDate && selectedProjectDates.end && ( <p id="periodEndDate-hint" className="mt-1 text-xs text-gray-500">Must be on or before {formatDateForDisplay(selectedProjectDates.end)}.</p> )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Section 2: Summary & Content */}
                 <div className="px-4 py-5 sm:p-6">
                    <label htmlFor="summary" className="block text-lg font-medium text-gray-900 mb-2">Report Content / Summary <span className="text-red-500">*</span></label>
                    <Field as="textarea" name="summary" id="summary" rows={8} placeholder="Provide the key information, summary, analysis, or updates for the committee..." className={`block w-full shadow-sm sm:text-sm rounded-md ${touched.summary && errors.summary ? 'border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`} aria-invalid={touched.summary && errors.summary ? "true" : "false"} aria-describedby={touched.summary && errors.summary ? "summary-error" : undefined} />
                    <ErrorMessage name="summary" id="summary-error" component="p" className="mt-1 text-sm text-red-600" />
                    <p className="mt-2 text-sm text-gray-500">Focus on clarity and relevance for committee review.</p>
                 </div>

                {/* Section 3: Issues and Risks (Keep if needed for committee context) */}
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Key Issues/Risks for Committee Awareness</h3>
                   {/* (Issue input/list markup remains the same) */}
                   <div className="space-y-3 sm:flex sm:items-end sm:space-y-0 sm:gap-x-3 mb-4">
                        <div className="flex-grow"><label htmlFor="newIssue" className="block text-sm font-medium text-gray-700 sr-only">Add Issue/Risk Description</label><Field type="text" name="newIssue" id="newIssue" placeholder="Describe issue/risk highlight for committee..." className={`block w-full shadow-sm sm:text-sm rounded-md ${touched.newIssue && errors.newIssue ? 'border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`} aria-describedby="newIssue-error"/></div>
                        <div className="w-full sm:w-36 flex-shrink-0"><label htmlFor="newSeverity" className="block text-sm font-medium text-gray-700 sr-only">Severity</label><Field as="select" name="newSeverity" id="newSeverity" className={`block w-full shadow-sm sm:text-sm rounded-md py-2 pl-3 pr-10 ${touched.newSeverity && errors.newSeverity && values.newIssue ? 'border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`} aria-describedby="newSeverity-error"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></Field>{values.newIssue.trim() && <ErrorMessage name="newSeverity" id="newSeverity-error" component="p" className="text-sm text-red-600 mt-1" />}</div>
                        <div className="flex-shrink-0 pt-1 sm:pt-0"><button type="button" onClick={() => handleAddIssue(values, setFieldValue)} className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed" disabled={!values.newIssue.trim() || (!!errors.newSeverity && values.newIssue.trim())}><PlusIcon className="h-5 w-5 mr-1"/> Add</button></div>
                    </div>
                    {values.issuesAndRisks.length > 0 ? ( <div className="mt-4 border border-gray-200 rounded-md shadow-sm"><ul role="list" className="divide-y divide-gray-200">{values.issuesAndRisks.map((issue, index) => ( <li key={index} className="flex items-center justify-between py-3 pl-4 pr-3 text-sm hover:bg-gray-50 transition-colors"><div className="flex-1 flex items-center min-w-0"><span className={`flex-shrink-0 px-2 inline-flex text-xs leading-5 font-semibold rounded-full mr-3 capitalize ${ issue.severity === 'high' ? 'bg-red-100 text-red-800' : issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{issue.severity}</span><span className="flex-1 w-0 truncate" title={issue.description}>{issue.description}</span></div><div className="ml-4 flex-shrink-0"><button type="button" onClick={() => handleRemoveIssue(index, values, setFieldValue)} className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500" title="Remove issue"><XMarkIcon className="h-5 w-5" /></button></div></li> ))}</ul></div> ) : ( <p className="text-sm text-gray-500 mt-2 italic">No specific issues/risks highlighted for the committee yet.</p> )}
                </div>

                {/* Section 4: Attachments (remains the same) */}
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Supporting Attachments (Optional)</h3>
                    {/* (Attachment markup remains the same) */}
                     <div>
                        <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 sr-only">Attach Files (Max 5 files, 10MB each)</label>
                        <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${isSubmitting ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300 hover:border-indigo-400'}`}>
                            <div className="space-y-1 text-center">
                                <PaperClipIcon className="mx-auto h-10 w-10 text-gray-400" />
                                <div className="flex text-sm text-gray-600 justify-center">
                                    <label htmlFor="file-upload" className={`relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 ${isSubmitting || selectedFiles.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}><span>Upload files</span><input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} disabled={isSubmitting || selectedFiles.length >= 5} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.csv"/></label>
                                    <p className="pl-1 hidden sm:inline">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">Max 5 files. Docs, spreadsheets, presentations, images up to 10MB each.</p>
                            </div>
                        </div>
                        {selectedFiles.length > 0 && (
                            <div className="mt-4 border border-gray-200 rounded-md shadow-sm">
                                <h4 className="sr-only">Files selected</h4>
                                <ul role="list" className="divide-y divide-gray-200">
                                    {selectedFiles.map((file, index) => ( <li key={`${file.name}-${index}`} className="flex items-center justify-between py-3 pl-4 pr-3 text-sm hover:bg-gray-50 transition-colors"><div className="flex-1 flex items-center min-w-0"><PaperClipIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" aria-hidden="true" /><span className="flex-1 w-0 truncate font-medium" title={file.name}>{file.name}</span><span className="text-gray-500 ml-2 flex-shrink-0">{(file.size / 1024 / 1024).toFixed(2)} MB</span></div><div className="ml-4 flex-shrink-0"><button type="button" onClick={() => handleRemoveFile(index)} className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500" title={`Remove file: ${file.name}`} disabled={isSubmitting}><XMarkIcon className="h-5 w-5" /></button></div></li> ))}
                                </ul>
                                {selectedFiles.length >= 5 && ( <p className="text-xs text-center text-yellow-700 bg-yellow-50 py-1 border-t border-gray-200">Maximum 5 files reached.</p> )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Form Actions Footer */}
                <div className="px-4 py-4 sm:px-6 flex justify-end items-center space-x-3 bg-gray-50 rounded-b-lg">
                  <button type="button" onClick={() => navigate("/admin/reports")} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50" disabled={isSubmitting}>Cancel</button>
                  <button type="submit" disabled={isSubmitting || !isValid || !dirty || isLoadingProjects || noSuitableProjects} className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-indigo-400 disabled:cursor-not-allowed">
                    {isSubmitting ? ( <><ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" /> Submitting...</> ) : ( <><DocumentTextIcon className="h-5 w-5 mr-2" /> Submit Committee Report</> )}
                  </button>
                </div>
              </fieldset>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  )
}

export default CreateAdminReport