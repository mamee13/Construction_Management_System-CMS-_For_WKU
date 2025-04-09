// // "use client"

// // import { useState, useRef } from "react"
// // import { useQuery } from "@tanstack/react-query"
// // import { useNavigate } from "react-router-dom"
// // import {
// //   ArrowPathIcon,
// //   UsersIcon,
// //   BuildingOfficeIcon,
// //   ClipboardDocumentListIcon,
// //   ChartPieIcon,
// //   ChartBarIcon,
// //   FunnelIcon,
// //   DocumentArrowDownIcon,
// // } from "@heroicons/react/24/outline"
// // import adminAnalyticsAPI from "../../api/adminAnalytics"
// // import authAPI from "../../api/auth"
// // import { jsPDF } from "jspdf"
// // import html2canvas from "html2canvas"
// // import { toast } from "react-toastify"
// // import "react-toastify/dist/ReactToastify.css"

// // // Import Chart.js components
// // import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from "chart.js"
// // import { Pie, Bar } from "react-chartjs-2"

// // // Register Chart.js components
// // ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

// // const Analytics = () => {
// //   const navigate = useNavigate()
// //   const [refreshInterval, setRefreshInterval] = useState(null)
// //   const [filters, setFilters] = useState({
// //     projectStatus: "",
// //     taskStatus: "",
// //     dateRange: "all", // 'all', 'week', 'month', 'quarter', 'year'
// //   })
// //   const [isExporting, setIsExporting] = useState(false)
// //   const dashboardRef = useRef(null)

// //   // Fetch dashboard statistics with filters
// //   const {
// //     data: statsData,
// //     isLoading,
// //     error,
// //     refetch,
// //   } = useQuery({
// //     queryKey: ["adminDashboardStats", filters],
// //     queryFn: () => adminAnalyticsAPI.getDashboardStats(filters),
// //     refetchInterval: refreshInterval,
// //   })

// //   // Check if user is admin, redirect if not
// //   if (!authAPI.isAdmin()) {
// //     navigate("/dashboard")
// //     return null
// //   }

// //   const stats = statsData?.data?.stats || {
// //     totalUsers: 0,
// //     totalProjects: 0,
// //     totalTasks: 0,
// //     projectsByStatus: [],
// //     tasksByStatus: [],
// //   }

// //   // Prepare data for projects by status pie chart
// //   const projectsChartData = {
// //     labels: stats.projectsByStatus.map((item) => adminAnalyticsAPI.formatStatus(item.status)),
// //     datasets: [
// //       {
// //         data: stats.projectsByStatus.map((item) => item.count),
// //         backgroundColor: stats.projectsByStatus.map(
// //           (item) => adminAnalyticsAPI.getChartColors()[item.status] || adminAnalyticsAPI.getChartColors().default,
// //         ),
// //         borderWidth: 1,
// //       },
// //     ],
// //   }

// //   // Prepare data for tasks by status bar chart
// //   const tasksChartData = {
// //     labels: stats.tasksByStatus.map((item) => adminAnalyticsAPI.formatStatus(item.status)),
// //     datasets: [
// //       {
// //         label: "Number of Tasks",
// //         data: stats.tasksByStatus.map((item) => item.count),
// //         backgroundColor: stats.tasksByStatus.map(
// //           (item) => adminAnalyticsAPI.getChartColors()[item.status] || adminAnalyticsAPI.getChartColors().default,
// //         ),
// //         borderWidth: 1,
// //       },
// //     ],
// //   }

// //   // Chart options
// //   const pieChartOptions = {
// //     responsive: true,
// //     plugins: {
// //       legend: {
// //         position: "bottom",
// //       },
// //       title: {
// //         display: true,
// //         text: "Projects by Status",
// //         font: {
// //           size: 16,
// //         },
// //       },
// //     },
// //   }

// //   const barChartOptions = {
// //     responsive: true,
// //     plugins: {
// //       legend: {
// //         position: "top",
// //       },
// //       title: {
// //         display: true,
// //         text: "Tasks by Status",
// //         font: {
// //           size: 16,
// //         },
// //       },
// //     },
// //     scales: {
// //       y: {
// //         beginAtZero: true,
// //         ticks: {
// //           precision: 0,
// //         },
// //       },
// //     },
// //   }

// //   // Toggle auto-refresh
// //   const toggleAutoRefresh = () => {
// //     if (refreshInterval) {
// //       setRefreshInterval(null)
// //     } else {
// //       setRefreshInterval(30000) // Refresh every 30 seconds
// //     }
// //   }

// //   // Handle filter changes
// //   const handleFilterChange = (e) => {
// //     const { name, value } = e.target
// //     setFilters((prev) => ({
// //       ...prev,
// //       [name]: value,
// //     }))
// //   }

// //   // Reset filters
// //   const resetFilters = () => {
// //     setFilters({
// //       projectStatus: "",
// //       taskStatus: "",
// //       dateRange: "all",
// //     })
// //   }

// //   // Export dashboard to PDF
// //   const exportToPDF = async () => {
// //     if (!dashboardRef.current) return

// //     setIsExporting(true)
// //     try {
// //       const dashboard = dashboardRef.current
// //       const canvas = await html2canvas(dashboard, {
// //         scale: 2, // Higher scale for better quality
// //         useCORS: true, // Enable CORS for images
// //         logging: false,
// //       })

// //       const imgData = canvas.toDataURL("image/png")
// //       const pdf = new jsPDF({
// //         orientation: "portrait",
// //         unit: "mm",
// //         format: "a4",
// //       })

// //       // Calculate dimensions to fit the dashboard in the PDF
// //       const imgWidth = 210 // A4 width in mm
// //       const imgHeight = (canvas.height * imgWidth) / canvas.width

// //       // Add title
// //       pdf.setFontSize(18)
// //       pdf.text("WKU Construction Management System - Analytics Dashboard", 105, 15, { align: "center" })

// //       // Add timestamp
// //       pdf.setFontSize(10)
// //       pdf.text(`Generated on: ${adminAnalyticsAPI.formatDate(new Date())}`, 105, 22, { align: "center" })

// //       // Add filters info if any filters are applied
// //       if (filters.projectStatus || filters.taskStatus || filters.dateRange !== "all") {
// //         pdf.setFontSize(10)
// //         let filterText = "Filters applied: "
// //         if (filters.projectStatus) {
// //           filterText += `Project Status: ${adminAnalyticsAPI.formatStatus(filters.projectStatus)}, `
// //         }
// //         if (filters.taskStatus) {
// //           filterText += `Task Status: ${adminAnalyticsAPI.formatStatus(filters.taskStatus)}, `
// //         }
// //         if (filters.dateRange !== "all") {
// //           filterText += `Date Range: ${filters.dateRange.charAt(0).toUpperCase() + filters.dateRange.slice(1)}`
// //         }
// //         pdf.text(filterText, 105, 28, { align: "center" })
// //       }

// //       // Add the dashboard image
// //       pdf.addImage(imgData, "PNG", 0, 35, imgWidth, imgHeight)

// //       // Save the PDF
// //       pdf.save("wku-cms-analytics-dashboard.pdf")
// //     } catch (err) {
// //       console.error("Error exporting to PDF:", err)
// //       toast.error("Failed to export dashboard to PDF")
// //     } finally {
// //       setIsExporting(false)
// //     }
// //   }

