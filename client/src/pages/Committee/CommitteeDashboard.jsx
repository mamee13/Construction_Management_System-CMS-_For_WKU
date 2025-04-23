import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Spin } from 'antd';
import { ProjectOutlined, FileOutlined, TeamOutlined, ScheduleOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;

const CommitteeDashboard = () => {
  const [counts, setCounts] = useState({
    projects: 0,
    reports: 0,
    team: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const token = localStorage.getItem('wku_cms_token');
        const headers = {
          'Authorization': `Bearer ${token}`
        };

        // Fetch projects count
        const projectsResponse = await axios.get('/api/projects', { headers });
        const projectsCount = projectsResponse.data.total || projectsResponse.data.data.length;

        // Fetch reports count
        const reportsResponse = await axios.get('/api/reports', { headers });
        const reportsCount = reportsResponse.data.total || reportsResponse.data.data.length;

        // Fetch team members count
        const teamResponse = await axios.get('/api/users', { headers });
        const teamCount = teamResponse.data.data.users.length;

        setCounts({
          projects: projectsCount,
          reports: reportsCount,
          team: teamCount,
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  const dashboardItems = [
    {
      title: 'Projects',
      icon: <ProjectOutlined style={{ fontSize: '24px' }} />,
      count: counts.projects,
      link: '/committee-projects',
      color: '#b2ebf2'
    },
    {
      title: 'Reports',
      icon: <FileOutlined style={{ fontSize: '24px' }} />,
      count: counts.reports,
      link: '/committee-reports',
      color: '#dcedc8'
    },
    {
      title: 'Team Members',
      icon: <TeamOutlined style={{ fontSize: '24px' }} />,
      count: counts.team,
      link: '/committee-team',
      color: '#ffe0b2'
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: 'linear-gradient(to right, #ece9e6, #ffffff)' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>Committee Dashboard</Title>
      <Row gutter={[24, 24]} justify="center">
        {dashboardItems.map((item, index) => (
          <Col xs={24} sm={12} md={12} key={index}>
            <Card
              hoverable
              style={{ 
                borderRadius: '8px',
                height: '100%',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.3s, box-shadow 0.3s',
                background: item.color,
                margin: '10px'
              }}
              onClick={() => window.location.href = item.link}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={{ textAlign: 'center' }}>
                {item.icon}
                <Title level={4} style={{ marginTop: '16px' }}>{item.title}</Title>
                <Title level={3} style={{ margin: '16px 0' }}>{item.count}</Title>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default CommitteeDashboard;