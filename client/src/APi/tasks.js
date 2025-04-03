

import api from "./index"; // Assuming './index' exports the configured axios instance

/**
 * @file Tasks API Client
 * @description Provides methods for interacting with the backend tasks endpoints.
 */

/**
 * Fetches a list of tasks, optionally filtered, sorted, and paginated.
 * Corresponds to GET /api/tasks
 *
 * @param {object} [filters={}] - Optional query parameters for filtering, sorting, pagination.
 *   Examples: { project: 'projectId', status: 'in_progress', priority: 'high', assignedTo: 'userId', sort: '-createdAt', page: 1, limit: 10 }
 * @returns {Promise<object>} A promise that resolves to the API response object, typically including:
 *   { success: boolean, count: number, totalCount: number, pagination: object, data: Array<object> }
 * @throws {Error} If the request fails, throws an error with a message from the API response or a default message.
 */
const getTasks = async (filters = {}) => {
  try {
    console.log("Fetching tasks with filters:", filters);
    // Ensure boolean values are sent as strings if needed by backend query parsing
    // Example: if a filter could be `isCompleted=true`, ensure it's not dropped by axios params serialization if it expects strings
    const response = await api.get("/tasks", { params: filters });
    console.log("Tasks fetched successfully:", response.data);
    return response.data; // Return the full response data structure
  } catch (error) {
    console.error("Error fetching tasks:", error.response || error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to fetch tasks"
    );
  }
};

/**
 * Fetches a single task by its ID.
 * Corresponds to GET /api/tasks/:id
 * Requires Admin/Consultant role. Consultants may have further restrictions based on backend logic (e.g., project association).
 *
 * @param {string} id - The ID of the task to fetch.
 * @returns {Promise<object>} A promise that resolves to the API response object, typically:
 *   { success: boolean, data: object }
 * @throws {Error} If the request fails (e.g., not found, forbidden), throws an error.
 */
const getTaskById = async (id) => {
  if (!id) throw new Error("Task ID is required.");
  try {
    console.log(`Fetching task details for ID: ${id}`);
    const response = await api.get(`/tasks/${id}`);
    console.log(`Task ${id} fetched successfully:`, response.data);
    return response.data; // Contains { success: true, data: task }
  } catch (error) {
    console.error(`Error fetching task ${id}:`, error.response || error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to fetch task details"
    );
  }
};

/**
 * Creates a new task.
 * Corresponds to POST /api/tasks
 * Requires Admin/Consultant role.
 *
 * @param {object} taskData - The data for the new task. Must include required fields like
 *   taskName, startDate, endDate, assignedTo (array), project. Optional: taskDescription, status, priority.
 * @returns {Promise<object>} A promise that resolves to the API response object, typically:
 *   { success: boolean, data: object } // data is the newly created task, populated.
 * @throws {Error} If the request fails (e.g., validation error), throws an error.
 */
const createTask = async (taskData) => {
  // Basic frontend validation example (can be more extensive)
  if (!taskData || !taskData.taskName || !taskData.project || !taskData.assignedTo?.length || !taskData.startDate || !taskData.endDate) {
     console.error("Task creation attempt with missing required fields:", taskData);
     // Throw an error *before* the API call for immediate feedback
     throw new Error("Missing required fields for task creation.");
  }
  try {
    console.log("Creating new task with data:", taskData);
    const response = await api.post("/tasks", taskData);
    console.log("Task created successfully:", response.data);
    return response.data; // Contains { success: true, data: createdTask }
  } catch (error) {
    console.error("Error creating task:", error.response || error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to create task"
    );
  }
};

/**
 * Updates an existing task by its ID.
 * Corresponds to PATCH /api/tasks/:id
 * Requires Admin role, OR Consultant role if the consultant created the task.
 *
 * @param {string} id - The ID of the task to update.
 * @param {object} taskData - An object containing the fields to update. Cannot update 'createdBy'.
 * @returns {Promise<object>} A promise that resolves to the API response object, typically:
 *   { success: boolean, data: object } // data is the updated task, populated.
 * @throws {Error} If the request fails (e.g., not found, forbidden, validation error), throws an error.
 */
const updateTask = async (id, taskData) => {
  if (!id) throw new Error("Task ID is required for update.");
  if (!taskData || Object.keys(taskData).length === 0) {
      console.warn(`Attempted to update task ${id} with empty data.`);
      // Depending on desired behavior, could throw error or return early
      // For now, let the backend handle it, but log a warning.
      // throw new Error("No update data provided.");
  }
  try {
    console.log(`Updating task ${id} with data:`, taskData);
    // Remove fields that should not be updated from the frontend payload
    const sanitizedData = { ...taskData };
    delete sanitizedData.createdBy; // Ensure createdBy isn't sent
    // delete sanitizedData.project; // Uncomment if project shouldn't be changeable via update

    const response = await api.patch(`/tasks/${id}`, sanitizedData);
    console.log("Task updated successfully:", response.data);
    return response.data; // Contains { success: true, data: updatedTask }
  } catch (error) {
    console.error(`Error updating task ${id}:`, error.response || error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to update task"
    );
  }
};

