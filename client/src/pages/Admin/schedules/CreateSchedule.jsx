"use client"

import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { CalendarIcon, ClockIcon, UserGroupIcon } from "@heroicons/react/24/outline"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik"
import * as Yup from "yup"
// import schedulesAPI from "../../../api/schedules"
import schedulesAPI from "@/APi/schedules"
// import projectsAPI from "../../../api/projects"
import projectsAPI from "@/APi/projects"
// import usersAPI from "../../../api/users"
import usersAPI from "@/api/users"

const CreateSchedule = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch projects
  const { data: projects, isLoading: loadingProjects } = useQuery(
    ["projects"],
    projectsAPI.getAllProjects,
    {
      onError: () => toast.error("Failed to load projects"),
    }
  )

  // Fetch users
  const { data: users, isLoading: loadingUsers } = useQuery(
    ["users"],
    usersAPI.getAllUsers,
    {
      onError: () => toast.error("Failed to load users"),
    }
  )

  // Initial form values
  const initialValues = {
    title: "",
    description: "",
    projectId: "",
    startDate: "",
    endDate: "",
    status: "scheduled",
    assignedUsers: [],
    tasks: [
      { title: "", description: "", startDate: "", endDate: "", status: "pending" },
    ],
  }

  // Form validation schema using Yup
  const validationSchema = Yup.object({
    title: Yup.string().required("Title is required"),
    description: Yup.string().required("Description is required"),
    projectId: Yup.string().required("Project is required"),
    startDate: Yup.date().required("Start date is required"),
    endDate: Yup.date()
      .min(Yup.ref("startDate"), "End date must be after start date")
      .required("End date is required"),
    status: Yup.string().required("Status is required"),
    assignedUsers: Yup.array()
      .min(1, "At least one user must be assigned")
      .required("Assigned users required"),
    tasks: Yup.array()
      .of(
        Yup.object({
          title: Yup.string().required("Task title is required"),
          description: Yup.string().required("Task description is required"),
          startDate: Yup.date().required("Task start date is required"),
          endDate: Yup.date()
            .min(Yup.ref("startDate"), "Task end date must be after start date")
            .required("Task end date is required"),
          status: Yup.string().required("Task status is required"),
        })
      )
      .min(1, "At least one task is required"),
  })

  // Mutation for creating a schedule
  const mutation = useMutation(
    (values) => {
      // Transform Formik values to the payload expected by the backend.
      // Your backend expects: scheduleName, scheduleDescription, startDate, endDate, task, assignedTo, status, priority.
      // For demonstration, we use the first task's title as the 'task' field and the first assigned user as 'assignedTo'.
      const payload = {
        scheduleName: values.title,
        scheduleDescription: values.description,
        startDate: values.startDate,
        endDate: values.endDate,
        task: values.tasks[0].title,
        assignedTo: values.assignedUsers[0],
        status: values.status,
        priority: "medium",
      }
      return schedulesAPI.createSchedule(values.projectId, payload)
    },
    {
      onSuccess: () => {
        toast.success("Schedule created successfully")
        queryClient.invalidateQueries(["schedules"])
        navigate("/admin/schedules")
      },
      onError: (error) => {
        toast.error("Failed to create schedule")
        console.error(error)
      },
    }
  )

  // Form submission handler
  const handleSubmit = (values, { setSubmitting }) => {
    mutation.mutate(values)
    setSubmitting(false)
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Create New Schedule</h1>
        <p className="mt-2 text-sm text-gray-700">
          Create a new schedule with tasks and assign team members.
        </p>
      </div>

      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
        {({ values, isSubmitting }) => (
          <Form className="space-y-8 divide-y divide-gray-200">
            {/* Basic Information */}
            <div className="pt-8">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Basic Information</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Provide the general details about this schedule.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <div className="mt-1">
                    <Field
                      type="text"
                      name="title"
                      id="title"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <ErrorMessage name="title" component="div" className="text-red-500 text-sm" />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <div className="mt-1">
                    <Field
                      as="textarea"
                      name="description"
                      id="description"
                      rows={3}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <ErrorMessage name="description" component="div" className="text-red-500 text-sm" />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Brief description of the schedule and its purpose.
                  </p>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">
                    Project
                  </label>
                  <div className="mt-1">
                    <Field
                      as="select"
                      name="projectId"
                      id="projectId"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="">Select a project</option>
                      {loadingProjects ? (
                        <option disabled>Loading projects...</option>
                      ) : (
                        projects &&
                        projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))
                      )}
                    </Field>
                    <ErrorMessage name="projectId" component="div" className="text-red-500 text-sm" />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <div className="mt-1">
                    <Field
                      as="select"
                      name="status"
                      id="status"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </Field>
                    <ErrorMessage name="status" component="div" className="text-red-500 text-sm" />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <Field
                      type="date"
                      name="startDate"
                      id="startDate"
                      className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <ErrorMessage name="startDate" component="div" className="text-red-500 text-sm" />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <Field
                      type="date"
                      name="endDate"
                      id="endDate"
                      className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <ErrorMessage name="endDate" component="div" className="text-red-500 text-sm" />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="assignedUsers" className="block text-sm font-medium text-gray-700">
                    Assigned Team Members
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserGroupIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <Field
                      as="select"
                      name="assignedUsers"
                      id="assignedUsers"
                      multiple
                      size={4}
                      className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      {loadingUsers ? (
                        <option disabled>Loading users...</option>
                      ) : (
                        users &&
                        users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.firstName} {user.lastName} ({user.role})
                          </option>
                        ))
                      )}
                    </Field>
                    <ErrorMessage name="assignedUsers" component="div" className="text-red-500 text-sm" />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Hold Ctrl/Cmd to select multiple team members.
                  </p>
                </div>
              </div>
            </div>

            {/* Tasks Section */}
            <div className="pt-8">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Tasks</h3>
                <p className="mt-1 text-sm text-gray-500">Add tasks to this schedule.</p>
              </div>
              <FieldArray name="tasks">
                {({ push, remove }) => (
                  <div>
                    {values.tasks.map((task, index) => (
                      <div key={index} className="mt-6 p-4 border border-gray-200 rounded-md">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-md font-medium text-gray-900">Task {index + 1}</h4>
                          {values.tasks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="text-red-600 hover:text-red-900 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                          <div className="sm:col-span-4">
                            <label htmlFor={`tasks.${index}.title`} className="block text-sm font-medium text-gray-700">
                              Title
                            </label>
                            <div className="mt-1">
                              <Field
                                type="text"
                                name={`tasks.${index}.title`}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                              <ErrorMessage name={`tasks.${index}.title`} component="div" className="text-red-500 text-sm" />
                            </div>
                          </div>
                          <div className="sm:col-span-2">
                            <label htmlFor={`tasks.${index}.status`} className="block text-sm font-medium text-gray-700">
                              Status
                            </label>
                            <div className="mt-1">
                              <Field
                                as="select"
                                name={`tasks.${index}.status`}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              >
                                <option value="pending">Pending</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="blocked">Blocked</option>
                              </Field>
                              <ErrorMessage name={`tasks.${index}.status`} component="div" className="text-red-500 text-sm" />
                            </div>
                          </div>
                          <div className="sm:col-span-6">
                            <label htmlFor={`tasks.${index}.description`} className="block text-sm font-medium text-gray-700">
                              Description
                            </label>
                            <div className="mt-1">
                              <Field
                                as="textarea"
                                name={`tasks.${index}.description`}
                                rows={2}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                              <ErrorMessage name={`tasks.${index}.description`} component="div" className="text-red-500 text-sm" />
                            </div>
                          </div>
                          <div className="sm:col-span-3">
                            <label htmlFor={`tasks.${index}.startDate`} className="block text-sm font-medium text-gray-700">
                              Start Date
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <ClockIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                              </div>
                              <Field
                                type="date"
                                name={`tasks.${index}.startDate`}
                                className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                              <ErrorMessage name={`tasks.${index}.startDate`} component="div" className="text-red-500 text-sm" />
                            </div>
                          </div>
                          <div className="sm:col-span-3">
                            <label htmlFor={`tasks.${index}.endDate`} className="block text-sm font-medium text-gray-700">
                              End Date
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <ClockIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                              </div>
                              <Field
                                type="date"
                                name={`tasks.${index}.endDate`}
                                className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                              <ErrorMessage name={`tasks.${index}.endDate`} component="div" className="text-red-500 text-sm" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() =>
                          push({ title: "", description: "", startDate: "", endDate: "", status: "pending" })
                        }
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Add Another Task
                      </button>
                    </div>
                  </div>
                )}
              </FieldArray>
            </div>

            <div className="pt-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate("/admin/schedules")}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || mutation.isLoading}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isSubmitting || mutation.isLoading ? "Creating..." : "Create Schedule"}
                </button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  )
}

export default CreateSchedule
