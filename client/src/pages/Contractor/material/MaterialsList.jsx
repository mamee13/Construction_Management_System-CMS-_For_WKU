/* eslint-disable */
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  EyeIcon,
  FunnelIcon,
  BuildingOfficeIcon,
  CubeIcon,
  TruckIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline"
import { toast } from "react-toastify"
import materialsAPI from "../../../api/materials"
import projectsAPI from "../../../api/projects"
import authAPI from "../../../api/auth"

const MaterialsList = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [projectFilter, setProjectFilter] = useState("")
  const [materialTypeFilter, setMaterialTypeFilter] = useState("")
  const [viewMode, setViewMode] = useState("all") // "all", "mine", "others"
  const currentUser = authAPI.getCurrentUser()

  // Fetch all materials
  const {
    data: materialsData,
    isLoading: isLoadingMaterials,
    error: materialsError,
    refetch: refetchMaterials,
  } = useQuery({
    queryKey: ["materials"],
    queryFn: materialsAPI.getAllMaterials,
  })

  // Fetch projects for filtering
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => {
      // If contractor, fetch only assigned projects
      if (currentUser?.role === "contractor") {
        return projectsAPI.getMyAssignedProjects()
      }
      // If admin, fetch all projects
      return projectsAPI.getAllProjects()
    },
  })

  // Delete material mutation
  const deleteMutation = useMutation({
    mutationFn: materialsAPI.deleteMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] })
      toast.success("Material deleted successfully")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete material")
    },
  })

  // Handle material deletion
  const handleDelete = (materialId) => {
    if (window.confirm("Are you sure you want to delete this material? This action cannot be undone.")) {
      deleteMutation.mutate(materialId)
    }
  }

  // Check if user can edit/delete a material (admin can edit all, contractor only their own)
  const canModifyMaterial = (material) => {
    if (!currentUser || !material) return false
    if (currentUser.role === "admin") return true
    if (currentUser.role === "contractor" && material.user?._id === currentUser._id) return true
    return false
  }

  // Get unique material types for filtering
  const materialTypes = materialsData?.data
    ? [...new Set(materialsData.data.map((material) => material.materialType))]
    : []

  // Filter materials based on search term, status, project, material type, and view mode
  const filteredMaterials =
    materialsData?.data?.filter((material) => {
      // Text search
      const matchesSearch =
        material.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.supplier.toLowerCase().includes(searchTerm.toLowerCase())

      // Status filter
      const matchesStatus = statusFilter ? material.status === statusFilter : true

      // Project filter
      const matchesProject = projectFilter ? material.project?._id === projectFilter : true

      // Material type filter
      const matchesMaterialType = materialTypeFilter ? material.materialType === materialTypeFilter : true

      // View mode filter (mine, others, all)
      let matchesViewMode = true
      if (viewMode === "mine") {
        matchesViewMode = material.user?._id === currentUser?._id
      } else if (viewMode === "others") {
        matchesViewMode = material.user?._id !== currentUser?._id
      }

      return matchesSearch && matchesStatus && matchesProject && matchesMaterialType && matchesViewMode
    }) || []

  // Check if user is contractor or admin, redirect if not
  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      navigate("/login")
      return
    }

    if (currentUser?.role !== "contractor" && currentUser?.role !== "admin") {
      navigate("/dashboard")
    }
  }, [currentUser, navigate])

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Materials Management</h1>
          <p className="text-gray-500 text-sm">
            {currentUser?.role === "contractor"
              ? "Create and manage materials for your assigned projects."
              : "Manage all construction materials, suppliers, and costs."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/contractor/materials/create")}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add New Material
        </button>
      </div>

      {/* Search and filter */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
            {/* Search */}
            <div className="lg:col-span-2">
              <label htmlFor="search" className="sr-only">
                Search Materials
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full bg-white py-2 pl-10 pr-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Search by name or supplier"
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Project filter */}
            <div>
              <label htmlFor="project-filter" className="sr-only">
                Filter by Project
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="project-filter"
                  name="project-filter"
                  className="block w-full bg-white py-2 pl-10 pr-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  disabled={isLoadingProjects}
                >
                  <option value="">All Projects</option>
                  {projectsData?.data?.projects?.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.projectName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Material Type filter */}
            <div>
              <label htmlFor="material-type-filter" className="sr-only">
                Filter by Material Type
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <CubeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="material-type-filter"
                  name="material-type-filter"
                  className="block w-full bg-white py-2 pl-10 pr-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={materialTypeFilter}
                  onChange={(e) => setMaterialTypeFilter(e.target.value)}
                >
                  <option value="">All Types</option>
                  {materialTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status filter */}
            <div>
              <label htmlFor="status-filter" className="sr-only">
                Filter by Status
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <FunnelIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="status-filter"
                  name="status-filter"
                  className="block w-full bg-white py-2 pl-10 pr-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="ordered">Ordered</option>
                  <option value="delivered">Delivered</option>
                  <option value="in_use">In Use</option>
                  <option value="depleted">Depleted</option>
                </select>
              </div>
            </div>

            {/* View Mode filter */}
            <div>
              <label htmlFor="view-mode-filter" className="sr-only">
                View Mode
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <TruckIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="view-mode-filter"
                  name="view-mode-filter"
                  className="block w-full bg-white py-2 pl-10 pr-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                >
                  <option value="all">All Materials</option>
                  <option value="mine">Added by Me</option>
                  <option value="others">Added by Others</option>
                </select>
              </div>
            </div>
          </div>

          {/* Clear filters button */}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("")
                setProjectFilter("")
                setMaterialTypeFilter("")
                setViewMode("all")
              }}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Clear Filters
            </button>
            <button
              type="button"
              onClick={() => refetchMaterials()}
              className="ml-3 inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Materials list */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoadingMaterials ? (
          <div className="text-center py-20">
            <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
            <p className="mt-2 text-gray-500">Loading materials...</p>
          </div>
        ) : materialsError ? (
          <div className="text-center py-20">
            <p className="text-red-500">Failed to load materials: {materialsError.message}</p>
            <button
              onClick={() => refetchMaterials()}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Retry
            </button>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">
              {searchTerm || statusFilter || projectFilter || materialTypeFilter || viewMode !== "all"
                ? "No materials match your search criteria."
                : "No materials found."}
            </p>
            {(searchTerm || statusFilter || projectFilter || materialTypeFilter || viewMode !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("")
                  setProjectFilter("")
                  setMaterialTypeFilter("")
                  setViewMode("all")
                }}
                className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Material
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Project
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Quantity & Cost
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Supplier
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMaterials.map((material) => (
                  <tr key={material._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{material.materialName}</div>
                      <div className="text-sm text-gray-500">{material.materialType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{material.project?.projectName || "Unknown Project"}</div>
                      <div className="text-xs text-gray-500">
                        Added by: {material.user?.firstName} {material.user?.lastName}
                        {material.user?._id === currentUser?._id ? " (You)" : ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <span className="font-medium">{material.quantity}</span> {material.unit}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <CurrencyDollarIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {materialsAPI.formatCurrency(material.costPerUnit)} per {material.unit}
                      </div>
                      <div className="flex items-center text-sm font-medium text-gray-900">
                        <CurrencyDollarIcon className="h-4 w-4 mr-1 text-gray-400" />
                        Total: {materialsAPI.formatCurrency(material.totalCost)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${materialsAPI.getStatusBadgeColor(
                          material.status,
                        )}`}
                      >
                        {materialsAPI.formatStatus(material.status)}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        Added: {materialsAPI.formatDate(material.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{material.supplier}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/contractor/materials/${material._id}`)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                        title="View Material"
                      >
                        <EyeIcon className="h-5 w-5" />
                        <span className="sr-only">View</span>
                      </button>
                      {canModifyMaterial(material) && (
                        <>
                          <button
                            onClick={() => navigate(`/contractor/materials/edit/${material._id}`)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                            title="Edit Material"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                            <span className="sr-only">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(material._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Material"
                          >
                            <TrashIcon className="h-5 w-5" />
                            <span className="sr-only">Delete</span>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default MaterialsList

