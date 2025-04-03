

// src/api/users.js
import api from "./index"
import authAPI from "./auth" // Import authAPI to potentially update localStorage

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

  // Keep your existing getUsersByRole if it works for you
  getUsersByRole: async (role) => {
    try {
      // Fetching all and filtering client-side might be inefficient for many users.
      // Consider a backend endpoint like GET /users?role=contractor if possible.
      const response = await api.get("/users")
      console.log("All users response:", response.data)
      const users = response.data.data?.users || response.data.data || []
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

  // --- NEW FUNCTIONS ---

  /**
   * Update the profile details of the currently logged-in user
   * @param {Object} profileData - Data containing fields like firstName, lastName, email, phone
   * @returns {Promise} - Response with updated user data
   */
  updateMyProfile: async (profileData) => {
    try {
      // Using PATCH is often preferred for partial updates
      // The backend should identify the user from the JWT token
      const response = await api.patch("/users/updateme", profileData) // Endpoint assumes backend uses token to ID user

      // If successful, update the user data in localStorage
      if (response.data.success && response.data.data) {
        const updatedUser = response.data.data // Assuming backend returns the updated user document
        // Merge with existing data in case backend doesn't return everything
        const currentUser = authAPI.getCurrentUser()
        const finalUser = { ...currentUser, ...updatedUser }
        localStorage.setItem("wku_cms_user", JSON.stringify(finalUser))
        console.log("User profile updated in localStorage.")
      }

      return response.data
    } catch (error) {
      console.error("Error updating profile:", error)
      throw error.response ? error.response.data : error
    }
  },

  /**
   * Update the password for the currently logged-in user
   * @param {Object} passwordData - Object containing currentPassword, newPassword
   * @returns {Promise} - Response indicating success or failure
   */
  updateMyPassword: async (passwordData) => {
    try {
      // Endpoint assumes backend uses token to ID user and verifies currentPassword
      const response = await api.patch("/auth/updatepassword", passwordData)
      // Password update typically doesn't return user data, just success/token
      // No need to update localStorage user object here unless backend sends new data
      return response.data
    } catch (error) {
      console.error("Error updating password:", error)
      throw error.response ? error.response.data : error
    }
  },
  // --- END NEW FUNCTIONS ---
}

export default usersAPI