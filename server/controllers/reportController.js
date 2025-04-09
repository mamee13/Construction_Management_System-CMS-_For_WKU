// // controllers/reportController.js
// const Report = require('../models/Report');
// const Project = require('../models/Project');
// const Task = require('../models/Task');
// const Material = require('../models/Material'); // If needed for material reports
// const Schedule = require('../models/Schedule'); // If needed for schedule reports
// const catchAsync = require('../utils/CatchAsync'); // Your async error handler
// // const ErrorResponse = require('../utils/ErrorResponse'); // Your custom error class

// // @desc    Create a new report
// // @route   POST /api/reports
// // @access  Private (Contractor, Consultant, Project Manager, Admin)
// exports.createReport = catchAsync(async (req, res, next) => {
//     const {
//         title,
//         type,
//         project: projectId, // ID of the project
//         periodStartDate,
//         periodEndDate,
//         summary,
//         issuesAndRisks, // Array of issues
//         // attachments // Handle file uploads separately if needed
//     } = req.body;

//     // 1. Validate Input
//     if (!title || !type || !projectId || !summary) {
//         return res.status(400).json({ success: false, message: 'Missing required fields: title, type, project, summary' });
//         // return next(new ErrorResponse('Missing required fields', 400));
//     }

//     // 2. Check if Project Exists
//     const project = await Project.findById(projectId);
//     if (!project) {
//         return res.status(404).json({ success: false, message: `Project not found with id ${projectId}` });
//         // return next(new ErrorResponse(`Project not found`, 404));
//     }

//     // 3. *** Generate Report Content / Key Metrics (Crucial Step) ***
//     // This logic depends heavily on the 'type' of report.
//     let keyMetrics = {};
//     let calculatedSummary = summary; // Start with user provided summary

//     // Example: Logic for 'progress' or 'monthly_progress' report type
//     if (type === 'progress' || type === 'monthly_progress' || type === 'weekly_progress') {
//         // Define the date range for querying tasks
//         let dateFilter = {};
//         if (periodStartDate && periodEndDate) {
//             dateFilter = {
//                 createdAt: { $gte: new Date(periodStartDate), $lte: new Date(periodEndDate) }
//                 // OR filter based on task start/end dates within the period, depending on logic
//             };
//         } else {
//            // If no period defined, maybe report on *current* status?
//            // Or default to last month/week? Needs clarification. Let's assume current status for now.
//         }

//         // Fetch tasks associated with the project (potentially filtered by date)
//         const tasks = await Task.find({ project: projectId, ...dateFilter }); // Adjust dateFilter as needed
//         console.log('Tasks fetched:', tasks); // Debugging
//         const totalTasks = tasks.length;
//         const tasksCompleted = tasks.filter(t => t.status === 'completed').length;
//         const tasksInProgress = tasks.filter(t => t.status === 'in_progress').length;
//         const tasksPending = tasks.filter(t => t.status === 'not_started' || t.status === 'on_hold').length;

//         // Basic progress calculation (can be more sophisticated)
//         const overallProgressPercentage = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

//         keyMetrics = {
//             tasksCompleted,
//             tasksInProgress,
//             tasksPending,
//             overallProgressPercentage,
//             // Add budget info if project model has it readily available or fetch financials
//         };

//         // You could enhance the summary automatically:
//         // calculatedSummary += `\n\nProgress: ${overallProgressPercentage}% (${tasksCompleted}/${totalTasks} tasks completed).`;
//     }
//     // Add similar `if` blocks for other report types ('material_usage', 'schedule_adherence', etc.)
//     // fetching relevant data from Material, Schedule models respectively.

//     // 4. Create the Report Document
//     const reportData = {
//         title,
//         type,
//         project: projectId,
//         generatedBy: req.user.id, // Assumes 'protect' middleware adds user to req
//         periodStartDate,
//         periodEndDate,
//         summary: calculatedSummary,
//         keyMetrics,
//         issuesAndRisks: issuesAndRisks || [], // Ensure it's an array
//         // attachments: processedAttachments // If handling uploads
//     };

//     const report = await Report.create(reportData);

//     res.status(201).json({
//         success: true,
//         data: report
//     });
// });

// // @desc    Get reports (filtered and paginated)
// // @route   GET /api/reports
// // @access  Private (All authenticated users, permissions checked)
// exports.getReports = catchAsync(async (req, res, next) => {
//     const { projectId, type, userId, startDate, endDate, page = 1, limit = 10, sortBy = '-generatedAt' } = req.query;

//     let queryFilter = {};

//     // --- Authorization Filter ---
//     // Admins/Committees can see all? Or filter based on project association?
//     // Contractors/Consultants/PMs should likely only see reports for projects they are assigned to.
//     const userRole = req.user.role;
//     const currentUserId = req.user.id;

//     if (userRole !== 'admin' && userRole !== 'committee') { // Non-admins/committees
//         // Find projects associated with the user
//         const userProjects = await Project.find({
//             $or: [
//                 { contractor: currentUserId },
//                 { consultant: currentUserId },
//                 // If PMs are stored differently, add that condition
//                 // If tasks have assignedTo, might need more complex lookup
//             ]
//         }).select('_id'); // Get only project IDs

//         const projectIds = userProjects.map(p => p._id);

//         // Filter reports to only include those related to the user's projects
//         queryFilter.project = { $in: projectIds };
//     }

//     // --- Apply Request Filters ---
//     if (projectId) {
//         // If a specific project is requested, ensure the user has access to it (if not admin/committee)
//         if (userRole !== 'admin' && userRole !== 'committee') {
//              const hasAccess = await Project.exists({ _id: projectId, $or: [{ contractor: currentUserId }, { consultant: currentUserId }] });
//              if (!hasAccess) {
//                  return res.status(403).json({ success: false, message: 'Forbidden: You do not have access to reports for this project.' });
//              }
//         }
//         queryFilter.project = projectId;
//     }
//     if (type) {
//         queryFilter.type = type;
//     }
//     if (userId) { // Filter by who generated the report
//         queryFilter.generatedBy = userId;
//     }
//     if (startDate && endDate) { // Filter by generation date range
//         queryFilter.generatedAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
//     } else if (startDate) {
//         queryFilter.generatedAt = { $gte: new Date(startDate) };
//     } else if (endDate) {
//         queryFilter.generatedAt = { $lte: new Date(endDate) };
//     }

//     // --- Execute Query with Pagination ---
//     const pageNum = parseInt(page, 10);
//     const limitNum = parseInt(limit, 10);
//     const skip = (pageNum - 1) * limitNum;

//     const totalReports = await Report.countDocuments(queryFilter);
//     const reports = await Report.find(queryFilter)
//         .populate('generatedBy', 'firstName lastName role') // Populate user info
//         .populate('project', 'projectName') // Populate project name
//         .sort(sortBy)
//         .skip(skip)
//         .limit(limitNum);

//     res.status(200).json({
//         success: true,
//         count: reports.length,
//         total: totalReports,
//         pagination: {
//             page: pageNum,
//             limit: limitNum,
//             totalPages: Math.ceil(totalReports / limitNum)
//         },
//         data: reports
//     });
// });

// // @desc    Get single report by ID
// // @route   GET /api/reports/:id
// // @access  Private (Check permissions)
// // exports.getReportById = catchAsync(async (req, res, next) => {
// //     const report = await Report.findById(req.params.id)
// //         .populate('generatedBy', 'firstName lastName email role') // More user details
// //         .populate({
// //              path: 'project',
// //              select: 'projectName projectLocation contractor consultant status' // More project details
// //              // Optionally populate contractor/consultant names within the project
// //              // populate: [{ path: 'contractor', select: 'firstName lastName' }, { path: 'consultant', select: 'firstName lastName' }]
// //         });

// //     if (!report) {
// //         return res.status(404).json({ success: false, message: `Report not found with id ${req.params.id}` });
// //         // return next(new ErrorResponse(`Report not found`, 404));
// //     }

// //     // --- Authorization Check ---
// //     const userRole = req.user.role;
// //     const currentUserId = req.user.id;
// //     const projectDetails = await Project.findById(report.project._id).select('contractor consultant'); // Fetch project assignments

// //     const isCreator = report.generatedBy._id.toString() === currentUserId.toString();
// //     const isAdminOrCommittee = userRole === 'admin' || userRole === 'committee';
// //     const isAssignedToProject = projectDetails && (
// //         projectDetails.contractor?.toString() === currentUserId.toString() ||
// //         projectDetails.consultant?.toString() === currentUserId.toString()
// //         // Add checks for PM if relevant
// //     );

// //     if (!isAdminOrCommittee && !isCreator && !isAssignedToProject) {
// //          return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to view this report.' });
// //          // return next(new ErrorResponse('Not authorized to view this report', 403));
// //     }

// //     res.status(200).json({
// //         success: true,
// //         data: report
// //     });
// // });
// exports.getReportById = catchAsync(async (req, res, next) => {
//     // Debug: Log the user information from the request
//     console.log("req.user:", req.user);
  
//     const report = await Report.findById(req.params.id)
//       .populate("generatedBy", "firstName lastName email role")
//       .populate({
//         path: "project",
//         select: "projectName projectLocation contractor consultant status",
//       });
  
//     if (!report) {
//       return res.status(404).json({
//         success: false,
//         message: `Report not found with id ${req.params.id}`,
//       });
//     }
  
//     // --- Authorization Check ---
//     const userRole = req.user.role;
//     const currentUserId = req.user.id;
  
//     // Debug: Log role and user ID details
//     console.log("User role:", userRole);
//     console.log("Current User ID:", currentUserId);
  
//     // Normalize the role for a case-insensitive check
//     const isAdminOrCommittee =
//       userRole && (userRole.toLowerCase() === "admin" || userRole.toLowerCase() === "committee");
  
//     // Retrieve project details to check for assignment
//     const projectDetails = await Project.findById(report.project._id).select("contractor consultant");
  
