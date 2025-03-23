"use client"

import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { toast } from "react-toastify"
import { ArrowPathIcon, BuildingOfficeIcon } from "@heroicons/react/24/outline"
import projectsAPI from "../../../api/projects"
import usersAPI from "../../../api/users"
import authAPI from "../../../api/auth"

const EditProject = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: projectData, isLoading: isLoadingProject, error: projectError } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsAPI.getProjectById(id)
  })

  const { data: contractorsData } = useQuery({
    queryKey: ["users", "contractor"],
    queryFn: () => usersAPI.getUsersByRole("contractor")
  })

  const { data: consultantsData} = useQuery({
    queryKey: ["users", "consultant"],
    queryFn: () => usersAPI.getUsersByRole("consultant")
  })

  const updateProjectMutation = useMutation({
    mutationFn: async (data) => {
      await projectsAPI.deleteProject(id)
      const response = await projectsAPI.createProject(data)
      return response
    },
    onSuccess: () => {
      toast.success("Project updated successfully")
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.invalidateQueries({ queryKey: ["project", id] })
      navigate(-2)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update project")
      setIsSubmitting(false)
    }
  })

  const validationSchema = Yup.object({
    projectName: Yup.string().required("Project name is required").max(100, "Project name cannot exceed 100 characters"),
    projectDescription: Yup.string().required("Project description is required").max(500, "Description cannot exceed 500 characters"),
    startDate: Yup.date().required("Start date is required"),
    endDate: Yup.date().required("End date is required").min(Yup.ref("startDate"), "End date must be after the start date"),
    projectLocation: Yup.string().required("Project location is required").max(100, "Location cannot exceed 100 characters"),
    projectBudget: Yup.number().required("Project budget is required").min(0, "Budget cannot be negative"),
    contractor: Yup.string().required("Contractor is required"),
    consultant: Yup.string().required("Consultant is required"),
    status: Yup.string().required("Status is required").oneOf(["planned", "in_progress", "completed", "on_hold"], "Invalid status")
  })

  const formatDateForInput = (dateString) => {
    const date = new Date(dateString)
    return date.toISOString().split("T")[0]
  }

  const handleSubmit = (values) => {
    setIsSubmitting(true)
    const formattedValues = {
      ...values,
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
      projectBudget: Number(values.projectBudget)
    }
    updateProjectMutation.mutate(formattedValues)
  }

  if (!authAPI.isAdmin()) {
    navigate("/dashboard")
    return null
  }

  const project = projectData?.data
  const initialValues = project
    ? {
        projectName: project.projectName || "",
        projectDescription: project.projectDescription || "",
        startDate: project.startDate ? formatDateForInput(project.startDate) : "",
        endDate: project.endDate ? formatDateForInput(project.endDate) : "",
        projectLocation: project.projectLocation || "",
        projectBudget: project.projectBudget || "",
        contractor: project.contractor || "",
        consultant: project.consultant || "",
        status: project.status || "planned",
        materials: project.materials || [],
        schedules: project.schedules || [],
        comments: project.comments || []
      }
    : {
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
        comments: []
      }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Edit Project</h1>
          <p className="text-gray-500 text-sm">Update project details, budget, and assignments.</p>
        </div>
        <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Back to Previous Page
        </button>
      </div>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          {isLoadingProject ? (
            <div className="text-center py-10">
              <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
              <p className="mt-2 text-gray-500">Loading project data...</p>
            </div>
          ) : projectError ? (
            <div className="text-center py-10">
              <p className="text-red-500">Failed to load project: {projectError.message}</p>
              <button onClick={() => queryClient.invalidateQueries({ queryKey: ["project", id] })} className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Retry
              </button>
            </div>
          ) : (
            <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit} validateOnChange={false} validateOnBlur={true} enableReinitialize={true}>
              {({ errors, touched }) => (
                <Form className="space-y-6">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">Project Name</label>
                      <div className="mt-1">
                        <Field type="text" name="projectName" id="projectName" placeholder="Science Building Construction" className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.projectName && touched.projectName ? "border-red-500" : ""}`} />
                        <ErrorMessage name="projectName" component="p" className="mt-1 text-sm text-red-600" />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700">Project Description</label>
                      <div className="mt-1">
                        <Field as="textarea" name="projectDescription" id="projectDescription" rows={3} placeholder="Detailed description of the project..." className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.projectDescription && touched.projectDescription ? "border-red-500" : ""}`} />
                        <ErrorMessage name="projectDescription" component="p" className="mt-1 text-sm text-red-600" />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="projectLocation" className="block text-sm font-medium text-gray-700">Project Location</label>
                      <div className="mt-1">
                        <Field type="text" name="projectLocation" id="projectLocation" placeholder="Main Campus, Building 3" className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.projectLocation && touched.projectLocation ? "border-red-500" : ""}`} />
                        <ErrorMessage name="projectLocation" component="p" className="mt-1 text-sm text-red-600" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                      <div className="mt-1">
                        <Field type="date" name="startDate" id="startDate" className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.startDate && touched.startDate ? "border-red-500" : ""}`} />
                        <ErrorMessage name="startDate" component="p" className="mt-1 text-sm text-red-600" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
                      <div className="mt-1">
                        <Field type="date" name="endDate" id="endDate" className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.endDate && touched.endDate ? "border-red-500" : ""}`} />
                        <ErrorMessage name="endDate" component="p" className="mt-1 text-sm text-red-600" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="projectBudget" className="block text-sm font-medium text-gray-700">Project Budget ($)</label>
                      <div className="mt-1">
                        <Field type="number" name="projectBudget" id="projectBudget" min="0" step="1000" placeholder="100000" className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.projectBudget && touched.projectBudget ? "border-red-500" : ""}`} />
                        <ErrorMessage name="projectBudget" component="p" className="mt-1 text-sm text-red-600" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700">Project Status</label>
                      <div className="mt-1">
                        <Field as="select" name="status" id="status" className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.status && touched.status ? "border-red-500" : ""}`}>
                          <option value="planned">Planned</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="on_hold">On Hold</option>
                        </Field>
                        <ErrorMessage name="status" component="p" className="mt-1 text-sm text-red-600" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="contractor" className="block text-sm font-medium text-gray-700">Contractor</label>
                      <div className="mt-1">
                        <Field as="select" name="contractor" id="contractor" className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.contractor && touched.contractor ? "border-red-500" : ""}`}>
                          <option value="">Select a contractor</option>
                          {contractorsData?.data?.users?.map((contractor) => (
                            <option key={contractor._id} value={contractor._id}>
                              {contractor.firstName} {contractor.lastName}
                            </option>
                          ))}
                        </Field>
                        <ErrorMessage name="contractor" component="p" className="mt-1 text-sm text-red-600" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="consultant" className="block text-sm font-medium text-gray-700">Consultant</label>
                      <div className="mt-1">
                        <Field as="select" name="consultant" id="consultant" className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.consultant && touched.consultant ? "border-red-500" : ""}`}>
                          <option value="">Select a consultant</option>
                          {consultantsData?.data?.users?.map((consultant) => (
                            <option key={consultant._id} value={consultant._id}>
                              {consultant.firstName} {consultant.lastName}
                            </option>
                          ))}
                        </Field>
                        <ErrorMessage name="consultant" component="p" className="mt-1 text-sm text-red-600" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button type="button" onClick={() => navigate(-1)} className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting} className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${isSubmitting ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"}`}>
                      {isSubmitting ? (
                        <>
                          <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                          Update Project
                        </>
                      )}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          )}
        </div>
      </div>
    </div>
  )
}

export default EditProject