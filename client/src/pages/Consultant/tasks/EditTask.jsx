



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
  UserCircleIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  InformationCircleIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import tasksAPI from "../../../api/tasks";
import projectsAPI from "../../../api/projects";
import authAPI from "../../../api/auth";

// --- Auth Hook ---
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);
  return { user, isLoading: loading };
};

// Helper to format date for YYYY-MM-DD input type
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error("Error formatting date for input:", e);
    return '';
  }
};

const EditTaskConsultant = () => {
  const { id: taskId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser, isLoading: isLoadingAuth } = useAuth();

  const [pageStatus, setPageStatus] = useState('loading'); // 'loading', 'authorized', 'unauthorized', 'error'
  const [canFullyEdit, setCanFullyEdit] = useState(false);

  // --- Step 1: Fetch Task Details ---
  const {
    data: taskQueryData,
    isLoading: isLoadingTask,
    error: taskError,
    isError: isTaskError,
    isSuccess: isTaskSuccess,
  } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => tasksAPI.getTaskById(taskId),
    enabled: !!taskId && !isLoadingAuth && !!currentUser && currentUser.role === 'consultant',
    staleTime: 60000,
    retry: (failureCount, error) => {
       if (error?.response?.status === 401 || error?.response?.status === 403) return false;
       return failureCount < 3;
    },
  });
  const task = taskQueryData?.data;
  const taskProjectId = task?.project?._id;

  // --- Step 2: Fetch Associated Project Details ---
  const {
    data: projectQueryData,
    isLoading: isLoadingProject,
    error: projectError,
    isError: isProjectError,
    isFetching: isFetchingProject,
  } = useQuery({
    queryKey: ["project", taskProjectId],
    queryFn: () => projectsAPI.getProjectById(taskProjectId),
    enabled: isTaskSuccess && !!taskProjectId,
    staleTime: 300000,
  });
  const projectDetails = projectQueryData?.data;

  // --- Step 3: Authorization & Permission Check ---
  useEffect(() => {
    if (isLoadingAuth || isLoadingTask) {
      setPageStatus('loading');
    } else if (!currentUser || currentUser.role !== 'consultant') {
      setPageStatus('unauthorized');
    } else if (isTaskError) {
      setPageStatus('error');
    } else if (isTaskSuccess && task) {
      setPageStatus('authorized');
      setCanFullyEdit(task.createdBy?._id === currentUser?.id);
    } else if (isTaskSuccess && !task) {
      setPageStatus('error');
    }

    if (!isLoadingAuth && (!currentUser || currentUser.role !== 'consultant')) {
      toast.error("Access Denied: Consultant role required.");
      navigate("/dashboard");
    } else if (pageStatus === 'error') {
      if (taskError?.response?.status === 403) {
        toast.error("Access Denied: You don't have permission to view this task.");
      } else if (taskError?.response?.status === 404 || (isTaskSuccess && !task)) {
        toast.error("Task not found.");
      } else if (isProjectError && taskProjectId) {
        console.error(`Error loading project details: ${projectError.message}`);
      } else if (taskError) {
        toast.error(`Error loading task: ${taskError.message || 'Unknown error'}`);
      }
    }
  }, [
    currentUser, isLoadingAuth,
    task, taskProjectId, isTaskSuccess, isTaskError, taskError,
    isLoadingProject, isProjectError, projectError,
    navigate, pageStatus
  ]);

  // --- Derive Assignee Options ---
  let assigneeOptions = [];
  if (projectDetails) {
    const potentialAssignees = new Map();
    if (projectDetails.contractor?._id) {
      potentialAssignees.set(projectDetails.contractor._id, {
        _id: projectDetails.contractor._id,
        name: `${projectDetails.contractor.firstName} ${projectDetails.contractor.lastName}`,
        roleLabel: 'Contractor'
      });
    }
    if (projectDetails.consultant?._id) {
      potentialAssignees.set(projectDetails.consultant._id, {
        _id: projectDetails.consultant._id,
        name: `${projectDetails.consultant.firstName} ${projectDetails.consultant.lastName}`,
        roleLabel: 'Consultant'
      });
    }
    if (projectDetails.projectManager?._id) {
      potentialAssignees.set(projectDetails.projectManager._id, {
        _id: projectDetails.projectManager._id,
        name: `${projectDetails.projectManager.firstName} ${projectDetails.projectManager.lastName}`,
        roleLabel: 'Project Manager'
      });
    }
    assigneeOptions = Array.from(potentialAssignees.values());
  }

  // --- Update Task Mutation ---
  const updateTaskMutation = useMutation({
    mutationFn: (updateData) => tasksAPI.updateTask(taskId, updateData),
    onSuccess: (response) => {
      toast.success(`Task "${response.data.taskName}" updated.`);
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", { project: taskProjectId }] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project", taskProjectId] });
      navigate(`/consultant/tasks`);
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message || "Please try again."}`);
    },
  });

  // --- Validation Schema ---
  const validationSchema = Yup.object({
    taskName: Yup.string().required("Task name is required").max(100),
    taskDescription: Yup.string().required("Description is required").max(500),
    startDate: Yup.date().required("Start date is required").typeError("Invalid date"),
    endDate: Yup.date().required("End date is required").typeError("Invalid date")
      .min(Yup.ref("startDate"), "End date cannot be before start date"),
    assignedTo: Yup.array()
      .of(Yup.string())
      .min(1, "At least one assignee must be selected")
      .required("Assignee selection is required"),
    status: Yup.string().required("Status is required")
      .oneOf(["not_started", "in_progress", "completed", "on_hold"]),
    priority: Yup.string().required("Priority is required")
      .oneOf(["low", "medium", "high"]),
  });

  // --- Prepare Initial Values ---
  const initialValues = {
    taskName: task?.taskName || "",
    projectDisplay: projectDetails?.projectName || task?.project?.projectName || (taskProjectId ? "Loading..." : "N/A"),
    startDate: formatDateForInput(task?.startDate),
    endDate: formatDateForInput(task?.endDate),
    assignedTo: task?.assignedTo?.map(u => u._id) || [],
    taskDescription: task?.taskDescription || "",
    status: task?.status || "not_started",
    priority: task?.priority || "medium",
  };

  // --- Handle Form Submission ---
  const handleSubmit = (values) => {
    if (!canFullyEdit) {
      toast.error("You do not have permission to save changes to this task.");
      return;
    }
    const updatePayload = {
      taskName: values.taskName,
      taskDescription: values.taskDescription,
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
      assignedTo: values.assignedTo,
      status: values.status,
      priority: values.priority,
    };
    updateTaskMutation.mutate(updatePayload);
  };

  // --- Common Styles ---
  const inputClass = (error, touched) =>
    `block w-full border ${
      error && touched ? 'border-red-500' : 'border-gray-300'
    } rounded-md shadow-sm py-2 px-3 sm:text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`;
  const disabledInputClass = "pl-10 bg-gray-100 text-gray-500 cursor-not-allowed";
  const buttonClass = "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2";
  const cancelBtnClass = "bg-gray-500 hover:bg-gray-600 focus:ring-gray-500";
  const saveBtnClass = "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500";

  // --- Render Logic ---
  if (pageStatus === 'loading') {
    return (
      <div className="p-6 text-center">
        <ArrowPathIcon className="h-8 w-8 mx-auto animate-spin text-gray-400"/>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (pageStatus === 'error' || pageStatus === 'unauthorized') {
    return (
      <div className="py-10 px-4 text-center max-w-lg mx-auto bg-white shadow rounded-lg">
        <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-red-400" />
        <h2 className="mt-2 text-xl font-semibold text-red-700">
          {pageStatus === 'unauthorized' ? 'Access Denied' : 'Error'}
        </h2>
        <p className="mt-1 text-sm text-gray-600 mb-4">
          {pageStatus === 'unauthorized'
            ? "You cannot view or edit this task."
            : "Could not load task details."
          }
          {taskError && ` (${taskError.message})`}
        </p>
        <button onClick={() => navigate("/consultant/tasks")} className={`${buttonClass} ${cancelBtnClass}`}>
          <ArrowLeftIcon className="h-5 w-5 mr-2" /> Back to Tasks
        </button>
      </div>
    );
  }

  if (pageStatus === 'authorized' && task) {
    const assigneesDisabled = !canFullyEdit || isFetchingProject || assigneeOptions.length === 0;
    return (
      <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between mb-6 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Edit Task {canFullyEdit ? '' : '(Read-Only View)'}
            </h1>
            <p className="mt-1 text-base text-gray-500">
              Task: <span className="font-medium text-gray-700">{initialValues.taskName}</span>
            </p>
            {!canFullyEdit && (
              <p className="mt-2 inline-flex items-center px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded">
                <InformationCircleIcon className="h-4 w-4 mr-1" />
                Viewing task created by someone else.
              </p>
            )}
          </div>
          <button type="button" onClick={() => navigate(`/consultant/tasks`)} className={`${buttonClass} ${cancelBtnClass}`}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" /> Back to Tasks
          </button>
        </div>

        {isProjectError && taskProjectId && (
          <div className="mb-4 p-4 border-l-4 border-yellow-400 bg-yellow-50 rounded">
            <div className="flex items-center">
              <InformationCircleIcon className="h-6 w-6 text-yellow-500 mr-2" />
              <p className="text-sm text-yellow-700">
                Could not load project details for assignee selection ({projectError.message}). Assignees cannot be changed.
              </p>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ errors, touched, isSubmitting }) => (
              <Form>
                <div className="px-6 py-6 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-6">
                    {/* Task Name */}
                    <div className="sm:col-span-6">
                      <label htmlFor="taskName" className={`block text-sm font-medium ${canFullyEdit ? 'text-gray-700' : 'text-gray-500'}`}>
                        Task Name {canFullyEdit && <span className="text-red-500">*</span>}
                      </label>
                      <div className="mt-1 relative">
                        {!canFullyEdit && (
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LockClosedIcon className="h-5 w-5 text-gray-400"/>
                          </div>
                        )}
                        <Field
                          type="text"
                          name="taskName"
                          id="taskName"
                          disabled={!canFullyEdit}
                          className={`${inputClass(errors.taskName, touched.taskName)} ${!canFullyEdit && disabledInputClass}`}
                        />
                      </div>
                      {canFullyEdit && <ErrorMessage name="taskName" component="p" className="mt-1 text-xs text-red-600" />}
                    </div>

                    {/* Project Display */}
                    <div className="sm:col-span-6">
                      <label htmlFor="projectDisplay" className="block text-sm font-medium text-gray-500">Project</label>
                      <div className="mt-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <BuildingOffice2Icon className="h-5 w-5 text-gray-400"/>
                        </div>
                        <Field
                          type="text"
                          name="projectDisplay"
                          disabled
                          className="pl-10 block w-full border border-gray-300 rounded-md py-2 px-3 bg-gray-100 text-gray-500 sm:text-sm cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Start Date */}
                    <div className="sm:col-span-3">
                      <label htmlFor="startDate" className={`block text-sm font-medium ${canFullyEdit ? 'text-gray-700' : 'text-gray-500'}`}>
                        Start Date {canFullyEdit && <span className="text-red-500">*</span>}
                      </label>
                      <div className="mt-1 relative">
                        {!canFullyEdit && (
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LockClosedIcon className="h-5 w-5 text-gray-400"/>
                          </div>
                        )}
                        <Field
                          type="date"
                          name="startDate"
                          id="startDate"
                          disabled={!canFullyEdit}
                          className={`${inputClass(errors.startDate, touched.startDate)} ${!canFullyEdit && disabledInputClass}`}
                        />
                      </div>
                      {canFullyEdit && <ErrorMessage name="startDate" component="p" className="mt-1 text-xs text-red-600" />}
                    </div>

                    {/* End Date */}
                    <div className="sm:col-span-3">
                      <label htmlFor="endDate" className={`block text-sm font-medium ${canFullyEdit ? 'text-gray-700' : 'text-gray-500'}`}>
                        End Date {canFullyEdit && <span className="text-red-500">*</span>}
                      </label>
                      <div className="mt-1 relative">
                        {!canFullyEdit && (
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LockClosedIcon className="h-5 w-5 text-gray-400"/>
                          </div>
                        )}
                        <Field
                          type="date"
                          name="endDate"
                          id="endDate"
                          disabled={!canFullyEdit}
                          className={`${inputClass(errors.endDate, touched.endDate)} ${!canFullyEdit && disabledInputClass}`}
                        />
                      </div>
                      {canFullyEdit && <ErrorMessage name="endDate" component="p" className="mt-1 text-xs text-red-600" />}
                    </div>

                    {/* Assigned To */}
                    <div className="sm:col-span-6">
                      <label htmlFor="assignedTo" className={`block text-sm font-medium ${canFullyEdit ? 'text-gray-700' : 'text-gray-500'}`}>
                        Assign To {canFullyEdit && <span className="text-red-500">*</span>}
                      </label>
                      <div className="mt-1 relative">
                        {!canFullyEdit && (
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <UserCircleIcon className="h-5 w-5 text-gray-400"/>
                          </div>
                        )}
                        <Field
                          as="select"
                          name="assignedTo"
                          id="assignedTo"
                          multiple
                          disabled={assigneesDisabled}
                          className={`${inputClass(errors.assignedTo, touched.assignedTo)} h-28 ${assigneesDisabled ? "bg-gray-100 cursor-not-allowed" : ""} ${!canFullyEdit ? "pl-10" : ""}`}
                        >
                          {isFetchingProject ? (
                            <option disabled>Loading project members...</option>
                          ) : assigneeOptions.length > 0 ? (
                            assigneeOptions.map((user) => (
                              <option key={user._id} value={user._id}>
                                {user.name} ({user.roleLabel})
                              </option>
                            ))
                          ) : (
                            <option disabled>-- No assignable users in project --</option>
                          )}
                        </Field>
                      </div>
                      {(isFetchingProject && canFullyEdit) && <p className="mt-1 text-xs text-gray-500">Loading assignees...</p>}
                      {(!isFetchingProject && assigneeOptions.length === 0 && canFullyEdit) && <p className="mt-1 text-xs text-yellow-600">No assignable users found for this project.</p>}
                      {canFullyEdit && <ErrorMessage name="assignedTo" component="p" className="mt-1 text-xs text-red-600" />}
                    </div>

                    {/* Description */}
                    <div className="sm:col-span-6">
                      <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <Field
                        as="textarea"
                        name="taskDescription"
                        id="taskDescription"
                        rows={4}
                        className={`${inputClass(errors.taskDescription, touched.taskDescription)}`}
                      />
                      <ErrorMessage name="taskDescription" component="p" className="mt-1 text-xs text-red-600" />
                    </div>

                    {/* Status */}
                    <div className="sm:col-span-3">
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                        Status <span className="text-red-500">*</span>
                      </label>
                      <Field as="select" name="status" id="status" className={inputClass(errors.status, touched.status)}>
                        <option value="not_started">Not Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="on_hold">On Hold</option>
                      </Field>
                      <ErrorMessage name="status" component="p" className="mt-1 text-xs text-red-600" />
                    </div>

                    {/* Priority */}
                    <div className="sm:col-span-3">
                      <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                        Priority <span className="text-red-500">*</span>
                      </label>
                      <Field as="select" name="priority" id="priority" className={inputClass(errors.priority, touched.priority)}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </Field>
                      <ErrorMessage name="priority" component="p" className="mt-1 text-xs text-red-600" />
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-gray-50 text-right sm:px-6">
                  <button
                    type="button"
                    onClick={() => navigate(`/consultant/tasks`)}
                    disabled={updateTaskMutation.isPending || isSubmitting}
                    className={`${buttonClass} ${cancelBtnClass} mr-3`}
                  >
                    <ArrowLeftIcon className="h-5 w-5 mr-2" /> Cancel
                  </button>
                  {canFullyEdit && (
                    <button
                      type="submit"
                      disabled={updateTaskMutation.isPending || isSubmitting}
                      className={`${buttonClass} ${saveBtnClass}`}
                    >
                      {updateTaskMutation.isPending || isSubmitting ? (
                        <>
                          <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-5 w-5 mr-2 -ml-1" /> Save Changes
                        </>
                      )}
                    </button>
                  )}
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    );
  }

  return <div className="p-6 text-center">Unexpected state. Please try again.</div>;
};

export default EditTaskConsultant;
