import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Form, Input, List, Avatar, Typography, Button } from 'antd';
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

// Add these imports at the top with other imports
const { TextArea } = Input;
const { Title } = Typography;

const CommitteeProjectDetail = () => {
  // Add these states with other state declarations
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  // Define fetchProjectDetails first
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

  // Define fetchComments next
  const fetchComments = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('wku_cms_token');
      const response = await axios.get(`/api/comments/project/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setComments(response.data.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, [id]);

  // Define handleCommentSubmit
  const handleCommentSubmit = async (values) => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('wku_cms_token');
      const response = await axios.post('/api/comments', {
        projectId: id,
        content: values.content
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setComments([response.data.data, ...comments]);
      commentForm.resetFields();
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Place useEffects after all function definitions
  useEffect(() => {
    fetchProjectDetails();
    fetchComments();
  }, [fetchProjectDetails, fetchComments]);

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
                <dd className="mt-1 text-sm text-gray-900">{project.projectLocation || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <CurrencyDollarIcon className="h-4 w-4 mr-1.5 text-gray-400"/>Budget
                </dt>
                <dd className="mt-1 text-sm text-gray-900">${project.projectBudget?.toLocaleString() || 'N/A'}</dd>
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

        {/* Comments Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Project Comments</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <Form
              form={commentForm}
              onFinish={handleCommentSubmit}
              className="mb-6"
            >
              <Form.Item
                name="content"
                rules={[{ required: true, message: 'Please write your comment' }]}
              >
                <TextArea rows={4} placeholder="Write a comment..." />
              </Form.Item>
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Add Comment
                </Button>
              </Form.Item>
            </Form>

            <List
              className="comment-list"
              itemLayout="horizontal"
              dataSource={comments}
              renderItem={comment => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar>
                        {comment.userId.firstName[0]}
                        {comment.userId.lastName[0]}
                      </Avatar>
                    }
                    title={`${comment.userId.firstName} ${comment.userId.lastName}`}
                    description={
                      <>
                        <p>{comment.content}</p>
                        <span className="text-gray-500 text-sm">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommitteeProjectDetail;