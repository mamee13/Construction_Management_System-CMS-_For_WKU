
// import { useState } from "react"
// import { useParams, useNavigate } from "react-router-dom"
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
// import {
//   ArrowPathIcon,
//   PencilSquareIcon,
//   TrashIcon,
//   CalendarIcon,
//   MapPinIcon,
//   CurrencyDollarIcon,
//   UserIcon,
//   ClockIcon,
// } from "@heroicons/react/24/outline"
// import { toast } from "react-toastify"

// import projectsAPI from "@/APi/projects"
// import usersAPI from "@/APi/users"
// import authAPI from "@/APi/auth"

// const ProjectDetail = () => {
//   const { id } = useParams()
//   const navigate = useNavigate()
//   const queryClient = useQueryClient()
//   const [isDeleting, setIsDeleting] = useState(false)

//   // Fetch project details
//   const {
//     data: projectData,
//     isLoading,
//     error,
//   } = useQuery({
//     queryKey: ["project", id],
//     queryFn: () => projectsAPI.getProjectById(id),
//   })

//   // Fetch contractor and consultant details
//   const { data: contractorData, isLoading: isLoadingContractor } = useQuery({
//     queryKey: ["user", projectData?.data?.contractor],
//     queryFn: () => usersAPI.getUserById(projectData?.data?.contractor),
//     enabled: !!projectData?.data?.contractor,
//   })

//   const { data: consultantData, isLoading: isLoadingConsultant } = useQuery({
//     queryKey: ["user", projectData?.data?.consultant],
//     queryFn: () => usersAPI.getUserById(projectData?.data?.consultant),
//     enabled: !!projectData?.data?.consultant,
//   })

//   // Delete project mutation
//   const deleteMutation = useMutation({
//     mutationFn: projectsAPI.deleteProject,
//     onSuccess: () => {
//       toast.success("Project deleted successfully")
//       queryClient.invalidateQueries({ queryKey: ["projects"] })
//       navigate("/admin/projects")
//     },
//     onError: (error) => {
//       toast.error(error.message || "Failed to delete project")
//       setIsDeleting(false)
//     },
//   })

//   // Handle project deletion
//   const handleDelete = () => {
//     if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
//       setIsDeleting(true)
//       deleteMutation.mutate(id)
//     }
//   }

//   // Calculate project duration
//   const calculateDuration = (startDate, endDate) => {
//     const start = new Date(startDate)
//     const end = new Date(endDate)
//     const diffTime = Math.abs(end - start)
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
//     return diffDays
//   }

//   // Check if user is admin, redirect if not
//   if (!authAPI.isAdmin()) {
//     navigate("/dashboard")
//     return null
//   }

//   const project = projectData?.data

//   return (
//     <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
//       <div className="sm:flex sm:items-center sm:justify-between mb-8">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900 mb-1">
//             {isLoading ? "Loading Project..." : project?.projectName}
//           </h1>
//           <p className="text-gray-500 text-sm">View project details, budget, and assignments.</p>
//         </div>
//         <div className="mt-4 sm:mt-0 flex space-x-3">
//           <button
//             type="button"
//             onClick={() => navigate("/admin/projects")}
//             className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//           >
//             Back to Projects
//           </button>
//           <button
//             type="button"
//             onClick={() => navigate(`/admin/projects/edit/${id}`)}
//             className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//           >
//             <PencilSquareIcon className="h-5 w-5 mr-2" />
//             Edit Project
//           </button>
//           <button
//             type="button"
//             onClick={handleDelete}
//             disabled={isDeleting}
//             className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
//             ${isDeleting ? "bg-red-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"} 
//             focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
//           >
//             {isDeleting ? (
//               <>
//                 <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
//                 Deleting...
//               </>
//             ) : (
//               <>
//                 <TrashIcon className="h-5 w-5 mr-2" />
//                 Delete Project
//               </>
//             )}
//           </button>
//         </div>
//       </div>

