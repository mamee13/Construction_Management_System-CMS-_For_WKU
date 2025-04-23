import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Card, Typography, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title } = Typography;

const ProjectsList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      console.log('Fetching projects...');
      // Get token from localStorage
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/projects', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Projects fetched:', response.data);
      // Ensure we're setting an array
      const projectsArray = Array.isArray(response.data.data) ? response.data.data : [];
      setProjects(projectsArray);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Project Name',
      dataIndex: 'projectName',
      key: 'projectName',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'orange'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary"
            onClick={() => navigate(`/committee-projects/${record.id}`)} // Ensure this matches the route
          >
            View Details
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <Title level={2}>Projects List</Title>
        <Table
          columns={columns}
          dataSource={projects}
          loading={loading}
          rowKey="_id"
        />
      </Card>
    </div>
  );
};

export default ProjectsList;