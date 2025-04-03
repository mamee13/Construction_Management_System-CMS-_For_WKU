




// // // /*eslint-disable */
// // // import { useState, useEffect } from "react";
// // // import { useParams, useNavigate } from "react-router-dom";
// // // import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// // // import { Formik, Form, Field, ErrorMessage } from "formik";
// // // import * as Yup from "yup";
// // // import { toast } from "react-toastify";
// // // import {
// // //   ArrowPathIcon,
// // //   CheckCircleIcon,
// // //   ArrowLeftIcon,
// // //   UserGroupIcon,
// // //   ExclamationTriangleIcon,
// // // } from "@heroicons/react/24/outline";
// // // import tasksAPI from "../../../api/tasks";
// // // import projectsAPI from "../../../api/projects";
// // // // No longer need usersAPI.getAllUsers
// // // import authAPI from "../../../api/auth";

// // // const EditTask = () => {
// // //   const { id } = useParams(); // Task ID from URL
// // //   const navigate = useNavigate();
// // //   const queryClient = useQueryClient();
// // //   const [isSubmittingInternal, setIsSubmittingInternal] = useState(false); // Renamed
// // //   const [isAdmin, setIsAdmin] = useState(false);

// // //   // --- Authorization Check ---
// // //   useEffect(() => {
// // //     const checkAdminStatus = () => {
// // //         const adminStatus = authAPI.isAdmin(); // Assuming sync check
// // //         setIsAdmin(adminStatus);
// // //         if (!adminStatus) {
// // //             toast.error("Access Denied.");
// // //             navigate("/dashboard");
// // //         }
// // //     };
// // //     checkAdminStatus();
// // //   }, [navigate]);

// // //   // --- Fetch Task Details ---
// // //   const {
// // //     data: taskQueryData, // Renamed for clarity
// // //     isLoading: isLoadingTask,
// // //     error: taskError,
// // //     isFetching: isFetchingTask, // Track background fetching
// // //   } = useQuery({
// // //     queryKey: ["tasks", id],
// // //     queryFn: () => tasksAPI.getTaskById(id),
// // //     enabled: isAdmin, // Only fetch if admin
// // //     staleTime: 1 * 60 * 1000, // Keep task data fresh for a minute
// // //   });

// // //   // Extract task details and project ID once task is loaded
// // //   const task = taskQueryData?.data; // The actual task object
// // //   const taskProjectId = task?.project?._id; // Get project ID from the loaded task

// // //   // --- Fetch the specific Project associated with the Task ---
// // //   const {
// // //     data: projectQueryData,
// // //     isLoading: isLoadingProject,
// // //     error: projectError,
// // //     isFetching: isFetchingProject,
// // //   } = useQuery({
// // //     queryKey: ["project", taskProjectId], // Key depends on the task's project ID
// // //     queryFn: () => projectsAPI.getProjectById(taskProjectId),
// // //     // Enable this query ONLY when we have the taskProjectId and user is admin
// // //     enabled: !!taskProjectId && isAdmin,
// // //   });

// // //    // --- Derive Assignee Options from Fetched Project ---
// // //   const projectDetails = projectQueryData?.data; // The actual project object
// // //   let assigneeOptions = [];
// // //   if (projectDetails) {
// // //     const potentialAssignees = new Map();
// // //     // Add project personnel if they exist and are active
// // //      if (projectDetails.contractor?._id && projectDetails.contractor?.isActive) {
// // //       potentialAssignees.set(projectDetails.contractor._id, {
// // //         ...projectDetails.contractor,
// // //         roleLabel: 'Contractor'
// // //       });
// // //     }
// // //     if (projectDetails.consultant?._id && projectDetails.consultant?.isActive) {
// // //       potentialAssignees.set(projectDetails.consultant._id, {
// // //          ...projectDetails.consultant,
// // //          roleLabel: 'Consultant'
// // //       });
// // //     }
// // //     if (projectDetails.projectManager?._id && projectDetails.projectManager?.isActive) {
// // //       potentialAssignees.set(projectDetails.projectManager._id, {
// // //          ...projectDetails.projectManager,
// // //          roleLabel: 'Project Manager'
// // //       });
// // //     }
// // //     assigneeOptions = Array.from(potentialAssignees.values());
// // //     console.log("Derived Assignee Options for Edit:", assigneeOptions);
// // //   }

// // //   // --- Update Task Mutation ---
// // //   const updateTaskMutation = useMutation({
// // //     mutationFn: (taskUpdateData) => tasksAPI.updateTask(id, taskUpdateData),
// // //     onSuccess: () => {
// // //       toast.success("Task updated successfully");
// // //       // Invalidate relevant queries
// // //       queryClient.invalidateQueries({ queryKey: ["tasks", id] }); // This specific task
// // //       queryClient.invalidateQueries({ queryKey: ["tasks", taskProjectId] }); // Tasks for the project
// // //       queryClient.invalidateQueries({ queryKey: ["tasks"] }); // General task list if exists
// // //       queryClient.invalidateQueries({ queryKey: ["project", taskProjectId] }); // Project details might be affected if tasks list is shown there
// // //       navigate(`/admin/tasks`); // Navigate back to task list
// // //     },
// // //     onError: (error) => {
// // //       const errorMessage = error.response?.data?.message || error.message || "Failed to update task";
// // //       toast.error(errorMessage);
// // //       setIsSubmittingInternal(false); // Re-enable on error
// // //     },
// // //      onSettled: () => {
// // //       setIsSubmittingInternal(false); // Re-enable always
// // //     }
// // //   });

// // //   // --- Validation Schema ---
// // //   const validationSchema = Yup.object({
// // //     taskName: Yup.string()
// // //       .required("Task name is required")
// // //       .max(100, "Task name cannot exceed 100 characters"),
// // //     taskDescription: Yup.string()
// // //       .required("Description is required")
// // //       .max(500, "Description cannot exceed 500 characters"),
// // //     startDate: Yup.date().required("Start date is required"),
// // //     endDate: Yup.date()
// // //       .required("End date is required")
// // //       .min(Yup.ref("startDate"), "End date must be after the start date"),
// // //     // Project is not validated as it's disabled
// // //     // project: Yup.string().required("Project is required"),
// // //     assignedTo: Yup.string().required("Assignee is required"), // Validates single assignee ID string
// // //     status: Yup.string()
// // //       .required("Status is required")
// // //       .oneOf(["not_started", "in_progress", "completed", "on_hold"], "Invalid status"),
// // //     priority: Yup.string()
// // //       .required("Priority is required")
// // //       .oneOf(["low", "medium", "high"], "Invalid priority"),
// // //   });

// // //   // Helper to format date for <input type="date">
// // //   const formatDateForInput = (dateString) => {
// // //     if (!dateString) return "";
// // //     try {
// // //       const date = new Date(dateString);
// // //       return isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
// // //     } catch (e) { return "" }
// // //   }

// // //    // --- Initial Form Values ---
// // //    // Set only when task data is available
// // //   const initialValues = task ? {
// // //     taskName: task.taskName || "",
// // //     taskDescription: task.taskDescription || "",
// // //     startDate: formatDateForInput(task.startDate),
// // //     endDate: formatDateForInput(task.endDate),
// // //     project: task.project?._id || "", // Store project ID
// // //     assignedTo: task.assignedTo?._id || "", // Store current assignee ID
// // //     status: task.status || "not_started",
// // //     priority: task.priority || "medium",
// // //   } : { // Default structure for Formik before data loads
// // //     taskName: "",
// // //     taskDescription: "",
// // //     startDate: "",
// // //     endDate: "",
// // //     project: "",
// // //     assignedTo: "",
// // //     status: "not_started",
// // //     priority: "medium",
// // //   };


// // //   // --- Handle Form Submission ---
// // //   const handleSubmit = (values) => {
// // //      if (updateTaskMutation.isLoading) return;
// // //     setIsSubmittingInternal(true);
// // //     const formattedValues = {
// // //       ...values,
// // //       startDate: new Date(values.startDate).toISOString(),
// // //       endDate: new Date(values.endDate).toISOString(),
// // //       project: taskProjectId, // Ensure project ID remains the original one
// // //       // assignedTo is already the selected user ID string
// // //     };
// // //     console.log("Submitting Task Update:", formattedValues);
// // //     updateTaskMutation.mutate(formattedValues);
// // //   }


// // //   // --- Render Logic ---

// // //   // Don't render anything until admin status is confirmed
// // //   if (!isAdmin) {
// // //     return null;
// // //   }

// // //   // Combined Loading State for Task and its Project Details (needed for assignees)
// // //   if (isLoadingTask || (taskProjectId && isLoadingProject)) {
// // //     return (
// // //       <div className="py-20 text-center">
// // //         <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
// // //         <p className="mt-2 text-gray-500">Loading task and project details...</p>
// // //       </div>
// // //     );
// // //   }

// // //   // Handle Task Loading Error
// // //   if (taskError) {
// // //     return (
// // //       <div className="py-20 text-center px-4">
// // //          <ExclamationTriangleIcon className="h-10 w-10 mx-auto text-red-500" />
// // //         <p className="mt-2 text-red-600 font-medium">Error loading task details</p>
// // //         <p className="text-sm text-red-500 mb-4">{taskError.message}</p>
// // //         <button
// // //           onClick={() => navigate("/admin/tasks")}
// // //           className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
// // //         >
// // //           <ArrowLeftIcon className="h-5 w-5 mr-2" />
// // //           Back to Tasks
// // //         </button>
// // //       </div>
// // //     );
// // //   }

// // //    // Handle Project Loading Error (after task has loaded)
// // //   if (projectError && taskProjectId) {
// // //     return (
// // //       <div className="py-20 text-center px-4">
// // //          <ExclamationTriangleIcon className="h-10 w-10 mx-auto text-red-500" />
// // //         <p className="mt-2 text-red-600 font-medium">Error loading project details for assignees</p>
// // //         <p className="text-sm text-red-500 mb-4">{projectError.message}</p>
// // //          <button
// // //           onClick={() => navigate("/admin/tasks")}
// // //           className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
// // //         >
// // //           <ArrowLeftIcon className="h-5 w-5 mr-2" />
// // //           Back to Tasks
// // //         </button>
// // //       </div>
// // //     );
// // //   }

