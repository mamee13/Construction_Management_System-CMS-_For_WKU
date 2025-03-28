
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { toast } from "react-toastify"
import { ArrowPathIcon, CheckCircleIcon, ArrowLeftIcon } from "@heroicons/react/24/outline"
import tasksAPI from "../../../api/tasks"
import projectsAPI from "../../../api/projects"
import usersAPI from "../../../api/users"
import authAPI from "../../../api/auth"

const CreateTask = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const queryParams = new URLSearchParams(location.search)
  const projectIdFromQuery = queryParams.get("projectId")

  const isAdmin = authAPI.isAdmin()

  useEffect(() => {
    if (!isAdmin) {
      navigate("/dashboard")
    }
  }, [isAdmin, navigate])

  const { data: projectsData, isLoading: isLoadingProjects, error: projectsError } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsAPI.getAllProjects,
    enabled: isAdmin,
  })

  // Fetch users for the assignee dropdown
  const { data: usersData, isLoading: isLoadingUsers, error: usersError } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersAPI.getAllUsers(),
    enabled: isAdmin,
  })

  const createTaskMutation = useMutation({
    mutationFn: (taskData) => tasksAPI.createTask(taskData),
    onSuccess: () => {
      toast.success("Task created successfully")
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      navigate("/admin/tasks")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create task")
      setIsSubmitting(false)
    },
  })

  const validationSchema = Yup.object({
    taskName: Yup.string()
      .required("Task name is required")
      .max(100, "Task name cannot exceed 100 characters"),
    taskDescription: Yup.string()
      .required("Description is required")
      .max(500, "Description cannot exceed 500 characters"),
    startDate: Yup.date().required("Start date is required"),
    endDate: Yup.date()
      .required("End date is required")
      .min(Yup.ref("startDate"), "End date must be after the start date"),
    project: Yup.string().required("Project is required"),
    // Expect an array of strings for multiple assignees
    assignedTo: Yup.array()
      .of(Yup.string())
      .min(1, "Please select at least one assignee"),
    status: Yup.string()
      .required("Status is required")
      .oneOf(["not_started", "in_progress", "completed", "on_hold"], "Invalid status"),
    priority: Yup.string()
      .required("Priority is required")
      .oneOf(["low", "medium", "high"], "Invalid priority"),
  })

  // Initialize assignedTo as an empty array for multiple selections
  const initialValues = {
    taskName: "",
    taskDescription: "",
    startDate: "",
    endDate: "",
    project: projectIdFromQuery || "",
    assignedTo: [],
    status: "not_started",
    priority: "medium",
  }

  const handleSubmit = (values) => {
    setIsSubmitting(true)
    const formattedValues = {
      ...values,
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
      project: projectIdFromQuery || values.project,
      // assignedTo is now an array of user IDs
    }
    createTaskMutation.mutate(formattedValues)
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Create New Task</h1>
          <p className="text-gray-500 text-sm">Add a new task to a project.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/tasks")}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Tasks
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
                  {/* Task Name */}
                  <div className="sm:col-span-2">
                    <label htmlFor="taskName" className="block text-sm font-medium text-gray-700">
                      Task Name
                    </label>
                    <div className="mt-1">
                      <Field
                        type="text"
                        name="taskName"
                        id="taskName"
                        placeholder="Foundation Excavation"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.taskName && touched.taskName ? "border-red-500" : ""
                        }`}
                      />
                      <ErrorMessage name="taskName" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Task Description */}
                  <div className="sm:col-span-2">
                    <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <div className="mt-1">
                      <Field
                        as="textarea"
                        name="taskDescription"
                        id="taskDescription"
                        rows={3}
                        placeholder="Detailed description of the task..."
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.taskDescription && touched.taskDescription ? "border-red-500" : ""
                        }`}
                      />
                      <ErrorMessage name="taskDescription" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Project Dropdown */}
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
                        disabled={isLoadingProjects || projectIdFromQuery}
                      >
                        <option value="">Select a project</option>
                        {projectsData?.data?.map((project) => (
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

                  {/* Assigned To Multi-Select Dropdown */}
                  <div>
                    <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
                      Assigned To
                    </label>
                    <div className="mt-1">
                      <Field
                        as="select"
                        name="assignedTo"
                        id="assignedTo"
                        multiple
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.assignedTo && touched.assignedTo ? "border-red-500" : ""
                        }`}
                        disabled={isLoadingUsers}
                      >
                        {/* Option for multiple selection does not require a default placeholder */}
                        {usersData?.data
                          ?.filter((user) => user.isActive) // or user.status === "active"
                          .map((user) => (
                            <option key={user._id} value={user._id}>
                              {user.firstName} {user.lastName} ({user.role})
                            </option>
                          ))}
                      </Field>
                      {isLoadingUsers && <p className="mt-1 text-sm text-gray-500">Loading users...</p>}
                      {usersError && (
                        <p className="mt-1 text-sm text-red-600">Error loading users: {usersError.message}</p>
                      )}
                      <ErrorMessage name="assignedTo" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      Status
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
                        <option value="not_started">Not Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="on_hold">On Hold</option>
                      </Field>
                      <ErrorMessage name="status" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Priority Dropdown */}
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                      Priority
                    </label>
                    <div className="mt-1">
                      <Field
                        as="select"
                        name="priority"
                        id="priority"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.priority && touched.priority ? "border-red-500" : ""
                        }`}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </Field>
                      <ErrorMessage name="priority" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate("/admin/tasks")}
                    className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
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
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Create Task
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

export default CreateTask
