

// import { useState } from "react"
// import { useNavigate } from "react-router-dom"
// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
// import { Formik, Form, Field, ErrorMessage } from "formik"
// import * as Yup from "yup"
// import { toast } from "react-toastify"
// import { ArrowPathIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline"
// import schedulesAPI from "../../../api/schedules"
// import projectsAPI from "../../../api/projects"
// import tasksAPI from "../../../api/tasks"

// const CreateSchedule = () => {
//   const navigate = useNavigate()
//   const queryClient = useQueryClient()
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   // State for selected project so we can filter tasks accordingly
//   const [selectedProject, setSelectedProject] = useState("")
//   // Local state to hold the display value for assigned user name
//   const [assignedUserName, setAssignedUserName] = useState("")

//   // Fetch projects for dropdown
//   const {
//     data: projectsData,
//     isLoading: isLoadingProjects,
//     error: projectsError,
//   } = useQuery({
//     queryKey: ["projects"],
//     queryFn: projectsAPI.getAllProjects,
//   })

//   // Fetch tasks for dropdown based on selected project using getTasksForProject
//   const {
//     data: tasksData,
//     isLoading: isLoadingTasks,
//   } = useQuery({
//     queryKey: ["tasks", selectedProject],
//     queryFn: () =>
//       selectedProject
//         ? tasksAPI.getTasksForProject(selectedProject)
//         : Promise.resolve([]),
//     enabled: !!selectedProject, // only run when a project is selected
//   })

//   // Create schedule mutation
//   const createScheduleMutation = useMutation({
//     mutationFn: schedulesAPI.createSchedule,
//     onSuccess: () => {
//       toast.success("Schedule created successfully")
//       queryClient.invalidateQueries({ queryKey: ["schedules"] })
//       navigate("/admin/schedules")
//     },
//     onError: (error) => {
//       toast.error(error.message || "Failed to create schedule")
//       setIsSubmitting(false)
//     },
//   })

//   // Validation schema updated to match the schedule model
//   const validationSchema = Yup.object({
//     scheduleName: Yup.string()
//       .required("Schedule name is required")
//       .max(100, "Cannot exceed 100 characters"),
//     scheduleDescription: Yup.string()
//       .required("Description is required")
//       .max(500, "Cannot exceed 500 characters"),
//     startDate: Yup.date().required("Start date is required"),
//     endDate: Yup.date()
//       .required("End date is required")
//       .min(Yup.ref("startDate"), "End date must be after the start date"),
//     project: Yup.string().required("Project is required"),
//     task: Yup.string().required("Task is required"),
//     // assignedTo is hidden and filled automatically so we still require it for backend validation.
//     assignedTo: Yup.string().required("Assigned To is required"),
//     status: Yup.string()
//       .required("Status is required")
//       .oneOf(["planned", "in_progress", "completed", "delayed"], "Invalid status"),
//     priority: Yup.string()
//       .required("Priority is required")
//       .oneOf(["low", "medium", "high"], "Invalid priority"),
//   })

//   // Initial form values with fields matching the model
//   const initialValues = {
//     scheduleName: "",
//     scheduleDescription: "",
//     startDate: "",
//     endDate: "",
//     project: "",
//     task: "",
//     assignedTo: "",
//     status: "planned",
//     priority: "medium",
//   }

//   // Handle form submission: format dates and submit (exclude display field)
//   const handleSubmit = (values) => {
//     setIsSubmitting(true)
//     // Exclude assignedUserName (not part of backend payload)
//     const { assignedTo, ...rest } = values
//     const formattedValues = {
//       ...rest,
//       startDate: new Date(values.startDate).toISOString(),
//       endDate: new Date(values.endDate).toISOString(),
//       assignedTo, // send the hidden id value
//     }
//     createScheduleMutation.mutate(formattedValues)
//   }

//   return (
//     <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
//       <div className="sm:flex sm:items-center sm:justify-between mb-8">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900 mb-1">Create New Schedule</h1>
//           <p className="text-gray-500 text-sm">Add a new schedule for construction projects.</p>
//         </div>
//         <button
//           type="button"
//           onClick={() => navigate("/admin/schedules")}
//           className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//         >
//           Back to Schedules
//         </button>
//       </div>