// // //    // Handle case where task loaded, project loaded, but no assignees found
// // //    // This check runs only after both queries are done loading and not in error
// // //    if (!isLoadingTask && !isLoadingProject && assigneeOptions.length === 0 && projectDetails) {
// // //      return (
// // //        <div className="py-20 px-4 text-center">
// // //         <UserGroupIcon className="h-10 w-10 mx-auto text-yellow-500" />
// // //         <p className="mt-2 text-yellow-700 font-medium">No Assignable Users Found for this Project</p>
// // //         <p className="text-sm text-yellow-600 mb-4">
// // //           Cannot edit assignee. The associated project ({projectDetails.projectName}) does not have an active Contractor, Consultant, or Project Manager assigned.
// // //         </p>
// // //          <button
// // //             type="button"
// // //             onClick={() => navigate(`/admin/projects/edit/${taskProjectId}`)} // Link to edit project
// // //             className="mr-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
// // //           >
// // //            Edit Project Assignments
// // //         </button>
// // //         <button
// // //             type="button"
// // //             onClick={() => navigate("/admin/tasks")}
// // //             className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
// // //           >
// // //            <ArrowLeftIcon className="h-5 w-5 mr-2" />
// // //             Back to Tasks
// // //         </button>
// // //       </div>
// // //      )
// // //   }

// // //   // Ensure task data is loaded before rendering Formik
// // //   if (!task) {
// // //      return (
// // //       <div className="py-20 text-center">
// // //          <p className="mt-2 text-gray-500">Task data not available yet.</p>
// // //          {/* Could add a retry button here if desired */}
// // //       </div>
// // //      )
// // //   }


// // //   return (
// // //     <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
// // //       {/* Header */}
// // //       <div className="sm:flex sm:items-center sm:justify-between mb-8">
// // //         <div>
// // //           <h1 className="text-3xl font-bold text-gray-900 mb-1">Edit Task</h1>
// // //           <p className="text-gray-500 text-sm">Update details for task: <span className="font-medium">{task.taskName}</span></p>
// // //           <p className="text-gray-500 text-sm mt-1">
// // //             Project: <span className="font-medium">{projectDetails?.projectName || task.project?.projectName || 'Loading...'}</span>
// // //           </p>
// // //         </div>
// // //         <button
// // //           type="button"
// // //           onClick={() => navigate(`/admin/tasks`)} // Go back to task list
// // //           className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
// // //         >
// // //           <ArrowLeftIcon className="h-5 w-5 mr-2" />
// // //           Back to Tasks
// // //         </button>
// // //       </div>

// // //       {/* Form Card */}
// // //       <div className="bg-white shadow rounded-lg overflow-hidden">
// // //         <div className="px-4 py-5 sm:p-6">
// // //           <Formik
// // //             initialValues={initialValues}
// // //             validationSchema={validationSchema}
// // //             onSubmit={handleSubmit}
// // //             validateOnChange={false}
// // //             validateOnBlur={true}
// // //             enableReinitialize={true} // Update form if taskData changes
// // //           >
// // //             {({ errors, touched }) => (
// // //               <Form className="space-y-6">
// // //                 <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
// // //                   {/* Task Name */}
// // //                   <div className="sm:col-span-2">
// // //                     <label htmlFor="taskName" className="block text-sm font-medium text-gray-700">
// // //                       Task Name <span className="text-red-500">*</span>
// // //                     </label>
// // //                     <div className="mt-1">
// // //                       <Field
// // //                         type="text"
// // //                         name="taskName"
// // //                         id="taskName"
// // //                         className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
// // //                           errors.taskName && touched.taskName ? "border-red-500" : ""
// // //                         }`}
// // //                       />
// // //                       <ErrorMessage name="taskName" component="p" className="mt-1 text-sm text-red-600" />
// // //                     </div>
// // //                   </div>

// // //                   {/* Task Description */}
// // //                   <div className="sm:col-span-2">
// // //                     <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700">
// // //                       Description <span className="text-red-500">*</span>
// // //                     </label>
// // //                     <div className="mt-1">
// // //                       <Field
// // //                         as="textarea"
// // //                         name="taskDescription"
// // //                         id="taskDescription"
// // //                         rows={3}
// // //                         className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
// // //                           errors.taskDescription && touched.taskDescription ? "border-red-500" : ""
// // //                         }`}
// // //                       />
// // //                       <ErrorMessage name="taskDescription" component="p" className="mt-1 text-sm text-red-600" />
// // //                     </div>
// // //                   </div>

// // //                   {/* Project (Display Only) */}
// // //                   <div className="sm:col-span-2">
// // //                     <label htmlFor="projectDisplay" className="block text-sm font-medium text-gray-700">
// // //                       Project
// // //                     </label>
// // //                     <div className="mt-1">
// // //                       <input
// // //                         type="text"
// // //                         id="projectDisplay"
// // //                         // Display name from fetched project details or fallback to task's project name
// // //                         value={projectDetails?.projectName || task.project?.projectName || ""}
// // //                         disabled
// // //                         className="shadow-sm block w-full sm:text-sm border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
// // //                       />
// // //                        <Field type="hidden" name="project" />
// // //                     </div>
// // //                   </div>

// // //                   {/* Start Date */}
// // //                   <div>
// // //                     <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
// // //                       Start Date <span className="text-red-500">*</span>
// // //                     </label>
// // //                     <div className="mt-1">
// // //                       <Field
// // //                         type="date"
// // //                         name="startDate"
// // //                         id="startDate"
// // //                         className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
// // //                           errors.startDate && touched.startDate ? "border-red-500" : ""
// // //                         }`}
// // //                       />
// // //                       <ErrorMessage name="startDate" component="p" className="mt-1 text-sm text-red-600" />
// // //                     </div>
// // //                   </div>

// // //                   {/* End Date */}
// // //                   <div>
// // //                     <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
// // //                       End Date <span className="text-red-500">*</span>
// // //                     </label>
// // //                     <div className="mt-1">
// // //                       <Field
// // //                         type="date"
// // //                         name="endDate"
// // //                         id="endDate"
// // //                         className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
// // //                           errors.endDate && touched.endDate ? "border-red-500" : ""
// // //                         }`}
// // //                       />
// // //                       <ErrorMessage name="endDate" component="p" className="mt-1 text-sm text-red-600" />
// // //                     </div>
// // //                   </div>

// // //                   {/* Assigned To (Single Select from Project Users) */}
// // //                   {/* Adjust col-span if needed */}
// // //                   <div className="sm:col-span-2">
// // //                     <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
// // //                       Assigned To <span className="text-red-500">*</span>
// // //                     </label>
// // //                     <div className="mt-1">
// // //                       <Field
// // //                         as="select" // Single select
// // //                         name="assignedTo"
// // //                         id="assignedTo"
// // //                         className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
// // //                           errors.assignedTo && touched.assignedTo ? "border-red-500" : ""
// // //                         }`}
// // //                         // Disable while project/assignee options are loading or if none exist
// // //                         disabled={isLoadingProject || isFetchingProject || assigneeOptions.length === 0}
// // //                       >
// // //                         <option value="">Select an assignee</option> {/* Placeholder */}
// // //                         {assigneeOptions.map((user) => (
// // //                           <option key={user._id} value={user._id}>
// // //                             {user.firstName} {user.lastName} ({user.roleLabel || user.role})
// // //                           </option>
// // //                         ))}
// // //                       </Field>
// // //                       {(isLoadingProject || isFetchingProject) && (
// // //                            <p className="mt-1 text-sm text-gray-500">Loading assignees...</p>
// // //                       )}
// // //                        {/* Add error message specific to loading project for assignees? */}
// // //                       <ErrorMessage name="assignedTo" component="p" className="mt-1 text-sm text-red-600" />
// // //                     </div>
// // //                   </div>


// // //                   {/* Status Dropdown */}
// // //                   <div>
// // //                     <label htmlFor="status" className="block text-sm font-medium text-gray-700">
// // //                       Status <span className="text-red-500">*</span>
// // //                     </label>
// // //                     <div className="mt-1">
// // //                       <Field
// // //                         as="select"
// // //                         name="status"
// // //                         id="status"
// // //                         className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
// // //                           errors.status && touched.status ? "border-red-500" : ""
// // //                         }`}
// // //                       >
// // //                         <option value="not_started">Not Started</option>
// // //                         <option value="in_progress">In Progress</option>
// // //                         <option value="completed">Completed</option>
// // //                         <option value="on_hold">On Hold</option>
// // //                       </Field>
// // //                       <ErrorMessage name="status" component="p" className="mt-1 text-sm text-red-600" />
// // //                     </div>
// // //                   </div>

// // //                   {/* Priority Dropdown */}
// // //                   <div>
// // //                     <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
// // //                       Priority <span className="text-red-500">*</span>
// // //                     </label>
// // //                     <div className="mt-1">
// // //                       <Field
// // //                         as="select"
// // //                         name="priority"
// // //                         id="priority"
// // //                         className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
// // //                           errors.priority && touched.priority ? "border-red-500" : ""
// // //                         }`}
// // //                       >
// // //                         <option value="low">Low</option>
// // //                         <option value="medium">Medium</option>
// // //                         <option value="high">High</option>
// // //                       </Field>
// // //                       <ErrorMessage name="priority" component="p" className="mt-1 text-sm text-red-600" />
// // //                     </div>
// // //                   </div>

// // //                 </div> {/* End Grid */}

// // //                 {/* Submit/Cancel Buttons */}
// // //                 <div className="flex justify-end pt-5">
// // //                   <button
// // //                     type="button"
// // //                     onClick={() => navigate(`/admin/tasks`)} // Go back to list
// // //                     className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
// // //                   >
// // //                     Cancel
// // //                   </button>
// // //                   <button
// // //                     type="submit"
// // //                      // Disable if submitting or if assignee options unavailable
// // //                     disabled={isSubmittingInternal || updateTaskMutation.isLoading || (projectDetails && assigneeOptions.length === 0)}
// // //                     className={`inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
// // //                       isSubmittingInternal || updateTaskMutation.isLoading || (projectDetails && assigneeOptions.length === 0)
// // //                         ? "bg-indigo-400 cursor-not-allowed"
// // //                         : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
// // //                     }`}
// // //                   >
// // //                     {isSubmittingInternal || updateTaskMutation.isLoading ? (
// // //                       <>
// // //                         <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" aria-hidden="true" />
// // //                         Updating...
// // //                       </>
// // //                     ) : (
// // //                       <>
// // //                         <CheckCircleIcon className="h-5 w-5 mr-2" aria-hidden="true" />
// // //                         Update Task
// // //                       </>
// // //                     )}
// // //                   </button>
// // //                 </div>
// // //               </Form>
// // //             )}
// // //           </Formik>
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // export default EditTask;

// // /*eslint-disable */
// // import { useState, useEffect } from "react";
// // import { useParams, useNavigate } from "react-router-dom";
// // import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// // import { Formik, Form, Field, ErrorMessage } from "formik";
// // import * as Yup from "yup";
// // import { toast } from "react-toastify";
// // import {
// //   ArrowPathIcon,
// //   CheckCircleIcon,
// //   ArrowLeftIcon,
// //   UserGroupIcon,
// //   ExclamationTriangleIcon,
// //   InformationCircleIcon, // Added for info messages
// // } from "@heroicons/react/24/outline";
// // import tasksAPI from "../../../api/tasks";
// // import projectsAPI from "../../../api/projects";
// // import authAPI from "../../../api/auth";

