import api from "./index"

const usersAPI = {
  /**
   * Get all users
   * @returns {Promise} - Response with users data
   */
  getAllUsers: async () => {
    try {
      const response = await api.get("/users")
      return response.data
    } catch (error) {
      console.error("Error fetching users:", error)
      throw error.response ? error.response.data : error
    }
  },

  // Update the getUsersByRole function to better handle the API response structure
  getUsersByRole: async (role) => {
    try {
      const response = await api.get("/users")
      console.log("All users response:", response.data)

      // Check the structure of the response and adjust accordingly
      const users = response.data.data?.users || response.data.data || []

      // Filter users by role on the client side
      const filteredUsers = users.filter((user) => user.role === role)
      console.log(`Filtered ${role} users:`, filteredUsers)

      return {
        success: true,
        data: {
          users: filteredUsers,
        },
      }
    } catch (error) {
      console.error(`Error fetching ${role} users:`, error)
      throw error.response ? error.response.data : error
    }
  },

  /**
   * Get user by ID
   * @param {string} id - User ID
   * @returns {Promise} - Response with user data
   */
  getUserById: async (id) => {
    try {
      const response = await api.get(`/users/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error)
      throw error.response ? error.response.data : error
    }
  },
}

export default usersAPI

