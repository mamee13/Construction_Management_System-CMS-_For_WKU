// src/components/admin/AnalyticsPdfDocument.jsx (or your preferred location)
/*eslint-disable */
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Link } from '@react-pdf/renderer';
//import adminAnalyticsAPI from "../../api/adminAnalytics"; // Adjust path if needed
import adminAnalyticsAPI from '@/APi/adminAnalytics';
// --- Font Registration (Optional but recommended for consistent look) ---
// Font.register({ family: 'Inter', fonts: [
//   { src: '/path/to/Inter-Regular.ttf' }, // Replace with actual paths to your font files
//   { src: '/path/to/Inter-Bold.ttf', fontWeight: 'bold' },
//   { src: '/path/to/Inter-SemiBold.ttf', fontWeight: 'semibold' },
// ]});

// --- Styles ---
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica', // Use 'Inter' if registered, or a default like Helvetica
    fontSize: 9, // Base font size for PDF
    color: '#374151', // ~gray-700
    lineHeight: 1.4,
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#111827', // ~gray-900
  },
  subtitle: {
    fontSize: 9,
    color: '#6B7280', // ~gray-500
  },
  filterInfo: {
    fontSize: 8,
    color: '#6B7280',
    marginTop: 5,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold', // Use strings like 'bold', 'semibold' or numbers
    color: '#1F2937', // ~gray-800
    marginBottom: 8,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // ~gray-200
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // gap: 10, // Use margins for gaps
  },
  summaryCard: {
    width: '31%', // Adjust for 3 columns with gaps
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    marginRight: '2%', // Creates space between cards
  },
   summaryCardLast: { // Remove right margin on last card in a row
       marginRight: 0,
   },
  summaryCardTitle: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 3,
  },
  summaryCardValue: {
    fontSize: 14,
    fontWeight: 'semibold',
    color: '#111827',
  },
  chartSection: {
     flexDirection: 'row',
     // gap: 20, // Use margins
     marginBottom: 15,
  },
  chartContainer: {
      width: '48%', // Approx 2 columns
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 6,
      padding: 10,
      marginRight: '4%',
  },
  chartContainerLast: {
      marginRight: 0,
  },
   chartTitle: {
       fontSize: 11,
       fontWeight: 'semibold',
       color: '#1F2937',
       marginBottom: 8,
       textAlign: 'center',
   },
   chartNote: {
      fontSize: 8,
      textAlign: 'center',
      color: '#9CA3AF', //~gray-400
      marginTop: 10,
   },
   listContainer: {
      marginTop: 5,
   },
   listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
      fontSize: 9,
   },
   listItemColorDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
   },
   listItemLabel: {
      color: '#4B5563', // ~gray-600
   },
   listItemValue: {
      marginLeft: 'auto', // Pushes value to the right
      fontWeight: 'semibold',
   },
   detailSection: {
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 6,
      padding: 15,
   },
   detailGrid: {
       flexDirection: 'row',
       // gap: 20, // use margins
   },
   detailColumn: {
       width: '48%',
       marginRight: '4%',
   },
   detailColumnLast: {
       marginRight: 0,
   },
   detailItem: {
       flexDirection: 'row',
       alignItems: 'center',
       marginBottom: 8,
   },
   detailStatusBadge: {
       fontSize: 8,
       paddingHorizontal: 5,
       paddingVertical: 1,
       borderRadius: 10,
       marginRight: 8,
       fontWeight: 'semibold',
       // Set specific background/color later
       minWidth: 60, // Ensure badges have some width
       textAlign: 'center',
   },
   detailProgressBarContainer: {
       flex: 1, // Take remaining space
       height: 8,
       backgroundColor: '#E5E7EB', // ~gray-200
       borderRadius: 4,
       overflow: 'hidden', // Clip the inner bar
       marginHorizontal: 8,
   },
   detailProgressBar: {
       height: '100%',
       backgroundColor: '#A5B4FC', // Default color ~indigo-300
       borderRadius: 4,
   },
   detailValueText: {
       fontSize: 9,
       fontWeight: 'medium',
       color: '#374151',
       minWidth: 50, // Ensure space for text
       textAlign: 'right',
   },
   pageNumber: {
    position: 'absolute',
    fontSize: 8,
    bottom: 15,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'grey',
  },
});