// // const EditTask = () => {
// //   const { id } = useParams(); // Task ID from URL
// //   const navigate = useNavigate();
// //   const queryClient = useQueryClient();
// //   const [isSubmittingInternal, setIsSubmittingInternal] = useState(false);
// //   const [isAdmin, setIsAdmin] = useState(false);

// //   // --- Authorization Check ---
// //   useEffect(() => {
// //     const checkAdminStatus = () => {
// //         const adminStatus = authAPI.isAdmin(); // Assuming sync check
// //         setIsAdmin(adminStatus);
// //         if (!adminStatus) {
// //             toast.error("Access Denied: You do not have permission to edit tasks.");
// //             navigate("/dashboard"); // Redirect non-admins
// //         }
// //     };
// //     checkAdminStatus();
// //   }, [navigate]);

// //   // --- Fetch Task Details ---
// //   const {
// //     data: taskQueryResponse, // Renamed for clarity (this is the API response)
// //     isLoading: isLoadingTask,
// //     error: taskError,
// //     isFetching: isFetchingTask,
// //     refetch: refetchTask, // Added for retry capability
// //   } = useQuery({
// //     queryKey: ["tasks", id],
// //     queryFn: () => tasksAPI.getTaskById(id),
// //     enabled: isAdmin, // Only fetch if admin
// //     staleTime: 1 * 60 * 1000, // Keep task data fresh for a minute
// //     retry: 1, // Retry once on error
// //   });

// //   // Extract task details from the response's data property
// //   const task = taskQueryResponse?.data;
// //   const taskProjectId = task?.project?._id; // Get project ID from the loaded task

// //   // --- Fetch the specific Project associated with the Task ---
// //   const {
// //     data: projectQueryResponse,
// //     isLoading: isLoadingProject,
// //     error: projectError,
// //     isFetching: isFetchingProject,
// //     refetch: refetchProject, // Added for retry capability
// //   } = useQuery({
// //     queryKey: ["project", taskProjectId], // Key depends on the task's project ID
// //     queryFn: () => projectsAPI.getProjectById(taskProjectId),
// //     enabled: !!taskProjectId && isAdmin, // Enable ONLY when taskProjectId exists and user is admin
// //     staleTime: 5 * 60 * 1000, // Project details might not change as often
// //     retry: 1,
// //   });

// //   // Extract project details
// //   const projectDetails = projectQueryResponse?.data;

// //   // --- Derive Assignee Options from Fetched Project ---
// //   let assigneeOptions = [];
// //   if (projectDetails) {
// //     const potentialAssignees = new Map();
// //     // Helper to add user if they exist and are active
// //     const addUserIfActive = (user, roleLabel) => {
// //         if (user?._id && user?.isActive) {
// //             potentialAssignees.set(user._id, { ...user, roleLabel });
// //         }
// //     }
// //     addUserIfActive(projectDetails.contractor, 'Contractor');
// //     addUserIfActive(projectDetails.consultant, 'Consultant');
// //     addUserIfActive(projectDetails.projectManager, 'Project Manager');
// //     assigneeOptions = Array.from(potentialAssignees.values());
// //     // console.log("Derived Assignee Options for Edit:", assigneeOptions);
// //   }

// //   // --- Update Task Mutation ---
// //   const updateTaskMutation = useMutation({
// //     mutationFn: (taskUpdateData) => tasksAPI.updateTask(id, taskUpdateData),
// //     onSuccess: (data) => { // 'data' here is the API response from updateTask
// //       toast.success("Task updated successfully");
// //       // Invalidate relevant queries for data freshness
// //       queryClient.invalidateQueries({ queryKey: ["tasks", id] });
// //        // Use the project ID from the *updated* task data if possible, fallback to original
// //       const updatedProjectId = data?.data?.project?._id || taskProjectId;
// //       if (updatedProjectId) {
// //           queryClient.invalidateQueries({ queryKey: ["tasks", { project: updatedProjectId }] });
// //           queryClient.invalidateQueries({ queryKey: ["project", updatedProjectId] });
// //       }
// //       queryClient.invalidateQueries({ queryKey: ["tasks"] }); // General list
// //       navigate(`/admin/tasks`); // Navigate back to task list or task detail page? `/admin/tasks/${id}`
// //     },
// //     onError: (error) => {
// //       const errorMessage = error.response?.data?.message || error.message || "Failed to update task";
// //       console.error("Task Update Error:", error.response?.data || error);
// //       toast.error(errorMessage);
// //       // Do not set submitting false here, use onSettled
// //     },
// //     onSettled: () => {
// //       setIsSubmittingInternal(false); // Re-enable form in all cases (success or error)
// //     }
// //   });

// //   // --- Validation Schema ---
// //   const validationSchema = Yup.object({
// //     taskName: Yup.string()
// //       .required("Task name is required")
// //       .max(100, "Task name cannot exceed 100 characters"),
// //     taskDescription: Yup.string()
// //       .required("Description is required")
// //       .max(500, "Description cannot exceed 500 characters"),
// //     startDate: Yup.date().required("Start date is required"),
// //     endDate: Yup.date()
// //       .required("End date is required")
// //       .min(Yup.ref("startDate"), "End date must be on or after the start date"), // Corrected message
// //     // Project is not validated as it's disabled
// //     assignedTo: Yup.string().required("An assignee is required"), // User selects ONE ID string
// //     status: Yup.string()
// //       .required("Status is required")
// //       .oneOf(["not_started", "in_progress", "completed", "on_hold"], "Invalid status"),
// //     priority: Yup.string()
// //       .required("Priority is required")
// //       .oneOf(["low", "medium", "high"], "Invalid priority"),
// //   });

// //   // Helper to format date for <input type="date">
// //   const formatDateForInput = (dateString) => {
// //     if (!dateString) return "";
// //     try {
// //       const date = new Date(dateString);
// //       // Check if the date is valid before formatting
// //       return isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
// //     } catch (e) {
// //       console.error("Error formatting date for input:", dateString, e);
// //       return "";
// //     }
// //   }

// //   // --- Initial Form Values ---
// //   const initialValues = task ? {
// //     taskName: task.taskName || "",
// //     taskDescription: task.taskDescription || "",
// //     startDate: formatDateForInput(task.startDate),
// //     endDate: formatDateForInput(task.endDate),
// //     project: task.project?._id || "", // Store project ID (used for display)
// //     // *** FIX: Get the ID of the FIRST user in the assignedTo array ***
// //     assignedTo: task.assignedTo?.[0]?._id || "", // Default to first user's ID if exists
// //     status: task.status || "not_started",
// //     priority: task.priority || "medium",
// //   } : { // Default structure before data loads
// //     taskName: "",
// //     taskDescription: "",
// //     startDate: "",
// //     endDate: "",
// //     project: "",
// //     assignedTo: "",
// //     status: "not_started",
// //     priority: "medium",
// //   };

// //   // --- Handle Form Submission ---
// //   const handleSubmit = (values) => {
// //     // Prevent double submission
// //     if (isSubmittingInternal || updateTaskMutation.isLoading) return;
// //     setIsSubmittingInternal(true);

// //     // *** FIX: Format assignedTo as an array containing the selected ID string ***
// //     const formattedValues = {
// //       ...values, // Includes taskName, description, status, priority
// //       startDate: new Date(values.startDate).toISOString(),
// //       endDate: new Date(values.endDate).toISOString(),
// //       // Project is not directly editable here, ensure we send the original ID
// //       project: taskProjectId,
// //       assignedTo: values.assignedTo ? [values.assignedTo] : [], // Send as array
// //     };

// //     // Remove the 'project' display value if it accidentally got included
// //     // delete formattedValues.project; // We are already overriding project above

// //     console.log("Submitting Task Update Data:", formattedValues);
// //     updateTaskMutation.mutate(formattedValues);
// //   }


// //   // --- Render Logic ---

// //   // Don't render anything until admin status is confirmed and loaded
// //   if (!isAdmin) {
// //     // The useEffect already handles redirection and toast message
// //     return null; // Or a minimal loading/access denied message if preferred
// //   }

// //   // Combined Loading State for Task and its Project Details (needed for assignees)
// //   if (isLoadingTask || (taskProjectId && isLoadingProject && !projectDetails)) {
// //      // Show loading only if project ID exists but project details aren't loaded yet
// //     return (
// //       <div className="py-20 text-center">
// //         <ArrowPathIcon className="h-10 w-10 mx-auto text-indigo-600 animate-spin" />
// //         <p className="mt-2 text-gray-500">Loading task and project details...</p>
// //       </div>
// //     );
// //   }

// //   // Handle Task Loading Error
// //   if (taskError) {
// //     return (
// //        <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
// //          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md my-6">
// //             <div className="flex">
// //                 <div className="flex-shrink-0">
// //                     <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
// //                 </div>
// //                 <div className="ml-3">
// //                     <p className="text-sm font-medium text-red-800">Error loading task details</p>
// //                     <p className="mt-1 text-sm text-red-700">{taskError.message || "An unknown error occurred."}</p>
// //                     <div className="mt-3 flex space-x-3">
// //                        <button
// //                             onClick={() => refetchTask()}
// //                             className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
// //                         >
// //                             <ArrowPathIcon className="h-4 w-4 mr-1.5" aria-hidden="true"/>
// //                             Retry Task Load
// //                         </button>
// //                          <button
// //                             onClick={() => navigate("/admin/tasks")}
// //                             className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
// //                           >
// //                             <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
// //                             Back to Tasks
// //                         </button>
// //                     </div>
// //                 </div>
// //             </div>
// //         </div>
// //       </div>
// //     );
// //   }

// //   // Handle Project Loading Error (after task has loaded)
// //   if (projectError && taskProjectId) {
// //      return (
// //        <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
// //          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md my-6">
// //              <div className="flex">
// //                  <div className="flex-shrink-0">
// //                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
// //                  </div>
// //                  <div className="ml-3">
// //                      <p className="text-sm font-medium text-yellow-800">Warning: Could not load project details</p>
// //                      <p className="mt-1 text-sm text-yellow-700">Assignee list might be unavailable or incomplete. ({projectError.message || "Unknown error"})</p>
// //                       <div className="mt-3 flex space-x-3">
// //                            <button
// //                                 onClick={() => refetchProject()}
// //                                 className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
// //                             >
// //                                 <ArrowPathIcon className="h-4 w-4 mr-1.5" aria-hidden="true"/>
// //                                 Retry Project Load
// //                             </button>
// //                              <button
// //                                 onClick={() => navigate("/admin/tasks")}
// //                                 className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
// //                               >
// //                                 <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
// //                                 Back to Tasks
// //                             </button>
// //                      </div>
// //                  </div>
// //              </div>
// //          </div>
// //          {/* Still render the form below, but assignee might be broken */}
// //        </div>
// //      );
// //      // NOTE: We might still want to render the form even if project details fail,
// //      // allowing edits to other fields. The assignee dropdown will show an error/be disabled.
// //   }

