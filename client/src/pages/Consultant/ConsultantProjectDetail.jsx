// src/pages/consultant/ProjectDetail.jsx
/*eslint-disable */
import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  UserCircleIcon, // For PM/Contractor
  CalendarDaysIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  DocumentPlusIcon, // For adding report
  ListBulletIcon,   // For viewing tasks/schedules
  ChatBubbleLeftRightIcon, // For comments
} from '@heroicons/react/24/outline';

import authAPI from '../../api/auth'; // Adjust path if needed
import projectsAPI from '../../api/projects'; // Adjust path if needed

// Placeholder components for related items (replace with actual later)
const ProjectReportsSection = ({ projectId }) => (
  <div className="mt-4 p-4 border rounded-md bg-gray-50">
    <h3 className="text-lg font-semibold mb-2 text-gray-700">My Reports for this Project</h3>
    <p className="text-sm text-gray-500 mb-3">View submitted reports or add a new one.</p>
    {/* Link to create report page, passing project ID */}
    <Link
      to={`/reports/create?projectId=${projectId}`} // Example route
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
    >
      <DocumentPlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
      Submit New Report
    </Link>
    {/* Link to view reports page, filtered by project ID */}
    <Link
      to={`/reports?projectId=${projectId}`} // Example route
      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
       <ListBulletIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
      View Submitted Reports
    </Link>
  </div>
);

const ProjectTasksSection = ({ projectId }) => (
   <div className="mt-4 p-4 border rounded-md bg-gray-50">
    <h3 className="text-lg font-semibold mb-2 text-gray-700">My Tasks for this Project</h3>
    <p className="text-sm text-gray-500 mb-3">View tasks assigned to you for this project.</p>
     <Link
      to={`/tasks?projectId=${projectId}`} // Example route
      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
       <ListBulletIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
      View My Tasks
    </Link>
  </div>
);
const ProjectSchedulesSection = ({ projectId }) => (
  <div className="mt-4 p-4 border rounded-md bg-gray-50">
    <h3 className="text-lg font-semibold mb-2 text-gray-700">Project Schedules</h3>
    <p className="text-sm text-gray-500 mb-3">View relevant project schedules or milestones.</p>
     <Link
      to={`/schedules?projectId=${projectId}`} // Example route
      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
       <ListBulletIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
      View Schedules
    </Link>
  </div>
);
const ProjectCommentsSection = ({ projectId }) => (
   <div className="mt-4 p-4 border rounded-md bg-gray-50">
    <h3 className="text-lg font-semibold mb-2 text-gray-700">Project Discussion</h3>
    <p className="text-sm text-gray-500 mb-3">Add comments or view the discussion thread.</p>
    {/* Add comment form or link here */}
     <button
        // onClick={() => {/* Open comments modal or section */}}
        disabled // Placeholder
        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
     >
       <ChatBubbleLeftRightIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
       View/Add Comments (Coming Soon)
     </button>
  </div>
);
// --- End Placeholder Components ---


