

// // src/api/reportsAPI.js (or similar path)

import api from "./index" // Your configured axios instance

const reportsAPI = {
  /**
   * Create a new report, including potential file attachments.
   * @param {Object} reportData - Data for the new report (e.g., { title: '...', summary: '...', attachments: [File1, File2] })
   * The 'attachments' key should hold an array of File objects from the input.
   * @returns {Promise<Object>} - The created report data from the backend
   */
  createReport: async (reportData) => {
    // 1. Create a FormData object
    const formData = new FormData();

    // 2. Append text fields from reportData to formData
    for (const key in reportData) {
      // IMPORTANT: Only append non-file fields here.
      // The key for your files array (e.g., 'attachments') should match the field name used in multer on the backend.
      // if (key !== 'attachments' && reportData.hasOwnProperty(key)) {
        if (key !== 'attachments' && Object.prototype.hasOwnProperty.call(reportData, key)) {
         // Handle potential null/undefined values if necessary
         if (reportData[key] !== null && reportData[key] !== undefined) {
             formData.append(key, reportData[key]);
         }
      }
    }

    // 3. Append files to formData
    // Ensure 'attachments' key holds an array of File objects
    if (reportData.attachments && reportData.attachments.length > 0) {
      reportData.attachments.forEach((file) => {
        // The key 'attachments' MUST match the fieldname used in multer backend:
        // e.g., upload.array('attachments', 5)
        formData.append('attachments', file);
      });
    }

    try {
      // 4. Send the FormData object
      // Axios automatically sets the 'Content-Type' to 'multipart/form-data' when you pass FormData
      const response = await api.post("/reports", formData, {
        // Optional: Add progress tracking if needed
        // onUploadProgress: progressEvent => {
        //   console.log('Upload Progress:', Math.round((progressEvent.loaded * 100) / progressEvent.total));
        // }
      });
      return response.data; // Return the backend response
    } catch (error) {
      console.error("Error creating report with attachments:", error);
      throw error.response ? error.response.data : error;
    }
  },

  // --- Other API functions remain the same ---

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
   // Note: Updating files typically requires a different approach (e.g., separate endpoints for adding/removing attachments)
   // This update function assumes you are NOT sending files during update.
  updateReport: async (reportId, updateData) => {
    if (!reportId) {
      console.error("updateReport called without reportId")
      throw new Error("Report ID is required")
    }
    try {
      // Use PUT or PATCH depending on your backend route
      const response = await api.put(`/reports/${reportId}`, updateData)
      return response.data
    } catch (error) {
      console.error(`Error updating report ${reportId}:`, error)
      throw error.response ? error.response.data : error
    }
  },
    /**
   * Get reports specifically associated with the currently logged-in user.
   * Assumes the backend has an endpoint like /api/reports/my-reports
   * @returns {Promise<Object>} - Response containing the user's reports
   */
    getMyReports: async () => {
    try {
      // Call the dedicated backend endpoint
      const response = await api.get("/reports/my-reports");
      // Ensure the response structure matches what the component expects
      // e.g., { success: true, data: { reports: [...] } }
      return response.data;
    } catch (error) {
      console.error("Error fetching my reports:", error);
      // Provide a consistent error structure or re-throw
      throw error.response ? error.response.data : error;
    }
  },

  

  // Helper Functions (Keep these as they are useful)
  formatDate: (dateString, options = { year: "numeric", month: "short", day: "numeric" }) => {
    // ... (implementation remains the same)
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString(undefined, options)
    } catch (e) {
      console.error("Error formatting date:", dateString, e)
      return "Invalid Date"
    }
  },

  getReportTypeLabel: (typeEnum) => {
    // ... (implementation remains the same)
    if (!typeEnum) return "Unknown"
    return typeEnum
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  },

  getReportStatusLabel: (statusEnum) => {
    // ... (implementation remains the same)
    if (!statusEnum) return "Unknown"
    return statusEnum.charAt(0).toUpperCase() + statusEnum.slice(1)
  },

  getReportStatusColor: (statusEnum) => {
    // ... (implementation remains the same)
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      submitted: "bg-blue-100 text-blue-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      archived: "bg-purple-100 text-purple-800",
      pending: "bg-yellow-100 text-yellow-800", // Example added
      pending_review: "bg-yellow-100 text-yellow-800", // Example added
    }
    return colors[statusEnum] || "bg-gray-100 text-gray-800"
  },
  
  
  

}

export default reportsAPI