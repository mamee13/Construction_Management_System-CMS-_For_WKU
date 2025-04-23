import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Spin, Typography, Tag } from 'antd';
import axios from 'axios';

const { Title } = Typography;

const TeamDetail = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignedProjects, setAssignedProjects] = useState([]);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem('wku_cms_token');
        const response = await axios.get(`/api/users/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setUser(response.data.data.user);
        setAssignedProjects(response.data.data.assignedProjects || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user details:', error);
        setError('Failed to fetch user details');
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-6">
        <Card>
          <Title level={2}>Error</Title>
          <p>{error || 'User not found'}</p>
          <Button type="primary" onClick={() => navigate('/committee-team')}>
            Back to Team List
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <Title level={2}>{user.firstName} {user.lastName}</Title>
          <Button type="primary" onClick={() => navigate('/committee-team')}>
            Back to Team List
          </Button>
        </div>

        <Descriptions
          bordered
          column={2}
          labelStyle={{ 
            fontWeight: '600',
            backgroundColor: '#f0f2f5',
            padding: '8px 12px',
            fontSize: '13px',
            color: '#262626'
          }}
          contentStyle={{
            padding: '8px 12px',
            backgroundColor: '#ffffff'
          }}
        >
          <Descriptions.Item label="ROLE">
            <Tag color={
              user.role === 'admin' ? 'red' :
              user.role === 'project_manager' ? 'green' :
              user.role === 'contractor' ? 'blue' :
              user.role === 'consultant' ? 'purple' :
              user.role === 'committee' ? 'orange' : 'default'
            } style={{ padding: '4px 12px', fontSize: '14px' }}>
              {user.role?.toUpperCase().replace('_', ' ')}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="EMAIL">{user.email}</Descriptions.Item>
          <Descriptions.Item label="PHONE">{user.phone}</Descriptions.Item>
          <Descriptions.Item label="STATUS">
            <Tag color={user.isActive ? 'green' : 'red'} style={{ padding: '4px 12px', fontSize: '14px' }}>
              {user.isActive ? 'ACTIVE' : 'INACTIVE'}
            </Tag>
          </Descriptions.Item>
          {user.department && (
            <Descriptions.Item label="DEPARTMENT">{user.department}</Descriptions.Item>
          )}
          {user.position && (
            <Descriptions.Item label="POSITION">{user.position}</Descriptions.Item>
          )}
          <Descriptions.Item label="JOINED DATE">
            {new Date(user.createdAt).toLocaleDateString()}
          </Descriptions.Item>
        </Descriptions>

        {/* Assigned Projects Card */}
        {assignedProjects && assignedProjects.length > 0 && (
          <div className="mt-6">
            <Title level={4}>Assigned Projects</Title>
            <Card className="mt-4">
              {assignedProjects.map((project) => (
                <div key={project._id} className="mb-4 p-4 border-b last:border-b-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium">{project.projectName}</h3>
                      <div className="mt-2">
                        <span className="text-gray-500 text-sm mr-4">
                          Start Date: {new Date(project.startDate).toLocaleDateString()}
                        </span>
                        <Tag color={project.status === 'planned' ? 'blue' : 'green'}>
                          {project.status.toUpperCase()}
                        </Tag>
                      </div>
                    </div>
                    <Button 
                      type="primary"
                      onClick={() => navigate(`/committee-projects/${project._id}`)}
                    >
                      View Project
                    </Button>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TeamDetail;