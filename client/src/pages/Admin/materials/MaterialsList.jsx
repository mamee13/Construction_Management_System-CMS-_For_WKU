

/* eslint-disable */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  CubeIcon,
  XCircleIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import materialsAPI from "../../../api/materials"; // Adjusted path
import projectsAPI from "../../../api/projects";   // Adjusted path
import authAPI from "../../../api/auth";       // Adjusted path

const MaterialsList = () => {
  console.log("MaterialsList component loaded");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState(null);
  const [selectedProject, setSelectedProject] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check if user is admin and get current user details
    setIsAdmin(authAPI.isAdmin());
    setCurrentUser(authAPI.getCurrentUser());
  }, []);

  // Fetch projects for filter dropdown (remains the same)
  const {
    data: projectsData, // Expected: { success: true, data: [...] }
    isLoading: isLoadingProjects,
    error: projectsError,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsAPI.getAllProjects,
  });

  // --- UPDATED: Fetch materials using the new API structure ---
  const {
    data: materialsResponse, // Raw response { success: true, data: [...] } or null from Promise.resolve
    isLoading: isLoadingMaterials, // True during initial fetch for a query key
    error: materialsError,
    refetch: refetchMaterials,
    status: materialsQueryStatus, // 'loading', 'error', 'success'
    isFetching: isFetchingMaterials, // True when fetching, including background refetches
  } = useQuery({
    // Query key still includes selectedProject to trigger refetch on change
    queryKey: ["materials", selectedProject],
    // Use the new API function, passing project ID as a query param
    queryFn: () =>
      selectedProject
        ? materialsAPI.getAllMaterials({ project: selectedProject }) // Pass project filter
        // Return structure matching successful API response if no project selected
        : Promise.resolve({ success: true, data: [] }),
    enabled: !!selectedProject, // Only fetch if a project is selected

    // Select function extracts the data array or returns empty array
    // Assumes getAllMaterials returns { success: boolean, data: array|undefined }
    select: (response) => {
      // console.log("Raw materials response in select:", response); // Debug log
      const dataArray = Array.isArray(response?.data) ? response.data : [];
      // console.log("Selected materials data:", dataArray); // Debug log
      return dataArray;
    },
    // keepPreviousData: true, // Optional: keeps showing old data while new loads
  });

  // Extracted materials array for rendering (result of the 'select' function)
  const materialsData = materialsResponse ?? []; // Default to empty array if response is null/undefined initially
  const isSuccessMaterials = materialsQueryStatus === 'success'; // Define isSuccess based on status


  // Detailed logging for materials query state (keep during debugging, remove later)
  useEffect(() => {
    console.log('Materials Query State:', {
        selectedProject,
        isLoading: isLoadingMaterials,
        isFetching: isFetchingMaterials,
        isSuccess: isSuccessMaterials,
        status: materialsQueryStatus,
        error: materialsError,
        // dataLength: materialsData?.length, // Log length instead of full data
    });
  }, [selectedProject, isLoadingMaterials, isFetchingMaterials, isSuccessMaterials, materialsQueryStatus, materialsError, materialsData]);


  // --- UPDATED: Delete material mutation ---
  const deleteMaterialMutation = useMutation({
    // mutationFn now takes an object { id, userId }
    mutationFn: ({ id, userId }) => materialsAPI.deleteMaterial(id, userId),
    onSuccess: (data) => { // 'data' is the response from deleteMaterial API call
      toast.success(data?.message || "Material deleted successfully");
      // Invalidate the query for the specific project to refetch materials list
      queryClient.invalidateQueries({ queryKey: ["materials", selectedProject] });
      // Optionally invalidate project query if deletion affects project budget display elsewhere
      // queryClient.invalidateQueries({ queryKey: ["projects", selectedProject] });
      // queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsDeleting(false);
      setMaterialToDelete(null);
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete material");
      setIsDeleting(false);
    },
  });

  // --- Handlers ---

  const handleCreateMaterial = () => {
    if (!selectedProject) {
      toast.warning("Please select a project first");
      return;
    }
    // Navigate to create page, passing project ID (user ID will be added on create form)
    navigate(`/admin/materials/create?projectId=${selectedProject}`);
  };

  const handleProjectChange = (e) => {
    setSelectedProject(e.target.value);
  };

  const confirmDelete = (materialId) => {
    setMaterialToDelete(materialId);
  };

  // --- UPDATED: handleDelete function ---
  const handleDelete = () => {
    // Ensure we have the material ID to delete and the current user's ID for authorization check
    if (!materialToDelete || !currentUser?._id) {
        console.error("Cannot delete: Missing material ID or current user ID.");
        toast.error("Could not delete material. User information missing.");
        setIsDeleting(false); // Reset deleting state
        return;
    }
    setIsDeleting(true);
    // Pass both material ID and current user ID to the mutation
    deleteMaterialMutation.mutate({
      id: materialToDelete,
      userId: currentUser._id, // Pass current user's ID for backend authorization
    });
  };

  const cancelDelete = () => {
    setMaterialToDelete(null);
    setIsDeleting(false);
  };

  // --- Formatting & Display Logic ---

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case "ordered": return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Ordered</span>;
      case "delivered": return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Delivered</span>;
      case "in_use": case "in use": return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">In Use</span>;
      case "depleted": return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Depleted</span>;
      default: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status ? (status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")) : 'Unknown'}</span>;
    }
  };

  // --- RENDER ---

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Materials</h1>
          <p className="text-gray-500 text-sm">Manage construction materials and supplies per project.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            type="button"
            onClick={handleCreateMaterial}
            disabled={!selectedProject}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              !selectedProject ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Material
          </button>
        </div>
      </div>

      {/* Project Filter */}
      <div className="mb-6">
        <label htmlFor="project-filter" className="block text-sm font-medium text-gray-700 mb-1">
          Select Project
        </label>
        <div className="flex">
          <select
            id="project-filter"
            value={selectedProject}
            onChange={handleProjectChange}
            className="block w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={isLoadingProjects || !!projectsError}
          >
            <option value="">
              {isLoadingProjects ? "Loading projects..." : projectsError ? "Error loading projects" : "Select a project"}
            </option>
            {/* Maps over project data array within the projectsData object */}
            {!isLoadingProjects && !projectsError && projectsData?.data?.map((project) => (
              <option key={project._id} value={project._id}>
                {project.projectName}
              </option>
            ))}
          </select>
        </div>
        {projectsError && (
          <p className="mt-1 text-sm text-red-600">Could not load projects: {projectsError?.message || 'Please try refreshing.'}</p>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {materialToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={cancelDelete}></div>
          <div className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-xl transform transition-all">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Material</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">Are you sure you want to delete this material? This action cannot be undone.</p>
              </div>
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? <><ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />Deleting...</> : "Delete"}
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm disabled:opacity-50"
                onClick={cancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Materials List Display Area */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md min-h-[250px] flex flex-col">
         {/* Context Header showing selected project name */}
         <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
                Materials for: {selectedProject ? (projectsData?.data?.find(p => p._id === selectedProject)?.projectName || 'Selected Project') : 'No Project Selected'}
            </h3>
        </div>

        {/* Conditional Content Area based on materials query status */}
        <div className="flex-grow"> {/* This div holds the dynamic content */}
          {!selectedProject ? (
            <div className="flex items-center justify-center h-full py-10 text-center px-4">
              <div>
                  <BuildingOfficeIcon className="h-12 w-12 mx-auto text-gray-400" />
                  <p className="mt-2 text-lg text-gray-500">Please select a project</p>
                  <p className="text-sm text-gray-400">Select a project above to view its associated materials.</p>
              </div>
            </div>
          ) : (materialsQueryStatus === 'loading') ? ( // Display loading indicator
             <div className="flex items-center justify-center h-full py-10 text-center px-4">
               <div>
                  <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
                  <p className="mt-2 text-gray-500">Loading materials...</p>
               </div>
            </div>
          ) : materialsQueryStatus === 'error' ? ( // Display error message
             <div className="flex items-center justify-center h-full py-10 text-center px-4">
                <div>
                    <XCircleIcon className="h-10 w-10 mx-auto text-red-500" />
                    <p className="mt-2 font-semibold text-gray-700">Error loading materials</p>
                    <p className="text-sm text-red-600 mb-4">{materialsError?.message || 'An unknown error occurred.'}</p>
                    <button
                    onClick={() => refetchMaterials()}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                    <ArrowPathIcon className="h-5 w-5 mr-2" />
                    Retry
                    </button>
                </div>
            </div>
            // Display "No materials" message only if query succeeded and data array is empty
          ) : materialsQueryStatus === 'success' && (!materialsData || materialsData.length === 0) ? (
             <div className="flex items-center justify-center h-full py-10 text-center px-4">
                <div>
                    <CubeIcon className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-lg text-gray-500">No materials found</p>
                    <p className="text-sm text-gray-400 mb-4">There are no materials recorded for this project yet.</p>
                    <button
                      onClick={handleCreateMaterial}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Add First Material
                    </button>
                </div>
            </div>
            // Display the table only if query succeeded and there is data
          ) : materialsQueryStatus === 'success' && materialsData && materialsData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added By</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {materialsData.map((material) => ( // Map over the materialsData array
                    <tr key={material._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                             <CubeIcon className="h-full w-full text-gray-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{material.materialName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.materialType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.quantity} {material.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(material.totalCost)}</div>
                        <div className="text-xs text-gray-500">{formatCurrency(material.costPerUnit)} / {material.unit}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.supplier || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(material.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                         {/* Display user info populated from backend */}
                         {material.user?.firstName || 'N/A'} {material.user?.lastName || ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-3">
                           <button
                              onClick={() => navigate(`/admin/materials/edit/${material._id}`)}
                              title="Edit Material"
                              className="text-indigo-600 hover:text-indigo-900"
                           >
                             <PencilIcon className="h-5 w-5" />
                           </button>
                          {/* Conditional delete button based on admin status or ownership */}
                          {(isAdmin || (currentUser && material.user && material.user._id === currentUser._id)) && (
                            <button
                              onClick={() => confirmDelete(material._id)}
                              title="Delete Material"
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null /* Fallback case, should ideally not be reached */}
        </div>
      </div>
    </div>
  );
};

export default MaterialsList;