// //   // Ensure task data is actually loaded before rendering Formik
// //   // This prevents errors if the query succeeds but returns no data unexpectedly
// //   if (!isLoadingTask && !task) {
// //      return (
// //       <div className="py-20 text-center">
// //          <InformationCircleIcon className="h-10 w-10 mx-auto text-gray-400"/>
// //          <p className="mt-2 text-gray-500">Task data could not be loaded or task not found.</p>
// //           <button
// //             onClick={() => navigate("/admin/tasks")}
// //             className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
// //           >
// //             <ArrowLeftIcon className="h-5 w-5 mr-2" />
// //             Back to Tasks
// //         </button>
// //       </div>
// //      )
// //   }

// //   // --- Main Form Render ---
// //   return (
// //     <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
// //       {/* Header */}
// //       <div className="sm:flex sm:items-center sm:justify-between mb-8">
// //         <div>
// //           <h1 className="text-3xl font-bold text-gray-900 mb-1">Edit Task</h1>
// //           {/* Show task name once loaded */}
// //           {task && <p className="text-gray-500 text-sm">Update details for task: <span className="font-medium">{task.taskName}</span></p>}
// //           {/* Show project name once loaded */}
// //           {(projectDetails || task?.project) && (
// //              <p className="text-gray-500 text-sm mt-1">
// //                 Project: <span className="font-medium">{projectDetails?.projectName || task.project?.projectName}</span>
// //              </p>
// //           )}
// //         </div>
// //         <button
// //           type="button"
// //           onClick={() => navigate(`/admin/tasks`)}
// //           className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
// //         >
// //           <ArrowLeftIcon className="h-5 w-5 mr-2" />
// //           Back to Tasks
// //         </button>
// //       </div>

// //       {/* Form Card */}
// //       <div className="bg-white shadow rounded-lg overflow-hidden">
// //         <div className="px-4 py-5 sm:p-6">
// //           {/* Render Formik only when task is loaded */}
// //           {task && (
// //             <Formik
// //               initialValues={initialValues}
// //               validationSchema={validationSchema}
// //               onSubmit={handleSubmit}
// //               validateOnChange={false} // Validate only on blur/submit
// //               validateOnBlur={true}
// //               enableReinitialize={true} // IMPORTANT: Allows form to update if task data is refetched
// //             >
// //               {({ errors, touched, isSubmitting }) => ( // Use Formik's isSubmitting
// //                 <Form className="space-y-6">
// //                   <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
// //                     {/* Task Name */}
// //                     <div className="sm:col-span-2">
// //                       <label htmlFor="taskName" className="block text-sm font-medium text-gray-700">
// //                         Task Name <span className="text-red-500">*</span>
// //                       </label>
// //                       <div className="mt-1">
// //                         <Field
// //                           type="text"
// //                           name="taskName"
// //                           id="taskName"
// //                           className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
// //                             errors.taskName && touched.taskName ? "border-red-500 ring-1 ring-red-500" : ""
// //                           }`}
// //                           aria-invalid={errors.taskName && touched.taskName ? "true" : "false"}
// //                         />
// //                         <ErrorMessage name="taskName" component="p" className="mt-1 text-sm text-red-600" />
// //                       </div>
// //                     </div>

// //                     {/* Task Description */}
// //                     <div className="sm:col-span-2">
// //                       <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700">
// //                         Description <span className="text-red-500">*</span>
// //                       </label>
// //                       <div className="mt-1">
// //                         <Field
// //                           as="textarea"
// //                           name="taskDescription"
// //                           id="taskDescription"
// //                           rows={4} // Slightly larger
// //                           className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
// //                             errors.taskDescription && touched.taskDescription ? "border-red-500 ring-1 ring-red-500" : ""
// //                           }`}
// //                            aria-invalid={errors.taskDescription && touched.taskDescription ? "true" : "false"}
// //                         />
// //                         <ErrorMessage name="taskDescription" component="p" className="mt-1 text-sm text-red-600" />
// //                       </div>
// //                     </div>

// //                     {/* Project (Display Only) */}
// //                     <div className="sm:col-span-2">
// //                       <label htmlFor="projectDisplay" className="block text-sm font-medium text-gray-700">
// //                         Project
// //                       </label>
// //                       <div className="mt-1">
// //                         <input
// //                           type="text"
// //                           id="projectDisplay"
// //                           value={projectDetails?.projectName || task.project?.projectName || "Loading project..."}
// //                           disabled
// //                           className="shadow-sm block w-full sm:text-sm border-gray-300 rounded-md bg-gray-100 cursor-not-allowed focus:ring-0 focus:border-gray-300"
// //                         />
// //                         {/* Hidden field to hold the actual project ID if needed by Formik state, but we override on submit */}
// //                         <Field type="hidden" name="project" />
// //                       </div>
// //                     </div>

// //                     {/* Start Date */}
// //                     <div>
// //                       <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
// //                         Start Date <span className="text-red-500">*</span>
// //                       </label>
// //                       <div className="mt-1">
// //                         <Field
// //                           type="date"
// //                           name="startDate"
// //                           id="startDate"
// //                           className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
// //                             errors.startDate && touched.startDate ? "border-red-500 ring-1 ring-red-500" : ""
// //                           }`}
// //                           aria-invalid={errors.startDate && touched.startDate ? "true" : "false"}
// //                         />
// //                         <ErrorMessage name="startDate" component="p" className="mt-1 text-sm text-red-600" />
// //                       </div>
// //                     </div>

// //                     {/* End Date */}
// //                     <div>
// //                       <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
// //                         End Date <span className="text-red-500">*</span>
// //                       </label>
// //                       <div className="mt-1">
// //                         <Field
// //                           type="date"
// //                           name="endDate"
// //                           id="endDate"
// //                           className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
// //                             errors.endDate && touched.endDate ? "border-red-500 ring-1 ring-red-500" : ""
// //                           }`}
// //                            aria-invalid={errors.endDate && touched.endDate ? "true" : "false"}
// //                         />
// //                         <ErrorMessage name="endDate" component="p" className="mt-1 text-sm text-red-600" />
// //                       </div>
// //                     </div>

// //                     {/* Assigned To (Single Select from Project Users) */}
// //                     <div className="sm:col-span-2">
// //                       <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
// //                         Assigned To <span className="text-red-500">*</span>
// //                       </label>
// //                       <div className="mt-1">
// //                         <Field
// //                           as="select"
// //                           name="assignedTo"
// //                           id="assignedTo"
// //                           className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
// //                             errors.assignedTo && touched.assignedTo ? "border-red-500 ring-1 ring-red-500" : ""
// //                           } ${isLoadingProject || assigneeOptions.length === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
// //                           // Disable if loading project, or if no assignees found after loading
// //                           disabled={isLoadingProject || isFetchingProject || (!isLoadingProject && assigneeOptions.length === 0)}
// //                            aria-invalid={errors.assignedTo && touched.assignedTo ? "true" : "false"}
// //                         >
// //                           <option value="" disabled={!isLoadingProject && assigneeOptions.length === 0}>
// //                              {isLoadingProject ? "Loading assignees..." : (assigneeOptions.length === 0 ? "No assignees available for this project" : "Select an assignee")}
// //                           </option>
// //                           {assigneeOptions.map((user) => (
// //                             <option key={user._id} value={user._id}>
// //                               {user.firstName} {user.lastName} ({user.roleLabel || user.role})
// //                             </option>
// //                           ))}
// //                         </Field>
// //                          {/* Informative message if project details failed to load */}
// //                         {projectError && !isLoadingProject && (
// //                             <p className="mt-1 text-sm text-yellow-600">Could not load project details for assignees.</p>
// //                         )}
// //                          {/* Message if project loaded but has no assignable users */}
// //                          {!isLoadingProject && !projectError && assigneeOptions.length === 0 && projectDetails && (
// //                              <p className="mt-1 text-sm text-yellow-600">No active Contractor, Consultant, or PM found in project '{projectDetails.projectName}'.</p>
// //                          )}
// //                         <ErrorMessage name="assignedTo" component="p" className="mt-1 text-sm text-red-600" />
// //                       </div>
// //                     </div>

// //                     {/* Status Dropdown */}
// //                     <div>
// //                       <label htmlFor="status" className="block text-sm font-medium text-gray-700">
// //                         Status <span className="text-red-500">*</span>
// //                       </label>
// //                       <div className="mt-1">
// //                         <Field
// //                           as="select"
// //                           name="status"
// //                           id="status"
// //                           className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
// //                             errors.status && touched.status ? "border-red-500 ring-1 ring-red-500" : ""
// //                           }`}
// //                           aria-invalid={errors.status && touched.status ? "true" : "false"}
// //                         >
// //                           <option value="not_started">Not Started</option>
// //                           <option value="in_progress">In Progress</option>
// //                           <option value="completed">Completed</option>
// //                           <option value="on_hold">On Hold</option>
// //                         </Field>
// //                         <ErrorMessage name="status" component="p" className="mt-1 text-sm text-red-600" />
// //                       </div>
// //                     </div>

// //                     {/* Priority Dropdown */}
// //                     <div>
// //                       <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
// //                         Priority <span className="text-red-500">*</span>
// //                       </label>
// //                       <div className="mt-1">
// //                         <Field
// //                           as="select"
// //                           name="priority"
// //                           id="priority"
// //                           className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
// //                             errors.priority && touched.priority ? "border-red-500 ring-1 ring-red-500" : ""
// //                           }`}
// //                           aria-invalid={errors.priority && touched.priority ? "true" : "false"}
// //                         >
// //                           <option value="low">Low</option>
// //                           <option value="medium">Medium</option>
// //                           <option value="high">High</option>
// //                         </Field>
// //                         <ErrorMessage name="priority" component="p" className="mt-1 text-sm text-red-600" />
// //                       </div>
// //                     </div>

// //                   </div> {/* End Grid */}

// //                   {/* Submit/Cancel Buttons */}
// //                   <div className="flex justify-end pt-5 border-t border-gray-200 mt-8">
// //                     <button
// //                       type="button"
// //                       onClick={() => navigate(`/admin/tasks`)}
// //                       disabled={isSubmittingInternal || updateTaskMutation.isLoading} // Disable cancel during submit
// //                       className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
// //                     >
// //                       Cancel
// //                     </button>
// //                     <button
// //                       type="submit"
// //                       disabled={isSubmittingInternal || updateTaskMutation.isLoading || assigneeOptions.length === 0 && projectDetails} // Disable if submitting or no valid assignee options
// //                       className={`inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed ${
// //                         !(isSubmittingInternal || updateTaskMutation.isLoading || (assigneeOptions.length === 0 && projectDetails))
// //                           ? "bg-indigo-600 hover:bg-indigo-700"
// //                           : "bg-indigo-400"
// //                       }`}
// //                     >
// //                       {isSubmittingInternal || updateTaskMutation.isLoading ? (
// //                         <>
// //                           <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" aria-hidden="true" />
// //                           Updating...
// //                         </>
// //                       ) : (
// //                         <>
// //                           <CheckCircleIcon className="h-5 w-5 mr-2" aria-hidden="true" />
// //                           Update Task
// //                         </>
// //                       )}
// //                     </button>
// //                   </div>
// //                 </Form>
// //               )}
// //             </Formik>
// //           )}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default EditTask;

