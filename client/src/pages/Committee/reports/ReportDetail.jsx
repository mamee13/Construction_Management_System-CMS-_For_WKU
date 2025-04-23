import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Spin, Typography, Tag, Divider, Image } from 'antd';
import axios from 'axios';

const { Title, Text } = Typography;

const ReportDetail = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();

  const fetchReportDetails = React.useCallback(async () => {
    try {
      const response = await axios.get(`/api/committee/reports/${id}`);
      setReport(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching report details:', error);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReportDetails();
  }, [fetchReportDetails]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center">
        <Title level={3}>Report not found</Title>
        <Button type="primary" onClick={() => navigate('/committee-reports')}>
          Back to Reports
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <Title level={2}>{report.title}</Title>
          <Space>
            <Button onClick={() => navigate('/committee-reports')}>
              Back to Reports
            </Button>
          </Space>
        </div>

        <Descriptions bordered column={2}>
          <Descriptions.Item label="Project">
            {report.project?.name}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={report.status === 'approved' ? 'green' : 'orange'}>
              {report.status.toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Submitted By">
            {report.submittedBy?.firstName} {report.submittedBy?.lastName}
          </Descriptions.Item>
          <Descriptions.Item label="Submission Date">
            {new Date(report.createdAt).toLocaleDateString()}
          </Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>
            {report.description}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <div className="mt-6">
          <Title level={4}>Attachments</Title>
          {report.attachments?.length > 0 ? (
            <Space direction="vertical" className="w-full">
              {report.attachments.map((attachment, index) => (
                <Card key={index} size="small">
                  <div className="flex justify-between items-center">
                    <Text>{attachment.name}</Text>
                    <Button type="link" href={attachment.url} target="_blank">
                      Download
                    </Button>
                  </div>
                </Card>
              ))}
            </Space>
          ) : (
            <Text>No attachments available</Text>
          )}
        </div>

        {report.images?.length > 0 && (
          <>
            <Divider />
            <div className="mt-6">
              <Title level={4}>Images</Title>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {report.images.map((image, index) => (
                  <Image
                    key={index}
                    src={image.url}
                    alt={`Report image ${index + 1}`}
                    className="object-cover rounded"
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default ReportDetail;