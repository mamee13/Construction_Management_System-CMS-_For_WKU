// controllers/reportController.js
const Report = require('../models/Report');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Material = require('../models/Material'); // If needed for material reports
const Schedule = require('../models/Schedule'); // If needed for schedule reports
const catchAsync = require('../utils/CatchAsync'); // Your async error handler
// const ErrorResponse = require('../utils/ErrorResponse'); // Your custom error class

// @desc    Create a new report
// @route   POST /api/reports
// @access  Private (Contractor, Consultant, Project Manager, Admin)
exports.createReport = catchAsync(async (req, res, next) => {
    const {
        title,
        type,
        project: projectId, // ID of the project
        periodStartDate,
        periodEndDate,
        summary,
        issuesAndRisks, // Array of issues
        // attachments // Handle file uploads separately if needed
    } = req.body;

    // 1. Validate Input
    if (!title || !type || !projectId || !summary) {
        return res.status(400).json({ success: false, message: 'Missing required fields: title, type, project, summary' });
        // return next(new ErrorResponse('Missing required fields', 400));
    }

    // 2. Check if Project Exists
    const project = await Project.findById(projectId);
    if (!project) {
        return res.status(404).json({ success: false, message: `Project not found with id ${projectId}` });
        // return next(new ErrorResponse(`Project not found`, 404));
    }

    // 3. *** Generate Report Content / Key Metrics (Crucial Step) ***
    // This logic depends heavily on the 'type' of report.
    let keyMetrics = {};
    let calculatedSummary = summary; // Start with user provided summary

    // Example: Logic for 'progress' or 'monthly_progress' report type
    if (type === 'progress' || type === 'monthly_progress' || type === 'weekly_progress') {
        // Define the date range for querying tasks
        let dateFilter = {};
        if (periodStartDate && periodEndDate) {
            dateFilter = {
                createdAt: { $gte: new Date(periodStartDate), $lte: new Date(periodEndDate) }
                // OR filter based on task start/end dates within the period, depending on logic
            };
        } else {
           // If no period defined, maybe report on *current* status?
           // Or default to last month/week? Needs clarification. Let's assume current status for now.
        }

        // Fetch tasks associated with the project (potentially filtered by date)
        const tasks = await Task.find({ project: projectId, ...dateFilter }); // Adjust dateFilter as needed
        console.log('Tasks fetched:', tasks); // Debugging
        const totalTasks = tasks.length;
        const tasksCompleted = tasks.filter(t => t.status === 'completed').length;
        const tasksInProgress = tasks.filter(t => t.status === 'in_progress').length;
        const tasksPending = tasks.filter(t => t.status === 'not_started' || t.status === 'on_hold').length;

        // Basic progress calculation (can be more sophisticated)
        const overallProgressPercentage = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

        keyMetrics = {
            tasksCompleted,
            tasksInProgress,
            tasksPending,
            overallProgressPercentage,
            // Add budget info if project model has it readily available or fetch financials
        };

        // You could enhance the summary automatically:
        // calculatedSummary += `\n\nProgress: ${overallProgressPercentage}% (${tasksCompleted}/${totalTasks} tasks completed).`;
    }
    // Add similar `if` blocks for other report types ('material_usage', 'schedule_adherence', etc.)
    // fetching relevant data from Material, Schedule models respectively.

    // 4. Create the Report Document
    const reportData = {
        title,
        type,
        project: projectId,
        generatedBy: req.user.id, // Assumes 'protect' middleware adds user to req
        periodStartDate,
        periodEndDate,
        summary: calculatedSummary,
        keyMetrics,
        issuesAndRisks: issuesAndRisks || [], // Ensure it's an array
        // attachments: processedAttachments // If handling uploads
    };

    const report = await Report.create(reportData);

    res.status(201).json({
        success: true,
        data: report
    });
});