const ConsultantProjectDetail = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const currentUser = authAPI.getCurrentUser();

  // Fetch project details
  const {
    data: projectData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsAPI.getProjectById(projectId),
    enabled: !!projectId && !!currentUser?._id, // Only fetch if projectId and user exist
    // Optional: configure staleTime or cacheTime
    // staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Extract project from the response structure (adjust if your API differs)
  const project = projectData?.data;

  // Security Check: Verify the current user is the consultant for THIS project
  const isAuthorizedConsultant = project && project.consultant?._id === currentUser?._id;

  useEffect(() => {
    // If data loaded, project exists, but user is NOT the assigned consultant
    if (project && !isAuthorizedConsultant && !isLoading) {
      console.warn(`User ${currentUser?._id} is not the authorized consultant for project ${projectId}. Redirecting.`);
      navigate('/projects', { replace: true }); // Redirect back to their project list
    }
  }, [project, isAuthorizedConsultant, isLoading, currentUser, projectId, navigate]);


  // Handle Loading State
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-gray-600">Loading project details...</span>
      </div>
    );
  }

  // Handle Error State
  if (isError) {
    return (
       <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center">
         <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-red-500" />
         <h2 className="mt-4 text-xl font-semibold text-red-800">Error Loading Project</h2>
         <p className="mt-2 text-sm text-red-600">
           Could not fetch details for this project. {error?.message || 'Please try again later.'}
         </p>
         <button
           onClick={() => refetch()}
           className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
         >
           <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5" />
           Retry
         </button>
          <button
            onClick={() => navigate(-1)} // Go back to previous page
            className="mt-6 ml-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
             Go Back
          </button>
       </div>
    );
  }

  // Handle Project Not Found (or user not authorized yet - though useEffect should redirect)
  if (!project || !isAuthorizedConsultant) {
     // This state might briefly show before the useEffect redirects
    return (
      <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center">
         <InformationCircleIcon className="h-12 w-12 mx-auto text-gray-400" />
         <h2 className="mt-4 text-xl font-semibold text-gray-700">Project Not Found or Access Denied</h2>
         <p className="mt-2 text-sm text-gray-500">
           The project you are looking for does not exist or you do not have permission to view it.
         </p>
         <button
            onClick={() => navigate('/projects')} // Go to projects list
            className="mt-6 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
             Back to My Projects
          </button>
      </div>
    );
  }

  // --- Render Project Details ---
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-800"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" aria-hidden="true" />
          Back to Projects
        </button>
      </div>

      {/* Header */}
      <div className="md:flex md:items-center md:justify-between pb-4 border-b border-gray-200 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {project.projectName}
          </h1>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
           <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${projectsAPI.getStatusBadgeColor(project.status)}`}>
            {projectsAPI.getStatusLabel(project.status)}
          </span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (Core Details) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description Card */}
          <div className="bg-white shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Project Description</h2>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {project.projectDescription || 'No description provided.'}
              </p>
            </div>
          </div>

          {/* Details Card */}
           <div className="bg-white shadow sm:rounded-lg overflow-hidden">
             <div className="px-4 py-5 sm:px-6">
               <h2 className="text-lg font-medium text-gray-900">Project Details</h2>
             </div>
             <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-200">
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 inline-flex items-center">
                        <MapPinIcon className='h-5 w-5 mr-2 text-gray-400'/> Location
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {project.projectLocation || 'N/A'}
                    </dd>
                  </div>
                   <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 inline-flex items-center">
                        <CalendarDaysIcon className='h-5 w-5 mr-2 text-gray-400'/> Timeline
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {projectsAPI.formatDate(project.startDate)} - {projectsAPI.formatDate(project.endDate)}
                         {project.duration && <span className="text-xs text-gray-500 ml-2">({project.duration} days)</span>}
                    </dd>
                  </div>
                   <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 inline-flex items-center">
                       <CurrencyDollarIcon className='h-5 w-5 mr-2 text-gray-400'/> Budget
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {project.projectBudget ? `$${project.projectBudget.toLocaleString()}` : 'N/A'}
                    </dd>
                  </div>
                </dl>
             </div>
          </div>

          {/* Related Sections */}
           <ProjectReportsSection projectId={projectId} />
           <ProjectTasksSection projectId={projectId} />
           <ProjectSchedulesSection projectId={projectId} />
           <ProjectCommentsSection projectId={projectId} />


        </div>

        {/* Right Column (Personnel) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Key Personnel</h2>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6 space-y-4">
              {/* Project Manager */}
               <div>
                 <h3 className="text-sm font-medium text-gray-500 mb-1 inline-flex items-center">
                   <UserCircleIcon className="h-5 w-5 mr-1 text-gray-400"/> Project Manager
                 </h3>
                 {project.projectManager ? (
                    <p className="text-sm text-gray-900">
                        {project.projectManager.firstName} {project.projectManager.lastName}
                        {project.projectManager.email && <span className="block text-xs text-gray-500">{project.projectManager.email}</span>}
                        {/* Add phone if available and needed */}
                    </p>
                 ) : (
                    <p className="text-sm text-gray-500 italic">Not Assigned</p>
                 )}
               </div>
               {/* Contractor */}
                <div>
                 <h3 className="text-sm font-medium text-gray-500 mb-1 inline-flex items-center">
                    <UserCircleIcon className="h-5 w-5 mr-1 text-gray-400"/> Contractor
                 </h3>
                 {project.contractor ? (
                    <p className="text-sm text-gray-900">
                        {project.contractor.firstName} {project.contractor.lastName}
                         {project.contractor.email && <span className="block text-xs text-gray-500">{project.contractor.email}</span>}
                         {/* Add phone if available and needed */}
                    </p>
                 ) : (
                    <p className="text-sm text-gray-500 italic">Not Assigned</p>
                 )}
               </div>
               {/* Consultant (You) - Optional to display self */}
               {/* <div>
                 <h3 className="text-sm font-medium text-gray-500 mb-1 inline-flex items-center">
                    <UserCircleIcon className="h-5 w-5 mr-1 text-gray-400"/> Consultant (You)
                 </h3>
                  <p className="text-sm text-gray-900">
                      {currentUser.firstName} {currentUser.lastName}
                      <span className="block text-xs text-gray-500">{currentUser.email}</span>
                  </p>
               </div> */}
            </div>
          </div>
           {/* Potentially add other relevant info cards here */}
        </div>
      </div>
    </div>
  );
};

export default ConsultantProjectDetail;