// //   return (
// //     <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
// //       <div className="sm:flex sm:items-center sm:justify-between mb-8">
// //         <div>
// //           <h1 className="text-3xl font-bold text-gray-900 mb-1">Analytics Dashboard</h1>
// //           <p className="text-gray-500 text-sm">Overview of system statistics, project status, and task distribution.</p>
// //         </div>
// //         <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
// //           <button
// //             type="button"
// //             onClick={toggleAutoRefresh}
// //             className={`inline-flex items-center px-4 py-2 border ${
// //               refreshInterval
// //                 ? "border-red-300 text-red-700 bg-red-50 hover:bg-red-100"
// //                 : "border-green-300 text-green-700 bg-green-50 hover:bg-green-100"
// //             } rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
// //           >
// //             <ArrowPathIcon className={`h-5 w-5 mr-2 ${refreshInterval ? "animate-spin" : ""}`} />
// //             {refreshInterval ? "Auto-refresh On" : "Auto-refresh Off"}
// //           </button>
// //           <button
// //             type="button"
// //             onClick={() => refetch()}
// //             className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
// //           >
// //             <ArrowPathIcon className="h-5 w-5 mr-2" />
// //             Refresh Now
// //           </button>
// //           <button
// //             type="button"
// //             onClick={exportToPDF}
// //             disabled={isExporting}
// //             className="inline-flex items-center px-4 py-2 border border-indigo-600 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
// //           >
// //             <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
// //             {isExporting ? "Exporting..." : "Export to PDF"}
// //           </button>
// //         </div>
// //       </div>

// //       {/* Filters Section */}
// //       <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
// //         <div className="px-4 py-5 sm:p-6">
// //           <div className="flex items-center mb-4">
// //             <FunnelIcon className="h-5 w-5 text-indigo-500 mr-2" />
// //             <h2 className="text-lg font-medium text-gray-900">Filters</h2>
// //           </div>
// //           <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
// //             {/* Project Status Filter */}
// //             <div>
// //               <label htmlFor="projectStatus" className="block text-sm font-medium text-gray-700 mb-1">
// //                 Project Status
// //               </label>
// //               <select
// //                 id="projectStatus"
// //                 name="projectStatus"
// //                 value={filters.projectStatus}
// //                 onChange={handleFilterChange}
// //                 className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
// //               >
// //                 <option value="">All Project Statuses</option>
// //                 {adminAnalyticsAPI.getProjectStatuses().map((status) => (
// //                   <option key={status.value} value={status.value}>
// //                     {status.label}
// //                   </option>
// //                 ))}
// //               </select>
// //             </div>

// //             {/* Task Status Filter */}
// //             <div>
// //               <label htmlFor="taskStatus" className="block text-sm font-medium text-gray-700 mb-1">
// //                 Task Status
// //               </label>
// //               <select
// //                 id="taskStatus"
// //                 name="taskStatus"
// //                 value={filters.taskStatus}
// //                 onChange={handleFilterChange}
// //                 className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
// //               >
// //                 <option value="">All Task Statuses</option>
// //                 {adminAnalyticsAPI.getTaskStatuses().map((status) => (
// //                   <option key={status.value} value={status.value}>
// //                     {status.label}
// //                   </option>
// //                 ))}
// //               </select>
// //             </div>

// //             {/* Date Range Filter */}
// //             <div>
// //               <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1">
// //                 Date Range
// //               </label>
// //               <select
// //                 id="dateRange"
// //                 name="dateRange"
// //                 value={filters.dateRange}
// //                 onChange={handleFilterChange}
// //                 className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
// //               >
// //                 <option value="all">All Time</option>
// //                 <option value="week">Last Week</option>
// //                 <option value="month">Last Month</option>
// //                 <option value="quarter">Last Quarter</option>
// //                 <option value="year">Last Year</option>
// //               </select>
// //             </div>