//       <div className="bg-white shadow rounded-lg overflow-hidden">
//         <div className="px-4 py-5 sm:p-6">
//           <Formik
//             initialValues={initialValues}
//             validationSchema={validationSchema}
//             onSubmit={handleSubmit}
//             validateOnChange={false}
//             validateOnBlur={true}
//           >
//             {({ errors, touched, setFieldValue }) => (
//               <Form className="space-y-6">
//                 <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
//                   {/* Schedule Name */}
//                   <div className="sm:col-span-2">
//                     <label htmlFor="scheduleName" className="block text-sm font-medium text-gray-700">
//                       Schedule Name
//                     </label>
//                     <div className="mt-1">
//                       <Field
//                         type="text"
//                         name="scheduleName"
//                         id="scheduleName"
//                         placeholder="Foundation Construction Phase"
//                         className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
//                           errors.scheduleName && touched.scheduleName ? "border-red-500" : ""
//                         }`}
//                       />
//                       <ErrorMessage name="scheduleName" component="p" className="mt-1 text-sm text-red-600" />
//                     </div>
//                   </div>

//                   {/* Schedule Description */}
//                   <div className="sm:col-span-2">
//                     <label htmlFor="scheduleDescription" className="block text-sm font-medium text-gray-700">
//                       Schedule Description
//                     </label>
//                     <div className="mt-1">
//                       <Field
//                         as="textarea"
//                         name="scheduleDescription"
//                         id="scheduleDescription"
//                         rows={3}
//                         placeholder="Detailed description of the schedule..."
//                         className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
//                           errors.scheduleDescription && touched.scheduleDescription ? "border-red-500" : ""
//                         }`}
//                       />
//                       <ErrorMessage name="scheduleDescription" component="p" className="mt-1 text-sm text-red-600" />
//                     </div>
//                   </div>

//                   {/* Project */}
//                   <div className="sm:col-span-2">
//                     <label htmlFor="project" className="block text-sm font-medium text-gray-700">
//                       Project
//                     </label>
//                     <div className="mt-1">
//                       <Field
//                         as="select"
//                         name="project"
//                         id="project"
//                         className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
//                           errors.project && touched.project ? "border-red-500" : ""
//                         }`}
//                         disabled={isLoadingProjects}
//                         onChange={(e) => {
//                           const projectId = e.target.value
//                           // update Formik value and local state
//                           setFieldValue("project", projectId)
//                           setFieldValue("task", "")  // reset task
//                           setFieldValue("assignedTo", "")  // reset assignedTo
//                           setAssignedUserName("") // reset display name
//                           setSelectedProject(projectId)
//                         }}
//                       >
//                         <option value="">Select a project</option>
//                         {projectsData?.data?.map((project) => (
//                           <option key={project._id} value={project._id}>
//                             {project.projectName}
//                           </option>
//                         ))}
//                       </Field>
//                       {isLoadingProjects && <p className="mt-1 text-sm text-gray-500">Loading projects...</p>}
//                       {projectsError && (
//                         <p className="mt-1 text-sm text-red-600">
//                           Error loading projects: {projectsError.message}
//                         </p>
//                       )}
//                       {!isLoadingProjects &&
//                         !projectsError &&
//                         projectsData?.data?.length === 0 && (
//                           <p className="mt-1 text-sm text-yellow-600">
//                             No projects found. Please create projects first.
//                           </p>
//                         )}
//                       <ErrorMessage name="project" component="p" className="mt-1 text-sm text-red-600" />
//                     </div>
//                   </div>

//                   {/* Task */}
//                   <div className="sm:col-span-2">
//                     <label htmlFor="task" className="block text-sm font-medium text-gray-700">
//                       Task
//                     </label>
//                     <div className="mt-1">
//                       <Field
//                         as="select"
//                         name="task"
//                         id="task"
//                         className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
//                           errors.task && touched.task ? "border-red-500" : ""
//                         }`}
//                         disabled={
//                           !selectedProject ||
//                           isLoadingTasks ||
//                           (selectedProject && tasksData?.length === 0)
//                         }
//                         onChange={(e) => {
//                           const taskId = e.target.value
//                           setFieldValue("task", taskId)
//                           // Find the selected task from tasksData
//                           const selectedTask = tasksData?.find(task => task._id === taskId)
//                           if (selectedTask && selectedTask.assignedTo?.length) {
//                             // For simplicity, we assume one assigned user.
//                             const user = selectedTask.assignedTo[0]
//                             // Set the hidden field with the user id.
//                             setFieldValue("assignedTo", user._id)
//                             // Set local state to display the user's name.
//                             const name =
//                               user.firstName && user.lastName
//                                 ? `${user.firstName} ${user.lastName}`
//                                 : user.username || "Unknown"
//                             setAssignedUserName(name)
//                           } else {
//                             setFieldValue("assignedTo", "")
//                             setAssignedUserName("")
//                           }
//                         }}
//                       >
//                         <option value="">Select a task</option>
//                         {tasksData?.map((task) => (
//                           <option key={task._id} value={task._id}>
//                             {task.taskName}
//                           </option>
//                         ))}
//                       </Field>
//                       {!selectedProject && (
//                         <p className="mt-1 text-sm text-gray-500">Please select a project first.</p>
//                       )}
//                       {selectedProject && isLoadingTasks && (
//                         <p className="mt-1 text-sm text-gray-500">Loading tasks...</p>
//                       )}
//                       {selectedProject &&
//                         !isLoadingTasks &&
//                         tasksData?.length === 0 && (
//                           <div className="mt-1 text-sm text-yellow-600 flex items-center gap-2">
//                             <span>No tasks found for this project.</span>
//                             <button
//                               type="button"
//                               onClick={() => navigate("/admin/tasks/create")}
//                               className="underline text-indigo-600 hover:text-indigo-800"
//                             >
//                               Create Task
//                             </button>
//                           </div>
//                         )}
//                       <ErrorMessage name="task" component="p" className="mt-1 text-sm text-red-600" />
//                     </div>
//                   </div>

