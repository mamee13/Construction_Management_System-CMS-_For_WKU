
/* eslint-disable */
import { useState, useEffect } from "react"; // Added useEffect back
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query"; // Removed unused useMutation
import {
  ArrowPathIcon,
  // PencilSquareIcon, // Removed - Contractor doesn't edit project
  // TrashIcon, // Removed - Contractor doesn't delete project
  CalendarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  UserIcon,
  ClockIcon,
  ArrowUturnLeftIcon,
  ExclamationTriangleIcon,
  BriefcaseIcon,
  PhoneIcon,
  ChatBubbleLeftEllipsisIcon,
  WrenchScrewdriverIcon,
  ListBulletIcon,
  CubeIcon, // Keep for "Add Material" button if needed
  DocumentTextIcon, // Keep for "Create Report" button if needed
} from "@heroicons/react/24/outline";
// Removed toast import as delete/edit mutations are gone
// import { toast } from "react-toastify";

// Assuming APIs are in the correct relative path for this component
import projectsAPI from '../../../api/projects'; // Adjusted path
import authAPI from '../../../api/auth'; // Adjusted path

// --- Helper Functions (Copied from ProjectDetail for consistency) ---
const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Invalid Date";
        return date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch (e) {
        return "Invalid Date";
    }
};

const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Invalid Date";
        return date.toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: 'numeric',
            minute: '2-digit'
        });
    } catch (e) {
        return "Invalid Date";
    }
};

const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return 'N/A';
    return `$${amount.toLocaleString()}`;
};

