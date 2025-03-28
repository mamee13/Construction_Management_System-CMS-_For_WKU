

"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { toast } from "react-toastify"
import { ArrowPathIcon, BuildingOfficeIcon } from "@heroicons/react/24/outline"
import projectsAPI from "../../../api/projects"
import usersAPI from "../../../api/users"
import authAPI from "../../../api/auth"

const CreateProject = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch contractors and consultants
  const {
    data: contractorsData,
    isLoading: isLoadingContractors,
    error: contractorsError,
  } = useQuery({
    queryKey: ["users", "contractor"],
    queryFn: () => usersAPI.getUsersByRole("contractor"),
    onSuccess: (data) => {
      console.log("Contractors data loaded:", data)
    },
    onError: (error) => {
      console.error("Error loading contractors:", error)
    },
  })

  const {
    data: consultantsData,
    isLoading: isLoadingConsultants,
    error: consultantsError,
  } = useQuery({
    queryKey: ["users", "consultant"],
    queryFn: () => usersAPI.getUsersByRole("consultant"),
    onSuccess: (data) => {
      console.log("Consultants data loaded:", data)
    },
    onError: (error) => {
      console.error("Error loading consultants:", error)
    },
  })

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: projectsAPI.createProject,
    onSuccess: () => {
      toast.success("Project created successfully")
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      navigate("/admin/projects")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create project")
      setIsSubmitting(false)
    },
  })

  // Validation schema
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
    projectBudget: Yup.number().required("Project budget is required").min(0, "Budget cannot be negative"),
    contractor: Yup.string().required("Contractor is required"),
    consultant: Yup.string().required("Consultant is required"),
    status: Yup.string()
      .required("Status is required")
      .oneOf(["planned", "in_progress", "completed", "on_hold"], "Invalid status"),
  })

  // Initial form values
  const initialValues = {
    projectName: "",
    projectDescription: "",
    startDate: "",
    endDate: "",
    projectLocation: "",
    projectBudget: "",
    contractor: "",
    consultant: "",
    status: "planned",
    materials: [],
    schedules: [],
    comments: [],
  }

  // Handle form submission
  const handleSubmit = (values) => {
    setIsSubmitting(true)

    // Format dates to ISO strings
    const formattedValues = {
      ...values,
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
      projectBudget: Number(values.projectBudget),
    }

    createProjectMutation.mutate(formattedValues)
  }

  // Check if user is admin, redirect if not
  if (!authAPI.isAdmin()) {
    navigate("/dashboard")
    return null
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Create New Project</h1>
          <p className="text-gray-500 text-sm">Add a new construction project to the system.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/projects")}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Back to Projects
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
          >
            {({ errors, touched }) => (
              <Form className="space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                  {/* Project Name */}
                  <div className="sm:col-span-2">
                    <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
                      Project Name
                    </label>
                    <div className="mt-1">
                      <Field
                        type="text"
                        name="projectName"
                        id="projectName"
                        placeholder="Science Building Construction"
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
                      Project Description
                    </label>
                    <div className="mt-1">
                      <Field
                        as="textarea"
                        name="projectDescription"
                        id="projectDescription"
                        rows={3}
                        placeholder="Detailed description of the project..."
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
                      Project Location
                    </label>
                    <div className="mt-1">
                      <Field
                        type="text"
                        name="projectLocation"
                        id="projectLocation"
                        placeholder="Main Campus, Building 3"
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
                      Start Date
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
                      End Date
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
                      Project Budget ($)
                    </label>
                    <div className="mt-1">
                      <Field
                        type="number"
                        name="projectBudget"
                        id="projectBudget"
                        min="0"
                        step="1000"
                        placeholder="100000"
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
                      Project Status
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
                  <div>
                    <label htmlFor="contractor" className="block text-sm font-medium text-gray-700">
                      Contractor
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
                          ?.filter((contractor) => contractor.isActive)
                          .map((contractor) => (
                            <option key={contractor._id} value={contractor._id}>
                              {contractor.firstName} {contractor.lastName}
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
                        contractorsData?.data?.users?.filter((contractor) => contractor.isActive).length === 0 && (
                          <p className="mt-1 text-sm text-yellow-600">
                            No contractors found. Please create contractor users first.
                          </p>
                        )}
                      <ErrorMessage name="contractor" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Consultant */}
                  <div>
                    <label htmlFor="consultant" className="block text-sm font-medium text-gray-700">
                      Consultant
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
                          ?.filter((consultant) => consultant.isActive)
                          .map((consultant) => (
                            <option key={consultant._id} value={consultant._id}>
                              {consultant.firstName} {consultant.lastName}
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
                        consultantsData?.data?.users?.filter((consultant) => consultant.isActive).length === 0 && (
                          <p className="mt-1 text-sm text-yellow-600">
                            No consultants found. Please create consultant users first.
                          </p>
                        )}
                      <ErrorMessage name="consultant" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate("/admin/projects")}
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
                        Creating...
                      </>
                    ) : (
                      <>
                        <BuildingOfficeIcon className="h-5 w-5 mr-2" />
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
