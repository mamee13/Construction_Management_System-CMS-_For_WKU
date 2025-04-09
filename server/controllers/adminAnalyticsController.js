

// server/controllers/adminAnalyticsController.js
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const catchAsync = require('../utils/CatchAsync');

// Helper function to get date range boundaries
const getDateRangeFilter = (dateRange) => {
    const now = new Date();
    let startDate;

    switch (dateRange) {
        case 'week':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            break;
        case 'quarter':
            startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            break;
        case 'year':
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            break;
        case 'all':
        default:
            return {}; // No date filter for 'all' or unknown values
    }
    // *** IMPORTANT: Adjust 'createdAt' if your date field has a different name ***
    return { createdAt: { $gte: startDate } };
};


exports.getDashboardStats = catchAsync(async (req, res, next) => {
    // --- Receive Filters ---
    console.log('Received query filters:', req.query); // Log received filters
    const { projectStatus, taskStatus, dateRange } = req.query;

    // --- Build Filter Objects for Queries ---
    const dateFilterCriteria = getDateRangeFilter(dateRange);

    const projectFilter = { ...dateFilterCriteria }; // Start with date filter
    if (projectStatus) {
        projectFilter.status = projectStatus; // Add status if provided
    }

    const taskFilter = { ...dateFilterCriteria }; // Start with date filter
    if (taskStatus) {
        taskFilter.status = taskStatus; // Add status if provided
    }

    // User count usually isn't filtered by project/task status in this context
    // If you need to filter users (e.g., by signup date), create a userFilter similar to above.
    const userFilter = {}; // Keep user count unfiltered unless needed

    console.log('Applying DB Filters:', { userFilter, projectFilter, taskFilter }); // Log filters being applied

    // --- 1. Get Filtered Counts ---
    // Use countDocuments instead of estimatedDocumentCount to apply filters
    const [userCount, projectCount, taskCount] = await Promise.all([
        User.countDocuments(userFilter), // Use countDocuments if users need filtering based on userFilter
        // User.estimatedDocumentCount(), // Use this if user count should ALWAYS be total users regardless of filters
        Project.countDocuments(projectFilter), // Filtered project count
        Task.countDocuments(taskFilter)       // Filtered task count
    ]);

    // --- 2. Get Filtered Projects by Status using Aggregation ---
    const projectStatusStats = await Project.aggregate([
        {
            $match: projectFilter // <--- Apply the filter criteria HERE
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                status: '$_id',
                count: 1
            }
        },
        {
            $sort: { status: 1 }
        }
    ]);

    // --- 3. Get Filtered Tasks by Status using Aggregation ---
    const taskStatusStats = await Task.aggregate([
        {
            $match: taskFilter // <--- Apply the filter criteria HERE
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                status: '$_id',
                count: 1
            }
        },
        {
            $sort: { status: 1 }
        }
    ]);

    // 4. Combine results
    const stats = {
        totalUsers: userCount, // This count might now be filtered if userFilter is used
        totalProjects: projectCount, // This count now reflects projectFilter
        totalTasks: taskCount,     // This count now reflects taskFilter
        projectsByStatus: projectStatusStats, // This list reflects projectFilter
        tasksByStatus: taskStatusStats,     // This list reflects taskFilter
    };

    // 5. Send Response
    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    });
});