//       {isLoading ? (
//         <div className="text-center py-20 bg-white shadow rounded-lg">
//           <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin" />
//           <p className="mt-2 text-gray-500">Loading project details...</p>
//         </div>
//       ) : error ? (
//         <div className="text-center py-20 bg-white shadow rounded-lg">
//           <p className="text-red-500">Failed to load project: {error.message}</p>
//           <button
//             onClick={() => queryClient.invalidateQueries({ queryKey: ["project", id] })}
//             className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//           >
//             <ArrowPathIcon className="h-5 w-5 mr-2" />
//             Retry
//           </button>
//         </div>
//       ) : (
//         <div className="bg-white shadow overflow-hidden sm:rounded-lg">
//           <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
//             <div className="flex items-center justify-between">
//               <h3 className="text-lg leading-6 font-medium text-gray-900">Project Information</h3>
//               <span
//                 className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${projectsAPI.getStatusBadgeColor(project.status)}`}
//               >
//                 {projectsAPI.getStatusLabel(project.status)}
//               </span>
//             </div>
//           </div>

//           <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
//             <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
//               <div className="sm:col-span-2">
//                 <dt className="text-sm font-medium text-gray-500">Description</dt>
//                 <dd className="mt-1 text-sm text-gray-900">{project.projectDescription}</dd>
//               </div>

//               <div>
//                 <dt className="text-sm font-medium text-gray-500 flex items-center">
//                   <MapPinIcon className="h-5 w-5 mr-1 text-gray-400" />
//                   Location
//                 </dt>
//                 <dd className="mt-1 text-sm text-gray-900">{project.projectLocation}</dd>
//               </div>

//               <div>
//                 <dt className="text-sm font-medium text-gray-500 flex items-center">
//                   <CalendarIcon className="h-5 w-5 mr-1 text-gray-400" />
//                   Start Date
//                 </dt>
//                 <dd className="mt-1 text-sm text-gray-900">{projectsAPI.formatDate(project.startDate)}</dd>
//               </div>

//               <div>
//                 <dt className="text-sm font-medium text-gray-500 flex items-center">
//                   <CalendarIcon className="h-5 w-5 mr-1 text-gray-400" />
//                   End Date
//                 </dt>
//                 <dd className="mt-1 text-sm text-gray-900">{projectsAPI.formatDate(project.endDate)}</dd>
//               </div>

//               <div>
//                 <dt className="text-sm font-medium text-gray-500 flex items-center">
//                   <ClockIcon className="h-5 w-5 mr-1 text-gray-400" />
//                   Duration
//                 </dt>
//                 <dd className="mt-1 text-sm text-gray-900">
//                   {calculateDuration(project.startDate, project.endDate)} days
//                 </dd>
//               </div>

//               <div>
//                 <dt className="text-sm font-medium text-gray-500 flex items-center">
//                   <CurrencyDollarIcon className="h-5 w-5 mr-1 text-gray-400" />
//                   Budget
//                 </dt>
//                 <dd className="mt-1 text-sm text-gray-900">${project.projectBudget.toLocaleString()}</dd>
//               </div>

//               <div>
//                 <dt className="text-sm font-medium text-gray-500 flex items-center">
//                   <UserIcon className="h-5 w-5 mr-1 text-gray-400" />
//                   Contractor
//                 </dt>
//                 <dd className="mt-1 text-sm text-gray-900">
//                   {isLoadingContractor ? (
//                     <span className="text-gray-500">Loading...</span>
//                   ) : contractorData?.data ? (
//                     `${contractorData.data.firstName} ${contractorData.data.lastName}`
//                   ) : (
//                     <span className="text-red-500">Not found</span>
//                   )}
//                 </dd>
//               </div>

//               <div>
//                 <dt className="text-sm font-medium text-gray-500 flex items-center">
//                   <UserIcon className="h-5 w-5 mr-1 text-gray-400" />
//                   Consultant
//                 </dt>
//                 <dd className="mt-1 text-sm text-gray-900">
//                   {isLoadingConsultant ? (
//                     <span className="text-gray-500">Loading...</span>
//                   ) : consultantData?.data ? (
//                     `${consultantData.data.firstName} ${consultantData.data.lastName}`
//                   ) : (
//                     <span className="text-red-500">Not found</span>
//                   )}
//                 </dd>
//               </div>

