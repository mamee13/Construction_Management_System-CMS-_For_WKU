


/*eslint-disable */
import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
  ArrowUturnLeftIcon,
  ExclamationTriangleIcon,
  BriefcaseIcon,
  PhoneIcon, // Keep if used, otherwise remove
  ChatBubbleLeftEllipsisIcon,
  WrenchScrewdriverIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";

import projectsAPI from "@/APi/projects";
import authAPI from "@/APi/auth";

// --- Helper Functions (Remain the same) ---
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    // Added check for invalid date objects directly
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
        // Added check for invalid date objects directly
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
}

const formatCurrency = (amount) => {
    // Simplified check
    if (typeof amount !== 'number' || isNaN(amount)) return 'N/A';
    return `$${amount.toLocaleString()}`;
};

const getStatusLabel = (status) => {
    const labels = {
        planned: 'Planned', in_progress: 'In Progress', completed: 'Completed', on_hold: 'On Hold',
        // Assuming these might apply to related items based on original code
        not_started: 'Not Started', delayed: 'Delayed',
        ordered: 'Ordered', delivered: 'Delivered', in_use: 'In Use', depleted: 'Depleted'
    };
    // Improved fallback
    return labels[status] || status?.toString().replace(/_/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
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
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  // Check admin status once
  const isAdminUser = authAPI.isAdmin();

  // Fetch POPULATED project details
  const {
    data: project,
    isLoading,
    error,
    refetch,
    isFetching, // Added to potentially show refetching state
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      console.log(`Fetching project with ID: ${projectId}`);
      const response = await projectsAPI.getProjectById(projectId);
      console.log("API Response:", response); // Log the raw API response
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch project details.");
      }
      console.log("Fetched Project Data:", response.data); // Log the data being returned
      return response.data; // Backend already sends populated data
    },
    enabled: !!projectId,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    // Add error logging
    onError: (err) => {
        console.error("React Query Error fetching project:", err);
    }
  });

  // Delete project mutation
  const deleteMutation = useMutation({
    mutationFn: projectsAPI.deleteProject,
    onSuccess: (data) => { // Backend sends success message
      toast.success(data.message || "Project deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.removeQueries({ queryKey: ["project", projectId] });
      navigate("/admin/projects");
    },
    onError: (err) => {
      console.error("Delete Mutation Error:", err);
      // Use error message from backend if available
      const errorMsg = err?.message || err?.data?.message || "Failed to delete project";
      toast.error(errorMsg);
      setIsDeleting(false);
    },
    onMutate: () => {
      setIsDeleting(true);
    }
  });

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this project and ALL related data (tasks, materials, etc.)? This action cannot be undone.")) {
      deleteMutation.mutate(projectId);
    }
  };

  // Access Denied Check
  if (!isAdminUser && !isLoading) { // Check only after confirming not loading
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
          disabled={isFetching} // Disable retry button while fetching
          className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isFetching ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <ArrowPathIcon className={`h-5 w-5 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? 'Retrying...' : 'Retry'}
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

  // If loading/error handled, but project is still falsy (should be rare with RQ setup)
  if (!project) {
     return <div className="text-center py-20 text-gray-500">Project data is unavailable or could not be loaded.</div>;
  }

  // --- Main Project Detail Display ---
  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8 pb-4 border-b border-gray-200">
        <div>
          <button
             onClick={() => navigate("/admin/projects")}
             className="text-sm text-gray-500 hover:text-gray-700 flex items-center mb-1"
           >
             <ArrowUturnLeftIcon className="h-4 w-4 mr-1" /> Back to Projects
           </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center flex-wrap"> {/* Added flex-wrap */}
            {project.projectName || 'Unnamed Project'} {/* Fallback */}
            {project.status && (
              <span className={`ml-3 mt-1 sm:mt-0 px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(project.status)}`}>
                {getStatusLabel(project.status)}
              </span>
            )}
          </h1>
          {/* Use optional chaining for description just in case */}
          <p className="text-gray-500 text-sm">{project.projectDescription || 'No description provided.'}</p>
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
                 <div>
                     <dt className="text-sm font-medium text-gray-500 flex items-center"><MapPinIcon className="h-4 w-4 mr-1.5 text-gray-400"/>Location</dt>
                     {/* Use fallback for potentially empty strings */}
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
                         {/* Backend virtual calculates this. If dates missing, it's 0. */}
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

         {/* Personnel Card */}
         <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Personnel</h3>
            </div>
             <div className="px-4 py-5 sm:p-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                 {/* Contractor */}
                 <div>
                     <dt className="text-sm font-medium text-gray-500 flex items-center"><UserIcon className="h-4 w-4 mr-1.5 text-gray-400"/>Contractor</dt>
                     {/* Check if contractor object exists (backend populates this) */}
                     {project.contractor ? (
                         <dd className="mt-1 text-sm text-gray-900">
                            {/* Use optional chaining for safety, though should exist if contractor obj exists */}
                             <p className="font-semibold">{project.contractor?.firstName} {project.contractor?.lastName}</p>
                             <p className="text-gray-600">{project.contractor?.email || 'No email'}</p>
                             {/* Only show phone if it exists */}
                             {project.contractor?.phone && <p className="text-gray-600 flex items-center"><PhoneIcon className="h-3 w-3 mr-1 text-gray-400"/>{project.contractor.phone}</p>}
                             {project.contractor?.role && <p className="text-xs text-gray-500 capitalize mt-0.5 flex items-center"><BriefcaseIcon className="h-3 w-3 mr-1"/>{project.contractor.role.replace('_', ' ')}</p>}
                         </dd>
                     ) : ( <dd className="mt-1 text-sm text-gray-500 italic">Not assigned</dd> )}
                 </div>
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
             </div>
         </div>

        {/* Materials Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                    <WrenchScrewdriverIcon className="h-5 w-5 mr-2 text-gray-500"/> Materials
                </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
                {/* Check populated array */}
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
                            // Add optional chaining for robustness
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
                {/* Backend sorts comments */}
                {project.comments && project.comments.length > 0 ? (
                <ul className="space-y-4">
                    {project.comments.map((comment) => (
                    // Check if comment and user exist (backend populates user)
                    <li key={comment?._id} className="border p-4 rounded-md bg-gray-50 shadow-sm">
                        <p className="text-sm text-gray-800 mb-2" style={{ whiteSpace: 'pre-wrap' }}>{comment?.content || '...'}</p>
                        <div className="text-xs text-gray-500 flex items-center justify-between flex-wrap gap-2"> {/* Added wrap/gap */}
                            <span className="flex items-center">
                                <UserIcon className="h-3 w-3 mr-1 text-gray-400"/>
                                {/* Nested optional chaining for user */}
                                {comment?.user ? `${comment.user?.firstName || ''} ${comment.user?.lastName || ''}`.trim() || 'Unknown User' : 'Unknown User'}
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
                <p className="text-sm text-gray-500 italic">No comments yet.</p>
                )}
                {/* TODO: Add a "New Comment" form here */}
            </div>
        </div>

      </div> {/* End main content space-y */}
    </div> // End container
  );
};

export default ProjectDetail;