// @desc    Get reports (filtered and paginated)
// @route   GET /api/reports
// @access  Private (All authenticated users, permissions checked)
exports.getReports = catchAsync(async (req, res, next) => {
    const { projectId, type, userId, startDate, endDate, page = 1, limit = 10, sortBy = '-generatedAt' } = req.query;

    let queryFilter = {};

    // --- Authorization Filter ---
    // Admins/Committees can see all? Or filter based on project association?
    // Contractors/Consultants/PMs should likely only see reports for projects they are assigned to.
    const userRole = req.user.role;
    const currentUserId = req.user.id;

    if (userRole !== 'admin' && userRole !== 'committee') { // Non-admins/committees
        // Find projects associated with the user
        const userProjects = await Project.find({
            $or: [
                { contractor: currentUserId },
                { consultant: currentUserId },
                // If PMs are stored differently, add that condition
                // If tasks have assignedTo, might need more complex lookup
            ]
        }).select('_id'); // Get only project IDs

        const projectIds = userProjects.map(p => p._id);

        // Filter reports to only include those related to the user's projects
        queryFilter.project = { $in: projectIds };
    }

    // --- Apply Request Filters ---
    if (projectId) {
        // If a specific project is requested, ensure the user has access to it (if not admin/committee)
        if (userRole !== 'admin' && userRole !== 'committee') {
             const hasAccess = await Project.exists({ _id: projectId, $or: [{ contractor: currentUserId }, { consultant: currentUserId }] });
             if (!hasAccess) {
                 return res.status(403).json({ success: false, message: 'Forbidden: You do not have access to reports for this project.' });
             }
        }
        queryFilter.project = projectId;
    }
    if (type) {
        queryFilter.type = type;
    }
    if (userId) { // Filter by who generated the report
        queryFilter.generatedBy = userId;
    }
    if (startDate && endDate) { // Filter by generation date range
        queryFilter.generatedAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (startDate) {
        queryFilter.generatedAt = { $gte: new Date(startDate) };
    } else if (endDate) {
        queryFilter.generatedAt = { $lte: new Date(endDate) };
    }

    // --- Execute Query with Pagination ---
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const totalReports = await Report.countDocuments(queryFilter);
    const reports = await Report.find(queryFilter)
        .populate('generatedBy', 'firstName lastName role') // Populate user info
        .populate('project', 'projectName') // Populate project name
        .sort(sortBy)
        .skip(skip)
        .limit(limitNum);

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

// @desc    Get single report by ID
// @route   GET /api/reports/:id
// @access  Private (Check permissions)
// exports.getReportById = catchAsync(async (req, res, next) => {
//     const report = await Report.findById(req.params.id)
//         .populate('generatedBy', 'firstName lastName email role') // More user details
//         .populate({
//              path: 'project',
//              select: 'projectName projectLocation contractor consultant status' // More project details
//              // Optionally populate contractor/consultant names within the project
//              // populate: [{ path: 'contractor', select: 'firstName lastName' }, { path: 'consultant', select: 'firstName lastName' }]
//         });

//     if (!report) {
//         return res.status(404).json({ success: false, message: `Report not found with id ${req.params.id}` });
//         // return next(new ErrorResponse(`Report not found`, 404));
//     }

//     // --- Authorization Check ---
//     const userRole = req.user.role;
//     const currentUserId = req.user.id;
//     const projectDetails = await Project.findById(report.project._id).select('contractor consultant'); // Fetch project assignments

//     const isCreator = report.generatedBy._id.toString() === currentUserId.toString();
//     const isAdminOrCommittee = userRole === 'admin' || userRole === 'committee';
//     const isAssignedToProject = projectDetails && (
//         projectDetails.contractor?.toString() === currentUserId.toString() ||
//         projectDetails.consultant?.toString() === currentUserId.toString()
//         // Add checks for PM if relevant
//     );

//     if (!isAdminOrCommittee && !isCreator && !isAssignedToProject) {
//          return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to view this report.' });
//          // return next(new ErrorResponse('Not authorized to view this report', 403));
//     }

//     res.status(200).json({
//         success: true,
//         data: report
//     });
// });
exports.getReportById = catchAsync(async (req, res, next) => {
    // Debug: Log the user information from the request
    console.log("req.user:", req.user);
  
    const report = await Report.findById(req.params.id)
      .populate("generatedBy", "firstName lastName email role")
      .populate({
        path: "project",
        select: "projectName projectLocation contractor consultant status",
      });
  
    if (!report) {
      return res.status(404).json({
        success: false,
        message: `Report not found with id ${req.params.id}`,
      });
    }
  
    // --- Authorization Check ---
    const userRole = req.user.role;
    const currentUserId = req.user.id;
  
    // Debug: Log role and user ID details
    console.log("User role:", userRole);
    console.log("Current User ID:", currentUserId);
  
    // Normalize the role for a case-insensitive check
    const isAdminOrCommittee =
      userRole && (userRole.toLowerCase() === "admin" || userRole.toLowerCase() === "committee");
  
    // Retrieve project details to check for assignment
    const projectDetails = await Project.findById(report.project._id).select("contractor consultant");
  
    const isCreator = report.generatedBy._id.toString() === currentUserId.toString();
    const isAssignedToProject =
      projectDetails &&
      (projectDetails.contractor?.toString() === currentUserId.toString() ||
        projectDetails.consultant?.toString() === currentUserId.toString());
  
    // Debug: Log the outcome of the authorization checks
    console.log("isAdminOrCommittee:", isAdminOrCommittee);
    console.log("isCreator:", isCreator);
    console.log("isAssignedToProject:", isAssignedToProject);
  
    if (!isAdminOrCommittee && !isCreator && !isAssignedToProject) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have permission to view this report.",
      });
    }
  
    res.status(200).json({
      success: true,
      data: report,
    });
  });
  
