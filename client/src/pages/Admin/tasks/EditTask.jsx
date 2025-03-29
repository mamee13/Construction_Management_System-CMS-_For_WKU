




/*eslint-disable */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import tasksAPI from "../../../api/tasks";
import projectsAPI from "../../../api/projects";
// No longer need usersAPI.getAllUsers
import authAPI from "../../../api/auth";

const EditTask = () => {
  const { id } = useParams(); // Task ID from URL
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmittingInternal, setIsSubmittingInternal] = useState(false); // Renamed
  const [isAdmin, setIsAdmin] = useState(false);

  // --- Authorization Check ---
  useEffect(() => {
    const checkAdminStatus = () => {
        const adminStatus = authAPI.isAdmin(); // Assuming sync check
        setIsAdmin(adminStatus);
        if (!adminStatus) {
            toast.error("Access Denied.");
            navigate("/dashboard");
        }
    };
    checkAdminStatus();
  }, [navigate]);

  // --- Fetch Task Details ---
  const {
    data: taskQueryData, // Renamed for clarity
    isLoading: isLoadingTask,
    error: taskError,
    isFetching: isFetchingTask, // Track background fetching
  } = useQuery({
    queryKey: ["tasks", id],
    queryFn: () => tasksAPI.getTaskById(id),
    enabled: isAdmin, // Only fetch if admin
    staleTime: 1 * 60 * 1000, // Keep task data fresh for a minute
  });

  // Extract task details and project ID once task is loaded
  const task = taskQueryData?.data; // The actual task object
  const taskProjectId = task?.project?._id; // Get project ID from the loaded task

  // --- Fetch the specific Project associated with the Task ---
  const {
    data: projectQueryData,
    isLoading: isLoadingProject,
    error: projectError,
    isFetching: isFetchingProject,
  } = useQuery({
    queryKey: ["project", taskProjectId], // Key depends on the task's project ID
    queryFn: () => projectsAPI.getProjectById(taskProjectId),
    // Enable this query ONLY when we have the taskProjectId and user is admin
    enabled: !!taskProjectId && isAdmin,
  });

   // --- Derive Assignee Options from Fetched Project ---
  const projectDetails = projectQueryData?.data; // The actual project object
  let assigneeOptions = [];
  if (projectDetails) {
    const potentialAssignees = new Map();
    // Add project personnel if they exist and are active
     if (projectDetails.contractor?._id && projectDetails.contractor?.isActive) {
      potentialAssignees.set(projectDetails.contractor._id, {
        ...projectDetails.contractor,
        roleLabel: 'Contractor'
      });
    }
    if (projectDetails.consultant?._id && projectDetails.consultant?.isActive) {
      potentialAssignees.set(projectDetails.consultant._id, {
         ...projectDetails.consultant,
         roleLabel: 'Consultant'
      });
    }
    if (projectDetails.projectManager?._id && projectDetails.projectManager?.isActive) {
      potentialAssignees.set(projectDetails.projectManager._id, {
         ...projectDetails.projectManager,
         roleLabel: 'Project Manager'
      });
    }
    assigneeOptions = Array.from(potentialAssignees.values());
    console.log("Derived Assignee Options for Edit:", assigneeOptions);
  }

  // --- Update Task Mutation ---
  const updateTaskMutation = useMutation({
    mutationFn: (taskUpdateData) => tasksAPI.updateTask(id, taskUpdateData),
    onSuccess: () => {
      toast.success("Task updated successfully");
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["tasks", id] }); // This specific task
      queryClient.invalidateQueries({ queryKey: ["tasks", taskProjectId] }); // Tasks for the project
      queryClient.invalidateQueries({ queryKey: ["tasks"] }); // General task list if exists
      queryClient.invalidateQueries({ queryKey: ["project", taskProjectId] }); // Project details might be affected if tasks list is shown there
      navigate(`/admin/tasks`); // Navigate back to task list
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to update task";
      toast.error(errorMessage);
      setIsSubmittingInternal(false); // Re-enable on error
    },
     onSettled: () => {
      setIsSubmittingInternal(false); // Re-enable always
    }
  });

  // --- Validation Schema ---
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
    // Project is not validated as it's disabled
    // project: Yup.string().required("Project is required"),
    assignedTo: Yup.string().required("Assignee is required"), // Validates single assignee ID string
    status: Yup.string()
      .required("Status is required")
      .oneOf(["not_started", "in_progress", "completed", "on_hold"], "Invalid status"),
    priority: Yup.string()
      .required("Priority is required")
      .oneOf(["low", "medium", "high"], "Invalid priority"),
  });

  // Helper to format date for <input type="date">
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
    } catch (e) { return "" }
  }

   // --- Initial Form Values ---
   // Set only when task data is available
  const initialValues = task ? {
    taskName: task.taskName || "",
    taskDescription: task.taskDescription || "",
    startDate: formatDateForInput(task.startDate),
    endDate: formatDateForInput(task.endDate),
    project: task.project?._id || "", // Store project ID
    assignedTo: task.assignedTo?._id || "", // Store current assignee ID
    status: task.status || "not_started",
    priority: task.priority || "medium",
  } : { // Default structure for Formik before data loads
    taskName: "",
    taskDescription: "",
    startDate: "",
    endDate: "",
    project: "",
    assignedTo: "",
    status: "not_started",
    priority: "medium",
  };


  // --- Handle Form Submission ---
  const handleSubmit = (values) => {
     if (updateTaskMutation.isLoading) return;
    setIsSubmittingInternal(true);
    const formattedValues = {
      ...values,
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
      project: taskProjectId, // Ensure project ID remains the original one
      // assignedTo is already the selected user ID string
    };
    console.log("Submitting Task Update:", formattedValues);
    updateTaskMutation.mutate(formattedValues);
  }


  // --- Render Logic ---

  // Don't render anything until admin status is confirmed
  if (!isAdmin) {
    return null;
  }

  // Combined Loading State for Task and its Project Details (needed for assignees)
  if (isLoadingTask || (taskProjectId && isLoadingProject)) {
    return (
      <div className="py-20 text-center">
        <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
        <p className="mt-2 text-gray-500">Loading task and project details...</p>
      </div>
    );
  }

  // Handle Task Loading Error
  if (taskError) {
    return (
      <div className="py-20 text-center px-4">
         <ExclamationTriangleIcon className="h-10 w-10 mx-auto text-red-500" />
        <p className="mt-2 text-red-600 font-medium">Error loading task details</p>
        <p className="text-sm text-red-500 mb-4">{taskError.message}</p>
        <button
          onClick={() => navigate("/admin/tasks")}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Tasks
        </button>
      </div>
    );
  }

   // Handle Project Loading Error (after task has loaded)
  if (projectError && taskProjectId) {
    return (
      <div className="py-20 text-center px-4">
         <ExclamationTriangleIcon className="h-10 w-10 mx-auto text-red-500" />
        <p className="mt-2 text-red-600 font-medium">Error loading project details for assignees</p>
        <p className="text-sm text-red-500 mb-4">{projectError.message}</p>
         <button
          onClick={() => navigate("/admin/tasks")}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Tasks
        </button>
      </div>
    );
  }

   // Handle case where task loaded, project loaded, but no assignees found
   // This check runs only after both queries are done loading and not in error
   if (!isLoadingTask && !isLoadingProject && assigneeOptions.length === 0 && projectDetails) {
     return (
       <div className="py-20 px-4 text-center">
        <UserGroupIcon className="h-10 w-10 mx-auto text-yellow-500" />
        <p className="mt-2 text-yellow-700 font-medium">No Assignable Users Found for this Project</p>
        <p className="text-sm text-yellow-600 mb-4">
          Cannot edit assignee. The associated project ({projectDetails.projectName}) does not have an active Contractor, Consultant, or Project Manager assigned.
        </p>
         <button
            type="button"
            onClick={() => navigate(`/admin/projects/edit/${taskProjectId}`)} // Link to edit project
            className="mr-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
           Edit Project Assignments
        </button>
        <button
            type="button"
            onClick={() => navigate("/admin/tasks")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
           <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Tasks
        </button>
      </div>
     )
  }

  // Ensure task data is loaded before rendering Formik
  if (!task) {
     return (
      <div className="py-20 text-center">
         <p className="mt-2 text-gray-500">Task data not available yet.</p>
         {/* Could add a retry button here if desired */}
      </div>
     )
  }


  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Edit Task</h1>
          <p className="text-gray-500 text-sm">Update details for task: <span className="font-medium">{task.taskName}</span></p>
          <p className="text-gray-500 text-sm mt-1">
            Project: <span className="font-medium">{projectDetails?.projectName || task.project?.projectName || 'Loading...'}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/admin/tasks`)} // Go back to task list
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Tasks
        </button>
      </div>

      {/* Form Card */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            validateOnChange={false}
            validateOnBlur={true}
            enableReinitialize={true} // Update form if taskData changes
          >
            {({ errors, touched }) => (
              <Form className="space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                  {/* Task Name */}
                  <div className="sm:col-span-2">
                    <label htmlFor="taskName" className="block text-sm font-medium text-gray-700">
                      Task Name <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <Field
                        type="text"
                        name="taskName"
                        id="taskName"
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
                      Description <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <Field
                        as="textarea"
                        name="taskDescription"
                        id="taskDescription"
                        rows={3}
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.taskDescription && touched.taskDescription ? "border-red-500" : ""
                        }`}
                      />
                      <ErrorMessage name="taskDescription" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Project (Display Only) */}
                  <div className="sm:col-span-2">
                    <label htmlFor="projectDisplay" className="block text-sm font-medium text-gray-700">
                      Project
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="projectDisplay"
                        // Display name from fetched project details or fallback to task's project name
                        value={projectDetails?.projectName || task.project?.projectName || ""}
                        disabled
                        className="shadow-sm block w-full sm:text-sm border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                      />
                       <Field type="hidden" name="project" />
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

                  {/* Assigned To (Single Select from Project Users) */}
                  {/* Adjust col-span if needed */}
                  <div className="sm:col-span-2">
                    <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
                      Assigned To <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <Field
                        as="select" // Single select
                        name="assignedTo"
                        id="assignedTo"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.assignedTo && touched.assignedTo ? "border-red-500" : ""
                        }`}
                        // Disable while project/assignee options are loading or if none exist
                        disabled={isLoadingProject || isFetchingProject || assigneeOptions.length === 0}
                      >
                        <option value="">Select an assignee</option> {/* Placeholder */}
                        {assigneeOptions.map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.firstName} {user.lastName} ({user.roleLabel || user.role})
                          </option>
                        ))}
                      </Field>
                      {(isLoadingProject || isFetchingProject) && (
                           <p className="mt-1 text-sm text-gray-500">Loading assignees...</p>
                      )}
                       {/* Add error message specific to loading project for assignees? */}
                      <ErrorMessage name="assignedTo" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>


                  {/* Status Dropdown */}
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      Status <span className="text-red-500">*</span>
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
                      Priority <span className="text-red-500">*</span>
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

                </div> {/* End Grid */}

                {/* Submit/Cancel Buttons */}
                <div className="flex justify-end pt-5">
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/tasks`)} // Go back to list
                    className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                     // Disable if submitting or if assignee options unavailable
                    disabled={isSubmittingInternal || updateTaskMutation.isLoading || (projectDetails && assigneeOptions.length === 0)}
                    className={`inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                      isSubmittingInternal || updateTaskMutation.isLoading || (projectDetails && assigneeOptions.length === 0)
                        ? "bg-indigo-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    }`}
                  >
                    {isSubmittingInternal || updateTaskMutation.isLoading ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" aria-hidden="true" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                        Update Task
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
  );
};

export default EditTask;