// /*eslint-disable */
// import { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import { Formik, Form, Field, ErrorMessage } from "formik";
// import * as Yup from "yup";
// import { toast } from "react-toastify";
// import {
//   ArrowPathIcon,
//   CheckCircleIcon,
//   ArrowLeftIcon,
//   UserGroupIcon,
//   ExclamationTriangleIcon,
//   InformationCircleIcon,
// } from "@heroicons/react/24/outline";
// import tasksAPI from "../../../api/tasks";
// import projectsAPI from "../../../api/projects";
// import authAPI from "../../../api/auth";

// // Helper component for multi-select info text
// const MultiSelectInfo = () => (
//     <p className="mt-1 text-xs text-gray-500">
//         Hold Ctrl (or Cmd on Mac) to select multiple users.
//     </p>
// );

// const EditTask = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const queryClient = useQueryClient();
//   const [isSubmittingInternal, setIsSubmittingInternal] = useState(false);
//   const [isAdmin, setIsAdmin] = useState(false);

//   // --- Authorization Check ---
//   useEffect(() => {
//     const checkAdminStatus = () => {
//         const adminStatus = authAPI.isAdmin();
//         setIsAdmin(adminStatus);
//         if (!adminStatus) {
//             toast.error("Access Denied: You do not have permission to edit tasks.");
//             navigate("/dashboard");
//         }
//     };
//     checkAdminStatus();
//   }, [navigate]);

//   // --- Fetch Task Details ---
//   const {
//     data: taskQueryResponse,
//     isLoading: isLoadingTask,
//     error: taskError,
//     isFetching: isFetchingTask,
//     refetch: refetchTask,
//   } = useQuery({
//     queryKey: ["tasks", id],
//     queryFn: () => tasksAPI.getTaskById(id),
//     enabled: isAdmin,
//     staleTime: 1 * 60 * 1000,
//     retry: 1,
//   });

//   const task = taskQueryResponse?.data;
//   const taskProjectId = task?.project?._id;

//   // --- Fetch Associated Project ---
//   const {
//     data: projectQueryResponse,
//     isLoading: isLoadingProject,
//     error: projectError,
//     isFetching: isFetchingProject,
//     refetch: refetchProject,
//   } = useQuery({
//     queryKey: ["project", taskProjectId],
//     queryFn: () => projectsAPI.getProjectById(taskProjectId),
//     enabled: !!taskProjectId && isAdmin,
//     staleTime: 5 * 60 * 1000,
//     retry: 1,
//   });

//   const projectDetails = projectQueryResponse?.data;

//   // --- Derive Assignee Options ---
//   let assigneeOptions = [];
//   if (projectDetails) {
//     const potentialAssignees = new Map();
//     const addUserIfActive = (user, roleLabel) => {
//         if (user?._id && user?.isActive) {
//             potentialAssignees.set(user._id, { ...user, roleLabel });
//         }
//     }
//     addUserIfActive(projectDetails.contractor, 'Contractor');
//     addUserIfActive(projectDetails.consultant, 'Consultant');
//     addUserIfActive(projectDetails.projectManager, 'Project Manager');
//     assigneeOptions = Array.from(potentialAssignees.values());
//   }

//   // --- Update Task Mutation ---
//   const updateTaskMutation = useMutation({
//     mutationFn: (taskUpdateData) => tasksAPI.updateTask(id, taskUpdateData),
//     onSuccess: (data) => {
//       toast.success("Task updated successfully");
//       queryClient.invalidateQueries({ queryKey: ["tasks", id] });
//       const updatedProjectId = data?.data?.project?._id || taskProjectId;
//       if (updatedProjectId) {
//           queryClient.invalidateQueries({ queryKey: ["tasks", { project: updatedProjectId }] });
//           queryClient.invalidateQueries({ queryKey: ["project", updatedProjectId] });
//       }
//       queryClient.invalidateQueries({ queryKey: ["tasks"] });
//       navigate(`/admin/tasks`);
//     },
//     onError: (error) => {
//       const errorMessage = error.response?.data?.message || error.message || "Failed to update task";
//       console.error("Task Update Error:", error.response?.data || error);
//       toast.error(errorMessage);
//     },
//     onSettled: () => {
//       setIsSubmittingInternal(false);
//     }
//   });

//   // --- Validation Schema ---
//   const validationSchema = Yup.object({
//     taskName: Yup.string()
//       .required("Task name is required")
//       .max(100, "Task name cannot exceed 100 characters"),
//     taskDescription: Yup.string()
//       .required("Description is required")
//       .max(500, "Description cannot exceed 500 characters"),
//     startDate: Yup.date().required("Start date is required"),
//     endDate: Yup.date()
//       .required("End date is required")
//       .min(Yup.ref("startDate"), "End date must be on or after the start date"),
//     // *** FIX: Validate assignedTo as an array of strings ***
//     assignedTo: Yup.array()
//       .of(Yup.string()) // Should be an array of strings (user IDs)
//       .min(1, "At least one assignee is required") // Must select at least one
//       .required("Assignee selection is required"), // The array itself is required
//     status: Yup.string()
//       .required("Status is required")
//       .oneOf(["not_started", "in_progress", "completed", "on_hold"], "Invalid status"),
//     priority: Yup.string()
//       .required("Priority is required")
//       .oneOf(["low", "medium", "high"], "Invalid priority"),
//   });

//   const formatDateForInput = (dateString) => {
//     if (!dateString) return "";
//     try {
//       const date = new Date(dateString);
//       return isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
//     } catch (e) {
//       console.error("Error formatting date for input:", dateString, e);
//       return "";
//     }
//   }

//   // --- Initial Form Values ---
//   const initialValues = task ? {
//     taskName: task.taskName || "",
//     taskDescription: task.taskDescription || "",
//     startDate: formatDateForInput(task.startDate),
//     endDate: formatDateForInput(task.endDate),
//     project: task.project?._id || "",
//     // *** FIX: Set initial assignedTo as an array of IDs ***
//     assignedTo: task.assignedTo?.map(user => user._id) || [], // Map current assignees to their IDs
//     status: task.status || "not_started",
//     priority: task.priority || "medium",
//   } : {
//     taskName: "",
//     taskDescription: "",
//     startDate: "",
//     endDate: "",
//     project: "",
//     assignedTo: [], // Default to empty array
//     status: "not_started",
//     priority: "medium",
//   };

//   // --- Handle Form Submission ---
//   const handleSubmit = (values) => {
//     if (isSubmittingInternal || updateTaskMutation.isLoading) return;
//     setIsSubmittingInternal(true);

//     // *** FIX: 'assignedTo' from values is already the array of selected IDs ***
//     const formattedValues = {
//       taskName: values.taskName,
//       taskDescription: values.taskDescription,
//       status: values.status,
//       priority: values.priority,
//       startDate: new Date(values.startDate).toISOString(),
//       endDate: new Date(values.endDate).toISOString(),
//       project: taskProjectId, // Use the original project ID
//       assignedTo: values.assignedTo || [], // Send the array directly
//     };

//     console.log("Submitting Task Update Data (Multi-Select):", formattedValues);
//     updateTaskMutation.mutate(formattedValues);
//   }

//   // --- Render Logic ---

//   if (!isAdmin) {
//     return null;
//   }

//   if (isLoadingTask || (taskProjectId && isLoadingProject && !projectDetails)) {
//     return (
//       <div className="py-20 text-center">
//         <ArrowPathIcon className="h-10 w-10 mx-auto text-indigo-600 animate-spin" />
//         <p className="mt-2 text-gray-500">Loading task and project details...</p>
//       </div>
//     );
//   }

//   // --- Error Handling UI (Task Error) ---
//   if (taskError) {
//     return (
//         <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
//             <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md my-6">
//                 {/* ... (Error content with Retry Task Load button) ... */}
//                  <div className="flex">
//                     <div className="flex-shrink-0">
//                         <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
//                     </div>
//                     <div className="ml-3">
//                         <p className="text-sm font-medium text-red-800">Error loading task details</p>
//                         <p className="mt-1 text-sm text-red-700">{taskError.message || "An unknown error occurred."}</p>
//                         <div className="mt-3 flex space-x-3">
//                            <button onClick={() => refetchTask()} className="..."> {/* Retry button */}
//                                 <ArrowPathIcon className="h-4 w-4 mr-1.5" aria-hidden="true"/>
//                                 Retry Task Load
//                            </button>
//                            <button onClick={() => navigate("/admin/tasks")} className="..."> {/* Back button */}
//                                 <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
//                                 Back to Tasks
//                             </button>
//                         </div>
//                     </div>
//                  </div>
//             </div>
//         </div>
//     );
//   }

//   // --- Error Handling UI (Project Error) ---
//   if (projectError && taskProjectId) {
//        return (
//            <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
//                 <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md my-6">
//                  {/* ... (Warning content with Retry Project Load button) ... */}
//                     <div className="flex">
//                         <div className="flex-shrink-0">
//                             <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
//                         </div>
//                         <div className="ml-3">
//                             <p className="text-sm font-medium text-yellow-800">Warning: Could not load project details</p>
//                             <p className="mt-1 text-sm text-yellow-700">Assignee list might be unavailable or incomplete. ({projectError.message || "Unknown error"})</p>
//                             <div className="mt-3 flex space-x-3">
//                                 <button onClick={() => refetchProject()} className="..."> {/* Retry button */}
//                                     <ArrowPathIcon className="h-4 w-4 mr-1.5" aria-hidden="true"/>
//                                     Retry Project Load
//                                 </button>
//                                 <button onClick={() => navigate("/admin/tasks")} className="..."> {/* Back button */}
//                                     <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
//                                     Back to Tasks
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//                 {/* We still render the form below, but assignee select will be disabled/show error */}
//            </div>
//        );
//   }

//   // --- Task Not Found/Loaded UI ---
//    if (!isLoadingTask && !task) {
//        return (
//            <div className="py-20 text-center">
//                {/* ... (Task not found content) ... */}
//                 <InformationCircleIcon className="h-10 w-10 mx-auto text-gray-400"/>
//                 <p className="mt-2 text-gray-500">Task data could not be loaded or task not found.</p>
//                 <button onClick={() => navigate("/admin/tasks")} className="..."> {/* Back button */}
//                     <ArrowLeftIcon className="h-5 w-5 mr-2" />
//                     Back to Tasks
//                 </button>
//            </div>
//        )
//    }