//                   {/* Hidden Assigned To (user id) */}
//                   <Field type="hidden" name="assignedTo" />

//                   {/* Display Assigned To (read-only) */}
//                   <div className="sm:col-span-2">
//                     <label htmlFor="assignedUserDisplay" className="block text-sm font-medium text-gray-700">
//                       Assigned To
//                     </label>
//                     <div className="mt-1">
//                       <input
//                         type="text"
//                         id="assignedUserDisplay"
//                         value={assignedUserName}
//                         readOnly
//                         placeholder="Assigned user will appear here"
//                         className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
//                       />
//                     </div>
//                   </div>

//                   {/* Start Date */}
//                   <div>
//                     <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
//                       Start Date
//                     </label>
//                     <div className="mt-1">
//                       <Field
//                         type="date"
//                         name="startDate"
//                         id="startDate"
//                         className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
//                           errors.startDate && touched.startDate ? "border-red-500" : ""
//                         }`}
//                       />
//                       <ErrorMessage name="startDate" component="p" className="mt-1 text-sm text-red-600" />
//                     </div>
//                   </div>

//                   {/* End Date */}
//                   <div>
//                     <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
//                       End Date
//                     </label>
//                     <div className="mt-1">
//                       <Field
//                         type="date"
//                         name="endDate"
//                         id="endDate"
//                         className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
//                           errors.endDate && touched.endDate ? "border-red-500" : ""
//                         }`}
//                       />
//                       <ErrorMessage name="endDate" component="p" className="mt-1 text-sm text-red-600" />
//                     </div>
//                   </div>

//                   {/* Status */}
//                   <div>
//                     <label htmlFor="status" className="block text-sm font-medium text-gray-700">
//                       Status
//                     </label>
//                     <div className="mt-1">
//                       <Field
//                         as="select"
//                         name="status"
//                         id="status"
//                         className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
//                           errors.status && touched.status ? "border-red-500" : ""
//                         }`}
//                       >
//                         <option value="planned">Planned</option>
//                         <option value="in_progress">In Progress</option>
//                         <option value="completed">Completed</option>
//                         <option value="delayed">Delayed</option>
//                       </Field>
//                       <ErrorMessage name="status" component="p" className="mt-1 text-sm text-red-600" />
//                     </div>
//                   </div>

//                   {/* Priority */}
//                   <div>
//                     <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
//                       Priority
//                     </label>
//                     <div className="mt-1">
//                       <Field
//                         as="select"
//                         name="priority"
//                         id="priority"
//                         className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${
//                           errors.priority && touched.priority ? "border-red-500" : ""
//                         }`}
//                       >
//                         <option value="low">Low</option>
//                         <option value="medium">Medium</option>
//                         <option value="high">High</option>
//                       </Field>
//                       <ErrorMessage name="priority" component="p" className="mt-1 text-sm text-red-600" />
//                     </div>
//                   </div>
//                 </div>

//                 {/* Submit Button */}
//                 <div className="flex justify-end">
//                   <button
//                     type="button"
//                     onClick={() => navigate("/admin/schedules")}
//                     className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     disabled={
//                       isSubmitting ||
//                       (selectedProject && tasksData?.length === 0)
//                     }
//                     className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
//                       isSubmitting ||
//                       (selectedProject && tasksData?.length === 0)
//                         ? "bg-indigo-400 cursor-not-allowed"
//                         : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//                     }`}
//                   >
//                     {isSubmitting ? (
//                       <>
//                         <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
//                         Creating...
//                       </>
//                     ) : (
//                       <>
//                         <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
//                         Create Schedule
//                       </>
//                     )}
//                   </button>
//                 </div>
//               </Form>
//             )}
//           </Formik>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default CreateSchedule

