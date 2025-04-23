import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Card, Typography, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title } = Typography;

const ReportsList = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('wku_cms_token');
      const response = await axios.get('/api/reports', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setReports(response.data.data || []); // Access the data property from response
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setLoading(false);
    }
  };

  // Update the columns to match the actual data structure
  const columns = [
    {
      title: 'Report Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Project',
      dataIndex: ['project', 'projectName'], // Updated to match API response
      key: 'project',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'approved' ? 'green' : status === 'pending' ? 'orange' : 'red'}>
          {status?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary"
            onClick={() => navigate(`/committee-reports/${record._id}`)}
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
        <div className="flex justify-between items-center mb-6">
          <Title level={2}>Reports List</Title>
          <Button 
            type="primary"
            onClick={() => navigate('/committee-dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={reports}
          loading={loading}
          rowKey="_id"
        />
      </Card>
    </div>
  );
};

export default ReportsList;