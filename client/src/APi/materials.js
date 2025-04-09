
// export default materialsAPI;
import api from "./index"; // Assuming './index' sets up your axios instance with baseURL etc.

const materialsAPI = {
  /**
   * Get materials, optionally filtered by params (e.g., project ID)
   * @param {Object} params - Query parameters (e.g., { project: 'projectId123' })
   * @returns {Promise<Object>} - Response data, expected to be { success: true, data: [...] }
   */
  getAllMaterials: async (params = {}) => {
    try {
      console.log("Fetching materials with params:", params);
      const response = await api.get("/materials", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching materials:", error);
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Get material by ID
   * @param {string} id - Material ID
   * @returns {Promise<Object>} - Response data, expected { success: true, data: {...} }
   */
  getMaterialById: async (id) => {
    try {
      const response = await api.get(`/materials/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching material ${id}:`, error);
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Create a new material
   * @param {Object} materialData - Material data (MUST include 'project' and 'user' IDs)
   * @returns {Promise<Object>} - Response data, expected { success: true, data: {...} }
   */
  createMaterial: async (materialData) => {
    try {
      if (!materialData.project || !materialData.user) {
        throw new Error("Project ID and User ID are required in material data.");
      }
      console.log("Creating material with data:", materialData);
      const response = await api.post("/materials", materialData);
      return response.data;
    } catch (error) {
      console.error("Error creating material:", error);
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Update an existing material
   * @param {string} id - Material ID
   * @param {Object} materialData - Updated material data fields
   * @returns {Promise<Object>} - Response data, expected { success: true, data: {...} }
   */
  updateMaterial: async (id, materialData) => {
    try {
      console.log(`Updating material ${id} with data:`, materialData);
      const response = await api.patch(`/materials/${id}`, materialData);
      return response.data;
    } catch (error) {
      console.error(`Error updating material ${id}:`, error);
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Delete a material
   * @param {string} id - Material ID
   * @param {string} userId - ID of the user attempting the deletion
   * @returns {Promise<Object>} - Response data, expected { success: true, message: '...', deletedId: '...' }
   */
  deleteMaterial: async (id, userId) => {
    try {
      console.log(`Attempting to delete material ${id} by user ${userId}`);
      const response = await api.delete(`/materials/${id}`, {
        data: { user: userId }
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting material ${id}:`, error);
      throw error.response ? error.response.data : error;
    }
  },

  /**
   * Formats a number as a US dollar currency string.
   * @param {number|string|null|undefined} value - The numeric value to format.
   * @returns {string} - The formatted currency string (e.g., "$1,234.50"). Returns "$0.00" for invalid input.
   */
  formatCurrency: (value) => {
    const number = Number(value);
    if (isNaN(number)) {
      return "$0.00";
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number);
  },

  // --- Helper Functions ---

  /**
   * Format a date string into a readable format.
   * @param {string} dateString - The date string to format.
   * @returns {string} - Formatted date (e.g., "Jan 1, 2025").
   */
  formatDate: (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  },

  /**
   * Returns a color string based on the status.
   * @param {string} status - Status value (e.g., "approved", "pending", "rejected").
   * @returns {string} - Color string for badge styling.
   */
  getStatusBadgeColor: (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'ordered':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-indigo-100 text-indigo-800';
      case 'in_use':
        return 'bg-purple-100 text-purple-800';
      case 'depleted':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  },

  /**
   * Returns a human-readable label for a given status.
   * @param {string} status - Status value.
   * @returns {string} - Readable status label.
   */
  getStatusLabel: (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'Approved';
      case 'pending':
        return 'Pending';
      case 'rejected':
        return 'Rejected';
      case 'ordered':
        return 'Ordered';
      case 'delivered':
        return 'Delivered';
      case 'in_use':
        return 'In Use';
      case 'depleted':
        return 'Depleted';
      default:
        return 'Unknown';
    }
  },

  /**
   * Formats a status value into a human-readable string.
   * This function can be customized further if needed.
   * @param {string} status - The status to format.
   * @returns {string} - Formatted status.
   */
  formatStatus: (status) => {
    // Here we simply delegate to getStatusLabel for consistency.
    return materialsAPI.getStatusLabel(status);
    // Alternatively, you can use a custom formatting logic such as:
    // if (!status) return 'Unknown';
    // return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  },
};

export default materialsAPI;
