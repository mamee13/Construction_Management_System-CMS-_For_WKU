// // src/api/reportsAPI.js (or similar path)



import api from "./index"

const reportsAPI = {
  /**
   * Create a new report.
   * @param {Object} reportData - Data for the new report
   * @returns {Promise<Object>} - The created report data
   */
  createReport: async (reportData) => {
    try {
      const response = await api.post("/reports", reportData)
      return response.data
    } catch (error) {
      console.error("Error creating report:", error)
      throw error.response ? error.response.data : error
    }
  },

  /**
   * Get a list of reports with filtering and pagination.
   * @param {Object} params - Query parameters for filtering and pagination
   * @returns {Promise<Object>} - Response containing reports list and pagination info
   */
  getReports: async (params = {}) => {
    try {
      const response = await api.get("/reports", { params })
      return response.data
    } catch (error) {
      console.error("Error fetching reports:", error)
      throw error.response ? error.response.data : error
    }
  },

  /**
   * Get a single report by its ID.
   * @param {string} reportId - The ID of the report to fetch
   * @returns {Promise<Object>} - The detailed report data
   */
  getReportById: async (reportId) => {
    if (!reportId) {
      console.error("getReportById called without reportId")
      throw new Error("Report ID is required")
    }
    try {
      const response = await api.get(`/reports/${reportId}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching report ${reportId}:`, error)
      throw error.response ? error.response.data : error
    }
  },

  /**
   * Delete a report by its ID.
   * @param {string} reportId - The ID of the report to delete
   * @returns {Promise<Object>} - Confirmation message
   */
  deleteReport: async (reportId) => {
    if (!reportId) {
      console.error("deleteReport called without reportId")
      throw new Error("Report ID is required")
    }
    try {
      const response = await api.delete(`/reports/${reportId}`)
      return response.data
    } catch (error) {
      console.error(`Error deleting report ${reportId}:`, error)
      throw error.response ? error.response.data : error
    }
  },

  /**
   * Update a report by its ID.
   * @param {string} reportId - The ID of the report to update
   * @param {Object} updateData - The fields to update
   * @returns {Promise<Object>} - The updated report data
   */
  updateReport: async (reportId, updateData) => {
    if (!reportId) {
      console.error("updateReport called without reportId")
      throw new Error("Report ID is required")
    }
    try {
      const response = await api.put(`/reports/${reportId}`, updateData)
      return response.data
    } catch (error) {
      console.error(`Error updating report ${reportId}:`, error)
      throw error.response ? error.response.data : error
    }
  },

  // Helper Functions
  formatDate: (dateString, options = { year: "numeric", month: "short", day: "numeric" }) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString(undefined, options)
    } catch (e) {
      console.error("Error formatting date:", dateString, e)
      return "Invalid Date"
    }
  },

  getReportTypeLabel: (typeEnum) => {
    if (!typeEnum) return "Unknown"
    return typeEnum
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  },

  getReportStatusLabel: (statusEnum) => {
    if (!statusEnum) return "Unknown"
    return statusEnum.charAt(0).toUpperCase() + statusEnum.slice(1)
  },

  getReportStatusColor: (statusEnum) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      submitted: "bg-blue-100 text-blue-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      archived: "bg-purple-100 text-purple-800",
      pending: "bg-yellow-100 text-yellow-800",
    }
    return colors[statusEnum] || "bg-gray-100 text-gray-800"
  },
}

export default reportsAPI

