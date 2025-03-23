"use client"

import { useNavigate, useParams } from "react-router-dom"
import { toast } from "react-toastify"
import { CalendarIcon, ClockIcon, UserGroupIcon, ArrowLeftIcon } from "@heroicons/react/24/outline"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik"
import * as Yup from "yup"
// import schedulesAPI from "../../../api/schedules"
import schedulesAPI from "@/APi/schedules"
// import projectsAPI from "../../../api/projects"
import projectsAPI from "@/APi/projects"
// import usersAPI from "../../../api/users"
import usersAPI from "@/api/users"

const EditSchedule = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch schedule data
  const {
    data: scheduleData,
    isLoading: loadingSchedule,
    error: scheduleError,
  } = useQuery(["schedule", id], () => schedulesAPI.getScheduleById(id), {
    onError: () => toast.error("Failed to load schedule data"),
  })

  // Fetch projects data
  const {
    data: projects,
    isLoading: loadingProjects,
    error: projectsError,
  } = useQuery(["projects"], projectsAPI.getAllProjects, {
    onError: () => toast.error("Failed to load projects"),
  })

  // Fetch users data
  const {
    data: users,
    isLoading: loadingUsers,
    error: usersError,
  } = useQuery(["users"], usersAPI.getAllUsers, {
    onError: () => toast.error("Failed to load users"),
  })

  // Transform schedule data for initial form values once scheduleData is loaded
  const transformSchedule = (data) => {
    return {
      title: data.title || data.scheduleName || "",
      description: data.description || data.scheduleDescription || "",
      projectId: data.projectId || data.project || "",
      startDate: data.startDate ? data.startDate.split("T")[0] : "",
      endDate: data.endDate ? data.endDate.split("T")[0] : "",
      status: data.status || "scheduled",
      // Assuming assignedUsers comes as an array of user objects; transform to an array of IDs
      assignedUsers: data.assignedUsers ? data.assignedUsers.map((u) => u.id || u._id) : [],
      // If tasks exist, format each task's dates
      tasks: data.tasks
        ? data.tasks.map((task) => ({
            title: task.title || "",
            description: task.description || "",
            startDate: task.startDate ? task.startDate.split("T")[0] : "",
            endDate: task.endDate ? task.endDate.split("T")[0] : "",
            status: task.status || "pending",
          }))
        : [],
    }
  }

  // Define initial form values based on fetched scheduleData
  const initialValues = scheduleData ? transformSchedule(scheduleData) : {
    title: "",
    description: "",
    projectId: "",
    startDate: "",
    endDate: "",
    status: "scheduled",
    assignedUsers: [],
    tasks: [{ title: "", description: "", startDate: "", endDate: "", status: "pending" }],
  }

  // Form validation schema
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
      .required("Assigned users are required"),
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

  // Mutation for updating schedule
  const mutation = useMutation(
    (values) => {
      return schedulesAPI.updateSchedule(id, values)
    },
    {
      onSuccess: () => {
        toast.success("Schedule updated successfully")
        queryClient.invalidateQueries(["schedule", id])
        navigate(`/admin/schedules/${id}`)
      },
      onError: (error) => {
        toast.error("Failed to update schedule")
        console.error(error)
      },
    }
  )

  const handleSubmit = (values, { setSubmitting }) => {
    mutation.mutate(values)
    setSubmitting(false)
  }

  if (loadingSchedule || loadingProjects || loadingUsers) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (scheduleError || projectsError || usersError) {
    return <div className="py-6 px-4 sm:px-6 lg:px-8">Error loading data.</div>
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center">
        <button
          onClick={() => navigate(`/admin/schedules/${id}`)}
          className="mr-4 text-indigo-600 hover:text-indigo-900"
        >
          <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Edit Schedule</h1>
          <p className="mt-1 text-sm text-gray-500">Update schedule details, tasks, and team assignments.</p>
        </div>
      </div>

      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit} enableReinitialize>
        {({ values, isSubmitting }) => (
          <Form className="space-y-8 divide-y divide-gray-200">
            {/* Basic Information */}
            <div className="pt-8">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Basic Information</h3>
                <p className="mt-1 text-sm text-gray-500">Update the general details about this schedule.</p>
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
                  <p className="mt-2 text-sm text-gray-500">Brief description of the schedule and its purpose.</p>
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
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
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
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.role})
                        </option>
                      ))}
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
                <p className="mt-1 text-sm text-gray-500">Manage tasks for this schedule.</p>
              </div>
              <FieldArray name="tasks">
                {({ push, remove }) => (
                  <div>
                    {values.tasks.map((task, index) => (
                      <div key={index} className="mt-6 p-4 border border-gray-200 rounded-md">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-md font-medium text-gray-900">Task {index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Remove
                          </button>
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
                  onClick={() => navigate(`/admin/schedules/${id}`)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || mutation.isLoading}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isSubmitting || mutation.isLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  )
}

export default EditSchedule
