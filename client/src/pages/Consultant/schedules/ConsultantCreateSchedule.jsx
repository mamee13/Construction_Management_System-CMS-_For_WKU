 /* eslint-disable  */


import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { ArrowPathIcon, CalendarIcon } from "@heroicons/react/24/outline";
import schedulesAPI from "../../../api/schedules";
import projectsAPI from "../../../api/projects";
import tasksAPI from "../../../api/tasks";
import usersAPI from "../../../api/users";
import authAPI from "../../../api/auth"; // Corrected import path casing if needed

const ConsultantCreateSchedule = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentUser = authAPI.getCurrentUser(); // Ensure this function correctly returns { _id, role, ... }

  // Fetch projects - adjusts based on role
  const {
    data: projectsData, // Raw response: { success, data: [...] } or { success, data: { projects: [...] } }
    isLoading: isLoadingProjects,
    error: projectsError,
  } = useQuery({
    queryKey: ["projects", currentUser?.role], // Include role in queryKey if logic depends on it
    queryFn: () => {
      if (currentUser?.role === "consultant") {
        console.log("Fetching assigned projects for consultant");
        return projectsAPI.getMyAssignedProjects(); // Expects { success, data: { projects: [...] } }
      }
      console.log("Fetching all projects for admin");
      return projectsAPI.getAllProjects(); // Expects { success, data: [...] }
    },
    enabled: !!currentUser, // Only run query if currentUser is loaded
  });

  // Normalize projects response into a consistent array
  // Handles both admin ({ data: [...] }) and consultant ({ data: { projects: [...] } }) structures
  const projectsList = projectsData?.success
    ? Array.isArray(projectsData.data)
      ? projectsData.data // Admin: data is the array
      : projectsData.data?.projects || [] // Consultant: data.projects is the array
    : []; // Default to empty array if no data or success is false

  // Debug log for project data processing
  useEffect(() => {
    console.log("Raw Projects Data Received:", projectsData);
    console.log("Normalized Projects List for Dropdown:", projectsList);
  }, [projectsData, projectsList]);

  // Fetch all tasks initially - we will filter client-side based on selected project
  const {
    data: tasksResponse, // Raw response: { success, data: [...] }
    isLoading: isLoadingTasks,
    error: tasksError,
  } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => tasksAPI.getTasks(), // Expects { success, data: [...] }
  });

  // Extract the tasks array from the response
  const allTasksList = tasksResponse?.success ? tasksResponse.data : [];

  // Debug log for task data
  useEffect(() => {
    console.log("Raw Tasks Response Received:", tasksResponse);
    console.log("Extracted Tasks List:", allTasksList);
  }, [tasksResponse, allTasksList]);


  // Fetch all users (for assignment)
  const {
    data: usersResponse, // Raw response: { success, data: { users: [...] } } or similar
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersAPI.getAllUsers(), // Expects { success, data: { users: [...] } }
  });

  // Extract users array - adjust path based on your actual API response structure
   const usersList = usersResponse?.success ? usersResponse.data?.users || usersResponse.data || [] : [];


  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: schedulesAPI.createSchedule,
    onSuccess: (data) => {
      toast.success(data?.message || "Schedule created successfully");
      navigate("/consultant/schedules"); // Navigate to the consultant schedule list
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create schedule");
      setIsSubmitting(false);
    },
    onSettled: () => {
      // This runs on both success and error
      // setIsSubmitting(false); // Moved setIsSubmitting(false) specifically into onError
    }
  });

  // Validation schema
  const validationSchema = Yup.object({
    scheduleName: Yup.string()
      .required("Schedule name is required")
      .max(100, "Schedule name cannot exceed 100 characters"),
    scheduleDescription: Yup.string()
      .required("Schedule description is required")
      .max(500, "Description cannot exceed 500 characters"),
    startDate: Yup.date().required("Start date is required"),
    endDate: Yup.date()
      .required("End date is required")
      .min(Yup.ref("startDate"), "End date cannot be before the start date"),
    project: Yup.string().required("Project selection is required"), // Project ID
    task: Yup.string().required("Task selection is required"), // Task ID
    assignedTo: Yup.string().required("Assigning a user is required"), // User ID
    status: Yup.string()
      .required("Status is required")
      .oneOf(["planned", "in_progress", "completed", "delayed"], "Invalid status"),
    priority: Yup.string()
      .required("Priority is required")
      .oneOf(["low", "medium", "high"], "Invalid priority"),
  });

  // Initial form values
  const initialValues = {
    scheduleName: "",
    scheduleDescription: "",
    startDate: "",
    endDate: "",
    project: "", // Will hold the selected Project ID
    task: "",    // Will hold the selected Task ID
    assignedTo: "", // Will hold the selected User ID
    status: "planned",
    priority: "medium",
  };

  // Handle form submission
  const handleSubmit = (values) => {
    setIsSubmitting(true);
    // Format dates to ISO string for backend consistency if needed
    // Backend model seems to handle Date objects directly, but ISO string is safer.
    const formattedValues = {
      ...values,
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
      // Ensure assignedTo, project, task are the IDs as expected by the backend
    };
    console.log("Submitting schedule data:", formattedValues);
    createScheduleMutation.mutate(formattedValues);
  };

  // Check if user is authenticated and has the correct role
  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      toast.error("Please login to continue.");
      navigate("/login");
      return;
    }
    // Allow both consultant and admin to create schedules
    if (currentUser && currentUser.role !== "consultant" && currentUser.role !== "admin") {
       toast.warn("You do not have permission to create schedules.");
       navigate("/dashboard"); // Or appropriate redirect
    }
  }, [currentUser, navigate]);


  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Create New Schedule</h1>
          <p className="text-gray-500 text-sm">Add a new schedule entry associated with a project task.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/consultant/schedules")} // Adjust path if needed
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
            validateOnChange={false} // Validate only on blur/submit
            validateOnBlur={true}
          >
            {/* Pass Formik state and helpers to the render prop */}
            {({ errors, touched, values, setFieldValue, isSubmitting: formikIsSubmitting }) => (
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
                        placeholder="E.g., Foundation Pouring - Phase 1"
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
                        placeholder="Details about this specific schedule entry..."
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.scheduleDescription && touched.scheduleDescription ? "border-red-500" : ""
                        }`}
                      />
                      <ErrorMessage name="scheduleDescription" component="p" className="mt-1 text-sm text-red-600" />
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
                        onChange={(e) => {
                          setFieldValue("project", e.target.value);
                          setFieldValue("task", ""); // Reset task when project changes
                        }}
                        disabled={isLoadingProjects} // Disable while loading
                      >
                        {/* Dynamic options based on loading state and data */}
                        {isLoadingProjects ? (
                          <option value="">Loading projects...</option>
                        ) : !projectsList || projectsList.length === 0 ? (
                          <option value="">No projects available</option>
                        ) : (
                          <>
                            <option value="">Select a project</option>
                            {projectsList.map((project) => (
                              <option key={project._id} value={project._id}>
                                {project.projectName}
                              </option>
                            ))}
                          </>
                        )}
                      </Field>
                      {/* Display API error below the field */}
                      {projectsError && (
                        <p className="mt-1 text-sm text-red-600">
                          Error loading projects: {projectsError.message}
                        </p>
                      )}
                      {/* Display Formik validation error */}
                      <ErrorMessage name="project" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Task Dropdown */}
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
                        disabled={isLoadingTasks || !values.project} // Disable if tasks loading or no project selected
                      >
                        {/* Default option logic */}
                        <option value="">
                          {!values.project ? "Select a project first" :
                           isLoadingTasks ? "Loading tasks..." :
                           "Select a task"}
                        </option>

                        {/* *** CORRECTED FILTERING LOGIC *** */}
                        {!isLoadingTasks && values.project && allTasksList
                          ?.filter((task) => task.project?._id === values.project) // Compare task.project._id with selected project ID
                          .map((task) => (
                            <option key={task._id} value={task._id}>
                              {task.taskName} {/* Display task name */}
                            </option>
                          ))
                        }
                        {/* *** END CORRECTION *** */}
                      </Field>

                      {/* Loading/Error/Helper messages */}
                       {tasksError && (
                        <p className="mt-1 text-sm text-red-600">
                          Error loading tasks: {tasksError.message}
                        </p>
                      )}
                      {!isLoadingTasks && values.project && allTasksList?.filter(t => t.project?._id === values.project).length === 0 && (
                          <p className="mt-1 text-sm text-yellow-600">
                              No tasks found for the selected project.
                          </p>
                      )}
                      {/* Formik validation error */}
                      <ErrorMessage name="task" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                      Start Date
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <Field
                        type="date"
                        name="startDate"
                        id="startDate"
                        className={`pl-10 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.startDate && touched.startDate ? "border-red-500" : ""
                        }`}
                      />
                    </div>
                     <ErrorMessage name="startDate" component="p" className="mt-1 text-sm text-red-600" />
                  </div>

                  {/* End Date */}
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                      End Date
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <Field
                        type="date"
                        name="endDate"
                        id="endDate"
                        className={`pl-10 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.endDate && touched.endDate ? "border-red-500" : ""
                        }`}
                      />
                    </div>
                     <ErrorMessage name="endDate" component="p" className="mt-1 text-sm text-red-600" />
                  </div>

                  {/* Assigned To Dropdown */}
                  <div>
                    <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
                      Assigned To
                    </label>
                    <div className="mt-1">
                      <Field
                        as="select"
                        name="assignedTo"
                        id="assignedTo"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.assignedTo && touched.assignedTo ? "border-red-500" : ""
                        }`}
                        disabled={isLoadingUsers}
                      >
                         {isLoadingUsers ? (
                          <option value="">Loading users...</option>
                        ) : !usersList || usersList.length === 0 ? (
                          <option value="">No users available</option>
                        ) : (
                          <>
                            <option value="">Select a user</option>
                            {/* Ensure usersList has the correct structure */}
                            {usersList.map((user) => (
                              <option key={user._id} value={user._id}>
                                {user.firstName} {user.lastName} ({user.role})
                              </option>
                            ))}
                          </>
                        )}
                      </Field>
                       {usersError && (
                        <p className="mt-1 text-sm text-red-600">
                          Error loading users: {usersError.message}
                        </p>
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
                        <option value="planned">Planned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="delayed">Delayed</option>
                      </Field>
                      <ErrorMessage name="status" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Priority Dropdown */}
                  <div className="sm:col-span-2"> {/* Made Priority span 2 for better layout on smaller screens potentially */}
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

                {/* Submit/Cancel Buttons */}
                <div className="pt-5">
                  <div className="flex justify-end">
                     <button
                        type="button"
                        onClick={() => navigate("/consultant/schedules")} // Adjust path if needed
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        disabled={isSubmitting || formikIsSubmitting} // Disable if submitting
                     >
                        Cancel
                     </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || formikIsSubmitting} // Use local submitting state OR Formik's isSubmitting
                      className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white
                        ${
                          (isSubmitting || formikIsSubmitting)
                            ? "bg-indigo-400 cursor-not-allowed"
                            : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        }`}
                    >
                      {(isSubmitting || formikIsSubmitting) ? (
                        <>
                          <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" aria-hidden="true" />
                          Creating...
                        </>
                      ) : (
                        "Create Schedule"
                      )}
                    </button>
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default ConsultantCreateSchedule;