// --- Helper Function to Get Badge Styles ---
const getStatusBadgeStyle = (status) => {
    // Mimic getStatusBadgeColor logic using @react-pdf/renderer styles
    const baseStyle = styles.detailStatusBadge;
    const colors = adminAnalyticsAPI.getChartColors(); // Get your color mapping
    const statusColors = {
        // Example mapping (adjust based on your actual statuses and desired PDF colors)
        'not_started': { backgroundColor: '#D1D5DB', color: '#374151' }, // ~gray-300, gray-700
        'in_progress': { backgroundColor: '#93C5FD', color: '#1E40AF' }, // ~blue-300, blue-800
        'completed': { backgroundColor: '#A7F3D0', color: '#065F46' }, // ~green-300, green-800
        'on_hold': { backgroundColor: '#FDE68A', color: '#92400E' }, // ~yellow-300, yellow-800
        'cancelled': { backgroundColor: '#FECACA', color: '#991B1B' }, // ~red-300, red-800
        'pending': { backgroundColor: '#E5E7EB', color: '#4B5563' }, // ~gray-200, gray-600
        'approved': { backgroundColor: '#A7F3D0', color: '#065F46' },
        'rejected': { backgroundColor: '#FECACA', color: '#991B1B' },
        // Add all your statuses
        default: { backgroundColor: '#E5E7EB', color: '#4B5563' },
    };
    return { ...baseStyle, ...(statusColors[status] || statusColors.default) };
};


