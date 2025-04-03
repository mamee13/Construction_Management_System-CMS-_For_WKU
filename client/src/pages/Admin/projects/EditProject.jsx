


/*eslint-disable */
import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { toast } from "react-toastify"
import { ArrowPathIcon, BuildingOfficeIcon } from "@heroicons/react/24/outline" // Assuming UserCircleIcon isn't needed here
import projectsAPI from "../../../api/projects"
import usersAPI from "../../../api/users"
// import authAPI from "../../../api/auth" // Removed, assuming auth check is handled elsewhere (e.g., route guards)

const EditProject = () => {
  const { id } = useParams() // Get project ID from URL
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false) // Use mutation's isLoading instead?

  // --- Fetch Existing Project Data ---
  const {
    data: projectData,
    isLoading: isLoadingProject,
    error: projectError,
  } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsAPI.getProjectById(id),
    // Keep data fresh but don't refetch too often while editing
    staleTime: 5 * 60 * 1000, // 5 minutes
    // enableReinitialize in Formik will handle updates if data changes while form is open
  })

  // --- Fetch Users by Role ---
  const { data: contractorsData, isLoading: isLoadingContractors } = useQuery({
    queryKey: ["users", "contractor"],
    queryFn: () => usersAPI.getUsersByRole("contractor"),
  })

  const { data: consultantsData, isLoading: isLoadingConsultants } = useQuery({
    queryKey: ["users", "consultant"],
    queryFn: () => usersAPI.getUsersByRole("consultant"),
  })

  const { data: projectManagersData, isLoading: isLoadingProjectManagers } = useQuery({
    queryKey: ["users", "project_manager"], // Use the correct role identifier
    queryFn: () => usersAPI.getUsersByRole("project_manager"),
  })


  // --- Update Project Mutation ---
  const updateProjectMutation = useMutation({
    // *** CORRECTED: Call updateProject API ***
    mutationFn: (projectUpdateData) => projectsAPI.updateProject(id, projectUpdateData),
    onSuccess: (updatedProject) => {
      toast.success("Project updated successfully")
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["projects"] }) // Invalidate list view
      queryClient.invalidateQueries({ queryKey: ["project", id] }) // Invalidate this specific project's data
      queryClient.invalidateQueries({ queryKey: ["users"] }) // Invalidate users if assignments changed affects user data display elsewhere

      // Navigate back to the project list or details page
      // navigate(`/admin/projects/${id}`) // Go to updated project detail
      navigate("/admin/projects") // Or go back to the list
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to update project"
      toast.error(errorMessage)
      setIsSubmitting(false) // Re-enable form on error
    },
    onSettled: () => {
      // Runs on both success and error
      setIsSubmitting(false); // Ensure button is re-enabled
    }
  })

  // --- Form Validation Schema (Similar to Create) ---
  const validationSchema = Yup.object({
    projectName: Yup.string()
      .required("Project name is required")
      .max(100, "Project name cannot exceed 100 characters"),
    projectDescription: Yup.string()
      .required("Project description is required")
      .max(500, "Description cannot exceed 500 characters"),
    startDate: Yup.date().required("Start date is required"),
    endDate: Yup.date()
      .required("End date is required")
      .min(Yup.ref("startDate"), "End date must be after the start date"),
    projectLocation: Yup.string()
      .required("Project location is required")
      .max(100, "Location cannot exceed 100 characters"),
    projectBudget: Yup.number()
      .required("Project budget is required")
      .min(0, "Budget cannot be negative")
      .typeError("Budget must be a number"),
    contractor: Yup.string().required("Contractor is required"), // Expecting user ID string
    consultant: Yup.string().required("Consultant is required"), // Expecting user ID string
    projectManager: Yup.string().required("Project Manager is required"), // Added Project Manager validation
    status: Yup.string()
      .required("Status is required")
      .oneOf(["planned", "in_progress", "completed", "on_hold", "cancelled"], "Invalid status"), // Added 'cancelled' if applicable
  })

  // Helper to format date for <input type="date">
  const formatDateForInput = (dateString) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      // Check if date is valid before formatting
      if (isNaN(date.getTime())) {
        return ""
      }
      return date.toISOString().split("T")[0]
    } catch (e) {
      console.error("Error formatting date:", dateString, e)
      return ""
    }
  }

  // --- Prepare Initial Values once project data loads ---
  const project = projectData?.data // The actual project object
  const initialValues = project
    ? {
        projectName: project.projectName || "",
        projectDescription: project.projectDescription || "",
        startDate: formatDateForInput(project.startDate),
        endDate: formatDateForInput(project.endDate),
        projectLocation: project.projectLocation || "",
        projectBudget: project.projectBudget ?? "", // Use ?? for nullish coalescing (handles 0 correctly)
        // *** CORRECTED: Get the ID from the populated user object ***
        contractor: project.contractor?._id || "",
        consultant: project.consultant?._id || "",
        projectManager: project.projectManager?._id || "", // Added project manager ID
        status: project.status || "planned",
        // Materials, schedules, comments are likely managed elsewhere, not part of this form
      }
    : { // Default structure if project hasn't loaded yet (Formik needs consistent shape)
        projectName: "",
        projectDescription: "",
        startDate: "",
        endDate: "",
        projectLocation: "",
        projectBudget: "",
        contractor: "",
        consultant: "",
        projectManager: "",
        status: "planned",
      }

  // --- Handle Form Submission ---
  const handleSubmit = (values) => {
    // Prevent double submission
    if (updateProjectMutation.isLoading) return;

    setIsSubmitting(true) // Set submitting state for button feedback

    // Format dates to ISO strings and ensure budget is a number
    const formattedValues = {
      ...values,
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
      projectBudget: Number(values.projectBudget),
      // contractor, consultant, projectManager are already ID strings from the form
    }

    console.log("Submitting project update data:", formattedValues)
    updateProjectMutation.mutate(formattedValues)
  }

  // --- Auth Check (Example - better handled via routing) ---
  // if (!authAPI.isAdmin()) {
  //   navigate("/dashboard");
  //   return null;
  // }

  // --- Render Logic ---
  if (isLoadingProject) {
    return (
      <div className="text-center py-10">
        <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
        <p className="mt-2 text-gray-500">Loading project data...</p>
      </div>
    )
  }

  if (projectError) {
    return (
      <div className="text-center py-10 px-4">
        <p className="text-red-500 mb-4">Failed to load project: {projectError.message}</p>
        <button
          onClick={() => queryClient.refetchQueries({ queryKey: ["project", id] })}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowPathIcon className="h-5 w-5 mr-2" />
          Retry
        </button>
      </div>
    )
  }

   // Ensure we don't render the form until initialValues are ready
   if (!project) {
     return (
      <div className="text-center py-10">
        <p className="text-gray-500">Project data not available.</p>
        {/* Optionally add a retry or back button here */}
      </div>
     )
   }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Edit Project</h1>
          <p className="text-gray-500 text-sm">Update details for project: <span className="font-medium">{project?.projectName}</span></p>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)} // Go back
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Back
        </button>
      </div>

      {/* Form Card */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            validateOnChange={false} // Validate only on blur/submit
            validateOnBlur={true}
            enableReinitialize={true} // Allows form to update if projectData changes
          >
            {({ errors, touched }) => (
              <Form className="space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                  {/* Project Name */}
                  <div className="sm:col-span-2">
                    <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
                      Project Name <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <Field
                        type="text"
                        name="projectName"
                        id="projectName"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.projectName && touched.projectName ? "border-red-500" : ""
                        }`}
                      />
                      <ErrorMessage name="projectName" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Project Description */}
                  <div className="sm:col-span-2">
                     <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700">
                      Project Description <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <Field
                        as="textarea"
                        name="projectDescription"
                        id="projectDescription"
                        rows={3}
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.projectDescription && touched.projectDescription ? "border-red-500" : ""
                        }`}
                      />
                      <ErrorMessage name="projectDescription" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Project Location */}
                  <div className="sm:col-span-2">
                    <label htmlFor="projectLocation" className="block text-sm font-medium text-gray-700">
                      Project Location <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <Field
                        type="text"
                        name="projectLocation"
                        id="projectLocation"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.projectLocation && touched.projectLocation ? "border-red-500" : ""
                        }`}
                      />
                      <ErrorMessage name="projectLocation" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <Field
                        type="date"
                        name="startDate"
                        id="startDate"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.startDate && touched.startDate ? "border-red-500" : ""
                        }`}
                      />
                      <ErrorMessage name="startDate" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* End Date */}
                  <div>
                     <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <Field
                        type="date"
                        name="endDate"
                        id="endDate"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.endDate && touched.endDate ? "border-red-500" : ""
                        }`}
                      />
                      <ErrorMessage name="endDate" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Project Budget */}
                  <div>
                    <label htmlFor="projectBudget" className="block text-sm font-medium text-gray-700">
                      Project Budget ($) <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <Field
                        type="number"
                        name="projectBudget"
                        id="projectBudget"
                        min="0"
                        step="1"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.projectBudget && touched.projectBudget ? "border-red-500" : ""
                        }`}
                      />
                      <ErrorMessage name="projectBudget" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                     <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      Project Status <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <Field
                        as="select"
                        name="status"
                        id="status"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.status && touched.status ? "border-red-500" : ""
                        }`}
                      >
                        {/* Add Cancelled if needed based on enum */}
                        <option value="planned">Planned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="on_hold">On Hold</option>
                         <option value="cancelled">Cancelled</option>
                      </Field>
                      <ErrorMessage name="status" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Contractor */}
                  <div className="sm:col-span-1">
                    <label htmlFor="contractor" className="block text-sm font-medium text-gray-700">
                      Contractor <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <Field
                        as="select"
                        name="contractor"
                        id="contractor"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.contractor && touched.contractor ? "border-red-500" : ""
                        }`}
                        disabled={isLoadingContractors}
                      >
                        <option value="">Select a contractor</option>
                        {contractorsData?.data?.users
                          ?.filter(user => user.isActive) // Show only active users
                          .map((contractor) => (
                            <option key={contractor._id} value={contractor._id}>
                              {contractor.firstName} {contractor.lastName} ({contractor.email})
                            </option>
                          ))}
                      </Field>
                      {isLoadingContractors && <p className="mt-1 text-sm text-gray-500">Loading...</p>}
                      {/* Add error/empty state message if desired */}
                      <ErrorMessage name="contractor" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Consultant */}
                   <div className="sm:col-span-1">
                    <label htmlFor="consultant" className="block text-sm font-medium text-gray-700">
                      Consultant <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <Field
                        as="select"
                        name="consultant"
                        id="consultant"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.consultant && touched.consultant ? "border-red-500" : ""
                        }`}
                        disabled={isLoadingConsultants}
                      >
                        <option value="">Select a consultant</option>
                        {consultantsData?.data?.users
                           ?.filter(user => user.isActive) // Show only active users
                          .map((consultant) => (
                            <option key={consultant._id} value={consultant._id}>
                              {consultant.firstName} {consultant.lastName} ({consultant.email})
                            </option>
                          ))}
                      </Field>
                       {isLoadingConsultants && <p className="mt-1 text-sm text-gray-500">Loading...</p>}
                      {/* Add error/empty state message if desired */}
                      <ErrorMessage name="consultant" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Project Manager */}
                  <div className="sm:col-span-2"> {/* Spanning full width */}
                     <label htmlFor="projectManager" className="block text-sm font-medium text-gray-700">
                      Project Manager <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <Field
                        as="select"
                        name="projectManager"
                        id="projectManager"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.projectManager && touched.projectManager ? "border-red-500" : ""
                        }`}
                        disabled={isLoadingProjectManagers}
                      >
                        <option value="">Select a project manager</option>
                        {projectManagersData?.data?.users
                           ?.filter(user => user.isActive) // Show only active users
                          .map((pm) => (
                            <option key={pm._id} value={pm._id}>
                              {pm.firstName} {pm.lastName} ({pm.email})
                            </option>
                          ))}
                      </Field>
                       {isLoadingProjectManagers && <p className="mt-1 text-sm text-gray-500">Loading...</p>}
                      {/* Add error/empty state message if desired */}
                      <ErrorMessage name="projectManager" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                </div> {/* End Grid */}

                {/* Submit/Cancel Buttons */}
                <div className="flex justify-end pt-5">
                   <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    // Disable button when submitting
                    disabled={isSubmitting || updateProjectMutation.isLoading}
                    className={`inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                      isSubmitting || updateProjectMutation.isLoading
                        ? "bg-indigo-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    }`}
                  >
                    {isSubmitting || updateProjectMutation.isLoading ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" aria-hidden="true" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <BuildingOfficeIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                        Update Project
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

export default EditProject