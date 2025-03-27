import api from './index';

// Create new task – expects a task data object with all required fields.
const createTask = async (taskData) => {
  try {
    console.log('Creating task with payload:', taskData);
    const response = await api.post('/tasks', taskData);
    console.log('Task created, response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in createTask API call:', error);
    throw new Error(error.response?.data?.message || "Failed to create task");
  }
};

// Get all tasks
const getTasks = async () => {
  try {
    const response = await api.get('/tasks');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch tasks");
  }
};

// Get task by ID
const getTasksForProject = async (projectId) => {
  try {
    const response = await api.get('/tasks', { params: { project: projectId } })
    return response.data.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch tasks for project")
  }
}

// Get a single task by its ID
const getTaskById = async (id) => {
  try {
    const response = await api.get(`/tasks/${id}`)
    return response.data.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch task details")
  }
}

// Update task
const updateTask = async (id, taskData) => {
  try {
    const response = await api.patch(`/tasks/${id}`, taskData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to update task");
  }
};

// Delete task
const deleteTask = async (id) => {
  try {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to delete task");
  }
};

const tasksAPI = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  getTasksForProject,
  getTaskById
};

export default tasksAPI;
