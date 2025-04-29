const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Material = require('../models/Material');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const ErrorResponse = require('../utils/AppError');

/**
 * @desc    Get aggregated statistics for the Admin Dashboard
 * @route   GET /api/v1/admin/dashboard/stats
 * @access  Private (Admin only)
 */
exports.getAdminDashboardStats = asyncHandler(async (req, res, next) => {
    // 1. Authorization Check
    if (req.user.role !== 'admin') {
        return next(new ErrorResponse('Not authorized to access this route', 403));
    }

    // 2. Define Aggregation Queries
    const userStatsPromise = User.aggregate([
        {
            $group: {
                _id: '$role',
                count: { $sum: 1 }
            }
        },
        {
            $group: {
                _id: null,
                totalUsers: { $sum: '$count' },
                roles: { $push: { role: '$_id', count: '$count' } }
            }
        }
    ]);

    const projectStatsPromise = Project.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalBudget: { $sum: '$projectBudget' }
            }
        },
        {
            $group: {
                _id: null,
                totalProjects: { $sum: '$count' },
                overallBudgetSum: { $sum: '$totalBudget' },
                statuses: { $push: { status: '$_id', count: '$count' } }
            }
        }
    ]);

    const taskStatsPromise = Task.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        },
        {
            $group: {
                _id: null,
                totalTasks: { $sum: '$count' },
                statuses: { $push: { status: '$_id', count: '$count' } }
            }
        }
    ]);

    const materialStatsPromise = Material.aggregate([
        {
            $group: {
                _id: null,
                totalMaterialEntries: { $sum: 1 },
                totalMaterialCostSum: { $sum: '$totalCost' }
            }
        }
    ]);

    // 3. Execute Queries Concurrently
    const [
        userStatsResult,
        projectStatsResult,
        taskStatsResult,
        materialStatsResult
    ] = await Promise.all([
        userStatsPromise,
        projectStatsPromise,
        taskStatsPromise,
        materialStatsPromise
    ]);

    // 4. Format Results Helper Functions
    const formatAggregationResult = (resultArray, defaultValue = {}) => {
        return resultArray.length > 0 ? resultArray[0] : defaultValue;
    };

    const formatCountsByKey = (itemsArray, keyField, valueField) => {
        const counts = {};
        if (itemsArray && Array.isArray(itemsArray)) {
            itemsArray.forEach(item => {
                counts[item[keyField]] = item[valueField];
            });
        }
        return counts;
    };

    // 5. Process Results
    const userStats = formatAggregationResult(userStatsResult, { totalUsers: 0, roles: [] });
    const projectStats = formatAggregationResult(projectStatsResult, { totalProjects: 0, overallBudgetSum: 0, statuses: [] });
    const taskStats = formatAggregationResult(taskStatsResult, { totalTasks: 0, statuses: [] });
    const materialStats = formatAggregationResult(materialStatsResult, { totalMaterialEntries: 0, totalMaterialCostSum: 0 });

    // 6. Construct Dashboard Data
    const dashboardData = {
        users: {
            total: userStats.totalUsers,
            byRole: formatCountsByKey(userStats.roles, 'role', 'count')
        },
        projects: {
            total: projectStats.totalProjects,
            totalBudget: projectStats.overallBudgetSum,
            byStatus: formatCountsByKey(projectStats.statuses, 'status', 'count')
        },
        tasks: {
            total: taskStats.totalTasks,
            byStatus: formatCountsByKey(taskStats.statuses, 'status', 'count')
        },
        materials: {
            totalEntries: materialStats.totalMaterialEntries,
            totalCost: materialStats.totalMaterialCostSum
        }
    };

    // 7. Send Response
    res.status(200).json({
        success: true,
        data: dashboardData
    });
});

module.exports = exports;