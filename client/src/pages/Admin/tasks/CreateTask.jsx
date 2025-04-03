

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  UserGroupIcon, // Icon for assignees
  ExclamationTriangleIcon, // Icon for warnings/errors
} from "@heroicons/react/24/outline";
import tasksAPI from "../../../api/tasks";
import projectsAPI from "../../../api/projects";
// Removed usersAPI import as getAllUsers is no longer needed
import authAPI from "../../../api/auth"; // Keep for admin check

const CreateTask = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isSubmittingInternal, setIsSubmittingInternal] = useState(false); // Renamed to avoid conflict

  // Get projectId from URL query parameter
  const queryParams = new URLSearchParams(location.search);
  const projectIdFromQuery = queryParams.get("projectId");

  const isAdmin = authAPI.isAdmin(); // Assuming this check works synchronously

  // Redirect if not admin or no project ID is provided
  useEffect(() => {
    if (!isAdmin) {
      toast.error("Access denied.");
      navigate("/dashboard");
    }
    if (!projectIdFromQuery) {
      toast.error("No project selected to create a task for.");
      navigate("/admin/tasks"); // Or back to project selection
    }
  }, [isAdmin, navigate, projectIdFromQuery]);


  // --- Fetch the specific project to get associated users ---
  const {
    data: projectQueryData, // Renamed to avoid clash with projectsData if you had it before
    isLoading: isLoadingProject,
    error: projectError,
    isFetching: isFetchingProject, // Use isFetching for background updates too
  } = useQuery({
    // Key includes project ID for specific caching
    queryKey: ["project", projectIdFromQuery],
    // Fetch only if projectIdFromQuery exists
    queryFn: () => projectsAPI.getProjectById(projectIdFromQuery),
    // Only run the query if projectIdFromQuery is present and user is admin
    enabled: !!projectIdFromQuery && isAdmin,
    // Optional: staleTime if project details don't change often while creating tasks
    // staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // --- Create Task Mutation ---
  const createTaskMutation = useMutation({
    mutationFn: (taskData) => tasksAPI.createTask(taskData),
    onSuccess: () => {
      toast.success("Task created successfully");
      // Invalidate queries that might be affected
      queryClient.invalidateQueries({ queryKey: ["tasks", projectIdFromQuery] }); // Invalidate tasks for this specific project
      queryClient.invalidateQueries({ queryKey: ["project", projectIdFromQuery] }); // Invalidate project details (e.g., if task count is shown)
       queryClient.invalidateQueries({ queryKey: ["tasks"] }); // Invalidate generic task list if you have one
      navigate("/admin/tasks"); // Go back to task list (which should filter by project)
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to create task";
      toast.error(errorMessage);
      setIsSubmittingInternal(false); // Re-enable form on error
    },
     onSettled: () => {
      setIsSubmittingInternal(false); // Ensure button is re-enabled after success or error
    }
  });

  // --- Derive Assignee Options from Fetched Project ---
  const projectDetails = projectQueryData?.data; // The actual project object
  let assigneeOptions = [];
  if (projectDetails) {
    const potentialAssignees = new Map(); // Use Map to handle potential duplicates easily

    // Add users if they exist in the project details (assuming populated)
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

    // Convert Map values back to an array for the dropdown
    assigneeOptions = Array.from(potentialAssignees.values());
     console.log("Derived Assignee Options:", assigneeOptions); // Debugging
  }

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
    // Project is now fixed based on projectIdFromQuery, no need for validation here?
    // project: Yup.string().required("Project is required"),
    assignedTo: Yup.array()
      .of(Yup.string()) // Expecting an array of user ID strings
      .min(1, "Please select at least one assignee"),
    status: Yup.string()
      .required("Status is required")
      .oneOf(["not_started", "in_progress", "completed", "on_hold"], "Invalid status"),
    priority: Yup.string()
      .required("Priority is required")
      .oneOf(["low", "medium", "high"], "Invalid priority"),
  });

  // --- Initial Form Values ---
  const initialValues = {
    taskName: "",
    taskDescription: "",
    startDate: "",
    endDate: "",
    project: projectIdFromQuery || "", // Fixed project ID
    assignedTo: [], // Initialize as empty array for multi-select
    status: "not_started",
    priority: "medium",
  };

  // --- Handle Form Submission ---
  const handleSubmit = (values) => {
     if (createTaskMutation.isLoading) return; // Prevent double submission
    setIsSubmittingInternal(true);

    const formattedValues = {
      ...values,
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
      project: projectIdFromQuery, // Ensure we use the fixed project ID
      // assignedTo is already an array of user IDs from Formik state
    };
    console.log("Submitting Task Data:", formattedValues); // Debugging
    createTaskMutation.mutate(formattedValues);
  };

  // --- Render Logic ---
  if (!isAdmin || !projectIdFromQuery) {
    // Should be redirected by useEffect, but return null as fallback
    return null;
  }

  // Display loading state while fetching the project
  if (isLoadingProject) {
     return (
      <div className="py-20 text-center">
        <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
        <p className="mt-2 text-gray-500">Loading project details...</p>
      </div>
     )
  }

   // Display error state if project fetch failed
  if (projectError) {
    return (
       <div className="py-20 px-4 text-center">
        <ExclamationTriangleIcon className="h-10 w-10 mx-auto text-red-500" />
        <p className="mt-2 text-red-600 font-medium">Error loading project details</p>
        <p className="text-sm text-red-500 mb-4">{projectError.message}</p>
        <button
            type="button"
            onClick={() => navigate("/admin/tasks")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
           <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Go Back
        </button>
      </div>
    )
  }

  // Display warning if project loaded but has no assignable users
  if (!isLoadingProject && assigneeOptions.length === 0 && projectDetails) {
     return (
       <div className="py-20 px-4 text-center">
        <UserGroupIcon className="h-10 w-10 mx-auto text-yellow-500" />
        <p className="mt-2 text-yellow-700 font-medium">No Assignable Users Found</p>
        <p className="text-sm text-yellow-600 mb-4">
          The selected project does not have an active Contractor, Consultant, or Project Manager assigned. Please update the project assignments to create tasks.
        </p>
         <button
            type="button"
            onClick={() => navigate(`/admin/projects/edit/${projectIdFromQuery}`)} // Link to edit project
            className="mr-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
           Edit Project
        </button>
        <button
            type="button"
            onClick={() => navigate("/admin/tasks")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
           <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Go Back
        </button>
      </div>
     )
  }


  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Create New Task</h1>
          <p className="text-gray-500 text-sm">
            For Project: <span className="font-medium">{projectDetails?.projectName || "Loading..."}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/tasks")} // Navigate back to the tasks list
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
            validateOnChange={false} // Validate only on blur/submit
            validateOnBlur={true}
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
                        placeholder="e.g., Install HVAC System"
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
                        placeholder="Detailed steps, requirements, or notes..."
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.taskDescription && touched.taskDescription ? "border-red-500" : ""
                        }`}
                      />
                      <ErrorMessage name="taskDescription" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  {/* Project (Display Only - Not Editable Here) */}
                  <div className="sm:col-span-2">
                    <label htmlFor="projectDisplay" className="block text-sm font-medium text-gray-700">
                      Project
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="projectDisplay"
                        value={projectDetails?.projectName || ""}
                        disabled // Make it non-editable
                        className="shadow-sm block w-full sm:text-sm border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                      />
                      {/* Hidden field to ensure project ID is technically part of form state if needed, though we use projectIdFromQuery */}
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

                   {/* Assigned To (Multi-Select from Project Users) */}
                  <div className="sm:col-span-2"> {/* Make it full width for better multi-select view */}
                    <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
                      Assigned To <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <Field
                        as="select"
                        name="assignedTo"
                        id="assignedTo"
                        multiple // Enable multiple selections
                        // --- CORRECTED className ---
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md h-24 ${ // Added height for multi-select class here
                          errors.assignedTo && touched.assignedTo ? "border-red-500" : ""
                        }`} // Removed the comment from inside ${}
                        // --- End Corrected className ---
                        // Disabled while project data is loading/fetching
                        disabled={isLoadingProject || isFetchingProject || assigneeOptions.length === 0}
                      >
                         {/* No placeholder needed for HTML multi-select */}
                        {assigneeOptions.map((user) => (
                          <option key={user._id} value={user._id}>
                             {/* Display name and their role in this project */}
                            {user.firstName} {user.lastName} ({user.roleLabel || user.role})
                          </option>
                        ))}
                      </Field>
                      {/* Indicate loading state for assignees derived from project */}
                      {(isLoadingProject || isFetchingProject) && (
                           <p className="mt-1 text-sm text-gray-500">Loading assignees...</p>
                      )}
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
                    onClick={() => navigate("/admin/tasks")} // Go back to tasks list
                    className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    // Disable if submitting or if there are no assignees to select
                    disabled={isSubmittingInternal || createTaskMutation.isLoading || assigneeOptions.length === 0}
                    className={`inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                      isSubmittingInternal || createTaskMutation.isLoading || assigneeOptions.length === 0
                        ? "bg-indigo-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    }`}
                  >
                    {isSubmittingInternal || createTaskMutation.isLoading ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" aria-hidden="true" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5 mr-2" aria-hidden="true" />
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
  );
};

export default CreateTask;