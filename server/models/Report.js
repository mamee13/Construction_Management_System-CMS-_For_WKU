// models/Report.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a report title'],
    trim: true,
    maxlength: [150, 'Report title cannot exceed 150 characters']
  },
  type: {
    type: String,
    required: [true, 'Please specify the report type'],
    enum: [
        'progress',         // General progress update
        'monthly_progress', // Specific monthly summary
        'weekly_progress',  // Specific weekly summary
        'daily_log',        // Daily site activity log
        'material_usage',   // Report focused on materials
        'schedule_adherence',// Report focused on schedule
        'issue_summary',    // Summary of problems/blockers
        'financial',        // Cost/budget related (if budget tracking is detailed)
        'custom'            // For other types
    ],
    default: 'progress'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Report must be associated with a project']
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Report must have a generator (user)']
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  // Optional: Define the period this report covers
  periodStartDate: {
    type: Date
  },
  periodEndDate: {
    type: Date
  },
  // Core content of the report
  summary: {
    type: String,
    trim: true,
    required: [true, 'Please provide a report summary or description']
  },
  // Store key data points relevant at the time of generation
  // This makes reports self-contained snapshots
  keyMetrics: {
    tasksCompleted: { type: Number, default: 0 },
    tasksInProgress: { type: Number, default: 0 },
    tasksPending: { type: Number, default: 0 },
    overallProgressPercentage: { type: Number, min: 0, max: 100 }, // Calculated/Estimated at generation
    budgetSpentToDate: { type: Number }, // If available
    // Add other relevant metrics based on report type
  },
  // Section for specific issues or highlights
  issuesAndRisks: [{
      description: { type: String, required: true },
      severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
      reportedAt: { type: Date, default: Date.now }
  }],
  // Attachments (optional - stores URLs or references, not blobs)
  attachments: [{
      fileName: String,
      url: String // URL to file stored elsewhere (e.g., S3, local storage)
  }],
  // Status of the report itself (e.g., draft, submitted)
  status: {
      type: String,
      enum: ['draft', 'submitted', 'archived'],
      default: 'submitted'
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Indexes for performance
reportSchema.index({ project: 1, generatedAt: -1 }); // Quickly find reports for a project, newest first
reportSchema.index({ generatedBy: 1 });
reportSchema.index({ type: 1 });

module.exports = mongoose.model('Report', reportSchema);