const getStatusLabel = (status) => {
    // Use the API function if available, otherwise fallback
    if (projectsAPI && projectsAPI.getStatusLabel) {
         return projectsAPI.getStatusLabel(status);
    }
    // Fallback logic from ProjectDetail if API function not found
    const labels = {
        planned: 'Planned', in_progress: 'In Progress', completed: 'Completed', on_hold: 'On Hold',
        not_started: 'Not Started', delayed: 'Delayed',
        ordered: 'Ordered', delivered: 'Delivered', in_use: 'In Use', depleted: 'Depleted',
        // Add report statuses if needed here
        pending: 'Pending', approved: 'Approved', rejected: 'Rejected'
    };
    return labels[status] || status?.toString().replace(/_/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
};

const getStatusBadgeColor = (status) => {
     // Use the API function if available, otherwise fallback
    if (projectsAPI && projectsAPI.getStatusBadgeColor) {
         return projectsAPI.getStatusBadgeColor(status); // Assumes it returns Tailwind classes
    }
    // Fallback logic from ProjectDetail if API function not found
    const colors = {
        planned: 'bg-gray-100 text-gray-800', not_started: 'bg-gray-100 text-gray-800',
        in_progress: 'bg-blue-100 text-blue-800',
        completed: 'bg-green-100 text-green-800', delivered: 'bg-green-100 text-green-800', approved: 'bg-green-100 text-green-800',
        on_hold: 'bg-yellow-100 text-yellow-800', ordered: 'bg-yellow-100 text-yellow-800', pending: 'bg-yellow-100 text-yellow-800',
        delayed: 'bg-red-100 text-red-800', depleted: 'bg-red-100 text-red-800', rejected: 'bg-red-100 text-red-800',
        in_use: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
};
// --- End Helper Functions ---


const ProjectDetailForContractor = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient(); // Keep for potential refetch/invalidation
  const currentUser = authAPI.getCurrentUser(); // Get contractor info

  // Fetch POPULATED project details
  const {
    data: project,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["project", projectId], // Unique query key per project
    queryFn: async () => {
      // Contractor uses the same endpoint, backend authorization handles access
      const response = await projectsAPI.getProjectById(projectId);
      if (!response.success) {
        // Throw error that React Query can catch
        throw new Error(response.message || "Failed to fetch project details.");
      }
      // Ensure backend sends populated data as needed by this component
      return response.data;
    },
    enabled: !!projectId, // Only fetch if projectId exists
    refetchOnWindowFocus: false, // Optional: prevent refetch on window focus
    staleTime: 5 * 60 * 1000, // Optional: data fresh for 5 mins
    onError: (err) => {
        console.error("React Query Error fetching project for contractor:", err);
    }
  });

  // --- Authorization Effect (Crucial for Contractor) ---
  useEffect(() => {
    // 1. Basic Authentication & Role Check
    if (!authAPI.isAuthenticated()) {
      console.log("[ContractorDetail] Not authenticated, navigating to login.");
      navigate('/login', { replace: true });
      return;
    }
    if (!currentUser || currentUser.role !== 'contractor') {
      console.log(`[ContractorDetail] User role is ${currentUser?.role}, navigating to dashboard.`);
      navigate('/dashboard', { replace: true });
      return;
    }

    // 2. Project-Specific Authorization (Only after data loads/no error)
    if (!isLoading && !error && project && currentUser) {
      const contractorId = project.contractor?._id;
      if (contractorId !== currentUser._id) {
        console.warn(`[ContractorDetail] Auth failed: Project contractor (${contractorId}) != Current user (${currentUser._id}). Redirecting.`);
        navigate('/contractor-projects', { replace: true });
      } else {
        console.log(`[ContractorDetail] Auth successful for user ${currentUser._id} on project ${projectId}.`);
      }
    }
    // No action needed for isLoading or error states here, they are handled by return statements

  }, [currentUser, navigate, project, isLoading, error, projectId]); // Added projectId to deps


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
    // Use the more detailed error display from ProjectDetail
    return (
      <div className="text-center py-20 max-w-lg mx-auto bg-red-50 p-6 rounded-lg shadow">
        <ExclamationTriangleIcon className="h-10 w-10 mx-auto text-red-500 mb-3" />
        <p className="text-red-700 font-semibold mb-2">Failed to load project details</p>
        {/* Display the specific error message */}
        <p className="text-red-600 text-sm mb-4">{error.message || 'An unknown error occurred.'}</p>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isFetching ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <ArrowPathIcon className={`h-5 w-5 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? 'Retrying...' : 'Retry'}
        </button>
        <button
          onClick={() => navigate("/contractor-projects")} // Navigate back to contractor list
          className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
           <ArrowUturnLeftIcon className="h-5 w-5 mr-2" />
          Back to My Projects
        </button>
      </div>
    );
  }

  // If loading/error handled, but project is still falsy
  if (!project) {
     // This might indicate an issue caught by the useEffect redirect or a backend 404 not throwing error correctly
     return (
         <div className="text-center py-20 max-w-lg mx-auto bg-yellow-50 p-6 rounded-lg shadow">
             <ExclamationTriangleIcon className="h-10 w-10 mx-auto text-yellow-500 mb-3" />
             <p className="text-yellow-700 font-semibold mb-2">Project Not Found</p>
             <p className="text-yellow-600 text-sm mb-4">The project may not exist or you may not have permission to view it.</p>
             <button
                 onClick={() => navigate("/contractor-projects")}
                 className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                 >
                 <ArrowUturnLeftIcon className="h-5 w-5 mr-2" />
                 Back to My Projects
             </button>
         </div>
     );
  }

  // --- Main Project Detail Display (Contractor View) ---
  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8 pb-4 border-b border-gray-200">
        <div>
          <button
             onClick={() => navigate("/contractor-projects")} // Correct back navigation
             className="text-sm text-gray-500 hover:text-gray-700 flex items-center mb-1"
           >
             <ArrowUturnLeftIcon className="h-4 w-4 mr-1" /> Back to My Projects
           </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center flex-wrap">
            {project.projectName || 'Unnamed Project'}
            {project.status && (
              <span className={`ml-3 mt-1 sm:mt-0 px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(project.status)}`}>
                {getStatusLabel(project.status)}
              </span>
            )}
          </h1>
          <p className="text-gray-500 text-sm">{project.projectDescription || 'No description provided.'}</p>
        </div>
        {/* No Edit/Delete buttons for contractor */}
        <div className="mt-4 sm:mt-0 flex flex-shrink-0 space-x-3">
            {/* Potential Contractor Actions Here? e.g., Create Report */}
            <Link
                to={`/contractor-reports/create?projectId=${projectId}`} // Example action
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Create Report
            </Link>
        </div>
      </div>

      {/* Main Content Area - Adopted from Admin Detail */}
      <div className="space-y-8">

         {/* Project Core Details Card */}
         <div className="bg-white shadow overflow-hidden sm:rounded-lg">
           <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Project Details</h3>
           </div>
           <div className="px-4 py-5 sm:p-6">
             <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                 <div>
                     <dt className="text-sm font-medium text-gray-500 flex items-center"><MapPinIcon className="h-4 w-4 mr-1.5 text-gray-400"/>Location</dt>
                     <dd className="mt-1 text-sm text-gray-900">{project.projectLocation || 'N/A'}</dd>
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
                         {project.duration > 0 ? `${project.duration} days` : 'N/A'}
                     </dd>
                 </div>
                 <div>
                     <dt className="text-sm font-medium text-gray-500">Created At</dt>
                     <dd className="mt-1 text-sm text-gray-900">{formatDateTime(project.createdAt)}</dd>
                 </div>
             </dl>
           </div>
         </div>

         {/* Personnel Card (Focus on Others) */}
         <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Key Contacts</h3>
            </div>
             {/* Simplified grid, focusing on Consultant and PM */}
             <div className="px-4 py-5 sm:p-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  {/* Consultant */}
                 <div>
                     <dt className="text-sm font-medium text-gray-500 flex items-center"><UserIcon className="h-4 w-4 mr-1.5 text-gray-400"/>Consultant</dt>
                      {project.consultant ? (
                         <dd className="mt-1 text-sm text-gray-900">
                             <p className="font-semibold">{project.consultant?.firstName} {project.consultant?.lastName}</p>
                             <p className="text-gray-600">{project.consultant?.email || 'No email'}</p>
                              {project.consultant?.phone && <p className="text-gray-600 flex items-center"><PhoneIcon className="h-3 w-3 mr-1 text-gray-400"/>{project.consultant.phone}</p>}
                             {project.consultant?.role && <p className="text-xs text-gray-500 capitalize mt-0.5 flex items-center"><BriefcaseIcon className="h-3 w-3 mr-1"/>{project.consultant.role.replace('_', ' ')}</p>}
                         </dd>
                     ) : ( <dd className="mt-1 text-sm text-gray-500 italic">Not assigned</dd> )}
                 </div>
                 {/* Project Manager */}
                  <div>
                     <dt className="text-sm font-medium text-gray-500 flex items-center"><UserIcon className="h-4 w-4 mr-1.5 text-gray-400"/>Project Manager</dt>
                      {project.projectManager ? (
                         <dd className="mt-1 text-sm text-gray-900">
                             <p className="font-semibold">{project.projectManager?.firstName} {project.projectManager?.lastName}</p>
                             <p className="text-gray-600">{project.projectManager?.email || 'No email'}</p>
                              {project.projectManager?.phone && <p className="text-gray-600 flex items-center"><PhoneIcon className="h-3 w-3 mr-1 text-gray-400"/>{project.projectManager.phone}</p>}
                             {project.projectManager?.role && <p className="text-xs text-gray-500 capitalize mt-0.5 flex items-center"><BriefcaseIcon className="h-3 w-3 mr-1"/>{project.projectManager.role.replace('_', ' ')}</p>}
                         </dd>
                     ) : ( <dd className="mt-1 text-sm text-gray-500 italic">Not assigned</dd> )}
                 </div>
             </div>
         </div>

        {/* Materials Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center flex-wrap gap-3">
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                    <WrenchScrewdriverIcon className="h-5 w-5 mr-2 text-gray-500"/> Materials
                </h3>
                {/* Optional: Link to add material */}
                <Link
                    to={`/materials/create?projectId=${projectId}`}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                   <CubeIcon className="h-4 w-4 mr-1.5" /> Add Material
                </Link>
            </div>
            <div className="px-4 py-5 sm:p-6">
                {project.materials && project.materials.length > 0 ? (
                    <div className="-mx-4 sm:-mx-6 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        {/* Use the same thead/tbody structure as ProjectDetail */}
                         <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            {/* No Actions column for contractor (unless view/edit material is needed) */}
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {project.materials.map((material) => (
                            <tr key={material?._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{material?.materialName || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material?.materialType || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material?.quantity || 'N/A'} {material?.unit}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(material?.totalCost)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {material?.status ? (
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(material.status)}`}>
                                            {getStatusLabel(material.status)}
                                        </span>
                                    ) : 'N/A'}
                                </td>
                                {/* Add View/Edit links if contractor needs to manage materials */}
                                {/* <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Link to={`/materials/${material._id}?projectId=${projectId}`} className="text-indigo-600 hover:text-indigo-900">View</Link>
                                </td> */}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </div>
                ) : (
                     <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                        <WrenchScrewdriverIcon className="mx-auto h-10 w-10 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500 italic">No materials assigned yet.</p>
                    </div>
                )}
            </div>
        </div>

        {/* Schedules Section (If needed by Contractor) */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
             <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                 <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                     <ListBulletIcon className="h-5 w-5 mr-2 text-gray-500"/> Schedules
                 </h3>
             </div>
             <div className="px-4 py-5 sm:p-6">
                  {/* Ensure backend populates project.schedules */}
                 {project.schedules && project.schedules.length > 0 ? (
                      <div className="-mx-4 sm:-mx-6 overflow-x-auto">
                         {/* Same table structure as ProjectDetail */}
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                              <tr>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                              {project.schedules.map((schedule) => (
                                  <tr key={schedule?._id}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{schedule?.scheduleName || 'N/A'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(schedule?.startDate)} - {formatDate(schedule?.endDate)}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{schedule?.priority || 'N/A'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                                          {schedule?.status ? (
                                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(schedule.status)}`}>
                                                {getStatusLabel(schedule.status)}
                                             </span>
                                          ) : 'N/A'}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                      </div>
                 ) : (
                     <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                        <ListBulletIcon className="mx-auto h-10 w-10 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500 italic">No schedules assigned yet.</p>
                    </div>
                 )}
             </div>
         </div>

         {/* Tasks Section (If needed by Contractor) */}
         <div className="bg-white shadow overflow-hidden sm:rounded-lg">
             <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                 <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                     <ListBulletIcon className="h-5 w-5 mr-2 text-gray-500"/> Tasks
                 </h3>
             </div>
             <div className="px-4 py-5 sm:p-6">
                  {/* Ensure backend populates project.tasks */}
                 {project.tasks && project.tasks.length > 0 ? (
                    <div className="-mx-4 sm:-mx-6 overflow-x-auto">
                        {/* Same table structure as ProjectDetail */}
                        <table className="min-w-full divide-y divide-gray-200">
                           <thead className="bg-gray-50">
                               <tr>
                                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                               </tr>
                           </thead>
                           <tbody className="bg-white divide-y divide-gray-200">
                               {project.tasks.map((task) => (
                                   <tr key={task?._id}>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task?.taskName || 'N/A'}</td>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(task?.startDate)} - {formatDate(task?.endDate)}</td>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{task?.priority || 'N/A'}</td>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm">
                                          {task?.status ? (
                                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(task.status)}`}>
                                                  {getStatusLabel(task.status)}
                                              </span>
                                          ) : 'N/A'}
                                       </td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                    </div>
                 ) : (
                     <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                        <ListBulletIcon className="mx-auto h-10 w-10 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500 italic">No tasks assigned yet.</p>
                    </div>
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
                 {/* Ensure backend populates project.comments and comment.user */}
                {project.comments && project.comments.length > 0 ? (
                <ul className="space-y-4">
                    {project.comments.map((comment) => (
                    <li key={comment?._id} className="border p-4 rounded-md bg-gray-50 shadow-sm">
                        <p className="text-sm text-gray-800 mb-2" style={{ whiteSpace: 'pre-wrap' }}>{comment?.content || '...'}</p>
                        <div className="text-xs text-gray-500 flex items-center justify-between flex-wrap gap-2">
                            <span className="flex items-center">
                                <UserIcon className="h-3 w-3 mr-1 text-gray-400"/>
                                {comment?.user ? `${comment.user?.firstName || ''} ${comment.user?.lastName || ''}`.trim() || 'Unknown User' : 'System Comment?'}
                            </span>
                            <span className="flex items-center">
                                <ClockIcon className="h-3 w-3 mr-1 text-gray-400"/>
                                {formatDateTime(comment?.createdAt)}
                            </span>
                        </div>
                    </li>
                    ))}
                </ul>
                ) : (
                     <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                        <ChatBubbleLeftEllipsisIcon className="mx-auto h-10 w-10 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500 italic">No comments yet.</p>
                    </div>
                )}
                {/* TODO: Add a "New Comment" form specific for contractors */}
                 <div className="mt-6">
                     {/* Placeholder for adding a comment */}
                     <textarea className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500" rows="3" placeholder="Add a comment..."></textarea>
                     <button className="mt-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                         Post Comment
                     </button>
                 </div>
            </div>
        </div>

      </div> {/* End main content space-y */}
    </div> // End container
  );
};

export default ProjectDetailForContractor;