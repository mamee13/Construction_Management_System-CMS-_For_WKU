 /*eslint-disable  */


// src/components/Reports/CreateReport.jsx
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
} from "@heroicons/react/24/outline";
import authAPI from "../../../api/auth";
import reportsAPI from "../../../api/reports";
import projectsAPI from "../../../api/projects";
// Assuming you have an upload API (even if just mocked for now)
// import uploadAPI from "../../../api/upload"; // You'd need this for real uploads

const CreateReport = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConsultant, setIsConsultant] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]); // For handling file uploads
  const currentUser = authAPI.getCurrentUser();

  useEffect(() => {
    // Check if user is a consultant
    const checkConsultant = () => {
      const userRole = currentUser?.role;
      setIsConsultant(userRole === "consultant");

      if (userRole !== "consultant") {
        toast.warn("Access denied. Only consultants can create reports.");
        navigate("/dashboard");
      }
    };

    if (currentUser) {
        checkConsultant();
    } else {
        // Handle case where currentUser is not yet loaded or user is not logged in
        // Might want to redirect to login or show a loading state
        // For now, assuming auth context handles this upstream
    }
  }, [currentUser, navigate]);

  // Fetch projects for dropdown - only projects assigned to this consultant
  const {
    data: projectsData,
    isLoading: isLoadingProjects,
    error: projectsError,
  } = useQuery({
    queryKey: ["consultant-projects", currentUser?._id], // Include user ID in key
    queryFn: () => projectsAPI.getProjectsByConsultant(currentUser?._id),
    enabled: !!currentUser?._id && isConsultant, // Enable only if ID exists and user is consultant
  });

  // --- File Handling ---
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    // Basic validation (example: limit number of files)
    if (selectedFiles.length + files.length > 5) {
      toast.error("You can upload a maximum of 5 files.");
      return;
    }
    // Add unique files only
    const newFiles = files.filter(file => !selectedFiles.some(sf => sf.name === file.name && sf.size === file.size));
    setSelectedFiles((prevFiles) => [...prevFiles, ...newFiles]);
    // Clear the input value so the same file can be selected again if removed
    event.target.value = null;
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };
  // --- End File Handling ---


  // Create report mutation
  const createReportMutation = useMutation({
    mutationFn: (reportData) => reportsAPI.createReport(reportData),
    onSuccess: (data) => {
      toast.success(`Report "${data?.data?.title || ''}" created successfully`);
      queryClient.invalidateQueries({ queryKey: ["consultant-reports"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] }); // Invalidate general reports list too
      navigate("/reports");
    },
    onError: (error) => {
      console.error("Report creation error:", error);
      toast.error(error?.message || "Failed to create report. Please check the details and try again.");
      setIsSubmitting(false); // Re-enable form on error
    },
    // Removed onSettled: setIsSubmitting(false) - onSuccess/onError handle this
  });

  // Validation schema - updated for new fields
  const validationSchema = Yup.object({
    title: Yup.string().required("Title is required").max(150, "Title cannot exceed 150 characters"),
    summary: Yup.string().required("Report summary is required"),
    project: Yup.string().required("Project is required"),
    type: Yup.string().required("Report type is required").oneOf([
      'progress', 'monthly_progress', 'weekly_progress', 'daily_log',
      'material_usage', 'schedule_adherence', 'issue_summary', 'financial', 'custom'
    ], 'Invalid report type'),
    periodStartDate: Yup.date().when("type", {
      is: (type) => ["progress", "monthly_progress", "weekly_progress", "daily_log", "schedule_adherence"].includes(type),
      then: (schema) => schema.required("Start date is required for this report type"),
      otherwise: (schema) => schema.nullable(), // Make optional otherwise
    }),
    periodEndDate: Yup.date().when("type", {
      is: (type) => ["progress", "monthly_progress", "weekly_progress", "daily_log", "schedule_adherence"].includes(type),
      then: (schema) =>
        schema
          .required("End date is required for this report type")
          .min(Yup.ref("periodStartDate"), "End date must be on or after start date"),
       otherwise: (schema) => schema.nullable(), // Make optional otherwise
    }),
    // Validation for the temporary fields used to add issues
    newIssue: Yup.string(), // No longer required here, logic handles empty adds
    newSeverity: Yup.string().when('newIssue', { // Only validate severity if issue text exists
        is: (val) => val && val.trim().length > 0,
        then: (schema) => schema.required('Severity is required when adding an issue').oneOf(['low', 'medium', 'high']),
        otherwise: (schema) => schema.notRequired(),
    }),
    // Note: No direct validation for issuesAndRisks array elements here, handled by add logic
    // Note: No validation for attachments here, usually handled server-side during upload
  });

  // Initial form values - updated for new structure
  const initialValues = {
    title: "",
    summary: "",
    project: "",
    type: "progress", // Default type
    periodStartDate: "",
    periodEndDate: "",
    issuesAndRisks: [], // Now stores objects: { description: string, severity: string }
    attachments: [], // Will store file info: { fileName: string, url: string }
    // Temporary fields for adding issues/risks
    newIssue: "",
    newSeverity: "medium", // Default severity
  };

  // Handle form submission
  const handleSubmit = async (values) => { // Make async for potential file upload step
    setIsSubmitting(true);

    // --- Simulate File Upload Step ---
    // In a real app, this is where you'd upload `selectedFiles`
    // and get back URLs or identifiers.
    const uploadedAttachments = await Promise.all(
        selectedFiles.map(async (file) => {
             console.log(`Simulating upload for: ${file.name}`);
            // const formData = new FormData();
            // formData.append('file', file);
            // try {
            //   const uploadResponse = await uploadAPI.uploadFile(formData);
            //   return { fileName: file.name, url: uploadResponse.data.url }; // Adjust based on your API response
            // } catch (uploadError) {
            //    console.error(`Failed to upload ${file.name}:`, uploadError);
            //    toast.error(`Failed to upload ${file.name}`);
            //    return null; // Indicate failure
            // }

            // ** SIMULATED **
            await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
            return { fileName: file.name, url: `/uploads/simulated/${Date.now()}/${file.name}` };
        })
    );

    const successfulAttachments = uploadedAttachments.filter(att => att !== null);

    // Optional: Check if any uploads failed and decide whether to proceed
    // if (successfulAttachments.length !== selectedFiles.length) {
    //     toast.warn("Some files failed to upload. Report submitted without them.");
    // }
     // --- End Simulate File Upload Step ---


    // Prepare data for the API, exclude temporary fields
    const { newIssue, newSeverity, ...reportData } = values;

    // Add consultant ID and successful attachments
    reportData.generatedBy = currentUser._id;
    reportData.attachments = successfulAttachments; // Add the (simulated) uploaded file info

    // **Important:** Ensure date fields are formatted correctly if backend expects ISO strings
    // Formik usually handles this, but double-check if issues arise.
    // Example:
    // if (reportData.periodStartDate) reportData.periodStartDate = new Date(reportData.periodStartDate).toISOString();
    // if (reportData.periodEndDate) reportData.periodEndDate = new Date(reportData.periodEndDate).toISOString();

    // Remove date fields if they are empty string or null, and not required by type
    const requiresDates = ["progress", "monthly_progress", "weekly_progress", "daily_log", "schedule_adherence"].includes(reportData.type);
    if (!requiresDates) {
        delete reportData.periodStartDate;
        delete reportData.periodEndDate;
    } else {
        // Ensure dates are sent if required, even if currently null/empty (validation should catch this)
        reportData.periodStartDate = reportData.periodStartDate || null;
        reportData.periodEndDate = reportData.periodEndDate || null;
    }


    console.log("Submitting Report Data:", reportData);
    createReportMutation.mutate(reportData);
  };

  // Handle adding a new issue - now adds an object
  const handleAddIssue = (values, setFieldValue) => {
    const description = values.newIssue.trim();
    const severity = values.newSeverity;
    if (description) {
        // Check for duplicates (optional)
        const isDuplicate = values.issuesAndRisks.some(issue => issue.description === description);
        if (isDuplicate) {
            toast.warn("This issue has already been added.");
            return;
        }

        setFieldValue("issuesAndRisks", [
            ...values.issuesAndRisks,
            { description, severity },
        ]);
        // Reset temporary fields
        setFieldValue("newIssue", "");
        setFieldValue("newSeverity", "medium"); // Reset severity to default
    } else {
        toast.info("Please enter an issue description.");
    }
  };

  // Handle removing an issue
  const handleRemoveIssue = (index, values, setFieldValue) => {
    const updatedIssues = values.issuesAndRisks.filter((_, i) => i !== index);
    setFieldValue("issuesAndRisks", updatedIssues);
  };

  // Effect to clear date fields if type changes
  const handleTypeChange = (e, setFieldValue, values) => {
    const newType = e.target.value;
    setFieldValue('type', newType); // Update the type field

    const requiresDates = ["progress", "monthly_progress", "weekly_progress", "daily_log", "schedule_adherence"].includes(newType);
    if (!requiresDates) {
        if (values.periodStartDate) setFieldValue('periodStartDate', '');
        if (values.periodEndDate) setFieldValue('periodEndDate', '');
    }
  }


  // Prevent rendering if user role check hasn't completed or isn't consultant
  if (!isConsultant && !currentUser) {
      return <div className="p-4 text-center">Loading user data...</div>; // Or a spinner
  }
  if (!isConsultant && currentUser) {
      // The useEffect should have navigated away, but this is a fallback.
      return <div className="p-4 text-center text-red-600">Access Denied. Redirecting...</div>;
  }


  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Create New Report</h1>
          <p className="text-gray-500 text-sm">Submit a new report for a project you're consulting on.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/reports")}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Reports
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            // Enable validation on change and blur for better UX
            validateOnChange={true}
            validateOnBlur={true}
          >
            {({ errors, touched, values, setFieldValue, dirty, isValid }) => (
              <Form className="space-y-8"> {/* Increased spacing */}
                {/* Basic Info Section */}
                <fieldset className="space-y-6 border-b border-gray-200 pb-6">
                    <legend className="text-lg font-medium text-gray-900 mb-4">Report Details</legend>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        {/* Report Title */}
                        <div className="sm:col-span-6">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Report Title <span className="text-red-500">*</span>
                            </label>
                            <Field
                                type="text"
                                name="title"
                                id="title"
                                placeholder="e.g., Weekly Progress - Phase 1 Foundation"
                                className={`mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                                errors.title && touched.title ? "border-red-500" : ""
                                }`}
                            />
                            <ErrorMessage name="title" component="p" className="mt-1 text-sm text-red-600" />
                        </div>

                        {/* Project */}
                        <div className="sm:col-span-3">
                            <label htmlFor="project" className="block text-sm font-medium text-gray-700">
                            Project <span className="text-red-500">*</span>
                            </label>
                            <Field
                                as="select"
                                name="project"
                                id="project"
                                className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${
                                errors.project && touched.project ? "border-red-500" : ""
                                }`}
                                disabled={isLoadingProjects || !projectsData?.data?.projects?.length}
                            >
                                <option value="">{isLoadingProjects ? "Loading..." : "Select a project"}</option>
                                {projectsData?.data?.projects?.map((project) => (
                                <option key={project._id} value={project._id}>
                                    {project.projectName} ({project.projectCode || 'No Code'})
                                </option>
                                ))}
                            </Field>
                            {projectsError && (
                                <p className="mt-1 text-sm text-red-600">Error loading projects: {projectsError.message}</p>
                            )}
                            {!isLoadingProjects && !projectsData?.data?.projects?.length && !projectsError && (
                                <p className="mt-1 text-sm text-gray-500">No projects assigned to you.</p>
                            )}
                            <ErrorMessage name="project" component="p" className="mt-1 text-sm text-red-600" />
                        </div>

                        {/* Report Type */}
                        <div className="sm:col-span-3">
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                            Report Type <span className="text-red-500">*</span>
                            </label>
                            <Field
                                as="select"
                                name="type"
                                id="type"
                                className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${
                                errors.type && touched.type ? "border-red-500" : ""
                                }`}
                                // Use custom onChange to handle side effects
                                onChange={(e) => handleTypeChange(e, setFieldValue, values)}
                            >
                                <option value="progress">Progress Report</option>
                                <option value="monthly_progress">Monthly Progress Report</option>
                                <option value="weekly_progress">Weekly Progress Report</option>
                                <option value="daily_log">Daily Log</option>
                                <option value="material_usage">Material Usage Report</option>
                                <option value="schedule_adherence">Schedule Adherence Report</option>
                                <option value="issue_summary">Issue Summary</option>
                                <option value="financial">Financial Report</option>
                                <option value="custom">Custom Report</option>
                            </Field>
                            <ErrorMessage name="type" component="p" className="mt-1 text-sm text-red-600" />
                        </div>

                         {/* Conditional Period Dates */}
                        {(["progress", "monthly_progress", "weekly_progress", "daily_log", "schedule_adherence"].includes(values.type)) && (
                        <>
                            {/* Period Start Date */}
                            <div className="sm:col-span-3">
                                <label htmlFor="periodStartDate" className="block text-sm font-medium text-gray-700">
                                    Period Start Date <span className="text-red-500">*</span>
                                </label>
                                <Field
                                type="date"
                                name="periodStartDate"
                                id="periodStartDate"
                                className={`mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                                    errors.periodStartDate && touched.periodStartDate ? "border-red-500" : ""
                                }`}
                                max={values.periodEndDate || undefined} // Prevent start date after end date visually
                                />
                                <ErrorMessage name="periodStartDate" component="p" className="mt-1 text-sm text-red-600" />
                            </div>

                            {/* Period End Date */}
                            <div className="sm:col-span-3">
                                <label htmlFor="periodEndDate" className="block text-sm font-medium text-gray-700">
                                    Period End Date <span className="text-red-500">*</span>
                                </label>
                                <Field
                                type="date"
                                name="periodEndDate"
                                id="periodEndDate"
                                className={`mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                                    errors.periodEndDate && touched.periodEndDate ? "border-red-500" : ""
                                }`}
                                min={values.periodStartDate || undefined} // Prevent end date before start date visually
                                />
                                <ErrorMessage name="periodEndDate" component="p" className="mt-1 text-sm text-red-600" />
                            </div>
                        </>
                        )}
                    </div>
                </fieldset>

                {/* Summary Section */}
                 <fieldset className="space-y-6 border-b border-gray-200 pb-6">
                    <legend className="text-lg font-medium text-gray-900 mb-4">Summary & Content</legend>
                    <div className="sm:col-span-6">
                        <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
                        Report Summary <span className="text-red-500">*</span>
                        </label>
                        <Field
                            as="textarea"
                            name="summary"
                            id="summary"
                            rows={8} // Slightly reduced rows
                            placeholder="Provide a detailed summary of activities, progress, observations, or findings for the reporting period..."
                            className={`mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                            errors.summary && touched.summary ? "border-red-500" : ""
                            }`}
                        />
                        <ErrorMessage name="summary" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                 </fieldset>

                 {/* Issues and Risks Section - Updated */}
                 <fieldset className="space-y-6 border-b border-gray-200 pb-6">
                    <legend className="text-lg font-medium text-gray-900 mb-4">Issues and Risks</legend>
                    <div className="space-y-4">
                        {/* Input for adding new issue */}
                        <div className="flex items-end gap-x-3">
                            <div className="flex-grow">
                                <label htmlFor="newIssue" className="block text-sm font-medium text-gray-700">
                                    Add Issue/Risk Description
                                </label>
                                <Field
                                    type="text"
                                    name="newIssue"
                                    id="newIssue"
                                    placeholder="Describe an issue or potential risk..."
                                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <ErrorMessage name="newIssue" component="p" className="mt-1 text-sm text-red-600" />
                            </div>
                            <div className="w-40">
                                <label htmlFor="newSeverity" className="block text-sm font-medium text-gray-700">
                                    Severity
                                </label>
                                <Field
                                    as="select"
                                    name="newSeverity"
                                    id="newSeverity"
                                    className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${
                                        errors.newSeverity && touched.newSeverity ? "border-red-500" : "" // Added touch check
                                    }`}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </Field>
                                <ErrorMessage name="newSeverity" component="p" className="mt-1 text-sm text-red-600" />
                            </div>
                            <button
                                type="button"
                                onClick={() => handleAddIssue(values, setFieldValue)}
                                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 whitespace-nowrap"
                                disabled={!values.newIssue.trim()} // Disable if description is empty
                            >
                                <PlusIcon className="h-5 w-5 mr-1"/> Add
                            </button>
                        </div>

                         {/* List of added issues */}
                        {values.issuesAndRisks.length > 0 && (
                            <div className="mt-4 border border-gray-200 rounded-md overflow-hidden">
                                <ul className="divide-y divide-gray-200">
                                {values.issuesAndRisks.map((issue, index) => (
                                    <li key={index} className="flex items-center justify-between py-3 pl-4 pr-3 text-sm hover:bg-gray-50">
                                    <div className="flex-1 flex items-center">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full mr-3 ${
                                            issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                                            issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                            {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                                        </span>
                                        <span className="flex-1 w-0 truncate">{issue.description}</span>
                                    </div>
                                    <div className="ml-4 flex-shrink-0">
                                        <button
                                        type="button"
                                        onClick={() => handleRemoveIssue(index, values, setFieldValue)}
                                        className="font-medium text-red-600 hover:text-red-500"
                                        title="Remove issue"
                                        >
                                            <XMarkIcon className="h-5 w-5"/>
                                        </button>
                                    </div>
                                    </li>
                                ))}
                                </ul>
                            </div>
                        )}
                        {values.issuesAndRisks.length === 0 && (
                            <p className="text-sm text-gray-500 mt-2">No issues or risks added yet.</p>
                        )}
                    </div>
                 </fieldset>

                 {/* Attachments Section - NEW */}
                 <fieldset className="space-y-6">
                    <legend className="text-lg font-medium text-gray-900 mb-4">Attachments</legend>
                    <div>
                        <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
                            Attach Files (Max 5 files)
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                            <PaperClipIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                                <label
                                htmlFor="file-upload"
                                className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                                >
                                <span>Upload files</span>
                                <input
                                    id="file-upload"
                                    name="file-upload"
                                    type="file"
                                    className="sr-only"
                                    multiple
                                    onChange={handleFileChange}
                                    // Consider adding 'accept' attribute for specific file types
                                    // accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                                />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF, PDF, DOCX, XLSX up to 10MB each</p>
                            </div>
                        </div>

                        {/* List of selected files */}
                        {selectedFiles.length > 0 && (
                            <div className="mt-4 border border-gray-200 rounded-md overflow-hidden">
                                <ul className="divide-y divide-gray-200">
                                {selectedFiles.map((file, index) => (
                                    <li key={index} className="flex items-center justify-between py-3 pl-4 pr-3 text-sm hover:bg-gray-50">
                                        <div className="flex-1 flex items-center min-w-0">
                                            <PaperClipIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" aria-hidden="true" />
                                            <span className="flex-1 w-0 truncate font-medium">{file.name}</span>
                                            <span className="text-gray-500 ml-2 flex-shrink-0">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                        <div className="ml-4 flex-shrink-0">
                                            <button
                                            type="button"
                                            onClick={() => handleRemoveFile(index)}
                                            className="font-medium text-red-600 hover:text-red-500"
                                            title="Remove file"
                                            >
                                            <XMarkIcon className="h-5 w-5"/>
                                            </button>
                                        </div>
                                    </li>
                                ))}
                                </ul>
                             </div>
                        )}
                    </div>
                 </fieldset>


                {/* Submit Button */}
                <div className="flex justify-end pt-5 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => navigate("/reports")}
                    className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    disabled={isSubmitting} // Also disable cancel when submitting
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !dirty || !isValid} // Disable if submitting, form pristine, or invalid
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white
                    ${
                      isSubmitting || !dirty || !isValid
                        ? "bg-indigo-300 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <DocumentTextIcon className="h-5 w-5 mr-2" />
                        Submit Report
                      </>
                    )}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default CreateReport;