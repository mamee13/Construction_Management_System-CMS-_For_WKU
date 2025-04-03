



import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { toast } from "react-toastify"
import { ArrowPathIcon, BuildingOfficeIcon, UserCircleIcon } from "@heroicons/react/24/outline" // Added UserCircleIcon
import projectsAPI from "../../../api/projects"
import usersAPI from "../../../api/users"
//import authAPI from "../../../api/auth"

const CreateProject = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // --- Fetch Users by Role ---

  // Fetch Contractors
  const {
    data: contractorsData,
    isLoading: isLoadingContractors,
    error: contractorsError,
  } = useQuery({
    queryKey: ["users", "contractor"],
    queryFn: () => usersAPI.getUsersByRole("contractor"),
    // Optional: Add onSuccess/onError logging if needed
  })

  // Fetch Consultants
  const {
    data: consultantsData,
    isLoading: isLoadingConsultants,
    error: consultantsError,
  } = useQuery({
    queryKey: ["users", "consultant"],
    queryFn: () => usersAPI.getUsersByRole("consultant"),
    // Optional: Add onSuccess/onError logging if needed
  })

  // Fetch Project Managers
  const {
    data: projectManagersData,
    isLoading: isLoadingProjectManagers,
    error: projectManagersError,
  } = useQuery({
    queryKey: ["users", "project_manager"], // Use the correct role identifier
    queryFn: () => usersAPI.getUsersByRole("project_manager"), // Use the correct role identifier
    onSuccess: (data) => {
      console.log("Project Managers data loaded:", data)
    },
    onError: (error) => {
      console.error("Error loading project managers:", error)
    },
  })

  // --- Create Project Mutation ---
  const createProjectMutation = useMutation({
    mutationFn: projectsAPI.createProject,
    onSuccess: () => {
      toast.success("Project created successfully")
      queryClient.invalidateQueries({ queryKey: ["projects"] }) // Invalidate projects cache
      queryClient.invalidateQueries({ queryKey: ["users"] }) // Potentially invalidate users if their associated projects change (due to post-save hook)
      navigate("/admin/projects")
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to create project"
      toast.error(errorMessage)
      setIsSubmitting(false)
    },
  })

  // --- Form Validation Schema ---
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
      .typeError("Budget must be a number"), // Added type error for better UX
    contractor: Yup.string().required("Contractor is required"),
    consultant: Yup.string().required("Consultant is required"),
    projectManager: Yup.string().required("Project Manager is required"), // Added Project Manager validation
    status: Yup.string()
      .required("Status is required")
      .oneOf(["planned", "in_progress", "completed", "on_hold"], "Invalid status"),
  })

  // --- Initial Form Values ---
  const initialValues = {
    projectName: "",
    projectDescription: "",
    startDate: "",
    endDate: "",
    projectLocation: "",
    projectBudget: "",
    contractor: "",
    consultant: "",
    projectManager: "", // Added projectManager initial value
    status: "planned",
    // materials, schedules, comments are not set here, they are managed separately
  }

  // --- Handle Form Submission ---
  const handleSubmit = (values) => {
    setIsSubmitting(true)

    // Format dates and ensure budget is a number
    const formattedValues = {
      ...values,
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
      projectBudget: Number(values.projectBudget),
      // projectManager is already a string (ID), so no formatting needed
    }
     // Remove empty/unnecessary fields if backend doesn't expect them
     // delete formattedValues.materials;
     // delete formattedValues.schedules;
     // delete formattedValues.comments;

    console.log("Submitting project data:", formattedValues) // Log data being sent
    createProjectMutation.mutate(formattedValues)
  }

  // --- Admin Check ---
  // Consider moving this logic to a route guard or higher-level component
  // if (!authAPI.isAdmin()) {
  //   navigate("/dashboard"); // Or wherever non-admins should go
  //   return null; // Prevent rendering the form
  // }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Create New Project</h1>
          <p className="text-gray-500 text-sm">Add a new construction project to the system.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)} // Go back to the previous page
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
                        placeholder="e.g., Downtown Office Tower Renovation"
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
                        placeholder="Detailed scope, objectives, and deliverables..."
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
                        placeholder="e.g., 123 Main St, Anytown, USA"
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
                        step="1" // Allow any number, not just thousands
                        placeholder="e.g., 500000"
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
                        <option value="planned">Planned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="on_hold">On Hold</option>
                      </Field>
                      <ErrorMessage name="status" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Contractor */}
                  <div className="sm:col-span-1"> {/* Adjusted span */}
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
                          ?.filter((user) => user.isActive) // Ensure only active users are shown
                          .map((contractor) => (
                            <option key={contractor._id} value={contractor._id}>
                              {contractor.firstName} {contractor.lastName} ({contractor.email})
                            </option>
                          ))}
                      </Field>
                      {isLoadingContractors && <p className="mt-1 text-sm text-gray-500">Loading contractors...</p>}
                      {contractorsError && (
                        <p className="mt-1 text-sm text-red-600">
                          Error loading contractors: {contractorsError.message}
                        </p>
                      )}
                      {!isLoadingContractors &&
                        !contractorsError &&
                        (!contractorsData?.data?.users || contractorsData.data.users.filter(u => u.isActive).length === 0) && (
                          <p className="mt-1 text-sm text-yellow-600">
                            No active contractors found. Please add/activate contractor users.
                          </p>
                        )}
                      <ErrorMessage name="contractor" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Consultant */}
                  <div className="sm:col-span-1"> {/* Adjusted span */}
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
                           ?.filter((user) => user.isActive) // Ensure only active users are shown
                          .map((consultant) => (
                            <option key={consultant._id} value={consultant._id}>
                              {consultant.firstName} {consultant.lastName} ({consultant.email})
                            </option>
                          ))}
                      </Field>
                      {isLoadingConsultants && <p className="mt-1 text-sm text-gray-500">Loading consultants...</p>}
                      {consultantsError && (
                        <p className="mt-1 text-sm text-red-600">
                          Error loading consultants: {consultantsError.message}
                        </p>
                      )}
                       {!isLoadingConsultants &&
                        !consultantsError &&
                        (!consultantsData?.data?.users || consultantsData.data.users.filter(u => u.isActive).length === 0) && (
                          <p className="mt-1 text-sm text-yellow-600">
                            No active consultants found. Please add/activate consultant users.
                          </p>
                        )}
                      <ErrorMessage name="consultant" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Project Manager */}
                  <div className="sm:col-span-2"> {/* Span full width */}
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
                           ?.filter((user) => user.isActive) // Ensure only active users are shown
                          .map((pm) => (
                            <option key={pm._id} value={pm._id}>
                              {pm.firstName} {pm.lastName} ({pm.email})
                            </option>
                          ))}
                      </Field>
                      {isLoadingProjectManagers && <p className="mt-1 text-sm text-gray-500">Loading project managers...</p>}
                      {projectManagersError && (
                        <p className="mt-1 text-sm text-red-600">
                          Error loading project managers: {projectManagersError.message}
                        </p>
                      )}
                       {!isLoadingProjectManagers &&
                        !projectManagersError &&
                        (!projectManagersData?.data?.users || projectManagersData.data.users.filter(u => u.isActive).length === 0) && (
                          <p className="mt-1 text-sm text-yellow-600">
                            No active project managers found. Please add/activate project manager users.
                          </p>
                        )}
                      <ErrorMessage name="projectManager" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                </div> {/* End Grid */}

                {/* Submit/Cancel Buttons */}
                <div className="flex justify-end pt-5">
                  <button
                    type="button"
                    onClick={() => navigate(-1)} // Go back
                    className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || createProjectMutation.isLoading} // Disable during submission
                    className={`inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white
                    ${
                      isSubmitting || createProjectMutation.isLoading
                        ? "bg-indigo-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    }`}
                  >
                    {isSubmitting || createProjectMutation.isLoading ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" aria-hidden="true" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <BuildingOfficeIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                        Create Project
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

export default CreateProject
