

import api from "./index";

// Get all schedules
const getAllSchedules = async () => {
  try {
    const response = await api.get("/schedules");
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch schedules");
  }
};

// Get schedule by ID
const getScheduleById = async (id) => {
  try {
    const response = await api.get(`/schedules/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch schedule details");
  }
};

// Create new schedule
const createSchedule = async (scheduleData) => {
  try {
    const response = await api.post("/schedules", scheduleData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to create schedule");
  }
};

// Update schedule
const updateSchedule = async (id, scheduleData) => {
  try {
    const response = await api.patch(`/schedules/${id}`, scheduleData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to update schedule");
  }
};

// Delete schedule
const deleteSchedule = async (id) => {
  try {
    const response = await api.delete(`/schedules/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to delete schedule");
  }
};

// Get schedules by project ID
const getSchedulesByProject = async (projectId) => {
  try {
    const response = await api.get("/schedules", { params: { project: projectId } });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch project schedules");
  }
};

const schedulesAPI = {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getSchedulesByProject,
};

export default schedulesAPI;