//   // --- Main Form Render ---
//   return (
//     <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
//       {/* Header */}
//       <div className="sm:flex sm:items-center sm:justify-between mb-8">
//         <div>
//             <h1 className="text-3xl font-bold text-gray-900 mb-1">Edit Task</h1>
//             {task && <p className="text-gray-500 text-sm">Update details for task: <span className="font-medium">{task.taskName}</span></p>}
//             {(projectDetails || task?.project) && (
//                 <p className="text-gray-500 text-sm mt-1">
//                     Project: <span className="font-medium">{projectDetails?.projectName || task.project?.projectName}</span>
//                 </p>
//             )}
//         </div>
//          <button type="button" onClick={() => navigate(`/admin/tasks`)} className="...">
//             <ArrowLeftIcon className="h-5 w-5 mr-2" />
//             Back to Tasks
//         </button>
//       </div>

//       {/* Form Card */}
//       <div className="bg-white shadow rounded-lg overflow-hidden">
//         <div className="px-4 py-5 sm:p-6">
//           {task && ( // Render Formik only when task data is ready
//             <Formik
//               initialValues={initialValues}
//               validationSchema={validationSchema}
//               onSubmit={handleSubmit}
//               validateOnChange={false}
//               validateOnBlur={true}
//               enableReinitialize={true}
//             >
//               {({ errors, touched, isSubmitting }) => (
//                 <Form className="space-y-6">
//                   <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
//                     {/* Task Name */}
//                     <div className="sm:col-span-2">
//                       <label htmlFor="taskName" className="block text-sm font-medium text-gray-700">
//                         Task Name <span className="text-red-500">*</span>
//                       </label>
//                       <div className="mt-1">
//                           <Field type="text" name="taskName" id="taskName" className={`... ${errors.taskName && touched.taskName ? "border-red-500 ring-1 ring-red-500" : ""}`} aria-invalid={errors.taskName && touched.taskName ? "true" : "false"} />
//                           <ErrorMessage name="taskName" component="p" className="mt-1 text-sm text-red-600" />
//                       </div>
//                     </div>

//                     {/* Task Description */}
//                     <div className="sm:col-span-2">
//                        <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700">
//                         Description <span className="text-red-500">*</span>
//                        </label>
//                        <div className="mt-1">
//                            <Field as="textarea" name="taskDescription" id="taskDescription" rows={4} className={`... ${errors.taskDescription && touched.taskDescription ? "border-red-500 ring-1 ring-red-500" : ""}`} aria-invalid={errors.taskDescription && touched.taskDescription ? "true" : "false"}/>
//                            <ErrorMessage name="taskDescription" component="p" className="mt-1 text-sm text-red-600" />
//                        </div>
//                     </div>

//                     {/* Project (Display Only) */}
//                      <div className="sm:col-span-2">
//                         <label htmlFor="projectDisplay" className="block text-sm font-medium text-gray-700">Project</label>
//                         <div className="mt-1">
//                             <input type="text" id="projectDisplay" value={projectDetails?.projectName || task.project?.projectName || "Loading project..."} disabled className="... bg-gray-100 cursor-not-allowed focus:ring-0 ..." />
//                             <Field type="hidden" name="project" />
//                         </div>
//                     </div>

//                     {/* Start Date */}
//                     <div>
//                       <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date <span className="text-red-500">*</span></label>
//                       <div className="mt-1">
//                           <Field type="date" name="startDate" id="startDate" className={`... ${errors.startDate && touched.startDate ? "border-red-500 ring-1 ring-red-500" : ""}`} aria-invalid={errors.startDate && touched.startDate ? "true" : "false"}/>
//                           <ErrorMessage name="startDate" component="p" className="mt-1 text-sm text-red-600" />
//                       </div>
//                     </div>

//                     {/* End Date */}
//                     <div>
//                       <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date <span className="text-red-500">*</span></label>
//                        <div className="mt-1">
//                            <Field type="date" name="endDate" id="endDate" className={`... ${errors.endDate && touched.endDate ? "border-red-500 ring-1 ring-red-500" : ""}`} aria-invalid={errors.endDate && touched.endDate ? "true" : "false"}/>
//                            <ErrorMessage name="endDate" component="p" className="mt-1 text-sm text-red-600" />
//                        </div>
//                     </div>

//                     {/* Assigned To (Multi-Select) */}
//                     <div className="sm:col-span-2">
//                       <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
//                         Assigned To <span className="text-red-500">*</span>
//                       </label>
//                       <div className="mt-1">
//                         <Field
//                           as="select"
//                           multiple={true} // *** Enable multi-select ***
//                           name="assignedTo"
//                           id="assignedTo"
//                           size={5} // Display as a list box (adjust size as needed)
//                           className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
//                             errors.assignedTo && touched.assignedTo ? "border-red-500 ring-1 ring-red-500" : ""
//                           } ${isLoadingProject || assigneeOptions.length === 0 ? 'bg-gray-100' : ''}`} // No cursor change needed for multi-select
//                           disabled={isLoadingProject || isFetchingProject || (!isLoadingProject && assigneeOptions.length === 0)}
//                           aria-invalid={errors.assignedTo && touched.assignedTo ? "true" : "false"}
//                         >
//                           {/* No placeholder needed for multi-select list box */}
//                           {/* Show loading state within the box if applicable, though disabling is usually enough */}
//                            {isLoadingProject && <option disabled>Loading assignees...</option>}
//                            {/* Map available options */}
//                           {assigneeOptions.map((user) => (
//                             <option key={user._id} value={user._id}>
//                               {user.firstName} {user.lastName} ({user.roleLabel || user.role})
//                             </option>
//                           ))}
//                            {/* Indicate if no options are available */}
//                            {!isLoadingProject && assigneeOptions.length === 0 && <option disabled>No assignees available</option>}
//                         </Field>
//                         <MultiSelectInfo /> {/* Add helper text */}
//                         {/* Error/Warning messages */}
//                         {projectError && !isLoadingProject && (
//                             <p className="mt-1 text-sm text-yellow-600">Could not load project details for assignees.</p>
//                         )}
//                         {!isLoadingProject && !projectError && assigneeOptions.length === 0 && projectDetails && (
//                             <p className="mt-1 text-sm text-yellow-600">No active Contractor, Consultant, or PM found in project '{projectDetails.projectName}'.</p>
//                         )}
//                         <ErrorMessage name="assignedTo" component="p" className="mt-1 text-sm text-red-600" />
//                       </div>
//                     </div>

//                     {/* Status Dropdown */}
//                     <div>
//                       <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status <span className="text-red-500">*</span></label>
//                       <div className="mt-1">
//                           <Field as="select" name="status" id="status" className={`... ${errors.status && touched.status ? "border-red-500 ring-1 ring-red-500" : ""}`} aria-invalid={errors.status && touched.status ? "true" : "false"}>
//                               <option value="not_started">Not Started</option>
//                               <option value="in_progress">In Progress</option>
//                               <option value="completed">Completed</option>
//                               <option value="on_hold">On Hold</option>
//                           </Field>
//                           <ErrorMessage name="status" component="p" className="mt-1 text-sm text-red-600" />
//                       </div>
//                     </div>

//                     {/* Priority Dropdown */}
//                     <div>
//                         <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority <span className="text-red-500">*</span></label>
//                         <div className="mt-1">
//                             <Field as="select" name="priority" id="priority" className={`... ${errors.priority && touched.priority ? "border-red-500 ring-1 ring-red-500" : ""}`} aria-invalid={errors.priority && touched.priority ? "true" : "false"}>
//                                 <option value="low">Low</option>
//                                 <option value="medium">Medium</option>
//                                 <option value="high">High</option>
//                             </Field>
//                             <ErrorMessage name="priority" component="p" className="mt-1 text-sm text-red-600" />
//                         </div>
//                     </div>

//                   </div> {/* End Grid */}

//                   {/* Submit/Cancel Buttons */}
//                   <div className="flex justify-end pt-5 border-t border-gray-200 mt-8">
//                     <button type="button" onClick={() => navigate(`/admin/tasks`)} disabled={isSubmittingInternal || updateTaskMutation.isLoading} className="...">
//                       Cancel
//                     </button>
//                     <button type="submit" disabled={isSubmittingInternal || updateTaskMutation.isLoading || (assigneeOptions.length === 0 && projectDetails)} className="...">
//                       {isSubmittingInternal || updateTaskMutation.isLoading ? (
//                         <> <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" /> Updating... </>
//                       ) : (
//                         <> <CheckCircleIcon className="h-5 w-5 mr-2" /> Update Task </>
//                       )}
//                     </button>
//                   </div>
//                 </Form>
//               )}
//             </Formik>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EditTask;

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
  InformationCircleIcon,
  UsersIcon, // Added for Assignees section
  CalendarDaysIcon, // Added for Dates section
  PencilSquareIcon, // Added for Details section
  TagIcon, // Added for Status/Priority
} from "@heroicons/react/24/outline";
import tasksAPI from "../../../api/tasks";
import projectsAPI from "../../../api/projects";
import authAPI from "../../../api/auth";

// --- Helper: Skeleton Loader for the Form ---
const TaskFormSkeleton = () => (
  <div className="animate-pulse">
    {/* Header Skeleton */}
    <div className="mb-8">
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
    </div>
    {/* Form Card Skeleton */}
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:p-6 space-y-6">
        {/* Section Skeleton */}
        <div className="space-y-4 border-b border-gray-200 pb-6">
          <div className="h-5 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1">
              <div className="h-4 bg-gray-200 rounded w-1/5"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
            <div className="sm:col-span-2 space-y-1">
              <div className="h-4 bg-gray-200 rounded w-1/5"></div>
              <div className="h-20 bg-gray-200 rounded w-full"></div>
            </div>
            <div className="sm:col-span-2 space-y-1">
               <div className="h-4 bg-gray-200 rounded w-1/5"></div>
               <div className="h-10 bg-gray-100 rounded w-full"></div> {/* Disabled look */}
            </div>
          </div>
        </div>
        {/* Section Skeleton */}
        <div className="space-y-4 border-b border-gray-200 pb-6">
           <div className="h-5 bg-gray-200 rounded w-1/4"></div>
           <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
              <div className="space-y-1">
                 <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                 <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
           </div>
        </div>
         {/* Section Skeleton */}
        <div className="space-y-4 border-b border-gray-200 pb-6">
           <div className="h-5 bg-gray-200 rounded w-1/4"></div>
           <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
               <div className="sm:col-span-2 space-y-1">
                   <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                   <div className="h-24 bg-gray-100 rounded w-full"></div> {/* Disabled look */}
                   <div className="h-3 bg-gray-200 rounded w-2/5 mt-1"></div> {/* Helper text */}
               </div>
           </div>
        </div>
        {/* Section Skeleton */}
        <div className="space-y-4">
           <div className="h-5 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div className="space-y-1">
                    <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                    <div className="h-10 bg-gray-200 rounded w-full"></div>
                </div>
                <div className="space-y-1">
                    <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                    <div className="h-10 bg-gray-200 rounded w-full"></div>
                </div>
            </div>
        </div>
         {/* Footer Skeleton */}
        <div className="flex justify-end pt-5 border-t border-gray-200 mt-8 space-x-3">
          <div className="h-10 bg-gray-200 rounded w-20"></div>
          <div className="h-10 bg-indigo-200 rounded w-32"></div>
        </div>
      </div>
    </div>
  </div>
);