/*eslint-disable */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import {
  ArrowPathIcon,
  ClipboardDocumentListIcon, // Relevant for "Create Schedule"
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BuildingOffice2Icon, // For Project
  ListBulletIcon,       // For Task
  UserCircleIcon,       // For Assigned User
  CalendarDaysIcon,     // For Dates
  TagIcon,              // For Status/Priority
  PlusCircleIcon,       // For Create Button
} from "@heroicons/react/24/outline";
import schedulesAPI from "../../../api/schedules";
import projectsAPI from "../../../api/projects";
import tasksAPI from "../../../api/tasks"; // Using the provided tasksAPI

// --- Helper functions for consistent styling (reuse from previous example) ---
const getInputClasses = (hasError, isDisabled = false) =>
  `block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 ${
    isDisabled
      ? "bg-gray-100 cursor-not-allowed text-gray-500 ring-gray-200"
      : hasError
      ? "ring-red-500 focus:ring-red-600 text-red-900 placeholder:text-red-300" // Added error text color
      : "ring-gray-300"
  }`;

const getButtonClasses = (variant = "secondary", disabled = false) => {
  let base = "inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2";
  if (disabled) {
    base += " cursor-not-allowed opacity-60";
  }
  if (variant === "primary") {
    base += ` border-transparent bg-indigo-600 text-white ${
      !disabled ? "hover:bg-indigo-700 focus:ring-indigo-500" : "bg-indigo-400"
    }`;
  } else if (variant === "danger") {
    base += ` border-transparent bg-red-600 text-white ${
      !disabled ? "hover:bg-red-700 focus:ring-red-500" : "bg-red-400"
    }`;
  } else { // secondary / cancel
    base += ` border-gray-300 bg-white text-gray-700 ${
      !disabled ? "hover:bg-gray-50 focus:ring-indigo-500" : ""
    }`;
  }
  return base;
};