//     const isCreator = report.generatedBy._id.toString() === currentUserId.toString();
//     const isAssignedToProject =
//       projectDetails &&
//       (projectDetails.contractor?.toString() === currentUserId.toString() ||
//         projectDetails.consultant?.toString() === currentUserId.toString());
  
//     // Debug: Log the outcome of the authorization checks
//     console.log("isAdminOrCommittee:", isAdminOrCommittee);
//     console.log("isCreator:", isCreator);
//     console.log("isAssignedToProject:", isAssignedToProject);
  
//     if (!isAdminOrCommittee && !isCreator && !isAssignedToProject) {
//       return res.status(403).json({
//         success: false,
//         message: "Forbidden: You do not have permission to view this report.",
//       });
//     }
  
//     res.status(200).json({
//       success: true,
//       data: report,
//     });
//   });
  
// // @desc    Delete a report (Optional)
// // @route   DELETE /api/reports/:id
// // @access  Private (Admin, possibly Creator)
// // exports.deleteReport = catchAsync(async (req, res, next) => {
// //     const report = await Report.findById(req.params.id);

// //     if (!report) {
// //         return res.status(404).json({ success: false, message: `Report not found` });
// //         // return next(new ErrorResponse(`Report not found`, 404));
// //     }

// //     // Authorization check: Only admin or the person who generated it can delete?
// //     if (req.user.role !== 'admin' && report.generatedBy.toString() !== req.user.id.toString()) {
// //          return res.status(403).json({ success: false, message: 'Not authorized to delete this report' });
// //         // return next(new ErrorResponse('Not authorized to delete this report', 403));
// //     }

// //     await report.remove(); // Or report.deleteOne()

// //     res.status(200).json({
// //         success: true,
// //         message: 'Report deleted successfully',
// //         data: { deletedId: req.params.id }
// //     });
// // });

// // @desc    Update a report (Admin Only)
// // @route   PUT /api/reports/:id
// // @access  Private (Admin)
// exports.updateReport = catchAsync(async (req, res, next) => {
//     const reportId = req.params.id;
//     const updatePayload = req.body;

//     // 1. Authorization: Check if the user is an Admin
//     if (req.user.role !== 'admin') {
//         return res.status(403).json({
//             success: false,
//             message: 'Forbidden: Only administrators can update reports.'
//         });
//         // return next(new ErrorResponse('Not authorized to update this report', 403));
//     }

//     // 2. Define fields admins are allowed to update
//     //    Admins might update status, feedback, or even core content if necessary.
//     const allowedAdminUpdates = [
//         'title',
//         'summary',
//         'issuesAndRisks',
//         'status', // Key field for admin workflow (e.g., approved, rejected)
//         'feedback', // Field for admin feedback added to the model is assumed
//         'periodStartDate',
//         'periodEndDate',
//         // Note: Exclude fields like 'generatedBy', 'project', 'generatedAt', 'keyMetrics' (unless recalculation logic exists)
//     ];

//     const updatesToApply = {};
//     let hasValidUpdate = false;

//     allowedAdminUpdates.forEach(field => {
//         if (updatePayload.hasOwnProperty(field)) {
//              // You might add specific validation here if needed (e.g., check array format for issuesAndRisks)
//             updatesToApply[field] = updatePayload[field];
//             hasValidUpdate = true;
//         }
//     });

//     // 3. Check if any valid fields were provided for update
//     if (!hasValidUpdate) {
//         return res.status(400).json({
//             success: false,
//             message: 'Bad Request: No valid fields provided for update.'
//         });
//     }

//     // 4. Find the report by ID and update it
//     //    Using findByIdAndUpdate ensures atomicity and runs schema validators.
//     const updatedReport = await Report.findByIdAndUpdate(
//         reportId,
//         updatesToApply,
//         {
//             new: true,           // Return the modified document rather than the original
//             runValidators: true, // Ensure the updates adhere to the schema (e.g., status enum)
//             context: 'query'     // Recommended for certain validator types
//         }
//     )
//     .populate('generatedBy', 'firstName lastName role') // Re-populate necessary fields
//     .populate('project', 'projectName projectLocation');

//     // 5. Handle case where the report wasn't found
//     if (!updatedReport) {
//         return res.status(404).json({
//             success: false,
//             message: `Report not found with id ${reportId}`
//         });
//         // return next(new ErrorResponse(`Report not found with id ${reportId}`, 404));
//     }

//     // 6. Send successful response
//     res.status(200).json({
//         success: true,
//         message: 'Report updated successfully by admin.',
//         data: updatedReport
//     });
// });


// // @desc    Delete a report (Consider Admin or Creator)
// // @route   DELETE /api/reports/:id
// // @access  Private (Admin, potentially Creator)
// exports.deleteReport = catchAsync(async (req, res, next) => {
//     const report = await Report.findById(req.params.id);

//     if (!report) {
//         return res.status(404).json({ success: false, message: `Report not found with id ${req.params.id}` });
//         // return next(new ErrorResponse(`Report not found`, 404));
//     }

//     // Authorization check: Allow Admin OR the original creator to delete
//     const isAdmin = req.user.role === 'admin';
//     // Ensure generatedBy exists before checking
//     const isCreator = report.generatedBy?._id?.toString() === req.user.id.toString();

//     if (!isAdmin && !isCreator) {
//          return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to delete this report.' });
//         // return next(new ErrorResponse('Not authorized to delete this report', 403));
//     }

//     // Perform the delete operation
//     await Report.deleteOne({ _id: req.params.id }); // Use deleteOne or findByIdAndDelete

//     res.status(200).json({
//         success: true,
//         message: 'Report deleted successfully',
//         data: { deletedId: req.params.id } // Return the ID of the deleted report
//     });
// });

// controllers/reportController.js
// const mongoose = require('mongoose'); // Ensure mongoose is imported if not already
// const Report = require('../models/Report');
// const Project = require('../models/Project');
// const Task = require('../models/Task');
// const Material = require('../models/Material'); // If needed for material reports
// const Schedule = require('../models/Schedule'); // If needed for schedule reports
// const User = require('../models/User'); // Import User model for finding admins/managers
// const catchAsync = require('../utils/CatchAsync'); // Your async error handler
// const AppError = require('../utils/AppError'); // Assuming you use this for errors
// // Import the notification helper (Make sure the path is correct)
// const { createAndEmitNotification } = require('../utils/notificationHelper');

// // @desc     Create a new report
// // @route    POST /api/reports
// // @access   Private (Contractor, Consultant, Project Manager, Admin)
// exports.createReport = catchAsync(async (req, res, next) => {
//     const {
//         title,
//         type,
//         project: projectId, // ID of the project
//         periodStartDate,
//         periodEndDate,
//         summary,
//         issuesAndRisks, // Array of issues
//         // attachments // Handle file uploads separately if needed
//     } = req.body;
//   console.log("req.body:", req.body); // Debugging: Log the request body
//     // 1. Validate Input
//     if (!title || !type || !projectId || !summary) {
//         // Use AppError for consistency
//         return next(new AppError('Missing required fields: title, type, project, summary', 400));
//         // return res.status(400).json({ success: false, message: 'Missing required fields: title, type, project, summary' });
//     }

//     // --- Added check: Ensure req.user exists ---
//      if (!req.user || !req.user.id) { // Use req.user.id or req.user._id based on your authMiddleware
//         console.error('Error in createReport: req.user not found or missing id/._id. Ensure auth middleware runs first.');
//         return next(new AppError('Authentication error: User information missing.', 500));
//     }
//     const submitterId = req.user.id; // Or req.user._id
//     // --- End Added check ---


//     // 2. Check if Project Exists (You already have this logic)
//     const project = await Project.findById(projectId);
//     if (!project) {
//         // Use AppError
//         return next(new AppError(`Project not found with id ${projectId}`, 404));
//         // return res.status(404).json({ success: false, message: `Project not found with id ${projectId}` });
//     }

//     // 3. *** Generate Report Content / Key Metrics (Keep your existing logic) ***
//     let keyMetrics = {};
//     let calculatedSummary = summary;
//     if (type === 'progress' || type === 'monthly_progress' || type === 'weekly_progress') {
//         let dateFilter = {};
//          if (periodStartDate && periodEndDate) {
//              dateFilter = {
//                  // Adjust date field based on your Task model and desired logic
//                  createdAt: { $gte: new Date(periodStartDate), $lte: new Date(periodEndDate) }
//              };
//          }
//         const tasks = await Task.find({ project: projectId, ...dateFilter });
//         const totalTasks = tasks.length;
//         const tasksCompleted = tasks.filter(t => t.status === 'completed').length;
//         const tasksInProgress = tasks.filter(t => t.status === 'in_progress').length;
//         const tasksPending = tasks.filter(t => t.status === 'not_started' || t.status === 'on_hold').length;
//         const overallProgressPercentage = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;
//         keyMetrics = { tasksCompleted, tasksInProgress, tasksPending, overallProgressPercentage };
//     }
//     // Add other report type logic here...


//     // 4. Create the Report Document
//     const reportData = {
//         title,
//         type,
//         project: projectId,
//         generatedBy: submitterId, // Use the extracted submitterId
//         periodStartDate,
//         periodEndDate,
//         summary: calculatedSummary,
//         keyMetrics,
//         issuesAndRisks: issuesAndRisks || [],
//     };

//     const report = await Report.create(reportData);

//     // <<<--- Notification Logic for Submission START --->>>
//     const io = req.app.get('socketio'); // Get io instance

//     if (io) {
//         // Find recipients: Project Manager (from fetched project) and Admins
//         let recipientIds = [];

//         // Add Project Manager (if exists and is not the submitter)
//         if (project.projectManager && project.projectManager.toString() !== submitterId.toString()) {
//             recipientIds.push(project.projectManager.toString());
//         }

//         // Find Admins (adjust role name if needed)
//         const admins = await User.find({ role: 'admin' }).select('_id');
//         admins.forEach(admin => {
//             // Add admin if they are not the submitter
//             if (admin._id.toString() !== submitterId.toString()) {
//                 recipientIds.push(admin._id.toString());
//             }
//         });

//         // Ensure unique recipients before sending
//         const uniqueRecipientIds = [...new Set(recipientIds)];