//               <div>
//                 <dt className="text-sm font-medium text-gray-500">Created At</dt>
//                 <dd className="mt-1 text-sm text-gray-900">{projectsAPI.formatDate(project.createdAt)}</dd>
//               </div>
//             </dl>
//           </div>

//           {/* Materials, Schedules, and Comments sections would go here */}
//           <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
//             <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Materials</h3>
//             {project.materials && project.materials.length > 0 ? (
//               <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th
//                         scope="col"
//                         className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                       >
//                         Material Name
//                       </th>
//                       <th
//                         scope="col"
//                         className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                       >
//                         Quantity
//                       </th>
//                       <th
//                         scope="col"
//                         className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                       >
//                         Cost
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {/* Material items would be mapped here */}
//                     <tr>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" colSpan="3">
//                         No materials data available yet.
//                       </td>
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>
//             ) : (
//               <p className="text-sm text-gray-500">No materials assigned to this project yet.</p>
//             )}
//           </div>

//           <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
//             <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Schedules</h3>
//             {project.schedules && project.schedules.length > 0 ? (
//               <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th
//                         scope="col"
//                         className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                       >
//                         Task
//                       </th>
//                       <th
//                         scope="col"
//                         className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                       >
//                         Start Date
//                       </th>
//                       <th
//                         scope="col"
//                         className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                       >
//                         End Date
//                       </th>
//                       <th
//                         scope="col"
//                         className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                       >
//                         Status
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {/* Schedule items would be mapped here */}
//                     <tr>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" colSpan="4">
//                         No schedule data available yet.
//                       </td>
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>
//             ) : (
//               <p className="text-sm text-gray-500">No schedules assigned to this project yet.</p>
//             )}
//           </div>

//           <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
//             <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Comments</h3>
//             {project.comments && project.comments.length > 0 ? (
//               <ul className="space-y-4">
//                 {/* Comments would be mapped here */}
//                 <li className="text-sm text-gray-500">No comments available yet.</li>
//               </ul>
//             ) : (
//               <p className="text-sm text-gray-500">No comments on this project yet.</p>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// export default ProjectDetail
/*eslint-disable */
import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom"; // Added Link
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
  CalendarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  UserIcon,
  ClockIcon,
  ArrowUturnLeftIcon, // Back icon
  ExclamationTriangleIcon, // Error icon
  BriefcaseIcon, // Role icon
  PhoneIcon, // Phone icon
  ChatBubbleLeftEllipsisIcon, // Comment icon
  WrenchScrewdriverIcon, // Material icon
  ListBulletIcon, // Schedule/Task icon
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";

import projectsAPI from "@/APi/projects"; // Assuming projectsAPI includes necessary helpers now
import authAPI from "@/APi/auth";

// --- Helper Functions (Consider moving to a utils/formatters.js file) ---
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short", // Using short month name
      day: "numeric",
    });
  } catch (e) {
    return "Invalid Date";
  }
};

const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
        return new Date(dateString).toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: 'numeric',
            minute: '2-digit'
        });
    } catch (e) {
        return "Invalid Date";
    }
}

const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) return 'N/A';
    return `$${amount.toLocaleString()}`;
};

