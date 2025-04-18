

/*eslint-disable */
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Formik, Form, Field, ErrorMessage } from "formik"; // Removed FieldArray
import * as Yup from "yup";
import { toast } from "react-toastify";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  UserGroupIcon, // For assignees/warnings
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import tasksAPI from "../../../api/tasks";
import projectsAPI from "../../../api/projects";
// Removed usersAPI import
import authAPI from "../../../api/auth";

const ConsultantCreateTask = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isConsultant, setIsConsultant] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(""); // Track selected project for fetching details

  const queryParams = new URLSearchParams(location.search);
  const projectIdFromQuery = queryParams.get("projectId");

  // --- Authorization and User Fetch ---
  useEffect(() => {
    const user = authAPI.getCurrentUser();
    setCurrentUser(user);
    if (user) {
      const isUserConsultant = user.role === "consultant";
      setIsConsultant(isUserConsultant);
      if (!isUserConsultant) {
        toast.error("Access Denied: You must be a consultant.");
        navigate("/dashboard");
      } else {
         // If projectId came from query params, set it as the initial selection
         if (projectIdFromQuery) {
             setSelectedProjectId(projectIdFromQuery);
         }
      }
    } else {
      setIsConsultant(false);
      // Optional: Redirect to login?
    }
  }, [navigate, projectIdFromQuery]);


  // --- Fetch Consultant's Projects (for Project Dropdown) ---
  const {
    data: projectsQueryData, // { success, data: { projects: [] } }
    isLoading: isLoadingProjects,
    error: projectsError,
    isError: isProjectsError,
  } = useQuery({
    queryKey: ["consultant-projects", currentUser?._id],
    queryFn: () => projectsAPI.getProjectsByConsultant(currentUser?._id),
    enabled: !!currentUser?._id && isConsultant === true,
    staleTime: 5 * 60 * 1000,
  });
  const consultantProjects = projectsQueryData?.data?.projects || [];

  // --- Filter projects: Exclude on_hold, completed, cancelled ---
  const statusesToExclude = ['on_hold', 'completed', 'cancelled'];
  const activeProjects = consultantProjects.filter(project =>
      project && project.status && !statusesToExclude.includes(project.status)
  );


  // --- Fetch *SELECTED* Project Details (for Assignees) ---
  // This query runs ONLY when selectedProjectId has a value
  const {
      data: selectedProjectQueryData, // { success, data: projectDetails }
      isLoading: isLoadingSelectedProject,
      error: selectedProjectError,
      isError: isSelectedProjectError,
      isFetching: isFetchingSelectedProject, // Use for loading indicator on assignees
  } = useQuery({
      queryKey: ["project", selectedProjectId], // Key includes the dynamic ID
      queryFn: () => projectsAPI.getProjectById(selectedProjectId),
      // Enable only when a valid project ID is selected AND user is a consultant
      enabled: !!selectedProjectId && isConsultant === true,
      staleTime: 2 * 60 * 1000, // Cache selected project details for a shorter time
      refetchOnWindowFocus: false,
  });
  const selectedProjectDetails = selectedProjectQueryData?.data; // The actual project object

  // --- Derive Assignee Options from *Selected* Project ---
  let assigneeOptions = [];
  if (selectedProjectDetails) {
      const potentialAssignees = new Map();
      // Add users based on roles within the *selected* project
      if (selectedProjectDetails.contractor?._id /* && selectedProjectDetails.contractor.isActive */) {
         potentialAssignees.set(selectedProjectDetails.contractor._id, {
             _id: selectedProjectDetails.contractor._id,
             name: `${selectedProjectDetails.contractor.firstName} ${selectedProjectDetails.contractor.lastName}`,
             roleLabel: 'Contractor'
         });
      }
      if (selectedProjectDetails.consultant?._id /* && selectedProjectDetails.consultant.isActive */) {
         potentialAssignees.set(selectedProjectDetails.consultant._id, {
             _id: selectedProjectDetails.consultant._id,
             name: `${selectedProjectDetails.consultant.firstName} ${selectedProjectDetails.consultant.lastName}`,
             roleLabel: 'Consultant'
         });
      }
      if (selectedProjectDetails.projectManager?._id /* && selectedProjectDetails.projectManager.isActive */) {
         potentialAssignees.set(selectedProjectDetails.projectManager._id, {
             _id: selectedProjectDetails.projectManager._id,
             name: `${selectedProjectDetails.projectManager.firstName} ${selectedProjectDetails.projectManager.lastName}`,
             roleLabel: 'Project Manager'
         });
      }
       // Add other roles/team members if applicable to your schema
       // if (Array.isArray(selectedProjectDetails.teamMembers)) { ... }

      assigneeOptions = Array.from(potentialAssignees.values());
  }

  // --- Create Task Mutation ---
  const createTaskMutation = useMutation({
    mutationFn: tasksAPI.createTask,
    onSuccess: (response) => {
      toast.success(`Task "${response.data.taskName}" created successfully!`);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["consultant-tasks", currentUser?._id] });
      queryClient.invalidateQueries({ queryKey: ["project-tasks", response.data.project] });
      queryClient.invalidateQueries({ queryKey: ["project", response.data.project] }); // Invalidate selected project details query too
      queryClient.invalidateQueries({ queryKey: ["consultant-projects", currentUser?._id] });
      navigate("/consultant/tasks");
    },
    onError: (error) => {
      console.error("Task creation failed:", error);
      toast.error(`Error creating task: ${error.message || "Please try again."}`);
    },
  });

  // --- Validation Schema ---
  const validationSchema = Yup.object({
    taskName: Yup.string().required("Task name is required").max(100),
    taskDescription: Yup.string().required("Description is required").max(500),
    startDate: Yup.date().required("Start date is required").typeError("Invalid date"),
    endDate: Yup.date().required("End date is required").typeError("Invalid date")
      .min(Yup.ref("startDate"), "End date cannot be before start date"),
    project: Yup.string().required("Please select a project"), // Project selection is still required
    // Validation for multi-select based on project users
    assignedTo: Yup.array()
      .of(Yup.string())
      .min(1, "At least one assignee from the project must be selected")
      .required("Assignee selection is required"),
    status: Yup.string().required("Status is required").oneOf(["not_started", "in_progress", "completed", "on_hold"]),
    priority: Yup.string().required("Priority is required").oneOf(["low", "medium", "high"]),
  });

  // --- Initial Form Values ---
  const initialValues = {
    taskName: "",
    taskDescription: "",
    startDate: "",
    endDate: "",
    project: projectIdFromQuery || "", // Pre-fill project if ID provided
    assignedTo: [], // Initialize as empty array for multi-select
    status: "not_started",
    priority: "medium",
  };

  // --- Handle Form Submission ---
  const handleSubmit = (values) => {
    // assignedTo will be an array of selected IDs from the multi-select
    // No need to filter empty strings like with FieldArray
    if (!values.assignedTo || values.assignedTo.length === 0) {
        toast.error("Please select at least one assignee.");
        // Could set a Formik error here if needed: setFieldError("assignedTo", "...")
        return;
    }

    const formattedValues = {
      ...values,
      // Dates are formatted just before mutation
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
      // project and assignedTo are already in the correct format from Formik
    };

    console.log("Submitting task data:", formattedValues);
    createTaskMutation.mutate(formattedValues);
  };


  // --- Render Logic ---

  if (isConsultant === null) {
      return <div className="p-6 text-center">Verifying access... <ArrowPathIcon className="inline w-5 h-5 ml-2 animate-spin"/></div>;
  }
  if (isConsultant === false) {
      return null; // Redirecting
  }

  // Main error block for initial data loading
  if (isProjectsError) {
       return (
         <div className="py-10 px-4 text-center max-w-lg mx-auto bg-white shadow rounded-lg">
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-red-400" />
          <h2 className="mt-2 text-xl font-semibold text-red-700">Error Loading Projects</h2>
          <p className="mt-1 text-sm text-red-600 mb-4">Could not load your projects. Please try again later.</p>
          <p className="text-xs text-red-500">Details: {projectsError?.message}</p>
          <button
            type="button"
            onClick={() => navigate(-1)} // Go back
            className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" /> Go Back
          </button>
         </div>
       );
  }


  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6 pb-4 border-b border-gray-200">
         <div>
          <h1 className="text-2xl font-semibold text-gray-900 leading-tight">Create New Task</h1>
          <p className="mt-1 text-sm text-gray-500">As Consultant: Add a task to one of your projects.</p>
        </div>
        <button
            type="button"
            onClick={() => navigate("/consultant/tasks")}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm items-center disabled:opacity-50"
            disabled={createTaskMutation.isPending}
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" /> Cancel
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize // Important: Allows form to reinitialize if initialValues.project changes (due to projectIdFromQuery)
        >
          {/* Get setFieldValue to update assignees when project changes */}
          {({ errors, touched, values, isSubmitting, setFieldValue }) => {

            // Effect to update the selectedProjectId state when Formik's project value changes
            useEffect(() => {
                if (values.project !== selectedProjectId) {
                    setSelectedProjectId(values.project);
                    // IMPORTANT: Reset assignees when project changes
                    setFieldValue('assignedTo', []);
                }
            }, [values.project, selectedProjectId, setFieldValue]);

            // Determine if assignees should be disabled
            const assigneesDisabled = isLoadingProjects || !values.project || isFetchingSelectedProject || (!!values.project && !isLoadingSelectedProject && assigneeOptions.length === 0);

            return (
              <Form>
                <div className="px-4 py-5 sm:p-6 space-y-6">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">

                    {/* Task Name, Description - Unchanged */}
                    <div className="sm:col-span-6"> {/* Task Name */}
                        <label htmlFor="taskName" className="block text-sm font-medium text-gray-700">Task Name <span className="text-red-500">*</span></label>
                        <Field type="text" name="taskName" id="taskName" className={`mt-1 block w-full border ${errors.taskName && touched.taskName ? 'border-red-500':'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`} />
                        <ErrorMessage name="taskName" component="p" className="mt-1 text-xs text-red-600" />
                    </div>
                    <div className="sm:col-span-6"> {/* Description */}
                        <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700">Description <span className="text-red-500">*</span></label>
                        <Field as="textarea" name="taskDescription" id="taskDescription" rows={4} className={`mt-1 block w-full border ${errors.taskDescription && touched.taskDescription ? 'border-red-500':'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`} />
                        <ErrorMessage name="taskDescription" component="p" className="mt-1 text-xs text-red-600" />
                    </div>

                    {/* Project Selection */}
                    <div className="sm:col-span-6">
                      <label htmlFor="project" className="block text-sm font-medium text-gray-700">Project <span className="text-red-500">*</span></label>
                      <Field
                        as="select"
                        name="project"
                        id="project"
                        className={`mt-1 block w-full border ${errors.project && touched.project ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${isLoadingProjects ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        disabled={isLoadingProjects}
                      >
                        <option value="">{isLoadingProjects ? "Loading projects..." : "-- Select Project --"}</option>
                        {/* USE FILTERED activeProjects here */}
                        {activeProjects.map((project) => (
                          <option key={project._id} value={project._id}>
                            {project.projectName}
                          </option>
                        ))}
                      </Field>
                      <ErrorMessage name="project" component="p" className="mt-1 text-xs text-red-600" />
                      {/* Inform user if no active projects available */}
                      {!isLoadingProjects && consultantProjects.length > 0 && activeProjects.length === 0 && (
                          <p className="mt-1 text-xs text-yellow-600">No active projects available for task creation.</p>
                      )}
                    </div>

                    {/* Start Date, End Date - Unchanged */}
                     <div className="sm:col-span-3"> {/* Start Date */}
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date <span className="text-red-500">*</span></label>
                        <Field type="date" name="startDate" id="startDate" className={`mt-1 block w-full border ${errors.startDate && touched.startDate ? 'border-red-500':'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`} />
                        <ErrorMessage name="startDate" component="p" className="mt-1 text-xs text-red-600" />
                    </div>
                     <div className="sm:col-span-3"> {/* End Date */}
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date <span className="text-red-500">*</span></label>
                        <Field type="date" name="endDate" id="endDate" className={`mt-1 block w-full border ${errors.endDate && touched.endDate ? 'border-red-500':'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`} />
                        <ErrorMessage name="endDate" component="p" className="mt-1 text-xs text-red-600" />
                    </div>

                    {/* Assigned To (Multi-Select from Selected Project) */}
                    <div className="sm:col-span-6">
                      <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
                        Assign To <span className="text-red-500">*</span>
                        <span className="text-xs text-gray-500 ml-1">(Select from project members)</span>
                      </label>
                      <Field
                        as="select"
                        name="assignedTo"
                        id="assignedTo"
                        multiple // Enable multi-select
                        className={`mt-1 block w-full border ${errors.assignedTo && touched.assignedTo ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-28 ${assigneesDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        disabled={assigneesDisabled}
                      >
                        {/* No placeholder option needed/wanted for native multi-select */}
                        {/* Populate options only when project selected and details loaded */}
                        {!values.project ? (
                            <option disabled value="">-- Select a project first --</option>
                        ) : isFetchingSelectedProject ? (
                            <option disabled value="">Loading project members...</option>
                        ) : assigneeOptions.length > 0 ? (
                            assigneeOptions.map((user) => (
                                <option key={user._id} value={user._id}>
                                {user.name} ({user.roleLabel})
                                </option>
                            ))
                        ) : (
                            <option disabled value="">-- No assignable users in this project --</option>
                        )}
                      </Field>
                      {/* Loading/Error messages specific to assignees */}
                      {values.project && isFetchingSelectedProject && (
                           <p className="mt-1 text-xs text-gray-500 flex items-center"><ArrowPathIcon className="w-3 h-3 mr-1 animate-spin"/> Loading assignees...</p>
                       )}
                       {values.project && !isFetchingSelectedProject && isSelectedProjectError && (
                           <p className="mt-1 text-xs text-red-600">Error loading assignees: {selectedProjectError?.message}</p>
                       )}
                      {values.project && !isFetchingSelectedProject && !isSelectedProjectError && assigneeOptions.length === 0 && (
                          <p className="mt-1 text-xs text-yellow-600">This project has no users eligible for assignment.</p>
                      )}
                      <ErrorMessage name="assignedTo" component="p" className="mt-1 text-xs text-red-600" />
                    </div>

                     {/* Status, Priority - Unchanged */}
                     <div className="sm:col-span-3"> {/* Status */}
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status <span className="text-red-500">*</span></label>
                        <Field as="select" name="status" id="status" className={`mt-1 block w-full border ${errors.status && touched.status ? 'border-red-500':'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`} >
                           <option value="not_started">Not Started</option>
                           <option value="in_progress">In Progress</option>
                           <option value="completed">Completed</option>
                           <option value="on_hold">On Hold</option>
                         </Field>
                         <ErrorMessage name="status" component="p" className="mt-1 text-xs text-red-600" />
                     </div>
                      <div className="sm:col-span-3"> {/* Priority */}
                         <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority <span className="text-red-500">*</span></label>
                         <Field as="select" name="priority" id="priority" className={`mt-1 block w-full border ${errors.priority && touched.priority ? 'border-red-500':'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`} >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                             <option value="high">High</option>
                         </Field>
                         <ErrorMessage name="priority" component="p" className="mt-1 text-xs text-red-600" />
                     </div>

                  </div> {/* End Grid */}
                </div>

                {/* Footer Actions */}
                <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 rounded-b-lg">
                  <button
                    type="button"
                    onClick={() => navigate("/consultant/tasks")}
                    className="mr-3 inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm disabled:opacity-50"
                    disabled={createTaskMutation.isPending || isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    // Disable if submitting OR if assignees are disabled (meaning project not ready or no users)
                    disabled={createTaskMutation.isPending || isSubmitting || assigneesDisabled}
                    className={`inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      (createTaskMutation.isPending || isSubmitting || assigneesDisabled)
                        ? 'bg-indigo-300 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {createTaskMutation.isPending || isSubmitting ? (
                      <><ArrowPathIcon className="h-5 w-5 mr-2 animate-spin"/> Creating...</>
                    ) : (
                      <><CheckCircleIcon className="h-5 w-5 mr-2 -ml-1"/> Create Task</>
                    )}
                  </button>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    </div>
  );
};

export default ConsultantCreateTask;