//         // Send notification to each recipient
//         uniqueRecipientIds.forEach(userId => {
//             createAndEmitNotification(io, userId, {
//                 senderUser: submitterId, // ID of the user submitting the report
//                 type: 'REPORT_SUBMITTED',
//                 message: `New report '${report.title}' submitted for project '${project.projectName}'`,
//                 link: `/reports/${report._id}`, // Example frontend link
//                 projectId: report.project, // Already have project ID
//                 reportId: report._id
//             });
//         });
//     } else {
//         console.warn('Socket.IO instance (io) not found in report creation. Submission notifications will not be sent.');
//     }
//     // <<<--- Notification Logic for Submission END --->>>

//     // Keep original response
//     res.status(201).json({
//         success: true,
//         data: report
//     });
// });

// // @desc     Get reports (filtered and paginated)
// // @route    GET /api/reports
// // @access   Private (All authenticated users, permissions checked)
// // --- Keep your existing getReports function AS IS ---
// exports.getReports = catchAsync(async (req, res, next) => {
//     const { projectId, type, userId, startDate, endDate, page = 1, limit = 10, sortBy = '-generatedAt' } = req.query;

//     let queryFilter = {};

//     // --- Authorization Filter ---
//     const userRole = req.user.role;
//     const currentUserId = req.user.id; // Use .id or ._id

//     if (userRole !== 'admin' && userRole !== 'committee') {
//         const userProjects = await Project.find({
//             $or: [
//                 { contractor: currentUserId },
//                 { consultant: currentUserId },
//                 { projectManager: currentUserId } // Add PM here
//             ]
//         }).select('_id');

//         const projectIds = userProjects.map(p => p._id);
//         queryFilter.project = { $in: projectIds };
//     }

//     // --- Apply Request Filters ---
//     if (projectId) {
//         if (userRole !== 'admin' && userRole !== 'committee') {
//             // Check access based on all roles associated with the project
//              const hasAccess = await Project.exists({
//                  _id: projectId,
//                  $or: [
//                      { contractor: currentUserId },
//                      { consultant: currentUserId },
//                      { projectManager: currentUserId }
//                  ]
//              });
//              if (!hasAccess) {
//                  // Use AppError
//                  return next(new AppError('Forbidden: You do not have access to reports for this project.', 403));
//                  // return res.status(403).json({ success: false, message: 'Forbidden: You do not have access to reports for this project.' });
//             }
//         }
//         queryFilter.project = projectId;
//     }
//      if (type) {
//         queryFilter.type = type;
//     }
//     if (userId) {
//         queryFilter.generatedBy = userId;
//     }
//     if (startDate && endDate) {
//         queryFilter.generatedAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
//     } else if (startDate) {
//         queryFilter.generatedAt = { $gte: new Date(startDate) };
//     } else if (endDate) {
//         queryFilter.generatedAt = { $lte: new Date(endDate) };
//     }

//     // --- Execute Query with Pagination ---
//     const pageNum = parseInt(page, 10);
//     const limitNum = parseInt(limit, 10);
//     const skip = (pageNum - 1) * limitNum;

//     const totalReports = await Report.countDocuments(queryFilter);
//     const reports = await Report.find(queryFilter)
//         .populate('generatedBy', 'firstName lastName role') // Populate user info
//         .populate('project', 'projectName') // Populate project name
//         .sort(sortBy)
//         .skip(skip)
//         .limit(limitNum);

//     res.status(200).json({
//         success: true,
//         count: reports.length,
//         total: totalReports,
//         pagination: {
//             page: pageNum,
//             limit: limitNum,
//             totalPages: Math.ceil(totalReports / limitNum)
//         },
//         data: reports
//     });
// });


// // @desc     Get single report by ID
// // @route    GET /api/reports/:id
// // @access   Private (Check permissions)
// // --- Keep your existing getReportById function AS IS ---
// exports.getReportById = catchAsync(async (req, res, next) => {
//     // Debug: Log the user information from the request
//     console.log("req.user:", req.user);

//     const report = await Report.findById(req.params.id)
//       .populate("generatedBy", "firstName lastName email role")
//       .populate({
//         path: "project",
//         select: "projectName projectLocation contractor consultant projectManager status", // Added projectManager
//       });

//     if (!report) {
//         // Use AppError
//        return next(new AppError(`Report not found with id ${req.params.id}`, 404));
//     //    return res.status(404).json({
//     //      success: false,
//     //      message: `Report not found with id ${req.params.id}`,
//     //    });
//     }

//     // --- Authorization Check ---
//     const userRole = req.user.role;
//     const currentUserId = req.user.id; // Use .id or ._id

//     // Debug: Log role and user ID details
//     console.log("User role:", userRole);
//     console.log("Current User ID:", currentUserId);

//     // Normalize the role for a case-insensitive check
//     const isAdminOrCommittee =
//       userRole && (userRole.toLowerCase() === "admin" || userRole.toLowerCase() === "committee");

//     // Retrieve project details to check for assignment
//     // Fetch project assignments including PM
//     const projectDetails = await Project.findById(report.project._id).select("contractor consultant projectManager");


//     // Ensure generatedBy exists before checking isCreator
//     const isCreator = report.generatedBy && report.generatedBy._id.toString() === currentUserId.toString();

//     // Check if assigned to project, including PM role
//     const isAssignedToProject =
//       projectDetails &&
//       (projectDetails.contractor?.toString() === currentUserId.toString() ||
//        projectDetails.consultant?.toString() === currentUserId.toString() ||
//        projectDetails.projectManager?.toString() === currentUserId.toString() // Added PM check
//       );


//     // Debug: Log the outcome of the authorization checks
//     console.log("isAdminOrCommittee:", isAdminOrCommittee);
//     console.log("isCreator:", isCreator);
//     console.log("isAssignedToProject:", isAssignedToProject);

//     if (!isAdminOrCommittee && !isCreator && !isAssignedToProject) {
//        // Use AppError
//        return next(new AppError('Forbidden: You do not have permission to view this report.', 403));
//     //    return res.status(403).json({
//     //      success: false,
//     //      message: "Forbidden: You do not have permission to view this report.",
//     //    });
//     }

//     res.status(200).json({
//       success: true,
//       data: report,
//     });
//   });


// // @desc     Update a report (Admin Only)
// // @route    PUT /api/reports/:id
// // @access   Private (Admin)
// exports.updateReport = catchAsync(async (req, res, next) => {
//     const reportId = req.params.id;
//     const updatePayload = req.body;

//     // 1. Authorization: Check if the user is an Admin (keep as is)
//     if (req.user.role !== 'admin') {
//         // Use AppError
//         return next(new AppError('Forbidden: Only administrators can update reports.', 403));
//         // return res.status(403).json({ ... });
//     }

//      // --- Added check: Ensure req.user exists ---
//      if (!req.user || !req.user.id) { // Use .id or ._id
//         console.error('Error in updateReport: req.user not found or missing id/._id. Ensure auth middleware runs first.');
//         return next(new AppError('Authentication error: User information missing.', 500));
//     }
//     const adminUserId = req.user.id; // ID of admin performing the update
//     // --- End Added check ---

//     // Fetch the report *before* updating to check original status if needed
//     // (Though for notifying the submitter, we can get generatedBy from the updated one if it's not changed)
//     // const originalReport = await Report.findById(reportId).select('status generatedBy');
//     // if (!originalReport) {
//     //     return next(new AppError(`Report not found with id ${reportId}`, 404));
//     // }

//     // 2. Define allowed fields (keep as is)
//     const allowedAdminUpdates = [
//         'title', 'summary', 'issuesAndRisks', 'status',
//         'feedback', 'periodStartDate', 'periodEndDate',
//     ];
//     const updatesToApply = {};
//     let hasValidUpdate = false;
//     allowedAdminUpdates.forEach(field => {
//         if (updatePayload.hasOwnProperty(field)) {
//             updatesToApply[field] = updatePayload[field];
//             hasValidUpdate = true;
//         }
//     });

//     // 3. Check if valid fields provided (keep as is)
//     if (!hasValidUpdate) {
//         // Use AppError
//         return next(new AppError('Bad Request: No valid fields provided for update.', 400));
//         // return res.status(400).json({ ... });
//     }

//     // Determine if this update includes setting status to 'approved'
//     const isBeingApproved = updatesToApply.status === 'approved'; // Simple check

//     // 4. Find the report by ID and update it (keep as is)
//     const updatedReport = await Report.findByIdAndUpdate(
//         reportId,
//         updatesToApply,
//         { new: true, runValidators: true, context: 'query' }
//     )
//     .populate('generatedBy', 'firstName lastName email role') // Populate needed fields
//     .populate('project', 'projectName projectManager'); // Populate project name and PM

//     // 5. Handle case where report not found (keep as is)
//     if (!updatedReport) {
//         // Use AppError
//         return next(new AppError(`Report not found with id ${reportId}`, 404));
//         // return res.status(404).json({ ... });
//     }

//     // <<<--- Notification Logic for Update START --->>>
//     const io = req.app.get('socketio');
//     if (io) {
//         // Notify the original submitter (if they exist and are not the admin updating)
//         const submitter = updatedReport.generatedBy; // Populated user object or just the ID? Assuming populated or ID is usable
//         if (submitter && submitter._id.toString() !== adminUserId.toString()) {
//             let notificationType = 'REPORT_UPDATED';
//             let notificationMessage = `Your report '${updatedReport.title}' has been updated by an admin.`;

//             if (isBeingApproved) {
//                  notificationType = 'REPORT_APPROVED';
//                  notificationMessage = `Your report '${updatedReport.title}' has been approved.`;
//             }

//             createAndEmitNotification(io, submitter._id.toString(), {
//                  senderUser: adminUserId,
//                  type: notificationType,
//                  message: notificationMessage,
//                  link: `/reports/${updatedReport._id}`, // Link to the updated report
//                  projectId: updatedReport.project?._id || updatedReport.project, // Handle populated vs non-populated project field
//                  reportId: updatedReport._id
//              });
//         }