const getStatusLabel = (status) => {
    const labels = {
        planned: 'Planned', in_progress: 'In Progress', completed: 'Completed', on_hold: 'On Hold',
        not_started: 'Not Started', delayed: 'Delayed',
        ordered: 'Ordered', delivered: 'Delivered', in_use: 'In Use', depleted: 'Depleted'
    };
    return labels[status] || status?.replace(/_/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
};

const getStatusBadgeColor = (status) => {
    const colors = {
        planned: 'bg-gray-100 text-gray-800', not_started: 'bg-gray-100 text-gray-800',
        in_progress: 'bg-blue-100 text-blue-800',
        completed: 'bg-green-100 text-green-800', delivered: 'bg-green-100 text-green-800',
        on_hold: 'bg-yellow-100 text-yellow-800', ordered: 'bg-yellow-100 text-yellow-800',
        delayed: 'bg-red-100 text-red-800', depleted: 'bg-red-100 text-red-800',
        in_use: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
};
// --- End Helper Functions ---


const ProjectDetail = () => {
  const { id: projectId } = useParams(); // Renamed for clarity
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  // Check admin status once
  const isAdminUser = authAPI.isAdmin();

  // Fetch POPULATED project details
  const {
    data: project, // Directly use 'project' as the populated data object
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const response = await projectsAPI.getProjectById(projectId);
      if (!response.success) {
        // Throw an error to be caught by React Query's error state
        throw new Error(response.message || "Failed to fetch project details.");
      }
      return response.data; // Return the populated project object directly
    },
    enabled: !!projectId, // Ensure query only runs if projectId exists
    refetchOnWindowFocus: false, // Optional: prevent refetch on window focus
    staleTime: 5 * 60 * 1000, // Optional: Cache data for 5 minutes
  });

  // Delete project mutation
  const deleteMutation = useMutation({
    mutationFn: projectsAPI.deleteProject, // API function expects project ID
    onSuccess: () => {
      toast.success("Project deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["projects"] }); // Invalidate list view
      queryClient.removeQueries({ queryKey: ["project", projectId] }); // Remove detail view cache
      navigate("/admin/projects"); // Navigate back to list
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete project");
      setIsDeleting(false);
    },
    onMutate: () => {
      setIsDeleting(true); // Set deleting state immediately
    }
  });

  // Handle project deletion confirmation
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this project and ALL related data (tasks, materials, etc.)? This action cannot be undone.")) {
      deleteMutation.mutate(projectId); // Pass the project ID to the mutation
    }
  };

  // Redirect if not admin (do this early)
  // Consider doing this at the route level for better protection
  if (!isAdminUser) {
    // navigate("/dashboard"); // Or wherever non-admins should go
    // return null; // Render nothing while navigating
     return (
         <div className="text-center py-20 text-red-600">
             <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4" />
             <h2 className="text-xl font-semibold">Access Denied</h2>
             <p>You do not have permission to view this page.</p>
             <button onClick={() => navigate('/dashboard')} className="mt-4 btn btn-primary">Go to Dashboard</button>
         </div>
     );
  }

  // --- Render Logic ---

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin mb-3" />
        <p className="text-gray-500">Loading project details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 max-w-lg mx-auto bg-red-50 p-6 rounded-lg shadow">
        <ExclamationTriangleIcon className="h-10 w-10 mx-auto text-red-500 mb-3" />
        <p className="text-red-700 font-semibold mb-2">Failed to load project details</p>
        <p className="text-red-600 text-sm mb-4">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowPathIcon className="h-5 w-5 mr-2" />
          Retry
        </button>
        <button
          onClick={() => navigate("/admin/projects")}
          className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
           <ArrowUturnLeftIcon className="h-5 w-5 mr-2" />
          Back to Projects
        </button>
      </div>
    );
  }

  // If loading is done, no error, but project is somehow null/undefined (shouldn't happen with RQ error handling)
  if (!project) {
     return <div className="text-center py-20 text-gray-500">Project data is unavailable.</div>;
  }

  // --- Main Project Detail Display ---
  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header with Title and Actions */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8 pb-4 border-b border-gray-200">
        <div>
          <button
             onClick={() => navigate("/admin/projects")}
             className="text-sm text-gray-500 hover:text-gray-700 flex items-center mb-1"
           >
             <ArrowUturnLeftIcon className="h-4 w-4 mr-1" /> Back to Projects
           </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center">
            {project.projectName}
            <span className={`ml-3 px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(project.status)}`}>
              {getStatusLabel(project.status)}
            </span>
          </h1>
          <p className="text-gray-500 text-sm">{project.projectDescription}</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-shrink-0 space-x-3">
          <button
            type="button"
            onClick={() => navigate(`/admin/projects/edit/${projectId}`)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PencilSquareIcon className="h-5 w-5 mr-2 text-gray-500" />
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className={`inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors duration-150
            ${isDeleting ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
          >
            {isDeleting ? (
              <>
                <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <TrashIcon className="h-5 w-5 mr-2" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-8">

         {/* Project Core Details Card */}
         <div className="bg-white shadow overflow-hidden sm:rounded-lg">
           <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Project Details</h3>
           </div>
           <div className="px-4 py-5 sm:p-6">
             <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                 {/* Repeat for other fields */}
                 <div>
                     <dt className="text-sm font-medium text-gray-500 flex items-center"><MapPinIcon className="h-4 w-4 mr-1.5 text-gray-400"/>Location</dt>
                     <dd className="mt-1 text-sm text-gray-900">{project.projectLocation}</dd>
                 </div>
                 <div>
                     <dt className="text-sm font-medium text-gray-500 flex items-center"><CurrencyDollarIcon className="h-4 w-4 mr-1.5 text-gray-400"/>Budget</dt>
                     <dd className="mt-1 text-sm text-gray-900">{formatCurrency(project.projectBudget)}</dd>
                 </div>
                 <div>
                     <dt className="text-sm font-medium text-gray-500 flex items-center"><CalendarIcon className="h-4 w-4 mr-1.5 text-gray-400"/>Start Date</dt>
                     <dd className="mt-1 text-sm text-gray-900">{formatDate(project.startDate)}</dd>
                 </div>
                 <div>
                     <dt className="text-sm font-medium text-gray-500 flex items-center"><CalendarIcon className="h-4 w-4 mr-1.5 text-gray-400"/>End Date</dt>
                     <dd className="mt-1 text-sm text-gray-900">{formatDate(project.endDate)}</dd>
                 </div>
                 <div>
                     <dt className="text-sm font-medium text-gray-500 flex items-center"><ClockIcon className="h-4 w-4 mr-1.5 text-gray-400"/>Duration</dt>
                     <dd className="mt-1 text-sm text-gray-900">
                         {/* Use populated virtual or calculate */}
                         {project.duration ? `${project.duration} days` : 'N/A'}
                     </dd>
                 </div>
                 <div>
                     <dt className="text-sm font-medium text-gray-500">Created At</dt>
                     <dd className="mt-1 text-sm text-gray-900">{formatDateTime(project.createdAt)}</dd>
                 </div>

             </dl>
           </div>
         </div>

         {/* Contractor & Consultant Card */}
         <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Personnel</h3>
            </div>
             <div className="px-4 py-5 sm:p-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                 <div>
                     <dt className="text-sm font-medium text-gray-500 flex items-center"><UserIcon className="h-4 w-4 mr-1.5 text-gray-400"/>Contractor</dt>
                     {project.contractor ? (
                         <dd className="mt-1 text-sm text-gray-900">
                             <p className="font-semibold">{project.contractor.firstName} {project.contractor.lastName}</p>
                             <p className="text-gray-600">{project.contractor.email}</p>
                             {project.contractor.phone && <p className="text-gray-600">{project.contractor.phone}</p>}
                             <p className="text-xs text-gray-500 capitalize mt-0.5 flex items-center"><BriefcaseIcon className="h-3 w-3 mr-1"/>{project.contractor.role?.replace('_', ' ')}</p>
                         </dd>
                     ) : ( <dd className="mt-1 text-sm text-gray-500 italic">Not assigned</dd> )}
                 </div>
                 <div>
                     <dt className="text-sm font-medium text-gray-500 flex items-center"><UserIcon className="h-4 w-4 mr-1.5 text-gray-400"/>Consultant</dt>
                      {project.consultant ? (
                         <dd className="mt-1 text-sm text-gray-900">
                             <p className="font-semibold">{project.consultant.firstName} {project.consultant.lastName}</p>
                             <p className="text-gray-600">{project.consultant.email}</p>
                              {project.consultant.phone && <p className="text-gray-600">{project.consultant.phone}</p>}
                             <p className="text-xs text-gray-500 capitalize mt-0.5 flex items-center"><BriefcaseIcon className="h-3 w-3 mr-1"/>{project.consultant.role?.replace('_', ' ')}</p>
                         </dd>
                     ) : ( <dd className="mt-1 text-sm text-gray-500 italic">Not assigned</dd> )}
                 </div>
             </div>
         </div>


        {/* Related Data Sections (Materials, Schedules, Tasks, Comments) */}
        {/* Use consistent card structure */}

        {/* Materials Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                    <WrenchScrewdriverIcon className="h-5 w-5 mr-2 text-gray-500"/> Materials
                </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
                {project.materials && project.materials.length > 0 ? (
                    <div className="-mx-4 sm:-mx-6 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {project.materials.map((material) => (
                            <tr key={material._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{material.materialName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.materialType}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.quantity} {material.unit}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(material.totalCost)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(material.status)}`}>
                                        {getStatusLabel(material.status)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 italic">No materials assigned yet.</p>
                )}
            </div>
        </div>

        {/* Schedules Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
             <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                 <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                     <ListBulletIcon className="h-5 w-5 mr-2 text-gray-500"/> Schedules
                 </h3>
             </div>
             <div className="px-4 py-5 sm:p-6">
                 {project.schedules && project.schedules.length > 0 ? (
                      <div className="-mx-4 sm:-mx-6 overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                              <tr>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                                  {/* Add Task Name if populated - schedule.task.taskName */}
                                  {/* Add Assigned To if populated - schedule.assignedTo.firstName */}
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                              {project.schedules.map((schedule) => (
                                  <tr key={schedule._id}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{schedule.scheduleName}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{schedule.priority}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                                           <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(schedule.status)}`}>
                                             {getStatusLabel(schedule.status)}
                                          </span>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                      </div>
                 ) : (
                     <p className="text-sm text-gray-500 italic">No schedules assigned yet.</p>
                 )}
             </div>
         </div>

         {/* Tasks Section */}
         <div className="bg-white shadow overflow-hidden sm:rounded-lg">
             <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                 <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                     <ListBulletIcon className="h-5 w-5 mr-2 text-gray-500"/> Tasks
                 </h3>
             </div>
             <div className="px-4 py-5 sm:p-6">
                 {project.tasks && project.tasks.length > 0 ? (
                      <div className="-mx-4 sm:-mx-6 overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                           <thead className="bg-gray-50">
                               <tr>
                                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                    {/* Add Assigned To if populated - needs User population on Task model or separate query */}
                                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                               </tr>
                           </thead>
                           <tbody className="bg-white divide-y divide-gray-200">
                               {project.tasks.map((task) => (
                                   <tr key={task._id}>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.taskName}</td>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(task.startDate)} - {formatDate(task.endDate)}</td>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{task.priority}</td>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm">
                                           <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(task.status)}`}>
                                               {getStatusLabel(task.status)}
                                           </span>
                                       </td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                       </div>
                 ) : (
                     <p className="text-sm text-gray-500 italic">No tasks assigned yet.</p>
                 )}
             </div>
         </div>


        {/* Comments Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                    <ChatBubbleLeftEllipsisIcon className="h-5 w-5 mr-2 text-gray-500"/> Comments
                </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
                {project.comments && project.comments.length > 0 ? (
                <ul className="space-y-4">
                    {project.comments.map((comment) => (
                    <li key={comment._id} className="border p-4 rounded-md bg-gray-50 shadow-sm">
                        <p className="text-sm text-gray-800 mb-2" style={{ whiteSpace: 'pre-wrap' }}>{comment.content}</p>
                        <div className="text-xs text-gray-500 flex items-center justify-between">
                            <span className="flex items-center">
                                <UserIcon className="h-3 w-3 mr-1 text-gray-400"/>
                                {comment.user ? `${comment.user.firstName} ${comment.user.lastName}` : 'Unknown User'}
                            </span>
                            <span className="flex items-center">
                                <ClockIcon className="h-3 w-3 mr-1 text-gray-400"/>
                                {formatDateTime(comment.createdAt)}
                            </span>
                        </div>
                    </li>
                    ))}
                </ul>
                ) : (
                <p className="text-sm text-gray-500 italic">No comments yet.</p>
                )}
                {/* Optionally Add a "New Comment" form here */}
            </div>
        </div>

      </div> {/* End main content space-y */}
    </div> // End container
  );
};

export default ProjectDetail;