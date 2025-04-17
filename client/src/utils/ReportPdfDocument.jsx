// ReportPdfDocument.jsx
/*eslint-disable  */
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Link, Image } from '@react-pdf/renderer';
import reportsAPI from "../../src/APi/reports"; // Assuming your helpers are here

// --- Register Fonts (Optional but Recommended) ---
// Download font files (e.g., .ttf) and register them if you need specific fonts
// Font.register({
//   family: 'Oswald',
//   src: 'https://fonts.gstatic.com/s/oswald/v13/Y_TKV6o8WovbUd3m_X9aAA.ttf'
// });

// --- Define Styles ---
// Similar to CSS, but using JS objects and React Native syntax
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30, // Add padding to the page
    fontFamily: 'Helvetica', // Default font
    fontSize: 10,
    lineHeight: 1.4,
    color: '#333',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    borderBottomStyle: 'solid',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#111827', // ~ gray-900
  },
  subtitle: {
    fontSize: 10,
    color: '#6B7280', // ~ gray-500
    marginBottom: 5,
  },
  statusBadge: {
    fontSize: 9,
    fontWeight: 'semibold', // Note: fontWeight accepts strings like 'bold', 'semibold' or numbers
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#E5E7EB', // Default gray
    color: '#374151',
    marginLeft: 10,
    display: 'inline-block', // Badges are tricky, might need careful layout
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 3,
  },
  detailGrid: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  detailLabel: {
    width: '30%', // Adjust width as needed
    fontWeight: 'bold',
    color: '#4B5563', // ~ gray-600
  },
  detailValue: {
    width: '70%',
    color: '#1F2937', // ~ gray-800
  },
  detailValueSub: {
    fontSize: 9,
    color: '#6B7280',
  },
  preformatted: {
    // fontFamily: 'Courier', // Use a monospace font if needed
    backgroundColor: '#F9FAFB', // ~ gray-50
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 9,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10, // Note: 'gap' might not be fully supported, use margins instead if needed
  },
  metricBox: {
    // width: '48%', // For approx 2 columns, adjust as needed
    padding: 10,
    backgroundColor: '#F9FAFB', // ~ gray-50
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB', // ~ gray-200
    marginBottom: 10, // Alternative to gap
    marginRight: 10, // Alternative to gap
  },
  metricLabel: {
    fontSize: 9,
    color: '#4B5563',
    marginBottom: 3,
    textTransform: 'capitalize',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'semibold',
    color: '#111827',
  },
  issueList: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
  },
  issueItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
  },
  issueSeverity: {
    fontSize: 9,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    marginRight: 8,
    // Define specific severity styles below
  },
  issueDescription: {
    flex: 1,
    fontSize: 10,
  },
  issueDate: {
      fontSize: 8,
      color: '#6B7280',
      marginTop: 2,
  },
  attachmentList: {
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 6,
  },
  attachmentItem: {
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
  },
  attachmentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 1, // Allow shrinking
      overflow: 'hidden', // Hide overflow
  },
  attachmentIcon: {
      width: 12, // Set fixed size for icons if using images
      height: 12,
      marginRight: 5,
  },
   attachmentText: {
      fontSize: 10,
      // Add text overflow handling if needed (might not be fully supported)
   },
   attachmentLink: {
      color: '#4f46e5', // ~ indigo-600
      textDecoration: 'underline',
   },
   attachmentDownloadText: {
       fontSize: 9,
       color: '#4B5563',
   },
  // Specific severity colors (add more as needed)
  severityHigh: { backgroundColor: '#fee2e2', color: '#991b1b' }, // bg-red-100 text-red-800
  severityMedium: { backgroundColor: '#fef3c7', color: '#92400e' }, // bg-yellow-100 text-yellow-800
  severityLow: { backgroundColor: '#dcfce7', color: '#166534' }, // bg-green-100 text-green-800
});


