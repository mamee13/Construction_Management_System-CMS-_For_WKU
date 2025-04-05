


// const mongoose = require('mongoose'); // Import mongoose for ObjectId validation
// const Project = require('../models/Project');
// const User = require('../models/User'); // Assuming User model is in ../models/User
// const Material = require('../models/Material'); // Import related models
// const Schedule = require('../models/Schedule');
// const Task = require('../models/Task');
// const Comment = require('../models/Comment');
// const catchAsync = require('../utils/CatchAsync'); // Assuming you have this utility
// const jwt = require('jsonwebtoken');
// // const ErrorResponse = require('../utils/ErrorResponse'); // Optional

// // --- Authorization Middleware (isAdminMiddleware - Keep as is) ---
// exports.isAdminMiddleware = catchAsync(async (req, res, next) => {
//     let token;
//     if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//         token = req.headers.authorization.split(' ')[1];
//     }
//     if (!token) {
//         return res.status(401).json({ success: false, message: 'Not authorized (no token)' });
//     }
//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         const user = await User.findById(decoded.id);
//         if (!user) {
//             return res.status(401).json({ success: false, message: 'Not authorized (user not found)' });
//         }
//         if (user.role !== 'admin') {
//             return res.status(403).json({ success: false, message: 'Admin privileges required for this action' });
//         }
//         req.user = user;
//         next();
//     } catch (err) {
//         console.error("Auth Error:", err.message);
//         return res.status(401).json({ success: false, message: 'Not authorized (token failed)' });
//     }
// });

// // --- CRUD Operations ---

// // @desc    Create new project
// // @route   POST /api/projects
// // @access  Private (Admin only - Use isAdminMiddleware in router)
// exports.createProject = catchAsync(async (req, res, next) => {
//     const {
//         projectName, projectDescription, startDate, endDate, projectLocation,
//         projectBudget, contractor, consultant, projectManager, status
//     } = req.body;

//     if (!projectName || !projectDescription || !startDate || !endDate || !projectLocation || projectBudget === undefined || !contractor || !consultant || !projectManager) {
//         return res.status(400).json({ success: false, message: 'Missing required project fields' });
//     }

//     const project = await Project.create({
//         projectName, projectDescription, startDate, endDate, projectLocation,
//         projectBudget, contractor, consultant, projectManager, status
//     });

//     console.log(`Project created successfully: ${project._id}`);
//     // The post('save') hook handles adding project to users
//     res.status(201).json({
//         success: true,
//         data: project
//     });
// });

// // @desc    Get all projects
// // @route   GET /api/projects
// // @access  Public (or Private)
// exports.getProjects = catchAsync(async (req, res, next) => {
//     const projects = await Project.find()
//         // Also add isActive here if needed for list views
//         .populate('contractor', 'firstName lastName email isActive')
//         .populate('consultant', 'firstName lastName email isActive')
//         .populate('projectManager', 'firstName lastName email isActive')
//         .sort({ createdAt: -1 });

//     res.status(200).json({
//         success: true,
//         count: projects.length,
//         data: projects
//     });
// });

// // @desc    Get single project by ID (Fully Populated - UPDATED)
// // @route   GET /api/projects/:id
// // @access  Public (or Private)
// exports.getProject = catchAsync(async (req, res, next) => {
//     const projectId = req.params.id;
//     if (!mongoose.Types.ObjectId.isValid(projectId)) {
//          return res.status(400).json({ success: false, message: `Invalid project ID format: ${projectId}` });
//     }

//     const project = await Project.findById(projectId)
//         .populate('materials') // Populate fully or select fields as needed
//         .populate('schedules') // Populate fully or select fields as needed
//         .populate('tasks')     // Populate fully or select fields as needed
//         .populate({
//             path: 'comments',
//             populate: { path: 'user', select: 'firstName lastName email _id' },
//             options: { sort: { createdAt: -1 } }
//         })
//         // --- MODIFIED POPULATE CALLS TO INCLUDE isActive ---
//         .populate('contractor', 'firstName lastName email phone role _id isActive') // Added isActive
//         .populate('consultant', 'firstName lastName email phone role _id isActive') // Added isActive
//         .populate('projectManager', 'firstName lastName email phone role _id isActive'); // Added isActive
//         // --- END MODIFICATIONS ---

//     if (!project) {
//         return res.status(404).json({ success: false, message: `Project not found with id ${projectId}` });
//     }

