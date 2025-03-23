import api from "./index"

const schedulesAPI = {
  /**
   * Get all schedules for a specific project
   * @param {string} projectId - The ID of the project
   * @returns {Promise} - Response with schedules data
   */
  getSchedulesForProject: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/schedules`)
      return response.data
    } catch (error) {
      console.error(`Error fetching schedules for project ${projectId}:`, error)
      throw error.response ? error.response.data : error
    }
  },

  /**
   * Create a new schedule for a project
   * @param {string} projectId - The ID of the project
   * @param {Object} scheduleData - Data for the new schedule
   * @returns {Promise} - Response with created schedule data
   */
  createSchedule: async (projectId, scheduleData) => {
    try {
      const response = await api.post(`/projects/${projectId}/schedules`, scheduleData, {
        headers: {
          "Content-Type": "application/json"
        }
      })
      return response.data
    } catch (error) {
      console.error(`Error creating schedule for project ${projectId}:`, error)
      throw error.response ? error.response.data : error
    }
  },

  /**
   * Update an existing schedule
   * @param {string} scheduleId - The ID of the schedule to update
   * @param {Object} updateData - Data to update the schedule with
   * @returns {Promise} - Response with updated schedule data
   */
  updateSchedule: async (scheduleId, updateData) => {
    try {
      console.log(`Updating schedule ${scheduleId} with data:`, updateData)
      const response = await api.patch(`/schedules/${scheduleId}`, updateData, {
        headers: {
          "Content-Type": "application/json"
        }
      })
      return response.data
    } catch (error) {
      console.error(`Error updating schedule ${scheduleId}:`, error)
      if (error.response) {
        throw error.response.data || { message: `Server error: ${error.response.status}` }
      } else if (error.request) {
        throw new Error("No response received from server. Please check your network connection.")
      } else {
        throw error
      }
    }
  },

  /**
   * Delete a schedule
   * @param {string} scheduleId - The ID of the schedule to delete
   * @returns {Promise} - Response with deletion confirmation
   */
  deleteSchedule: async (scheduleId) => {
    try {
      console.log(`Deleting schedule ${scheduleId}`)
      const response = await api.delete(`/schedules/${scheduleId}`)
      return response.data
    } catch (error) {
      console.error(`Error deleting schedule ${scheduleId}:`, error)
      throw error.response ? error.response.data : error
    }
  }
}

export default schedulesAPI