//         // Optional: Notify other relevant parties about the update/approval
//         // e.g., Project Manager (if not the submitter and not the admin updating)
//         const projectManagerId = updatedReport.project?.projectManager?.toString();
//         if (projectManagerId && projectManagerId !== adminUserId.toString() && (!submitter || projectManagerId !== submitter._id.toString()) ) {
//              createAndEmitNotification(io, projectManagerId, {
//                  senderUser: adminUserId,
//                  type: isBeingApproved ? 'REPORT_APPROVED' : 'REPORT_UPDATED', // Be specific if approved
//                  message: `Report '${updatedReport.title}' for project '${updatedReport.project?.projectName || 'N/A'}' was ${isBeingApproved ? 'approved' : 'updated'} by an admin.`,
//                  link: `/reports/${updatedReport._id}`,
//                  projectId: updatedReport.project?._id || updatedReport.project,
//                  reportId: updatedReport._id
//              });
//         }
//         // Add logic here to notify other admins if desired

//     } else {
//         console.warn('Socket.IO instance (io) not found in report update. Update notifications will not be sent.');
//     }
//     // <<<--- Notification Logic for Update END --->>>

//     // 6. Send successful response (keep as is)
//     res.status(200).json({
//         success: true,
//         message: 'Report updated successfully by admin.',
//         data: updatedReport
//     });
// });


// // @desc     Delete a report (Consider Admin or Creator)
// // @route    DELETE /api/reports/:id
// // @access   Private (Admin, potentially Creator)
// // --- Keep your existing deleteReport function AS IS ---
// exports.deleteReport = catchAsync(async (req, res, next) => {
//     const report = await Report.findById(req.params.id);

//     if (!report) {
//         // Use AppError
//        return next(new AppError(`Report not found with id ${req.params.id}`, 404));
//         // return res.status(404).json({ success: false, message: `Report not found with id ${req.params.id}` });
//     }

//     // Authorization check: Allow Admin OR the original creator to delete
//     const isAdmin = req.user.role === 'admin';
//     // Ensure generatedBy exists before checking
//     // Use req.user.id or req.user._id consistently
//     const isCreator = report.generatedBy?._id?.toString() === req.user.id?.toString();

//     if (!isAdmin && !isCreator) {
//        // Use AppError
//        return next(new AppError('Forbidden: You are not authorized to delete this report.', 403));
//         //  return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to delete this report.' });
//     }

//     // Perform the delete operation
//     await Report.deleteOne({ _id: req.params.id }); // Use deleteOne or findByIdAndDelete

//     res.status(200).json({
//         success: true,
//         message: 'Report deleted successfully',
//         data: { deletedId: req.params.id } // Return the ID of the deleted report
//     });
// });


// // Add this new controller function
// // exports.getMyReports = catchAsync(async (req, res, next) => {
// //     const userId = req.user._id; // Get user ID from authMiddleware

// //     if (!userId) {
// //         // Should be caught by authMiddleware, but good to double-check
// //         return next(new AppError('Authentication required to fetch your reports.', 401));
// //     }

// //     // Find reports created by or assigned to this user
// //     // Adjust the field name ('createdBy', 'author', 'assignedTo') based on your Report Schema
// //     const reports = await Report.find({ createdBy: userId })
// //         .populate('project', 'projectName') // Populate necessary related data
// //         .sort({ createdAt: -1 });

// //     // Return in the expected format
// //     res.status(200).json({
// //         success: true,
// //         count: reports.length,
// //         data: { reports: reports } // Match the structure expected by frontend
// //     });
// // });

// exports.getMyReports = catchAsync(async (req, res, next) => {
//     // Ensure you are consistently using req.user.id or req.user._id based on your authMiddleware
//     const userId = req.user.id || req.user._id; // Get user ID

//     if (!userId) {
//         return next(new AppError('Authentication required to fetch your reports.', 401));
//     }

//     console.log(`Fetching reports for user ID: ${userId} using field 'generatedBy'`); // Add log

//     // *** FIX: Query using the correct field name 'generatedBy' ***
//     const reports = await Report.find({ generatedBy: userId })
//         .populate('project', 'projectName status') // Populate project name and maybe status
//         .sort({ createdAt: -1 }); // Or sort by 'generatedAt' if you have that field

//     console.log(`Found ${reports.length} reports for user ${userId}`); // Log results
//        // *** ADD THIS LINE FOR DEBUGGING ***
//     console.log('--- Reports Data Being Sent to Frontend ---');
//     console.log(JSON.stringify(reports, null, 2)); // Log the actual reports array
//     console.log('------------------------------------------');
//     // Return in the expected format
//     res.status(200).json({
//         success: true,
//         count: reports.length,
//         data: { reports: reports } // Match the structure expected by frontend
//     });
// });

// server/controllers/reportController.js

// const mongoose = require('mongoose');
// const Report = require('../models/Report');
// const Project = require('../models/Project');
// const Task = require('../models/Task');
// // const Material = require('../models/Material'); // Keep if needed
// // const Schedule = require('../models/Schedule'); // Keep if needed
// const User = require('../models/User');
// const catchAsync = require('../utils/CatchAsync');
// const AppError = require('../utils/AppError');
// const { createAndEmitNotification } = require('../utils/notificationHelper');

// // --- Constants for Validation ---
// const TYPES_REQUIRING_DATES = ["progress", "monthly_progress", "weekly_progress", "daily_log", "schedule_adherence"];
// const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

// // @desc     Create a new report
// // @route    POST /api/reports
// // @access   Private (Contractor, Consultant, Project Manager, Admin)
// exports.createReport = catchAsync(async (req, res, next) => {
//     // Destructure expected fields from req.body
//     const {
//         title,
//         type,
//         project: projectId, // ID of the project
//         periodStartDate: periodStartDateStr, // Keep as string initially for validation
//         periodEndDate: periodEndDateStr,     // Keep as string initially for validation
//         summary,
//         issuesAndRisks, // Array of issues { description, severity }
//         attachments    // Array of attachments { fileName, url }
//     } = req.body;

//     console.log("Received req.body for report creation:", req.body);

//     // 1. Basic Input Validation
//     if (!title || !type || !projectId || !summary) {
//         return next(new AppError('Missing required fields: title, type, project, summary', 400));
//     }

//     // 2. Authentication Check
//     if (!req.user || !req.user.id) { // Use .id or ._id consistently
//         console.error('Error in createReport: req.user missing.');
//         return next(new AppError('Authentication error: User information missing.', 500));
//     }
//     const submitterId = req.user.id; // Or req.user._id

//     // 3. Fetch Project Details (INCLUDING DATES for validation)
//     const project = await Project.findById(projectId).select('_id projectName startDate endDate projectManager'); // Fetch necessary fields
//     if (!project) {
//         return next(new AppError(`Project not found with id ${projectId}`, 404));
//     }
//     // Check if the project itself has the required dates for validation
//     if (!project.startDate || !project.endDate) {
//          console.error(`Project ${projectId} (${project.projectName}) is missing start or end date. Cannot validate report period.`);
//          return next(new AppError(`Selected project (${project.projectName}) is missing start/end dates. Cannot validate report period.`, 400));
//     }
//     // Prepare project dates for comparison (zero out time)
//     const projectStartDate = new Date(project.startDate);
//     const projectEndDate = new Date(project.endDate);
//     projectStartDate.setHours(0, 0, 0, 0);
//     projectEndDate.setHours(0, 0, 0, 0);

//     // 4. *** DATE VALIDATION LOGIC ***
//     let reportStartDate = null;
//     let reportEndDate = null;

//     if (TYPES_REQUIRING_DATES.includes(type)) {
//         // a) Check if dates are provided
//         if (!periodStartDateStr || !periodEndDateStr) {
//              return next(new AppError(`Period Start and End dates are required for report type '${type}'.`, 400));
//         }
//         // b) Validate and convert date strings
//         reportStartDate = new Date(periodStartDateStr);
//         reportEndDate = new Date(periodEndDateStr);
//         if (isNaN(reportStartDate.getTime()) || isNaN(reportEndDate.getTime())) {
//             return next(new AppError('Invalid date format for period start or end date.', 400));
//         }
//         // Zero out time for comparison
//         reportStartDate.setHours(0, 0, 0, 0);
//         reportEndDate.setHours(0, 0, 0, 0);

//         // c) Check End >= Start
//         if (reportEndDate < reportStartDate) {
//             return next(new AppError('Period end date cannot be before the start date.', 400));
//         }

//         // d) Check within Project Timeframe
//         if (reportStartDate < projectStartDate || reportStartDate > projectEndDate ||
//             reportEndDate < projectStartDate || reportEndDate > projectEndDate) {
//             const projStartStr = projectStartDate.toLocaleDateString();
//             const projEndStr = projectEndDate.toLocaleDateString();
//             return next(new AppError(`Report dates must be within the project timeframe (${projStartStr} - ${projEndStr}).`, 400));
//         }

//         // e) Check Day Span
//         const diffTime = Math.abs(reportEndDate - reportStartDate);
//         const diffDays = Math.ceil(diffTime / MILLISECONDS_PER_DAY) + 1; // Inclusive days

//         console.log(`[Create Report] Date Span Check for ${type}: ${diffDays} days`);

//         if (type === 'monthly_progress') {
//             if (diffDays < 20 || diffDays > 40) {
//                 return next(new AppError(`Monthly reports must cover 20-40 days. Provided span: ${diffDays} days.`, 400));
//             }
//         } else if (type === 'weekly_progress') {
//             if (diffDays < 5 || diffDays > 10) {
//                  return next(new AppError(`Weekly reports must cover 5-10 days. Provided span: ${diffDays} days.`, 400));
//             }
//         }
//     }
//     // --- END DATE VALIDATION ---