//     // Add a log on the server to confirm isActive is present
//     console.log(`[getProject ${projectId}] Populated data being sent:`, JSON.stringify(project, null, 2));


//     res.status(200).json({
//         success: true,
//         data: project
//     });
// });

// // @desc    Update project
// // @route   PATCH /api/projects/:id (or PUT)
// // @access  Private (Admin only - Use isAdminMiddleware in router)
// // NOTE: Using findByIdAndUpdate doesn't trigger 'post(save)' hook for user association updates
// // Consider changing this to findById + save() pattern if automatic user association updates are needed on project UPDATE
// exports.updateProject = catchAsync(async (req, res, next) => {
//     const projectId = req.params.id;
//      if (!mongoose.Types.ObjectId.isValid(projectId)) {
//          return res.status(400).json({ success: false, message: `Invalid project ID format: ${projectId}` });
//     }

//     // It's better practice to use the findById + save() pattern for updates
//     // if you rely on Mongoose middleware (like your post('save') hook).
//     // Let's keep findByIdAndUpdate for now as per your original code,
//     // but be aware its limitations regarding middleware.

//     const updateData = { ...req.body };
//     // Prevent modification of arrays/managed fields via main update route
//     delete updateData.materials;
//     delete updateData.schedules;
//     delete updateData.tasks;
//     delete updateData.comments;
//     // Also protect fields like createdAt, updatedAt, _id, __v
//     delete updateData._id;
//     delete updateData.__v;
//     delete updateData.createdAt;
//     delete updateData.updatedAt;


//     const project = await Project.findByIdAndUpdate(projectId, updateData, {
//         new: true,           // Return the modified document
//         runValidators: true  // Run schema validators
//     });

//     if (!project) {
//         return res.status(404).json({ success: false, message: `Project not found with id ${projectId}` });
//     }

//     console.log(`Project updated successfully (using findByIdAndUpdate): ${project._id}`);
//     // WARNING: Your 'post("save")' hook DID NOT run here. User associations might be stale if contractor/consultant/pm changed.
//     res.status(200).json({
//         success: true,
//         data: project
//     });
// });


// // @desc    Delete project **(MANUAL CASCADE DELETE IMPLEMENTED HERE)**
// // @route   DELETE /api/projects/:id
// // @access  Private (Admin only - Use isAdminMiddleware in router)
// exports.deleteProject = catchAsync(async (req, res, next) => {
//     const projectId = req.params.id;

//     if (!mongoose.Types.ObjectId.isValid(projectId)) {
//         return res.status(400).json({ success: false, message: `Invalid project ID format: ${projectId}` });
//     }

//     console.log(`Attempting to find project for deletion: ${projectId}`);
//     // Find the project first to get its details (like user IDs)
//     const project = await Project.findById(projectId);

//     if (!project) {
//         console.log(`Project not found for deletion: ${projectId}`);
//         return res.status(404).json({ success: false, message: `Project not found with id ${projectId}` });
//     }

//     console.log(`Project found: ${projectId}. Starting manual cascade delete process.`);

//     try {
//         // --- MANUAL CASCADE DELETE ---
//         const operations = [
//             // 1. Delete related documents from other collections
//             Material.deleteMany({ project: projectId }).exec(),
//             Schedule.deleteMany({ project: projectId }).exec(),
//             Task.deleteMany({ project: projectId }).exec(),
//             Comment.deleteMany({ project: projectId }).exec(),
//         ];

//         // 2. Remove project reference from associated users
//         // Use $pull to remove the projectId from the associatedProjects array in User documents
//         if (project.contractor) {
//             operations.push(User.findByIdAndUpdate(project.contractor, { $pull: { associatedProjects: projectId } }).exec());
//         }
//         if (project.consultant) {
//             operations.push(User.findByIdAndUpdate(project.consultant, { $pull: { associatedProjects: projectId } }).exec());
//         }
//         if (project.projectManager) {
//             operations.push(User.findByIdAndUpdate(project.projectManager, { $pull: { associatedProjects: projectId } }).exec());
//         }

//         // Execute all deletion and update operations concurrently
//         console.log(`Executing ${operations.length} related delete/update operations...`);
//         const results = await Promise.all(operations);
//         console.log("Related data deletion/update results:", results.map(r => r?.deletedCount || r?.modifiedCount || r)); // Log counts

//         // --- DELETE THE PROJECT ITSELF ---
//         console.log(`Related data cleaned up. Deleting project document: ${projectId}`);
//         const deletedProjectResult = await Project.findByIdAndDelete(projectId);