// @desc    Delete a report (Optional)
// @route   DELETE /api/reports/:id
// @access  Private (Admin, possibly Creator)
// exports.deleteReport = catchAsync(async (req, res, next) => {
//     const report = await Report.findById(req.params.id);

//     if (!report) {
//         return res.status(404).json({ success: false, message: `Report not found` });
//         // return next(new ErrorResponse(`Report not found`, 404));
//     }

//     // Authorization check: Only admin or the person who generated it can delete?
//     if (req.user.role !== 'admin' && report.generatedBy.toString() !== req.user.id.toString()) {
//          return res.status(403).json({ success: false, message: 'Not authorized to delete this report' });
//         // return next(new ErrorResponse('Not authorized to delete this report', 403));
//     }

//     await report.remove(); // Or report.deleteOne()

//     res.status(200).json({
//         success: true,
//         message: 'Report deleted successfully',
//         data: { deletedId: req.params.id }
//     });
// });

// @desc    Update a report (Admin Only)
// @route   PUT /api/reports/:id
// @access  Private (Admin)
exports.updateReport = catchAsync(async (req, res, next) => {
    const reportId = req.params.id;
    const updatePayload = req.body;

    // 1. Authorization: Check if the user is an Admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Forbidden: Only administrators can update reports.'
        });
        // return next(new ErrorResponse('Not authorized to update this report', 403));
    }

    // 2. Define fields admins are allowed to update
    //    Admins might update status, feedback, or even core content if necessary.
    const allowedAdminUpdates = [
        'title',
        'summary',
        'issuesAndRisks',
        'status', // Key field for admin workflow (e.g., approved, rejected)
        'feedback', // Field for admin feedback added to the model is assumed
        'periodStartDate',
        'periodEndDate',
        // Note: Exclude fields like 'generatedBy', 'project', 'generatedAt', 'keyMetrics' (unless recalculation logic exists)
    ];

    const updatesToApply = {};
    let hasValidUpdate = false;

    allowedAdminUpdates.forEach(field => {
        if (updatePayload.hasOwnProperty(field)) {
             // You might add specific validation here if needed (e.g., check array format for issuesAndRisks)
            updatesToApply[field] = updatePayload[field];
            hasValidUpdate = true;
        }
    });

    // 3. Check if any valid fields were provided for update
    if (!hasValidUpdate) {
        return res.status(400).json({
            success: false,
            message: 'Bad Request: No valid fields provided for update.'
        });
    }

    // 4. Find the report by ID and update it
    //    Using findByIdAndUpdate ensures atomicity and runs schema validators.
    const updatedReport = await Report.findByIdAndUpdate(
        reportId,
        updatesToApply,
        {
            new: true,           // Return the modified document rather than the original
            runValidators: true, // Ensure the updates adhere to the schema (e.g., status enum)
            context: 'query'     // Recommended for certain validator types
        }
    )
    .populate('generatedBy', 'firstName lastName role') // Re-populate necessary fields
    .populate('project', 'projectName projectLocation');

    // 5. Handle case where the report wasn't found
    if (!updatedReport) {
        return res.status(404).json({
            success: false,
            message: `Report not found with id ${reportId}`
        });
        // return next(new ErrorResponse(`Report not found with id ${reportId}`, 404));
    }

    // 6. Send successful response
    res.status(200).json({
        success: true,
        message: 'Report updated successfully by admin.',
        data: updatedReport
    });
});


// @desc    Delete a report (Consider Admin or Creator)
// @route   DELETE /api/reports/:id
// @access  Private (Admin, potentially Creator)
exports.deleteReport = catchAsync(async (req, res, next) => {
    const report = await Report.findById(req.params.id);

    if (!report) {
        return res.status(404).json({ success: false, message: `Report not found with id ${req.params.id}` });
        // return next(new ErrorResponse(`Report not found`, 404));
    }

    // Authorization check: Allow Admin OR the original creator to delete
    const isAdmin = req.user.role === 'admin';
    // Ensure generatedBy exists before checking
    const isCreator = report.generatedBy?._id?.toString() === req.user.id.toString();

    if (!isAdmin && !isCreator) {
         return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to delete this report.' });
        // return next(new ErrorResponse('Not authorized to delete this report', 403));
    }

    // Perform the delete operation
    await Report.deleteOne({ _id: req.params.id }); // Use deleteOne or findByIdAndDelete

    res.status(200).json({
        success: true,
        message: 'Report deleted successfully',
        data: { deletedId: req.params.id } // Return the ID of the deleted report
    });
});