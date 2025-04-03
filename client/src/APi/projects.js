import api from "./index"

const projectsAPI = {
  /**
   * Get all projects
   * @returns {Promise} - Response with projects data
   */
  getAllProjects: async () => {
    try {
      const response = await api.get("/projects")
      return response.data
    } catch (error) {
      console.error("Error fetching projects:", error)
      throw error.response ? error.response.data : error
    }
  },

  /**
   * Get project by ID
   * @param {string} id - Project ID
   * @returns {Promise} - Response with project data
   */
  getProjectById: async (id) => {
    try {
      const response = await api.get(`/projects/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching project ${id}:`, error)
      throw error.response ? error.response.data : error
    }
  },

  /**
   * Create a new project (Admin only)
   * @param {Object} projectData - Project data
   * @returns {Promise} - Response with created project data
   */
  createProject: async (projectData) => {
    try {
      const response = await api.post("/projects", projectData)
      return response.data
    } catch (error) {
      console.error("Error creating project:", error)
      throw error.response ? error.response.data : error
    }
  },

  /**
   * Delete a project (Admin only)
   * @param {string} id - Project ID
   * @returns {Promise} - Response with success message
   */
  deleteProject: async (id) => {
    try {
      const response = await api.delete(`/projects/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error deleting project ${id}:`, error)
      throw error.response ? error.response.data : error
    }
  },

  /**
   * Update an existing project (Admin only)
   * @param {string} id - Project ID
   * @param {Object} projectData - Updated project data
   * @returns {Promise} - Response with updated project data
   */
  updateProject: async (id, projectData) => {
    try {
      console.log(`Updating project ${id} with data:`, projectData)

      // Clean up the data before sending to avoid validation issues
      const cleanData = { ...projectData }

      // Remove any fields that might cause issues with the backend
      delete cleanData._id
      delete cleanData.__v
      delete cleanData.createdAt
      delete cleanData.updatedAt

      // Use PUT request as specified in the backend routes
      const response = await api.put(`/projects/${id}`, cleanData, {
        timeout: 60000, // Increase timeout to 60 seconds
        headers: {
          "Content-Type": "application/json",
        },
      })

      return response.data
    } catch (error) {
      console.error(`Error updating project ${id}:`, error)

      // More detailed error handling
      if (error.code === "ECONNABORTED") {
        throw new Error("Request timed out. The server took too long to respond.")
      }

      if (error.response) {
        console.error("Response data:", error.response.data)
        console.error("Response status:", error.response.status)
        throw error.response.data || { message: `Server error: ${error.response.status}` }
      } else if (error.request) {
        console.error("No response received:", error.request)
        throw new Error("No response received from server. Please check your network connection.")
      } else {
        throw error
      }
    }
  },

  /**
   * Alternative update method using delete and recreate approach
   * @param {string} id - Project ID
   * @param {Object} projectData - Updated project data
   * @returns {Promise} - Response with updated project data
   */
  updateProjectAlternative: async (id, projectData) => {
    try {
      console.log(`Using alternative update method for project ${id}`)

      // First get the current project data
      const currentProject = await projectsAPI.getProjectById(id)

      // Create a new project with the same data but updated fields
      const updatedData = {
        ...currentProject.data,
        ...projectData,
      }

      // Remove fields that shouldn't be sent to the create endpoint
      delete updatedData._id
      delete updatedData.__v
      delete updatedData.createdAt
      delete updatedData.updatedAt

      console.log("Combined update data:", updatedData)

      // Delete the old project
      await projectsAPI.deleteProject(id)

      // Create a new project with the updated data
      const newProject = await projectsAPI.createProject(updatedData)

      return newProject
    } catch (error) {
      console.error(`Error in alternative update for project ${id}:`, error)
      throw error
    }
  },

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date string
   */
  formatDate: (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  },

  /**
   * Get status badge color
   * @param {string} status - Project status
   * @returns {string} - Tailwind CSS class for badge color
   */
  getStatusBadgeColor: (status) => {
    const statusColors = {
      planned: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      on_hold: "bg-red-100 text-red-800",
    }
    return statusColors[status] || "bg-gray-100 text-gray-800"
  },

  /**
   * Get formatted status label
   * @param {string} status - Project status
   * @returns {string} - Formatted status label
   */
  getStatusLabel: (status) => {
    const statusLabels = {
      planned: "Planned",
      in_progress: "In Progress",
      completed: "Completed",
      on_hold: "On Hold",
    }
    return statusLabels[status] || status
  },

   /**
   * Get projects assigned to a specific consultant
   * @param {string} consultantId - The ID of the consultant
   * @returns {Promise} - Response with the consultant's projects data
   */
   getProjectsByConsultant: async (consultantId) => {
    if (!consultantId) {
      // Prevent API call if ID is missing
      console.warn("getProjectsByConsultant called without consultantId");
      return Promise.resolve({ data: { projects: [] } }); // Return empty structure
    }
    try {
      // Assuming your backend route is /api/projects/consultant/:consultantId
      const response = await api.get(`/projects/consultant/${consultantId}`);
      // Ensure the response structure matches what the component expects
      // If the backend returns { success: true, data: [...] }, adjust here or in the component
      // Assuming it returns { success: true, data: { projects: [...] } } or similar
      return response.data;
    } catch (error) {
      console.error(`Error fetching projects for consultant ${consultantId}:`, error);
      throw error.response ? error.response.data : error;
    }
  },


   /**
   * Get projects assigned to the currently logged-in user.
   * Useful for non-admins to populate project dropdowns or lists specific to them.
   * @returns {Promise<Object>} - Response containing the user's assigned projects.
   *   Expects { success: true, data: { projects: Array<{_id: string, projectName: string, status: string}> } }
   */
   getMyAssignedProjects: async () => {
    try {
      // Calls the new backend endpoint GET /api/projects/my-assignments
      const response = await api.get('/projects/my-assignments');
      return response.data;
    } catch (error) {
      console.error('Error fetching assigned projects:', error);
      // Return a consistent structure on error to avoid breaking components
      return { success: false, message: error.response?.data?.message || error.message || 'Failed to fetch assigned projects', data: { projects: [] } };
      // Or re-throw if you handle errors higher up:
      // throw error.response ? error.response.data : error;
    }
  },
  


}

export default projectsAPI