//         if (!deletedProjectResult) {
//              console.error(`Failed to delete project ${projectId} after cleaning related data.`);
//               return res.status(500).json({ success: false, message: 'Project found but failed to delete after cleanup.' });
//         }


//         console.log(`Project ${projectId} and related data deleted successfully (manual cascade).`);
//         res.status(200).json({
//             success: true,
//             message: 'Project and related data deleted successfully.',
//             data: { deletedId: projectId }
//         });

//     } catch (error) {
//         console.error(`Error during manual cascade delete for project ${projectId}:`, error);
//          return res.status(500).json({ success: false, message: `Failed to delete project and related data: ${error.message}` });
//     }
// });



// // @desc    Get projects assigned to a specific consultant
// // @route   GET /api/projects/consultant/:consultantId
// // @access  Private (Logged in user, potentially check if user matches consultantId or is admin)
// exports.getProjectsByConsultantId = catchAsync(async (req, res, next) => {
//     const consultantId = req.params.consultantId;

//     if (!mongoose.Types.ObjectId.isValid(consultantId)) {
//         return res.status(400).json({ success: false, message: `Invalid consultant ID format: ${consultantId}` });
//     }

//     // Optional: Add authorization check - Ensure the logged-in user IS the consultant or an admin
//     // if (req.user.role !== 'admin' && req.user._id.toString() !== consultantId) {
//     //     return res.status(403).json({ success: false, message: 'Not authorized to view these projects' });
//     // }

//     const projects = await Project.find({ consultant: consultantId })
//         .populate('contractor', 'firstName lastName email isActive')
//         .populate('consultant', 'firstName lastName email isActive') // Still populate consultant info if needed elsewhere
//         .populate('projectManager', 'firstName lastName email isActive') // Populate PM for display
//         .sort({ createdAt: -1 }); // Sort by creation date, newest first

//     if (!projects) {
//         // find() returns empty array, not null, if nothing found. This check might not be needed.
//         return res.status(404).json({ success: false, message: `No projects found for consultant ${consultantId}` });
//     }

//     // Match the structure expected by the frontend: { data: { projects: [...] } }
//     res.status(200).json({
//         success: true,
//         count: projects.length,
//         data: { projects: projects } // Nest projects inside a 'projects' key within 'data'
//     });
// });




// exports.getMyAssignedProjects = catchAsync(async (req, res, next) => {
//     const userId = req.user.id; // Assumes 'protect' middleware adds user object with id

//     if (!userId) {
//         // Should ideally be caught by 'protect' middleware, but added as a safeguard
//         return res.status(401).json({ success: false, message: 'Not authorized (user ID not found)' });
//     }

//     // Find projects where the user is listed as contractor, consultant, or projectManager
//     const projects = await Project.find({
//         $or: [
//             { contractor: userId },
//             { consultant: userId },
//             { projectManager: userId }
//             // Add other roles here if they imply project assignment, e.g., committee members
//             // { committeeMembers: userId } // Example if you have such a field
//         ]
//     })
//     .select('_id projectName status') // Select only needed fields for lists/dropdowns
//     .sort({ projectName: 1 }); // Sort alphabetically by name

//     res.status(200).json({
//         success: true,
//         count: projects.length,
//         data: { projects: projects } // Nest projects in 'data' object for consistency
//     });
// });

// server/controllers/projectController.js
const mongoose = require('mongoose'); // Import mongoose for ObjectId validation
const Project = require('../models/Project');
const User = require('../models/User'); // Assuming User model is in ../models/User
const Material = require('../models/Material'); // Import related models
const Schedule = require('../models/Schedule');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const catchAsync = require('../utils/CatchAsync'); // Assuming you have this utility
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError'); // Assuming you use this
// Import the notification helper (Make sure the path is correct)
const { createAndEmitNotification } = require('../utils/notificationHelper');

// --- Authorization Middleware (isAdminMiddleware - Keep as is) ---
// Note: This middleware should ideally be applied in your router file (e.g., projectRoutes.js), not directly in the controller file.
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
        // Use findById(decoded.id) which likely corresponds to user._id
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Not authorized (user not found)' });
        }
        if (user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin privileges required for this action' });
        }
        req.user = user; // Attach user to request
        next();
    } catch (err) {
        console.error("Auth Error:", err.message);
        return res.status(401).json({ success: false, message: 'Not authorized (token failed)' });
    }
});

// --- CRUD Operations ---

// @desc     Create new project
// @route    POST /api/projects
// @access   Private (Admin only - Use isAdminMiddleware in router)
exports.createProject = catchAsync(async (req, res, next) => {
    const {
        projectName, projectDescription, startDate, endDate, projectLocation,
        projectBudget, contractor, consultant, projectManager, status
    } = req.body;

    // Basic validation (keep as is)
    if (!projectName || !projectDescription || !startDate || !endDate || !projectLocation || projectBudget === undefined || !contractor || !consultant || !projectManager) {
        // Use AppError for consistency if you have it setup
        return next(new AppError('Missing required project fields', 400));
        // return res.status(400).json({ success: false, message: 'Missing required project fields' });
    }

    // --- Added check: Ensure req.user exists (populated by auth middleware) ---
    if (!req.user || !req.user._id) {
        console.error('Error in createProject: req.user not found or missing _id. Ensure auth middleware runs first.');
        return next(new AppError('Authentication error: User information missing.', 500));
    }
    // --- End Added check ---

    const project = await Project.create({
        projectName, projectDescription, startDate, endDate, projectLocation,
        projectBudget, contractor, consultant, projectManager, status,
        // Optional: Explicitly set createdBy if your model has it
        // createdBy: req.user._id
    });

    console.log(`Project created successfully: ${project._id}`);

    // <<<--- Notification Logic START --->>>
    const io = req.app.get('socketio'); // Get the io instance from app settings

    if (io) {
        const creatorId = req.user._id.toString(); // ID of the admin creating the project

        // Gather potential recipients (ensure they are valid ObjectIDs if assigned)
        const potentialRecipients = [
            project.contractor,
            project.consultant,
            project.projectManager
        ].filter(id => id && mongoose.Types.ObjectId.isValid(id)); // Filter out null/undefined/invalid IDs

        // Get unique recipient IDs, excluding the creator
        const uniqueRecipientIds = [...new Set(
            potentialRecipients
                .map(id => id.toString()) // Convert to string for comparison and Set uniqueness
                .filter(idStr => idStr !== creatorId) // Exclude the creator
        )];

        // Send notification to each involved user (excluding the creator)
        uniqueRecipientIds.forEach(userId => {
            createAndEmitNotification(io, userId, {
                senderUser: creatorId, // The admin/user who created the project
                type: 'USER_ADDED_TO_PROJECT',
                message: `You have been assigned to the new project: ${project.projectName}`,
                link: `/projects/${project._id}`, // Example frontend link structure
                projectId: project._id
            });
        });

        // Optional: Notify *other* admins (if needed)
        // const adminsToNotify = await User.find({ role: 'admin', _id: { $ne: creatorId } }).select('_id');
        // adminsToNotify.forEach(admin => {
        //    createAndEmitNotification(io, admin._id.toString(), { ... notification data ... type: 'NEW_PROJECT_CREATED' });
        // });

    } else {
        // Log a warning if io instance isn't found (might indicate setup issue)
        console.warn('Socket.IO instance (io) not found in app settings during project creation. Notifications will not be sent.');
    }
    // <<<--- Notification Logic END --->>>

    // Keep the original success response
    res.status(201).json({
        success: true,
        data: project
    });
});

// --- Keep other controller functions (getProjects, getProject, updateProject, deleteProject, etc.) AS THEY ARE ---
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

exports.getProject = catchAsync(async (req, res, next) => {
    const projectId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        // Use AppError
         return next(new AppError(`Invalid project ID format: ${projectId}`, 400));
        // return res.status(400).json({ success: false, message: `Invalid project ID format: ${projectId}` });
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
        // Use AppError
        return next(new AppError(`Project not found with id ${projectId}`, 404));
        // return res.status(404).json({ success: false, message: `Project not found with id ${projectId}` });
    }

    // Add a log on the server to confirm isActive is present
    console.log(`[getProject ${projectId}] Populated data being sent:`, JSON.stringify(project, null, 2));


    res.status(200).json({
        success: true,
        data: project
    });
});

exports.updateProject = catchAsync(async (req, res, next) => {
    const projectId = req.params.id;
     if (!mongoose.Types.ObjectId.isValid(projectId)) {
         // Use AppError
         return next(new AppError(`Invalid project ID format: ${projectId}`, 400));
        // return res.status(400).json({ success: false, message: `Invalid project ID format: ${projectId}` });
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
        // Use AppError
        return next(new AppError(`Project not found with id ${projectId}`, 404));
        // return res.status(404).json({ success: false, message: `Project not found with id ${projectId}` });
    }

    console.log(`Project updated successfully (using findByIdAndUpdate): ${project._id}`);
    // WARNING: Your 'post("save")' hook DID NOT run here. User associations might be stale if contractor/consultant/pm changed.
    res.status(200).json({
        success: true,
        data: project
    });
});

exports.deleteProject = catchAsync(async (req, res, next) => {
    const projectId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        // Use AppError
        return next(new AppError(`Invalid project ID format: ${projectId}`, 400));
        // return res.status(400).json({ success: false, message: `Invalid project ID format: ${projectId}` });
    }

    console.log(`Attempting to find project for deletion: ${projectId}`);
    // Find the project first to get its details (like user IDs)
    const project = await Project.findById(projectId);

    if (!project) {
        console.log(`Project not found for deletion: ${projectId}`);
        // Use AppError
        return next(new AppError(`Project not found with id ${projectId}`, 404));
        // return res.status(404).json({ success: false, message: `Project not found with id ${projectId}` });
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
            // Use AppError
           return next(new AppError('Project found but failed to delete after cleanup.', 500));
            // return res.status(500).json({ success: false, message: 'Project found but failed to delete after cleanup.' });
        }


        console.log(`Project ${projectId} and related data deleted successfully (manual cascade).`);
        res.status(200).json({
            success: true,
            message: 'Project and related data deleted successfully.',
            data: { deletedId: projectId }
        });

    } catch (error) {
        console.error(`Error during manual cascade delete for project ${projectId}:`, error);
         // Use AppError
        return next(new AppError(`Failed to delete project and related data: ${error.message}`, 500));
        //  return res.status(500).json({ success: false, message: `Failed to delete project and related data: ${error.message}` });
    }
});

exports.getProjectsByConsultantId = catchAsync(async (req, res, next) => {
    const consultantId = req.params.consultantId;

    if (!mongoose.Types.ObjectId.isValid(consultantId)) {
        // Use AppError
        return next(new AppError(`Invalid consultant ID format: ${consultantId}`, 400));
        // return res.status(400).json({ success: false, message: `Invalid consultant ID format: ${consultantId}` });
    }

    // Optional: Add authorization check - Ensure the logged-in user IS the consultant or an admin
    // if (req.user.role !== 'admin' && req.user._id.toString() !== consultantId) {
    //     // Use AppError
    //    return next(new AppError('Not authorized to view these projects', 403));
    //   // return res.status(403).json({ success: false, message: 'Not authorized to view these projects' });
    // }

    const projects = await Project.find({ consultant: consultantId })
        .populate('contractor', 'firstName lastName email isActive')
        .populate('consultant', 'firstName lastName email isActive') // Still populate consultant info if needed elsewhere
        .populate('projectManager', 'firstName lastName email isActive') // Populate PM for display
        .sort({ createdAt: -1 }); // Sort by creation date, newest first

    if (!projects) {
        // find() returns empty array, not null, if nothing found. This check might not be needed.
        // Use AppError
        return next(new AppError(`No projects found for consultant ${consultantId}`, 404));
        // return res.status(404).json({ success: false, message: `No projects found for consultant ${consultantId}` });
    }

    // Match the structure expected by the frontend: { data: { projects: [...] } }
    res.status(200).json({
        success: true,
        count: projects.length,
        data: { projects: projects } // Nest projects inside a 'projects' key within 'data'
    });
});

exports.getMyAssignedProjects = catchAsync(async (req, res, next) => {
    // Ensure auth middleware has run and populated req.user.id (or req.user._id)
    // Use req.user._id if that's what your auth middleware provides
    const userId = req.user._id;

    if (!userId) {
        // Should ideally be caught by 'protect' middleware, but added as a safeguard
        // Use AppError
        return next(new AppError('Not authorized (user ID not found)', 401));
        // return res.status(401).json({ success: false, message: 'Not authorized (user ID not found)' });
    }

    // Find projects where the user is listed as contractor, consultant, or projectManager
    const projects = await Project.find({
        $or: [
            { contractor: userId },
            { consultant: userId },
            { projectManager: userId }
            // Add other roles here if they imply project assignment, e.g., committee members
            // { committeeMembers: userId } // Example if you have such a field
        ]
    })
    .select('_id projectName status') // Select only needed fields for lists/dropdowns
    .sort({ projectName: 1 }); // Sort alphabetically by name

    res.status(200).json({
        success: true,
        count: projects.length,
        data: { projects: projects } // Nest projects in 'data' object for consistency
    });
});