//     // 5. *** Generate Key Metrics (Adjusted Example) ***
//     // This part is highly dependent on your specific needs.
//     // Recalculate metrics *based on the validated report period* if applicable.
//     let keyMetrics = {};
//     if ((type === 'progress' || type === 'monthly_progress' || type === 'weekly_progress') && reportStartDate && reportEndDate) {
//         // Example: Find tasks *completed* within the report period
//         const completedTasksInPeriod = await Task.countDocuments({
//              project: projectId,
//              status: 'completed',
//              // Assuming 'completedAt' field exists on Task model
//              completedAt: { $gte: reportStartDate, $lte: reportEndDate }
//          });
//         // Example: Find tasks *active* (in progress) during the period
//         const activeTasksInPeriod = await Task.countDocuments({
//             project: projectId,
//             status: 'in_progress',
//             // This logic is complex: tasks started before/during AND not finished before start
//              $or: [
//                  { startDate: { $lte: reportEndDate }, endDate: { $gte: reportStartDate } }, // Overlaps period
//                  { startDate: { $lte: reportEndDate }, status: 'in_progress' } // Started before/during, still active
//              ]
//         });
//          // Example: Overall project progress *up to the end date* of the report
//          const allProjectTasksCount = await Task.countDocuments({ project: projectId, createdAt: { $lte: reportEndDate }});
//          const completedProjectTasksCount = await Task.countDocuments({ project: projectId, status: 'completed', completedAt: { $lte: reportEndDate }});
//          const overallProgressPercentage = allProjectTasksCount > 0 ? Math.round((completedProjectTasksCount / allProjectTasksCount) * 100) : 0;

//         keyMetrics = {
//             tasksCompleted: completedTasksInPeriod, // Tasks completed *in this period*
//             // tasksInProgress: activeTasksInPeriod, // Potentially tasks active during period
//             // tasksPending: ... , // Need definition
//             overallProgressPercentage: overallProgressPercentage, // Project % complete *at end date*
//         };
//          console.log(`[Create Report] Calculated metrics for ${type} report:`, keyMetrics);
//     }
//     // Add logic for other types like 'financial', 'material_usage' if they need calculated metrics


//     // 6. Prepare Final Report Data for DB Insertion
//     const reportData = {
//         title,
//         type,
//         project: projectId,
//         generatedBy: submitterId,
//         summary, // Use the summary provided
//         keyMetrics, // Use the calculated metrics
//         issuesAndRisks: issuesAndRisks || [], // Ensure array
//         attachments: attachments || [],     // Ensure array
//         // Conditionally add validated dates
//         ...(reportStartDate && reportEndDate && { periodStartDate: reportStartDate, periodEndDate: reportEndDate }),
//         // Default status ('submitted') comes from the schema
//     };

//     console.log("Final reportData object before creation:", reportData);

//     // 7. Create the Report Document in DB
//     const report = await Report.create(reportData);

    // 8. Notification Logic (Keep as is)
    // const io = req.app.get('socketio');
    // if (io) {
    //     let recipientIds = [];
    //     if (project.projectManager && project.projectManager.toString() !== submitterId.toString()) {
    //         recipientIds.push(project.projectManager.toString());
    //     }
    //     const admins = await User.find({ role: 'admin', _id: { $ne: submitterId } }).select('_id');
    //     admins.forEach(admin => recipientIds.push(admin._id.toString()));

    //     const uniqueRecipientIds = [...new Set(recipientIds)];
    //     uniqueRecipientIds.forEach(userId => {
    //         createAndEmitNotification(io, userId, { /* ... notification payload ... */
    //             senderUser: submitterId, type: 'REPORT_SUBMITTED',
    //             message: `New report '${report.title}' submitted for project '${project.projectName}'`,
    //             link: `/reports/${report._id}`, projectId: report.project, reportId: report._id
    //         });
    //     });
    // } else {
    //     console.warn('[Create Report] Socket.IO instance not found. Notifications not sent.');
    // }

//     // 9. Send Success Response
//     res.status(201).json({
//         success: true,
//         data: report
//     });
// });

// // @desc     Get reports (filtered and paginated)
// // @route    GET /api/reports
// // @access   Private (All authenticated users, permissions checked)
// exports.getReports = catchAsync(async (req, res, next) => {
//     const { projectId, type, userId, status, startDate, endDate, page = 1, limit = 10, sortBy = '-createdAt' } = req.query; // Added status filter, default sort by createdAt

//     let queryFilter = {};
//     const userRole = req.user.role;
//     const currentUserId = req.user.id; // Use .id or ._id

//     // --- Authorization Filter: Non-admins/committee see only their projects ---
//     if (userRole !== 'admin' && userRole !== 'committee') {
//         // Find projects user is associated with (Contractor, Consultant, PM)
//         const userProjects = await Project.find({
//             $or: [
//                 { contractor: currentUserId },
//                 { consultant: currentUserId },
//                 { projectManager: currentUserId }
//             ]
//         }).select('_id'); // Only need the IDs

//         const projectIds = userProjects.map(p => p._id);

//         // If user is assigned to NO projects, they can see NO reports (unless admin/committee)
//         if (projectIds.length === 0) {
//             console.log(`User ${currentUserId} is not assigned to any projects. Returning empty report list.`);
//              return res.status(200).json({
//                 success: true, count: 0, total: 0, pagination: { page: 1, limit: limitNum, totalPages: 0 }, data: []
//             });
//         }
//         queryFilter.project = { $in: projectIds }; // Filter reports by these project IDs
//     }

//     // --- Apply Request Filters ---
//     if (projectId) {
//         // If a specific project is requested, ensure non-admin/committee user has access to *that* project
//         if (userRole !== 'admin' && userRole !== 'committee') {
//              const hasAccess = await Project.exists({
//                  _id: projectId,
//                  // Check if user is associated with THIS specific project
//                  $or: [
//                      { contractor: currentUserId }, { consultant: currentUserId }, { projectManager: currentUserId }
//                  ]
//              });
//              if (!hasAccess) {
//                  return next(new AppError(`Forbidden: You do not have access to reports for project ${projectId}.`, 403));
//             }
//         }
//         // If user has access (or is admin/committee), filter by this project ID
//         queryFilter.project = projectId;
//     }
//     if (type) queryFilter.type = type;
//     if (userId) queryFilter.generatedBy = userId; // Filter by creator
//     if (status) queryFilter.status = status;     // Filter by report status
//     // Date Filtering (using createdAt or generatedAt - choose one consistently)
//     if (startDate && endDate) {
//         queryFilter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) }; // Use createdAt
//     } else if (startDate) {
//         queryFilter.createdAt = { $gte: new Date(startDate) };
//     } else if (endDate) {
//         queryFilter.createdAt = { $lte: new Date(endDate) };
//     }

//     // --- Execute Query with Pagination ---
//     const pageNum = parseInt(page, 10) || 1;
//     const limitNum = parseInt(limit, 10) || 10;
//     const skip = (pageNum - 1) * limitNum;

//     console.log("[Get Reports] Query Filter:", queryFilter); // Log the final filter

//     const totalReports = await Report.countDocuments(queryFilter);
//     const reports = await Report.find(queryFilter)
//         .populate('generatedBy', 'firstName lastName role _id') // Populate user info needed for display
//         .populate('project', 'projectName _id') // Populate project name needed for display
//         .sort(sortBy) // Apply sorting
//         .skip(skip)
//         .limit(limitNum);

//     res.status(200).json({
//         success: true,
//         count: reports.length,
//         total: totalReports,
//         pagination: {
//             page: pageNum,
//             limit: limitNum,
//             totalPages: Math.ceil(totalReports / limitNum)
//         },
//         data: reports
//     });
// });


// // @desc     Get single report by ID
// // @route    GET /api/reports/:id
// // @access   Private (Check permissions)
// exports.getReportById = catchAsync(async (req, res, next) => {
//     const reportId = req.params.id;
//     const requestingUser = req.user;

//     if (!mongoose.Types.ObjectId.isValid(reportId)) {
//         return next(new AppError(`Invalid report ID format: ${reportId}`, 400));
//     }
//     if (!requestingUser || !requestingUser.id) {
//        return next(new AppError('Authentication required.', 401));
//     }
//     const currentUserIdString = requestingUser.id.toString();
//     const userRole = requestingUser.role;
//     console.log(`[getReportById] Fetching report ${reportId} for user ${currentUserIdString} (Role: ${userRole})`);

//     // Fetch and Populate Report - Ensure ALL necessary fields are populated
//     const report = await Report.findById(reportId)
//       .populate('generatedBy', '_id firstName lastName email role') // User details
//       .populate('project', '_id projectName contractor consultant projectManager startDate endDate'); // Project details incl. roles and DATES

//     if (!report) {
//         return next(new AppError(`Report not found with id ${reportId}`, 404));
//     }
//     // Log populated report for debugging
//     // console.log(`[getReportById] Found report ${reportId}:`, JSON.stringify(report, null, 2));

//     // --- Authorization Check ---
//     const isAdminOrCommittee = userRole && (userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'committee');

//     // Check creator
//     const reportOwnerIdString = report.generatedBy?._id?.toString();
//     if (!reportOwnerIdString) {
//         console.error(`[getReportById] Report ${reportId} missing valid 'generatedBy' reference.`);
//         return next(new AppError('Report data integrity issue (missing owner). Access denied.', 500));
//     }
//     const isCreator = reportOwnerIdString === currentUserIdString;

//     // Check project assignment
//     let isAssignedToProject = false;
//     if (report.project && typeof report.project === 'object') {
//         const contractorId = report.project.contractor?.toString();
//         const consultantId = report.project.consultant?.toString();
//         const projectManagerId = report.project.projectManager?.toString();
//         isAssignedToProject =
//             (contractorId === currentUserIdString) ||
//             (consultantId === currentUserIdString) ||
//             (projectManagerId === currentUserIdString);
//     } else {
//          console.warn(`[getReportById] Report ${reportId} project field not populated or missing.`);
//     }

//     console.log(`[getReportById] Auth check: isAdminOrCommittee=${isAdminOrCommittee}, isCreator=${isCreator}, isAssignedToProject=${isAssignedToProject}`);

