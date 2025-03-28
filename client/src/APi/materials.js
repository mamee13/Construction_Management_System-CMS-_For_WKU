

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
      // Pass params directly to axios 'params' config
      const response = await api.get("/materials", { params });
      // IMPORTANT: Assuming your controller sends { success: true, data: [...] }
      // If controller sends array directly, return response.data directly.
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
      return response.data; // Assuming { success: true, data: {...} }
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
      // Ensure project and user are present before sending
      if (!materialData.project || !materialData.user) {
        throw new Error("Project ID and User ID are required in material data.");
      }
      console.log("Creating material with data:", materialData);
      const response = await api.post("/materials", materialData);
      return response.data; // Assuming { success: true, data: {...} }
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
      // No need to clean data as much for PATCH, only send fields to update
      const response = await api.patch(`/materials/${id}`, materialData);
      return response.data; // Assuming { success: true, data: {...} }
    } catch (error) {
      console.error(`Error updating material ${id}:`, error);
      throw error.response ? error.response.data : error;
    }
  },

   /**
   * Delete a material
   * @param {string} id - Material ID
   * @param {string} userId - ID of the user attempting the deletion (for backend auth check - less ideal)
   * @returns {Promise<Object>} - Response data, expected { success: true, message: '...', deletedId: '...' }
   */
  deleteMaterial: async (id, userId) => {
    try {
      console.log(`Attempting to delete material ${id} by user ${userId}`);
      // Sending userId in the body for DELETE is non-standard.
      // Ideally, backend uses token. If required by current backend:
      const response = await api.delete(`/materials/${id}`, {
         data: { user: userId } // Pass userId in the 'data' property for DELETE requests in Axios
      });

      // If backend auth uses token and doesn't need userId in body:
      // const response = await api.delete(`/materials/${id}`);

      return response.data; // Assuming { success: true, message: '...', deletedId: '...' }
    } catch (error) {
      console.error(`Error deleting material ${id}:`, error);
      throw error.response ? error.response.data : error;
    }
  },

  // --- Helper functions (formatDate, getStatusBadgeColor etc.) remain the same ---
//   formatDate: (dateString) => {   },
//   getStatusBadgeColor: (status) => { /* ... keep as is ... */ },
//   getStatusLabel: (status) => { /* ... keep as is ... */ },
};


export default materialsAPI;