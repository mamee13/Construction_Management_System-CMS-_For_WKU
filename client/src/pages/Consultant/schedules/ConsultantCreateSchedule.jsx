
/* eslint-disable */
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
// Removed usersAPI import
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import {
    ArrowPathIcon,
    CalendarIcon,
    ExclamationTriangleIcon, // For errors
    UserGroupIcon, // For assignees hint
    ArrowLeftIcon // For back button
} from "@heroicons/react/24/outline";
import schedulesAPI from "../../../api/schedules";
import projectsAPI from "../../../api/projects"; // Keep this
import tasksAPI from "../../../api/tasks";
// Removed usersAPI import
import authAPI from "../../../api/auth";

const ConsultantCreateSchedule = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const currentUser = authAPI.getCurrentUser();

    // State to track the ID selected in the Project dropdown
    const [selectedProjectId, setSelectedProjectId] = useState(""); // Initialize as empty string

    // --- Fetch INITIAL projects list (based on role) ---
    const {
        data: projectsQueryData, // Renamed for clarity { success, data: [...] } or { success, data: { projects: [...] } }
        isLoading: isLoadingProjects,
        error: projectsError,
        isError: isProjectsError,
    } = useQuery({
        queryKey: ["projectsForSchedule", currentUser?.role], // Adjusted queryKey slightly
        queryFn: () => {
            // Logic based on role is good
            if (currentUser?.role === "consultant") {
                console.log("Fetching assigned projects for consultant schedule");
                // Assuming this returns { success, data: { projects: [...] } }
                return projectsAPI.getMyAssignedProjects();
            }
            console.log("Fetching all projects for admin schedule");
            // Assuming this returns { success, data: [...] }
            return projectsAPI.getAllProjects();
        },
        enabled: !!currentUser, // Only run query if currentUser is loaded
        staleTime: 5 * 60 * 1000,
    });

    // Normalize projects response (same as before)
    const rawProjectsList = useMemo(() =>
        projectsQueryData?.success
            ? Array.isArray(projectsQueryData.data)
                ? projectsQueryData.data // Admin: data is the array
                : projectsQueryData.data?.projects || [] // Consultant: data.projects is the array
            : [],
        [projectsQueryData]
    );

    // Filter the raw list to exclude certain statuses (same as before)
    const excludedStatuses = ['cancelled', 'on_hold', 'completed'];
    const activeProjectsList = useMemo(() =>
        rawProjectsList.filter(
            project => project && project.status && !excludedStatuses.includes(project.status?.toLowerCase())
        ),
        [rawProjectsList]
    );

    // --- Fetch *SELECTED* Project Details (for Assignees and potentially other info) ---
    // This query runs ONLY when selectedProjectId has a value
    const {
        data: selectedProjectQueryData, // { success, data: projectDetails }
        isLoading: isLoadingSelectedProject,
        error: selectedProjectError,
        isError: isSelectedProjectError,
        isFetching: isFetchingSelectedProject, // Use for loading indicator on assignees
    } = useQuery({
        queryKey: ["projectDetailsForSchedule", selectedProjectId], // Unique key including ID
        queryFn: async () => {
            if (!selectedProjectId) return null; // Should not run if disabled, but safeguard
            console.log(`Fetching details for project ID [Schedule]: ${selectedProjectId}`);
            const response = await projectsAPI.getProjectById(selectedProjectId);
            console.log("Detailed project response [Schedule]:", response);
            // Check response structure
            if (!response || !response.success || !response.data) {
              throw new Error(response?.message || "Failed to fetch project details or data missing.");
            }
            return response.data; // Return the actual project object
        },
        // Enable only when a valid project ID is selected
        enabled: !!selectedProjectId,
        staleTime: 2 * 60 * 1000, // Cache selected project details for 2 minutes
        refetchOnWindowFocus: false, // Optional: prevent refetch on window focus
    });
    // The actual detailed project object, might be undefined while loading/error
    const selectedProjectDetails = selectedProjectQueryData;


    // --- Fetch all tasks initially (for Task dropdown) - same as before ---
    const {
        data: tasksResponse,
        isLoading: isLoadingTasks,
        error: tasksError,
    } = useQuery({
        queryKey: ["tasksForSchedule"], // Slightly adjusted key
        queryFn: () => tasksAPI.getTasks(),
        staleTime: 5 * 60 * 1000,
    });
    const allTasksList = useMemo(() =>
        tasksResponse?.success ? tasksResponse.data : [],
        [tasksResponse]
    );


    // --- Derive Assignee Options from *Selected* Project Details (ADAPTED FROM TASK COMPONENT) ---
    // Use useMemo to recalculate only when selectedProjectDetails changes
    const assigneeOptions = useMemo(() => {
        if (!selectedProjectDetails) {
            return []; // Return empty array if no details loaded yet
        }

        const potentialAssignees = new Map();

        // *** IMPORTANT: Verify these field names (contractor, consultant, projectManager)
        //     match EXACTLY what projectsAPI.getProjectById returns in its 'data' object ***
        const addAssignee = (user, roleLabel) => {
            // Add only if user exists and has an _id
            if (user?._id) {
                 // Check if user is already added to prevent duplicates if they somehow hold multiple roles listed here
                 if (!potentialAssignees.has(user._id)) {
                     potentialAssignees.set(user._id, {
                         _id: user._id,
                         // Ensure names exist, provide fallback
                         name: `${user.firstName || 'N/A'} ${user.lastName || ''}`.trim(),
                         roleLabel: roleLabel // Add role for clarity in dropdown
                     });
                 }
            }
        };

        console.log("Building assignees from details:", selectedProjectDetails);
        addAssignee(selectedProjectDetails.contractor, 'Contractor');
        addAssignee(selectedProjectDetails.consultant, 'Consultant');
        addAssignee(selectedProjectDetails.projectManager, 'Project Manager');
        // Add other relevant roles/users from your project schema if needed
        // Example: if there's a teamMembers array:
        // if (Array.isArray(selectedProjectDetails.teamMembers)) {
        //    selectedProjectDetails.teamMembers.forEach(member => addAssignee(member, 'Team Member'));
        // }

        console.log("Derived Assignee Options:", Array.from(potentialAssignees.values()));
        return Array.from(potentialAssignees.values()); // Convert Map values back to an array

    }, [selectedProjectDetails]); // Dependency: recalculate when details change


    // Create schedule mutation (same as before)
    const createScheduleMutation = useMutation({
        mutationFn: schedulesAPI.createSchedule,
        onSuccess: (data) => {
            toast.success(data?.message || "Schedule created successfully");
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            queryClient.invalidateQueries({ queryKey: ['projectDetailsForSchedule', selectedProjectId] }); // Invalidate details if needed
            queryClient.invalidateQueries({ queryKey: ["projectsForSchedule", currentUser?.role] }); // Invalidate project list
            navigate("/consultant/schedules");
        },
        onError: (error) => {
            const errorMsg = error.response?.data?.message || error.message || "Failed to create schedule";
            toast.error(errorMsg);
        },
    });


    // Validation Schema (adjust assignedTo for single select)
    const createValidationSchema = (tasksList = []) => Yup.object({
        scheduleName: Yup.string().required("Schedule name is required").max(100),
        scheduleDescription: Yup.string().required("Description is required").max(500),
        project: Yup.string().required("Project selection is required"),
        task: Yup.string().required("Task selection is required"),
        // assignedTo is now a single string ID
        assignedTo: Yup.string().required("Assigning a user is required"),
        startDate: Yup.date().required("Start date is required").typeError("Invalid date")
            .test( /* ... date validation logic vs task dates (same as before) ... */
                'is-after-task-start',
                'Schedule start date cannot be before the task start date',
                function (value) {
                    const { task: taskId } = this.parent;
                    if (!taskId || !value) return true;
                    const selectedTask = tasksList.find(t => t._id === taskId);
                    if (!selectedTask || !selectedTask.startDate) return true;
                    return new Date(value) >= new Date(selectedTask.startDate);
                }
            ),
        endDate: Yup.date().required("End date is required").typeError("Invalid date")
            .min(Yup.ref("startDate"), "End date cannot be before start date")
            .test( /* ... date validation logic vs task dates (same as before) ... */
                'is-before-task-end',
                'Schedule end date cannot be after the task end date',
                function (value) {
                    const { task: taskId } = this.parent;
                    if (!taskId || !value) return true;
                    const selectedTask = tasksList.find(t => t._id === taskId);
                    if (!selectedTask || !selectedTask.endDate) return true;
                    return new Date(value) <= new Date(selectedTask.endDate);
                }
            ),
        status: Yup.string().required("Status is required").oneOf(["planned", "in_progress", "completed", "delayed"]),
        priority: Yup.string().required("Priority is required").oneOf(["low", "medium", "high"]),
    });

    // Initial form values
    const initialValues = {
        scheduleName: "",
        scheduleDescription: "",
        startDate: "",
        endDate: "",
        project: "",
        task: "",
        assignedTo: "", // Single string ID
        status: "planned",
        priority: "medium",
    };

    // Handle form submission (formatting dates is the main part)
    const handleSubmit = (values, { setSubmitting }) => {
        const formattedValues = {
            ...values,
            startDate: new Date(values.startDate).toISOString(),
            endDate: new Date(values.endDate).toISOString(),
        };
        console.log("Submitting schedule data:", formattedValues);
        createScheduleMutation.mutate(formattedValues, {
            onSettled: () => setSubmitting(false)
        });
    };

    // Auth check effect (same as before)
    useEffect(() => {
        if (!authAPI.isAuthenticated()) {
            toast.error("Please login to continue.");
            navigate("/login");
            return;
        }
        // Allow both consultant and admin (adjust if needed)
        if (currentUser && currentUser.role !== "consultant" && currentUser.role !== "admin") {
            toast.warn("You do not have permission to create schedules.");
            navigate("/dashboard");
        }
    }, [currentUser, navigate]);


    // --- RENDER LOGIC ---

    // Loading/Error states for initial data
     if (isLoadingProjects) {
         return <div className="p-6 text-center">Loading project data... <ArrowPathIcon className="inline w-5 h-5 ml-2 animate-spin"/></div>;
     }

     if (isProjectsError) {
        return (
          <div className="py-10 px-4 text-center max-w-lg mx-auto bg-white shadow rounded-lg border border-red-200">
           <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-red-400" />
           <h2 className="mt-2 text-xl font-semibold text-red-700">Error Loading Projects</h2>
           <p className="mt-1 text-sm text-red-600 mb-4">Could not load necessary project data.</p>
           <p className="text-xs text-red-500">Details: {projectsError?.message}</p>
           <button
             type="button"
             onClick={() => navigate(-1)}
             className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
           >
             <ArrowLeftIcon className="h-4 w-4 mr-2" /> Go Back
           </button>
          </div>
        );
    }

    return (
        <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">Create New Schedule</h1>
                    <p className="text-gray-500 text-sm">Add a new schedule entry associated with a project task.</p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate("/consultant/schedules")}
                    className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    disabled={createScheduleMutation.isPending}
                >
                   <ArrowLeftIcon className="h-5 w-5 mr-2"/> Back to Schedules
                </button>
            </div>

            {/* Form Section */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                    <Formik
                        initialValues={initialValues}
                        // Pass tasks list to validation schema creator
                        validationSchema={createValidationSchema(allTasksList)}
                        onSubmit={handleSubmit}
                        validateOnChange={false}
                        validateOnBlur={true}
                        enableReinitialize // Important if initialValues could change
                    >
                        {({ errors, touched, values, setFieldValue, isSubmitting }) => {

                            // Effect to update selectedProjectId when Formik's project value changes
                            // Also resets dependent fields (task, assignedTo)
                            useEffect(() => {
                                // Check if the value actually changed to avoid infinite loops
                                if (values.project !== selectedProjectId) {
                                    setSelectedProjectId(values.project || ""); // Update state for detail query
                                    setFieldValue('task', ''); // Reset task
                                    setFieldValue('assignedTo', ''); // Reset assignee
                                    console.log("Project changed, set selectedProjectId:", values.project || "");
                                }
                            }, [values.project, selectedProjectId, setFieldValue]); // Dependencies

                            // Find selected task details for date hints (same as before)
                            const selectedTaskDetails = useMemo(() => {
                                if (!values.task || !allTasksList) return null;
                                return allTasksList.find(t => t._id === values.task);
                            }, [values.task, allTasksList]);

                            // Determine if Assignees dropdown should be disabled
                            const assigneesDisabled = !values.project || isFetchingSelectedProject || (!!values.project && !isLoadingSelectedProject && assigneeOptions.length === 0);

                            return (
                                <Form className="space-y-6">
                                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                                        {/* Schedule Name, Description (Unchanged) */}
                                        <div className="sm:col-span-2">
                                             <label htmlFor="scheduleName" className="block text-sm font-medium text-gray-700">Schedule Name <span className="text-red-500">*</span></label>
                                             <Field type="text" name="scheduleName" id="scheduleName" placeholder="E.g., Foundation Pouring - Phase 1" className={`mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.scheduleName && touched.scheduleName ? "border-red-500" : ""}`} disabled={isSubmitting} />
                                             <ErrorMessage name="scheduleName" component="p" className="mt-1 text-xs text-red-600" />
                                         </div>
                                         <div className="sm:col-span-2">
                                             <label htmlFor="scheduleDescription" className="block text-sm font-medium text-gray-700">Description <span className="text-red-500">*</span></label>
                                             <Field as="textarea" name="scheduleDescription" id="scheduleDescription" rows={3} placeholder="Details about this schedule entry..." className={`mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.scheduleDescription && touched.scheduleDescription ? "border-red-500" : ""}`} disabled={isSubmitting} />
                                             <ErrorMessage name="scheduleDescription" component="p" className="mt-1 text-xs text-red-600" />
                                         </div>

                                        {/* Project Dropdown (Use activeProjectsList) */}
                                        <div className="sm:col-span-2">
                                             <label htmlFor="project" className="block text-sm font-medium text-gray-700">Project <span className="text-red-500">*</span></label>
                                             <Field
                                                 as="select"
                                                 name="project"
                                                 id="project"
                                                 className={`mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.project && touched.project ? "border-red-500" : ""}`}
                                                 disabled={isSubmitting || isLoadingProjects /* Keep disabled while loading initial list */}
                                                 // onChange is implicitly handled by Formik, triggers useEffect above
                                             >
                                                 <option value="">-- Select Project --</option>
                                                 {/* Use the FILTERED activeProjectsList */}
                                                 {activeProjectsList.map((project) => (
                                                     <option key={project._id} value={project._id}>
                                                         {project.projectName}
                                                     </option>
                                                 ))}
                                             </Field>
                                             <ErrorMessage name="project" component="p" className="mt-1 text-xs text-red-600" />
                                              {/* Inform user if no active projects available */}
                                              {!isLoadingProjects && rawProjectsList.length > 0 && activeProjectsList.length === 0 && (
                                                  <p className="mt-1 text-xs text-yellow-600">No active projects available for schedule creation.</p>
                                              )}
                                         </div>

                                        {/* Task Dropdown (Depends on selected Project) */}
                                        <div className="sm:col-span-2">
                                            <label htmlFor="task" className="block text-sm font-medium text-gray-700">Task <span className="text-red-500">*</span></label>
                                            <Field
                                                as="select"
                                                name="task"
                                                id="task"
                                                className={`mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.task && touched.task ? "border-red-500" : ""}`}
                                                disabled={isLoadingTasks || !values.project || isSubmitting} // Disable if tasks loading, no project selected, or submitting
                                            >
                                                <option value="">
                                                    {!values.project ? "Select a project first" :
                                                    isLoadingTasks ? "Loading tasks..." :
                                                    "-- Select Task --"}
                                                </option>
                                                {!isLoadingTasks && values.project && allTasksList
                                                    ?.filter((task) => task.project?._id === values.project) // Filter tasks by selected project
                                                    .map((task) => (
                                                        <option key={task._id} value={task._id}>
                                                            {task.taskName} {/* Display task name */}
                                                        </option>
                                                    ))
                                                }
                                            </Field>
                                            {tasksError && ( <p className="mt-1 text-xs text-red-600">Error loading tasks: {tasksError.message}</p> )}
                                            {!isLoadingTasks && values.project && allTasksList?.filter(t => t.project?._id === values.project).length === 0 && (
                                                <p className="mt-1 text-xs text-yellow-600">No tasks found for the selected project.</p>
                                            )}
                                            {/* Hint for task dates */}
                                            {selectedTaskDetails && (selectedTaskDetails.startDate || selectedTaskDetails.endDate) && (
                                                <p className="mt-1 text-xs text-gray-500">Task Dates: {selectedTaskDetails.startDate ? new Date(selectedTaskDetails.startDate).toLocaleDateString() : 'N/A'} - {selectedTaskDetails.endDate ? new Date(selectedTaskDetails.endDate).toLocaleDateString() : 'N/A'}</p>
                                            )}
                                            <ErrorMessage name="task" component="p" className="mt-1 text-xs text-red-600" />
                                        </div>


                                        {/* Start Date / End Date (Unchanged logic, depend on task selection) */}
                                        <div>
                                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date <span className="text-red-500">*</span> {selectedTaskDetails?.startDate && `(Task starts: ${new Date(selectedTaskDetails.startDate).toLocaleDateString()})`}</label>
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><CalendarIcon className="h-5 w-5 text-gray-400" /></div>
                                                <Field type="date" name="startDate" id="startDate" className={`pl-10 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.startDate && touched.startDate ? "border-red-500" : ""}`} disabled={isSubmitting || !values.task}/>
                                            </div>
                                            <ErrorMessage name="startDate" component="p" className="mt-1 text-xs text-red-600" />
                                        </div>
                                        <div>
                                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date <span className="text-red-500">*</span> {selectedTaskDetails?.endDate && `(Task ends: ${new Date(selectedTaskDetails.endDate).toLocaleDateString()})`}</label>
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><CalendarIcon className="h-5 w-5 text-gray-400" /></div>
                                                <Field type="date" name="endDate" id="endDate" className={`pl-10 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.endDate && touched.endDate ? "border-red-500" : ""}`} disabled={isSubmitting || !values.task}/>
                                            </div>
                                            <ErrorMessage name="endDate" component="p" className="mt-1 text-xs text-red-600" />
                                        </div>


                                        {/* Assigned To Dropdown (Uses derived assigneeOptions) */}
                                        <div>
                                            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
                                                Assigned To <span className="text-red-500">*</span>
                                            </label>
                                            <Field
                                                as="select"
                                                name="assignedTo"
                                                id="assignedTo"
                                                className={`mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.assignedTo && touched.assignedTo ? "border-red-500" : ""} ${assigneesDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                disabled={assigneesDisabled || isSubmitting}
                                            >
                                                <option value="">
                                                    {!values.project ? "Select a project first" :
                                                    isFetchingSelectedProject ? "Loading project members..." :
                                                    assigneeOptions.length === 0 ? "-- No assignable users --" :
                                                    "-- Select User --"}
                                                </option>
                                                {/* Populate options based on derived list */}
                                                {assigneeOptions.map((user) => (
                                                    <option key={user._id} value={user._id}>
                                                        {user.name} ({user.roleLabel})
                                                    </option>
                                                ))}
                                            </Field>
                                            {/* Loading/Error messages specific to assignees */}
                                            {values.project && isFetchingSelectedProject && (
                                                 <p className="mt-1 text-xs text-gray-500 flex items-center"><ArrowPathIcon className="w-3 h-3 mr-1 animate-spin"/> Loading members...</p>
                                             )}
                                            {values.project && !isFetchingSelectedProject && isSelectedProjectError && (
                                                 <p className="mt-1 text-xs text-red-600">Error loading members: {selectedProjectError?.message}</p>
                                             )}
                                            {values.project && !isFetchingSelectedProject && !isSelectedProjectError && assigneeOptions.length === 0 && (
                                                 <p className="mt-1 text-xs text-yellow-600">No contractor, consultant, or PM found for this project.</p>
                                             )}
                                            <ErrorMessage name="assignedTo" component="p" className="mt-1 text-xs text-red-600" />
                                        </div>


                                        {/* Status Dropdown (Unchanged) */}
                                        <div>
                                             <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status <span className="text-red-500">*</span></label>
                                             <Field as="select" name="status" id="status" className={`mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.status && touched.status ? "border-red-500" : ""}`} disabled={isSubmitting}>
                                                 <option value="planned">Planned</option>
                                                 <option value="in_progress">In Progress</option>
                                                 <option value="completed">Completed</option>
                                                 <option value="delayed">Delayed</option>
                                             </Field>
                                             <ErrorMessage name="status" component="p" className="mt-1 text-xs text-red-600" />
                                         </div>


                                        {/* Priority Dropdown (Make it span 2 for better layout like Task form?) */}
                                        <div className="sm:col-span-2">
                                            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority <span className="text-red-500">*</span></label>
                                            <Field as="select" name="priority" id="priority" className={`mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.priority && touched.priority ? "border-red-500" : ""}`} disabled={isSubmitting}>
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                            </Field>
                                            <ErrorMessage name="priority" component="p" className="mt-1 text-xs text-red-600" />
                                        </div>

                                    </div> {/* End Grid */}

                                    {/* Submit/Cancel Buttons */}
                                    <div className="pt-5 border-t border-gray-200">
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => navigate("/consultant/schedules")}
                                                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                                disabled={createScheduleMutation.isPending || isSubmitting}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                // Disable if submitting OR if assignees are disabled (project not ready/no users)
                                                disabled={createScheduleMutation.isPending || isSubmitting || assigneesDisabled}
                                                className={`ml-3 inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                                                  (createScheduleMutation.isPending || isSubmitting || assigneesDisabled)
                                                    ? 'bg-indigo-300 cursor-not-allowed'
                                                    : 'bg-indigo-600 hover:bg-indigo-700'
                                                }`}
                                            >
                                                {createScheduleMutation.isPending || isSubmitting ? (
                                                    <><ArrowPathIcon className="h-5 w-5 mr-2 animate-spin"/> Creating...</>
                                                ) : (
                                                    "Create Schedule"
                                                )}
                                            </button>
                                        </div>
                                        {/* Optional: Global mutation error display */}
                                        {createScheduleMutation.isError && (
                                            <p className="mt-2 text-sm text-red-600 text-right">
                                                Schedule creation failed. Please check inputs and try again.
                                            </p>
                                        )}
                                    </div>
                                </Form>
                            );
                        }}
                    </Formik>
                </div>
            </div>
        </div>
    );
};

export default ConsultantCreateSchedule;