//     // --- Final Decision ---
//     if (isAdminOrCommittee || isCreator || isAssignedToProject) {
//         console.log(`[getReportById] Access GRANTED for report ${reportId} to user ${currentUserIdString}.`);
//         res.status(200).json({
//           success: true,
//           data: report,
//         });
//     } else {
//        console.warn(`[getReportById] Access DENIED for report ${reportId} to user ${currentUserIdString}.`);
//        return next(new AppError('Forbidden: You do not have permission to view this specific report.', 403));
//     }
// });


// // @desc     Update a report (Admin Only for status/feedback, Creator for drafts?)
// // @route    PUT /api/reports/:id
// // @access   Private (Admin/Creator - based on field) - NEEDS REFINEMENT
// exports.updateReport = catchAsync(async (req, res, next) => {
//     // TODO: Refine authorization. Admins should update status/feedback.
//     // Creators might be allowed to update 'draft' reports?
//     const reportId = req.params.id;
//     const updatePayload = req.body;
//     const requestingUser = req.user;

//     if (!requestingUser || !requestingUser.id) {
//         return next(new AppError('Authentication error.', 500));
//     }

//     const report = await Report.findById(reportId);
//     if (!report) {
//         return next(new AppError(`Report not found with id ${reportId}`, 404));
//     }

//     const isAdmin = requestingUser.role === 'admin';
//     const isCreator = report.generatedBy?.toString() === requestingUser.id.toString();

//     let allowedUpdates = {};
//     let notificationType = 'REPORT_UPDATED'; // Default notification
//     let notificationMessage = `Report '${report.title}' has been updated.`;

//     // Define fields allowed for each role
//     const adminOnlyFields = ['status', 'feedback'];
//     const creatorDraftFields = ['title', 'type', 'summary', 'periodStartDate', 'periodEndDate', 'issuesAndRisks', 'attachments']; // Fields creator can edit in draft

//     for (const field in updatePayload) {
//         if (adminOnlyFields.includes(field)) {
//             if (!isAdmin) {
//                 return next(new AppError(`Forbidden: Only admins can update field '${field}'.`, 403));
//             }
//             allowedUpdates[field] = updatePayload[field];
//              // Specific notifications for status changes by admin
//             if (field === 'status') {
//                  if (updatePayload.status === 'approved') {
//                     notificationType = 'REPORT_APPROVED';
//                     notificationMessage = `Your report '${report.title}' has been approved.`;
//                  } else if (updatePayload.status === 'rejected') {
//                      notificationType = 'REPORT_REJECTED'; // Add specific type if needed
//                      notificationMessage = `Your report '${report.title}' requires changes (see feedback).`;
//                  } else {
//                      notificationMessage = `The status of your report '${report.title}' was updated to '${updatePayload.status}'.`;
//                  }
//             }

//         } else if (creatorDraftFields.includes(field)) {
//             if (!isCreator || report.status !== 'draft') { // Only creator can edit these, and only if status is 'draft'
//                  return next(new AppError(`Forbidden: Field '${field}' can only be updated by the creator on draft reports.`, 403));
//             }
//              // TODO: Add date validation here similar to createReport if dates are updated!
//              allowedUpdates[field] = updatePayload[field];
//              notificationMessage = `Your draft report '${report.title}' has been updated.`; // Notify creator about own update? Maybe not needed.
//         }
//         // Ignore fields not in either list
//     }

//     if (Object.keys(allowedUpdates).length === 0) {
//         return next(new AppError('Bad Request: No valid or permitted fields provided for update.', 400));
//     }

//     // Perform the update
//     const updatedReport = await Report.findByIdAndUpdate(
//         reportId,
//         allowedUpdates,
//         { new: true, runValidators: true }
//     )
//     .populate('generatedBy', 'firstName lastName email role _id') // Populate for notification check
//     .populate('project', 'projectName projectManager _id'); // Populate for notification check

//     // --- Notification Logic ---
//     const io = req.app.get('socketio');
//     if (io && updatedReport) {
//         const submitterId = updatedReport.generatedBy?._id?.toString();
//         const updaterId = requestingUser.id.toString();

//         // Notify the submitter IF they are not the one making the update
//         if (submitterId && submitterId !== updaterId) {
//             createAndEmitNotification(io, submitterId, {
//                  senderUser: updaterId,
//                  type: notificationType,
//                  message: notificationMessage, // Use the specific message generated above
//                  link: `/reports/${updatedReport._id}`,
//                  projectId: updatedReport.project?._id,
//                  reportId: updatedReport._id
//              });
//         }

//         // Optional: Notify PM if admin updated status/feedback (and PM != submitter and PM != updater)
//         const projectManagerId = updatedReport.project?.projectManager?.toString();
//          if (isAdmin && projectManagerId && projectManagerId !== updaterId && projectManagerId !== submitterId) {
//              createAndEmitNotification(io, projectManagerId, {
//                  senderUser: updaterId,
//                  type: notificationType, // Use same type (APPROVED, REJECTED, UPDATED)
//                  message: `Report '${updatedReport.title}' for project '${updatedReport.project?.projectName || 'N/A'}' was updated (Status: ${updatedReport.status}) by admin.`,
//                  link: `/reports/${updatedReport._id}`,
//                  projectId: updatedReport.project?._id,
//                  reportId: updatedReport._id
//              });
//          }
//     } else if(io) {
//         console.warn('[Update Report] Socket.IO found but report data missing for notification.');
//     }

//     res.status(200).json({
//         success: true,
//         message: 'Report updated successfully.',
//         data: updatedReport
//     });
// });


// // @desc     Delete a report
// // @route    DELETE /api/reports/:id
// // @access   Private (Admin or Creator only)
// exports.deleteReport = catchAsync(async (req, res, next) => {
//     const reportId = req.params.id;
//     const requestingUser = req.user;

//     const report = await Report.findById(reportId);
//     if (!report) {
//         return next(new AppError(`Report not found with id ${reportId}`, 404));
//     }

//     // Authorization check
//     const isAdmin = requestingUser.role === 'admin';
//     const isCreator = report.generatedBy?.toString() === requestingUser.id?.toString();

//     if (!isAdmin && !isCreator) {
//        return next(new AppError('Forbidden: You are not authorized to delete this report.', 403));
//     }

//     // TODO: Consider related data cleanup? (e.g., delete associated files from storage)

//     await Report.deleteOne({ _id: reportId });

//     console.log(`Report ${reportId} deleted by user ${requestingUser.id} (Role: ${requestingUser.role})`);

//     res.status(200).json({
//         success: true,
//         message: 'Report deleted successfully',
//         data: { deletedId: reportId }
//     });
// });


// // @desc     Get reports generated by the currently logged-in user
// // @route    GET /api/reports/my-reports
// // @access   Private
// exports.getMyReports = catchAsync(async (req, res, next) => {
//     const userId = req.user.id || req.user._id;
//     if (!userId) {
//         return next(new AppError('Authentication required.', 401));
//     }

//     console.log(`[getMyReports] Fetching reports for user: ${userId}`);

//     const reports = await Report.find({ generatedBy: userId })
//         .populate('project', '_id projectName status startDate endDate') // Populate fields needed for list display
//         .sort({ createdAt: -1 }); // Sort by creation date descending

//     console.log(`[getMyReports] Found ${reports.length} reports for user ${userId}`);

//     res.status(200).json({
//         success: true,
//         count: reports.length,
//         // Ensure consistent data structure for frontend
//         data: { reports: reports }
//     });
// });

// server/controllers/reportController.js

const mongoose = require('mongoose');
const Report = require('../models/Report');
const Project = require('../models/Project');
const Task = require('../models/Task');
// const Material = require('../models/Material'); // Keep if needed for other report types
// const Schedule = require('../models/Schedule'); // Keep if needed for other report types
const User = require('../models/User');
const catchAsync = require('../utils/CatchAsync');
const AppError = require('../utils/AppError');
const { createAndEmitNotification } = require('../utils/notificationHelper');
const path = require('path'); // ** Added path module **
const fs = require('fs').promises; // ** Added promise-based fs for potential future deletion **

// --- Constants for Validation ---
const TYPES_REQUIRING_DATES = ["progress", "monthly_progress", "weekly_progress", "daily_log", "schedule_adherence"];
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

// @desc     Create a new report with local file uploads
// @route    POST /api/reports
// @access   Private (Contractor, Consultant, Project Manager, Admin)
// exports.createReport = catchAsync(async (req, res, next) => {
//     const {
//         title, type, project: projectId, periodStartDate, periodEndDate, summary, issuesAndRisks
//     } = req.body;

//     // 1. Basic Validation & Auth Check
//     if (!title || !type || !projectId || !summary) {
//         return next(new AppError('Missing required fields: title, type, project, summary', 400));
//     }
//     if (!req.user || !req.user.id) {
//         return next(new AppError('Authentication error: User information missing.', 500));
//     }
//     const submitterId = req.user.id;

//     // 2. Fetch Project & Validate
//     // Fetch required fields including dates if needed for validation elsewhere
//     const project = await Project.findById(projectId).select('_id projectName startDate endDate projectManager');
//     if (!project) {
//         return next(new AppError(`Project not found with id ${projectId}`, 404));
//     }
//     // Add DATE VALIDATION logic here if needed (comparing report period to project dates)
//     // ... (refer to previous examples if you need this validation)

//     // 3. Handle File Uploads (Local Storage Logic)
//     let reportAttachments = [];
//     if (req.files && req.files.length > 0) {
//         console.log(`[Create Report] Processing ${req.files.length} locally saved file(s).`);
//         reportAttachments = req.files.map(file => {
//             // Construct the URL path based on express.static configuration
//             // Assumes files are in server/public/uploads/reports and 'public' is served at root '/'
//             const urlPath = `/uploads/reports/${file.filename}`;

//             console.log(`[Create Report] File processed: ${file.originalname}, Saved as: ${file.filename}, URL Path: ${urlPath}`);
//             return {
//                 fileName: file.originalname, // Store original filename for user display
//                 url: urlPath // Store the URL path to access the file
//             };
//         });
//     } else {
//         console.log('[Create Report] No files attached to the request.');
//     }