// Helper component for multi-select info text
const MultiSelectInfo = () => (
  <p className="mt-1.5 text-xs text-gray-500 flex items-center">
    <InformationCircleIcon className="h-4 w-4 mr-1 text-gray-400 shrink-0" />
    Hold Ctrl (or Cmd on Mac) to select multiple users.
  </p>
);

// Helper function for input styling
const getInputClasses = (hasError) =>
  `block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 ${
    hasError ? "ring-red-500 focus:ring-red-600" : "ring-gray-300"
  }`;

// Helper function for button styling
const getButtonClasses = (variant = "secondary", disabled = false) => {
    let base = "inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2";
    if (disabled) {
        base += " cursor-not-allowed opacity-60";
    }
    if (variant === 'primary') {
        base += ` border-transparent bg-indigo-600 text-white ${!disabled ? 'hover:bg-indigo-700 focus:ring-indigo-500' : 'bg-indigo-400'}`;
    } else if (variant === 'danger') {
         base += ` border-transparent bg-red-600 text-white ${!disabled ? 'hover:bg-red-700 focus:ring-red-500' : 'bg-red-400'}`;
    }
    else { // secondary / cancel
        base += ` border-gray-300 bg-white text-gray-700 ${!disabled ? 'hover:bg-gray-50 focus:ring-indigo-500' : ''}`;
    }
    return base;
}


const EditTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmittingInternal, setIsSubmittingInternal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(null); // Start as null to differentiate initial state

  // --- Authorization Check ---
  useEffect(() => {
    const checkAdminStatus = async () => { // Make async if authAPI.isAdmin is async
      try {
        // Assuming authAPI.isAdmin() might be async in the future or involves a check
        const adminStatus = await authAPI.isAdmin(); // Use await if needed
        setIsAdmin(adminStatus);
        if (!adminStatus) {
          toast.error("Access Denied: You do not have permission to edit tasks.");
          navigate("/dashboard"); // Redirect immediately if not admin
        }
      } catch (error) {
          console.error("Error checking admin status:", error);
          toast.error("Could not verify permissions. Please try again.");
          setIsAdmin(false); // Assume not admin on error
          navigate("/dashboard");
      }
    };
    checkAdminStatus();
  }, [navigate]);

  // --- Fetch Task Details ---
  const {
    data: taskQueryResponse,
    isLoading: isLoadingTask,
    error: taskError,
    isFetching: isFetchingTask,
    refetch: refetchTask,
  } = useQuery({
    queryKey: ["tasks", id],
    queryFn: () => tasksAPI.getTaskById(id),
    enabled: isAdmin === true, // Only enable when admin status is confirmed true
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  const task = taskQueryResponse?.data;
  const taskProjectId = task?.project?._id;

  // --- Fetch Associated Project ---
  const {
    data: projectQueryResponse,
    isLoading: isLoadingProject,
    error: projectError,
    isFetching: isFetchingProject,
    refetch: refetchProject,
  } = useQuery({
    queryKey: ["project", taskProjectId],
    queryFn: () => projectsAPI.getProjectById(taskProjectId),
    enabled: !!taskProjectId && isAdmin === true, // Enable only if task has project ID and user is admin
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });

  const projectDetails = projectQueryResponse?.data;

  // --- Derive Assignee Options ---
  // Memoize this calculation slightly? Not strictly necessary here.
  let assigneeOptions = [];
  let hasActiveUsersInProject = false;
  if (projectDetails) {
    const potentialAssignees = new Map();
    // Helper to add user if they exist and are active
    const addUserIfActive = (user, roleLabel) => {
      if (user?._id && user?.isActive) {
        potentialAssignees.set(user._id, { ...user, roleLabel });
        hasActiveUsersInProject = true; // Mark that we found at least one
      } else if (user?._id && !user?.isActive) {
          // Optionally track inactive users if needed for different UI
      }
    };
    addUserIfActive(projectDetails.contractor, 'Contractor');
    addUserIfActive(projectDetails.consultant, 'Consultant');
    addUserIfActive(projectDetails.projectManager, 'Project Manager');
    assigneeOptions = Array.from(potentialAssignees.values());
  }

  // --- Update Task Mutation ---
  const updateTaskMutation = useMutation({
    mutationFn: (taskUpdateData) => tasksAPI.updateTask(id, taskUpdateData),
    onMutate: () => {
        setIsSubmittingInternal(true); // Set submitting state immediately
    },
    onSuccess: (data) => {
      toast.success(`Task "${data?.data?.taskName || 'Task'}" updated successfully`);
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["tasks", id] });
      const updatedProjectId = data?.data?.project?._id || taskProjectId;
      if (updatedProjectId) {
        queryClient.invalidateQueries({ queryKey: ["tasks", { project: updatedProjectId }] });
        queryClient.invalidateQueries({ queryKey: ["project", updatedProjectId] });
      }
      queryClient.invalidateQueries({ queryKey: ["tasks"] }); // Invalidate list view
      navigate(`/admin/tasks`); // Navigate on success
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to update task";
      console.error("Task Update Error:", error.response?.data || error);
      toast.error(errorMessage);
    },
    onSettled: () => {
      setIsSubmittingInternal(false); // Reset submitting state regardless of outcome
    },
  });

  // --- Validation Schema ---
  const validationSchema = Yup.object({
    taskName: Yup.string()
      .required("Task name is required")
      .max(100, "Task name cannot exceed 100 characters"),
    taskDescription: Yup.string()
      .required("Description is required")
      .max(500, "Description cannot exceed 500 characters"),
    startDate: Yup.date()
      .required("Start date is required")
      .typeError("Invalid date format"), // Better date validation message
    endDate: Yup.date()
      .required("End date is required")
      .min(Yup.ref("startDate"), "End date cannot be before start date")
      .typeError("Invalid date format"),
    assignedTo: Yup.array()
      .of(Yup.string().required()) // Ensure each ID in the array is a string
      .min(1, "At least one assignee must be selected")
      .required("Assignee selection is required"), // The array itself is required
    status: Yup.string()
      .required("Status is required")
      .oneOf(["not_started", "in_progress", "completed", "on_hold"], "Invalid status selected"),
    priority: Yup.string()
      .required("Priority is required")
      .oneOf(["low", "medium", "high"], "Invalid priority selected"),
  });

  // --- Date Formatting ---
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      // Ensure the date uses local timezone for input[type=date]
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      console.error("Error formatting date for input:", dateString, e);
      return "";
    }
  };

  // --- Initial Form Values ---
  // Memoize initialValues calculation? Not critical unless task object is huge/changes often unnecessarily
  const initialValues = task ? {
      taskName: task.taskName || "",
      taskDescription: task.taskDescription || "",
      startDate: formatDateForInput(task.startDate),
      endDate: formatDateForInput(task.endDate),
      project: task.project?._id || "", // Keep hidden project ID if needed
      assignedTo: task.assignedTo?.map(user => user._id).filter(Boolean) || [], // Ensure only valid IDs
      status: task.status || "not_started",
      priority: task.priority || "medium",
    } : { // Default values if task hasn't loaded yet (for Formik)
      taskName: "",
      taskDescription: "",
      startDate: "",
      endDate: "",
      project: "",
      assignedTo: [],
      status: "not_started",
      priority: "medium",
    };

  // --- Handle Form Submission ---
  const handleSubmit = (values) => {
    // Double check submission status
    if (isSubmittingInternal || updateTaskMutation.isLoading) return;

    // Ensure dates are in ISO format for the backend
    const formattedValues = {
      ...values, // Spread validated values
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
      project: taskProjectId, // Use the fetched task's project ID consistently
      // assignedTo is already an array of strings from Formik
    };

    console.log("Submitting Task Update Data:", formattedValues);
    updateTaskMutation.mutate(formattedValues);
  };

  // --- Render Logic ---

  // Show nothing or a minimal loader until admin status is confirmed
  if (isAdmin === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        <ArrowPathIcon className="h-8 w-8 text-gray-500 animate-spin" />
        <span className="ml-2 text-gray-500">Verifying access...</span>
      </div>
    );
  }

  // If admin check failed or user is not admin (already handled by useEffect redirect, but safe fallback)
  if (!isAdmin) {
     return null; // Or a dedicated "Access Denied" component
  }

  // Combined Loading State for initial data fetch
  if (isLoadingTask || (isAdmin && taskProjectId && isLoadingProject && !projectDetails)) {
    return (
        <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
            <TaskFormSkeleton />
        </div>
    );
  }

  // --- Error Handling UI (Task Fetch Error) ---
  if (taskError) {
    return (
      <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md my-6 shadow">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">Error Loading Task</p>
              <p className="mt-1 text-sm text-red-700">
                Could not retrieve the details for this task.
                {taskError.message && ` (${taskError.message})`}
              </p>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => refetchTask()}
                  disabled={isFetchingTask}
                  className={getButtonClasses('secondary', isFetchingTask)}
                >
                  <ArrowPathIcon className={`h-4 w-4 mr-1.5 ${isFetchingTask ? 'animate-spin' : ''}`} aria-hidden="true" />
                  Retry Load
                </button>
                <button
                  onClick={() => navigate("/admin/tasks")}
                  className={getButtonClasses()}
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
                  Back to Tasks
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

   // --- Task Not Found UI ---
   if (!isLoadingTask && !task) {
     return (
       <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
         <InformationCircleIcon className="h-12 w-12 mx-auto text-gray-400" />
         <h2 className="mt-2 text-lg font-medium text-gray-900">Task Not Found</h2>
         <p className="mt-1 text-sm text-gray-500">
            The task you are looking for might have been deleted or does not exist.
         </p>
         <div className="mt-6">
           <button
             onClick={() => navigate("/admin/tasks")}
             className={getButtonClasses('primary')}
           >
             <ArrowLeftIcon className="h-5 w-5 mr-2" />
             Return to Task List
           </button>
         </div>
       </div>
     );
   }

  // --- Main Form Render ---
  // We have the task data now, safe to render Formik
  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight mb-1">
            Edit Task
          </h1>
          {task && (
            <p className="text-sm text-gray-500">
              Updating task: <span className="font-medium text-gray-700">{task.taskName}</span>
            </p>
          )}
          {(projectDetails || task?.project) && (
            <p className="text-sm text-gray-500 mt-1">
              Project: <span className="font-medium text-gray-700">{projectDetails?.projectName || task.project?.projectName || "Loading..."}</span>
            </p>
          )}
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-4">
          <button
            type="button"
            onClick={() => navigate(`/admin/tasks`)}
            className={getButtonClasses()} // Use helper for consistent styling
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            Back to Tasks
          </button>
        </div>
      </div>

       {/* Project Fetch Error Warning (Displayed above form if assignee list might be broken) */}
       {projectError && taskProjectId && !isLoadingProject && (
         <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md mb-6 shadow">
           <div className="flex">
             <div className="flex-shrink-0">
               <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
             </div>
             <div className="ml-3">
               <p className="text-sm font-medium text-yellow-800">Project Data Issue</p>
               <p className="mt-1 text-sm text-yellow-700">
                 Could not load full project details. Assignee list may be incomplete or unavailable.
                 {projectError.message && ` (${projectError.message})`}
               </p>
               <div className="mt-3">
                   <button onClick={() => refetchProject()} className={getButtonClasses('secondary', isFetchingProject)}>
                        <ArrowPathIcon className={`h-4 w-4 mr-1.5 ${isFetchingProject ? 'animate-spin' : ''}`} aria-hidden="true"/>
                        Retry Project Load
                   </button>
               </div>
             </div>
           </div>
         </div>
       )}

      {/* Form Card */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          validateOnChange={false} // Validate on blur/submit for better UX
          validateOnBlur={true}
          enableReinitialize // Important: Update form when task data changes after fetch/refetch
        >
          {({ errors, touched, isSubmitting, values /* Access values if needed */ }) => {
            const isSubmitDisabled = isSubmittingInternal || updateTaskMutation.isLoading || (projectDetails && !projectError && assigneeOptions.length === 0); // Disable if loading OR submitting OR if project loaded fine but has NO valid assignees
            const isLoadingAssignees = isLoadingProject || isFetchingProject;

            return (
              <Form>
                <div className="px-4 py-5 sm:p-6 space-y-8">

                  {/* --- Section: Task Details --- */}
                  <div className="space-y-6 border-b border-gray-200 pb-6">
                     <h2 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                          <PencilSquareIcon className="h-6 w-6 mr-2 text-indigo-600" /> Task Details
                     </h2>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      {/* Task Name */}
                      <div className="sm:col-span-6">
                        <label htmlFor="taskName" className="block text-sm font-medium leading-6 text-gray-900">
                          Task Name <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-2">
                          <Field
                            type="text"
                            name="taskName"
                            id="taskName"
                            className={getInputClasses(errors.taskName && touched.taskName)}
                            aria-invalid={errors.taskName && touched.taskName ? "true" : "false"}
                          />
                          <ErrorMessage name="taskName" component="p" className="mt-2 text-sm text-red-600" id="taskName-error" />
                        </div>
                      </div>

                      {/* Task Description */}
                      <div className="sm:col-span-6">
                        <label htmlFor="taskDescription" className="block text-sm font-medium leading-6 text-gray-900">
                          Description <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-2">
                          <Field
                            as="textarea"
                            name="taskDescription"
                            id="taskDescription"
                            rows={4}
                            className={getInputClasses(errors.taskDescription && touched.taskDescription)}
                             aria-invalid={errors.taskDescription && touched.taskDescription ? "true" : "false"}
                          />
                          <ErrorMessage name="taskDescription" component="p" className="mt-2 text-sm text-red-600" id="taskDescription-error"/>
                        </div>
                      </div>

                      {/* Project (Display Only) */}
                      <div className="sm:col-span-6">
                        <label htmlFor="projectDisplay" className="block text-sm font-medium leading-6 text-gray-900">Project</label>
                        <div className="mt-2">
                          <input
                            type="text"
                            id="projectDisplay"
                            value={projectDetails?.projectName || task.project?.projectName || "Loading project..."}
                            disabled
                            className={`${getInputClasses(false)} bg-gray-100 cursor-not-allowed text-gray-600`}
                          />
                          <Field type="hidden" name="project" /> {/* Keep hidden field if form needs it */}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* --- Section: Dates --- */}
                  <div className="space-y-6 border-b border-gray-200 pb-6">
                     <h2 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                          <CalendarDaysIcon className="h-6 w-6 mr-2 text-indigo-600" /> Dates
                     </h2>
                     <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        {/* Start Date */}
                        <div className="sm:col-span-3">
                            <label htmlFor="startDate" className="block text-sm font-medium leading-6 text-gray-900">Start Date <span className="text-red-500">*</span></label>
                            <div className="mt-2">
                                <Field
                                    type="date"
                                    name="startDate"
                                    id="startDate"
                                    className={getInputClasses(errors.startDate && touched.startDate)}
                                    aria-invalid={errors.startDate && touched.startDate ? "true" : "false"}
                                />
                                <ErrorMessage name="startDate" component="p" className="mt-2 text-sm text-red-600" id="startDate-error"/>
                            </div>
                        </div>

                        {/* End Date */}
                        <div className="sm:col-span-3">
                            <label htmlFor="endDate" className="block text-sm font-medium leading-6 text-gray-900">End Date <span className="text-red-500">*</span></label>
                            <div className="mt-2">
                                <Field
                                    type="date"
                                    name="endDate"
                                    id="endDate"
                                    className={getInputClasses(errors.endDate && touched.endDate)}
                                     aria-invalid={errors.endDate && touched.endDate ? "true" : "false"}
                                />
                                <ErrorMessage name="endDate" component="p" className="mt-2 text-sm text-red-600" id="endDate-error"/>
                            </div>
                        </div>
                    </div>
                  </div>

                  {/* --- Section: Assignment --- */}
                   <div className="space-y-6 border-b border-gray-200 pb-6">
                     <h2 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                          <UsersIcon className="h-6 w-6 mr-2 text-indigo-600" /> Assignment
                     </h2>
                     <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                       {/* Assigned To (Multi-Select) */}
                        <div className="sm:col-span-6">
                            <label htmlFor="assignedTo" className="block text-sm font-medium leading-6 text-gray-900">
                                Assigned To <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-2">
                                <Field
                                as="select"
                                multiple={true}
                                name="assignedTo"
                                id="assignedTo"
                                size={Math.max(5, assigneeOptions.length + (isLoadingAssignees ? 1 : 0))} // Dynamic size, min 5
                                className={`${getInputClasses(errors.assignedTo && touched.assignedTo)} ${
                                    isLoadingAssignees || (projectDetails && !projectError && assigneeOptions.length === 0) ? 'bg-gray-100 cursor-not-allowed' : ''
                                }`}
                                disabled={isLoadingAssignees || (projectDetails && !projectError && assigneeOptions.length === 0)} // Disable if loading or if project loaded successfully but has no valid assignees
                                aria-invalid={errors.assignedTo && touched.assignedTo ? "true" : "false"}
                                aria-describedby="assignedTo-helper assignedTo-error assignedTo-warning" // Link helper/error text
                                >
                                {isLoadingAssignees && <option disabled>Loading assignees...</option>}
                                {!isLoadingAssignees && assigneeOptions.map((user) => (
                                    <option key={user._id} value={user._id}>
                                    {user.firstName} {user.lastName} ({user.roleLabel || 'User'})
                                    </option>
                                ))}
                                {!isLoadingAssignees && !projectError && assigneeOptions.length === 0 && projectDetails && (
                                    <option disabled>No active users found for assignment in this project.</option>
                                )}
                                {/* Don't show 'no users' if project itself failed to load */}
                                {!isLoadingAssignees && projectError && (
                                     <option disabled>Could not load assignees due to project error.</option>
                                )}
                                </Field>
                                <MultiSelectInfo />
                                {/* Contextual Warnings/Errors */}
                                {!isLoadingAssignees && projectError && (
                                    <p id="assignedTo-warning" className="mt-1.5 text-xs text-yellow-700 flex items-center">
                                        <ExclamationTriangleIcon className="h-4 w-4 mr-1 text-yellow-500 shrink-0" />
                                        Assignee list may be incomplete due to project loading error.
                                    </p>
                                )}
                                {!isLoadingAssignees && !projectError && assigneeOptions.length === 0 && projectDetails && (
                                     <p id="assignedTo-warning" className="mt-1.5 text-xs text-yellow-700 flex items-center">
                                        <InformationCircleIcon className="h-4 w-4 mr-1 text-yellow-500 shrink-0" />
                                        No active Contractor, Consultant, or PM found in '{projectDetails.projectName}'. Cannot assign task.
                                    </p>
                                )}
                                <ErrorMessage name="assignedTo" component="p" className="mt-2 text-sm text-red-600" id="assignedTo-error"/>
                            </div>
                        </div>
                    </div>
                  </div>

                  {/* --- Section: Status & Priority --- */}
                  <div className="space-y-6">
                     <h2 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                         <TagIcon className="h-6 w-6 mr-2 text-indigo-600" /> Status & Priority
                     </h2>
                     <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        {/* Status Dropdown */}
                        <div className="sm:col-span-3">
                        <label htmlFor="status" className="block text-sm font-medium leading-6 text-gray-900">Status <span className="text-red-500">*</span></label>
                        <div className="mt-2">
                            <Field
                                as="select"
                                name="status"
                                id="status"
                                className={getInputClasses(errors.status && touched.status)}
                                aria-invalid={errors.status && touched.status ? "true" : "false"}
                            >
                                <option value="not_started">Not Started</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="on_hold">On Hold</option>
                            </Field>
                            <ErrorMessage name="status" component="p" className="mt-2 text-sm text-red-600" id="status-error"/>
                        </div>
                        </div>

                        {/* Priority Dropdown */}
                        <div className="sm:col-span-3">
                        <label htmlFor="priority" className="block text-sm font-medium leading-6 text-gray-900">Priority <span className="text-red-500">*</span></label>
                        <div className="mt-2">
                            <Field
                                as="select"
                                name="priority"
                                id="priority"
                                className={getInputClasses(errors.priority && touched.priority)}
                                aria-invalid={errors.priority && touched.priority ? "true" : "false"}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </Field>
                            <ErrorMessage name="priority" component="p" className="mt-2 text-sm text-red-600" id="priority-error"/>
                        </div>
                        </div>
                    </div>
                  </div>


                </div> {/* End Form Content Area */}

                {/* Submit/Cancel Buttons */}
                <div className="flex items-center justify-end gap-x-4 border-t border-gray-900/10 px-4 py-4 sm:px-6 bg-gray-50 rounded-b-lg">
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/tasks`)}
                    disabled={isSubmitDisabled} // Also disable cancel during submission? Optional.
                    className={getButtonClasses('secondary', isSubmitDisabled)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitDisabled}
                    className={getButtonClasses('primary', isSubmitDisabled)}
                    aria-disabled={isSubmitDisabled}
                  >
                    {isSubmitDisabled && updateTaskMutation.isLoading ? (
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
            );
          }}
        </Formik>
      </div> {/* End Form Card */}
    </div> /* End Page Container */
  );
};

export default EditTask;