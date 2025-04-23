import React from 'react';
import { Card, Row, Col, Typography } from 'antd';
import { ProjectOutlined, FileOutlined, TeamOutlined, ScheduleOutlined } from '@ant-design/icons';

const { Title } = Typography;

const CommitteeDashboard = () => {
  const dashboardItems = [
    {
      title: 'Projects',
      icon: <ProjectOutlined style={{ fontSize: '24px' }} />,
      count: '5',
      link: '/committee-projects',
      color: '#b2ebf2' // Brighter shade
    },
    {
      title: 'Reports',
      icon: <FileOutlined style={{ fontSize: '24px' }} />,
      count: '8',
      link: '/committee-reports',
      color: '#dcedc8' // Brighter shade
    },
    {
      title: 'Team Members',
      icon: <TeamOutlined style={{ fontSize: '24px' }} />,
      count: '3',
      link: '/committee-team',
      color: '#ffe0b2' // Brighter shade
    },
    {
      title: 'Schedules',
      icon: <ScheduleOutlined style={{ fontSize: '24px' }} />,
      count: '4',
      link: '/committee-schedules',
      color: '#f8bbd0' // Brighter shade
    }
  ];

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