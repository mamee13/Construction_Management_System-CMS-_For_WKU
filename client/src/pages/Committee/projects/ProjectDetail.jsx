import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Spin, Typography, Tag, Divider } from 'antd';
import axios from 'axios';

const { Title } = Typography;

const ProjectDetail = () => {
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
      setProject(response.data.data); // Note: accessing .data property from the API response
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
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center">
        <Title level={3}>Project not found</Title>
        <Button type="primary" onClick={() => navigate('/committee-projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <Title level={2}>{project.name}</Title>
          <Button type="primary" onClick={() => navigate('/committee-projects')}>
            Back to Projects
          </Button>
        </div>

        <Descriptions bordered column={2}>
          <Descriptions.Item label="Status">
            <Tag color={project.status === 'active' ? 'green' : 'orange'}>
              {project.status.toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Project Manager">
            {project.projectManager?.firstName} {project.projectManager?.lastName}
          </Descriptions.Item>
          <Descriptions.Item label="Start Date">
            {new Date(project.startDate).toLocaleDateString()}
          </Descriptions.Item>
          <Descriptions.Item label="End Date">
            {new Date(project.endDate).toLocaleDateString()}
          </Descriptions.Item>
          <Descriptions.Item label="Budget" span={2}>
            ${project.budget?.toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>
            {project.description}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <div className="mt-6">
          <Title level={4}>Project Documents</Title>
          {project.documents?.length > 0 ? (
            <Space direction="vertical" className="w-full">
              {project.documents.map((doc, index) => (
                <Card key={index} size="small">
                  <div className="flex justify-between items-center">
                    <span>{doc.name}</span>
                    <Button type="link" href={doc.url} target="_blank">
                      View Document
                    </Button>
                  </div>
                </Card>
              ))}
            </Space>
          ) : (
            <p>No documents available</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ProjectDetail;