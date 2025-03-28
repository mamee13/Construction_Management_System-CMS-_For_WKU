

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { toast } from "react-toastify"
import { ArrowPathIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline"
import schedulesAPI from "../../../api/schedules"
import projectsAPI from "../../../api/projects"
import tasksAPI from "../../../api/tasks"

const CreateSchedule = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  // State for selected project so we can filter tasks accordingly
  const [selectedProject, setSelectedProject] = useState("")
  // Local state to hold the display value for assigned user name
  const [assignedUserName, setAssignedUserName] = useState("")

  // Fetch projects for dropdown
  const {
    data: projectsData,
    isLoading: isLoadingProjects,
    error: projectsError,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsAPI.getAllProjects,
  })

  // Fetch tasks for dropdown based on selected project using getTasksForProject
  const {
    data: tasksData,
    isLoading: isLoadingTasks,
  } = useQuery({
    queryKey: ["tasks", selectedProject],
    queryFn: () =>
      selectedProject
        ? tasksAPI.getTasksForProject(selectedProject)
        : Promise.resolve([]),
    enabled: !!selectedProject, // only run when a project is selected
  })

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: schedulesAPI.createSchedule,
    onSuccess: () => {
      toast.success("Schedule created successfully")
      queryClient.invalidateQueries({ queryKey: ["schedules"] })
      navigate("/admin/schedules")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create schedule")
      setIsSubmitting(false)
    },
  })

  // Validation schema updated to match the schedule model
  const validationSchema = Yup.object({
    scheduleName: Yup.string()
      .required("Schedule name is required")
      .max(100, "Cannot exceed 100 characters"),
    scheduleDescription: Yup.string()
      .required("Description is required")
      .max(500, "Cannot exceed 500 characters"),
    startDate: Yup.date().required("Start date is required"),
    endDate: Yup.date()
      .required("End date is required")
      .min(Yup.ref("startDate"), "End date must be after the start date"),
    project: Yup.string().required("Project is required"),
    task: Yup.string().required("Task is required"),
    // assignedTo is hidden and filled automatically so we still require it for backend validation.
    assignedTo: Yup.string().required("Assigned To is required"),
    status: Yup.string()
      .required("Status is required")
      .oneOf(["planned", "in_progress", "completed", "delayed"], "Invalid status"),
    priority: Yup.string()
      .required("Priority is required")
      .oneOf(["low", "medium", "high"], "Invalid priority"),
  })

  // Initial form values with fields matching the model
  const initialValues = {
    scheduleName: "",
    scheduleDescription: "",
    startDate: "",
    endDate: "",
    project: "",
    task: "",
    assignedTo: "",
    status: "planned",
    priority: "medium",
  }

  // Handle form submission: format dates and submit (exclude display field)
  const handleSubmit = (values) => {
    setIsSubmitting(true)
    // Exclude assignedUserName (not part of backend payload)
    const { assignedTo, ...rest } = values
    const formattedValues = {
      ...rest,
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
      assignedTo, // send the hidden id value
    }
    createScheduleMutation.mutate(formattedValues)
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Create New Schedule</h1>
          <p className="text-gray-500 text-sm">Add a new schedule for construction projects.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/schedules")}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Back to Schedules
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
            {({ errors, touched, setFieldValue }) => (
              <Form className="space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                  {/* Schedule Name */}
                  <div className="sm:col-span-2">
                    <label htmlFor="scheduleName" className="block text-sm font-medium text-gray-700">
                      Schedule Name
                    </label>
                    <div className="mt-1">
                      <Field
                        type="text"
                        name="scheduleName"
                        id="scheduleName"
                        placeholder="Foundation Construction Phase"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.scheduleName && touched.scheduleName ? "border-red-500" : ""
                        }`}
                      />
                      <ErrorMessage name="scheduleName" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Schedule Description */}
                  <div className="sm:col-span-2">
                    <label htmlFor="scheduleDescription" className="block text-sm font-medium text-gray-700">
                      Schedule Description
                    </label>
                    <div className="mt-1">
                      <Field
                        as="textarea"
                        name="scheduleDescription"
                        id="scheduleDescription"
                        rows={3}
                        placeholder="Detailed description of the schedule..."
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.scheduleDescription && touched.scheduleDescription ? "border-red-500" : ""
                        }`}
                      />
                      <ErrorMessage name="scheduleDescription" component="p" className="mt-1 text-sm text-red-600" />
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
                        onChange={(e) => {
                          const projectId = e.target.value
                          // update Formik value and local state
                          setFieldValue("project", projectId)
                          setFieldValue("task", "")  // reset task
                          setFieldValue("assignedTo", "")  // reset assignedTo
                          setAssignedUserName("") // reset display name
                          setSelectedProject(projectId)
                        }}
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
                        <p className="mt-1 text-sm text-red-600">
                          Error loading projects: {projectsError.message}
                        </p>
                      )}
                      {!isLoadingProjects &&
                        !projectsError &&
                        projectsData?.data?.length === 0 && (
                          <p className="mt-1 text-sm text-yellow-600">
                            No projects found. Please create projects first.
                          </p>
                        )}
                      <ErrorMessage name="project" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Task */}
                  <div className="sm:col-span-2">
                    <label htmlFor="task" className="block text-sm font-medium text-gray-700">
                      Task
                    </label>
                    <div className="mt-1">
                      <Field
                        as="select"
                        name="task"
                        id="task"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.task && touched.task ? "border-red-500" : ""
                        }`}
                        disabled={
                          !selectedProject ||
                          isLoadingTasks ||
                          (selectedProject && tasksData?.length === 0)
                        }
                        onChange={(e) => {
                          const taskId = e.target.value
                          setFieldValue("task", taskId)
                          // Find the selected task from tasksData
                          const selectedTask = tasksData?.find(task => task._id === taskId)
                          if (selectedTask && selectedTask.assignedTo?.length) {
                            // For simplicity, we assume one assigned user.
                            const user = selectedTask.assignedTo[0]
                            // Set the hidden field with the user id.
                            setFieldValue("assignedTo", user._id)
                            // Set local state to display the user's name.
                            const name =
                              user.firstName && user.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user.username || "Unknown"
                            setAssignedUserName(name)
                          } else {
                            setFieldValue("assignedTo", "")
                            setAssignedUserName("")
                          }
                        }}
                      >
                        <option value="">Select a task</option>
                        {tasksData?.map((task) => (
                          <option key={task._id} value={task._id}>
                            {task.taskName}
                          </option>
                        ))}
                      </Field>
                      {!selectedProject && (
                        <p className="mt-1 text-sm text-gray-500">Please select a project first.</p>
                      )}
                      {selectedProject && isLoadingTasks && (
                        <p className="mt-1 text-sm text-gray-500">Loading tasks...</p>
                      )}
                      {selectedProject &&
                        !isLoadingTasks &&
                        tasksData?.length === 0 && (
                          <div className="mt-1 text-sm text-yellow-600 flex items-center gap-2">
                            <span>No tasks found for this project.</span>
                            <button
                              type="button"
                              onClick={() => navigate("/admin/tasks/create")}
                              className="underline text-indigo-600 hover:text-indigo-800"
                            >
                              Create Task
                            </button>
                          </div>
                        )}
                      <ErrorMessage name="task" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Hidden Assigned To (user id) */}
                  <Field type="hidden" name="assignedTo" />

                  {/* Display Assigned To (read-only) */}
                  <div className="sm:col-span-2">
                    <label htmlFor="assignedUserDisplay" className="block text-sm font-medium text-gray-700">
                      Assigned To
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="assignedUserDisplay"
                        value={assignedUserName}
                        readOnly
                        placeholder="Assigned user will appear here"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
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

                  {/* Status */}
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
                        <option value="planned">Planned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="delayed">Delayed</option>
                      </Field>
                      <ErrorMessage name="status" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Priority */}
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
                    onClick={() => navigate("/admin/schedules")}
                    className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      (selectedProject && tasksData?.length === 0)
                    }
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                      isSubmitting ||
                      (selectedProject && tasksData?.length === 0)
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
                        <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
                        Create Schedule
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

export default CreateSchedule
