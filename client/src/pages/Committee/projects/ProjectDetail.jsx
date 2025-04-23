import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowPathIcon,
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
  ListBulletIcon,
} from "@heroicons/react/24/outline";

            // Add this function at the top of your component
            const formatDuration = (days) => {
              if (days >= 365) {
                const years = Math.floor(days / 365);
                const remainingDays = days % 365;
                return remainingDays > 0 ? `${years} year${years > 1 ? 's' : ''} and ${remainingDays} day${remainingDays > 1 ? 's' : ''}` : `${years} year${years > 1 ? 's' : ''}`;
              } else if (days >= 30) {
                const months = Math.floor(days / 30);
                const remainingDays = days % 30;
                return remainingDays > 0 ? `${months} month${months > 1 ? 's' : ''} and ${remainingDays} day${remainingDays > 1 ? 's' : ''}` : `${months} month${months > 1 ? 's' : ''}`;
              }
              return `${days} day${days > 1 ? 's' : ''}`;
            };
            
            // Update the project details section to match the API response

const CommitteeProjectDetail = () => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();

  const fetchProjectDetails = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('wku_cms_token');
      const response = await axios.get(`/api/projects/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setProject(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching project details:', error);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  if (loading) {
    return (
      <div className="text-center py-20">
        <ArrowPathIcon className="h-10 w-10 mx-auto text-gray-400 animate-spin mb-3" />
        <p className="text-gray-500">Loading project details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20 max-w-lg mx-auto bg-red-50 p-6 rounded-lg shadow">
        <ExclamationTriangleIcon className="h-10 w-10 mx-auto text-red-500 mb-3" />
        <p className="text-red-700 font-semibold mb-2">Project not found</p>
        <button
          onClick={() => navigate("/committee-projects")}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <ArrowUturnLeftIcon className="h-5 w-5 mr-2" />
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8 pb-4 border-b border-gray-200">
        <div>
          <button
            onClick={() => navigate("/committee-projects")}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center mb-1"
          >
            <ArrowUturnLeftIcon className="h-4 w-4 mr-1" /> Back to Projects
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{project.name}</h1>
          <p className="text-gray-500 text-sm">{project.description}</p>
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
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <MapPinIcon className="h-4 w-4 mr-1.5 text-gray-400"/>Location
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{project.projectLocation}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <CurrencyDollarIcon className="h-4 w-4 mr-1.5 text-gray-400"/>Budget
                </dt>
                <dd className="mt-1 text-sm text-gray-900">${project.projectBudget?.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1.5 text-gray-400"/>Duration
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDuration(project.duration)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1.5 text-gray-400"/>Created On
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(project.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1.5 text-gray-400"/>Start Date
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(project.startDate).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1.5 text-gray-400"/>End Date
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(project.endDate).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Personnel Card */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Key Contacts</h3>
          </div>
          <div className="px-4 py-5 sm:p-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <UserIcon className="h-4 w-4 mr-1.5 text-gray-400"/>Project Manager
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                <p className="font-semibold">
                  {project.projectManager?.firstName} {project.projectManager?.lastName}
                </p>
                <p className="text-gray-600">{project.projectManager?.email}</p>
                {project.projectManager?.phone && (
                  <p className="text-gray-600 flex items-center">
                    <PhoneIcon className="h-3 w-3 mr-1 text-gray-400"/>
                    {project.projectManager.phone}
                  </p>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <UserIcon className="h-4 w-4 mr-1.5 text-gray-400"/>Contractor
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                <p className="font-semibold">
                  {project.contractor?.firstName} {project.contractor?.lastName}
                </p>
                <p className="text-gray-600">{project.contractor?.email}</p>
                {project.contractor?.phone && (
                  <p className="text-gray-600 flex items-center">
                    <PhoneIcon className="h-3 w-3 mr-1 text-gray-400"/>
                    {project.contractor.phone}
                  </p>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <UserIcon className="h-4 w-4 mr-1.5 text-gray-400"/>Consultant
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                <p className="font-semibold">
                  {project.consultant?.firstName} {project.consultant?.lastName}
                </p>
                <p className="text-gray-600">{project.consultant?.email}</p>
                {project.consultant?.phone && (
                  <p className="text-gray-600 flex items-center">
                    <PhoneIcon className="h-3 w-3 mr-1 text-gray-400"/>
                    {project.consultant.phone}
                  </p>
                )}
              </dd>
            </div>
            {/* Removed the Created By card */}
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Project Documents</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {project.documents?.length > 0 ? (
              <div className="space-y-4">
                {project.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                    <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      View Document
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                <ListBulletIcon className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500 italic">No documents available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommitteeProjectDetail;