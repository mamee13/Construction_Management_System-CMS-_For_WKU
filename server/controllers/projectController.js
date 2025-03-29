


const mongoose = require('mongoose'); // Import mongoose for ObjectId validation
const Project = require('../models/Project');
const User = require('../models/User'); // Assuming User model is in ../models/User
const Material = require('../models/Material'); // Import related models
const Schedule = require('../models/Schedule');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const catchAsync = require('../utils/CatchAsync'); // Assuming you have this utility
const jwt = require('jsonwebtoken');
// const ErrorResponse = require('../utils/ErrorResponse'); // Optional

// --- Authorization Middleware (isAdminMiddleware - Keep as is) ---
exports.isAdminMiddleware = catchAsync(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized (no token)' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Not authorized (user not found)' });
        }
        if (user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin privileges required for this action' });
        }
        req.user = user;
        next();
    } catch (err) {
        console.error("Auth Error:", err.message);
        return res.status(401).json({ success: false, message: 'Not authorized (token failed)' });
    }
});

// --- CRUD Operations ---

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Admin only - Use isAdminMiddleware in router)
exports.createProject = catchAsync(async (req, res, next) => {
    const {
        projectName, projectDescription, startDate, endDate, projectLocation,
        projectBudget, contractor, consultant, projectManager, status
    } = req.body;

    if (!projectName || !projectDescription || !startDate || !endDate || !projectLocation || projectBudget === undefined || !contractor || !consultant || !projectManager) {
        return res.status(400).json({ success: false, message: 'Missing required project fields' });
    }

    const project = await Project.create({
        projectName, projectDescription, startDate, endDate, projectLocation,
        projectBudget, contractor, consultant, projectManager, status
    });

    console.log(`Project created successfully: ${project._id}`);
    // The post('save') hook handles adding project to users
    res.status(201).json({
        success: true,
        data: project
    });
});

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public (or Private)
exports.getProjects = catchAsync(async (req, res, next) => {
    const projects = await Project.find()
        // Also add isActive here if needed for list views
        .populate('contractor', 'firstName lastName email isActive')
        .populate('consultant', 'firstName lastName email isActive')
        .populate('projectManager', 'firstName lastName email isActive')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: projects.length,
        data: projects
    });
});

// @desc    Get single project by ID (Fully Populated - UPDATED)
// @route   GET /api/projects/:id
// @access  Public (or Private)
exports.getProject = catchAsync(async (req, res, next) => {
    const projectId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
         return res.status(400).json({ success: false, message: `Invalid project ID format: ${projectId}` });
    }

    const project = await Project.findById(projectId)
        .populate('materials') // Populate fully or select fields as needed
        .populate('schedules') // Populate fully or select fields as needed
        .populate('tasks')     // Populate fully or select fields as needed
        .populate({
            path: 'comments',
            populate: { path: 'user', select: 'firstName lastName email _id' },
            options: { sort: { createdAt: -1 } }
        })
        // --- MODIFIED POPULATE CALLS TO INCLUDE isActive ---
        .populate('contractor', 'firstName lastName email phone role _id isActive') // Added isActive
        .populate('consultant', 'firstName lastName email phone role _id isActive') // Added isActive
        .populate('projectManager', 'firstName lastName email phone role _id isActive'); // Added isActive
        // --- END MODIFICATIONS ---

    if (!project) {
        return res.status(404).json({ success: false, message: `Project not found with id ${projectId}` });
    }

    // Add a log on the server to confirm isActive is present
    console.log(`[getProject ${projectId}] Populated data being sent:`, JSON.stringify(project, null, 2));


    res.status(200).json({
        success: true,
        data: project
    });
});

// @desc    Update project
// @route   PATCH /api/projects/:id (or PUT)
// @access  Private (Admin only - Use isAdminMiddleware in router)
// NOTE: Using findByIdAndUpdate doesn't trigger 'post(save)' hook for user association updates
// Consider changing this to findById + save() pattern if automatic user association updates are needed on project UPDATE
exports.updateProject = catchAsync(async (req, res, next) => {
    const projectId = req.params.id;
     if (!mongoose.Types.ObjectId.isValid(projectId)) {
         return res.status(400).json({ success: false, message: `Invalid project ID format: ${projectId}` });
    }

    // It's better practice to use the findById + save() pattern for updates
    // if you rely on Mongoose middleware (like your post('save') hook).
    // Let's keep findByIdAndUpdate for now as per your original code,
    // but be aware its limitations regarding middleware.

    const updateData = { ...req.body };
    // Prevent modification of arrays/managed fields via main update route
    delete updateData.materials;
    delete updateData.schedules;
    delete updateData.tasks;
    delete updateData.comments;
    // Also protect fields like createdAt, updatedAt, _id, __v
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;
    delete updateData.updatedAt;


    const project = await Project.findByIdAndUpdate(projectId, updateData, {
        new: true,           // Return the modified document
        runValidators: true  // Run schema validators
    });

    if (!project) {
        return res.status(404).json({ success: false, message: `Project not found with id ${projectId}` });
    }

    console.log(`Project updated successfully (using findByIdAndUpdate): ${project._id}`);
    // WARNING: Your 'post("save")' hook DID NOT run here. User associations might be stale if contractor/consultant/pm changed.
    res.status(200).json({
        success: true,
        data: project
    });
});


// @desc    Delete project **(MANUAL CASCADE DELETE IMPLEMENTED HERE)**
// @route   DELETE /api/projects/:id
// @access  Private (Admin only - Use isAdminMiddleware in router)
exports.deleteProject = catchAsync(async (req, res, next) => {
    const projectId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ success: false, message: `Invalid project ID format: ${projectId}` });
    }

    console.log(`Attempting to find project for deletion: ${projectId}`);
    // Find the project first to get its details (like user IDs)
    const project = await Project.findById(projectId);

    if (!project) {
        console.log(`Project not found for deletion: ${projectId}`);
        return res.status(404).json({ success: false, message: `Project not found with id ${projectId}` });
    }

    console.log(`Project found: ${projectId}. Starting manual cascade delete process.`);

    try {
        // --- MANUAL CASCADE DELETE ---
        const operations = [
            // 1. Delete related documents from other collections
            Material.deleteMany({ project: projectId }).exec(),
            Schedule.deleteMany({ project: projectId }).exec(),
            Task.deleteMany({ project: projectId }).exec(),
            Comment.deleteMany({ project: projectId }).exec(),
        ];

        // 2. Remove project reference from associated users
        // Use $pull to remove the projectId from the associatedProjects array in User documents
        if (project.contractor) {
            operations.push(User.findByIdAndUpdate(project.contractor, { $pull: { associatedProjects: projectId } }).exec());
        }
        if (project.consultant) {
            operations.push(User.findByIdAndUpdate(project.consultant, { $pull: { associatedProjects: projectId } }).exec());
        }
        if (project.projectManager) {
            operations.push(User.findByIdAndUpdate(project.projectManager, { $pull: { associatedProjects: projectId } }).exec());
        }

        // Execute all deletion and update operations concurrently
        console.log(`Executing ${operations.length} related delete/update operations...`);
        const results = await Promise.all(operations);
        console.log("Related data deletion/update results:", results.map(r => r?.deletedCount || r?.modifiedCount || r)); // Log counts

        // --- DELETE THE PROJECT ITSELF ---
        console.log(`Related data cleaned up. Deleting project document: ${projectId}`);
        const deletedProjectResult = await Project.findByIdAndDelete(projectId);

        if (!deletedProjectResult) {
             console.error(`Failed to delete project ${projectId} after cleaning related data.`);
              return res.status(500).json({ success: false, message: 'Project found but failed to delete after cleanup.' });
        }


        console.log(`Project ${projectId} and related data deleted successfully (manual cascade).`);
        res.status(200).json({
            success: true,
            message: 'Project and related data deleted successfully.',
            data: { deletedId: projectId }
        });

    } catch (error) {
        console.error(`Error during manual cascade delete for project ${projectId}:`, error);
         return res.status(500).json({ success: false, message: `Failed to delete project and related data: ${error.message}` });
    }
});