//     // 4. Generate Key Metrics (Placeholder - Add your specific logic)
//     let keyMetrics = {};
//     if ((type === 'progress' || type === 'monthly_progress' || type === 'weekly_progress') /*&& reportStartDate && reportEndDate*/) {
//          // Fetch relevant tasks within the period and calculate metrics
//          // const tasks = await Task.find({ project: projectId, /* date filters */ });
//          // keyMetrics = { tasksCompleted: ..., overallProgressPercentage: ... };
//          console.log(`[Create Report] Placeholder for key metrics calculation for type: ${type}`);
//     }

//     // 5. Create the Report Document
//     const reportData = {
//         title,
//         type,
//         project: projectId,
//         generatedBy: submitterId,
//         periodStartDate, // Ensure these are validated if required by type
//         periodEndDate,   // Ensure these are validated if required by type
//         summary,
//         keyMetrics,
//         issuesAndRisks: issuesAndRisks || [],
//         attachments: reportAttachments // Add the processed attachments array
//         // status will default based on schema ('submitted')
//     };

//     console.log("Final reportData object before creation:", reportData);

//     const report = await Report.create(reportData);

//     // 6. Notification Logic (Keep existing if implemented)
    
//     const io = req.app.get('socketio');
//     if (io) {
//         let recipientIds = [];
//         if (project.projectManager && project.projectManager.toString() !== submitterId.toString()) {
//             recipientIds.push(project.projectManager.toString());
//         }
//         const admins = await User.find({ role: 'admin', _id: { $ne: submitterId } }).select('_id');
//         admins.forEach(admin => recipientIds.push(admin._id.toString()));

//         const uniqueRecipientIds = [...new Set(recipientIds)];
//         uniqueRecipientIds.forEach(userId => {
//             createAndEmitNotification(io, userId, { /* ... notification payload ... */
//                 senderUser: submitterId, type: 'REPORT_SUBMITTED',
//                 message: `New report '${report.title}' submitted for project '${project.projectName}'`,
//                 link: `/reports/${report._id}`, projectId: report.project, reportId: report._id
//             });
//         });
//     } else {
//         console.warn('[Create Report] Socket.IO instance not found. Notifications not sent.');
//     }

//     // 7. Send Success Response
//     res.status(201).json({
//         success: true,
//         data: report
//     });
// });
exports.createReport = catchAsync(async (req, res, next) => {
    const {
      title,
      type,
      project: projectId,
      periodStartDate,
      periodEndDate,
      summary
    } = req.body;
  
    // Validate required fields
    if (!title || !type || !projectId || !summary) {
      return next(new AppError('Missing required fields: title, type, project, summary', 400));
    }
    if (!req.user || !req.user.id) {
      return next(new AppError('Authentication error: User information missing.', 500));
    }
    const submitterId = req.user.id;
  
    // Fetch and validate the project
    const project = await Project.findById(projectId).select('_id projectName startDate endDate projectManager');
    if (!project) {
      return next(new AppError(`Project not found with id ${projectId}`, 404));
    }
    // (Optional: add date validation logic here)
  
    // Process file uploads (if any)
    let reportAttachments = [];
    if (req.files && req.files.length > 0) {
      console.log(`[Create Report] Processing ${req.files.length} locally saved file(s).`);
      reportAttachments = req.files.map(file => {
        const urlPath = `/uploads/reports/${file.filename}`;
        console.log(`[Create Report] File processed: ${file.originalname}, Saved as: ${file.filename}, URL Path: ${urlPath}`);
        return {
          fileName: file.originalname,
          url: urlPath
        };
      });
    } else {
      console.log('[Create Report] No files attached to the request.');
    }
  
    // IMPORTANT: Handle issuesAndRisks
    let { issuesAndRisks } = req.body;
    // If issuesAndRisks is a string (as when sent via FormData), try to parse it.
    if (typeof issuesAndRisks === 'string') {
      try {
        issuesAndRisks = JSON.parse(issuesAndRisks);
      } catch (err) {
        console.error('Error parsing issuesAndRisks:', err);
        issuesAndRisks = [];
      }
    }
  
    // Placeholder: Generate key metrics if applicable
    let keyMetrics = {};
    if (['progress', 'monthly_progress', 'weekly_progress'].includes(type)) {
      console.log(`[Create Report] Placeholder for key metrics calculation for type: ${type}`);
    }
  
    // Build report data object
    const reportData = {
      title,
      type,
      project: projectId,
      generatedBy: submitterId,
      periodStartDate,
      periodEndDate,
      summary,
      keyMetrics,
      issuesAndRisks: issuesAndRisks || [],
      attachments: reportAttachments
    };
  
    console.log("Final reportData object before creation:", reportData);
  
    const report = await Report.create(reportData);
  
    // (Optional) Notification logic...
    const io = req.app.get('socketio');
    if (io) {
      let recipientIds = [];
      if (project.projectManager && project.projectManager.toString() !== submitterId.toString()) {
        recipientIds.push(project.projectManager.toString());
      }
      const admins = await User.find({ role: 'admin', _id: { $ne: submitterId } }).select('_id');
      admins.forEach(admin => recipientIds.push(admin._id.toString()));
  
      const uniqueRecipientIds = [...new Set(recipientIds)];
      uniqueRecipientIds.forEach(userId => {
        createAndEmitNotification(io, userId, {
          senderUser: submitterId,
          type: 'REPORT_SUBMITTED',
          message: `New report '${report.title}' submitted for project '${project.projectName}'`,
          link: `/reports/${report._id}`,
          projectId: report.project,
          reportId: report._id
        });
      });
    } else {
      console.warn('[Create Report] Socket.IO instance not found. Notifications not sent.');
    }
  
    res.status(201).json({
      success: true,
      data: report
    });
  });
  

// @desc     Get reports (filtered and paginated)
// @route    GET /api/reports
// @access   Private (All authenticated users, permissions checked)
exports.getReports = catchAsync(async (req, res, next) => {
    const { projectId, type, userId, status, startDate, endDate, page = 1, limit = 10, sortBy = '-createdAt' } = req.query; // Added status filter, default sort by createdAt

    let queryFilter = {};
    const userRole = req.user.role;
    const currentUserId = req.user.id; // Use .id or ._id

    // --- Authorization Filter: Non-admins/committee see only their projects ---
    if (userRole !== 'admin' && userRole !== 'committee') {
        // Find projects user is associated with (Contractor, Consultant, PM)
        const userProjects = await Project.find({
            $or: [
                { contractor: currentUserId },
                { consultant: currentUserId },
                { projectManager: currentUserId }
            ]
        }).select('_id'); // Only need the IDs

        const projectIds = userProjects.map(p => p._id);

        if (projectIds.length === 0) {
             console.log(`User ${currentUserId} is not assigned to any projects. Returning empty report list.`);
             const pageNum = parseInt(page, 10) || 1; // Need these for pagination structure
             const limitNum = parseInt(limit, 10) || 10;
             return res.status(200).json({
                success: true, count: 0, total: 0, pagination: { page: pageNum, limit: limitNum, totalPages: 0 }, data: []
            });
        }
        queryFilter.project = { $in: projectIds }; // Filter reports by these project IDs
    }

    // --- Apply Request Filters ---
    if (projectId) {
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return next(new AppError(`Invalid project ID format in query: ${projectId}`, 400));
        }
        if (userRole !== 'admin' && userRole !== 'committee') {
             const hasAccess = await Project.exists({
                 _id: projectId,
                 $or: [ { contractor: currentUserId }, { consultant: currentUserId }, { projectManager: currentUserId } ]
             });
             if (!hasAccess) {
                 return next(new AppError(`Forbidden: You do not have access to reports for project ${projectId}.`, 403));
            }
        }
        queryFilter.project = projectId;
    }
    if (type) queryFilter.type = type;
    if (userId) queryFilter.generatedBy = userId; // Filter by creator
    if (status) queryFilter.status = status;     // Filter by report status
    // Date Filtering (using createdAt)
    if (startDate && endDate) {
        queryFilter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (startDate) {
        queryFilter.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
        queryFilter.createdAt = { $lte: new Date(endDate) };
    }

    // --- Execute Query with Pagination ---
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    console.log("[Get Reports] Query Filter:", queryFilter); // Log the final filter

    const totalReports = await Report.countDocuments(queryFilter);
    const reports = await Report.find(queryFilter)
        .populate('generatedBy', 'firstName lastName role _id') // Populate user info
        .populate('project', 'projectName _id') // Populate project name
        .sort(sortBy)
        .skip(skip)
        .limit(limitNum)
        .lean(); // Use lean for read-only queries

    res.status(200).json({
        success: true,
        count: reports.length,
        total: totalReports,
        pagination: {
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(totalReports / limitNum)
        },
        data: reports
    });
});


// @desc     Get single report by ID
// @route    GET /api/reports/:id
// @access   Private (Check permissions)
exports.getReportById = catchAsync(async (req, res, next) => {
    const reportId = req.params.id;
    const requestingUser = req.user;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
        return next(new AppError(`Invalid report ID format: ${reportId}`, 400));
    }
    if (!requestingUser || !requestingUser.id) {
       return next(new AppError('Authentication required.', 401));
    }
    const currentUserIdString = requestingUser.id.toString();
    const userRole = requestingUser.role;
    console.log(`[getReportById] Fetching report ${reportId} for user ${currentUserIdString} (Role: ${userRole})`);

    // Fetch and Populate Report
    const report = await Report.findById(reportId)
      .populate('generatedBy', '_id firstName lastName email role') // User details
      .populate('project', '_id projectName contractor consultant projectManager startDate endDate') // Project details
      .lean(); // Use lean

    if (!report) {
        return next(new AppError(`Report not found with id ${reportId}`, 404));
    }

    // --- Authorization Check ---
    const isAdminOrCommittee = userRole && (userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'committee');
    const reportOwnerIdString = report.generatedBy?._id?.toString();
    if (!reportOwnerIdString) {
        console.error(`[getReportById] Report ${reportId} missing valid 'generatedBy' reference.`);
        return next(new AppError('Report data integrity issue (missing owner). Access denied.', 500));
    }
    const isCreator = reportOwnerIdString === currentUserIdString;

    // Check project assignment
    let isAssignedToProject = false;
    if (report.project && typeof report.project === 'object') { // Ensure project is populated
        const contractorId = report.project.contractor?.toString();
        const consultantId = report.project.consultant?.toString();
        const projectManagerId = report.project.projectManager?.toString();
        isAssignedToProject =
            (contractorId === currentUserIdString) ||
            (consultantId === currentUserIdString) ||
            (projectManagerId === currentUserIdString);
    }

    console.log(`[getReportById] Auth check: isAdminOrCommittee=${isAdminOrCommittee}, isCreator=${isCreator}, isAssignedToProject=${isAssignedToProject}`);

    // --- Final Decision ---
    if (isAdminOrCommittee || isCreator || isAssignedToProject) {
        console.log(`[getReportById] Access GRANTED for report ${reportId} to user ${currentUserIdString}.`);
        res.status(200).json({
          success: true,
          data: report,
        });
    } else {
       console.warn(`[getReportById] Access DENIED for report ${reportId} to user ${currentUserIdString}.`);
       return next(new AppError('Forbidden: You do not have permission to view this specific report.', 403));
    }
});


