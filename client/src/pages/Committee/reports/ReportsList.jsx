// import React, { useState, useEffect } from 'react';
// import { Table, Space, Button, Card, Typography, Tag } from 'antd';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';

// const { Title } = Typography;

// const ReportsList = () => {
//   const [reports, setReports] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     fetchReports();
//   }, []);

//   const fetchReports = async () => {
//     try {
//       const token = localStorage.getItem('wku_cms_token');
//       const response = await axios.get('/api/reports', {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       });
//       setReports(response.data.data || []); // Access the data property from response
//       setLoading(false);
//     } catch (error) {
//       console.error('Error fetching reports:', error);
//       setLoading(false);
//     }
//   };

//   // Update the columns to match the actual data structure
//   const columns = [
//     {
//       title: 'Report Title',
//       dataIndex: 'title',
//       key: 'title',
//     },
//     {
//       title: 'Project',
//       dataIndex: ['project', 'projectName'], // Updated to match API response
//       key: 'project',
//     },
//     {
//       title: 'Type',
//       dataIndex: 'type',
//       key: 'type',
//     },
//     {
//       title: 'Status',
//       dataIndex: 'status',
//       key: 'status',
//       render: (status) => (
//         <Tag color={status === 'approved' ? 'green' : status === 'pending' ? 'orange' : 'red'}>
//           {status?.toUpperCase()}
//         </Tag>
//       ),
//     },
//     {
//       title: 'Created At',
//       dataIndex: 'createdAt',
//       key: 'createdAt',
//       render: (date) => new Date(date).toLocaleDateString(),
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (_, record) => (
//         <Space>
//           <Button 
//             type="primary"
//             onClick={() => navigate(`/committee-reports/${record._id}`)}
//           >
//             View Details
//           </Button>
//         </Space>
//       ),
//     },
//   ];

//   return (
//     <div className="p-6">
//       <Card>
//         <div className="flex justify-between items-center mb-6">
//           <Title level={2}>Reports List</Title>
//           <Button 
//             type="primary"
//             onClick={() => navigate('/committee-dashboard')}
//           >
//             Back to Dashboard
//           </Button>
//         </div>
//         <Table
//           columns={columns}
//           dataSource={reports}
//           loading={loading}
//           rowKey="_id"
//         />
//       </Card>
//     </div>
//   );
// };

// export default ReportsList;

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Space, Button, Card, Typography, Tag, message } from 'antd'; // Added message for feedback
import { useNavigate } from 'react-router-dom';
import reportsAPI from '../../../APi/reports'; // Adjust the import path as needed

const { Title } = Typography;

const ReportsList = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Use useCallback to memoize the fetch function if needed, though not strictly necessary with useEffect's empty dependency array
  const fetchAdminReportsForCommittee = useCallback(async () => {
    setLoading(true);
    try {
      // *** KEY CHANGE: Use reportsAPI.getReports with specific filter parameters ***
      // You MUST confirm these parameter names with your backend developer.
      // Examples:
      // - submittedByRole=admin (filter for reports created by an admin)
      // - forMyCommittee=true (a flag telling the backend to filter for the logged-in user's committee)
      // OR perhaps:
      // - submitterRole=admin
      // - targetCommittee=CURRENT_USER // Backend interprets this
      const params = {
        submittedByRole: 'admin', // Replace with your actual backend parameter name
        forMyCommittee: true      // Replace with your actual backend parameter name/value
        // Add other params if needed, like pagination: page: 1, limit: 10
      };

      // The `reportsAPI` should handle token authentication automatically via the configured `api` instance
      const response = await reportsAPI.getReports(params);

      // Adjust data access based on your actual API response structure
      // Assuming the API returns { success: true, data: [...] } or similar
      setReports(response.data || []); // Access the array of reports

    } catch (error) {
      console.error('Error fetching admin-submitted reports for committee:', error);
      // Use Ant Design message for user feedback
      message.error(error.message || 'Failed to fetch reports. Please try again.');
      setReports([]); // Clear reports on error
    } finally {
      setLoading(false); // Ensure loading is set to false in both success and error cases
    }
  }, []); // No dependencies needed if parameters are static

  useEffect(() => {
    fetchAdminReportsForCommittee();
  }, [fetchAdminReportsForCommittee]); // Include the memoized function in dependencies

  // Columns remain largely the same, ensure dataIndex matches your API response
  const columns = [
    {
      title: 'Report Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Project',
      // Ensure your API response nests project info like this, or adjust accordingly
      dataIndex: ['project', 'projectName'],
      key: 'project',
      render: (projectName) => projectName || 'N/A', // Handle cases where project might be null/undefined
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      // Optionally use the helper from reportsAPI if needed, but direct display is fine
      // render: (type) => reportsAPI.getReportTypeLabel(type),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        if (!status) return <Tag>Unknown</Tag>;
        const colorMap = {
          approved: 'green',
          pending: 'orange', // Or 'processing'
          submitted: 'blue', // Example
          rejected: 'red',
          draft: 'default',
        };
        return (
          <Tag color={colorMap[status.toLowerCase()] || 'default'}>
            {status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Submitted At', // Or "Created At" - maps to createdAt field
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => reportsAPI.formatDate(date), // Use the formatter from your API module
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            onClick={() => navigate(`/committee-reports/${record._id}`)} // Ensure '_id' is the correct identifier field
            disabled={!record._id} // Disable button if ID is missing
          >
            View Details
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}> {/* Standard Ant Design padding */}
      <Card bordered={false}> {/* Optional: remove card border */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ marginBottom: 0 }}>Reports Submitted for Your Committee</Title>
          <Button
            type="default" // Maybe default is better here unless it's a primary action
            onClick={() => navigate('/committee-dashboard')} // Ensure this route is correct
          >
            Back to Dashboard
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={reports}
          loading={loading}
          rowKey="_id" // Make sure your report objects have a unique '_id' property
          scroll={{ x: 'max-content' }} // Make table horizontally scrollable if needed
          locale={{ emptyText: loading ? ' ' : 'No reports found matching the criteria.' }} // Better empty state handling
        />
      </Card>
    </div>
  );
};

export default ReportsList;