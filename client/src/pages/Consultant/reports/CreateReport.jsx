
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
} from "@heroicons/react/24/outline";
import authAPI from "../../../api/auth";
import reportsAPI from "../../../api/reports";
import projectsAPI from "../../../api/projects";

const TYPES_REQUIRING_DATES = [
  "progress",
  "monthly_progress",
  "weekly_progress",
  "daily_log",
  "schedule_adherence",
];

// Helper function to format dates (if needed)
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
const formatDateForDisplay = (date) => {
  return new Date(date).toLocaleDateString("en-CA");
};

const getValidationSchema = (availableProjects) =>
  Yup.object({
    title: Yup.string().required("Title is required").max(150, "Title cannot exceed 150 characters"),
    summary: Yup.string().required("Report summary is required"),
    project: Yup.string().required("Project is required"),
    type: Yup.string()
      .required("Report type is required")
      .oneOf([
        'progress', 'monthly_progress', 'weekly_progress', 'daily_log',
        'material_usage', 'schedule_adherence', 'issue_summary', 'financial', 'custom'
      ], 'Invalid report type'),
    periodStartDate: Yup.date().when("type", {
      is: (type) => TYPES_REQUIRING_DATES.includes(type),
      then: (schema) => schema.required("Start date is required for this report type").nullable(),
      otherwise: (schema) => schema.optional().nullable(),
    }),
    periodEndDate: Yup.date().when("type", {
      is: (type) => TYPES_REQUIRING_DATES.includes(type),
      then: (schema) =>
        schema.required("End date is required for this report type")
          .nullable()
          .min(Yup.ref("periodStartDate"), "End date must be on or after start date"),
      otherwise: (schema) => schema.optional().nullable(),
    }),
    newIssue: Yup.string(),
    newSeverity: Yup.string().when('newIssue', {
      is: (val) => val && val.trim().length > 0,
      then: (schema) => schema.required("Severity is required when adding an issue").oneOf(['low', 'medium', 'high']),
      otherwise: (schema) => schema.notRequired(),
    }),
  });