const ReportPdfDocument = ({ report }) => {
  if (!report) return null; // Or render a loading/error state if needed

  const getStatusLabel = (status) => reportsAPI.getReportStatusLabel(status) || status;
  const getTypeLabel = (type) => reportsAPI.getReportTypeLabel(type) || type;
  const formatDate = (date, options) => reportsAPI.formatDate(date, options);

  // Helper to get severity style
  const getSeverityStyle = (severity = 'medium') => {
    switch (severity.toLowerCase()) {
      case 'high': return styles.severityHigh;
      case 'medium': return styles.severityMedium;
      case 'low': return styles.severityLow;
      default: return {}; // Default background/color from issueSeverity
    }
  };

   // Helper to format metric key
   const formatMetricKey = (key) => key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ');

    // Helper to format metric value
    const formatMetricValue = (key, value) => {
        if (typeof value === 'number' && key.toLowerCase().includes('percentage')) {
            return `${value.toFixed(1)}%`;
        }
        return value.toString();
    };

  return (
    <Document title={`Report - ${report.title || report._id}`}>
      <Page size="A4" style={styles.page}>

        {/* --- Header --- */}
        <View style={styles.header}>
          <Text style={styles.title}>{report.title || "Report Detail"}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
             <Text style={styles.subtitle}>
               {getTypeLabel(report.type)} Report
               {report.project?.projectName && ` for ${report.project.projectName}`}
             </Text>
             {/* Note: Inline badges are tricky. This might need adjustments */}
             <Text style={[styles.statusBadge, /* Add specific status bg/color styles here */]}>
                 {getStatusLabel(report.status)}
             </Text>
          </View>
          <Text style={styles.subtitle}>
            Generated on {formatDate(report.generatedAt || report.createdAt)} | Last Updated: {formatDate(report.updatedAt, { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* --- Report Information Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Information</Text>
          <View style={styles.detailGrid}>
            {report.project && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Project:</Text>
                <View style={styles.detailValue}>
                    <Text>{report.project.projectName || 'Unknown Project'}</Text>
                    {report.project.projectLocation && <Text style={styles.detailValueSub}>({report.project.projectLocation})</Text>}
                </View>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Report Type:</Text>
              <Text style={styles.detailValue}>{getTypeLabel(report.type)}</Text>
            </View>
            {(report.periodStartDate || report.periodEndDate) && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Period:</Text>
                <Text style={styles.detailValue}>
                  {report.periodStartDate ? formatDate(report.periodStartDate) : "N/A"}
                  {' to '}
                  {report.periodEndDate ? formatDate(report.periodEndDate) : "N/A"}
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Generated By:</Text>
              <View style={styles.detailValue}>
                 <Text>
                    {report.generatedBy?.firstName ? `${report.generatedBy.firstName} ${report.generatedBy.lastName}` : (report.generatedBy?.username || 'Unknown User')}
                 </Text>
                 {report.generatedBy?.role && <Text style={styles.detailValueSub}>({getStatusLabel(report.generatedBy.role)})</Text>}
              </View>
            </View>
             {/* Add Admin Status/Feedback */}
             <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Admin Status:</Text>
              <Text style={styles.detailValue}>{getStatusLabel(report.status)}</Text>
            </View>
             {report.feedback && (
                 <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Admin Feedback:</Text>
                    <Text style={[styles.detailValue, styles.preformatted]}>{report.feedback}</Text>
                 </View>
             )}
          </View>
        </View>

        {/* --- Key Metrics Section --- */}
        {report.keyMetrics && Object.keys(report.keyMetrics).length > 0 && (
             <View style={styles.section} wrap={false}> {/* wrap={false} tries to keep section together */}
                <Text style={styles.sectionTitle}>Key Metrics</Text>
                <View style={styles.metricGrid}>
                 {Object.entries(report.keyMetrics)
                   .filter(([_, value]) => value !== null && value !== undefined)
                   .map(([key, value]) => (
                     <View key={key} style={styles.metricBox}>
                       <Text style={styles.metricLabel}>{formatMetricKey(key)}</Text>
                       <Text style={styles.metricValue}>{formatMetricValue(key, value)}</Text>
                     </View>
                   ))}
                </View>
             </View>
        )}

        {/* --- Summary Section --- */}
        {report.summary && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.preformatted}>{report.summary}</Text>
          </View>
        )}

        {/* --- Issues and Risks Section --- */}
        {report.issuesAndRisks && report.issuesAndRisks.length > 0 && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Issues and Risks</Text>
            <View style={styles.issueList}>
              {report.issuesAndRisks.map((issue, index) => (
                <View key={index} style={[styles.issueItem, index === report.issuesAndRisks.length -1 ? { borderBottomWidth: 0 } : {}]} wrap={false}>
                    <Text style={[styles.issueSeverity, getSeverityStyle(issue.severity)]}>
                         {getStatusLabel(issue.severity || 'medium')}
                    </Text>
                    <View style={styles.issueDescription}>
                        <Text>{issue.description}</Text>
                         {issue.reportedAt && (
                            <Text style={styles.issueDate}>
                                Reported: {formatDate(issue.reportedAt, { month: 'short', day: 'numeric' })}
                            </Text>
                         )}
                    </View>
                </View>
              ))}
            </View>
          </View>
        )}

         {/* --- Attachments Section --- */}
         {report.attachments && report.attachments.length > 0 && (
             <View style={styles.section} wrap={false}>
                <Text style={styles.sectionTitle}>Attachments</Text>
                <View style={styles.attachmentList}>
                 {report.attachments.map((file, index) => (
                     <View key={index} style={[styles.attachmentItem, index === report.attachments.length -1 ? { borderBottomWidth: 0 } : {}]} wrap={false}>
                        <View style={styles.attachmentInfo}>
                             {/* Could use placeholder icons or dynamically load images if URLs known & CORS allows */}
                             {/* <Image src="/path/to/icon.png" style={styles.attachmentIcon} /> */}
                             <Text style={styles.attachmentText}>
                                {file.fileName || 'Attached File'}
                             </Text>
                        </View>
                        {file.url ? (
                             <Link src={file.url} style={[styles.attachmentLink, styles.attachmentDownloadText]}>
                                View/Download Link
                             </Link>
                        ) : (
                            <Text style={styles.attachmentDownloadText}>No Link</Text>
                        )}
                     </View>
                 ))}
                </View>
                <Text style={[styles.subtitle, { marginTop: 5 }]}>Note: Use the links above to access files. Previews are not embedded.</Text>
             </View>
         )}

        {/* Add Footer with Page Numbers? */}
        <Text style={{ position: 'absolute', bottom: 15, left: 0, right: 0, textAlign: 'center', fontSize: 8, color: 'grey' }}
            render={({ pageNumber, totalPages }) => (
             `${pageNumber} / ${totalPages}`
            )} fixed />

      </Page>
    </Document>
  );
};

export default ReportPdfDocument;