// //             {/* Reset Filters Button */}
// //             <div className="flex items-end">
// //               <button
// //                 type="button"
// //                 onClick={resetFilters}
// //                 className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
// //               >
// //                 Reset Filters
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       {isLoading ? (
// //         <div className="text-center py-20 bg-white shadow rounded-lg">
// //           <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
// //           <p className="mt-2 text-gray-500">Loading analytics data...</p>
// //         </div>
// //       ) : error ? (
// //         <div className="text-center py-20 bg-white shadow rounded-lg">
// //           <p className="text-red-500">Failed to load analytics data: {error.message}</p>
// //           <button
// //             onClick={() => refetch()}
// //             className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
// //           >
// //             <ArrowPathIcon className="h-5 w-5 mr-2" />
// //             Retry
// //           </button>
// //         </div>
// //       ) : (
// //         <div ref={dashboardRef}>
// //           {/* Summary Cards */}
// //           <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
// //             {/* Users Card */}
// //             <div className="bg-white overflow-hidden shadow rounded-lg">
// //               <div className="p-5">
// //                 <div className="flex items-center">
// //                   <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
// //                     <UsersIcon className="h-6 w-6 text-white" />
// //                   </div>
// //                   <div className="ml-5 w-0 flex-1">
// //                     <dl>
// //                       <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
// //                       <dd>
// //                         <div className="text-lg font-medium text-gray-900">
// //                           {adminAnalyticsAPI.formatNumber(stats.totalUsers)}
// //                         </div>
// //                       </dd>
// //                     </dl>
// //                   </div>
// //                 </div>
// //               </div>
// //               <div className="bg-gray-50 px-5 py-3">
// //                 <div className="text-sm">
// //                   <a href="/admin/users" className="font-medium text-indigo-600 hover:text-indigo-500">
// //                     View all users
// //                   </a>
// //                 </div>
// //               </div>
// //             </div>

// //             {/* Projects Card */}
// //             <div className="bg-white overflow-hidden shadow rounded-lg">
// //               <div className="p-5">
// //                 <div className="flex items-center">
// //                   <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
// //                     <BuildingOfficeIcon className="h-6 w-6 text-white" />
// //                   </div>
// //                   <div className="ml-5 w-0 flex-1">
// //                     <dl>
// //                       <dt className="text-sm font-medium text-gray-500 truncate">Total Projects</dt>
// //                       <dd>
// //                         <div className="text-lg font-medium text-gray-900">
// //                           {adminAnalyticsAPI.formatNumber(stats.totalProjects)}
// //                         </div>
// //                       </dd>
// //                     </dl>
// //                   </div>
// //                 </div>
// //               </div>
// //               <div className="bg-gray-50 px-5 py-3">
// //                 <div className="text-sm">
// //                   <a href="/admin/projects" className="font-medium text-indigo-600 hover:text-indigo-500">
// //                     View all projects
// //                   </a>
// //                 </div>
// //               </div>
// //             </div>

// //             {/* Tasks Card */}
// //             <div className="bg-white overflow-hidden shadow rounded-lg">
// //               <div className="p-5">
// //                 <div className="flex items-center">
// //                   <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
// //                     <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
// //                   </div>
// //                   <div className="ml-5 w-0 flex-1">
// //                     <dl>
// //                       <dt className="text-sm font-medium text-gray-500 truncate">Total Tasks</dt>
// //                       <dd>
// //                         <div className="text-lg font-medium text-gray-900">
// //                           {adminAnalyticsAPI.formatNumber(stats.totalTasks)}
// //                         </div>
// //                       </dd>
// //                     </dl>
// //                   </div>
// //                 </div>
// //               </div>
// //               <div className="bg-gray-50 px-5 py-3">
// //                 <div className="text-sm">
// //                   <a href="/admin/tasks" className="font-medium text-indigo-600 hover:text-indigo-500">
// //                     View all tasks
// //                   </a>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>

// //           {/* Charts Section */}
// //           <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
// //             {/* Projects by Status Chart */}
// //             <div className="bg-white p-6 rounded-lg shadow">
// //               <div className="flex items-center justify-between mb-4">
// //                 <h2 className="text-lg font-medium text-gray-900 flex items-center">
// //                   <ChartPieIcon className="h-5 w-5 mr-2 text-indigo-500" />
// //                   Projects by Status
// //                 </h2>
// //               </div>
// //               <div className="h-64">
// //                 {stats.projectsByStatus.length > 0 ? (
// //                   <Pie data={projectsChartData} options={pieChartOptions} />
// //                 ) : (
// //                   <div className="flex h-full items-center justify-center">
// //                     <p className="text-gray-500">No project data available</p>
// //                   </div>
// //                 )}
// //               </div>
// //               <div className="mt-4">
// //                 <h3 className="text-sm font-medium text-gray-500 mb-2">Status Breakdown</h3>
// //                 <div className="grid grid-cols-2 gap-2">
// //                   {stats.projectsByStatus.map((item) => (
// //                     <div key={item.status} className="flex items-center">
// //                       <span
// //                         className={`inline-block w-3 h-3 rounded-full mr-2`}
// //                         style={{
// //                           backgroundColor:
// //                             adminAnalyticsAPI.getChartColors()[item.status] ||
// //                             adminAnalyticsAPI.getChartColors().default,
// //                         }}
// //                       ></span>
// //                       <span className="text-sm text-gray-600">
// //                         {adminAnalyticsAPI.formatStatus(item.status)}: {item.count}
// //                       </span>
// //                     </div>
// //                   ))}
// //                 </div>
// //               </div>
// //             </div>

// //             {/* Tasks by Status Chart */}
// //             <div className="bg-white p-6 rounded-lg shadow">
// //               <div className="flex items-center justify-between mb-4">
// //                 <h2 className="text-lg font-medium text-gray-900 flex items-center">
// //                   <ChartBarIcon className="h-5 w-5 mr-2 text-indigo-500" />
// //                   Tasks by Status
// //                 </h2>
// //               </div>
// //               <div className="h-64">
// //                 {stats.tasksByStatus.length > 0 ? (
// //                   <Bar data={tasksChartData} options={barChartOptions} />
// //                 ) : (
// //                   <div className="flex h-full items-center justify-center">
// //                     <p className="text-gray-500">No task data available</p>
// //                   </div>
// //                 )}
// //               </div>
// //               <div className="mt-4">
// //                 <h3 className="text-sm font-medium text-gray-500 mb-2">Status Breakdown</h3>
// //                 <div className="grid grid-cols-2 gap-2">
// //                   {stats.tasksByStatus.map((item) => (
// //                     <div key={item.status} className="flex items-center">
// //                       <span
// //                         className={`inline-block w-3 h-3 rounded-full mr-2`}
// //                         style={{
// //                           backgroundColor:
// //                             adminAnalyticsAPI.getChartColors()[item.status] ||
// //                             adminAnalyticsAPI.getChartColors().default,
// //                         }}
// //                       ></span>
// //                       <span className="text-sm text-gray-600">
// //                         {adminAnalyticsAPI.formatStatus(item.status)}: {item.count}
// //                       </span>
// //                     </div>
// //                   ))}
// //                 </div>
// //               </div>
// //             </div>
// //           </div>

// //           {/* Detailed Statistics Section */}
// //           <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
// //             <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
// //               <h3 className="text-lg leading-6 font-medium text-gray-900">Detailed Statistics</h3>
// //               <p className="mt-1 max-w-2xl text-sm text-gray-500">
// //                 Breakdown of projects and tasks by their current status.
// //               </p>
// //             </div>
// //             <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
// //               <div className="grid grid-cols-1 gap-y-8 gap-x-4 sm:grid-cols-2">
// //                 {/* Projects by Status */}
// //                 <div>
// //                   <h4 className="text-base font-medium text-gray-900 mb-4">Projects by Status</h4>
// //                   <div className="space-y-4">
// //                     {stats.projectsByStatus.map((item) => (
// //                       <div key={item.status} className="flex items-center">
// //                         <span
// //                           className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${adminAnalyticsAPI.getStatusBadgeColor(
// //                             item.status,
// //                           )}`}
// //                         >
// //                           {adminAnalyticsAPI.formatStatus(item.status)}
// //                         </span>
// //                         <div className="ml-4 flex-1">
// //                           <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
// //                             <div
// //                               className="absolute h-full rounded-full"
// //                               style={{
// //                                 width: `${(item.count / stats.totalProjects) * 100}%`,
// //                                 backgroundColor:
// //                                   adminAnalyticsAPI.getChartColors()[item.status] ||
// //                                   adminAnalyticsAPI.getChartColors().default,
// //                               }}
// //                             ></div>
// //                           </div>
// //                         </div>
// //                         <span className="ml-2 text-sm font-medium text-gray-700">
// //                           {item.count} ({((item.count / stats.totalProjects) * 100).toFixed(1)}%)
// //                         </span>
// //                       </div>
// //                     ))}
// //                   </div>
// //                 </div>

// //                 {/* Tasks by Status */}
// //                 <div>
// //                   <h4 className="text-base font-medium text-gray-900 mb-4">Tasks by Status</h4>
// //                   <div className="space-y-4">
// //                     {stats.tasksByStatus.map((item) => (
// //                       <div key={item.status} className="flex items-center">
// //                         <span
// //                           className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${adminAnalyticsAPI.getStatusBadgeColor(
// //                             item.status,
// //                           )}`}
// //                         >
// //                           {adminAnalyticsAPI.formatStatus(item.status)}
// //                         </span>
// //                         <div className="ml-4 flex-1">
// //                           <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
// //                             <div
// //                               className="absolute h-full rounded-full"
// //                               style={{
// //                                 width: `${(item.count / stats.totalTasks) * 100}%`,
// //                                 backgroundColor:
// //                                   adminAnalyticsAPI.getChartColors()[item.status] ||
// //                                   adminAnalyticsAPI.getChartColors().default,
// //                               }}
// //                             ></div>
// //                           </div>
// //                         </div>
// //                         <span className="ml-2 text-sm font-medium text-gray-700">
// //                           {item.count} ({((item.count / stats.totalTasks) * 100).toFixed(1)}%)
// //                         </span>
// //                       </div>
// //                     ))}
// //                   </div>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   )
// // }

// // export default Analytics;

// "use client"

// import { useState, useRef, useEffect } from "react"
// import { useQuery } from "@tanstack/react-query"
// import { useNavigate } from "react-router-dom"
// import {
//   ArrowPathIcon,
//   UsersIcon,
//   BuildingOfficeIcon,
//   ClipboardDocumentListIcon,
//   ChartPieIcon,
//   ChartBarIcon,
//   FunnelIcon,
//   DocumentArrowDownIcon,
//   ExclamationTriangleIcon,
// } from "@heroicons/react/24/outline"
// import adminAnalyticsAPI from "../../api/adminAnalytics"
// import authAPI from "../../api/auth"
// import { jsPDF } from "jspdf"
// import html2canvas from "html2canvas"
// import { toast } from "react-toastify"
// import "react-toastify/dist/ReactToastify.css"

// // Import Chart.js components
// import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from "chart.js"
// import { Pie, Bar } from "react-chartjs-2"

// // Register Chart.js components
// ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

// const Analytics = () => {
//   const navigate = useNavigate()
//   const [refreshInterval, setRefreshInterval] = useState(null)
//   const [filters, setFilters] = useState({
//     projectStatus: "",
//     taskStatus: "",
//     dateRange: "all", // 'all', 'week', 'month', 'quarter', 'year'
//   })
//   const [isExporting, setIsExporting] = useState(false)
//   const [useMockData, setUseMockData] = useState(false)
//   const [retryCount, setRetryCount] = useState(0)
//   const dashboardRef = useRef(null)

//   // Fetch dashboard statistics with filters
//   const {
//     data: statsData,
//     isLoading,
//     error,
//     refetch,
//   } = useQuery({
//     queryKey: ["adminDashboardStats", filters, useMockData, retryCount],
//     queryFn: () => adminAnalyticsAPI.getDashboardStats(filters, useMockData),
//     refetchInterval: refreshInterval,
//     retry: 1, // Only retry once automatically
//     onError: (error) => {
//       // Show toast notification on error
//       toast.error(`Failed to load analytics data: ${error.message}`)
//     },
//   })

//   // Check if user is admin, redirect if not
//   useEffect(() => {
//     if (!authAPI.isAdmin()) {
//       navigate("/dashboard")
//     }
//   }, [navigate])

//   const stats = statsData?.data?.stats || {
//     totalUsers: 0,
//     totalProjects: 0,
//     totalTasks: 0,
//     projectsByStatus: [],
//     tasksByStatus: [],
//   }

//   // Prepare data for projects by status pie chart
//   const projectsChartData = {
//     labels: stats.projectsByStatus.map((item) => adminAnalyticsAPI.formatStatus(item.status)),
//     datasets: [
//       {
//         data: stats.projectsByStatus.map((item) => item.count),
//         backgroundColor: stats.projectsByStatus.map(
//           (item) => adminAnalyticsAPI.getChartColors()[item.status] || adminAnalyticsAPI.getChartColors().default,
//         ),
//         borderWidth: 1,
//       },
//     ],
//   }

//   // Prepare data for tasks by status bar chart
//   const tasksChartData = {
//     labels: stats.tasksByStatus.map((item) => adminAnalyticsAPI.formatStatus(item.status)),
//     datasets: [
//       {
//         label: "Number of Tasks",
//         data: stats.tasksByStatus.map((item) => item.count),
//         backgroundColor: stats.tasksByStatus.map(
//           (item) => adminAnalyticsAPI.getChartColors()[item.status] || adminAnalyticsAPI.getChartColors().default,
//         ),
//         borderWidth: 1,
//       },
//     ],
//   }

//   // Chart options
//   const pieChartOptions = {
//     responsive: true,
//     plugins: {
//       legend: {
//         position: "bottom",
//       },
//       title: {
//         display: true,
//         text: "Projects by Status",
//         font: {
//           size: 16,
//         },
//       },
//     },
//   }

//   const barChartOptions = {
//     responsive: true,
//     plugins: {
//       legend: {
//         position: "top",
//       },
//       title: {
//         display: true,
//         text: "Tasks by Status",
//         font: {
//           size: 16,
//         },
//       },
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//         ticks: {
//           precision: 0,
//         },
//       },
//     },
//   }

//   // Toggle auto-refresh
//   const toggleAutoRefresh = () => {
//     if (refreshInterval) {
//       setRefreshInterval(null)
//     } else {
//       setRefreshInterval(30000) // Refresh every 30 seconds
//     }
//   }

//   // Handle filter changes
//   const handleFilterChange = (e) => {
//     const { name, value } = e.target
//     setFilters((prev) => ({
//       ...prev,
//       [name]: value,
//     }))
//   }

//   // Reset filters
//   const resetFilters = () => {
//     setFilters({
//       projectStatus: "",
//       taskStatus: "",
//       dateRange: "all",
//     })
//   }

//   // Toggle between real and mock data
//   const toggleMockData = () => {
//     setUseMockData(!useMockData)
//     if (!useMockData) {
//       toast.info("Using mock data. This is for testing purposes only.")
//     } else {
//       toast.info("Using real API data.")
//     }
//   }

//   // Manual retry with incremented counter
//   const handleRetry = () => {
//     setRetryCount((prev) => prev + 1)
//     refetch()
//   }

//   // Export dashboard to PDF
//   const exportToPDF = async () => {
//     if (!dashboardRef.current) return

//     setIsExporting(true)
//     try {
//       const dashboard = dashboardRef.current
//       const canvas = await html2canvas(dashboard, {
//         scale: 2, // Higher scale for better quality
//         useCORS: true, // Enable CORS for images
//         logging: false,
//       })

//       const imgData = canvas.toDataURL("image/png")
//       const pdf = new jsPDF({
//         orientation: "portrait",
//         unit: "mm",
//         format: "a4",
//       })

//       // Calculate dimensions to fit the dashboard in the PDF
//       const imgWidth = 210 // A4 width in mm
//       const imgHeight = (canvas.height * imgWidth) / canvas.width

//       // Add title
//       pdf.setFontSize(18)
//       pdf.text("WKU Construction Management System - Analytics Dashboard", 105, 15, { align: "center" })

//       // Add timestamp
//       pdf.setFontSize(10)
//       pdf.text(`Generated on: ${adminAnalyticsAPI.formatDate(new Date())}`, 105, 22, { align: "center" })

//       // Add filters info if any filters are applied
//       if (filters.projectStatus || filters.taskStatus || filters.dateRange !== "all") {
//         pdf.setFontSize(10)
//         let filterText = "Filters applied: "
//         if (filters.projectStatus) {
//           filterText += `Project Status: ${adminAnalyticsAPI.formatStatus(filters.projectStatus)}, `
//         }
//         if (filters.taskStatus) {
//           filterText += `Task Status: ${adminAnalyticsAPI.formatStatus(filters.taskStatus)}, `
//         }
//         if (filters.dateRange !== "all") {
//           filterText += `Date Range: ${filters.dateRange.charAt(0).toUpperCase() + filters.dateRange.slice(1)}`
//         }
//         pdf.text(filterText, 105, 28, { align: "center" })
//       }

//       // Add the dashboard image
//       pdf.addImage(imgData, "PNG", 0, 35, imgWidth, imgHeight)

//       // Save the PDF
//       pdf.save("wku-cms-analytics-dashboard.pdf")
//       toast.success("Dashboard exported to PDF successfully")
//     } catch (err) {
//       console.error("Error exporting to PDF:", err)
//       toast.error("Failed to export dashboard to PDF: " + err.message)
//     } finally {
//       setIsExporting(false)
//     }
//   }

//   if (!authAPI.isAdmin()) {
//     return null // Already handled by useEffect
//   }

//   return (
//     <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
//       <div className="sm:flex sm:items-center sm:justify-between mb-8">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900 mb-1">Analytics Dashboard</h1>
//           <p className="text-gray-500 text-sm">Overview of system statistics, project status, and task distribution.</p>
//         </div>
//         <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
//           <button
//             type="button"
//             onClick={toggleAutoRefresh}
//             className={`inline-flex items-center px-4 py-2 border ${
//               refreshInterval
//                 ? "border-red-300 text-red-700 bg-red-50 hover:bg-red-100"
//                 : "border-green-300 text-green-700 bg-green-50 hover:bg-green-100"
//             } rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
//           >
//             <ArrowPathIcon className={`h-5 w-5 mr-2 ${refreshInterval ? "animate-spin" : ""}`} />
//             {refreshInterval ? "Auto-refresh On" : "Auto-refresh Off"}
//           </button>
//           <button
//             type="button"
//             onClick={refetch}
//             className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//           >
//             <ArrowPathIcon className="h-5 w-5 mr-2" />
//             Refresh Now
//           </button>
//           <button
//             type="button"
//             onClick={exportToPDF}
//             disabled={isExporting || isLoading || !!error}
//             className="inline-flex items-center px-4 py-2 border border-indigo-600 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
//             {isExporting ? "Exporting..." : "Export to PDF"}
//           </button>
//         </div>
//       </div>

//       {/* Filters Section */}
//       <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
//         <div className="px-4 py-5 sm:p-6">
//           <div className="flex items-center mb-4">
//             <FunnelIcon className="h-5 w-5 text-indigo-500 mr-2" />
//             <h2 className="text-lg font-medium text-gray-900">Filters</h2>
//           </div>
//           <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
//             {/* Project Status Filter */}
//             <div>
//               <label htmlFor="projectStatus" className="block text-sm font-medium text-gray-700 mb-1">
//                 Project Status
//               </label>
//               <select
//                 id="projectStatus"
//                 name="projectStatus"
//                 value={filters.projectStatus}
//                 onChange={handleFilterChange}
//                 className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
//               >
//                 <option value="">All Project Statuses</option>
//                 {adminAnalyticsAPI.getProjectStatuses().map((status) => (
//                   <option key={status.value} value={status.value}>
//                     {status.label}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Task Status Filter */}
//             <div>
//               <label htmlFor="taskStatus" className="block text-sm font-medium text-gray-700 mb-1">
//                 Task Status
//               </label>
//               <select
//                 id="taskStatus"
//                 name="taskStatus"
//                 value={filters.taskStatus}
//                 onChange={handleFilterChange}
//                 className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
//               >
//                 <option value="">All Task Statuses</option>
//                 {adminAnalyticsAPI.getTaskStatuses().map((status) => (
//                   <option key={status.value} value={status.value}>
//                     {status.label}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Date Range Filter */}
//             <div>
//               <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1">
//                 Date Range
//               </label>
//               <select
//                 id="dateRange"
//                 name="dateRange"
//                 value={filters.dateRange}
//                 onChange={handleFilterChange}
//                 className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
//               >
//                 <option value="all">All Time</option>
//                 <option value="week">Last Week</option>
//                 <option value="month">Last Month</option>
//                 <option value="quarter">Last Quarter</option>
//                 <option value="year">Last Year</option>
//               </select>
//             </div>

//             {/* Reset Filters Button */}
//             <div className="flex items-end">
//               <button
//                 type="button"
//                 onClick={resetFilters}
//                 className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//               >
//                 Reset Filters
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Error Banner */}
//       {error && (
//         <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 rounded-md">
//           <div className="flex">
//             <div className="flex-shrink-0">
//               <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
//             </div>
//             <div className="ml-3">
//               <p className="text-sm text-yellow-700">
//                 <strong>Connection issue detected:</strong> {error.message}
//               </p>
//               <div className="mt-4 flex space-x-3">
//                 <button
//                   type="button"
//                   onClick={handleRetry}
//                   className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//                 >
//                   <ArrowPathIcon className="h-4 w-4 mr-1" />
//                   Retry
//                 </button>
//                 <button
//                   type="button"
//                   onClick={toggleMockData}
//                   className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
//                 >
//                   Use {useMockData ? "Real Data" : "Mock Data"}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {isLoading ? (
//         <div className="text-center py-20 bg-white shadow rounded-lg">
//           <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
//           <p className="mt-2 text-gray-500">Loading analytics data...</p>
//         </div>
//       ) : (
//         <div ref={dashboardRef}>
//           {/* Summary Cards */}
//           <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
//             {/* Users Card */}
//             <div className="bg-white overflow-hidden shadow rounded-lg">
//               <div className="p-5">
//                 <div className="flex items-center">
//                   <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
//                     <UsersIcon className="h-6 w-6 text-white" />
//                   </div>
//                   <div className="ml-5 w-0 flex-1">
//                     <dl>
//                       <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
//                       <dd>
//                         <div className="text-lg font-medium text-gray-900">
//                           {adminAnalyticsAPI.formatNumber(stats.totalUsers)}
//                         </div>
//                       </dd>
//                     </dl>
//                   </div>
//                 </div>
//               </div>
//               <div className="bg-gray-50 px-5 py-3">
//                 <div className="text-sm">
//                   <a href="/admin/users" className="font-medium text-indigo-600 hover:text-indigo-500">
//                     View all users
//                   </a>
//                 </div>
//               </div>
//             </div>

//             {/* Projects Card */}
//             <div className="bg-white overflow-hidden shadow rounded-lg">
//               <div className="p-5">
//                 <div className="flex items-center">
//                   <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
//                     <BuildingOfficeIcon className="h-6 w-6 text-white" />
//                   </div>
//                   <div className="ml-5 w-0 flex-1">
//                     <dl>
//                       <dt className="text-sm font-medium text-gray-500 truncate">Total Projects</dt>
//                       <dd>
//                         <div className="text-lg font-medium text-gray-900">
//                           {adminAnalyticsAPI.formatNumber(stats.totalProjects)}
//                         </div>
//                       </dd>
//                     </dl>
//                   </div>
//                 </div>
//               </div>
//               <div className="bg-gray-50 px-5 py-3">
//                 <div className="text-sm">
//                   <a href="/admin/projects" className="font-medium text-indigo-600 hover:text-indigo-500">
//                     View all projects
//                   </a>
//                 </div>
//               </div>
//             </div>

//             {/* Tasks Card */}
//             <div className="bg-white overflow-hidden shadow rounded-lg">
//               <div className="p-5">
//                 <div className="flex items-center">
//                   <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
//                     <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
//                   </div>
//                   <div className="ml-5 w-0 flex-1">
//                     <dl>
//                       <dt className="text-sm font-medium text-gray-500 truncate">Total Tasks</dt>
//                       <dd>
//                         <div className="text-lg font-medium text-gray-900">
//                           {adminAnalyticsAPI.formatNumber(stats.totalTasks)}
//                         </div>
//                       </dd>
//                     </dl>
//                   </div>
//                 </div>
//               </div>
//               <div className="bg-gray-50 px-5 py-3">
//                 <div className="text-sm">
//                   <a href="/admin/tasks" className="font-medium text-indigo-600 hover:text-indigo-500">
//                     View all tasks
//                   </a>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Charts Section */}
//           <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
//             {/* Projects by Status Chart */}
//             <div className="bg-white p-6 rounded-lg shadow">
//               <div className="flex items-center justify-between mb-4">
//                 <h2 className="text-lg font-medium text-gray-900 flex items-center">
//                   <ChartPieIcon className="h-5 w-5 mr-2 text-indigo-500" />
//                   Projects by Status
//                 </h2>
//               </div>
//               <div className="h-64">
//                 {stats.projectsByStatus.length > 0 ? (
//                   <Pie data={projectsChartData} options={pieChartOptions} />
//                 ) : (
//                   <div className="flex h-full items-center justify-center">
//                     <p className="text-gray-500">No project data available</p>
//                   </div>
//                 )}
//               </div>
//               <div className="mt-4">
//                 <h3 className="text-sm font-medium text-gray-500 mb-2">Status Breakdown</h3>
//                 <div className="grid grid-cols-2 gap-2">
//                   {stats.projectsByStatus.map((item) => (
//                     <div key={item.status} className="flex items-center">
//                       <span
//                         className={`inline-block w-3 h-3 rounded-full mr-2`}
//                         style={{
//                           backgroundColor:
//                             adminAnalyticsAPI.getChartColors()[item.status] ||
//                             adminAnalyticsAPI.getChartColors().default,
//                         }}
//                       ></span>
//                       <span className="text-sm text-gray-600">
//                         {adminAnalyticsAPI.formatStatus(item.status)}: {item.count}
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>

//             {/* Tasks by Status Chart */}
//             <div className="bg-white p-6 rounded-lg shadow">
//               <div className="flex items-center justify-between mb-4">
//                 <h2 className="text-lg font-medium text-gray-900 flex items-center">
//                   <ChartBarIcon className="h-5 w-5 mr-2 text-indigo-500" />
//                   Tasks by Status
//                 </h2>
//               </div>
//               <div className="h-64">
//                 {stats.tasksByStatus.length > 0 ? (
//                   <Bar data={tasksChartData} options={barChartOptions} />
//                 ) : (
//                   <div className="flex h-full items-center justify-center">
//                     <p className="text-gray-500">No task data available</p>
//                   </div>
//                 )}
//               </div>
//               <div className="mt-4">
//                 <h3 className="text-sm font-medium text-gray-500 mb-2">Status Breakdown</h3>
//                 <div className="grid grid-cols-2 gap-2">
//                   {stats.tasksByStatus.map((item) => (
//                     <div key={item.status} className="flex items-center">
//                       <span
//                         className={`inline-block w-3 h-3 rounded-full mr-2`}
//                         style={{
//                           backgroundColor:
//                             adminAnalyticsAPI.getChartColors()[item.status] ||
//                             adminAnalyticsAPI.getChartColors().default,
//                         }}
//                       ></span>
//                       <span className="text-sm text-gray-600">
//                         {adminAnalyticsAPI.formatStatus(item.status)}: {item.count}
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Detailed Statistics Section */}
//           <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
//             <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
//               <h3 className="text-lg leading-6 font-medium text-gray-900">Detailed Statistics</h3>
//               <p className="mt-1 max-w-2xl text-sm text-gray-500">
//                 Breakdown of projects and tasks by their current status.
//               </p>
//             </div>
//             <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
//               <div className="grid grid-cols-1 gap-y-8 gap-x-4 sm:grid-cols-2">
//                 {/* Projects by Status */}
//                 <div>
//                   <h4 className="text-base font-medium text-gray-900 mb-4">Projects by Status</h4>
//                   <div className="space-y-4">
//                     {stats.projectsByStatus.map((item) => (
//                       <div key={item.status} className="flex items-center">
//                         <span
//                           className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${adminAnalyticsAPI.getStatusBadgeColor(
//                             item.status,
//                           )}`}
//                         >
//                           {adminAnalyticsAPI.formatStatus(item.status)}
//                         </span>
//                         <div className="ml-4 flex-1">
//                           <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
//                             <div
//                               className="absolute h-full rounded-full"
//                               style={{
//                                 width: `${(item.count / stats.totalProjects) * 100}%`,
//                                 backgroundColor:
//                                   adminAnalyticsAPI.getChartColors()[item.status] ||
//                                   adminAnalyticsAPI.getChartColors().default,
//                               }}
//                             ></div>
//                           </div>
//                         </div>
//                         <span className="ml-2 text-sm font-medium text-gray-700">
//                           {item.count} ({((item.count / stats.totalProjects) * 100).toFixed(1)}%)
//                         </span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Tasks by Status */}
//                 <div>
//                   <h4 className="text-base font-medium text-gray-900 mb-4">Tasks by Status</h4>
//                   <div className="space-y-4">
//                     {stats.tasksByStatus.map((item) => (
//                       <div key={item.status} className="flex items-center">
//                         <span
//                           className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${adminAnalyticsAPI.getStatusBadgeColor(
//                             item.status,
//                           )}`}
//                         >
//                           {adminAnalyticsAPI.formatStatus(item.status)}
//                         </span>
//                         <div className="ml-4 flex-1">
//                           <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
//                             <div
//                               className="absolute h-full rounded-full"
//                               style={{
//                                 width: `${(item.count / stats.totalTasks) * 100}%`,
//                                 backgroundColor:
//                                   adminAnalyticsAPI.getChartColors()[item.status] ||
//                                   adminAnalyticsAPI.getChartColors().default,
//                               }}
//                             ></div>
//                           </div>
//                         </div>
//                         <span className="ml-2 text-sm font-medium text-gray-700">
//                           {item.count} ({((item.count / stats.totalTasks) * 100).toFixed(1)}%)
//                         </span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// export default Analytics