const CreateReport = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConsultant, setIsConsultant] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]); // For file uploads
  const currentUser = authAPI.getCurrentUser();

  useEffect(() => {
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
    }
  }, [currentUser, navigate]);

  // Fetch projects assigned to the consultant
  const {
    data: projectsData,
    isLoading: isLoadingProjects,
    error: projectsError,
  } = useQuery({
    queryKey: ["consultant-projects", currentUser?._id],
    queryFn: () => projectsAPI.getProjectsByConsultant(currentUser?._id),
    enabled: !!currentUser?._id && isConsultant,
  });

  const availableProjects =
    projectsData?.data?.projects?.map((p) => ({
      ...p,
      startDate: p.startDate ? new Date(p.startDate) : null,
      endDate: p.endDate ? new Date(p.endDate) : null,
    })) || [];

  // File Handling
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (selectedFiles.length + files.length > 5) {
      toast.error("You can upload a maximum of 5 files.");
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

  const validationSchema = getValidationSchema(availableProjects);

  // Create report mutation
  const createReportMutation = useMutation({
    mutationFn: (reportData) => reportsAPI.createReport(reportData),
    onSuccess: (data) => {
      toast.success(`Report "${data?.data?.title || ""}" created successfully`);
      queryClient.invalidateQueries({ queryKey: ["consultant-reports"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      navigate("/reports");
    },
    onError: (error) => {
      console.error("Report creation error:", error);
      toast.error(error?.message || "Failed to create report. Please check the details and try again.");
      setIsSubmitting(false);
    },
  });

  // Updated handleSubmit: include JSON.stringify for issuesAndRisks
  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    const { newIssue, newSeverity, ...reportDataFromForm } = values;

    const reportDataToSend = {
      ...reportDataFromForm,
      attachments: selectedFiles, // Pass File objects directly
    };

    const requiresDates = TYPES_REQUIRING_DATES.includes(reportDataToSend.type);
    if (!requiresDates) {
      delete reportDataToSend.periodStartDate;
      delete reportDataToSend.periodEndDate;
    } else {
      reportDataToSend.periodStartDate = reportDataToSend.periodStartDate || null;
      reportDataToSend.periodEndDate = reportDataToSend.periodEndDate || null;
    }

    // Stringify the issuesAndRisks array so it’s correctly transmitted
    reportDataToSend.issuesAndRisks = JSON.stringify(reportDataToSend.issuesAndRisks);

    console.log("Submitting Report Data (including files):", reportDataToSend);
    createReportMutation.mutate(reportDataToSend, {
      onSettled: () => {
        setIsSubmitting(false);
      }
    });
  };

  const handleAddIssue = (values, setFieldValue) => {
    const description = values.newIssue.trim();
    const severity = values.newSeverity;
    if (description) {
      const isDuplicate = values.issuesAndRisks.some(
        (issue) => issue.description === description
      );
      if (isDuplicate) {
        toast.warn("This issue has already been added.");
        return;
      }
      setFieldValue("issuesAndRisks", [
        ...values.issuesAndRisks,
        { description, severity },
      ]);
      setFieldValue("newIssue", "");
      setFieldValue("newSeverity", "medium");
    } else {
      toast.info("Please enter an issue description.");
    }
  };

  const handleRemoveIssue = (index, values, setFieldValue) => {
    const updatedIssues = values.issuesAndRisks.filter((_, i) => i !== index);
    setFieldValue("issuesAndRisks", updatedIssues);
  };

  const handleTypeChange = (e, setFieldValue, values) => {
    const newType = e.target.value;
    setFieldValue("type", newType);
    const requiresDates = TYPES_REQUIRING_DATES.includes(newType);
    if (!requiresDates) {
      if (values.periodStartDate) setFieldValue("periodStartDate", "");
      if (values.periodEndDate) setFieldValue("periodEndDate", "");
    }
  };

  if (!isConsultant && !currentUser) {
    return <div className="p-4 text-center">Loading user data...</div>;
  }
  if (!isConsultant && currentUser) {
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
            initialValues={{
              title: "",
              summary: "",
              project: "",
              type: "progress",
              periodStartDate: "",
              periodEndDate: "",
              issuesAndRisks: [],
              attachments: [],
              newIssue: "",
              newSeverity: "medium",
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            validateOnChange={true}
            validateOnBlur={true}
          >
            {({ errors, touched, values, setFieldValue, dirty, isValid }) => (
              <Form className="space-y-8">
                {/* Report Details Section */}
                <fieldset className="space-y-6 border-b border-gray-200 pb-6">
                  <legend className="text-lg font-medium text-gray-900 mb-4">Report Details</legend>
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
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

                    <div className="sm:col-span-3">
                      <label htmlFor="project" className="block text-sm font-medium text-gray-700">
                        Project <span className="text-red-500">*</span>
                      </label>
                      <Field
                        as="select"
                        name="project"
                        id="project"
                        className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                          errors.project && touched.project ? "border-red-500" : ""
                        }`}
                        disabled={isLoadingProjects || !projectsData?.data?.projects?.length}
                      >
                        <option value="">{isLoadingProjects ? "Loading..." : "Select a project"}</option>
                        {projectsData?.data?.projects?.map((project) => (
                          <option key={project._id} value={project._id}>
                            {project.projectName} ({project.projectCode || "No Code"})
                          </option>
                        ))}
                      </Field>
                      {projectsError && (
                        <p className="mt-1 text-sm text-red-600">
                          Error loading projects: {projectsError.message}
                        </p>
                      )}
                      {!isLoadingProjects && !projectsData?.data?.projects?.length && !projectsError && (
                        <p className="mt-1 text-sm text-gray-500">No projects assigned to you.</p>
                      )}
                      <ErrorMessage name="project" component="p" className="mt-1 text-sm text-red-600" />
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                        Report Type <span className="text-red-500">*</span>
                      </label>
                      <Field
                        as="select"
                        name="type"
                        id="type"
                        className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                          errors.type && touched.type ? "border-red-500" : ""
                        }`}
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

                    {["progress", "monthly_progress", "weekly_progress", "daily_log", "schedule_adherence"].includes(values.type) && (
                      <>
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
                            max={values.periodEndDate || undefined}
                          />
                          <ErrorMessage name="periodStartDate" component="p" className="mt-1 text-sm text-red-600" />
                        </div>

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
                            min={values.periodStartDate || undefined}
                          />
                          <ErrorMessage name="periodEndDate" component="p" className="mt-1 text-sm text-red-600" />
                        </div>
                      </>
                    )}
                  </div>
                </fieldset>

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
                      rows={8}
                      placeholder="Provide a detailed summary of activities, progress, observations, or findings for the reporting period..."
                      className={`mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.summary && touched.summary ? "border-red-500" : ""
                      }`}
                    />
                    <ErrorMessage name="summary" component="p" className="mt-1 text-sm text-red-600" />
                  </div>
                </fieldset>

                <fieldset className="space-y-6 border-b border-gray-200 pb-6">
                  <legend className="text-lg font-medium text-gray-900 mb-4">Issues and Risks</legend>
                  <div className="space-y-4">
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
                          className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                            errors.newSeverity && touched.newSeverity ? "border-red-500" : ""
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
                        disabled={!values.newIssue.trim()}
                      >
                        <PlusIcon className="h-5 w-5 mr-1" />
                        Add
                      </button>
                    </div>
                    {values.issuesAndRisks.length > 0 ? (
                      <div className="mt-4 border border-gray-200 rounded-md overflow-hidden">
                        <ul className="divide-y divide-gray-200">
                          {values.issuesAndRisks.map((issue, index) => (
                            <li
                              key={index}
                              className="flex items-center justify-between py-3 pl-4 pr-3 text-sm hover:bg-gray-50"
                            >
                              <div className="flex-1 flex items-center">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full mr-3 ${
                                    issue.severity === "high"
                                      ? "bg-red-100 text-red-800"
                                      : issue.severity === "medium"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
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
                                  <XMarkIcon className="h-5 w-5" />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mt-2">No issues or risks added yet.</p>
                    )}
                  </div>
                </fieldset>

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
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF, PDF, DOCX, XLSX up to 10MB each</p>
                      </div>
                    </div>
                    {selectedFiles.length > 0 && (
                      <div className="mt-4 border border-gray-200 rounded-md overflow-hidden">
                        <ul className="divide-y divide-gray-200">
                          {selectedFiles.map((file, index) => (
                            <li key={index} className="flex items-center justify-between py-3 pl-4 pr-3 text-sm hover:bg-gray-50">
                              <div className="flex-1 flex items-center min-w-0">
                                <PaperClipIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" aria-hidden="true" />
                                <span className="flex-1 w-0 truncate font-medium">{file.name}</span>
                                <span className="text-gray-500 ml-2 flex-shrink-0">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                              </div>
                              <div className="ml-4 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(index)}
                                  className="font-medium text-red-600 hover:text-red-500"
                                  title="Remove file"
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
                </fieldset>

                <div className="flex justify-end pt-5 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => navigate("/reports")}
                    className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !dirty || !isValid}
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                      isSubmitting || !dirty || !isValid ? "bg-indigo-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