/**
 * Deletes a task by its ID.
 * Corresponds to DELETE /api/tasks/:id
 * Requires Admin role, OR Consultant role if the consultant created the task.
 *
 * @param {string} id - The ID of the task to delete.
 * @returns {Promise<object>} A promise that resolves to the API response object, typically:
 *   { success: boolean, message: string, data: object } // data is usually empty {}
 * @throws {Error} If the request fails (e.g., not found, forbidden), throws an error.
 */
const deleteTask = async (id) => {
  if (!id) throw new Error("Task ID is required for deletion.");
  try {
    console.log(`Attempting to delete task ${id}`);
    const response = await api.delete(`/tasks/${id}`);
    console.log("Task deleted successfully:", response.data);
    return response.data; // Contains { success: true, message: '...', data: {} }
  } catch (error) {
    console.error(`Error deleting task ${id}:`, error.response || error);
    // Handle 404 slightly differently if needed (e.g., task already deleted)
    if (error.response?.status === 404) {
        console.log(`Task ${id} not found for deletion (possibly already deleted).`);
         // Decide: throw error or return a specific status? Let's throw for consistency.
    }
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to delete task"
    );
  }
};

/**
 * Fetches tasks assigned to the currently authenticated user.
 * NOTE: This function assumes a dedicated backend endpoint GET /api/tasks/my-tasks.
 * Alternatively, this could be implemented by calling getTasks() with a filter
 * like { assignedTo: currentUser.id } if the user's ID is available client-side
 * and the backend supports filtering by assignedTo.
 *
 * @returns {Promise<object>} A promise that resolves to the API response object (similar structure to getTasks).
 * @throws {Error} If the request fails.
 */
const getMyTasks = async () => {
  try {
    console.log("Fetching tasks assigned to the current user (requires GET /api/tasks/my-tasks)");
    const response = await api.get("/tasks/my-tasks"); // Assumes this endpoint exists
    console.log("My tasks fetched successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching assigned tasks:", error.response || error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to fetch your tasks"
    );
  }
};

/**
 * Fetches tasks filtered by a specific status.
 * Convenience wrapper around getTasks.
 *
 * @param {string} status - The status to filter by (e.g., 'not_started', 'in_progress').
 * @returns {Promise<object>} A promise that resolves to the API response object from getTasks.
 * @throws {Error} If the request fails.
 */
const getTasksByStatus = async (status) => {
  if (!status) throw new Error("Status is required for filtering.");
  try {
    console.log(`Fetching tasks with status: ${status}`);
    // Reuses the main getTasks function
    return await getTasks({ status });
  } catch (error) {
    // Error is already handled and thrown by getTasks, but we can add context
    console.error(`Error fetching tasks with status ${status}:`, error);
    // Re-throw the original error or a new one with more context
    throw new Error(
       error.message || `Failed to fetch tasks by status: ${status}` // Use error.message from getTasks' throw
    );
  }
};

/**
 * Fetches tasks filtered by a specific priority.
 * Convenience wrapper around getTasks.
 *
 * @param {string} priority - The priority to filter by (e.g., 'low', 'medium', 'high').
 * @returns {Promise<object>} A promise that resolves to the API response object from getTasks.
 * @throws {Error} If the request fails.
 */
const getTasksByPriority = async (priority) => {
    if (!priority) throw new Error("Priority is required for filtering.");
    try {
        console.log(`Fetching tasks with priority: ${priority}`);
        // Reuses the main getTasks function
        return await getTasks({ priority });
    } catch (error) {
        console.error(`Error fetching tasks with priority ${priority}:`, error);
        throw new Error(
            error.message || `Failed to fetch tasks by priority: ${priority}`
        );
    }
};


/**
 * Updates the status of a specific task.
 * Convenience wrapper around updateTask.
 *
 * @param {string} id - The ID of the task to update.
 * @param {string} status - The new status value.
 * @returns {Promise<object>} A promise that resolves to the API response object from updateTask.
 * @throws {Error} If the request fails.
 */
const updateTaskStatus = async (id, status) => {
  if (!id || !status) throw new Error("Task ID and new status are required.");
  try {
    console.log(`Updating task ${id} status to ${status}`);
    // Reuses the main updateTask function
    return await updateTask(id, { status });
  } catch (error) {
    console.error(`Error updating task ${id} status to ${status}:`, error);
     throw new Error(
            error.message || "Failed to update task status"
     );
  }
};

