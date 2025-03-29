// src/api/reports.js
import api from "./index"; // Your configured axios instance

const reportsAPI = {
  /**
   * Get all reports with filtering and pagination
   * @param {object} params - Query parameters (e.g., { page, limit, projectId, type, startDate, endDate })
   * @returns {Promise} - Response with reports data and pagination info
   */
  getAllReports: async (params = {}) => {
    try {
      // Construct query string from params object
      const queryString = new URLSearchParams(params).toString();
      console.log(`Fetching reports with query: /reports?${queryString}`);
      const response = await api.get(`/reports?${queryString}`);
      return response.data; // Expect { success: true, data: [...], pagination: {...}, total: ... }
    } catch (error) {
      console.error("Error fetching reports:", error);
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Get report by ID
   * @param {string} id - Report ID
   * @returns {Promise} - Response with report data
   */
  getReportById: async (id) => {
    try {
      const response = await api.get(`/reports/${id}`);
      return response.data; // Expect { success: true, data: {...} }
    } catch (error) {
      console.error(`Error fetching report ${id}:`, error);
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Delete a report (Admin only - optional)
   * @param {string} id - Report ID
   * @returns {Promise} - Response with success message
   */
  deleteReport: async (id) => {
    try {
      const response = await api.delete(`/reports/${id}`);
      return response.data; // Expect { success: true, message: '...', deletedId: '...' }
    } catch (error) {
      console.error(`Error deleting report ${id}:`, error);
      throw error.response ? error.response.data : error;
    }
  },

  // Add createReport function if needed from admin side, though likely generated by others
  createReport: async (reportData) => {
     try {
       const response = await api.post("/reports", reportData);
       return response.data; // Expect { success: true, data: {...} }
     } catch (error) {
       console.error("Error creating report:", error);
       throw error.response ? error.response.data : error;
     }
  }
};

export default reportsAPI;