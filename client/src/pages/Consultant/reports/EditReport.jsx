/*eslint-disable */
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { toast } from "react-toastify"
import { ArrowPathIcon, DocumentTextIcon, ArrowLeftIcon } from "@heroicons/react/24/outline"
import authAPI from "../../../api/auth"
import reportsAPI from "../../../api/reports"
import projectsAPI from "../../../api/projects"

const EditReport = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConsultant, setIsConsultant] = useState(false)
  const currentUser = authAPI.getCurrentUser()

  useEffect(() => {
    // Check if user is a consultant
    const checkConsultant = () => {
      const userRole = currentUser?.role
      setIsConsultant(userRole === "consultant")

      if (userRole !== "consultant") {
        navigate("/dashboard")
      }
    }

    checkConsultant()
  }, [currentUser, navigate])

  // Fetch report data
  const {
    data: reportData,
    isLoading: isLoadingReport,
    error: reportError,
  } = useQuery({
    queryKey: ["report", id],
    queryFn: () => reportsAPI.getReportById(id),
    enabled: !!id && isConsultant,
  })

  // Fetch projects for dropdown
  const {
    data: projectsData,
    isLoading: isLoadingProjects,
    error: projectsError,
  } = useQuery({
    queryKey: ["consultant-projects"],
    queryFn: () => projectsAPI.getProjectsByConsultant(currentUser?._id),
    enabled: !!currentUser?._id && isConsultant,
  })

  // Update report mutation
  const updateReportMutation = useMutation({
    mutationFn: (reportData) => reportsAPI.updateReport(id, reportData),
    onSuccess: () => {
      toast.success("Report updated successfully")
      queryClient.invalidateQueries({ queryKey: ["consultant-reports"] })
      queryClient.invalidateQueries({ queryKey: ["report", id] })
      navigate("/reports")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update report")
      setIsSubmitting(false)
    },
  })

  // Validation schema
  const validationSchema = Yup.object({
    title: Yup.string().required("Title is required").max(100, "Title cannot exceed 100 characters"),
    summary: Yup.string().required("Report summary is required"),
    project: Yup.string().required("Project is required"),
    type: Yup.string().required("Report type is required"),
    periodStartDate: Yup.date().when("type", {
      is: (type) => ["monthly_progress", "weekly_progress", "progress"].includes(type),
      then: (schema) => schema.required("Start date is required for progress reports"),
    }),
    periodEndDate: Yup.date().when("type", {
      is: (type) => ["monthly_progress", "weekly_progress", "progress"].includes(type),
      then: (schema) =>
        schema
          .required("End date is required for progress reports")
          .min(Yup.ref("periodStartDate"), "End date must be after start date"),
    }),
  })

  // Handle form submission
  const handleSubmit = (values, { setSubmitting }) => {
    setIsSubmitting(true)

    // Filter out the newIssue field which is just for UI
    const { newIssue, ...reportData } = values

    // Add consultant ID to the report data
    reportData.generatedBy = currentUser._id

    updateReportMutation.mutate(reportData)
  }

  // Handle adding a new issue
  const handleAddIssue = (values, setFieldValue) => {
    if (values.newIssue.trim()) {
      setFieldValue("issuesAndRisks", [...values.issuesAndRisks, values.newIssue.trim()])
      setFieldValue("newIssue", "")
    }
  }

  // Handle removing an issue
  const handleRemoveIssue = (index, values, setFieldValue) => {
    const updatedIssues = [...values.issuesAndRisks]
    updatedIssues.splice(index, 1)
    setFieldValue("issuesAndRisks", updatedIssues)
  }

  if (!isConsultant) {
    return null
  }

  if (isLoadingReport) {
    return (
      <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <ArrowPathIcon className="h-10 w-10 text-indigo-500 animate-spin" />
          <span className="ml-2 text-lg text-gray-700">Loading report data...</span>
        </div>
      </div>
    )
  }

  if (reportError) {
    return (
      <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">Error loading report: {reportError.message}</p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => navigate("/reports")}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Go back to reports
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const report = reportData?.data || {}

  // Check if the report belongs to the current consultant
  if (report.generatedBy !== currentUser?._id) {
    return (
      <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">You do not have permission to edit this report.</p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => navigate("/reports")}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Go back to reports
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Check if the report is in editable status (draft or pending)
  if (report.status !== "draft" && report.status !== "pending") {
    return (
      <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                This report cannot be edited because it has already been{" "}
                {reportsAPI.getReportStatusLabel(report.status).toLowerCase()}.
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => navigate("/reports")}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Go back to reports
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const initialValues = {
    title: report.title || "",
    summary: report.summary || "",
    project: report.project?._id || report.project || "",
    type: report.type || "progress",
    periodStartDate: report.periodStartDate ? new Date(report.periodStartDate).toISOString().split("T")[0] : "",
    periodEndDate: report.periodEndDate ? new Date(report.periodEndDate).toISOString().split("T")[0] : "",
    issuesAndRisks: report.issuesAndRisks || [],
    newIssue: "", // For adding issues
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Edit Report</h1>
          <p className="text-gray-500 text-sm">Update your existing report.</p>
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
            validateOnChange={false}
            validateOnBlur={true}
            enableReinitialize={true}
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form className="space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                  {/* Report Title */}
                  <div className="sm:col-span-2">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Report Title
                    </label>
                    <div className="mt-1">
                      <Field
                        type="text"
                        name="title"
                        id="title"
                        placeholder="Monthly Progress Report"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.title && touched.title ? "border-red-500" : ""
                        }`}
                      />
                      <ErrorMessage name="title" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Project */}
                  <div className="sm:col-span-2">
                    <label htmlFor="project" className="block text-sm font-medium text-gray-700">
                      Project
                    </label>
                    <div className="mt-1">
                      <Field
                        as="select"
                        name="project"
                        id="project"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.project && touched.project ? "border-red-500" : ""
                        }`}
                        disabled={isLoadingProjects}
                      >
                        <option value="">Select a project</option>
                        {projectsData?.data?.projects?.map((project) => (
                          <option key={project._id} value={project._id}>
                            {project.projectName}
                          </option>
                        ))}
                      </Field>
                      {isLoadingProjects && <p className="mt-1 text-sm text-gray-500">Loading projects...</p>}
                      {projectsError && (
                        <p className="mt-1 text-sm text-red-600">Error loading projects: {projectsError.message}</p>
                      )}
                      <ErrorMessage name="project" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Report Type */}
                  <div className="sm:col-span-2">
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                      Report Type
                    </label>
                    <div className="mt-1">
                      <Field
                        as="select"
                        name="type"
                        id="type"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.type && touched.type ? "border-red-500" : ""
                        }`}
                      >
                        <option value="progress">Progress Report</option>
                        <option value="monthly_progress">Monthly Progress Report</option>
                        <option value="weekly_progress">Weekly Progress Report</option>
                        <option value="inspection">Inspection Report</option>
                        <option value="quality">Quality Assessment</option>
                        <option value="issue">Issue Report</option>
                        <option value="final">Final Report</option>
                      </Field>
                      <ErrorMessage name="type" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Period Start Date - Only for progress reports */}
                  {(values.type === "progress" ||
                    values.type === "monthly_progress" ||
                    values.type === "weekly_progress") && (
                    <div className="sm:col-span-1">
                      <label htmlFor="periodStartDate" className="block text-sm font-medium text-gray-700">
                        Period Start Date
                      </label>
                      <div className="mt-1">
                        <Field
                          type="date"
                          name="periodStartDate"
                          id="periodStartDate"
                          className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                            errors.periodStartDate && touched.periodStartDate ? "border-red-500" : ""
                          }`}
                        />
                        <ErrorMessage name="periodStartDate" component="p" className="mt-1 text-sm text-red-600" />
                      </div>
                    </div>
                  )}

                  {/* Period End Date - Only for progress reports */}
                  {(values.type === "progress" ||
                    values.type === "monthly_progress" ||
                    values.type === "weekly_progress") && (
                    <div className="sm:col-span-1">
                      <label htmlFor="periodEndDate" className="block text-sm font-medium text-gray-700">
                        Period End Date
                      </label>
                      <div className="mt-1">
                        <Field
                          type="date"
                          name="periodEndDate"
                          id="periodEndDate"
                          className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                            errors.periodEndDate && touched.periodEndDate ? "border-red-500" : ""
                          }`}
                        />
                        <ErrorMessage name="periodEndDate" component="p" className="mt-1 text-sm text-red-600" />
                      </div>
                    </div>
                  )}

                  {/* Report Summary */}
                  <div className="sm:col-span-2">
                    <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
                      Report Summary
                    </label>
                    <div className="mt-1">
                      <Field
                        as="textarea"
                        name="summary"
                        id="summary"
                        rows={10}
                        placeholder="Enter your detailed report summary here..."
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.summary && touched.summary ? "border-red-500" : ""
                        }`}
                      />
                      <ErrorMessage name="summary" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Issues and Risks */}
                  <div className="sm:col-span-2">
                    <label htmlFor="issuesAndRisks" className="block text-sm font-medium text-gray-700">
                      Issues and Risks
                    </label>
                    <div className="mt-1">
                      <div className="flex">
                        <Field
                          type="text"
                          name="newIssue"
                          id="newIssue"
                          placeholder="Add an issue or risk..."
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-l-md"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddIssue(values, setFieldValue)}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Add
                        </button>
                      </div>

                      {/* List of issues */}
                      {values.issuesAndRisks.length > 0 && (
                        <ul className="mt-3 divide-y divide-gray-200 border border-gray-200 rounded-md">
                          {values.issuesAndRisks.map((issue, index) => (
                            <li key={index} className="flex items-center justify-between py-3 pl-3 pr-4 text-sm">
                              <div className="flex items-center flex-1">
                                <span className="ml-2 flex-1 w-0 truncate">{issue}</span>
                              </div>
                              <div className="ml-4 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveIssue(index, values, setFieldValue)}
                                  className="font-medium text-red-600 hover:text-red-500"
                                >
                                  Remove
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate("/reports")}
                    className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white 
                    ${
                      isSubmitting
                        ? "bg-indigo-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <DocumentTextIcon className="h-5 w-5 mr-2" />
                        Update Report
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
  )
}

export default EditReport

