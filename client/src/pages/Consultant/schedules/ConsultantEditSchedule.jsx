 /*eslint-disable */



import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { ArrowPathIcon, CalendarIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import schedulesAPI from "../../../APi/schedules";
import projectsAPI from "../../../APi/projects";
import tasksAPI from "../../../APi/tasks";
import userAPI from "../../../APi/users";
import authAPI from "../../../api/auth";

const ConsultantEditSchedule = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentUser = authAPI.getCurrentUser();

  // Fetch schedule details to edit
  const {
    data: schedule,
    isLoading: isLoadingSchedule,
    error: scheduleError,
    isError: isScheduleError,
    refetch: refetchSchedule,
  } = useQuery({
    queryKey: ["schedule", id],
    queryFn: () => schedulesAPI.getScheduleById(id),
    enabled: !!id,
    staleTime: 0,
    cacheTime: 1000 * 60 * 5,
  });

  // --- Fetch data for dropdowns ---

  // Fetch projects
  const {
    data: projectsResponse,
    isLoading: isLoadingProjects,
  } = useQuery({
    queryKey: ["projects", "all"],
    queryFn: projectsAPI.getAllProjects,
    select: (data) => (data?.success ? data.data || [] : []),
  });
  const projectsList = projectsResponse || [];

  // Fetch tasks
  const {
    data: tasksResponse,
    isLoading: isLoadingTasks,
  } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => tasksAPI.getTasks(),
    select: (data) => (data?.success ? data.data || [] : []),
  });
  const allTasksList = tasksResponse || [];

  // Fetch users
  const {
    data: usersResponse,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: () => userAPI.getAllUsers(),
    select: (data) => (data?.success ? data.data?.users || data.data || [] : []),
  });
  const usersList = usersResponse || [];

  // --- Mutation for updating schedule ---
  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, data }) => schedulesAPI.updateSchedule(id, data),
    onSuccess: (updatedSchedule) => {
      toast.success("Schedule updated successfully");
      queryClient.invalidateQueries({ queryKey: ["schedule", id] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      navigate(`/consultant/schedules/${id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update schedule");
      setIsSubmitting(false);
    },
  });

  // --- Permission Check Logic ---
  // This function assumes that schedule.createdBy is populated.
  const canConsultantEditSchedule = () => {
    if (!currentUser || !schedule || !schedule.createdBy) {
      return false;
    }
    if (currentUser.role === "admin") return true;
    if (currentUser.role === "consultant" && String(schedule.createdBy._id) === String(currentUser._id)) return true;
    return false;
  };

  // --- Effects ---

  // Initial auth/role check
  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      toast.error("Authentication required.");
      navigate("/login");
      return;
    }
    if (currentUser && currentUser.role !== "consultant" && currentUser.role !== "admin") {
      toast.warn("Access Denied.");
      navigate("/dashboard");
    }
  }, [currentUser, navigate]);

  // Permission check effect – if schedule data is loaded, ensure the user has edit rights.
  useEffect(() => {
    if (!isLoadingSchedule && !isScheduleError && schedule) {
      if (!schedule.createdBy) {
        console.error("createdBy field is missing from the schedule data.");
        toast.error("Schedule data incomplete; please contact support.");
        navigate(`/consultant/schedules/${id}`);
        return;
      }
      if (!canConsultantEditSchedule()) {
        toast.error("You don't have permission to edit this schedule.");
        navigate(`/consultant/schedules/${id}`);
      }
    }
  }, [schedule, isLoadingSchedule, isScheduleError, id, navigate, currentUser]);

  // --- Form Setup ---

  const validationSchema = Yup.object({
    scheduleName: Yup.string().required("Schedule name is required").max(100),
    scheduleDescription: Yup.string().required("Schedule description is required").max(500),
    startDate: Yup.date().required("Start date is required"),
    endDate: Yup.date()
      .required("End date is required")
      .min(Yup.ref("startDate"), "End date cannot be before the start date"),
    assignedTo: Yup.string().required("Assigning a user is required"),
    status: Yup.string().required("Status is required").oneOf(["planned", "in_progress", "completed", "delayed"]),
    priority: Yup.string().required("Priority is required").oneOf(["low", "medium", "high"]),
  });

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split("T")[0];
    } catch (e) {
      console.error("Error formatting date for input:", dateString, e);
      return "";
    }
  };

  // Prepare initial form values
  const initialValues = {
    scheduleName: schedule?.scheduleName || "",
    scheduleDescription: schedule?.scheduleDescription || "",
    startDate: formatDateForInput(schedule?.startDate) || "",
    endDate: formatDateForInput(schedule?.endDate) || "",
    project: schedule?.project?._id || "",
    task: schedule?.task?._id || "",
    assignedTo: schedule?.assignedTo?._id || "",
    status: schedule?.status || "planned",
    priority: schedule?.priority || "medium",
  };

  const handleSubmit = (values) => {
    setIsSubmitting(true);
    const updateData = {
      scheduleName: values.scheduleName,
      scheduleDescription: values.scheduleDescription,
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
      assignedTo: values.assignedTo,
      status: values.status,
      priority: values.priority,
    };
    console.log("Submitting update data:", updateData);
    updateScheduleMutation.mutate({ id, data: updateData });
  };

  // --- Render Logic ---

  if (isLoadingSchedule) {
    return (
      <div className="flex justify-center items-center h-screen">
        <ArrowPathIcon className="h-12 w-12 text-gray-400 animate-spin" />
        <span className="ml-3 text-gray-500">Loading schedule data...</span>
      </div>
    );
  }

  if (isScheduleError || !schedule) {
    return (
      <div className="text-center py-20 px-6 bg-white shadow rounded-lg border border-red-200 max-w-2xl mx-auto">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-lg font-semibold text-red-800">
          {isScheduleError ? "Error Loading Schedule" : "Schedule Not Found"}
        </h3>
        <p className="mt-1 text-sm text-red-600 mb-4">
          {scheduleError?.message || "The schedule data could not be loaded or the schedule does not exist. Please try again or go back."}
        </p>
        <div className="flex justify-center space-x-3">
          <button
            onClick={() => navigate("/consultant/schedules")}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Back to Schedules List
          </button>
          <button
            onClick={() => refetchSchedule()}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Edit Schedule</h1>
          <p className="text-sm text-gray-500 truncate" title={initialValues.scheduleName}>
            Updating schedule: {initialValues.scheduleName}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/consultant/schedules/${id}`)}
          className="mt-4 sm:mt-0 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Cancel Edit
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          validateOnChange={false}
          validateOnBlur={true}
          enableReinitialize={true}
        >
          {({ errors, touched, values, setFieldValue, isSubmitting: formikIsSubmitting }) => (
            <Form className="space-y-6 px-4 py-5 sm:p-6">
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
                      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        errors.scheduleName && touched.scheduleName ? "border-red-500" : ""
                      }`}
                    />
                    <ErrorMessage name="scheduleName" component="p" className="mt-1 text-sm text-red-600" />
                  </div>
                </div>

                {/* Schedule Description */}
                <div className="sm:col-span-2">
                  <label htmlFor="scheduleDescription" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <div className="mt-1">
                    <Field
                      as="textarea"
                      name="scheduleDescription"
                      id="scheduleDescription"
                      rows={4}
                      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        errors.scheduleDescription && touched.scheduleDescription ? "border-red-500" : ""
                      }`}
                    />
                    <ErrorMessage name="scheduleDescription" component="p" className="mt-1 text-sm text-red-600" />
                  </div>
                </div>

                {/* Project (read-only) */}
                <div className="sm:col-span-1">
                  <label htmlFor="projectDisplay" className="block text-sm font-medium text-gray-500">
                    Project <span className="text-xs">(Read-only)</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="projectDisplay"
                      value={schedule?.project?.projectName || "Loading..."}
                      className="block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:outline-none sm:text-sm"
                      disabled={true}
                    />
                    <Field type="hidden" name="project" />
                  </div>
                </div>

                {/* Task (read-only) */}
                <div className="sm:col-span-1">
                  <label htmlFor="taskDisplay" className="block text-sm font-medium text-gray-500">
                    Task <span className="text-xs">(Read-only)</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="taskDisplay"
                      value={schedule?.task?.taskName || "Loading..."}
                      className="block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:outline-none sm:text-sm"
                      disabled={true}
                    />
                    <Field type="hidden" name="task" />
                  </div>
                </div>

                {/* Start Date */}
                <div className="sm:col-span-1">
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <div className="mt-1">
                    <Field
                      type="date"
                      name="startDate"
                      id="startDate"
                      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        errors.startDate && touched.startDate ? "border-red-500" : ""
                      }`}
                    />
                    <ErrorMessage name="startDate" component="p" className="mt-1 text-sm text-red-600" />
                  </div>
                </div>

                {/* End Date */}
                <div className="sm:col-span-1">
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <div className="mt-1">
                    <Field
                      type="date"
                      name="endDate"
                      id="endDate"
                      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        errors.endDate && touched.endDate ? "border-red-500" : ""
                      }`}
                    />
                    <ErrorMessage name="endDate" component="p" className="mt-1 text-sm text-red-600" />
                  </div>
                </div>

                {/* Assigned To Dropdown */}
                <div className="sm:col-span-1">
                  <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
                    Assigned To
                  </label>
                  <div className="mt-1">
                    <Field
                      as="select"
                      name="assignedTo"
                      id="assignedTo"
                      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        errors.assignedTo && touched.assignedTo ? "border-red-500" : ""
                      }`}
                      disabled={isLoadingUsers}
                    >
                      <option value="">{isLoadingUsers ? "Loading..." : "Select user"}</option>
                      {usersList.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.firstName} {user.lastName} ({user.role})
                        </option>
                      ))}
                    </Field>
                    {usersError && (
                      <p className="mt-1 text-sm text-red-600">Error loading users: {usersError.message}</p>
                    )}
                    <ErrorMessage name="assignedTo" component="p" className="mt-1 text-sm text-red-600" />
                  </div>
                </div>

                {/* Status Dropdown */}
                <div className="sm:col-span-1">
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <div className="mt-1">
                    <Field
                      as="select"
                      name="status"
                      id="status"
                      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
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
                <div className="sm:col-span-2">
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                    Priority
                  </label>
                  <div className="mt-1">
                    <Field
                      as="select"
                      name="priority"
                      id="priority"
                      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
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
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/consultant/schedules/${id}`)}
                    className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    disabled={isSubmitting || formikIsSubmitting || updateScheduleMutation.isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || formikIsSubmitting || updateScheduleMutation.isLoading}
                    className={`inline-flex justify-center rounded-md border border-transparent py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      (isSubmitting || formikIsSubmitting || updateScheduleMutation.isLoading)
                        ? "bg-indigo-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
                    }`}
                  >
                    {(isSubmitting || formikIsSubmitting || updateScheduleMutation.isLoading) ? (
                      <>
                        <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Updating...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default ConsultantEditSchedule;
