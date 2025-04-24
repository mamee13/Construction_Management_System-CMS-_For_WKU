// src/pages/consultant/ProjectDetail.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import authAPI from '../../APi/auth'; // Adjust path if needed
import projectsAPI from '../../APi/projects'; // Adjust path if needed
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
const ProjectCommentsSection = ({ projectId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const token = localStorage.getItem('wku_cms_token');
        const response = await axios.get(`/api/comments/project/${projectId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setComments(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching comments:', error);
        setLoading(false);
      }
    };

    fetchComments();
  }, [projectId]);

  if (loading) {
    return (
      <div className="mt-8 p-4 border rounded-md bg-gray-50">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">Project Comments</h3>
        <div className="text-center py-4">
          <ArrowPathIcon className="h-6 w-6 animate-spin mx-auto text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 p-4 border rounded-md bg-gray-50">
      <h3 className="text-lg font-semibold mb-2 text-gray-700 flex items-center">
        <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-gray-500" />
        Project Comments
      </h3>
      <div className="space-y-4 mt-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment._id} className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center mb-2">
                <div className="bg-gray-100 rounded-full p-2">
                  <UserCircleIcon className="h-5 w-5 text-gray-500" />
                </div>
                <div className="ml-2">
                  <p className="text-sm font-medium text-gray-900">
                    {comment.userId.firstName} {comment.userId.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(comment.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 ml-9">{comment.content}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 italic">No comments yet.</p>
        )}
      </div>
    </div>
  );
};

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
    enabled: !!projectId && !!currentUser?._id,
  });

  const project = projectData?.data;

  // Loading state
  if (isLoading) {
    return (
      <div className="text-center py-20">
        <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin mb-3" />
        <p className="text-gray-500">Loading project details...</p>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="text-center py-20 max-w-lg mx-auto bg-red-50 p-6 rounded-lg shadow">
        <ExclamationTriangleIcon className="h-10 w-10 mx-auto text-red-500 mb-3" />
        <p className="text-red-700 font-semibold mb-2">Failed to load project details</p>
        <p className="text-red-600 text-sm mb-4">{error?.message}</p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

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
            {project?.projectName}
          </h1>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${projectsAPI.getStatusBadgeColor(project?.status)}`}>
            {projectsAPI.getStatusLabel(project?.status)}
          </span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ProjectReportsSection projectId={projectId} />
          <ProjectTasksSection projectId={projectId} />
          <ProjectSchedulesSection projectId={projectId} />
        </div>
        
        {/* Right column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Project Details Card */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Project Information</h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              <dl className="sm:divide-y sm:divide-gray-200">
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{project?.projectLocation || 'N/A'}</dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Budget</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">${project?.projectBudget?.toLocaleString() || 'N/A'}</dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Contractor</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div>
                      {project?.contractor ? (
                        <>
                          <p>{project.contractor.firstName} {project.contractor.lastName}</p>
                          <p className="text-gray-500 text-xs">{project.contractor.phone}</p>
                        </>
                      ) : 'N/A'}
                    </div>
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Project Manager</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div>
                      {project?.projectManager ? (
                        <>
                          <p>{project.projectManager.firstName} {project.projectManager.lastName}</p>
                          <p className="text-gray-500 text-xs">{project.projectManager.phone}</p>
                        </>
                      ) : 'N/A'}
                    </div>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
        
        {/* Comments section - full width at the bottom */}
        <div className="lg:col-span-3">
          <ProjectCommentsSection projectId={projectId} />
        </div>
      </div>
    </div>
  );
};

export default ConsultantProjectDetail;