// --- Skeleton Loader ---
const ScheduleFormSkeleton = () => (
    <div className="animate-pulse">
        {/* Header Skeleton */}
        <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-1"></div>
        </div>
        {/* Form Card Skeleton */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6 space-y-8">
                {/* Section Skeleton */}
                <div className="space-y-4 border-b border-gray-200 pb-6">
                    <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                         <div className="sm:col-span-6 space-y-1">
                            <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                            <div className="h-10 bg-gray-200 rounded w-full"></div>
                         </div>
                         <div className="sm:col-span-6 space-y-1">
                            <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                            <div className="h-20 bg-gray-200 rounded w-full"></div>
                         </div>
                    </div>
                </div>
                 {/* Project/Task Section Skeleton */}
                 <div className="space-y-4 border-b border-gray-200 pb-6">
                    <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-6 space-y-1">
                            <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                            <div className="h-10 bg-gray-100 rounded w-full"></div> {/* Disabled look */}
                        </div>
                         <div className="sm:col-span-6 space-y-1">
                            <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                            <div className="h-10 bg-gray-100 rounded w-full"></div> {/* Disabled look */}
                         </div>
                         <div className="sm:col-span-6 space-y-1">
                            <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                            <div className="h-10 bg-gray-100 rounded w-full"></div> {/* Disabled look */}
                         </div>
                    </div>
                 </div>
                 {/* Dates/Status/Priority Section Skeleton */}
                 <div className="space-y-4">
                     <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                     <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                         <div className="sm:col-span-3 space-y-1">
                             <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                             <div className="h-10 bg-gray-200 rounded w-full"></div>
                         </div>
                          <div className="sm:col-span-3 space-y-1">
                             <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                             <div className="h-10 bg-gray-200 rounded w-full"></div>
                         </div>
                          <div className="sm:col-span-3 space-y-1">
                             <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                             <div className="h-10 bg-gray-200 rounded w-full"></div>
                         </div>
                         <div className="sm:col-span-3 space-y-1">
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-10 bg-gray-200 rounded w-full"></div>
                         </div>
                     </div>
                 </div>
                 {/* Footer Skeleton */}
                <div className="flex justify-end pt-5 border-t border-gray-200 mt-8 space-x-3">
                    <div className="h-10 bg-gray-200 rounded w-20"></div>
                    <div className="h-10 bg-indigo-200 rounded w-36"></div>
                </div>
            </div>
        </div>
    </div>
);


const CreateSchedule = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState("");
  const [assignedUserName, setAssignedUserName] = useState(""); // Display name
  const [isLoadingForm, setIsLoadingForm] = useState(true); // To manage initial form loading state

  // --- Fetch Projects ---
  const {
    data: projectsResponse,
    isLoading: isLoadingProjects,
    error: projectsError,
    isFetching: isFetchingProjects, // Use isFetching for background updates
  } = useQuery({
    queryKey: ["projects", { listing: true }], // More specific key for project list
    queryFn: () => projectsAPI.getAllProjects({ limit: 500 }), // Fetch all for dropdown, add limit if needed
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    select: (response) => response.data || [], // Directly select the data array or default to empty
    onSuccess: () => setIsLoadingForm(false), // Stop skeleton loader once projects load (or fail)
    onError: () => setIsLoadingForm(false),
  });
  const projectsData = projectsResponse || []; // Ensure projectsData is always an array


  // --- Fetch Tasks based on Selected Project ---
  const {
    data: tasksResponse,
    isLoading: isLoadingTasks,
    error: tasksError,
    isFetching: isFetchingTasks, // Use isFetching for background task loading indicator
  } = useQuery({
    queryKey: ["tasks", { project: selectedProject }], // Query key includes the filter
    // *** FIX: Use getTasks with filter, check selectedProject exists ***
    queryFn: () => {
        if (!selectedProject) {
            return Promise.resolve([]); // Return empty array if no project selected
        }
        return tasksAPI.getTasks({ project: selectedProject, limit: 500 }); // Add limit if needed
    },
    // *** FIX: Select the 'data' property from the response ***
    select: (response) => response.data || [], // Directly select the data array or default to empty
    enabled: !!selectedProject, // Only run query when a project ID is selected
    staleTime: 1 * 60 * 1000, // 1 minute stale time for tasks
    cacheTime: 5 * 60 * 1000, // 5 minutes cache time
  });
  const tasksData = tasksResponse || []; // Ensure tasksData is always an array


  // --- Create Schedule Mutation ---
  const createScheduleMutation = useMutation({
    mutationFn: schedulesAPI.createSchedule,
     onMutate: () => {
      // Optionally show immediate feedback or disable form further
    },
    onSuccess: (data) => {
      toast.success(`Schedule "${data?.data?.scheduleName || 'Schedule'}" created successfully`);
      queryClient.invalidateQueries({ queryKey: ["schedules"] }); // Invalidate schedule list
      // Consider invalidating tasks for the project if schedule creation impacts tasks? Maybe not needed.
      navigate("/admin/schedules");
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to create schedule";
      console.error("Schedule Creation Error:", error.response || error);
      toast.error(errorMessage);
      // No need to setIsSubmitting(false) here, Formik's isSubmitting handles it
    },
     onSettled: () => {
        // Runs after success or error
        // Formik's `isSubmitting` is automatically managed
     }
  });

  // --- Validation Schema ---
  const validationSchema = Yup.object({
    scheduleName: Yup.string()
      .required("Schedule name is required")
      .max(100, "Schedule name cannot exceed 100 characters"),
    scheduleDescription: Yup.string()
      .required("Description is required")
      .max(500, "Description cannot exceed 500 characters"),
    startDate: Yup.date()
      .required("Start date is required")
      .typeError("Invalid date format"),
    endDate: Yup.date()
      .required("End date is required")
      .min(Yup.ref("startDate"), "End date cannot be before the start date")
      .typeError("Invalid date format"),
    project: Yup.string().required("A project must be selected"),
    task: Yup.string().required("A task must be selected"),
    // Keep assignedTo required for backend, even though hidden and auto-filled
    assignedTo: Yup.string().required("Task selected must have an assigned user"),
    status: Yup.string()
      .required("Status is required")
      .oneOf(["planned", "in_progress", "completed", "delayed"], "Invalid status selected"),
    priority: Yup.string()
      .required("Priority is required")
      .oneOf(["low", "medium", "high"], "Invalid priority selected"),
  });

  // --- Initial Form Values ---
  const initialValues = {
    scheduleName: "",
    scheduleDescription: "",
    startDate: "",
    endDate: "",
    project: "",
    task: "",
    assignedTo: "", // Will be hidden, filled by task selection
    status: "planned",
    priority: "medium",
  };

  // --- Handle Form Submission ---
  const handleSubmit = (values, { setSubmitting }) => {
    // Format dates just before sending
    const formattedValues = {
      ...values,
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
      // assignedTo is already correctly set in the hidden field
    };
    console.log("Submitting Schedule Data:", formattedValues);
    createScheduleMutation.mutate(formattedValues, {
        onSettled: () => {
            setSubmitting(false); // Ensure Formik's submitting state is reset
        }
    });
  };

  // Determine if the form prerequisites (project/task selection) are met
  const canSubmit = !!selectedProject && tasksData.length > 0;

  // Show skeleton while projects are initially loading
  if (isLoadingForm && isLoadingProjects) {
      return (
           <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                <ScheduleFormSkeleton />
            </div>
      );
  }

  // Handle Project Loading Error
  if (projectsError) {
     return (
       <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
         <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md my-6 shadow">
           <div className="flex">
             <div className="flex-shrink-0">
               <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
             </div>
             <div className="ml-3">
               <p className="text-sm font-medium text-red-800">Error Loading Projects</p>
               <p className="mt-1 text-sm text-red-700">
                 Could not retrieve the list of projects needed to create a schedule.
                 {projectsError.message && ` (${projectsError.message})`}
               </p>
               <div className="mt-4">
                 {/* Optionally add a retry button for projects here if feasible */}
                  <button
                      onClick={() => navigate("/admin/dashboard")} // Or back to wherever makes sense
                      className={getButtonClasses()}
                  >
                      <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
                      Back to Dashboard
                  </button>
               </div>
             </div>
           </div>
         </div>
       </div>
     );
  }


  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight mb-1">
            Create New Schedule
          </h1>
          <p className="text-sm text-gray-500">
            Define a new schedule item linked to a project task.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-4">
          <button
            type="button"
            onClick={() => navigate("/admin/schedules")}
            className={getButtonClasses()}
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            Back to Schedules
          </button>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          validateOnChange={false} // Validate on blur/submit
          validateOnBlur={true}
        >
          {({ errors, touched, setFieldValue, isSubmitting, values }) => {
             const projectSelected = !!values.project;
             const taskSelected = !!values.task;
             const disableSubmit = isSubmitting || createScheduleMutation.isLoading || !values.assignedTo; // Disable if submitting or no assignee derived

            return (
              <Form>
                <div className="px-4 py-5 sm:p-6 space-y-8">

                  {/* --- Section: Schedule Details --- */}
                  <div className="space-y-6 border-b border-gray-200 pb-6">
                    <h2 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                        <ClipboardDocumentListIcon className="h-6 w-6 mr-2 text-indigo-600" /> Schedule Details
                    </h2>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      {/* Schedule Name */}
                      <div className="sm:col-span-6">
                        <label htmlFor="scheduleName" className="block text-sm font-medium leading-6 text-gray-900">
                          Schedule Name <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-2">
                          <Field
                            type="text"
                            name="scheduleName"
                            id="scheduleName"
                            placeholder="e.g., Phase 1 - Foundation Pour"
                            className={getInputClasses(errors.scheduleName && touched.scheduleName)}
                            aria-invalid={errors.scheduleName && touched.scheduleName ? "true" : "false"}
                          />
                          <ErrorMessage name="scheduleName" component="p" className="mt-2 text-sm text-red-600" />
                        </div>
                      </div>

                      {/* Schedule Description */}
                      <div className="sm:col-span-6">
                        <label htmlFor="scheduleDescription" className="block text-sm font-medium leading-6 text-gray-900">
                          Description <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-2">
                          <Field
                            as="textarea"
                            name="scheduleDescription"
                            id="scheduleDescription"
                            rows={3}
                            placeholder="Detailed description of the schedule item and its goals..."
                            className={getInputClasses(errors.scheduleDescription && touched.scheduleDescription)}
                            aria-invalid={errors.scheduleDescription && touched.scheduleDescription ? "true" : "false"}
                          />
                          <ErrorMessage name="scheduleDescription" component="p" className="mt-2 text-sm text-red-600" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* --- Section: Linkage & Assignment --- */}
                  <div className="space-y-6 border-b border-gray-200 pb-6">
                     <h2 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                         <BuildingOffice2Icon className="h-6 w-6 mr-2 text-indigo-600" /> Linkage & Assignment
                     </h2>
                     <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        {/* Project Dropdown */}
                        <div className="sm:col-span-6">
                            <label htmlFor="project" className="block text-sm font-medium leading-6 text-gray-900">
                            Project <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-2">
                            <Field
                                as="select"
                                name="project"
                                id="project"
                                className={getInputClasses(errors.project && touched.project, isLoadingProjects || isFetchingProjects)}
                                disabled={isLoadingProjects || isFetchingProjects}
                                onChange={(e) => {
                                const projectId = e.target.value;
                                setFieldValue("project", projectId); // Update Formik state
                                setSelectedProject(projectId);     // Update local state to trigger task fetch
                                // Reset dependent fields
                                setFieldValue("task", "");
                                setFieldValue("assignedTo", "");
                                setAssignedUserName("");
                                }}
                                aria-invalid={errors.project && touched.project ? "true" : "false"}
                            >
                                <option value="">
                                {isLoadingProjects || isFetchingProjects ? "Loading projects..." : "Select a project"}
                                </option>
                                {projectsData.map((project) => (
                                <option key={project._id} value={project._id}>
                                    {project.projectName}
                                </option>
                                ))}
                            </Field>
                            {/* Loading/Error/Empty States */}
                            {(isLoadingProjects || isFetchingProjects) && <p className="mt-1 text-xs text-gray-500">Loading available projects...</p>}
                            {/* Project Error is handled globally */}
                            {!isLoadingProjects && !isFetchingProjects && projectsData.length === 0 && !projectsError && (
                                <p className="mt-2 text-sm text-yellow-700 flex items-center">
                                    <InformationCircleIcon className="h-4 w-4 mr-1 shrink-0" />
                                    No projects available. You may need to create one first.
                                </p>
                            )}
                            <ErrorMessage name="project" component="p" className="mt-2 text-sm text-red-600" />
                            </div>
                        </div>

                        {/* Task Dropdown */}
                        <div className="sm:col-span-6">
                            <label htmlFor="task" className="block text-sm font-medium leading-6 text-gray-900">
                            Task <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-2">
                                <Field
                                    as="select"
                                    name="task"
                                    id="task"
                                    className={getInputClasses(errors.task && touched.task, !projectSelected || isLoadingTasks || isFetchingTasks || (projectSelected && tasksData.length === 0 && !tasksError))}
                                    disabled={!projectSelected || isLoadingTasks || isFetchingTasks || (projectSelected && tasksData.length === 0 && !tasksError)} // Disable if no project, loading, fetching, or no tasks found (and no error)
                                    onChange={(e) => {
                                        const taskId = e.target.value;
                                        setFieldValue("task", taskId);

                                        // *** FIX: Find task in tasksData (which is now the array) ***
                                        const selectedTask = tasksData.find(task => task._id === taskId);

                                        if (selectedTask && selectedTask.assignedTo?.length > 0) {
                                            // Assumption: Take the FIRST assigned user from the task for this schedule
                                            const user = selectedTask.assignedTo[0];
                                            if (user && user._id) {
                                                setFieldValue("assignedTo", user._id); // Set hidden ID field
                                                // Construct display name
                                                const name = user.firstName && user.lastName
                                                                ? `${user.firstName} ${user.lastName}`
                                                                : user.username || "Assigned User";
                                                setAssignedUserName(name);
                                            } else {
                                                 // Handle case where first assignee object is incomplete
                                                 setFieldValue("assignedTo", "");
                                                 setAssignedUserName("Error: Incomplete user data");
                                                 toast.warn("Selected task's primary assignee data is incomplete.");
                                            }
                                        } else {
                                            // No task found or task has no assignees
                                            setFieldValue("assignedTo", "");
                                            setAssignedUserName(taskId ? "Task has no assigned user" : ""); // Show message only if a task was selected
                                            if (taskId) {
                                                 toast.error("The selected task must have at least one assigned user to create a schedule.");
                                            }
                                        }
                                    }}
                                    aria-invalid={errors.task && touched.task ? "true" : "false"}
                                >
                                    <option value="">
                                        {!projectSelected ? "Select a project first" :
                                        (isLoadingTasks || isFetchingTasks) ? "Loading tasks..." :
                                        tasksData.length === 0 ? (tasksError ? "Error loading tasks" : "No tasks found for project") :
                                        "Select a task"}
                                    </option>
                                    {/* *** FIX: Map over tasksData (which is now the array) *** */}
                                    {tasksData.map((task) => (
                                        <option key={task._id} value={task._id}>
                                        {task.taskName}
                                        </option>
                                    ))}
                                </Field>
                                {/* Loading/Error/Empty States */}
                                {(isLoadingTasks || isFetchingTasks) && projectSelected && <p className="mt-1 text-xs text-gray-500">Loading tasks for selected project...</p>}
                                {tasksError && projectSelected && (
                                    <p className="mt-2 text-sm text-red-700 flex items-center">
                                         <ExclamationTriangleIcon className="h-4 w-4 mr-1 shrink-0" />
                                         Error loading tasks: {tasksError.message}
                                    </p>
                                )}
                                {!isLoadingTasks && !isFetchingTasks && tasksData.length === 0 && projectSelected && !tasksError && (
                                    <div className="mt-2 text-sm text-yellow-700 flex items-center gap-2">
                                        <InformationCircleIcon className="h-4 w-4 shrink-0" />
                                        <span>No tasks found for this project.</span>
                                        <button
                                            type="button"
                                            onClick={() => navigate("/admin/tasks/create", { state: { projectId: selectedProject } })} // Pass project ID
                                            className="underline text-indigo-600 hover:text-indigo-800 text-xs"
                                            title="Create a new task for this project"
                                        >
                                            Create Task?
                                        </button>
                                    </div>
                                )}
                                <ErrorMessage name="task" component="p" className="mt-2 text-sm text-red-600" />
                                {/* Show validation error for assignedTo only if task is selected but has no user */}
                                {errors.assignedTo && touched.task && values.task && (
                                     <p className="mt-2 text-sm text-red-600">{errors.assignedTo}</p>
                                )}
                            </div>
                        </div>

                        {/* Hidden Assigned To Field (stores the ID) */}
                        <Field type="hidden" name="assignedTo" />

                        {/* Display Assigned To (Read-Only) */}
                        <div className="sm:col-span-6">
                            <label htmlFor="assignedUserDisplay" className="block text-sm font-medium leading-6 text-gray-900">
                            Assigned To (from Task)
                            </label>
                            <div className="mt-2">
                            <input
                                type="text"
                                id="assignedUserDisplay"
                                value={assignedUserName || (taskSelected ? "Task has no assigned user" : "Select task to see assignee")}
                                readOnly
                                placeholder="User assigned to the selected task"
                                // Use getInputClasses for styling, including disabled state
                                className={getInputClasses(false, true)} // Always disabled appearance
                                aria-live="polite" // Announce changes to screen readers
                            />
                            </div>
                        </div>
                     </div>
                  </div>

                  {/* --- Section: Timeline & Status --- */}
                   <div className="space-y-6">
                        <h2 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                            <CalendarDaysIcon className="h-6 w-6 mr-2 text-indigo-600" /> Timeline & Status
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
                                <ErrorMessage name="startDate" component="p" className="mt-2 text-sm text-red-600" />
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
                                <ErrorMessage name="endDate" component="p" className="mt-2 text-sm text-red-600" />
                                </div>
                            </div>

                            {/* Status Dropdown */}
                            <div className="sm:col-span-3">
                                <label htmlFor="status" className="block text-sm font-medium leading-6 text-gray-900">Status <span className="text-red-500">*</span></label>
                                <div className="mt-2">
                                <Field as="select" name="status" id="status" className={getInputClasses(errors.status && touched.status)} aria-invalid={errors.status && touched.status ? "true" : "false"}>
                                    <option value="planned">Planned</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="delayed">Delayed</option>
                                </Field>
                                <ErrorMessage name="status" component="p" className="mt-2 text-sm text-red-600" />
                                </div>
                            </div>

                            {/* Priority Dropdown */}
                            <div className="sm:col-span-3">
                                <label htmlFor="priority" className="block text-sm font-medium leading-6 text-gray-900">Priority <span className="text-red-500">*</span></label>
                                <div className="mt-2">
                                <Field as="select" name="priority" id="priority" className={getInputClasses(errors.priority && touched.priority)} aria-invalid={errors.priority && touched.priority ? "true" : "false"}>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </Field>
                                <ErrorMessage name="priority" component="p" className="mt-2 text-sm text-red-600" />
                                </div>
                            </div>
                        </div>
                   </div>

                </div> {/* End Form Content Area */}

                {/* Submit/Cancel Buttons */}
                <div className="flex items-center justify-end gap-x-4 border-t border-gray-900/10 px-4 py-4 sm:px-6 bg-gray-50 rounded-b-lg">
                  <button
                    type="button"
                    onClick={() => navigate("/admin/schedules")}
                    className={getButtonClasses("secondary", isSubmitting)} // Disable cancel during submit?
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={disableSubmit} // Use the calculated disabled state
                    className={getButtonClasses("primary", disableSubmit)}
                    aria-disabled={disableSubmit}
                  >
                    {isSubmitting ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" aria-hidden="true" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <PlusCircleIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                        Create Schedule
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

export default CreateSchedule;