const AnalyticsPdfDocument = ({ stats, filters }) => {
  if (!stats) return <Document><Page><Text>Loading report data...</Text></Page></Document>;

  const totalProjects = stats.totalProjects || 1; // Avoid division by zero
  const totalTasks = stats.totalTasks || 1; // Avoid division by zero

  const formatStatus = (status) => adminAnalyticsAPI.formatStatus(status);
  const formatNumber = (num) => adminAnalyticsAPI.formatNumber(num);
  const formatDate = (date) => adminAnalyticsAPI.formatDate(date);
  const getChartColor = (status) => adminAnalyticsAPI.getChartColors()[status] || adminAnalyticsAPI.getChartColors().default;

  let filterText = "";
  if (filters.projectStatus || filters.taskStatus || filters.dateRange !== "all") {
    filterText = "Filters applied: ";
    if (filters.projectStatus) filterText += `Project Status: ${formatStatus(filters.projectStatus)}, `;
    if (filters.taskStatus) filterText += `Task Status: ${formatStatus(filters.taskStatus)}, `;
    if (filters.dateRange !== "all") filterText += `Date Range: ${filters.dateRange.charAt(0).toUpperCase() + filters.dateRange.slice(1)}`;
    filterText = filterText.replace(/, $/, ''); // Remove trailing comma and space
  }

  return (
    <Document title="WKU CMS - Analytics Dashboard">
      <Page size="A4" style={styles.page}>

        {/* --- Header --- */}
        <View style={styles.header} fixed>
          <Text style={styles.mainTitle}>WKU Construction Management System - Analytics Dashboard</Text>
          <Text style={styles.subtitle}>Generated on: {formatDate(new Date())}</Text>
          {filterText && <Text style={styles.filterInfo}>{filterText}</Text>}
        </View>

        {/* --- Summary Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary Statistics</Text>
          <View style={styles.gridContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardTitle}>Total Users</Text>
              <Text style={styles.summaryCardValue}>{formatNumber(stats.totalUsers)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardTitle}>Total Projects</Text>
              <Text style={styles.summaryCardValue}>{formatNumber(stats.totalProjects)}</Text>
            </View>
            <View style={[styles.summaryCard, styles.summaryCardLast]}>
              <Text style={styles.summaryCardTitle}>Total Tasks</Text>
              <Text style={styles.summaryCardValue}>{formatNumber(stats.totalTasks)}</Text>
            </View>
          </View>
        </View>

        {/* --- Chart Section (Text Representation) --- */}
        <View style={styles.chartSection}>
           {/* Project Status */}
           <View style={[styles.chartContainer, styles.chartContainerLast]}>
             <Text style={styles.chartTitle}>Projects by Status</Text>
              {stats.projectsByStatus && stats.projectsByStatus.length > 0 ? (
                  <View style={styles.listContainer}>
                     {stats.projectsByStatus.map(item => (
                         <View key={item.status} style={styles.listItem}>
                            <View style={[styles.listItemColorDot, { backgroundColor: getChartColor(item.status) }]} />
                            <Text style={styles.listItemLabel}>{formatStatus(item.status)}:</Text>
                            <Text style={styles.listItemValue}>{item.count} ({((item.count / totalProjects) * 100).toFixed(1)}%)</Text>
                         </View>
                     ))}
                  </View>
              ) : (
                 <Text style={styles.chartNote}>No project data available</Text>
              )}
             <Text style={styles.chartNote}>(Chart visualization not included in PDF)</Text>
           </View>

           {/* Task Status */}
            <View style={styles.chartContainer}>
               <Text style={styles.chartTitle}>Tasks by Status</Text>
                {stats.tasksByStatus && stats.tasksByStatus.length > 0 ? (
                   <View style={styles.listContainer}>
                      {stats.tasksByStatus.map(item => (
                          <View key={item.status} style={styles.listItem}>
                             <View style={[styles.listItemColorDot, { backgroundColor: getChartColor(item.status) }]} />
                             <Text style={styles.listItemLabel}>{formatStatus(item.status)}:</Text>
                             <Text style={styles.listItemValue}>{item.count} ({((item.count / totalTasks) * 100).toFixed(1)}%)</Text>
                          </View>
                      ))}
                   </View>
               ) : (
                  <Text style={styles.chartNote}>No task data available</Text>
               )}
              <Text style={styles.chartNote}>(Chart visualization not included in PDF)</Text>
            </View>
        </View>

        {/* --- Detailed Statistics Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detailed Statistics</Text>
          <View style={styles.detailSection}>
             <View style={styles.detailGrid}>
                 {/* Projects Column */}
                 <View style={styles.detailColumn}>
                    <Text style={{ fontSize: 10, fontWeight: 'semibold', marginBottom: 8 }}>Projects</Text>
                    {stats.projectsByStatus && stats.projectsByStatus.map(item => (
                        <View key={item.status} style={styles.detailItem}>
                            <Text style={getStatusBadgeStyle(item.status)}>
                                {formatStatus(item.status)}
                            </Text>
                            <View style={styles.detailProgressBarContainer}>
                                <View style={[styles.detailProgressBar, {
                                    width: `${(item.count / totalProjects) * 100}%`,
                                    backgroundColor: getChartColor(item.status)
                                }]} />
                            </View>
                            <Text style={styles.detailValueText}>
                                {item.count} ({((item.count / totalProjects) * 100).toFixed(1)}%)
                            </Text>
                        </View>
                    ))}
                    {(!stats.projectsByStatus || stats.projectsByStatus.length === 0) && <Text style={styles.subtitle}>No project data</Text>}
                 </View>
                 {/* Tasks Column */}
                 <View style={[styles.detailColumn, styles.detailColumnLast]}>
                     <Text style={{ fontSize: 10, fontWeight: 'semibold', marginBottom: 8 }}>Tasks</Text>
                     {stats.tasksByStatus && stats.tasksByStatus.map(item => (
                        <View key={item.status} style={styles.detailItem}>
                             <Text style={getStatusBadgeStyle(item.status)}>
                                {formatStatus(item.status)}
                             </Text>
                             <View style={styles.detailProgressBarContainer}>
                                 <View style={[styles.detailProgressBar, {
                                     width: `${(item.count / totalTasks) * 100}%`,
                                     backgroundColor: getChartColor(item.status)
                                 }]} />
                             </View>
                             <Text style={styles.detailValueText}>
                                 {item.count} ({((item.count / totalTasks) * 100).toFixed(1)}%)
                             </Text>
                        </View>
                     ))}
                     {(!stats.tasksByStatus || stats.tasksByStatus.length === 0) && <Text style={styles.subtitle}>No task data</Text>}
                 </View>
             </View>
          </View>
        </View>

        {/* --- Page Number Footer --- */}
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `${pageNumber} / ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
};

export default AnalyticsPdfDocument;