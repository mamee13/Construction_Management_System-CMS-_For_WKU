import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Card, Typography, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title } = Typography;

const TeamList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const columns = [
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => `${record.firstName} ${record.lastName}`,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={
          role === 'admin' ? 'red' :
          role === 'project_manager' ? 'green' :
          role === 'contractor' ? 'blue' :
          role === 'consultant' ? 'purple' :
          role === 'committee' ? 'orange' : 'default'
        }>
          {role?.toUpperCase().replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary"
            onClick={() => navigate(`/committee-team/${record._id}`)}
          >
            View Details
          </Button>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('wku_cms_token');
      const response = await axios.get('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      // Update this line to match the API response structure
      const userData = response.data.data.users || [];
      setUsers(userData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users. Please try again.');
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <Title level={2}>Error</Title>
          <p>{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <Title level={2}>Team Members</Title>
          <Button 
            type="primary"
            onClick={() => navigate('/committee-dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={users || []}
          loading={loading}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default TeamList;