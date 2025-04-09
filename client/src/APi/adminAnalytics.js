

import api from "./index"

/**
 * @file Admin Analytics API Client
 * @description Provides methods for interacting with the admin analytics endpoints.
 */

// Mock data for fallback when API fails
const MOCK_DASHBOARD_DATA = {
  success: true,
  data: {
    stats: {
      totalUsers: 45,
      totalProjects: 12,
      totalTasks: 124,
      projectsByStatus: [
        { status: "planned", count: 3 },
        { status: "in_progress", count: 5 },
        { status: "completed", count: 2 },
        { status: "on_hold", count: 2 },
      ],
      tasksByStatus: [
        { status: "pending", count: 30 },
        { status: "active", count: 45 },
        { status: "done", count: 40 },
        { status: "blocked", count: 9 },
      ],
    },
  },
}

/**
 * Fetches dashboard overview statistics
 * @param {Object} filters - Optional filters to apply (e.g., { projectStatus: 'in_progress' })
 * @param {boolean} useMockData - Whether to use mock data instead of API call (for debugging)
 * @returns {Promise<Object>} - Response data with dashboard statistics
 * @throws {Error} If the request fails
 */
const getDashboardStats = async (filters = {}, useMockData = false) => {
  // For debugging or when API is down, return mock data
  if (useMockData) {
    console.log("Using mock data for dashboard statistics")
    return MOCK_DASHBOARD_DATA
  }

  try {
    console.log("Fetching admin dashboard statistics with filters:", filters)

    // Create a custom instance with longer timeout
    const response = await api.get("/admin-analytics/overview", {
      params: filters,
      timeout: 120000, // Increase timeout to 120 seconds
    })

    console.log("Admin dashboard statistics fetched successfully:", response.data)
    return response.data
  } catch (error) {
    console.error("Error fetching admin dashboard statistics:", error)

    // Provide more detailed error information
    if (error.code === "ECONNABORTED") {
      console.error("Request timed out. The server took too long to respond.")
      throw new Error(
        "Request timed out. The server took too long to respond. Try using filters to reduce data size or try again later.",
      )
    }

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Server responded with error:", error.response.status, error.response.data)
      throw new Error(`Server error: ${error.response.status} - ${error.response.data.message || "Unknown error"}`)
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received from server")
      throw new Error("No response received from server. Please check your network connection.")
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error setting up request:", error.message)
      throw new Error(`Request setup error: ${error.message}`)
    }
  }
}

/**
 * Format number with commas for better readability
 * @param {number} num - Number to format
 * @returns {string} - Formatted number string
 */
const formatNumber = (num) => {
  if (num === undefined || num === null) return "0"
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

/**
 * Get status badge color
 * @param {string} status - Status value
 * @returns {string} - Tailwind CSS class for badge color
 */
const getStatusBadgeColor = (status) => {
  const statusColors = {
    // Project statuses
    planned: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    on_hold: "bg-red-100 text-red-800",

    // Task statuses
    pending: "bg-yellow-100 text-yellow-800",
    active: "bg-blue-100 text-blue-800",
    done: "bg-green-100 text-green-800",
    blocked: "bg-red-100 text-red-800",
  }
  return statusColors[status] || "bg-gray-100 text-gray-800"
}

/**
 * Format status for display
 * @param {string} status - Status value
 * @returns {string} - Formatted status label
 */
const formatStatus = (status) => {
  if (!status) return "Unknown"
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/**
 * Get chart colors for different statuses
 * @returns {Object} - Object with status colors for charts
 */
const getChartColors = () => {
  return {
    // Project status colors
    planned: "#FBBF24", // yellow-400
    in_progress: "#60A5FA", // blue-400
    completed: "#34D399", // green-400
    on_hold: "#F87171", // red-400

    // Task status colors
    pending: "#FBBF24", // yellow-400
    active: "#60A5FA", // blue-400
    done: "#34D399", // green-400
    blocked: "#F87171", // red-400

    // Default color
    default: "#9CA3AF", // gray-400
  }
}

/**
 * Get all available project statuses
 * @returns {Array} - Array of project status objects
 */
const getProjectStatuses = () => {
  return [
    { value: "planned", label: "Planned" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "on_hold", label: "On Hold" },
  ]
}

/**
 * Get all available task statuses
 * @returns {Array} - Array of task status objects
 */
const getTaskStatuses = () => {
  return [
    { value: "pending", label: "Pending" },
    { value: "active", label: "Active" },
    { value: "done", label: "Done" },
    { value: "blocked", label: "Blocked" },
  ]
}

/**
 * Format date for display
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 */
const formatDate = (date) => {
  if (!date) return ""
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const adminAnalyticsAPI = {
  getDashboardStats,
  formatNumber,
  getStatusBadgeColor,
  formatStatus,
  getChartColors,
  getProjectStatuses,
  getTaskStatuses,
  formatDate,
  MOCK_DASHBOARD_DATA,
}

export default adminAnalyticsAPI