// @desc     Update a report (Admin for status/feedback, Creator for drafts?)
// @route    PUT /api/reports/:id  (Note: PUT implies replacing the entire resource, PATCH for partial updates)
// @access   Private (Admin/Creator - based on field)
exports.updateReport = catchAsync(async (req, res, next) => {
    const reportId = req.params.id;
    const updatePayload = req.body;
    const requestingUser = req.user;

    if (!requestingUser || !requestingUser.id) {
        return next(new AppError('Authentication error.', 500));
    }
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
        return next(new AppError(`Invalid report ID format: ${reportId}`, 400));
    }

    // --- Fetch the existing report ---
    // Don't use .lean() here because we might use .save() later if needed,
    // although findByIdAndUpdate is often used for simplicity.
    const report = await Report.findById(reportId);
    if (!report) {
        return next(new AppError(`Report not found with id ${reportId}`, 404));
    }

    const isAdmin = requestingUser.role === 'admin';
    // Ensure generatedBy is populated or compared correctly
    const isCreator = report.generatedBy?.toString() === requestingUser.id.toString();

    let allowedUpdates = {};
    let notificationType = 'REPORT_UPDATED';
    let notificationMessage = `Report '${report.title}' has been updated.`;

    const adminOnlyFields = ['status', 'feedback'];
    const creatorDraftFields = ['title', 'type', 'summary', 'periodStartDate', 'periodEndDate', 'issuesAndRisks', 'attachments']; // Attachments update needs more logic

    // ** File handling for updates is NOT included here - would require separate logic **
    if (updatePayload.attachments) {
         console.warn("Updating attachments directly via this route is not supported. Use a dedicated upload/delete mechanism.");
         // Optionally return an error or ignore the field
         // return next(new AppError("Updating attachments requires a separate process.", 400));
    }

    for (const field in updatePayload) {
        // Skip attachments field in this basic update
        if (field === 'attachments') continue;

        if (adminOnlyFields.includes(field)) {
            if (!isAdmin) {
                return next(new AppError(`Forbidden: Only admins can update field '${field}'.`, 403));
            }
            allowedUpdates[field] = updatePayload[field];
            // Notification specifics for admin changes
            if (field === 'status') {
                 if (updatePayload.status === 'approved') { notificationType = 'REPORT_APPROVED'; notificationMessage = `Your report '${report.title}' has been approved.`; }
                 else if (updatePayload.status === 'rejected') { notificationType = 'REPORT_REJECTED'; notificationMessage = `Your report '${report.title}' requires changes (see feedback).`; }
                 else { notificationMessage = `The status of your report '${report.title}' was updated to '${updatePayload.status}'.`; }
            }
        } else if (creatorDraftFields.includes(field)) {
             // Check if the user is the creator AND the report is in 'draft' status
            if (!isCreator) {
                 return next(new AppError(`Forbidden: Only the creator can update field '${field}'.`, 403));
            }
            // Optional: Allow creator updates only if status is 'draft'
            // if (report.status !== 'draft') {
            //    return next(new AppError(`Forbidden: Report can only be updated by creator while in 'draft' status.`, 403));
            // }
            // TODO: Add date validation here if periodStartDate/EndDate are updated
            allowedUpdates[field] = updatePayload[field];
            notificationMessage = `Your report '${report.title}' has been updated.`;
        }
        // Ignore other fields not explicitly allowed
    }

    if (Object.keys(allowedUpdates).length === 0) {
        return next(new AppError('Bad Request: No valid or permitted fields provided for update.', 400));
    }

    // --- Perform the update ---
    const updatedReport = await Report.findByIdAndUpdate(
        reportId,
        allowedUpdates,
        { new: true, runValidators: true, context: 'query' } // Add context for validators if needed
    )
    .populate('generatedBy', 'firstName lastName email role _id')
    .populate('project', 'projectName projectManager _id');

    if (!updatedReport) {
         // Should not happen if findById worked, but handles race conditions
         return next(new AppError('Report update failed unexpectedly.', 500));
    }

    // --- Notification Logic ---
    const io = req.app.get('socketio');
    if (io) {
        const submitterId = updatedReport.generatedBy?._id?.toString();
        const updaterId = requestingUser.id.toString();

        // Notify submitter if they didn't make the update
        if (submitterId && submitterId !== updaterId) {
            createAndEmitNotification(io, submitterId, { /* ... notification payload ... */
                senderUser: updaterId, type: notificationType, message: notificationMessage,
                link: `/reports/${updatedReport._id}`, projectId: updatedReport.project?._id, reportId: updatedReport._id
            });
        }
        // Optional: Notify PM if admin updated (and PM != submitter/updater)
        const projectManagerId = updatedReport.project?.projectManager?.toString();
        if (isAdmin && projectManagerId && projectManagerId !== updaterId && projectManagerId !== submitterId) {
             createAndEmitNotification(io, projectManagerId, { /* ... PM notification payload ... */
                 senderUser: updaterId, type: notificationType,
                 message: `Report '${updatedReport.title}' for project '${updatedReport.project?.projectName || 'N/A'}' was updated (Status: ${updatedReport.status}) by admin.`,
                 link: `/reports/${updatedReport._id}`, projectId: updatedReport.project?._id, reportId: updatedReport._id
             });
         }
    }

    res.status(200).json({
        success: true,
        message: 'Report updated successfully.',
        data: updatedReport
    });
});


// @desc     Delete a report
// @route    DELETE /api/reports/:id
// @access   Private (Admin or Creator only)
exports.deleteReport = catchAsync(async (req, res, next) => {
    const reportId = req.params.id;
    const requestingUser = req.user;

    if (!requestingUser || !requestingUser.id) {
        return next(new AppError('Authentication error.', 401));
    }
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
        return next(new AppError(`Invalid report ID format: ${reportId}`, 400));
    }

    const report = await Report.findById(reportId);
    if (!report) {
        // Report already deleted or never existed, return success or 404
        // Returning 404 might be more accurate RESTfully
        return next(new AppError(`Report not found with id ${reportId}`, 404));
        // Or for idempotency: return res.status(200).json({ success: true, message: 'Report already deleted or not found.', data: { deletedId: reportId } });
    }

    // Authorization check
    const isAdmin = requestingUser.role === 'admin';
    const isCreator = report.generatedBy?.toString() === requestingUser.id.toString();

    if (!isAdmin && !isCreator) {
       return next(new AppError('Forbidden: You are not authorized to delete this report.', 403));
    }

    // --- Delete Associated Files (Local Storage Logic) ---
    if (report.attachments && report.attachments.length > 0) {
        console.log(`[Delete Report] Deleting ${report.attachments.length} associated file(s) for report ${report._id}`);
        const deletePromises = report.attachments.map(async (attachment) => {
            if (!attachment.url) return; // Skip if URL is missing
            try {
                // Construct the full server path from the stored URL path
                // Assumes URL path starts with '/' and maps relative to the 'public' directory
                const relativePath = attachment.url;
                // __dirname is the 'controllers' directory, so go up one level
                const fullPath = path.join(__dirname, '..', 'public', relativePath);

                console.log(`[Delete Report] Attempting to delete file at: ${fullPath}`);
                await fs.unlink(fullPath);
                console.log(`[Delete Report] Successfully deleted file: ${fullPath}`);
            } catch (err) {
                console.error(`[Delete Report] Failed to delete file ${attachment.fileName} at path ${attachment.url}:`, err.code === 'ENOENT' ? 'File not found.' : err.message);
                // Log error but continue deleting the report document
            }
        });
        // Wait for all file deletions to attempt completion
        await Promise.all(deletePromises);
    }
    // --- End File Deletion ---

    // Perform the database delete operation
    await Report.deleteOne({ _id: reportId });

    console.log(`Report ${reportId} deleted by user ${requestingUser.id} (Role: ${requestingUser.role})`);

    res.status(200).json({
        success: true,
        message: 'Report deleted successfully',
        data: { deletedId: reportId } // Return the ID of the deleted report
    });
});


// @desc     Get reports generated by the currently logged-in user
// @route    GET /api/reports/my-reports
// @access   Private
exports.getMyReports = catchAsync(async (req, res, next) => {
    const userId = req.user.id || req.user._id;
    if (!userId) {
        return next(new AppError('Authentication required.', 401));
    }

    console.log(`[getMyReports] Fetching reports for user: ${userId}`);

    const reports = await Report.find({ generatedBy: userId })
        .populate('project', '_id projectName status startDate endDate') // Populate fields needed
        .sort({ createdAt: -1 }) // Sort by creation date descending
        .lean(); // Use lean

    console.log(`[getMyReports] Found ${reports.length} reports for user ${userId}`);

    res.status(200).json({
        success: true,
        count: reports.length,
        // Ensure consistent data structure for frontend { data: { reports: [...] } }
        data: { reports: reports }
    });
});