"use client"

import { useState, useRef, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import {
  ArrowPathIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  ChartPieIcon,
  ChartBarIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline"
import adminAnalyticsAPI from "../../api/adminAnalytics"
import authAPI from "../../api/auth"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

// Add this import at the top of the file, after the other imports
import "../../styles/analytics.css"

// Import Chart.js components
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from "chart.js"
import { Pie, Bar } from "react-chartjs-2"

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

const Analytics = () => {
  const navigate = useNavigate()
  const [refreshInterval, setRefreshInterval] = useState(null)
  const [filters, setFilters] = useState({
    projectStatus: "",
    taskStatus: "",
    dateRange: "all", // 'all', 'week', 'month', 'quarter', 'year'
  })
  const [isExporting, setIsExporting] = useState(false)
  const [useMockData, setUseMockData] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const dashboardRef = useRef(null)

  // Fetch dashboard statistics with filters
  const {
    data: statsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["adminDashboardStats", filters, useMockData, retryCount],
    queryFn: () => adminAnalyticsAPI.getDashboardStats(filters, useMockData),
    refetchInterval: refreshInterval,
    retry: 1, // Only retry once automatically
    onError: (error) => {
      // Show toast notification on error
      toast.error(`Failed to load analytics data: ${error.message}`)
    },
  })

  // Check if user is admin, redirect if not
  useEffect(() => {
    if (!authAPI.isAdmin()) {
      navigate("/dashboard")
    }
  }, [navigate])

  const stats = statsData?.data?.stats || {
    totalUsers: 0,
    totalProjects: 0,
    totalTasks: 0,
    projectsByStatus: [],
    tasksByStatus: [],
  }

  // Prepare data for projects by status pie chart
  const projectsChartData = {
    labels: stats.projectsByStatus.map((item) => adminAnalyticsAPI.formatStatus(item.status)),
    datasets: [
      {
        data: stats.projectsByStatus.map((item) => item.count),
        backgroundColor: stats.projectsByStatus.map(
          (item) => adminAnalyticsAPI.getChartColors()[item.status] || adminAnalyticsAPI.getChartColors().default,
        ),
        borderWidth: 1,
      },
    ],
  }

  // Prepare data for tasks by status bar chart
  const tasksChartData = {
    labels: stats.tasksByStatus.map((item) => adminAnalyticsAPI.formatStatus(item.status)),
    datasets: [
      {
        label: "Number of Tasks",
        data: stats.tasksByStatus.map((item) => item.count),
        backgroundColor: stats.tasksByStatus.map(
          (item) => adminAnalyticsAPI.getChartColors()[item.status] || adminAnalyticsAPI.getChartColors().default,
        ),
        borderWidth: 1,
      },
    ],
  }

  // Chart options
  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
      },
      title: {
        display: true,
        text: "Projects by Status",
        font: {
          size: 16,
        },
      },
    },
  }

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Tasks by Status",
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  }

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    if (refreshInterval) {
      setRefreshInterval(null)
    } else {
      setRefreshInterval(30000) // Refresh every 30 seconds
    }
  }

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Reset filters
  const resetFilters = () => {
    setFilters({
      projectStatus: "",
      taskStatus: "",
      dateRange: "all",
    })
  }

  // Toggle between real and mock data
  const toggleMockData = () => {
    setUseMockData(!useMockData)
    if (!useMockData) {
      toast.info("Using mock data. This is for testing purposes only.")
    } else {
      toast.info("Using real API data.")
    }
  }

  // Manual retry with incremented counter
  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
    refetch()
  }

  // Export dashboard to PDF
  const exportToPDF = async () => {
    if (!dashboardRef.current) return

    setIsExporting(true)
    try {
      // Apply a temporary class to the dashboard to use simpler colors during export
      dashboardRef.current.classList.add("pdf-export-mode")

      // Force any charts to redraw with the new styling
      window.dispatchEvent(new Event("resize"))

      // Small delay to ensure styles are applied
      await new Promise((resolve) => setTimeout(resolve, 100))

      const dashboard = dashboardRef.current
      const canvas = await html2canvas(dashboard, {
        scale: 2, // Higher scale for better quality
        useCORS: true, // Enable CORS for images
        logging: false,
        backgroundColor: "#ffffff",
        // Ignore CSS background images and problematic CSS
        onclone: (document) => {
          // Find all elements with background colors that might use oklch
          const elementsWithBg = document.querySelectorAll('[class*="bg-"]')
          elementsWithBg.forEach((el) => {
            // Force simple background colors for export
            const style = window.getComputedStyle(el)
            const bgColor = style.backgroundColor

            // If it's a complex color format, replace with a simple one
            if (bgColor.includes("oklch") || bgColor.includes("rgb")) {
              // Extract the element's class list to find Tailwind color classes
              const classList = el.className.split(" ")
              const colorClass = classList.find((cls) => cls.startsWith("bg-"))

              // Apply a simpler color based on the Tailwind class
              if (colorClass) {
                if (colorClass.includes("indigo")) el.style.backgroundColor = "#6366f1"
                else if (colorClass.includes("blue")) el.style.backgroundColor = "#3b82f6"
                else if (colorClass.includes("green")) el.style.backgroundColor = "#10b981"
                else if (colorClass.includes("red")) el.style.backgroundColor = "#ef4444"
                else if (colorClass.includes("yellow")) el.style.backgroundColor = "#f59e0b"
                else if (colorClass.includes("gray")) el.style.backgroundColor = "#9ca3af"
                else el.style.backgroundColor = "#ffffff"
              }
            }
          })
        },
      })

      // Remove the temporary class
      dashboardRef.current.classList.remove("pdf-export-mode")

      // Force charts to redraw with original styling
      window.dispatchEvent(new Event("resize"))

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // Calculate dimensions to fit the dashboard in the PDF
      const imgWidth = 210 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Add title
      pdf.setFontSize(18)
      pdf.text("WKU Construction Management System - Analytics Dashboard", 105, 15, { align: "center" })

      // Add timestamp
      pdf.setFontSize(10)
      pdf.text(`Generated on: ${adminAnalyticsAPI.formatDate(new Date())}`, 105, 22, { align: "center" })

      // Add filters info if any filters are applied
      if (filters.projectStatus || filters.taskStatus || filters.dateRange !== "all") {
        pdf.setFontSize(10)
        let filterText = "Filters applied: "
        if (filters.projectStatus) {
          filterText += `Project Status: ${adminAnalyticsAPI.formatStatus(filters.projectStatus)}, `
        }
        if (filters.taskStatus) {
          filterText += `Task Status: ${adminAnalyticsAPI.formatStatus(filters.taskStatus)}, `
        }
        if (filters.dateRange !== "all") {
          filterText += `Date Range: ${filters.dateRange.charAt(0).toUpperCase() + filters.dateRange.slice(1)}`
        }
        pdf.text(filterText, 105, 28, { align: "center" })
      }

      // Add the dashboard image
      pdf.addImage(imgData, "PNG", 0, 35, imgWidth, imgHeight)

      // Save the PDF
      pdf.save("wku-cms-analytics-dashboard.pdf")
      toast.success("Dashboard exported to PDF successfully")
    } catch (err) {
      console.error("Error exporting to PDF:", err)
      try {
        console.log("Attempting fallback PDF export method...")
        exportToPDFFallback()
      } catch (fallbackErr) {
        console.error("Fallback PDF export also failed:", fallbackErr)
        toast.error("Failed to export dashboard to PDF: " + err.message)
      }
    } finally {
      // Ensure we remove the temporary class if there was an error
      if (dashboardRef.current) {
        dashboardRef.current.classList.remove("pdf-export-mode")
        // Force charts to redraw with original styling
        window.dispatchEvent(new Event("resize"))
      }
      setIsExporting(false)
    }
  }

  // Add this new function after the exportToPDF function

  // Fallback PDF export method that uses a simpler approach
  const exportToPDFFallback = () => {
    if (!dashboardRef.current) return

    setIsExporting(true)
    try {
      // Create a new PDF document
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // Add title
      pdf.setFontSize(18)
      pdf.text("WKU Construction Management System - Analytics Dashboard", 105, 15, { align: "center" })

      // Add timestamp
      pdf.setFontSize(10)
      pdf.text(`Generated on: ${adminAnalyticsAPI.formatDate(new Date())}`, 105, 22, { align: "center" })

      // Add filters info
      if (filters.projectStatus || filters.taskStatus || filters.dateRange !== "all") {
        pdf.setFontSize(10)
        let filterText = "Filters applied: "
        if (filters.projectStatus) {
          filterText += `Project Status: ${adminAnalyticsAPI.formatStatus(filters.projectStatus)}, `
        }
        if (filters.taskStatus) {
          filterText += `Task Status: ${adminAnalyticsAPI.formatStatus(filters.taskStatus)}, `
        }
        if (filters.dateRange !== "all") {
          filterText += `Date Range: ${filters.dateRange.charAt(0).toUpperCase() + filters.dateRange.slice(1)}`
        }
        pdf.text(filterText, 105, 28, { align: "center" })
      }

      // Add summary statistics
      pdf.setFontSize(14)
      pdf.text("Summary Statistics", 20, 40)

      pdf.setFontSize(10)
      pdf.text(`Total Users: ${stats.totalUsers}`, 20, 50)
      pdf.text(`Total Projects: ${stats.totalProjects}`, 20, 55)
      pdf.text(`Total Tasks: ${stats.totalTasks}`, 20, 60)

      // Add project status breakdown
      pdf.setFontSize(14)
      pdf.text("Projects by Status", 20, 75)

      pdf.setFontSize(10)
      stats.projectsByStatus.forEach((item, index) => {
        pdf.text(
          `${adminAnalyticsAPI.formatStatus(item.status)}: ${item.count} (${((item.count / stats.totalProjects) * 100).toFixed(1)}%)`,
          20,
          85 + index * 5,
        )
      })

      // Add task status breakdown
      pdf.setFontSize(14)
      pdf.text("Tasks by Status", 120, 75)

      pdf.setFontSize(10)
      stats.tasksByStatus.forEach((item, index) => {
        pdf.text(
          `${adminAnalyticsAPI.formatStatus(item.status)}: ${item.count} (${((item.count / stats.totalTasks) * 100).toFixed(1)}%)`,
          120,
          85 + index * 5,
        )
      })

      // Add note about fallback mode
      pdf.setFontSize(8)
      pdf.text(
        "Note: This PDF was generated in fallback mode without charts due to browser compatibility issues.",
        105,
        280,
        { align: "center" },
      )

      // Save the PDF
      pdf.save("wku-cms-analytics-dashboard-fallback.pdf")
      toast.success("Dashboard exported to PDF successfully (fallback mode)")
    } catch (err) {
      console.error("Error in fallback PDF export:", err)
      toast.error("Failed to export dashboard to PDF in fallback mode: " + err.message)
    } finally {
      setIsExporting(false)
    }
  }

  if (!authAPI.isAdmin()) {
    return null // Already handled by useEffect
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Analytics Dashboard</h1>
          <p className="text-gray-500 text-sm">Overview of system statistics, project status, and task distribution.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={toggleAutoRefresh}
            className={`inline-flex items-center px-4 py-2 border ${
              refreshInterval
                ? "border-red-300 text-red-700 bg-red-50 hover:bg-red-100"
                : "border-green-300 text-green-700 bg-green-50 hover:bg-green-100"
            } rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${refreshInterval ? "animate-spin" : ""}`} />
            {refreshInterval ? "Auto-refresh On" : "Auto-refresh Off"}
          </button>
          <button
            type="button"
            onClick={refetch}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Refresh Now
          </button>
          <button
            type="button"
            onClick={exportToPDF}
            disabled={isExporting || isLoading || !!error}
            className="inline-flex items-center px-4 py-2 border border-indigo-600 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            {isExporting ? "Exporting..." : "Export to PDF"}
          </button>
          <button
            type="button"
            onClick={exportToPDFFallback}
            disabled={isExporting || isLoading || !!error}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Simple PDF
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <FunnelIcon className="h-5 w-5 text-indigo-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Filters</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Project Status Filter */}
            <div>
              <label htmlFor="projectStatus" className="block text-sm font-medium text-gray-700 mb-1">
                Project Status
              </label>
              <select
                id="projectStatus"
                name="projectStatus"
                value={filters.projectStatus}
                onChange={handleFilterChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">All Project Statuses</option>
                {adminAnalyticsAPI.getProjectStatuses().map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Task Status Filter */}
            <div>
              <label htmlFor="taskStatus" className="block text-sm font-medium text-gray-700 mb-1">
                Task Status
              </label>
              <select
                id="taskStatus"
                name="taskStatus"
                value={filters.taskStatus}
                onChange={handleFilterChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">All Task Statuses</option>
                {adminAnalyticsAPI.getTaskStatuses().map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select
                id="dateRange"
                name="dateRange"
                value={filters.dateRange}
                onChange={handleFilterChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="all">All Time</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>
            </div>

            {/* Reset Filters Button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Connection issue detected:</strong> {error.message}
              </p>
              <div className="mt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-1" />
                  Retry
                </button>
                <button
                  type="button"
                  onClick={toggleMockData}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Use {useMockData ? "Real Data" : "Mock Data"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-20 bg-white shadow rounded-lg">
          <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
          <p className="mt-2 text-gray-500">Loading analytics data...</p>
        </div>
      ) : (
        <div ref={dashboardRef}>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {/* Users Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                    <UsersIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">
                          {adminAnalyticsAPI.formatNumber(stats.totalUsers)}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <a href="/admin/users" className="font-medium text-indigo-600 hover:text-indigo-500">
                    View all users
                  </a>
                </div>
              </div>
            </div>

            {/* Projects Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <BuildingOfficeIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Projects</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">
                          {adminAnalyticsAPI.formatNumber(stats.totalProjects)}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <a href="/admin/projects" className="font-medium text-indigo-600 hover:text-indigo-500">
                    View all projects
                  </a>
                </div>
              </div>
            </div>

            {/* Tasks Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Tasks</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">
                          {adminAnalyticsAPI.formatNumber(stats.totalTasks)}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <a href="/admin/tasks" className="font-medium text-indigo-600 hover:text-indigo-500">
                    View all tasks
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Projects by Status Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <ChartPieIcon className="h-5 w-5 mr-2 text-indigo-500" />
                  Projects by Status
                </h2>
              </div>
              <div className="h-64">
                {stats.projectsByStatus.length > 0 ? (
                  <Pie data={projectsChartData} options={pieChartOptions} />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-gray-500">No project data available</p>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Status Breakdown</h3>
                <div className="grid grid-cols-2 gap-2">
                  {stats.projectsByStatus.map((item) => (
                    <div key={item.status} className="flex items-center">
                      <span
                        className={`inline-block w-3 h-3 rounded-full mr-2`}
                        style={{
                          backgroundColor:
                            adminAnalyticsAPI.getChartColors()[item.status] ||
                            adminAnalyticsAPI.getChartColors().default,
                        }}
                      ></span>
                      <span className="text-sm text-gray-600">
                        {adminAnalyticsAPI.formatStatus(item.status)}: {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tasks by Status Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <ChartBarIcon className="h-5 w-5 mr-2 text-indigo-500" />
                  Tasks by Status
                </h2>
              </div>
              <div className="h-64">
                {stats.tasksByStatus.length > 0 ? (
                  <Bar data={tasksChartData} options={barChartOptions} />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-gray-500">No task data available</p>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Status Breakdown</h3>
                <div className="grid grid-cols-2 gap-2">
                  {stats.tasksByStatus.map((item) => (
                    <div key={item.status} className="flex items-center">
                      <span
                        className={`inline-block w-3 h-3 rounded-full mr-2`}
                        style={{
                          backgroundColor:
                            adminAnalyticsAPI.getChartColors()[item.status] ||
                            adminAnalyticsAPI.getChartColors().default,
                        }}
                      ></span>
                      <span className="text-sm text-gray-600">
                        {adminAnalyticsAPI.formatStatus(item.status)}: {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Statistics Section */}
          <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Detailed Statistics</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Breakdown of projects and tasks by their current status.
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-8 gap-x-4 sm:grid-cols-2">
                {/* Projects by Status */}
                <div>
                  <h4 className="text-base font-medium text-gray-900 mb-4">Projects by Status</h4>
                  <div className="space-y-4">
                    {stats.projectsByStatus.map((item) => (
                      <div key={item.status} className="flex items-center">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${adminAnalyticsAPI.getStatusBadgeColor(
                            item.status,
                          )}`}
                        >
                          {adminAnalyticsAPI.formatStatus(item.status)}
                        </span>
                        <div className="ml-4 flex-1">
                          <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="absolute h-full rounded-full"
                              style={{
                                width: `${(item.count / stats.totalProjects) * 100}%`,
                                backgroundColor:
                                  adminAnalyticsAPI.getChartColors()[item.status] ||
                                  adminAnalyticsAPI.getChartColors().default,
                              }}
                            ></div>
                          </div>
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          {item.count} ({((item.count / stats.totalProjects) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tasks by Status */}
                <div>
                  <h4 className="text-base font-medium text-gray-900 mb-4">Tasks by Status</h4>
                  <div className="space-y-4">
                    {stats.tasksByStatus.map((item) => (
                      <div key={item.status} className="flex items-center">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${adminAnalyticsAPI.getStatusBadgeColor(
                            item.status,
                          )}`}
                        >
                          {adminAnalyticsAPI.formatStatus(item.status)}
                        </span>
                        <div className="ml-4 flex-1">
                          <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="absolute h-full rounded-full"
                              style={{
                                width: `${(item.count / stats.totalTasks) * 100}%`,
                                backgroundColor:
                                  adminAnalyticsAPI.getChartColors()[item.status] ||
                                  adminAnalyticsAPI.getChartColors().default,
                              }}
                            ></div>
                          </div>
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          {item.count} ({((item.count / stats.totalTasks) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Analytics