// --- Utility Functions ---
// NOTE: These are helpful for UI presentation but might be better placed
// in a separate `utils/taskUtils.js` file or directly within components
// to keep the API client focused solely on data fetching and mutation.

// const formatDate = (dateString) => { /* ... implementation ... */ };
// const getStatusBadgeClass = (status) => { /* ... implementation ... */ };
// const getPriorityBadgeClass = (priority) => { /* ... implementation ... */ };
// const formatStatus = (status) => { /* ... implementation ... */ };
// const formatPriority = (priority) => { /* ... implementation ... */ };
// const calculateDaysRemaining = (endDate) => { /* ... implementation ... */ };
// const isTaskOverdue = (endDate, status) => { /* ... implementation ... */ };
// const calculateTaskProgress = (startDate, endDate) => { /* ... implementation ... */ };
// const getTaskDuration = (startDate, endDate) => { /* ... implementation ... */ };

// --- Keep the implementations for utility functions as they were ---
// (Assuming they are correct and work as intended)
// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return "N/A"
  try {
      const options = { year: "numeric", month: "short", day: "numeric" } // Using 'short' month
      return new Date(dateString).toLocaleDateString(undefined, options)
  } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return "Invalid Date";
  }
}

// Get status badge class (example using Tailwind CSS classes)
const getStatusBadgeClass = (status) => {
  switch (status) {
    case "not_started": return "bg-gray-200 text-gray-800";
    case "in_progress": return "bg-blue-200 text-blue-800";
    case "completed": return "bg-green-200 text-green-800";
    case "on_hold": return "bg-yellow-200 text-yellow-800";
    case "cancelled": return "bg-red-200 text-red-800"; // Added example
    default: return "bg-gray-100 text-gray-600";
  }
}

// Get priority badge class (example using Tailwind CSS classes)
const getPriorityBadgeClass = (priority) => {
  switch (priority) {
    case "low": return "bg-green-100 text-green-700";
    case "medium": return "bg-blue-100 text-blue-700";
    case "high": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-600";
  }
}

// Format status for display
const formatStatus = (status) => {
  if (!status) return "Unknown";
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Format priority for display
const formatPriority = (priority) => {
  if (!priority) return "Unknown";
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

// Calculate days remaining until the end date
const calculateDaysRemaining = (endDate) => {
  if (!endDate) return null; // Return null or specific value like 'N/A' maybe handled in UI
  try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize today to the start of the day
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0); // Normalize end date
      const diffTime = end - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
  } catch (e) {
      console.error("Error calculating days remaining:", endDate, e);
      return null;
  }
}

// Check if task is overdue (and not completed)
const isTaskOverdue = (endDate, status) => {
  if (status === "completed" || !endDate) return false;
  try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);
      return end < today;
  } catch (e) {
      console.error("Error checking if task is overdue:", endDate, e);
      return false;
  }
}

// Calculate task progress percentage based ONLY on dates (might not be accurate for real progress)
const calculateTaskProgress = (startDate, endDate, status) => {
  if (status === 'completed') return 100;
  if (!startDate || !endDate) return 0;

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();

    // Normalize dates
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);


    if (today <= start) return 0; // Not started yet based on date
    if (today >= end) {
       // If past end date but not complete, show 100% (or maybe 99%?)
       // Let's return 100 but rely on `isTaskOverdue` for visual cue
       return 100;
    }

    const totalDuration = end - start;
    if (totalDuration <= 0) return 100; // Start and end date are same or invalid

    const elapsedDuration = today - start;
    const progress = Math.round((elapsedDuration / totalDuration) * 100);

    return Math.min(100, Math.max(0, progress)); // Clamp between 0 and 100

  } catch(e) {
      console.error("Error calculating task progress:", startDate, endDate, e);
      return 0; // Return 0 on error
  }
}

// Get task duration in days
const getTaskDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return null; // Return null or specific value

  try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);

      if (end < start) return 0; // Or handle as error? Duration can't be negative.

      // Add 1 day because duration is inclusive (e.g., start=Mon, end=Tue is 2 days)
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      return diffDays;
  } catch (e) {
      console.error("Error calculating task duration:", startDate, endDate, e);
      return null;
  }
}


// --- Export all functions ---
const tasksAPI = {
  // Core API Calls
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  // Convenience API Calls
  getMyTasks, // Requires specific backend route or adaptation
  getTasksByStatus,
  getTasksByPriority,
  updateTaskStatus,
  // Utility Functions (Consider moving to a separate utils file)
  formatDate,
  getStatusBadgeClass,
  getPriorityBadgeClass,
  formatStatus,
  formatPriority,
  calculateDaysRemaining,
  isTaskOverdue,
  calculateTaskProgress,
  getTaskDuration,
};

export default tasksAPI;